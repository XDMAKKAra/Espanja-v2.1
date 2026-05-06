# Puheo Agent State

**Last updated:** 2026-05-06
**Current state:** L-LESSON-BATCH-7 shipped — kaikki 90 oppituntia 8 kurssissa generoitu, validoitu, review-tarkistettu. Batch 6 (K6 L7-12 + K7 L1-12, 18 lessonia) ja Batch 7 (K8 L1-12, 12 lessonia) generoitu Sonnet-workereilla rinnakkain canonical-promptilla, review-Sonnet löysi yhteensä P0=6, P1=17, P2=4 — kaikki P0+P1 korjattu Edit-toolilla. Kriittiset löydökset: K6L8 gap_fill "captura al carbono" (ei vakiintunut), K6L9 "dependeriamos" aksenttivirhe, K6L10 "hadistella" (ei suomea), K7L1 "mestariteen" sijamuotovirhe, K7L3 choices-duplikaatti, K8L3 gap_fill väärä accept-lista (diversidad ≠ kulttuuriperintö), K8L1 si-tyyppi-3 saliéramos (vaatii pluskvamperfekti subj.), K8L9 gap_fill template `{1}...{1}` ei rendautuisi. Iso-K8-worker stallasi 600s yhdellä 12-lessonin pyynnöllä → splitti 1+6+5 toimi puhtaasti. Validate exit 0 (90 tiedostoa).

---

## Recent loops (last 5)

### L-LESSON-BATCH-7 — 2026-05-06 ✓ shipped
**Scope:** K8 L1-12 (E-taso, Eximia cum laude — YO-koevalmiiksi). Iso 12-lessonin Sonnet-worker stallasi 600s ennen yhden tiedoston (L1) generointia → splitti 2 pienempään workeriin rinnakkain (L2-L7 + L8-L12). Curriculum K8 (lib/curriculumData.js): subjunktiivin imperfektin muodostus + si-lauseet tyyppi 2/3 + YO-sanasto (kaikki teemat) + aikamuotojen kertaus + pitkä mixed-aukkotehtävä + 2 reading + 2 writing + 2 test (täyssimulaatio + koko polun loppukoe). Review-Sonnet: P0=1, P1=7, P2=2. Kaikki P0+P1 korjattu: K8L3 gap_fill väärä accept (diversidad→patrimonio), K8L1 si-3 saliéramos→hubiéramos salido, K8L2 dependería mos→dependeríamos, K8L4 viajaré poistettu, K8L8 vocab englanti hyperconnectivity→yliyhdistyneisyys, K8L9 template {1}+{1}→{1}+{2}, K8L9 epätodelline→epätodellinen, K8L12 tinha (portugalia)→había.
**Files:** 12 generated. **Validate:** 90/90 ✓ 0 failures. **Tests:** ei ajettu (lesson-data ei vaikuta vitestiin).
**Pending:** Käyttäjän tehtävät: USE_PREGENERATED_LESSONS=true Vercel-dashiin → trigger redeploy → manuaalinen testi K1L1 (A), K3L1 (B), K5L1 (C), K7L1 (M), K8L1 (E). BUGS.md:hen ei lisätty uusia havaintoja — tunnetut UI-bugit (lesson-runner side-panel sijainti, skeleton-loader leveys, K1L7 OpenAI-fallback) ovat aiempien looppien tehtäviä.

### L-LESSON-BATCH-6 — 2026-05-06 ✓ shipped
**Scope:** K6 L7-12 (subjunktiivin imperfekti + si-lauseet) + K7 L1-12 (kulttuuri/historia/media/argumentointi, M-taso). 2 Sonnet-workeria rinnakkain. Review-Sonnet: P0=5, P1=10, P2=2. Kaikki P0+P1 korjattu Edit-toolilla. Kriittisin: K6L8 gap_fill "captura al carbono" (ei vakiintunut espanjalainen ilmaus, oikein "captura de carbono") → "tasa/fiscalidad". K6 systeeminen suomi-virhe "ruoapula"/"sulattuminen" korjattu node-skriptillä L8 ja L12 tiedostoissa. K7L3 MC-distractoreissa duplikaatti "trabaje" kahdesti → korjattu "trabajaría":ksi.
**Files:** 18 generated. **Validate:** 79/79 ✓.
**Pending:** Batch 7 (K8) — käynnistettiin tämän jälkeen, ks. L-LESSON-BATCH-7.

### L-LESSON-BATCH-5 — 2026-05-05 ✓ shipped
**Scope:** K5 L1-11 (futuuri+konditionaali) + K6 L1-6 (subjunktiivin preesens). 2 Sonnet-workeria rinnakkain → 17 lesson-tiedostoa. Review-Sonnet täydellä skill-setillä (puheo + 11 education-skilliä + ui-ux-pro-max + frontend-design + lessonRunner.js/lessonAdapter.js/lesson-runner.css). Löydökset: P0=4, P1=12, P2=8. Kaikki P0+kriittiset P1 korjattu Edit-toolilla. Brief päivitetty pysyvästi: pakollinen 16-skill-set, adaptiivisen vaikeuden vaiheittaiset taulukot (L≠vain enemmän, vaan vaikeampaa), frontend-renderöinti-tarkistus, REVIEW-PROMPTI-CANONICAL + WORKER-PROMPTI-CANONICAL.
**Files:** 17 generated + 1 brief modified. **Validate:** 62 lessons / 0 failures. **Tests:** ei ajettu (lesson-data ei vaikuta vitestiin).
**Pending:** Batch 6 (K6 L7-12 + K7 L1-12) ja Batch 7 (K8) — orchestrator voi käynnistää canonical-prompteilla. Manual frontend-testaus K5/K6-oppitunneilla USE_PREGENERATED_LESSONS=true ympäristössä.

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
