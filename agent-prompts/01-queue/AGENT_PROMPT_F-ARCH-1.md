# F-ARCH-1 — Bundle-split + design tokens + /styleguide-sivu

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ENNEN kaikkea muuta. Tämä on **FRONTEND + ARKKITEHTUURI** -loop. Iso, useita istuntoja voi tarvita — pilko commit per ydin-osa.

---

## 1. Konteksti

Kolme arkkitehtuuri-velka-itemiä jotka tukevat tulevia featureja:

**A — Bundle-split + lazy-load per screen.** `app.bundle.js` on iso monoliitti. Screenit ovat jo erillään tiedostoina (`js/screens/*.js`), mutta build-prosessi bundlaa kaiken yhteen ja lähettää myös ei-vierailluille screeneille. Tämä hidastaa initial-loadin ja vaikeuttaa tulevia featureja (SRS, speaking-mode, ...).

**B — Design tokens eksplisiittiseen tiedostoon.** Värit, spacingit, radiukset, font-sizet ovat osittain CSS-custom-propsina (`--accent`), osittain hardcode-arvoina rönsynä eri CSS-tiedostoissa. Yhtenäistetään `css/tokens.css`:ään yhden lähteen pohjaksi.

**C — `/styleguide` -sivu.** Yksittäinen sivu joka näyttää KAIKKI design-tokenit + buttonit + kortit + modaalit + form-elementit + tasot. Auttaa:
- Pitämään tulevat lessonit ja screenit yhtenäisellä tasolla
- Toimii AI-agentin "katso miltä komponentin pitäisi näyttää" -referenssinä
- Helpottaa design-review-istuntoja

---

## 2. Mitä tämä loop EI tee

- ❌ ÄLÄ vaihda buildtoolia (esbuild → vite tms.) — pidä nykyinen pipeline
- ❌ ÄLÄ rakenna oikeaa SSR/SPA-routeria — manual code-split per screen riittää
- ❌ ÄLÄ refaktoroi screen-koodi-rakenne sisältä — vain lazy-imports + import-graphi
- ❌ ÄLÄ poista vanhoja CSS-tiedostoja, jos tokensit eivät ole vielä migratoituneet — vaiheittain (TODO IMPROVEMENTS.md:ssä jäljellä jäävät hardcode-arvot)
- ❌ ÄLÄ tee `/styleguide`:sta tuotantokäyttöön näkyvää oletuksena — gate `?dev=1`-paramilla TAI vain devissä (`NODE_ENV !== 'production'`)
- ❌ ÄLÄ lisää Storybookia tai vastaavaa — vanilla `styleguide.html`-sivu

---

## 3. Skill-set (PAKOLLINEN)

### FRONTEND-stack
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `puheo-screen-template`
- `puheo-finnish-voice`

### Lisäksi
- `frontend-design` *(ja erikseen `design-taste-frontend`)* — tokens-skaala (8 pt grid, color-luokat, type-scale)
- Lue `graphify-out/GRAPH_REPORT.md` ENNEN bundle-split-työtä — selvitä import-rakenne ja god-nodet

### 21st.dev-sourcing — styleguide
- 21st.dev/s/style-guide, 21st.dev/s/design-system, 21st.dev/s/tokens
- Vercel design system page, Linear design page, Stripe color guide
- Screenshot 2+ → `references/app/styleguide/21stdev/`. Cite URLs.

---

## 4. Tekniset vaateet — per item

### A: Bundle-split + lazy-load

**Tavoite:** vain yhteinen app-shell ladataan etusivulla. Screenit ladataan kun käyttäjä navigoi niihin.

1. Tutki nykyinen build:
   - `package.json`-scripts (`build`-komento, esbuild-config)
   - Mihin tulee `app.bundle.js`? Mistä se generoituu?
2. Erottele "core" vs "lazy":
   - **Core (aina ladattu):** auth, navigation, home, gate, error-boundary, design-tokens, common UI
   - **Lazy (per käyttö):** vocab, grammar, reading, writing, lessonRunner, lessonResults, srs (kun tulee), exam, fullExam, profile, settings, curriculum, etc.
3. Build-konfig: tee `esbuild` (tai whatever) → multiple entry points, code-split via dynamic `import()`. Generoi `dist/screens/*.js` ja core-bundle erikseen.
4. Frontend-routing: `js/router.js` (jos olemassa, muuten luo) → `await import('./screens/vocab.js')` kun screen aktivoituu, cache:tä imported moduuli.
5. **Älä riko nykyisiä `screen-X`-id-pohjaisia switch-mekanismeja** — vain lazy-loadaa moduulin importti. Render-funktio kutsutaan kuten ennenkin.
6. Loading-indikaattori screen-vaihdossa: 250 ms threshold (jos lataus alle, älä näytä spinneriä).

**Mittaa ennen + jälkeen:**
- `dist/`-koot (`wc -c dist/*.js`)
- LCP Lighthouse-skoorilla landing- ja home-sivuilla
- TTI dashboard-sivulla

Kirjoita mittaukset IMPROVEMENTS.md:hen.

### B: Design tokens

1. Luo `css/tokens.css`:
   ```css
   :root {
     /* Color — sytemic */
     --bg: ...;
     --surface: ...;
     --surface-hover: ...;
     --border: ...;
     --text: ...;
     --text-muted: ...;
     --accent: ...;
     --accent-hover: ...;
     --success: ...;
     --warn: ...;
     --error: ...;

     /* Spacing — 4 pt grid */
     --space-1: 4px;  --space-2: 8px;  --space-3: 12px;  --space-4: 16px;
     --space-5: 24px; --space-6: 32px; --space-7: 48px;  --space-8: 64px;

     /* Type-scale */
     --font-size-xs: 12px; --font-size-sm: 14px; --font-size-base: 16px;
     --font-size-lg: 18px; --font-size-xl: 24px; --font-size-2xl: 32px; --font-size-3xl: 48px;
     --line-height-tight: 1.2; --line-height-base: 1.5; --line-height-loose: 1.7;

     /* Radius */
     --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-xl: 24px;

     /* Shadows */
     --shadow-sm: 0 1px 2px rgb(0 0 0 / .05);
     --shadow-md: 0 4px 12px rgb(0 0 0 / .08);
     --shadow-lg: 0 12px 32px rgb(0 0 0 / .12);

     /* Motion */
     --ease-out: cubic-bezier(.2, .8, .2, 1);
     --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
     --duration-fast: 120ms; --duration-base: 200ms; --duration-slow: 320ms;
     --duration-reveal: 600ms;  /* content reveals (count-up, sparkline) */

     /* Z-index scale — ks. _UI_UX_CHECKLIST.md priority 4 */
     --z-base: 1;
     --z-dropdown: 10;
     --z-sticky: 20;
     --z-drawer: 30;
     --z-modal: 40;
     --z-toast: 50;
     --z-confetti: 60;  /* pointer-events: none */

     /* Focus ring */
     --focus-ring: 0 0 0 2px var(--accent);
     --focus-ring-offset: 2px;

     /* Fonts (placeholders, projektin nykyiset arvot) */
     --font-display: ui-sans-serif, system-ui, sans-serif;
     --font-body:    ui-sans-serif, system-ui, sans-serif;
     --font-mono:    ui-monospace, monospace;
   }

   /* Dark mode placeholder — out of scope tähän looppiin, mutta varaa selektori */
   /* [data-theme="dark"] { ... } */
   ```
2. Importtaa `css/tokens.css` ENSIMMÄISENÄ kaikkialta missä CSS-tiedostoja ladataan (`index.html`, `app.html`).
3. **Migraatio vaiheittain:** mene läpi `css/*.css` ja korvaa hardcode-arvot tokeneilla. Kohdista koko-luokkia (color → semantic, ei pixel-tarkkuus).
4. Kirjaa IMPROVEMENTS.md:hen LISTA tiedostoista joissa MIGRAATIO **TEHTY** ja joissa **JÄLJELLÄ** — älä yritä tehdä kaikkea kerralla, vaan 60-70 % nopeasti ja loput TODO:ksi.

### C: `/styleguide`-sivu

1. Uusi `styleguide.html` projektin juuressa (tai `dev/styleguide.html`)
2. Sisältö:
   - **Tokens-osio:** kaikki `--`-muuttujat näkyvinä (color-paletti swatcheina + arvoina, spacing-skaala visuaalisesti, type-scale esimerkkeinä, radiukset boxeina, shadowit, motion-easing-esimerkit)
   - **Komponentit:** primary/secondary/tertiary button, ikoni-button, segmented-control, input, textarea, select, card-perus, card-elevated, modal/dialog, toast, badge, progress-bar, spinner, skeleton, lesson-kortti, results-kortti
   - **Tilat:** default / hover / focus / active / disabled / loading jokaiselle interactive-komponentille
   - **Tasot (z-index):** lista mihin pino-järjestys mikäkin (modal, drawer, tooltip, toast)
3. Gate:
   ```javascript
   if (!new URLSearchParams(location.search).has('dev') && location.hostname !== 'localhost') {
     document.body.innerHTML = '<p>404</p>'; // tai redirect /
   }
   ```
4. Linkitä Service-Workerista pois (älä cachea styleguidea)

---

## 5. Verifiointi

> **Ennen committia: aja `_UI_UX_CHECKLIST.md` läpi.** Tämä loop on ERITYISEN kriittinen koska tokens-osio on **alusta**, jolle muut F-* -loopit rakentuvat — jos tokenit puuttuu tai z-index-scale on ristiriidassa, kaikki tulevat briefit periytyvät bugia.

Erityishuomiot:
- **Light-mode contrast**: pää-teksti `var(--text)` vs `var(--surface)` täyttää 4.5:1. Aja axe-color-contrast nyt-näkymillä — 0 violations.
- **Lazy-load loading-indikaattori (>250 ms threshold)**: skeleton-screen, EI spinner — sama mekanismi kuin F-MICROPOLISH:issa, ristiviittaa CSS-luokat
- **Styleguide-sivun navigaatio**: sticky left-sidebar tai sticky top-section-jumppi-linkit, ei wall-of-content yhdellä scrollilla
- **Styleguide näyttää KAIKKI tilat per interaktiivinen komponentti**: default/hover/focus/active/disabled/loading rivissä vierekkäin — auttaa tulevia worker-istuntoja sourcamaan oikean styleguide-rivin
- **Font-token `--font-display` / `--font-body` käytössä KAIKISSA tokens-skaalan kuluttajissa** — jos joku CSS-file hardcoda `font-family`-arvon, kirjaa se TODO:ksi

1. **Build OK:** `npm run build` (jos sellainen on) → ei errori, dist-koot mitattu
2. **Lazy-load toimii:** Network-tabissa landing → näkyy core-bundle, klikkaus "Vocab" → uusi chunk latautuu
3. **Mittaukset:**
   - Ennen: app.bundle.js koko, gzip-koko, LCP landing, TTI dashboard
   - Jälkeen: samat → improvement-% IMPROVEMENTS.md:hen
4. **Token-migraatio:** axe-color-contrast violations 0:ssa (tai sama-määrä kuin ennen). Visuaalinen vertailu: Playwright screenshot ENNEN ja JÄLKEEN kaikilla päänäkymillä — `design-taste-frontend` reviewaa että mikään ei rikkoutunut visuaalisesti
5. **`/styleguide?dev=1` toimii:** screenshot @ 1440 + 375, kaikki komponentit näkyvät, tilat esitelty
6. **`/styleguide` ilman `?dev=1` tuotannossa:** näyttää 404
7. **`graphify update .`** koodi-muutosten jälkeen — uusi import-rakenne näkyy graphissa
8. SW-bumppi (uusi `css/tokens.css` + mahd. uusi `js/router.js` STATIC_ASSETSissa)
9. IMPROVEMENTS.md-rivi per item (A, B, C)

---

## 6. Pilkkominen istuntoihin (suositus)

Tämä on iso. Pilko:
- **Istunto 1 (B):** design tokens — luo `css/tokens.css`, migrate ~60 % hardcode-arvoja, commit
- **Istunto 2 (C):** `/styleguide`-sivu — pohjautuu istunnon 1 tokeneihin, commit
- **Istunto 3 (A):** bundle-split — eniten riskiä, omaa istuntoa varten + erityinen Playwright-regression-screenshotti-batch ENNEN/JÄLKEEN, commit

`/clear` istuntojen välissä. Jokainen on oma PR.

---

## 7. Lopputuotteen kriteeri

**A:** Landing avautuu nopeammin (mittari: LCP-parannus tai bundle-koko-parannus, raportoidaan).
**B:** Yksi token-rivi `css/tokens.css`:ssä on muutettavissa ja kaikki sitä käyttävät paikat päivittyvät. Tulevat featuret eivät keksi omia värejä.
**C:** Tuleva worker voi avata `?dev=1`-styleguide-sivun ja katsoa miltä button/card/modal pitäisi näyttää — ei keksi tyhjästä.
