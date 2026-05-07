# 02 / 5 — L-PRICING-REVAMP-2

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Jatkoa L-PRICING-REVAMP-1:lle, joka skippasi paywall-wirings:n + Settings tier UI:n + Customer Portal CTA:n koska diff olisi kasvanut yli reviewin. Nyt ne kytketään.

---

## 1. Lähtötilanne

PRICING-REVAMP-1 (2026-05-07, shipped) toi 3-tier-mallin:

- **Free** — 1 demo-oppitunti, 1 kirjoitus, 1 luettu, 1 harjoituskoe lifetime. `free_usage`-taulu seuraa kvootteja.
- **Treeni** — €9/kk · €19/8vk · ∞ kirjoitus + luettu + harjoituskokeet AI-arvioinnilla. EI rakenteellista kurssia eikä adaptiivisuutta.
- **Mestari** — €19/kk · €39/8vk · kaikki Treenin + 8 kurssia + adaptiivinen vaikeus + yo-valmius-mittari + lukusuunnitelma + virhetracking + adaptiiviset kokesimulaatiot.

Mitä tehtiin:
- `routes/stripe.js` toiminnallinen lazy SDK:lla
- `middleware/auth.js`: `getUserTier`, `hasFeature`, `getFreeUsage`, `incrementFreeUsage`, `checkFeatureAccess`, `FEATURES`, `FREE_LIMITS`
- `pricing.html` rewrite + index.html pricing-osio + JSON-LD
- DB-TABLE-FIX-1 (2026-05-07) korjasi taulun nimet `user_profile`:ksi

Mitä **EI** tehty (tämän loopin scope):
- `incrementFreeUsage` ei ole kytketty mihinkään → Free-käyttäjillä ei ole kvootti-gateja todellisuudessa
- `checkFeatureAccess` ei ole kytketty mihinkään → Treeni-käyttäjä voi käyttää Mestarin featureita
- Settings-screenissä ei ole "Tilaus"-osiota tier-tiedoilla
- Customer Portal -CTA ei ole missään
- Paywall-modaalit (Free→Treeni, Free→Mestari, Treeni→Mestari) eivät renderöidy oikealla copylla

---

## 2. Scope (mitä TEHDÄÄN)

### Worker A — Backend gating (Sonnet)

Tiedostot: `routes/writing.js`, `routes/exercises.js`, `routes/exam.js` (jos olemassa)

1. Jokainen reitti joka kuluttaa AI-budjettia → `checkFeatureAccess(req.user, 'writing'|'reading'|'exam'|'lesson')`-tarkistus alkuun
2. Free-tierillä: tarkista `getFreeUsage` ennen toimintaa, hylkää 403:lla `{ error: 'quota_exceeded', tier_required: 'treeni'|'mestari' }` jos kvootti ylittyy
3. Onnistuneen toiminnan jälkeen: `incrementFreeUsage(userId, kind)` jos tier on free
4. Treeni-tier: kirjoitus + luettu + koe = ∞, MUTTA mestari-spesifit reitit (esim adaptive lesson, courseProgression, readinessMap) → 403 `tier_required: 'mestari'`
5. Mestari-tier: kaikki sallitaan

Acceptance: jokainen reitti palaa selkeällä error-koodilla joka frontend voi mapata paywall-modaaliin.

### Worker B — Frontend paywall + Settings (Sonnet)

Tiedostot: `js/screens/settings.js`, `app.html` (settings-screen + paywall-modaali), `app.js` (fetch-error-handler), `css/components/settings.css` (luo jos ei ole)

1. **Paywall-modaali:** renderöi 3 varianttia copylla:
   - **Free → Treeni:** "Olet käyttänyt ilmaisen kvoottisi. Treenillä saat ∞ kirjoitustehtäviä ja luettua + AI-arvioinnin." CTA: `/pricing.html?from=quota&tier=treeni`
   - **Free → Mestari:** "Tämä on Mestari-tason ominaisuus. Avaa koko 8-kurssin polku + adaptiivinen vaikeus." CTA: `/pricing.html?from=feature&tier=mestari`
   - **Treeni → Mestari:** "Avaa kurssit ja yo-valmius-mittari Mestarilla." CTA: `/pricing.html?from=upgrade&tier=mestari`
2. **Frontend fetch-error-handler:** jokaisessa `fetch`-kutsussa joka voi palauttaa 403 `quota_exceeded` tai `tier_required` → triggeroi oikea modaali (älä rikkoa olemassa olevia happy-path-flowja)
3. **Settings-screen "Tilaus"-osio** (uusi blokki):
   - Renderöi käyttäjän `subscription_tier` (Free / Treeni / Mestari) badge-tyyliin
   - Jos Free → "Päivitä Treeniin (€9/kk)" + "Päivitä Mestariin (€19/kk)" -napit linkkinä `/pricing.html`
   - Jos Treeni / Mestari → "Hallinnoi tilausta" -nappi joka POST:aa `/api/stripe/portal-session`-reittiin ja redirectaa Customer Portaliin
   - Näytä `subscription_expires_at` paketti-tilauksissa
4. **Free-tier kvoottimittari** dashboardilla (jos Free): pieni meter "Kirjoitus 1/1 · Luettu 1/1 · Koe 1/1 — Avaa Treeni" -tyyliin

### Worker C — Copy + a11y (Sonnet, lyhyempi scope)

Tiedostot: paywall-modaalin Finnish-copy + Settings-osion copy

1. Käytä `puheo-finnish-voice`-skilliä → kannustava, ei syyllistävä
2. Älä kirjoita "Sinulla ei ole oikeutta" → kirjoita "Tämä avautuu Treenillä"
3. Jokainen modaali ja Settings-osio: keyboard-trap kunnossa, focus-management, ESC sulkee, role/aria-labelledby asetettuna

---

## 3. Acceptance criteria

- [ ] Free-käyttäjä saa quota_exceeded-virheen 2. kirjoitustehtävän pyytäessä → modaali nousee
- [ ] Treeni-käyttäjä saa tier_required-virheen kun yrittää avata Mestari-only kurssi-flow → modaali nousee
- [ ] Mestari-käyttäjä ei saa virheitä missään
- [ ] Settings → "Tilaus"-osio näkyy + Customer Portal -nappi avaa Stripe-portaalin (test mode)
- [ ] Frontend fetch-error-handler triggeroi oikean modaalin tier-mismatchissä
- [ ] axe-core: 0 critical/serious paywall-modaaleilla
- [ ] Live-test (META_QA_LOOP Vaihe 2B): ei `[object Object]` / `undefined` paywall-modaaleissa eikä Settings-osiossa
- [ ] node --check clean

---

## 4. Pois scopesta

- Stripe-dashboard-toimet (käyttäjä päättää koska aktivoi)
- Email-paywall-promptit (myöhemmin)
- A/B-testit eri copy-versioista

---

## 5. Skill-set

- `puheo-screen-template`, `puheo-finnish-voice`
- `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`
- `design:accessibility-review`
- `webapp-testing` (verifier B)
- `supabase` (jos free_usage-kysely tarvitsee tuningia)

---

## Lopuksi
Tämä on **02 / 5** jonossa (`agent-prompts/02-queue/02_PRICING_REVAMP_2.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
