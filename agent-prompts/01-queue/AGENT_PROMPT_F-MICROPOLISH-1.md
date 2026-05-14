# F-MICROPOLISH-1 — Skeletons + mikro-anim + off-canvas-polish + landing footer

> **Aja Claude Codessa erillisessä istunnossa.** Lue `AGENT_PROMPT_STANDARDS.md` ENNEN kaikkea muuta. Tämä on **FRONTEND**-loop, neljä pientä polish-itemiä yhdessä paketissa.

---

## 1. Konteksti

Neljä erikseen pientä mutta yhdessä isoa polish-tehtävää. Ei muutoksia liiketoimintalogiikkaan, ei sisältöön, vain "tuntuu kalliilta" -kerros.

**Item A — Skeleton loaders lesson-runnerissa:** kun AI-vastaus latautuu, näkyy generic spinner. Korvaa skeleton-tilalla joka muistuttaa tulevaa sisältöä (otsikko-bar, 3 rivi-shimmer, nappi-paikat).

**Item B — Mikro-animaatiot oikea/väärä-feedbackiin:** vastauksen jälkeen näkyvä feedback on staattinen väri-flash. Korvaa lyhyellä spring-anim (oikein = vihreä rasti scale 0→1, väärin = punainen miinus scale 0→1 + 4 px shake).

**Item C — Off-canvas-navin polish:** auki olevassa mobile-navissa ei ole focus-trapia, body scroll ei lukkiudu, Esc ei sulje. Lisätään nämä.

**Item D — Landing footer:** `index.html`:n alaosa on tyhjä → uskottavuus kärsii. Lisätään footer (yhteystiedot, privacy, T&C, copyright, social-linkit jos olemassa).

---

## 2. Mitä tämä loop EI tee

- ❌ ÄLÄ koske lesson-runnerin logiikkaan — vain loading-tila
- ❌ ÄLÄ lisää uusia animation-kirjastoja (ei Lottie, ei framer)
- ❌ ÄLÄ refaktoroi off-canvas-nav-rakennetta — vain lisää focus-trap + scroll-lock + Esc
- ❌ ÄLÄ keksi privacy-/T&C-tekstejä — linkkaa olemassa oleviin sivuihin tai jätä placeholder `href="#"` + TODO-rivi IMPROVEMENTS.md:ään
- ❌ ÄLÄ koske landing-pageen muuten kuin footeriin

---

## 3. Skill-set (PAKOLLINEN)

### FRONTEND-stack
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `puheo-screen-template`
- `puheo-finnish-voice`
- `emil-design-eng` *(motion polish)*

### 21st.dev-sourcing
- **Skeleton loaders:** 21st.dev/s/skeleton, 21st.dev/s/loading
- **Success / error micro-feedback:** 21st.dev/s/checkmark, 21st.dev/s/toast, 21st.dev/s/feedback
- **Off-canvas / drawer + focus-trap:** 21st.dev/s/drawer, 21st.dev/s/sheet, 21st.dev/s/mobile-nav
- **Footer:** 21st.dev/s/footer (Linear, Stripe, Vercel -tasoa)

Screenshot 2+ per item → `references/app/micropolish/21stdev/`. Cite URLs.

---

## 4. Tekniset vaateet — per item

### Item A: Skeleton loaders
- Tunnista `js/screens/lessonRunner.js`:stä paikat joissa AI-call → tarkista nykyinen "loading"-UI
- Lisää CSS-luokat `.skeleton`, `.skeleton--text`, `.skeleton--button` (shimmer-keyframe `linear-gradient` 1.4 s loop)
- `prefers-reduced-motion: reduce` → ei shimmer, vain solid placeholder
- Käytä **3 vaihtoehtoista skeleton-layouttia**: vocab-tehtävä, grammar-fill, reading-task — kukin oma muoto
- Layout ei saa "hypätä" kun oikea sisältö tulee tilalle (sama korkeus + leveys)

### Item B: Mikro-animaatiot feedback
- Etsi exercise-runnerin "correct/incorrect"-feedback-koodit
- Luo SVG-rasti + miinus-iconin, mount feedback-konttiin
- Oikein: `transform: scale(0) → scale(1)` 320 ms `cubic-bezier(.34, 1.56, .64, 1)` (over-shoot)
- Väärin: sama scale + sen jälkeen `keyframes shake` 4×4 px 200 ms
- Ääni-feedback: **älä lisää** tässä loopissa (separate decision)
- `prefers-reduced-motion: reduce` → pelkkä opacity-fade 150 ms

### Item C: Off-canvas-polish
- Etsi `app.html`:stä mobile-nav-toggle (lisätty PR #42 mukaan `L-HERO-COUNTDOWN-AND-OFFCANVAS-1`-loopissa)
- Lisää:
  - **Focus trap:** kun nav aukeaa, tallenna `document.activeElement`, focus first focusable inside drawer. Tab/Shift+Tab kelaa drawer-sisällä. Sulkemisen jälkeen palautta focus tallennetulle.
  - **Body scroll lock:** `document.documentElement.style.overflow = 'hidden'` open, palauta close.
  - **Esc-näppäin:** sulkee navin.
  - **Outside click:** klikkaus backdrop-divistä → sulkee.
  - **`aria-hidden="true"`** drawer-ulkopuoliselle main-contentille kun avoinna.
- Vanilla JS, ei kirjastoa. Funktiot `trapFocus(el)`, `releaseFocus()`, `lockScroll()`, `unlockScroll()` `js/components/focusTrap.js`-modulissa.

### Item D: Landing footer
- Muokkaa `index.html` — lisää `<footer class="landing-footer">` ennen `</body>` (tai missä loogista)
- Sisältö 4 saraketta desktop, 1 sarake mobile:
  - **Puheo** — copyright + tagline
  - **Tuote** — Etusivu, Hinnoittelu, FAQ, Tietoa meistä *(linkit niihin sivuihin jos olemassa, muuten `href="#"` + TODO)*
  - **Lainoppi** — Privacy, T&C, Tilauksen peruutus
  - **Yhteys** — sähköposti (monamalou@gmail.com per user-context — TARKISTA käyttäjältä että tämä on julkinen contact-email, jos ei → `hei@puheo.fi` placeholder + TODO)
- Bottom-line: "© 2026 Puheo · YO-koe-oppimisalusta"
- Tyyli: matala kontrasti (`color: var(--text-muted)`), `border-top: 1px solid var(--border)`
- Käytä `puheo-finnish-voice`-skilliä KAIKKEEN copyyn

---

## 5. Verifiointi

> **Ennen committia: aja `_UI_UX_CHECKLIST.md` läpi.** Kaikki priority 1–7 OK tai N/A.

Erityishuomiot:
- **Skeleton-shimmer molemmissa modeissa**: light-mode gradient (`#E2E8F0 → #F1F5F9 → #E2E8F0`), dark-mode (`#1E293B → #334155 → #1E293B`). Eri arvot.
- **Väärin-feedback EI vain shake + punainen**: lisää näkyvä teksti ("Yritä uudelleen" tai oikea vastaus) + `aria-live="assertive"`. Color-as-only-indicator on priority 1 -violation.
- **Footer-linkit**: `text-decoration: underline` + `text-decoration-color: var(--text-muted)`, hover muuttaa väri täysikontrastiseksi. Ei pelkkä väri-ero.
- **Reduced-motion + skeleton**: ei "pause", vaan solid placeholder (`background: var(--surface-hover)`)
- **Focus-trap testi**: keyboard-only — Tab kelaa drawerissa, Shift+Tab takaisin, focus EI karkaa main-contentiin, Esc sulkee, focus palaa toggleeen
- **Mikro-anim SVG-rasti/miinus**: Lucide `Check` / `X` (ei emoji-✓/✗)
- **Touch target footer-linkeissä**: ≥ 44×44 px mobiilissa

1. **Playwright screenshot** @ 1440 + 375:
   - lesson-runner loading-tila (3 eri lesson-tyyppiä) — skeleton näkyy, ei spinneriä
   - oikein-feedback + väärin-feedback (gif/video-tallenne tai 3-frame screenshot)
   - mobile-nav auki + Esc-painalluksen jälkeen kiinni
   - landing footer @ 1440 + 375
2. **axe-core 0 violations** kaikilla muuttuneilla näkymillä.
3. **Keyboard-only nav:** avaa mobile-drawer ladonsta → Tab → varmista että focus ei karkaa pois drawer:ista. Esc → sulkeutuu, focus palaa toggleeen.
4. `design-taste-frontend` review skeleton-+ footer-screenshoteista.
5. `emil-design-eng` motion review: micro-anim-ajoitukset eivät tunnu "spring-overdose":lta.
6. **`prefers-reduced-motion: reduce` -test:** käännä media-query päälle DevToolsissa → kaikki anim pelkistyy.
7. SW-bumppi (uusi `js/components/focusTrap.js` + CSS-muutokset).
8. IMPROVEMENTS.md-rivi (yksi rivi per item, max 4 riviä yhteensä).

---

## 6. Lopputuotteen kriteeri

Käyttäjä avaa appin ja **huomaa pieniä yksityiskohtia** jotka tekevät siitä "kalliilta": skeleton joka pohjustaa tulevaa sisältöä, mini-rasti joka springaa, drawer joka käyttäytyy oikein, footer joka antaa landingille uskottavuuden. Mikään yksittäinen muutos ei ole iso, mutta yhdessä ne nostavat polish-tasoa selvästi.
