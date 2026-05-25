# L-V301..L-V309 — Audit-fix mega-loop (2026-05-25)

**Rooli:** writer (VS Code Claude). Prompter on triagannut, scope-vahvistettu (kaikki 9 audit-loop + v283:n elossa olevat P0:t).

**Lähteet:**
- `docs/briefs/MOBILE-AUDIT-2026-05-24.md` (tuore, L-V300) — 6 P0 + 5 P1, oma fix-jono-taulu §"Korjaus-loop-jono"
- `docs/briefs/v283-runtime-audit-report.md` (2026-05-22) — 3 P0 + 4 P1 jotka eivät ole näkyvissä L-V286..L-V300-ledgereissä → todennäköisesti elossa
- `docs/briefs/L-PRO-LUKITTU-FINDINGS.md` — jo resolvoitu, ei toimenpiteitä
- `docs/briefs/DEEP-AUDIT-DEFERRED.md` — meta, ei toimenpiteitä

**Tilakuva:** production on nyt promotoitu (L-V300-PROMOTE-FIX-1, `fdeb40c`), `vercel.json` `github.autoAlias` poistettu. Main-push deployaa automaattisesti. Marcel ottaa lukio-yhteydenoton kun nämä bugit on suljettu.

---

## Yleisohjeet writerille

1. **Aja kaikki 12 loop:ia peräkkäin yhdessä sessiossa.** Älä pysähdy per-loop-tarkistuksiin (Marcel: `feedback_skip_measurement_gates`). Yksi `git push origin main` per loop, Vercel promotoi itse. Älä tarjoa "promote to production"-painalluksia.
2. **Verify ennen sanomista valmis.** Jokainen P0-loop pitää testata omilla tooleilla (Bash + Playwright tai curl + näyttöleike) — älä siirrä todentamista käyttäjälle. `superpowers:verification-before-completion` pakollinen.
3. **Jos finding on jo korjattu**, dokumentoi yhdellä rivillä IMPROVEMENTS.md:hen ("L-VXXX skipped: already resolved in <commit>") ja siirry seuraavaan. Älä korjaa toista kertaa.
4. **IMPROVEMENTS.md:** yksi rivi per loop, samalla formaatilla kuin L-V300-FULL-AUDIT-1.
5. **SW-bump:** jokainen muutos `STATIC_ASSETS`-listan tiedostoon → bumppaa `sw.js` CACHE_VERSION. Nykyinen v300.
6. **`npm run build` ennen committia jos muokkaat `js/` tai `css/` -lähteitä** — bundlet pitää syntaa. Stage myös `chunks/app-*-HASH.js`.
7. **Anti-slop-tarkistus jokaisesta UI-muutoksesta:** ei italic Fraunces, ei mono-UPPERCASE chipit, ei em-dash, ei identical card grid, ei "Ladataan…"-italic, ei placeholder-skeletoneja prodissa. Lue `CLAUDE.md` §"MIKÄ MARCELIA VITUTTAA".
8. **Käytä mode-first hierarchy** (`memory/project_mode_first_hierarchy.md`) ja **Old-Spain-paletti + General Sans + Manrope** (`feedback_typography_general_sans_manrope`).
9. **Brief on intent, ei pikseli-prescriptio.** Saat valita composition itse, kunhan acceptance-kriteerit täyttyvät.

---

## L-V301-SETTINGS-P0-1 — Profiili/Tili/Tilaus -kortit korjattu Pro-tilille

**Findings (MOBILE-AUDIT §"Näkymä 8" + §"Top 5 P0"):**
- Opiskeluprofiili: "Profiilin lataus epäonnistui. Kokeile myöhemmin uudelleen." — testpro123@gmail.com:llä
- Opiskelukieli: tyhjä skeleton lataa loputtomiin
- Tili: "Ei sähköpostia" kirjautuneelle Pro-käyttäjälle
- Tilaus: tyhjä otsikko ilman sisältöä, ei Pro-badgea

**Likely root cause:** yksi `/api/profile`- tai `/api/settings`-reitti rikki tai palauttaa tyhjän responsen Pro-tilille. Marcel pelkää tämän on suurin "tuote-on-vielä-rikki"-signaali lukio-edustajalle.

**Files (oletettu — vahvista grep:llä):**
- `routes/profile.js` tai `routes/auth.js` GET /me/profile
- `routes/settings.js` (jos olemassa)
- `js/screens/settings.js` — wire-up funktiot wireProfileCard, wireAccountCard, wireSubscriptionSection
- `lib/openai.js` tai vastaava jos profile-data hakeutuu shared helper:istä
- `routes/stripe.js` — jos Tilaus-osio kutsuu Stripe-subscription-statusta

**Acceptance:**
- testpro123@gmail.com:llä Asetukset-sivun **kaikki 4 korttia** renderöityvät dataa:
  - Opiskeluprofiili: kutsumanimi, kieli, taso (jos asetettu)
  - Opiskelukieli: dropdown jossa nykyinen valinta esivalittu
  - Tili: email näkyvissä (monamalou@gmail.com tai testpro123@gmail.com)
  - Tilaus: Pro-badge, tilauksen tila, voimassaolopäivä, "Hallinnoi tilausta" -CTA → POST /api/stripe/portal-session
- Free-tilillä Tilaus-kortti näyttää "Free"-badgen + "Päivitä Treeniin/Mestariin" -CTA
- Playwright-spec `tests/e2e-settings-pro.spec.js` kattaa kaikki 4 korttia (uusi)

**Verify:** kirjautuneena testpro:lla, screenshot ennen+jälkeen → ennen=virheet, jälkeen=4 toimivaa korttia. `npm run test:bug-scan` PASS.

---

## L-V302-PROFILE-LINK-1 — Profile-linkki sidebariin tai konsepti poistettu

**Finding (MOBILE-AUDIT P0-4 + `memory/project_open_issues_2026_05_19`):** Sidebar: Aloitus / Asetukset / Kirjaudu ulos. Profile puuttuu.

**Päätös tehtävänä:** Onko Profile oma näkymä Asetusten lisäksi? Jos kyllä → lisää sidebar-linkki. Jos ei → poista Profile-maininnat memorystä + dokuista.

**Suositus:** Asetukset-näkymä **kattaa Profile-toiminnallisuuden** (Opiskeluprofiili-kortti, Kutsumanimi-kortti). Päättele että erillistä Profile-näkymää **ei tarvita** — poista konsepti.

**Files:**
- `memory/project_open_issues_2026_05_19.md` — päivitä että Profile = Asetukset-näkymän kortit
- `app.html` / sidebar-renderöinti — varmista että ei ole `<a href="#/profile">`-linkkiä joka 404:ää
- `js/main.js` route-handlerit — jos `#/profile` reitti olemassa, redirectaa → `#/asetukset`

**Acceptance:** Marcelin memory-issue suljettu, sidebar 3 linkkiä on intentional. Ei orpoja Profile-mainintoja koodissa.

---

## L-V303-SAKSA-FR-KURSSIT-1 — 8 skeleton-korttia korvattu oikealla sisällöllä TAI sektio poistettu

**Finding (MOBILE-AUDIT P0-5):** `/saksan-yo-koe` (ja oletettavasti `/ranskan-yo-koe`) näyttää production 8 tyhjää harmaa skeleton-korttia "8 kurssia"-sektiossa. CLAUDE.md:n eksplisiittinen rikkomus ("Coming soon"-AI-slop).

**Päätös:** kurssi-sisältöä DE/FR:lle ei ole vielä generoitu (L-V288:n jälkeen vain ES on valmis), joten korttien täyttäminen "oikealla sisällöllä" tarkoittaisi `lib/curriculumData.js DE_KURSSIT`-otsikoiden + 1-2 lauseen kuvauksen näyttämistä.

**Files:**
- `public/landing/saksa.html` — "8 kurssia"-sektio
- `public/landing/ranska.html` — sama
- `lib/curriculumData.js` — `DE_KURSSIT`, `FR_KURSSIT` (otsikot olemassa L-V292:n jäljiltä)

**Acceptance:**
- Sektio näyttää 8 korttia per kieli, kukin sisältää: kurssin numero (K1..K8), otsikko (Wer bin ich → Abi-Vorbereitung saksaksi, Qui je suis → Vers le bac ranskaksi), 1-2 lauseen suomenkielinen kuvaus, "Avautuu kev. 2026 / syk. 2026" -mikrochipi
- EI tyhjiä skeleton-pulse-kortteja
- Visuaali = sama rytmi kuin espanja-landingin kurssikortit, mutta `data-locked="true"` -tila + lock-mikroglyfi
- Lighthouse mobile + desktop screenshot ennen+jälkeen liitteenä

**Anti-slop:** ÄLÄ tee identtisiä 4-rivisiä kortteja. Käytä variaatiota (esim. ensimmäinen rivi K1+K2 isompina, loput pienempinä). Lue `feedback_design_direction_eduix_old_spain`.

---

## L-V304-SAKSA-FR-WAITLIST-1 — "Liity waitlistille"-modaali avautuu klikistä

**Finding (MOBILE-AUDIT P3 §"Näkymä 2" §"Mitä näyttää huonolta"):** "Liity waitlistille" -CTA ei avannut formia tai modaalia kun Playwright klikkasi (sama screenshot ennen+jälkeen).

**Likely root cause:** L-LANG-LANDINGS-1:ssä inline IIFE oli inline `<script>` HTML:ssä. Jos build-prosessi tai SW-cache strippaa inline-scriptin, modaali ei avaudu.

**Files:**
- `public/landing/saksa.html` ja `ranska.html` — inline `<script>` modaali-handlerille
- `js/landing-countdown.js` — separate file (counter), ehkä myös modaali pitäisi olla erillisessä tiedostossa
- `vercel.json` — varmista että `public/landing/*.html` ei pakkaa pois `<script>`-tagia

**Acceptance:**
- Klikki "Liity waitlistille" → modaali avautuu (focus-trap, ESC sulkee, backdrop-click sulkee)
- Email-input + "Liity"-CTA + sähköpostivalidaatio
- POST `/api/onboarding/waitlist?language=de` palauttaa 200 → success-state "Olet listalla, lähetimme kuittauksen sähköpostiisi"
- Kuittausemail menee Resend:n kautta (vahvista lokaalilla `node -e "import('./email.js')..."` tai Resend dashboard)
- Playwright-spec `tests/e2e-waitlist-modal.spec.js` kattaa ES+DE+FR landingit

---

## L-V305-COUNTDOWN-HARDCODE-1 — Hero-otsikon hardcoded päivämäärä poistettu

**Finding (MOBILE-AUDIT P0-6):** `/app`-login-näkymän hero "Adaptiivinen treeni 28.9.2026 saakka." on hardcoded. 4 kk päästä väite muuttuu virheelliseksi.

**Päätös:** Vaihtoehdot:
- (a) Dynaaminen: lue käyttäjän tilauksen voimassaolopäivä Stripe-statuksesta → "saakka {expiry_date}"
- (b) Poista konkreettinen päivä → "Adaptiivinen treeni YO-kokeeseen saakka." tai "Adaptiivinen treeni aina seuraavaan YO-koepäivään saakka."

**Suositus:** **(b)** koska login-näkymä on **ennen kirjautumista** = ei tiedetä user-spesifistä expiryä. Hero pitää lukea sama kaikille.

**Files:**
- `js/screens/auth.js` tai `app.html` template-string jossa hero-otsikko on
- Jos käyttää `js/landing-countdown.js`:n `YO_DATES`-listaa → laske lähin tuleva päivä dynaamisesti samalla logiikalla

**Acceptance:**
- Hero ei sisällä `2026-09-28` tai `28.9.2026` tekstinä
- Hero lukee semanttisesti oikein eikä rota: "Adaptiivinen treeni seuraavaan YO-kokeeseen saakka." (tai writer voi valita paremman copy:n humanizer-säännöillä)
- Mobile + desktop screenshot

---

## L-V306-MODE-PAGE-SLOP-1 — Mono-UPPERCASE eyebrowit + body-monospace poistettu

**Finding (MOBILE-AUDIT P1 §"Näkymä 6"):** Mode-page hero:
- `HARJOITTELUTAPA` mono-UPPERCASE eyebrow
- `AIHE` mono-UPPERCASE eyebrow
- Body-copy "Teksti + kysymykset", "Tehtävä + AI-palaute · 99 p" **monospace**

Lue `feedback_design_direction_eduix_old_spain`, `feedback_typography_general_sans_manrope`, `feedback_ai_slop_check_every_frontend`.

**Files:**
- `js/screens/mode-page.js` tai vastaava
- `css/components/mode-page.css`

**Acceptance:**
- Ei mono-UPPERCASE eyebrowja mode-pagella
- Sentence-case label "Harjoittelutapa" + "Aihe" tai semanttinen h3 isommassa weightissa
- Body-copy = sama Manrope kuin muulla sivulla, ei monospace
- "99 p" → pieni chip oikealla kulmassa kortin sisällä, ei body-virkkeessä
- Screenshot before+after

---

## L-V307-SETTINGS-MONO-1 — Settings-kortti-metalabelit monospace pois

**Finding (MOBILE-AUDIT P1 §3 + §"AI-slop sweep"):** Settings-näkymän kortti-meta-labelit ("Mitä sovellus saa kutsua sinua?", "Teema", "Sähköposti", "Kirjaudu ulos") ovat monospace ilman syytä.

**Files:**
- `css/components/settings.css`

**Acceptance:**
- Kaikki settings-meta-labelit Manrope/General Sans, ei monospace
- Body-tekstit samoin
- Screenshot before+after
- Bundle-byte-diff merkityksetön — vain CSS-luokan font-family-arvo muuttuu

---

## L-V308-LANDING-LENGTH-1 — Espanja-landingin mobile-pituus ≤7000 px

**Finding (MOBILE-AUDIT P1 §5 + §"Näkymä 1"):** Mobile 14333 px = 36 viewport-korkeutta. Käyttäjä ei jaksa scrollata.

**Files:**
- `index.html` tai `public/landing/espanja.html` (riippuen kumpaa rewrite kohdistaa root:iin)

**Acceptance:**
- Mobile-pituus mitattuna Playwrightilla `page.evaluate(() => document.body.scrollHeight)` ≤ 7000 px iPhone 14 viewportissa (393×852)
- Yhdistä redundantteja sektioita: nykyisin sama "miksi Puheo" -viesti toistuu 3-4 paikassa eri sanoin → tiivistä yhteen
- Säilytä: hero, YO-countdown, 3 mode-feature, pricing, diagnostic-screenshot, footer-CTA
- Poista TAI yhdistä: redundantit value-prop-sektiot, "miten se toimii"-sektio jos sama tieto on jo featuressa, jokin testimonial-vyö jos fake-väitteitä
- Screenshot before+after koko sivun mitassa

**Anti-slop:** ÄLÄ luo "elevate"/"kalibroitu"/"monipuolinen"-copyä uudessa tiiviimmässä versiossa. Aja humanizer-säännöt CLAUDE.md §"PAKOLLINEN HUMANIZER":sta läpi.

---

## L-V309-V283-ADAPTIVE-400-FIX — `/api/adaptive/status?mode=writing` palauttaa 200

**Finding (v283 P0-3):** `[NET] 400 https://espanja-v2-1.vercel.app/api/adaptive/status?mode=writing` console-virhe puhtaalla kotipoluulla. Sentry-pakottava.

**Verify ensin:** Onko vielä elossa? Aja Playwright:
```js
const errors = [];
page.on('response', r => { if (r.status() >= 400 && r.url().includes('/api/')) errors.push({url: r.url(), status: r.status()}); });
// login as testpro, wait for home
expect(errors.filter(e => e.url.includes('adaptive/status'))).toHaveLength(0);
```

Jos finding on **jo korjattu** → kirjoita IMPROVEMENTS.md:hen "L-V309 skipped: adaptive/status returns 200, no 400 in console (verified <date>)" ja siirry seuraavaan.

Jos elossa:
- **Files:** `routes/adaptive.js` GET /status, validointi mode-parametrille (`writing`/`reading`/`vocab`/`grammar`)
- **Acceptance:** kaikki 4 mode-arvoa palauttavat 200; tuntemattomat mode-arvot 400 + JSON `{error: "invalid_mode"}`
- Playwright-spec: home-näytön console-error count = 0

---

## L-V310-V283-EXAM-LOADER-1 — Koeharjoitus ei jää ikuiseen "Tarkistetaan aktiivista koetta…" -loaderiin

**Finding (v283 P0-1):** Aloitus → Koeharjoitus-tile → `screen-loading` jää >8 s, modaali peittää alaosan mutta spinner-näyttö ei korvaudu.

**Verify ensin:** Onko jo korjattu? Manuaalitesti testpro:lla → Koeharjoitus-klikki → seuraa onko spinner >5 s.

Jos elossa:
- **Files:** `js/screens/exam.js` tai vastaava + `routes/exam.js` GET /active
- **Acceptance:** spinner näkyy max 2 s, sen jälkeen joko exam-näyttö tai keskeneräinen-koe-modaali. Spinner piilotettu kun modaali näkyy.
- Playwright-spec: spinner-element on poissa DOM:sta tai `display: none` 3 s sisällä.

---

## L-V311-V283-HOME-PAINT-1 — Aloitus-skeleton ≤3 s

**Finding (v283 P0-2):** Aloitus-näytön ensimmäinen render on skeleton-only ≥7 s ennen kuin sisältö resolvoituu.

**Verify ensin:** Vaihda Playwright-mittaus: `await page.goto('/app.html')`, login, `await page.waitForSelector('#screen-home.active [data-content="real"]', { timeout: 3000 })` — passaaako?

Jos elossa:
- **Files:** `js/screens/dashboard.js` tai `home.js` — fetch-koodaus ja `networkidle`-trigger
- **Likely fix:** parallel-fetch kaiken alkudata yhdessä `Promise.all`:ssa, ei sekvensaalisesti. Tai SSR-prefetch hero-osalle.
- **Acceptance:** skeleton näkyy max 3 s, sen jälkeen real content. Mittaa Playwrightilla 3 erillistä loadia, kaikki ≤ 3000 ms.

---

## L-V312-AUDIT-RERUN-1 — Full audit re-run, sulje silmukka

**Tarkoitus:** Aja `tests/e2e-mobile-audit-2026-05-24.spec.js` ja `tests/e2e-_runtime-audit.spec.js` uudelleen kun L-V301..L-V311 valmis. Vahvista että:
- P0-listalla 0 löydöstä
- P1-listalla ≤2 löydöstä (L-V308 landing-length-toleranssi)
- Console-virheet 0 puhtaalla kotipoluulla
- 26 screenshotia tallennettu `screenshots/mobile-audit-V312/` ja `screenshots/desktop-audit-V312/`

**Spec-bugit korjaa ENSIN ennen ajoa** (kts. MOBILE-AUDIT §"spec-bug joka esti täyden auditin"):
1. Vaihda `waitUntil: 'networkidle'` → `await page.waitForSelector('#screen-home.active', { timeout: 15000 })` login-vaiheessa
2. Korjaa evidence-JSON-overwrite: per-test-file `evidence-${viewName}-${viewport}.json` tai merge-pattern joka oikeasti merkkaa kaikki run:t

**Lopputulos:** uusi audit-raportti `docs/briefs/MOBILE-AUDIT-2026-05-25-followup.md` jossa Marcel näkee ennen-jälkeen-vertailun. Jos kaikki P0 suljettu → "READY FOR LUKIO-KONTAKTI"-merkki ylimmälle riville.

---

## Yhteenveto

12 looppia, ETA ~6-7 h. Aja peräkkäin, ei välitarkistuksia. Joka loop = oma commit + push (Vercel promotoi). IMPROVEMENTS.md rivi per loop.

**Skills writerille:** käytä `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng` jokaiseen frontti-looppiin; `webapp-testing` + `superpowers:verification-before-completion` jokaiseen Playwright-vahvistukseen; `supabase` + `supabase-postgres-best-practices` jos L-V301 paljastaa Supabase-row-ongelman; `superpowers:systematic-debugging` jos jokin P0 ei korjaudu ensimmäisellä yrityksellä.

**Push-back-kohta jos jokin ei tunnu oikealta:** kirjoita ledger-riviin "BLOCKED: <syy>" ja siirry seuraavaan loopiin. Älä jää tuntikausiksi jumiin yhden bugin äärelle.

**Lopullinen acceptance koko brieffille:** L-V312-rerunin raportti näyttää "0 P0, ≤2 P1" → lukio-kontaktivalmis.
