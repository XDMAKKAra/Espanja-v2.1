# Handoff — Dashboard + tehtävien ulkonäön remontti

**Date:** 2026-05-18
**Previous work:** Landing-page (etusivu) on viety Old-Spain editorial-tasolle 7 PR-loopin yli (PR #62, #64, #65–#72). Etusivu, /espanja-yo-koe, /saksan-yo-koe, /ranskan-yo-koe, blog/, privacy/terms/refund kaikki yhtenäisellä Fraunces+Manrope + cream/terracotta/olive -paletilla. Käyttäjä on hyväksynyt etusivun tason ja sanonut nyt: **dashboard + tehtävien ulkonäkö seuraavaksi**.

---

## Tila tällä hetkellä

- **main on v174**, kaikki PR:t mergattu, e2e desktop 11/11 + vitest 1064/1064 läpi.
- Etusivu: `index.html` käyttää `landing-editorial-tokens.css` + `landing-editorial.css` -teemaa. Visuaalinen rytmi: hero (70/30 + illustration) → grade-flow (3-step writing card) → catalog (8 kurssia + lang-switch + ikonit) → proof (grader card + marginalia) → mitä saat (asymmetric 1+2) → testimonials (lead + 2 fragments + drop-cap) → pricing (3 tilted neo-textbook stamp cards) → FAQ → CTA (terracotta drenched + walker) → footer.
- App: `app.html` käyttää **vanhaa tumma-mint -teemaa** (`landing-tokens.css` + `landing.css` + app-bundle). App.html on **2300+ riviä HTMLää** + Web-app-bundle. Käyttäjä kirjautuu → näkee dashboardin, kurssikatalogin, oppituntinäkymän, kirjoitustehtävän, mallikokeen, asetukset.
- Skill-stack siivottu: puheo-finnish-voice + puheo-screen-template poistettu, FRONTEND-stack = `frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng`.
- humanizer-skill asennettu user-globaaliin (`~/.claude/skills/humanizer`).

## Mitä käyttäjä haluaa

Käyttäjän lyhyt, monitulkintainen ilmaisu: "dashboard + tehtävien ulkonäköön paremmin". Tulkitsen sen näin:

1. **Dashboard** = `app.html`:n etusivu (kirjautuneelle käyttäjälle). Sisältää nyt: tervehdys + streak + päivän haaste + sanasto-recall + kurssi-progress + suositellut harjoitukset. Käyttäjä haluaa saman Old-Spain-tason kuin landing.
2. **Tehtävien ulkonäkö** = harjoituspinnat: sanasto-MCQ, kielioppi-aukkotehtävät, luetun ymmärtäminen, kirjoitustehtävä + grader, mallikoe. Nämä asuvat `js/screens/*.js`:ssä + `css/components/*.css`:ssa. Tällä hetkellä tumma-mint, ei vastaa landingin paperitestbook-tunnelmaa.

## Konkreettinen scope ehdotus (älä lyö lukkoon, mutta hyvä lähtökohta)

### Vaihe 1 — Dashboard re-skin (1 loop)
- Kaapaa nykytila Playwrightilla (`tests/e2e-audit-current-landing.spec.js` mallina, mutta app.html:lle)
- Tunnista dashboard-säkmäärä: vasen kisko (rail), ylä-nav, päänäkymä, oikea sidebar/widgets, alanav (mobile)
- Adaptoi landing-editorial-tokens.css:n vars dashboardiin: lisää `body.app` -wrapper landing-editorial.css:ään joka kytkee Old-Spain-tokenit dashboard-säkmäärää
- Säilytä app-toiminallisuus (data-binding, screen-switching, modal-flow), vaihda vain visuaalinen taso
- Mikrodetaljit Emil-tason: card-press scale(0.97), spring-stagger dashboard-load, gentle skeleton-shimmer

### Vaihe 2 — Tehtävä-renderöijät re-skin (2–3 loopia)
- **Sanasto / monivalinta** (`js/renderers/monivalinta.js`, css/components/exercise.css): butyl-kortit, ei tumma-laatikko. Vastausvaihtoehdot kuin oppikirjan vaihtoehdoissa (a/b/c/d roomalaisilla numeroilla?). Correct/incorrect-tila terracotta vs olive.
- **Aukkotehtävät** (`js/renderers/aukkotehtava.js`): lause taittuu kuin oppikirjan sivulla, aukko = alleviivattu blank input, suorituspalaute Fraunces-italic-marginaliana.
- **Yhdistäminen** (`js/renderers/yhdistaminen.js`): viivat olive/terracotta, kortit kierrettyjä (rotate -1deg / 1deg) kuten pricing-tiers.
- **Käännös ja lauseen muodostus** (`js/renderers/kaannos.js`, `lauseenMuodostus.js`)
- **Korjaus** (`js/renderers/correction.js`): grader-tooltip-tyyli + rubric jo olemassa landing-proof-osiossa, adaptoi suoraan.
- **Kirjoitustehtävä** (`js/screens/writing.js`): textarea taittuu kuin paperi, AI-grading-feedback rubric-näytöllä kuten landing-proof-osio.
- **Mallikoe / täyskoe** (`js/screens/fullExam.js`): aikaraja + kahdeksan-osaa-progress + final report.

### Vaihe 3 — Lopullinen viimeistely (1 loop)
- Sivu-otsikot ja eyebrow-fontit Fraunces-italicilla
- Loading-skeletonit shimmer-efektillä Old-Spain-paletilla
- Empty states: marginalia-post-it-tyyli kuten landing
- Error states: terracotta-tinted, ei punainen

## Suositukseni implementointi-järjestys

Tee **Vaihe 1 ensin** kokonaisuudessaan, jaa siitä yksi PR. Lähestyminen:

1. **Auditoi nykyinen dashboard**: kirjoita `tests/e2e-audit-app-dashboard.spec.js` joka `localStorage.setItem('puheo_user_session', JSON.stringify({fake}))` + `await page.goto('/app.html#dashboard')` + screenshot 1440 + 390 viewporteilta.
2. **Lue mitä on**: `app.html` (HTMLää on ~2300 riviä mutta dashboard-sektio on hahmottettavissa), `js/screens/dashboard.js` (renderöinti), `css/components/dashboard.css`, `css/components/rail.css`, `css/components/app-shell.css`.
3. **Suunnittele tokenit**: lisää `body.app` -wrapper `landing-editorial.css`:ään joka kytkee Old-Spain-tokenit app-säkmäärän legacy-tokenneihin (samanlainen mappaus kuin `body.legal` ja `body.blog`).
4. **Vaihda fontit**: `app.html`:n head — Geist+Inter → Fraunces+Manrope.
5. **Säilytä app-toiminallisuus**: Älä koske `js/screens/*.js`:n loogisiin osiin, vain DOM-luokkanimet ja CSS.
6. **Test**: olemassa olevat e2e-testit (`tests/e2e-redesign-audit-app.spec.js`) pitää säilyä vihreinä.

## Skillit + työkalut

**Aina alussa (FRONTEND-stack):**
```
Skill: frontend-design
Skill: design-taste-frontend
Skill: ui-ux-pro-max
Skill: impeccable
Skill: emil-design-eng
```

**Kun kirjoittaa Suomi-tekstiä (microcopy, empty states, error messages):**
```
Skill: humanizer
```
Säännöt myös `memory/feedback_humanizer_required.md`:ssä — em-dashit kielletty, AI-brand-sanat kielletty (paitsi product-truth-kohdissa), rule-of-three vain aitoissa listoissa.

**21st.dev MCP inspiraatioon:**
```
mcp__magic__21st_magic_component_inspiration({
  searchQuery: "dashboard editorial textbook",
  message: "...full context..."
})
```
Komponentit eivät ole suoraan käytettävissä (React+Tailwind), mutta IDEAT (kallistus, hard-offset-shadow, neo-textbook-stamp) adaptoituvat vanilla-CSS:ään.

## Memory-säännöt jotka pätevät

Lue automaatista ladatusta `MEMORY.md`:stä:
- `feedback_landing_direction_2026_05_18.md` — Old-Spain palette spec
- `ship1_ai_slop_mistakes.md` — vältettävät patternit (tekoäly-brand-tasolla kielletty, product-truth OK)
- `feedback_humanizer_required.md` — kirjoitustarkistus
- `feedback_sw_cache_bump.md` — bump sw.js CACHE_VERSION kun STATIC_ASSETS muuttuu
- `feedback_auto_push_workflow.md` — gh PR squash + delete-branch (ei direct main push)
- `feedback_playwright_works_in_harness.md` — Playwright toimii Bash-toolista
- `project_target_languages_multi.md` — kolme kieltä (es/fr/de), ei pelkkä espanja
- `feedback_curriculum_uses_ytl_grades.md` — YTL-arvosanat I/A/B/C/M/E/L, EI CEFR

## Hyödyllisiä tiedostoja

| Tarkoitus | Tiedosto |
|---|---|
| Old-Spain CSS-tokenit | `css/landing-editorial-tokens.css` |
| Old-Spain componentit | `css/landing-editorial.css` |
| App entry HTML | `app.html` |
| Dashboard render | `js/screens/dashboard.js` |
| Dashboard CSS | `css/components/dashboard.css` |
| Rail/sidebar | `css/components/rail.css` |
| App shell layout | `css/components/app-shell.css` |
| Exercise base CSS | `css/components/exercise.css` |
| Mode page | `css/components/mode-page.css` |
| Results | `css/components/results.css` |
| Profile | `css/components/profile.css` |
| Onboarding | `css/components/onboarding-v3.css` |
| Renderöijät | `js/renderers/*.js` |
| Writing-grader | `js/screens/writing.js` |
| Mallikoe | `js/screens/fullExam.js` |
| Existing audit spec | `tests/e2e-redesign-audit-app.spec.js` |

## Aloita-prompt seuraavaan chatiin

```
Jatka Puheon työtä siitä mihin jäin 2026-05-18.

Lue ensin:
1. docs/superpowers/HANDOFF-2026-05-18-dashboard-exercise-ui.md
2. memory/MEMORY.md ja avaa siitä linkitetyt feedback-tiedostot

Tehtävä: aloita Vaihe 1, dashboard re-skin Old-Spain-tasolle.

Skill-stack FRONTEND-luokassa: kutsu frontend-design, design-taste-frontend,
ui-ux-pro-max, impeccable, emil-design-eng ENNEN ensimmäistä
Write/Edit/Bash-kutsua. Aloita vastaus rivillä "Skills invoked: ...".
Käytä humanizer-skilliä kun kirjoitat suomi-tekstiä.

Käytä myös 21st.dev MCP -toolia (mcp__magic__21st_magic_component_inspiration)
dashboard / sidebar / stat card -komponenttien inspiraatioon ennen koodia.

Implementation order:
1. Audit nykyinen dashboard Playwrightilla (kirjaudu localStorage-fakella,
   ota desktop + mobile screenshotit)
2. Lue: app.html dashboard-osio, js/screens/dashboard.js,
   css/components/dashboard.css, rail.css, app-shell.css
3. Lisää body.app -wrapper landing-editorial.css:ään (token-aliakset
   samaan tapaan kuin body.legal ja body.blog tekevät jo)
4. Vaihda app.html:n head-fontti Geist+Inter → Fraunces+Manrope
5. Kohdista dashboard-osio kerrallaan: greet-card, streak-pill,
   pillars/widgets, kurssi-progress, suositellut harjoitukset
6. Säilytä app-logiikka (data-binding, screen-switching), vaihda vain CSS
7. Bump sw.js CACHE_VERSION (v174 → v175)
8. Aja e2e-redesign-audit-app.spec.js, vitest, varmista että toiminnallisuus säilyy
9. Commit + PR + auto-merge via gh pr merge --squash --delete-branch
```
