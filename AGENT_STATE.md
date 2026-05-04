# Puheo Agent State

**Last updated:** 2026-05-04
**Current state:** L-CI-SW-CHECK shipped (PR-only spam tukittu — SW-check ajaa nyt myös push-eventissä HEAD~1-diffillä; npm run bump:sw autofix).

---

## Recent loops (last 5)

### L-CI-SW-CHECK — 2026-05-04 ✓ shipped
**Scope:** Käyttäjä sai PR-CI-failispostia jokaisesta auto/* PR:stä vaikka main pysyi vihreänä. Brief AGENT_PROMPT_LINT_CLEANUP.md väitti 10 ESLint-erroria — virheellinen, lint = 0 errors / 106 warnings. Oikea juurisyy: `scripts/check-sw-cache-version.js` käytti `origin/main`-baseä myös push-eventissä → main-pushissa diff oli aina tyhjä → check oli no-op mainissa, mutta PR-runeilla välillä failasi race-conditionissa (PR bumpasi v125→v126, mutta jossain hetkessä origin/main oli jo v126 ennen mergeä). Korjaus: skripti tunnistaa `GITHUB_EVENT_NAME=push` → diff vs `HEAD~1`. Lisätty `--fix`-flagi + `npm run bump:sw` autofix. CI-ymliin checkki ajetaan nyt molemmissa eventeissä.
**Files:** 3 (`scripts/check-sw-cache-version.js`, `package.json`, `.github/workflows/ci.yml`). **SW:** ei bumppia (STATIC_ASSETS ei muuttunut). **Tests:** 1064/1064 ✓. **CI on main:** vihreä (run 25335135098).
**Pending:** 106 lint-warningia siivoamatta (ei kaada CI:tä). Brief AGENT_PROMPT_LINT_CLEANUP.md voi arkistoida — sen oletukset olivat vanhentuneet.

### L-HOME-HOTFIX-3 — 2026-05-04 ✓ shipped
**Scope:** `app.html#screen-path` käärittyy `path-grid`-divaan jossa `path-main` (kurssipolku) + sticky `path-rail` (day-CTA + YO-valmius). Desktop ≥1024 px = 2 sarakkeen grid `minmax(0,1fr) 360px / gap 32`; mobile pysyy stackattuna. `dash-day-cta` käyttää uutta `.btn--cta--accent` -modifieria (turkoosi pohjalla, tumma teksti — ~13:1 kontrasti) joka on määritelty `css/components/button.css`:ssä — alkuperäinen `.btn--cta` (oppituntien sisällä) säilyy ennallaan. `js/screens/curriculum.js loadCurriculum()` auto-expandaa ensimmäisen unlocked + ei-vielä-mastered-kurssin (advance kun edellinen kertausPassed). `style.css .path-inner` padding `0 16px 48px`→`24 16 48` (tightens top); `.dash-greeting` `min-height 96`→`auto`, `margin-bottom 32`→`16`.
**Files:** 5 (`app.html`, `style.css`, `css/components/dashboard.css`, `css/components/button.css`, `js/screens/curriculum.js`) + sw + bundles. **SW:** v122→v123. **Tests:** 1064/1064 ✓. **Build:** clean.
**Pending:** 21st.dev sourcing-pass lesson-list/sticky-rail komponenteille deferattu (käytettiin olemassa olevia `.curr-lessons` ja flex-stack-patterneja). Per-lesson-status-endpoint säilyy ennallaan: `/api/curriculum/:k` palauttaa jo `lessons[].completed`-flagin; `current/locked`-statusta ei tarvittu sillä lukitut oppitunnit eivät näy listalla erikseen (renderCard avaa vain aktiivisen kurssin lessonit). Playwright + axe-sweep + design:design-critique workflow_dispatch-gated, käyttäjän tehtävä Vercel-deployn jälkeen.

### L-HOME-HOTFIX-2 — 2026-05-04 ✓ shipped
**Scope:** `.path-inner` 1080→1320px + margin-inline:auto + tasapainoinen padding (oikean kolmanneksen tyhjyys 1456px viewportilla katoaa). YO-valmius vaihdettu `/api/curriculum`-dataan: pct = completedLessons/totalLessons, masteredCells = kertausPassed-summa, totalCells = 8 (oli 14, oli SR-mastery). `dash-readiness-grid` 8-sarakkeinen. teachingPanel.js syncTrigger lisätty `screen-path`-haara joka renderöi "Miten Puheo toimii" -napin (data-mode=tutorial); open() näyttää 6-stepin staattisen `HOME_TUTORIAL_MD`-sisällön; oppitunnin sisällä nappi säilyy ennallaan. `app.html screen-path` järjestys: greeting → path-courses → btn--cta--mini → readiness → footer-grid (kurssipolku visuaalisesti dominoi).
**Files:** 5 (`app.html`, `style.css`, `css/components/dashboard.css`, `js/screens/dashboard.js`, `js/features/teachingPanel.js`) + sw + bundles + 1 testi. **SW:** v121→v122. **Tests:** 1064/1064 ✓. **Build:** clean.
**Pending:** 21st.dev sourcing-pass step-tutoriaali-komponentille deferattu (markdown-renderöinti riittää MVP:nä). Tutoriaali-copyn pedagoginen viilaus käyttäjän tehtävä `HOME_TUTORIAL_MD`-vakiossa.

### L-MERGE-DASH-PATH — 2026-05-04 ✓ shipped
**Scope:** Dashboard + path merged into single home. greeting/dash-day-cta/dash-readiness/dash-recent/dash-chart MOVED into #screen-path; legacy dashboard sub-cards (tutor, hero-grade, daily-challenge, weak-topics, heatmap, forecast, adaptive, ai-usage, writing-prog, modes, recommendations, full-exam, btn-dash-start, retake) kept as inert hidden DOM behind `<div hidden>`. curriculum.js renders into #path-courses-root; navigateTo("dashboard")→"path"; sidebar Oma sivu poistui, Oppimispolku ensimmäisenä; mobile Koti → data-nav="path"; loadDashboard() now show("screen-path") + dynamic-imports loadCurriculum.
**Files:** 4 (`app.html`, `js/main.js`, `js/screens/dashboard.js`, `js/screens/curriculum.js`) + bundles + sw. **SW:** v120→v121. **Tests:** 1064/1064 ✓. **Build:** clean.
**Pending:** YO-readiness-kortin uusi 21st.dev-pohjainen muotoilu (UPDATE 4 spec) + alarivi mini-chart-uudistus + 21st.dev sourcing-pass deferattu seuraavaan looppiin (L-MERGE-DASH-PATH-P2). Pre-existing `dash-readiness` markup käytössä toistaiseksi. Playwright + axe sweep odottaa workflow_dispatch-aukenemista.

### L-COURSE-1 — 2026-05-04 ✓ shipped
**Scope:** Infra — `schemas/lesson.json` + `scripts/validate-lessons.mjs` + `npm run validate:lessons`; `data/courses/kurssi_{1..8}/lesson_1.json` placeholderit; `routes/curriculum.js` `readPregeneratedLesson()` + `USE_PREGENERATED_LESSONS` env-flag; `js/screens/lessonRunner.js` vaihe-pohjainen runner (mastery-banneri, skip-link, side-panel, lesson-results YO-kokeessa-callout); `js/lib/lessonAdapter.js`; `css/components/lesson-runner.css`. Käyttäjän pre-written `PROMPT_GENERATE_LESSON.md` säilyy juuressa.
**Files:** 9 new + 5 modified. **SW:** v116→v117. **Tests:** 1064/1064 ✓. **Build:** clean.
**Pending:** Käyttäjä generoi sisältöä `PROMPT_GENERATE_LESSON.md`-promptilla batch-istunnoissa → `USE_PREGENERATED_LESSONS=true` Vercel-dashissa kun batch valmis. Playwright sweep deferattu (workflow_dispatch-gated).

### L-CAT-COLORS-1 — 2026-05-03 ✓ shipped
**Scope:** L-LIVE-AUDIT-P1 UPDATE 8 follow-up — `--cat-*` tokenit `:root`-tasolle (vocab/grammar/reading/writing/verbsprint), dark-theme override `[data-theme="dark"]`-blokkiin (-700 → -400 shadet AA-kontrastilla #0a0a0a:lla), `mode-page.css` raw-hex → token-referenssi.
**Files:** 3 (`style.css`, `css/components/mode-page.css`, `sw.js`) + bundles. **SW:** v115→v116. **Tests:** 1064/1064 ✓.

---

## Next loop

**Recommended:** L-COURSE-2 (Batch 1 generointi) tai L-HOME-HOTFIX-3-P2 — 21st.dev sourcing-pass lesson-list/sticky-rail-komponenteille + Playwright/axe-sweep neljällä viewportilla. Sen jälkeen step-tutoriaali-pass `HOME_TUTORIAL_MD`-sisällölle.

**Recurring blockers:** Playwright E2E gated since d3f5ca5; manual prod verify on käyttäjän tehtävä.

---

For older loop history (L-PLAN-1 through L-PLAN-7 + L-SECURITY-1+2 + hotfixes), see `docs/archive/AGENT_STATE_HISTORY.md`.
