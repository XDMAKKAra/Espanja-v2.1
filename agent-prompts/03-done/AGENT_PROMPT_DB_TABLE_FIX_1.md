# L-DB-TABLE-FIX-1 — Korjaa kolme shipped-tiedostoa käyttämään olemassa olevia tauluja

> **Aja Claude Codessa erillisessä istunnossa** PRICING-loopin jälkeen. Lue `AGENT_PROMPT_STANDARDS.md` + `ROADMAP.md` ensin.

---

## 1. Konteksti — mikä on rikki

Sekä L-ONBOARDING-REDESIGN-1 että L-PRICING-REVAMP-1 jättivät shipped-koodiin **saman arkkitehtuurivirheen**: kirjoittavat olemattomalle `public.users`-taululle. Tämä projekti käyttää `public.user_profile`-taulua (PK `user_id`) käyttäjän app-datalle, ei `public.users`:ia.

**Rikkinäiset kohdat:**

```javascript
// routes/onboarding.js — RIKKI
.from("users").update(...).eq("id", userId)
.from("onboarding_waitlist").insert(...)        // tämä taulu ei ole, käytä public.waitlist

// middleware/auth.js (rivit 66-70, 113-117) — RIKKI
.from("users").select("subscription_tier, ...").eq("id", userId)

// routes/stripe.js (rivit ~180-185 ja webhook-handler) — RIKKI
.from("users").update({ subscription_tier, subscription_billing, ... }).eq("id", userId)
```

Käyttäjä tekee onboardingin tuotannossa → 500. Pricing-flow Stripe-checkoutista → webhook ei pysty päivittämään subscription-tilaa → 500. Kaikki nämä yrittävät `users`-taulua jota ei ole.

**Tila 2026-05-07: kaikki tarvittavat migraatiot ajettu MCP:llä:**
- ✓ `user_profile.target_language` + `target_level` lisätty
- ✓ `user_profile.subscription_tier`, `subscription_billing`, `subscription_status`, `subscription_expires_at`, `stripe_customer_id`, `stripe_subscription_id` lisätty
- ✓ `public.free_usage` -taulu luotu (PK user_id, RLS-policyt owner-pohjaisia)
- ✓ `public.stripe_events` -taulu luotu (PK id TEXT, RLS päällä, service-role-only)

Koodi vain pitää mapata oikealle taululle.

---

## 2. Mitä korjataan

### A. `middleware/auth.js` (rivit ~66-70, ~113-117)

Vanha:
```javascript
.from("users").select("subscription_tier, subscription_billing, subscription_status, subscription_expires_at").eq("id", userId).single();
```

Uusi:
```javascript
.from("user_profile").select("subscription_tier, subscription_billing, subscription_status, subscription_expires_at").eq("user_id", userId).single();
```

Sama korjaus kahdessa kohdassa (`requirePro`-funktiossa + `getUserTier`-funktiossa).

### B. `routes/stripe.js` — webhook-handler (rivit ~180-185 ja muut subscription-päivitykset)

Vanha:
```javascript
.from("users").update({ subscription_tier, subscription_billing, ...}).eq("id", userId);
```

Uusi:
```javascript
.from("user_profile").update({ subscription_tier, subscription_billing, ...}).eq("user_id", userId);
```

Tarkista että kaikki `routes/stripe.js`:n `users`-viittaukset (checkout.session.completed, subscription.updated, subscription.deleted, invoice.payment_failed -handlerit) korjataan. Käytä `grep -n "from(\"users\"" routes/stripe.js` löytääksesi kaikki.

### C. `routes/onboarding.js` — POST /complete

Vanha (rikki):
```javascript
.from("users").update(update).eq("id", req.user.userId)
```

Uusi:
```javascript
.from("user_profile").upsert(update, { onConflict: "user_id" })
```

Lisäksi `update`-objektin avaimet pitää mapata `user_profile`-skeemaan:

| Worker-koodi (rikki) | user_profile-sarake (oikea) | Huom |
|---|---|---|
| `target_language` | `target_language` | uusi sarake (migration ajettu) |
| `target_level` | `target_level` | uusi sarake (migration ajettu) |
| `current_level` | `current_grade` | rename |
| `target_grade` | `target_grade` | sama |
| `exam_date` | `exam_date` | sama |
| `weekly_minutes` | `weekly_goal_minutes` | rename |
| `focus_areas` (TEXT[]) | `weak_areas` (TEXT[]) | rename — käytä weak_areas-saraketta painopistealueille |
| `onboarding_complete` | `onboarding_completed` | rename (loppu-d) |

Lisäksi rivi `user_id: req.user.userId` pitää lisätä update-objektiin koska upsert tarvitsee PK:n.

### D. `routes/onboarding.js` — POST /waitlist

Vanha (rikki):
```javascript
.from("onboarding_waitlist").insert({ email, language, level })
```

Uusi (käytä olemassa olevaa `waitlist`-taulua, mappaa `language` + `level` → `product`-merkkijonoksi):
```javascript
.from("waitlist").insert({ email, product: `${language}_${level || "lyhyt"}` })
```

Esim. `product = "de_lyhyt"` saksan lyhyelle. Tämä antaa myöhemmin mahdollisuuden suodattaa per-kieli/per-taso ilman että tarvitsee uutta saraketta.

---

## 3. Validation-säännöt säilyvät

Pidä olemassa olevat sanitointisäännöt routessa (`LANGS`, `LEVELS`, `GRADES`, `FOCUS_AREAS`, email-regex). Validointi tapahtuu ENNEN tietokantakirjoitusta.

`current_level` saattaa tulla pyynnössä arvolla "I/A/B/C/M/E" — `current_grade`-sarake on `TEXT` ilman CHECK-rajoitusta, mutta validoi se silti `GRADES`-listalla ennen tallennusta.

---

## 4. Mitä EI tehdä

- ❌ Älä luo uutta `public.users`-taulua tai `onboarding_waitlist`-taulua
- ❌ Älä koske `lib/studyPlan.js`:ään
- ❌ Älä koske frontend-koodiin (onboardingV3.js, app.html screen-divsit) — front lähettää oikeat kenttänimet, vain backend mappaa
- ❌ Älä lisää uusia kolonneja — KAIKKI on jo migroitu MCP:llä
- ❌ Älä koske Stripe-checkout-flowiin tai webhook-logiikkaan muuten kuin korjaa `.from("users")` → `.from("user_profile")` -mappaus
- ❌ Älä committaa, älä deployaa — käyttäjä tekee

---

## 5. Skill-set

Pieni loop, kapea fokus. Lue:
- `puheo-finnish-voice` (virhetekstit suomeksi)
- `supabase`-skill (upsert + onConflict, RLS-policy-vaatimukset)
- `claude-api`-skillin kanssa pidätyttävä — tämä ei muuta AI-promptteja

---

## 6. Verifiointi

1. `npm test` — vitest-testit (ei regressioita)
2. End-to-end manuaalinen testi:
   - Kirjaudu testiäänellä, käy onboardingV3 läpi vaiheet 1-9
   - `POST /api/onboarding/complete` palauttaa 200 + `{ ok: true, plan: {...} }`
   - Tarkista Supabasella: `SELECT target_language, target_grade, exam_date, weekly_goal_minutes, weak_areas, onboarding_completed FROM user_profile WHERE user_id='<testi-id>'` → kentät täytetty
   - Klikkaa saksa-/ranska-waitlist-modaalia → `POST /api/onboarding/waitlist` palauttaa 200 → `SELECT * FROM waitlist WHERE product LIKE 'de_%'` näyttää rivin
3. `graphify update .` koodimuutosten jälkeen
4. `npm run lint` 0 erroria
5. SW-bumppi (vain jos sw.js:n STATIC_ASSETS muuttuu — tämä loop koskettaa vain `routes/onboarding.js`:ää joka ei ole STATIC_ASSETS:ssa, joten **ei SW-bumppia tarvita**)

---

## 7. Mitä jos PRICING-loop ehtii ennen tätä

PRICING-loop voi koskettaa `routes/onboarding.js`:ää JOS se päivittää waitlist-emaileja Mestariin liittyviksi. Tarkista että PRICING-loop ei jo korjannut ylläolevaa — jos korjasi, tämä loop on tehty, voit arkistoida briefin `docs/archive/agent-prompts/`:een ilman ajoa.

---

## 8. Guardrailit

- **ÄLÄ committaa, ÄLÄ deployaa**
- **ÄLÄ aja Supabase-migraatioita** — ne on ajettu MCP:llä jo (target_language + target_level on lisätty)
- **ÄLÄ riko olemassa olevia testikäyttäjiä** — jos `user_profile`-rivi puuttuu testikäyttäjältä, upsert luo sen, joka on toivottu käytös
- **ÄLÄ unohda RLS:ää** — onboarding-route käyttää `requireAuth`:ia, joten kirjoitus tapahtuu service-roolin tai `auth.uid()`-vastaavalla. Tarkista että upsert toimii nykyisillä RLS-policyilla `user_profile`:lle. Jos blockaa, älä avaa policy-aukkoja — käytä service-rooli-clientiä `supabase.js`:n kautta.

---

## 9. Lopputuotteen kriteeri

1. Käyttäjä tekee onboardingin tuotannossa → tallennus toimii, ei 500-virhettä
2. `user_profile`-rivi sisältää onboarding-datan + subscription-datan oikeissa sarakkeissa
3. `requirePro`/`getUserTier`/`hasFeature` lukevat `user_profile`:sta oikein → tier-gating toimii
4. Stripe-webhook (test mode, kun aktivoituu) päivittää `user_profile.subscription_*`-kenttiä oikein
5. `free_usage`-taulun upsert toimii — free-käyttäjän kvootit tallentuvat
6. `stripe_events`-taulun idempotency-tarkistus toimii — sama webhook-event ei käsittele kahdesti
7. Saksa/ranska-waitlist-rivit syntyvät `waitlist`-tauluun product-kentän muodossa "{lang}_{level}"

## 10. Verifiointi-grep ennen committia

Kun olet tehnyt korjaukset, aja:
```bash
grep -rn 'from("users")' routes/ middleware/ lib/ 2>/dev/null
```
Tuloksen pitää olla **0 osumaa** (tai vain kommentteja). Jokainen `.from("users")`-osuma koodissa on bug.
