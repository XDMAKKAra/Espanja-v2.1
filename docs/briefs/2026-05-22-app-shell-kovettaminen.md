# BRIEF: App shell -kovettaminen v275

**Päivä:** 2026-05-22
**Versio:** v275
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v270 (Koeharjoitus 400) suositeltava ensin; ei overlappia v271/v272/v274:n kanssa jos noita ei vielä mergetty
**Lähde:** kokonaisaudit Agent B -raportti (2026-05-22)
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Tavoite

Korjaa app-puolen (`/app.html` ja sen näytöt) pienet anti-AI-slop -patternit ja a11y-aukot jotka audit löysi. Ei isoa redesignia — vain täsmäkorjauksia. Dashboard saa oman ison redesignin (v271). Brand-värin palautus on erikseen (v276). Tämä on välivaihe niiden välillä.

EI näkyvää muutosta käyttäjäkokemukseen muuten kuin että pikkudetaljit alkavat näyttää ammattilaisemmilta.

---

## Konteksti

Audit Agent B löysi app-puolelta 4 konkreettista pattern-ongelmaa joita ei oltu vielä korjattu:

1. **V6** — `<li class="path-toc__loading">Ladataan…</li>` perii italic-tyylin → skeleton- tai plain-loader
2. **V7** — `<h1 class="display display--serif">Hei, [username].</h1>` käyttää luokkaa `display--serif` jota ei ole määritelty CSS:ssä → Fraunces-fontti ladataan turhaan, h1 fallbackaa Interiin
3. **V9** — mode-cards (Sanasto / Kielioppi / Luetun ymmärtäminen / Kirjoitus / Koeharjoitus) puuttuvat `:focus-visible` -outline → keyboard-käyttäjä ei näe focusta
4. **V13** — `.sidebar-pro-badge` käyttää `--grad-pro` mint-gradienttia → contrast voi olla alle 4.5:1, eikä brand-väri brick `#A0341F` ole käytössä missään (sen palautus on erillinen v276)

Lisäksi audit löysi:
- **Mixed border-värit** (mint vs gray) — käytä yhtenäistä `--border` tokenia
- **`renderKpiTiles()` ei välttämättä kutsuta** dashboard.js:ssä — tämä on osa v271-dashboard-redesignia, EI tämän briefin scope

---

## Fixet

### V6 — `Ladataan…` italic-perintö

**Tiedosto:** `app.html:911`

**Nyt:**
```html
<li class="path-toc__loading">Ladataan&hellip;</li>
```

**Korjaus:** Kaksi vaihtoehtoa, valitse paras vaikutus / pienin diff:
- **A (suositus):** korvaa skeleton-loaderilla. Lisää CSS:
  ```css
  .path-toc__loading {
    display: block;
    height: 2.5rem;
    background: linear-gradient(90deg,
      var(--bg-card) 0%,
      var(--border-soft) 50%,
      var(--bg-card) 100%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
    border-radius: 6px;
    list-style: none;
  }
  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  ```
  Ja HTML:ssä tyhjennä teksti: `<li class="path-toc__loading" aria-label="Ladataan oppituntilista"></li>`
- **B (minimi):** säilytä teksti mutta override italic-perintö:
  ```css
  .path-toc__loading {
    font-style: normal;
    color: var(--text-muted);
    list-style: none;
  }
  ```

### V7 — `display--serif` -luokka määrittelemättä

**Tiedosto:** `app.html:890` ja CSS-tokens.css (rivi 125-alueella tarkista)

**Nyt:**
```html
<h1 class="display display--serif">Hei, [username].</h1>
```

**Tutkimusvaihe:**
1. Grep `display--serif` — onko CSS-määrittelyä missään?
2. Grep `font-family.*Fraunces` — missä Fraunces todella käytetään?
3. Luetaan `index.html` `<link href="fonts.googleapis.com/...Fraunces">` rivi — onko se vain landingissa vai myös app.html:ssä?

**Korjaus:**
- Jos `display--serif` ei ole missään CSS:ssä → joko poista koko luokka HTML:stä (h1 saa default fontin), TAI lisää tokens.css:ään:
  ```css
  .display--serif { font-family: "Fraunces", Georgia, serif; font-weight: 400; }
  ```
- Jos Fraunces-link on app.html:ssä mutta sitä ei oikeasti käytetä → poista linkki kokonaan (säästyy fontin lataus, nopeampi LCP)
- Jos Fraunces käytetään muuallakin app-puolella (esim. hero-tervehdys joka onkin tarkoitus) → säilytä mutta varmista että `display--serif` luokka todella aktivoi sen

Dashboard-redesign (v271) muuttaa tämän kuitenkin. Tee turvallisin: säilytä Fraunces-fontti app.html:ssä (sitä tarvitaan v271-redesignissa), mutta määrittele `display--serif` -luokka tai poista se h1:stä jotta tilanne on selkeä.

### V9 — Mode-cards :focus-visible

**Tiedosto:** `style.css` (etsi `.mode-btn`, `.mode-card`, tai vastaava selektori joka renderöi Sanasto/Kielioppi/Lukeminen/Kirjoitus/Koeharjoitus-kortit)

**Korjaus:** lisää CSS:
```css
.mode-btn:focus-visible,
.mode-card:focus-visible {
  outline: 2px solid var(--accent, var(--brand, #A0341F));
  outline-offset: 3px;
  border-radius: var(--radius-md, 12px); /* match the card itself */
}
```

**Varmista myös** että kortit ovat oikeasti tab-stop:
- Jos `<div role="button">` → on focusable jos `tabindex="0"`
- Jos `<button>` → automaattisesti focusable
- Jos `<a href>` → automaattisesti focusable

Jos kortit ovat klikattavia `<div>`-elementtejä ilman role/tabindex → korjaa myös se: muuta `<button>`-elementeiksi tai lisää `role="button" tabindex="0"` + keydown-handler (Enter + Space).

### V13 — Pro-badge contrast (ilman brand-värin palautusta vielä)

**Tiedosto:** `style.css:371-382` `.sidebar-pro-badge`

**Nyt:**
```css
.sidebar-pro-badge { background: var(--grad-pro); color: #fff; }
```

**Korjaus** (väliaikainen, brand-värin palautus on v276):
1. Tarkista DevTools Contrast-checkerillä mikä on nykyinen mint-gradientin alku- ja loppuvärit `#fff`-tekstillä
2. Jos contrast < 4.5:1 missä tahansa pisteessä → kovenna alkupistettä (esim. lähde mint sijaan tummemmasta sävystä)
3. Vaihtoehto B: vaihda `color: #fff` → `color: var(--text-on-accent, #1a1714)` jos taustaväri on vaalea
4. **ÄLÄ vielä vaihda brick #A0341F:ään** — se on v276:n työ. Tee VAIN contrast-fiksi tällä.

Lisää kommentti CSS:ään: `/* TODO(v276): replace --grad-pro with --brand-brick #A0341F to align with brand identity */`

### Border-värin yhtenäistys (P2)

**Tiedosto:** etsi grep `--border` JA `border:.*solid` koko app-puolen CSS:stä (`style.css`, `off-canvas-nav.css`, `digikirja.css`, tarvittavat muut)

**Ongelma:** mint `#D1FAE5` ja eri gray-sävyjä sekoittuvat. Audit löysi tämän.

**Korjaus:**
1. Käytä standardia: `var(--border)` kaikkialla, määrittele tokens.css:ssä `--border: oklch(94% 0.005 60)` (ei mintti, neutraali warm-light)
2. Jos `--border-strong` tarvitaan korostuksiin → `oklch(88% 0.008 60)`
3. Korvaa kaikki hard-koodit (`border: 1px solid #D1FAE5`, `border: 1px solid #eee`, jne.) tokenilla

**Älä tee tätä jos diff räjähtää käsiin** — silloin tämä on oma erillinen brief.

---

## Toteutus

1. **Baseline-snapshot:**
   - Kirjaudu testpro123, Playwright-screenshot Aloitus + jokainen mode-näyttö
   - Tallenna `docs/briefs/v275-baseline/`
2. **Fixet järjestyksessä:** V6 → V7 → V9 → V13 → (border-yhtenäistys vain jos diff pysyy hallinnassa)
3. **Per-fix verifiointi:** screenshot, vertaa baselineen — visuaalinen muutos pitää olla minimi (focus-outline näkyy vasta kun tabilla menee päälle, badge-väri muuttuu pikkasen)
4. **`npm run build`** — esbuild bundlet stagattu
5. **Bumppaa `sw.js` `CACHE_VERSION`** jos CSS-tiedostot ovat `STATIC_ASSETS`-listassa
6. **`node --check`** kaikille muokatuille JS-tiedostoille (jos koskenut)
7. **`npm test`** — kaikki passaa
8. **AI-slop-checklist** (memory `feedback_ai_slop_check_every_frontend.md`):
   - [ ] Ei italic-Fraunces missään pikku-UI:ssa
   - [ ] Ei "Ladataan…" italicilla
   - [ ] Focus-statet näkyvät mode-korteilla
   - [ ] Pro-badge contrast ≥4.5:1
   - [ ] Ei em-dashia suomi-tekstissä
9. **Manuaalinen tab-testi:** kirjaudu, paina Tab läpi → näkyykö focus jokaisella interaktiivisella elementillä

---

## Commit + PR

- **4 commitia 1 PR:ssä** (V6, V7, V9, V13 erikseen — helppo bisecata)
- PR-otsikko: `chore(app): app shell hardening v275`
- IMPROVEMENTS.md-rivi: `v275 — chore: app shell hardening (Ladataan italic pois, display--serif määritelty/poistettu, mode-cards focus-visible, Pro-badge contrast)`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ tee dashboard-redesignia — se on v271
- ÄLÄ vaihda Pro-badgea brick-väriin — se on v276
- ÄLÄ tee landing-muutoksia — landing on v274 (jo tehty)
- ÄLÄ refaktoroi mode-näyttöjen sisältöä, vain a11y/focus-fix
- ÄLÄ poista Fraunces-fonttia jos sitä ehkä tarvitaan v271:ssä — säilytä mutta määrittele luokka oikein
- ÄLÄ syytä cachea — testaa incognitossa
- ÄLÄ käytä em-dashia jos kirjoitat uutta microcopya
- ÄLÄ tee Vercel-promotea — chore, ei tuotantoon

## Onnistuminen

- [ ] Baseline-screenshotit otettu
- [ ] V6 + V7 + V9 + V13 toteutettu
- [ ] After-screenshotit otettu, ei visuaalisia regressioita muulla
- [ ] Manuaalinen tab-test PASS (focus näkyy kaikilla interaktiivisilla)
- [ ] DevTools contrast-checker: Pro-badge ≥4.5:1
- [ ] `npm run build` PASS
- [ ] `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu jos tarpeen
- [ ] 4 commitia, IMPROVEMENTS.md-rivi
- [ ] PR avattu, EI mergattu
