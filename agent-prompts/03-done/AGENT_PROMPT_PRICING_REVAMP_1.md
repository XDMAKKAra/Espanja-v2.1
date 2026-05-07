# L-PRICING-REVAMP-1 — 3-tier hinnoittelu (Free / Treeni / Mestari) + cleanup

> **HUOM 2026-05-07:** L-LANG-LANDINGS-1 ei ole ajettu. Sen sijaan tämä loop hoitaa KAIKEN pricing-related siivouksen + Stripe-setupin yhdessä, koska shippautuneet loopit (L-LANDING-CONVERT-1 + L-ONBOARDING-REDESIGN-1) jättivät jälkiä:
>
> **Tier-nimien rename (Tähtäin → Mestari) + Mestarin hinta (€29→€19, €49→€39):**
> - `app.html` rivi ~614: `<a class="ob3-link"...>Avaa kaikki Tähtäimellä alkaen 29 €/kk` → `Avaa kaikki Mestarilla alkaen 19 €/kk`
> - `js/screens/onboardingV3.js:7` kommentti: `"open all with Tähtäin" links to /pricing` → `"open all with Mestari"`
> - **ÄLÄ KOSKE** `data/courses/kurssi_6/lesson_*` osumiin — siellä "lyhyellä/pitkällä tähtäimellä" on espanjan idiomin "a corto/largo plazo" suomenkielinen vastine (legitimaattia opetussisältöä)
>
> **Vanhan kesäpaketti-mallin korvaus (€29 kesäpaketti / Pro €9,99 → 3-tier):**
> - `pricing.html` kokonaan uusiksi 3-tier-mallilla (Free / Treeni / Mestari)
> - `routes/email.js:300` "Kesäpaketti 29 €" -email-template päivitys/poisto
> - `onboarding/PAYWALL.md` + `onboarding/EMAILS.md` → arkistoi `docs/archive/onboarding-old-pricing/`:een
> - `ui-ux-prompt.md` rivi 71 "Kesäpaketti (29 €)" -viittaus
>
> **Pakolliset scan-verifikaatiot ennen committia (0 osumaa):**
> ```
> grep -rn "Tähtäin\|tähtäim" --include="*.html" --include="*.js" --include="*.css" --exclude-dir=docs/archive --exclude-dir=node_modules .
> grep -rn "kesäpaketti\|9,99\|9.99" --include="*.md" --include="*.html" --include="*.js" --exclude-dir=docs/archive --exclude-dir=node_modules .
> grep -rn "29 €/kk\|€29/kk\|49 €\|€49" --include="*.html" --include="*.js" --include="*.md" --exclude-dir=docs/archive --exclude-dir=node_modules .
> ```
> (Idiomi-osumat data/courses/* ovat sallittuja opetussisältönä.)
>
> **Erilliset commitit selkeyttävät reviewin:**
> 1. "rename: Tähtäin → Mestari + €29 → €19 / €49 → €39"
> 2. "feat(pricing): pricing.html 3-tier rewrite"
> 3. "feat(stripe): wire checkout + webhook for treeni/mestari"
> 4. "chore: archive old kesäpaketti onboarding docs"

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ja `ROADMAP.md` ennen kaikkea muuta.

---

## 1. Konteksti

Roadmappiin valittu kolmen tason hinnoittelumalli (single-language vaiheessa 1):

| Taso | Kk | Paketti (8 vk) | Sisältö |
|---|---|---|---|
| **Free** | €0 | — | Pelkkä testi-demo |
| **Treeni** | €9/kk | €19 | ∞ kirjoitus + luettu + harjoituskokeet, ei kurssirakennetta |
| **Mestari** | €19/kk | €39 | Kaikki: koko kurssi + adaptiivisuus + yo-valmius + lukusuunnitelma |

Paketit voimassa: `min(8 viikkoa ostosta, exam_date + 7 päivää)`.

Stripe-tuotteet 2 (Treeni + Mestari), kullakin 2 hintaa (recurring monthly + one-time package).

Nykyinen tila: `routes/stripe.js` placeholder-tilassa (palauttaa 503/410). Tämä loop aktivoi sen.

---

## 2. Mitä tämä loop EI tee

- ❌ Älä lisää multi-language-paketteja — vaiheessa 2
- ❌ Älä lisää yearly-tilausta — vain kk + 8 vk paketti
- ❌ Älä lisää lukio-/B2B-tilauksia
- ❌ Älä luo testimoniaaleja, lukuja tai social-proofia pricing-sivulle
- ❌ Älä riko Pro-gating-logiikkaa muutoin kuin laajentamalla sitä tier-aware:ksi (`hasFeature(user, feature)` -helper)
- ❌ Älä aja Stripe-tuotteita tuotantotiliin agentista — käyttäjä luo ne itse Stripe-dashboardilla

---

## 3. Skill-set

- `puheo-finnish-voice` — pricing-copy ei saa kuulostaa myyjältä
- `puheo-screen-template` — 3-kortin layout
- `ui-ux-pro-max` — feature-vertailutaulukko + selkeä hierarkia
- `frontend-design`, `design-taste-frontend`, `redesign-existing-projects`, `high-end-visual-design`
- `education/self-efficacy-builder-sequence` — paketin myynti = varmuutta tarjoava, ei stressaava
- `supabase`-skill DB-migraatioon

### 21st.dev-sourcing
- 3-tier pricing-page Linear-/Stripe-/Cal-tasolta
- Feature-vertailutaulukko (rivit = ominaisuudet, sarakkeet = tasot)
- "Suosituin"-korostus keskimmäiseen vaihtoehtoon (Mestari)
- Stripe Checkout / Customer Portal -referenssit

---

## 4. Stripe-konfiguraatio (ihmisen ajettava Stripe-dashboardilla)

ACTION REQUIRED -ohje IMPROVEMENTS.md:hen:

Stripe-dashboardilla:

**Tuote 1: "Puheo Treeni"**
- Hinta 1.1: €9.00 / kk recurring, EUR. Metadata `{ tier: "treeni", billing: "monthly" }`. → env: `STRIPE_PRICE_TREENI_MONTHLY`
- Hinta 1.2: €19.00 one-time, EUR. Metadata `{ tier: "treeni", billing: "package", duration_days: 56 }`. → env: `STRIPE_PRICE_TREENI_PACKAGE`

**Tuote 2: "Puheo Mestari"**
- Hinta 2.1: €19.00 / kk recurring, EUR. Metadata `{ tier: "mestari", billing: "monthly" }`. → env: `STRIPE_PRICE_MESTARI_MONTHLY`
- Hinta 2.2: €39.00 one-time, EUR. Metadata `{ tier: "mestari", billing: "package", duration_days: 56 }`. → env: `STRIPE_PRICE_MESTARI_PACKAGE`

**Webhook endpoint** `https://puheo.fi/api/stripe/webhook`, kuuntele `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`. Tallenna webhook signing secret → `STRIPE_WEBHOOK_SECRET`.

**Customer Portal** päällä Stripe-dashboardilta.

Aseta envit Vercelin tuotantoon ja lokaaliin `.env`:iin.

---

## 5. Datamalli (Supabase, ihmisen ajettava SQL)

```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier      TEXT DEFAULT 'free',     -- 'free' | 'treeni' | 'mestari'
  ADD COLUMN IF NOT EXISTS subscription_billing   TEXT,                      -- 'monthly' | 'package' | NULL
  ADD COLUMN IF NOT EXISTS subscription_status    TEXT DEFAULT 'active',    -- 'active' | 'past_due' | 'canceled' | 'expired'
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Free-käyttäjien lifetime-kvoottien laskuriin
CREATE TABLE IF NOT EXISTS free_usage (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  writing_count    INT DEFAULT 0,
  reading_count    INT DEFAULT 0,
  exam_count       INT DEFAULT 0,
  lessons_done     INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Lisää SQL-snippetit `IMPROVEMENTS.md`:hen ACTION REQUIRED -merkillä.

---

## 6. Pro-gating ja feature-tasot

Päivitä `middleware/auth.js`:

```javascript
const FREE_LIMITS = {
  writing: 1,
  reading: 1,
  exam: 1,
  lessons: 1,
};

function isPaying(user) {
  if (!user.subscription_tier || user.subscription_tier === 'free') return false;
  if (user.subscription_status === 'active') return true;
  if (user.subscription_billing === 'package'
      && user.subscription_expires_at
      && new Date(user.subscription_expires_at) > new Date()) return true;
  return false;
}

function getTier(user) {
  if (!isPaying(user)) return 'free';
  return user.subscription_tier; // 'treeni' | 'mestari'
}

const FEATURES = {
  free:    new Set(['writing', 'reading', 'exam', 'lesson']),  // limited counts
  treeni:  new Set(['writing', 'reading', 'exam']),             // unlimited, no course
  mestari: new Set(['writing', 'reading', 'exam', 'lesson', 'course', 'adaptive', 'yo_readiness', 'study_plan', 'mistake_tracking']),
};

function hasFeature(user, feature) {
  return FEATURES[getTier(user)].has(feature);
}

// Free-tasolla rajat lasketaan free_usage-taulusta:
async function checkFreeQuota(user, feature) {
  if (getTier(user) !== 'free') return { allowed: true };
  const usage = await getFreeUsage(user.id);
  const used = usage[`${feature}_count`] ?? 0;
  const limit = FREE_LIMITS[feature];
  return { allowed: used < limit, used, limit };
}
```

Käyttö route-handlereissa:
- `routes/writing.js`: ennen kirjoituksen submitointia → `hasFeature(user, 'writing')` + jos free, `checkFreeQuota`. Jos free-kvootti ylittynyt, palauta 402 + viesti "Upgrade Treeni-tilaukseen".
- `routes/exercises.js`: lessonin avaaminen → `hasFeature(user, 'lesson')`; jos free, kvootti, jos treeni, EI saa avata kuin demo-oppituntia ("Kurssi on Mestari-tilauksessa")
- Adaptiiviset osat (vaikeustasoanalyysi, virhetracking) → `hasFeature(user, 'adaptive')` (vain mestari)
- Yo-valmius-näkymä → `hasFeature(user, 'yo_readiness')` (vain mestari)
- Lukusuunnitelma → `hasFeature(user, 'study_plan')` (vain mestari)

---

## 7. Backend-endpointit

`routes/stripe.js` (placeholder → toiminnalliseksi):

- `POST /api/stripe/checkout-session`
  - body: `{ tier: 'treeni' | 'mestari', billing: 'monthly' | 'package' }`
  - vaatii kirjautuneen käyttäjän
  - mappaa Stripe price_id ympäristömuuttujasta
  - palauttaa Stripe Checkout-URLin
- `POST /api/stripe/portal-session` — vain monthly-tilaajille → Customer Portal-URL
- `POST /api/stripe/webhook` — Stripe-eventit
  - `checkout.session.completed`: aseta `subscription_tier`, `subscription_billing`, `subscription_status='active'`, monthly:lle `stripe_subscription_id`, package:lle `subscription_expires_at = min(now + 56 d, exam_date + 7 d)`
  - `customer.subscription.updated`: synkkaa `subscription_status`
  - `customer.subscription.deleted`: `subscription_status='canceled'`, säilytä tier kunnes period päättyy
  - `invoice.payment_failed`: `subscription_status='past_due'`
  - **Idempotenssi:** käytä `event.id` kahdesti-prosessoinnin estoon (talleta käsitellyt id:t pieneen `stripe_events`-tauluun tai käytä Stripen oma idempotency-tarjous)

---

## 8. Frontend-muutokset

### Pricing-osio per landing-sivu

Korvaa olemassa oleva pricing-osio (siirretään `/espanja-yo-koe`-sivulle LANG-LANDINGS-loopissa). Saksa/ranska-landingeilla pricing on disabled-tilassa.

Layout: 3 korttia side-by-side (mobile stacked).

**Free-kortti (vasen):**
- "Free" + "€0"
- Lista:
  - 1 oppitunti
  - 1 kirjoitustehtävä
  - 1 luetun ymmärtäminen
  - 1 harjoituskoe
  - Ei AI-tracking
- CTA: "Aloita ilmaiseksi" → /onboarding

**Treeni-kortti (keski, ei suosituin-banner):**
- "Treeni"
- Hinta-toggle: kk-näkymässä **€9 / kk**, paketti-näkymässä **€19 / 8 vk**
- Sub-rivi: "Pakettihinta sopii 4-8 vk valmistautumiseen"
- Lista:
  - ∞ kirjoitustehtävät
  - ∞ luetun ymmärtämiset
  - ∞ harjoituskokeet
  - AI-arviointi
  - Ei rakenteellista kurssia
  - Ei adaptiivisuutta
- CTA: "Valitse Treeni"

**Mestari-kortti (oikea, "Suosituin"-banneri päällä):**
- "Mestari"
- Hinta-toggle: **€19 / kk** tai **€39 / 8 vk**
- Sub-rivi: "Säästät jos rekisteröit ≥3 vk ennen koetta"
- Lista:
  - Kaikki Treenin ominaisuudet
  - Koko 8-kurssin polku
  - Adaptiivinen vaikeus
  - Yo-valmius-mittari
  - Henkilökohtainen lukusuunnitelma
  - Virhetracking
  - Adaptiiviset kokesimulaatiot
- CTA: "Valitse Mestari"

**Kuukausi/paketti-toggle:** yhden klikin segmented-control yläpuolella (ei toistuvia toggleja per kortti).

**Vertailutaulukko alla:** rivi per ominaisuus, sarake per taso, ✓/–. Auttaa epäröijää valitsemaan.

### Settings-screen (`screen-settings`)

Lisää "Tilaus"-osio, näytä tilan mukaan:
- Free: "Sinulla on Free-tili. Avaa lisää Treenillä tai Tähtäimellä." → /pricing
- Treeni monthly: "Aktiivinen Treeni-tilaus, seuraava veloitus X" → "Hallinnoi" → Customer Portal + "Päivitä Tähtäimeen" → upgrade-flow
- Treeni paketti: "Treeni-paketti voimassa X asti" → "Päivitä Tähtäimeen" → upgrade
- Mestari monthly: "Aktiivinen Mestari-tilaus" → Customer Portal
- Mestari paketti: "Mestari-paketti voimassa X asti"
- Expired: "Tilauksesi on päättynyt" → /pricing

**Upgrade-logiikka (Treeni → Mestari):**
- Monthly tier-vaihto: Stripe `prorate` automaattinen, päivitä subscription
- Package upgrade: laske credit jäljellä olevasta Treeni-paketista, tarjoa Mestari-paketti hintaan `€39 - credit`

---

## 9. Onboardingin integrointi

Onboarding-loop (L-ONBOARDING-REDESIGN-1) reveal-vaihe näyttää **Mestari** premium-CTA:na, mutta MAIN CTA on aina "Aloita ilmaiseksi" (Free). Toissijainen rivi: "Avaa kaikki Tähtäimellä alkaen €19/kk" → linkki pricingiin.

Älä pakota tier-valintaa onboardingissa. Valinta tehdään myöhemmin kun käyttäjä kohtaa rajan (paywall-prompti).

Paywall-prompt-tekstit (puheo-finnish-voice):
- Free → Treeni: "Olet käyttänyt ilmaisen kirjoitustehtäväsi. Saat rajattomat Treenillä — €9/kk tai €19 koko prep-kaudelle."
- Free → Mestari: "Tämä oppitunti on osa kurssia. Avaa kaikki 8 kurssia Tähtäimellä — €19/kk tai €39 koko prep-kaudelle."
- Treeni → Mestari: "Tämä on kurssin oppitunti. Tarvitset Tähtäimen avataksesi kurssirakenteen, adaptiivisuuden ja yo-mittarin."

---

## 10. Verifiointi

1. `graphify update .`
2. Playwright screenshot pricing-osiosta @ 1440 + 768 + 375 (kk + paketti -toggle molemmat tilat)
3. axe-core 0 violations
4. End-to-end testi (Stripe test mode):
   - Free-käyttäjä → "Valitse Treeni" → Stripe Checkout (4242...) → palaa → varmista `subscription_tier='treeni'`, `subscription_billing='monthly'`
   - Free-käyttäjä → "Valitse Mestari" pakettina → maksa → varmista `subscription_expires_at` 56 d / exam_date+7 d sääntö
   - Treeni-käyttäjä → settings → "Päivitä Tähtäimeen" → varmista upgrade-flow toimii
   - Webhook simulaatio: `subscription.deleted` → varmista tier säilyy mutta status='canceled'
   - Free-käyttäjä yrittää kirjoittaa 2. kerran → 402 + paywall-prompti
   - Treeni-käyttäjä yrittää avata kurssin oppitunnin → 402 + Mestari-paywall
5. Pro-gating toimii kaikilla 9:llä feature-tasolla (`hasFeature` testattu unit-testillä)
6. SW-bumppi
7. IMPROVEMENTS.md: ACTION REQUIRED Stripe-dashboard-setupille + SQL-migraatiolle, eksplisiittiset price_id:t env:iin

---

## 11. Guardrailit

- **ÄLÄ committaa, älä deployaa**
- **ÄLÄ aja Stripe-tuotteita tuotantotiliin agentista** — käyttäjä tekee Stripe-dashboardilla
- **ÄLÄ tallenna Stripe-secret-avaimia git-historiaan**
- **ÄLÄ riko olemassa olevia free-käyttäjiä** — kaikki nykyiset users.subscription_tier NULL → kohtele `'free'`-tasona migraation jälkeen
- **ÄLÄ unohda valuuttaa** — kaikki euroja
- **ÄLÄ luota webhook-järjestykseen** — käytä idempotency-mekanismia
- **ÄLÄ piilota Free-vaihtoehtoa pricing-sivulta** — sen pitää olla yhtä näkyvä kuin maksulliset (luottamus + konversio later)
- **ÄLÄ kirjoita pricing-copya kuten "myynnillinen tarjous"** — neutraali, asiallinen, suomi

---

## 12. Lopputuotteen kriteeri

1. Free-käyttäjä saa rekisteröidä, käydä onboardingin, kokeilla ja törmätä rajaan ymmärrettävällä paywallilla
2. Pricing-sivu kolmella selkeällä tasolla, kk/paketti-toggle, vertailutaulukko
3. Stripe Checkout toimii 4 hintaan test-moodissa
4. Webhook päivittää oikean tilan (tier + billing + status + expires_at)
5. Settings antaa tilan ja upgrade-polun
6. Käyttäjä ymmärtää 30 sekunnissa erot Free / Treeni / Mestari ja valitsee oikean tarpeisiinsa
