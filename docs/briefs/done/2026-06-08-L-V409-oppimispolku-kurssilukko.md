# L-V409 — Oppimispolun "osta kurssi" -lukko

> **AGENTTI-DIREKTIIVI (Marcelin eksplisiittinen rajaus, ohittaa auto-skill-stackin):**
> - **Malli: Sonnet.** Aja tämä Sonnet-agentilla.
> - **Skill: VAIN `impeccable`.** Älä lataa muita skillejä. Aloita vastaus rivillä `Skills invoked: impeccable`.
> - Puhdas frontend (JS + CSS + HTML). Ei backend-muutoksia. Jos törmäät backend-tarpeeseen → pysähdy ja raportoi.
> - Käytä impeccablen ali-komentoja: `shape` ennen koodia, `craft` toteutukseen, `audit`/`polish` verifiointiin.

**Rooli:** WRITER. **Tyyppi:** FRONTEND-M (komponentti + state).

---

## TAVOITE (yksi virke)

Oppimispolkuun hieno **"osta kurssi" -lukko**: kurssin sisältö joka vaatii maksullisen Kurssi-tason näkyy lukittuna brändinmukaisella lukolla, ja lukko ohjaa ostopolkuun.

Marcelin sanoin: *"oppimispolus on sellane hieno lukko et osta kurssi."*

---

## NYKYTILA — tarkka tiedostokartta

**Oppimispolku-index:** `js/screens/oppimispolkuIndex.js` — 8 kurssin kirjasto-index. Reitti `#/oppimispolku` (+ `?lang=X`). Container `#screen-oppimispolku-index`, root `#op-root`. Rivinrenderöinti `renderRow()` (~rivi 66).
**Kurssin detalji:** `js/screens/courseDetail.js` — reitti `#/oppimispolku/{lang}/{key}`.
**CSS:** etsi `.lp-row*` -tyylit (oppimispolun rivit). Lukkotyyli `.lp-row--locked` on jo olemassa.

**Nykyinen lukitus on PROGRESS-pohjainen, EI osto-pohjainen:**
`renderRow()` laskee per-kieli-curriculumista kolme tilaa:
- `done` (kertaus läpäisty)
- `active` (`isUnlocked`)
- `locked` (`.lp-row--locked`, lukko-ikoni, teksti "Avautuu vuorollaan") = "et ole vielä edennyt tähän"

Eli olemassa oleva lukko tarkoittaa "avautuu järjestyksessä", **ei** "osta kurssi". Tarvitaan **uusi, erillinen osto-lukko**.

**Tier-resolveri (käytä tätä):** `js/lib/tier.js` — `getTier()` → `free`/`treeni`/`kurssi`, `isPaidTier()`. Tämän kautta saat selville onko käyttäjällä Kurssi-taso.

**Ostopolku (jo olemassa):** kartoituksen tier-valinta `#screen-ob-v4-choice` + `beginCheckout` (onboardingV4.js) ja paywall-modaali `js/features/paywallModal.js` (`openPaywall({ variant })`, variantit `quota`/`feature`/`upgrade`). Stripe on stubattu (503 → graceful "aukeaa pian"). **Lukon CTA saa ohjata olemassa olevaan ostopolkuun** (paywall-modaali `feature`-variantilla tai tier-valinta) — älä rakenna uutta checkoutia.

---

## TOTEUTUS

1. **Määrittele mikä on "kurssi-lukittua":** käytä `js/lib/tier.js`:n `getTier()`/`isPaidTier()`. Free- ja Treeni-tason käyttäjille Kurssi-tason sisältö näytetään osto-lukittuna. (Päätä impeccablen `shape`-vaiheessa onko lukko per-kurssi vai koko oppimispolku-tason yli; pidä se yksinkertaisena ja yhdenmukaisena olemassa olevan `FEATURES`/tier-logiikan kanssa. Älä keksi uutta backend-sääntöä.)
2. **Visuaalinen osto-lukko:** erottuu progress-lukosta ("Avautuu vuorollaan"). Brändinmukainen, ei AI-slop. Selkeä viesti + CTA (esim. "Avaa Kurssilla" / "Osta kurssi").
3. **CTA-toiminta:** klikkaus → olemassa oleva ostopolku (`openPaywall({ variant: 'feature' })` tai tier-valinta). Ei uutta checkout-logiikkaa.
4. **Älä riko progress-lukkoa:** "Avautuu vuorollaan" -tila säilyy omana tilanaan. Osto-lukko on lisätila, ei korvaa sitä.

---

## VISUAALI & BRÄNDI

- **Brändilähteet:** `css/tokens.css` + `docs/brand/design-system-worddive-2026-06.md`. WordDive-henki: lämpimät tasaiset värit, Fredoka + Mulish, ei gradientteja, ei italic-Fraunces, ei pure `#000`/`#fff`.
- **Register:** product.
- **Lukko saa olla houkutteleva, ei tyly.** Tämä on konversiohetki: sisältö näkyy "lasin takaa" / himmennettynä niin että arvo on nähtävissä, lukko + CTA päällä. (Glassmorphismi sallittu VAIN jos se on tässä aidosti paras affordanssi, ei koristeena.)
- **Anti-slop:** ei side-stripe-borderia, ei gradient-textiä, ei identtisiä kortteja, ei mono-UPPERCASE ilman syytä.

---

## HYVÄKSYMISKRITEERIT

- [ ] Free/Treeni-käyttäjä näkee Kurssi-tason sisällön oppimispolussa **osto-lukittuna** (erottuu "Avautuu vuorollaan" -progress-lukosta).
- [ ] Kurssi-tason käyttäjä (testaa `TEST_PRO_EMAILS`-tilillä) näkee saman sisällön **avoimena** (ei osto-lukkoa).
- [ ] Lukon CTA ohjaa olemassa olevaan ostopolkuun (paywall/tier-valinta), graceful 503-tila näkyy kun Stripe ei vastaa.
- [ ] Progress-pohjainen "Avautuu vuorollaan" -lukko toimii edelleen omana tilanaan.
- [ ] Mobiili 390px: ei vaakavieritystä, lukko + CTA luettavissa.
- [ ] Desktop 1280px: lukko istuu rivilayoutiin siististi.
- [ ] `npm run build` ajettu; `node --check` läpäisee; `sw.js CACHE_VERSION` bumpattu jos STATIC_ASSETS muuttuu.
- [ ] 0 uncaught console-erroria.

---

## VERIFIOINTI (impeccablen työkaluilla)

- `impeccable audit` oppimispolku-pinnalle.
- Screenshotit 390px + 1280px: free-näkymä (lukittu) vs kurssi-näkymä (avoin).
- Aja paikallisesti, vaihda tier testitilien välillä, todenna molemmat tilat OMILLA työkaluilla.

---

## RAJAUS — mitä EI tehdä

- ❌ Uusi checkout/Stripe-logiikka. Käytä olemassa olevaa ostopolkua.
- ❌ Backend-muutokset (`routes/`, `middleware/`, `supabase/`). Tier luetaan `js/lib/tier.js`:stä.
- ❌ Päivitä-sivu / alennukset (odottaa Stripe-liveä).
- ❌ Kartoitus-portaali (oma brief L-V408) — älä koske `onboardingV4.js`:ään muuten kuin lukon CTA:n ohjauksen osalta jos välttämätöntä.
