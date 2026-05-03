# Agent Prompt — L-PLAN-4
# UI-fixaus + SQL-migraatio + Streak-silta + Fast-leveling UI + V2-onboarding default

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. Standardilohko on pakollinen jokaiseen UPDATEen.**
2. `AGENT_STATE.md` — koko "Last completed loop" + "Next loop" + "What I just did" -lohkot
3. `CURRICULUM_SPEC.md` §4 (fast-track-säännöt) + §7 (tutor-äänen ohjeet)
4. `IMPROVEMENTS.md` viimeiset 50 riviä — deferred-itemit L-PLAN-1/2/3-blokeista

Skillit jotka aktivoidaan TÄSSÄ loopissa (lisäksi STANDARDS-listattu pohja):
- `puheo-screen-template`, `puheo-finnish-voice`, `puheo-ai-prompt`, `ui-ux-pro-max` — KAIKKI loopit
- `education/cognitive-load-analyser` — UPDATE 2 (scroll-bug) + UPDATE 4 (profile-menu) — älä ylikuormita yhden screenin elementtejä
- `education/flow-state-condition-designer` — UPDATE 6 (fast-leveling callout) — kanssaan suunniteltu choice-not-redirect -periaate
- `education/self-efficacy-builder-sequence` — UPDATE 6 + UPDATE 7 — viestien sävy, älä shame
- `design:ux-copy` — KAIKKI UPDATE (jokainen copy)
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen
- `design:design-critique` — Playwright-screenshotit lopussa
- `design:taste-frontend` jos saatavilla — käytä KAIKKEEN frontend-uudistukseen

21st.dev sourcing pakollinen: profile-dropdown, scroll-fix doesn't need new component, otherwise extend existing patterns.

Verify L-PLAN-1, L-PLAN-2, L-PLAN-3 are shipped: grep IMPROVEMENTS.md for [2026-04-28 L-PLAN-1], [2026-04-28 L-PLAN-2], [2026-04-29 L-PLAN-3]. If any block is missing, STOP ja raportoi käyttäjälle.

---

## Konteksti

Käyttäjä testasi sovellusta 2026-04-29 ja kirjasi seuraavat ongelmat (suora käännös):

1. **"Halusin tuon jutun tuolta oikealta pois"** — oikea paneeli (`.app-rail`) on liian täynnä. Käyttäjä haluaa oikeaan yläkulmaan vain pienen profiilinapin, jonka takaa avautuu profiilivalikko (Astra-AI -tyyliin: avatar + nimi + valikko: Asetukset / Tilastot / Kirjaudu ulos jne. — mutta Puheon omilla valinnoilla, ei "Buy app").
2. **"Puheoppi teksti ei näy hyvin tuosta sivusta ku se menee tonne ylös sekä näyttää muutenkin rumalta"** — Puheoppi-screenin H1-otsikko leikkautuu viewportin yläreunan taakse.
3. **"Avaan oppimispolun ja se näyttää 'ladataan oppitunteja...' mikä tämä on?"** — SQL-migraatiota ei ole ajettu Supabasessa. Curriculum-taulut puuttuvat tuotannosta. Koodi degradoi JS-fallbackiin (`tablesMissing()` -helper), mutta käyttäjälle näkyy stuck-loading-tila.
4. **"Sitten kun painan aloita esim tuo ensimmäinen menee piiloon tonne ylös, tämä toistuu nyt monessa eri kohtaa"** — scroll-jumps-to-top -bugi: aktiivinen kortti scrollaa pois viewportin yläpuolelle kun käyttäjä painaa "Aloita →" -nappia.
5. **Onboarding V2 ei ole default boot path** — V2-screenit on koodattu (L-PLAN-1) mutta vain `#/aloitus`-hash käynnistää ne. Default boot ohjaa vanhaan `screen-ob-*` -flowiin. L-PLAN-1 deferattiin tähän looppiin.

Lisäksi puuttuu:

6. **Streak ei nouse curriculum-suorituksesta** — `POST /api/curriculum/.../complete` ei kirjoita `user_sessions`-tauluun.
7. **Fast-leveling UI puuttuu frontendiltä** — backend palauttaa jo `fastTrack: true` (L-PLAN-3), mutta `js/screens/lessonResults.js` ei renderöi callouttia.

Tämä loop sulkee kuilun "koodi shipattu" → "käyttäjä näkee toimivan tuotteen". 7 surgical updatea. ÄLÄ lisää uusia ominaisuuksia tai sisältöä. Ei landing pageen koskemista.

---

## Skills + design plugins käyttöön

- `puheo-screen-template` — sticky headerit, scroll-anchorointi
- `puheo-finnish-voice` — kaikki copy
- `ui-ux-pro-max` — focus management, a11y, scroll restore

Design plugin skills (invoke by name):
- `design:ux-copy` — profile-dropdown -valikon copyt + fast-leveling callout-teksti
- `design:accessibility-review` — JOKAISEN updatesin jälkeen
- `design:design-critique` — Playwright-screenshotit dashboard / Puheoppi / Oppimispolku / lesson-results @ 1440 + 375

21st.dev sourcing rule profile-dropdownille:
1. Visit 21st.dev/s/dropdown-menu + 21st.dev/s/user-menu via Playwright
2. Screenshot 2 kandidaattia → `references/app/profile-menu/21stdev/`
3. Pick most restrained dark option matching Puheo's Linear-tier aesthetic
4. Port React+Tailwind → vanilla CSS matching existing token system
5. Cite exact 21st.dev component URL in IMPROVEMENTS.md

---

## UPDATE 1 — Supabase-migraatio (TÄRKEIN, tee ensin)

Migraatiotiedosto: `supabase/migrations/20260429_curriculum.sql`.

1. Lue tiedosto kokonaan. Varmista että se sisältää: `curriculum_kurssit`, `curriculum_lessons`, `teaching_pages`, `user_curriculum_progress`, ja kaikki 9 `user_profile`-saraketta (`self_reported_grade`, `target_grade`, `weak_areas`, `daily_goal_minutes`, `placement_confidence`, `placement_kurssi`, `tutor_assessment`, `tutor_greeting`, `tutor_greeting_at`, ja `current_grade`).
2. Jos jokin puuttuu, korjaa SQL.
3. Tulosta terminaaliin (ja kirjoita IMPROVEMENTS.md:hen) selkeä ohje:

```
=== ACTION REQUIRED — SUPABASE MIGRATION ===
Aja tämä SQL Supabase-dashboardin SQL-editorissa:
  supabase/migrations/20260429_curriculum.sql
URL: https://supabase.com/dashboard/project/_/sql

Idempotent (CREATE TABLE IF NOT EXISTS, ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
Aja KERRAN. Sen jälkeen "Ladataan oppitunteja..." -bugi häviää.
=== END ACTION ===
```

4. Verifiointi (kun käyttäjä on ajanut):
   - `curl http://localhost:3000/api/curriculum` → palauttaa rivit `curriculum_kurssit`-taulusta (ei JS-mirroria)
   - `curl http://localhost:3000/api/curriculum/kurssi_1` → palauttaa 10 oppituntia
   - Server-logit: ei `tablesMissing` -varoituksia
   - Rivien määrät: 8 `curriculum_kurssit`, 90 `curriculum_lessons`

5. Merkitse L-PLAN-1, L-PLAN-2, L-PLAN-3 -loopien deferred migraatio-itemit ratkaistuiksi IMPROVEMENTS.md:ssä.

Jos käyttäjä ei ole ajanut migraatiota tämän loopin alkaessa: tulosta ACTION REQUIRED selkeästi sekä terminaaliin että AGENT_STATE.md:hen, ja jatka muihin updateihin (kaikki muu toimii JS-fallbackilla).

---

## UPDATE 2 — Scroll-to-top-on-click -bugi

Käyttäjä raportoi: "kun painan aloita esim tuo ensimmäinen menee piiloon tonne ylös, tämä että menee piiloon ylös toistuu nyt monessa eri kohtaa".

### Diagnoosi
1. Todennäköinen juurisyy: screen-switch tai in-screen state change kutsuu `window.scrollTo(0, 0)` TAI `element.scrollIntoView({ block: "start" })` ilman sticky-header-offsettia → kohde scrollaa fixed-bar:in TAAKSE.
2. Grep koodista: `scrollTo\(`, `scrollIntoView`, `window.scrollY`, `scrollTop = 0`. Auditoi jokainen call site.
3. Tarkista `js/main.js` showScreen / navigateTo logiikka — resetoiko se scrollin joka navigaatiossa?

### Korjauspolitiikka
- **Screen change**: scrollaa uuden screenin scroll-container ylös, MUTTA huomioi sticky-headerin korkeus. Käytä `scrollIntoView({ block: "start" })` VAIN elementeillä joilla on `scroll-margin-top` CSS:ssä.
- **In-screen state expansion** (esim. Oppimispolku-kurssikortin laajennus): ÄLÄ scrollaa. Kortti pysyy paikallaan, lista flow:aa alle.
- **Lesson "Aloita →" CTA**: navigoi `#screen-lesson`-screenille ja resetoi sen scroll yläosaan (sticky-bar-offset huomioiden).

### Globaali CSS-sääntö
Lisää tokens-tiedostoon (löydä `--accent` ja muut tokenit):
```css
:root {
  --header-height: 72px; /* tai todellinen sticky-headerin korkeus */
}
```

Lisää globaaliin CSS:ään:
```css
.screen h1,
.screen h2,
.screen [data-scroll-anchor] {
  scroll-margin-top: var(--header-height);
}
```

### Verifiointi
- Puheoppi → tap topic 01 Sekaisin → tap topic 02 Ser vs Estar — kumpikaan ei katoa viewportin yläpuolelle
- Oppimispolku → tap kurssi 1 to expand — kurssikortti pysyy paikallaan, oppituntilista laajenee alle
- Oppimispolku → tap lesson 1 → navigoi `#screen-lesson`, otsikko näkyy yläosassa
- Sanasto / Kirjoittaminen / Luetun ymmärt. — kaikki välilehdet aukeavat ilman scroll-jumpia

---

## UPDATE 3 — Puheoppi-screenin otsikon layout-fix

Käyttäjä: "puheoppi teksti ei näy hyvin tuosta sivusta ku se menee tonne ylös sekä näyttää muutenkin rumalta".

### Diagnoosi
1. Grep `app.html` Puheoppi-screenin id:lle (todennäköisesti `#screen-grammar`, `#screen-puheoppi` tai `#screen-grammarpath`).
2. Lue screenin HTML-rakenne + linkitetty CSS.
3. Reproducoi Playwrightilla 1440×900 — avaa screen, screenshot, vahvista bugi.
4. Todennäköiset juurisyyt:
   - `position: sticky` -header ilman `top`-offsettia tai scroll-containerissa joka on `overflow-y: hidden`
   - Otsikko flex-containerissa joka sallii `min-height: 0` -propagaation
   - `padding-top: 0` main-scroll-alueella samalla kun fixed-top-bar peittää otsikon
   - Screen scrollaa sisäsäiliössä mutta otsikko on ulompana
5. Korjaa todellinen juurisyy. ÄLÄ band-aid `margin-top: 100px`.

### Hyväksyttävät korjauspatternit
- Sticky-otsikko `top: 0` + `var(--surface)` tausta + border-bottom joka fade-in scrollatessa
- Oikea `padding-top` joka vastaa fixed-bar:n korkeutta
- Restrukturoi flex/grid niin että otsikko osallistuu scroll-anchored top-zoneen
- Jos otsikko on scroll-containerissa, vaihda `align-self` tai `position` niin ettei se liiku sisällön mukana

### Apply
- `puheo-screen-template` card-layout
- H1 = "Puheoppi", subtitle alla
- ~40 px display font, 32 px bottom-margin topic-listalle
- axe 0 violations

---

## UPDATE 4 — Profile-button korvaa oikean paneelin

Käyttäjä: "Halusin tuon jutun tuolta oikealta pois. Haluan tuonne ykös oikealla vain pienen napin mistä pääsen profiilini josta aukeaa esim tällänen näkymä mutta tietenkin mitä miellä on eli ei esim ole mitään apppia."

### Tiedostot joita kosketaan
- `app.html` — poista `.app-rail`-contentti (paitsi mahdollinen top user-chip jos tahdotaan säilyttää nykyinen sijainti); restrukturoi top-bar niin että profile-button on `<main>`-headerin oikeassa yläkulmassa
- `css/components/app-shell.css` (tai missä rail-CSS on — grep `.app-rail`) — collapse rail-leveys 0:aan TAI poista grid-column kokonaan. Palauta horisontaalinen tila main-contentille.
- `js/screens/dashboard.js` — poista rail-spesifinen render (Pro card, daily-progress, word-of-day)
- `js/main.js` — wire profile-button click → toggle dropdown
- **NEW:** `js/features/profileMenu.js` — dropdown-logiikka
- **NEW:** `css/components/profile-menu.css` — dropdown-tyylit

### Profile-button (top-right corner of header, ~40px circle)
- 36px gradient avatar (reuse existing avatar-logic from sidebar-user) with user's initials
- Hover: subtle scale 1.02 + accent ring
- Click: toggle dropdown below
- Keyboard: Enter/Space avaa, ArrowDown siirtää focus ensimmäiseen menu-itemiin, Escape sulkee

### Dropdown-menu (sourced from 21st.dev per rule above)
- Position: absolute, anchored top-right under button, gap 8px
- Width: ~260px
- Background: `var(--surface-elevated)`, border `var(--border)`, border-radius 12px, box-shadow large
- z-index: 1000

Itemit (tässä järjestyksessä, suomeksi `puheo-finnish-voice`-tyyliin):
1. **Top section** (ei item-ikonia, vain identiteetti): avatar 48px + display name + email muted small
2. — separator —
3. `Oma sivu` (Lucide: User) → `#/oma-sivu`
4. `Asetukset` (Lucide: Settings) → `#/asetukset`
5. `Tilastot` (Lucide: BarChart) → `#/tilastot` JOS screen on olemassa, muuten omit
6. — separator —
7. **Free user only:** `Päivitä Pro` (Lucide: Sparkles, accent color) → existing startCheckout flow
8. `Kirjaudu ulos` (Lucide: LogOut, in `--warn` tai `--text-muted`) → existing logout flow

### A11y
- Click outside / Escape sulkee
- ArrowUp/ArrowDown navigoi
- Enter aktivoi
- Tab siirtää focusin normaalisti (EI focus-trap — sulkeutuu Tab-poistuessa luonnollisen flow:n säilyttämiseksi)
- `aria-expanded` napissa, `role="menu"` + `role="menuitem"`, `aria-labelledby` linkki takaisin nappiin

### Mobile (<880px)
- Sama dropdown, mutta anchored full-width top-bar:n alle, samat itemit
- Profile-button pysyy top-right

### KRIITTINEN
Oikealla paneelissa oli streak-laskuri + readiness-rengas. Dashboard-hero näyttää jo streakin `dash-greeting` -osiossa per L41. Verifioi että streak näkyy edelleen greetingissä. Jos ei, surface se greetingiin ennen kuin poistat railin.

axe 0 violations dashboard @ 1440 + 375 menu auki. Tab-järjestys: skip-link → top-nav → main content → profile-button → menu-itemit.

---

## UPDATE 5 — Streak-silta curriculum-suorituksesta

`POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete` upsertaa `user_curriculum_progress`-tauluun mutta ei kirjoita `user_sessions`-tauluun → streak ei nouse.

### Korjaus `routes/curriculum.js`:ssä, `/complete`-endpointissa, heti onnistuneen upsert-kutsun jälkeen:

```js
// Kirjaa curriculum-suoritus myös user_sessions-tauluun streak-laskuria varten
try {
  await supabase.from('user_sessions').insert({
    user_id: req.user.id,
    mode: 'curriculum',
    score_pct: Math.round((scoreCorrect / scoreTotal) * 100),
    duration_seconds: durationSeconds ?? null,
    created_at: new Date().toISOString()
  });
} catch (err) {
  // Ei kaada koko endpointtia — log ja jatka
  console.warn('[curriculum/complete] streak insert failed:', err.message);
}
```

**Tarkista:** `user_sessions`-taulun rakenne. Lue `supabase.js` tai `routes/progress.js` miten muut moodit kirjoittavat sinne. Käytä TÄSMÄLLEEN samaa rakennetta. Jos kentät ovat eri (`score` vs `score_pct`, `session_mode` vs `mode`), sovita.

Frontend (`js/screens/lessonResults.js`) voi lähettää `durationSeconds` POST-bodyssa — lisää jos helppo, muuten null.

### Testi
`scripts/agent-test/lplan4-streak-bridge.mjs`. Mock `/api/curriculum/kurssi_1/lesson/1/complete` ja varmista että response sisältää `tutorMessage` (string) ja että server-logissa näkyy onnistunut `user_sessions` insert.

---

## UPDATE 6 — Fast-leveling callout UI

Spec (CURRICULUM_SPEC §4): jos oppilas saa >90 % kurssin ensimmäisellä oppitunnilla (`lessonIndex === 0` ja `score/total > 0.9`), POST `/complete` palauttaa `fastTrack: true` (jo implementoitu L-PLAN-3:ssa). Frontend pitää reagoida.

### `js/screens/lessonResults.js`, kun `fastTrack === true`

Näytä callout-kortti tuloskortin alapuolella ENNEN "Aloita next kurssi" -nappia:

```html
<div class="lesson-results__fast-track" role="alert">
  <span class="lesson-results__fast-track-icon">⚡</span>
  <p class="lesson-results__fast-track-text">
    Tämä vaikuttaa tutulta — tehdäänkö suoraan kertaustesti?
  </p>
  <div class="lesson-results__fast-track-actions">
    <button class="btn btn--accent" id="btn-fast-track-yes">
      Siirry kertaustestiin →
    </button>
    <button class="btn btn--ghost" id="btn-fast-track-no">
      Jatka järjestyksessä
    </button>
  </div>
</div>
```

### Logiikka

`btn-fast-track-yes`:
- Hae kurssin oppituntien määrä (`/api/curriculum/:kurssiKey` → `lessons.length`)
- Navigoi suoraan viimeiselle oppitunnille (kertaustesti): `loadLesson(kurssiKey, lessonsCount - 1)`

`btn-fast-track-no`:
- Navigoi normaalisti seuraavalle oppitunnille (index 1): `loadLesson(kurssiKey, 1)`

### CSS (`css/components/curriculum.css`)

Fast-track callout:
- `--accent-soft` tausta, `--accent` vasen border 3px, 16px padding
- Ikoni 24px, teksti 16px `--text`, napit rinnakkain (flex gap 8px), pienemmällä viewportilla stack
- `prefers-reduced-motion`: ei animaatiota

---

## UPDATE 7 — Onboarding V2 default boot pathiksi

Currently `js/main.js`'s `checkOnboarding()` (or equivalent) routes new users to V1. V2 reachable only via `#/aloitus` hash.

### Steps
1. Grep `js/main.js` ja `js/screens/auth.js` for `onboarding_completed`, `screen-ob-`, `showOnboardingV2`, `#/aloitus`. Map current routing.
2. After successful registration → set `onboarding_completed: false` in `user_profile`, then route to `#/aloitus` (jo triggeröi `showOnboardingV2()`).
3. On any logged-in boot, if `user_profile.onboarding_completed === false` → automatically route to `#/aloitus` instead of dashboard. Tämä handlaa mid-onboarding refresh -casen.
4. After OB-4 finish CTA: `onboarding_completed: true` AND if anonymous, redirect to `#/rekisteroidy` with result stashed in sessionStorage (tämä saattaa jo toimia — verifioi).
5. Comment-out (ÄLÄ poista) legacy `screen-ob-*` -screen-elementit `app.html`:ssä SEN JÄLKEEN kun olet verifioinut V2:n kattavan kaiken funktionaalisuuden. Merkitse HTML-kommenttina `<!-- LEGACY V1 ONBOARDING — kept for now, remove in L-PLAN-8 -->` ja poista `js/main.js` -bootista referenssit.

ÄLÄ poista `screen-ob-*` JS-moduuleita tässä loopissa — vain flippaa routing. Dead-code-cleanup tulee myöhemmässä loopissa.

After this update: brand-new register → V2 OB-1 → OB-2 → OB-3 → OB-4 → dashboard.

### Testi
`scripts/agent-test/lplan4-onboarding-boot.mjs` — lataa `/app.html` ilman `localStorage.puheo_onboarding_completed`, varmista että `#screen-ob1-profile` näkyy.

---

## UPDATE 8 — Kurssi 1 end-to-end Playwright-testi

Kirjoita `scripts/agent-test/lplan4-kurssi1-e2e.mjs`.

Mock-autentikoituu (tai käyttää olemassa olevaa mock-rakennetta — `serviceWorkers: "block"` + `/api/*` route-stubeja).

Testaa järjestyksessä:
1. Lataa `/app.html`, varmista onboarding-screen (V2) näkyy
2. Simuloi onboarding läpi (täytä OB-1 kentät, klikkaa eteenpäin)
3. Navigoi Oppimispolku-screenille (`data-nav="path"`)
4. Varmista Kurssi 1 on auki (ei `aria-disabled`)
5. Klikkaa Kurssi 1 → lesson 1 → `#screen-lesson` näkyy ja teaching page latautuu (mock `/api/curriculum/kurssi_1/lesson/0` → palauta fixture)
6. Klikkaa "Aloita harjoittelu" → varmista oikea exercise-screen avautuu
7. Mock `POST /api/curriculum/kurssi_1/lesson/0/complete` → palauta `{ tutorMessage: "Hyvin menee!", fastTrack: false, kurssiComplete: false }`
8. Varmista `#screen-lesson-results` näkyy, `tutorMessage` renderöityy
9. **Lisätesti UPDATE 4 verifiointiin:** profile-button näkyy top-right, click avaa dropdown, Escape sulkee
10. **Lisätesti UPDATE 2 verifiointiin:** Puheoppi → klikkaa "Sekaisin" topic — kortti pysyy näkyvissä (ei scrollaa pois)

Tallenna screenshotit: `loop-lplan4-{onboarding,profile-menu,puheoppi,path,lesson,results}.png`.

---

## UPDATE 9 — axe-sweep

Aja axe-core kaikilla L-PLAN-1/2/3/4-loopissa lisätyillä screeneillä:
- `#screen-ob1-profile`, `#screen-ob2-test`, `#screen-ob3-assessment`, `#screen-ob4-plan`
- `#screen-path` (Oppimispolku)
- `#screen-lesson`
- `#screen-lesson-results`
- Dashboard with profile-menu open
- Puheoppi (sticky header)

Viewportit: 1440×900 + 375×812. Tavoite: **0 violations**. Korjaa kaikki.

---

## ORDER

1. UPDATE 1 ensin (DB-migraatio) — kaikki muu riippuu tästä
2. UPDATE 2 (scroll-bug) — pure JS/CSS, low risk, fixes user pain immediately
3. UPDATE 3 (Puheoppi layout) — pure CSS
4. UPDATE 4 (profile-button + remove rail) — biggest UI change, do once scroll/layout fixes are in
5. UPDATE 5 (streak-silta) — pure backend, low risk
6. UPDATE 6 (fast-leveling callout) — pure frontend, depends on backend response shape
7. UPDATE 7 (onboarding default flip) — needs DB columns from UPDATE 1
8. UPDATE 8 (e2e-testi) — verifies kaikki edellä
9. UPDATE 9 (axe-sweep) — fixes any remaining a11y issues
10. Kirjoita IMPROVEMENTS.md -rivit, yksi per UPDATE, prefix `[2026-04-29 L-PLAN-4]`
11. Päivitä AGENT_STATE.md: `Last completed loop: L-PLAN-4`, `Next loop: L-PLAN-5 (lesson screen overhaul — teaching content + topic-locked exercises). Read AGENT_PROMPT_LPLAN5.md before starting.`

---

## Ei tehdä tässä loopissa
- Uusia kurssimateriaaleja tai AI-generoitua sisältöä
- Landing-page muutoksia
- Dark theme -polish (L52–L55)
- Maksujärjestelmän muutoksia
- Tavoitepohjaista vaikeutta (tulee L-PLAN-6:ssa)
- Kumulatiivista kertausta (tulee L-PLAN-7:ssa)
- Lesson-screenin teaching-content -overhaulia (tulee L-PLAN-5:ssa)

---

## Valmis kun
- [ ] `supabase/migrations/20260429_curriculum.sql` tarkistettu + ohjeet tulostettu IMPROVEMENTS.md:hen
- [ ] Scroll-jumps-to-top -bugi korjattu, verifioitu Puheoppi + Oppimispolku + lesson-screen
- [ ] Puheoppi-otsikko ei enää clippa
- [ ] Profile-button toimii, oikea rail poistettu, dropdown-valikko a11y-kunnossa
- [ ] Streak-silta lisätty, testattu
- [ ] Fast-leveling callout renderöityy kun `fastTrack === true`
- [ ] Onboarding V2 on default boot path
- [ ] Kurssi 1 e2e-testi ajaa läpi ilman page-erroreita
- [ ] axe 0 violations kaikilla uusilla / muutetuilla screeneillä
- [ ] `AGENT_STATE.md` päivitetty
- [ ] Yksi `IMPROVEMENTS.md` -rivi per UPDATE formaatilla `[2026-04-29 L-PLAN-4]`
- [ ] SW bumped (v98 → v99) jos STATIC_ASSETS muuttui (uudet `profileMenu.js` + `profile-menu.css`)
