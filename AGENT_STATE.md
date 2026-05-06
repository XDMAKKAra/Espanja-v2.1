# Puheo Agent State

**Last updated:** 2026-05-06
**Current state:** L-RUFLO-LOOP-5 AUDIT-PASS — npm/node ei saatavilla shellissä (PATH-ongelma). validate:lessons 90/90 ✓. SW STATIC_ASSETS: AUDIT-3 löytyi (/landing.css väärä polku; index.html lataa /css/landing.css + /css/landing-tokens.css). BUGS.md päivitetty AUDIT-osiolla + P0-P1 ✓-merkinnöillä.

---

## Recent loops (last 5)

### L-RUFLO-LOOP-5 — 2026-05-06 ✓ audit-pass
**Scope:** AUDIT-PASS — ei koodimuutoksia. npm/node ei saatavilla shellissä → audit/lint/test deferred käyttäjälle. validate:lessons: 90/90 ✓ (PowerShell JSON parse). SW STATIC_ASSETS: 77 polkua tarkistettu, 0 dead paths. AUDIT-3: `/landing.css` (root) väärässä polussa SW:ssä — index.html lataa `/css/landing.css` + `/css/landing-tokens.css` joita ei cachata. Bundled JS/CSS (27 JS + 11 CSS tiedostoa) oikein pois STATIC_ASSETS:sta (app.bundle.js/css:ssä). BUGS.md: AUDIT-osio lisätty, P0-1/2/3/4/5/6 ja P1-1/3/5 ✓-merkitty.
**Files:** `BUGS.md`, `AGENT_STATE.md`, `IMPROVEMENTS.md`. **SW:** ei bumppia (ei koodimuutoksia). **Tests:** ei ajettu (npm ei saatavilla). **Pending:** käyttäjä ajaa npm audit + npm run lint + npm test; AUDIT-3 SW-fix seuraavassa loopissa.

### L-RUFLO-LOOP-4 — 2026-05-06 ✓ shipped
**Scope:** P1-1 (Kehitys empty-state copy) + P1-3 (grammar/reading results hero score + stats strip + coach line + celebration class) + P1-5 (dark mode `.option-btn.correct/.wrong` kontrasti → `color:var(--ink)` dark-mode override). CSS: `results__score--good/warn/low` toneluokat + spring animation ≥80%, `resScoreGood`-keyframe.
**Files:** `app.html`, `app.js`, `js/screens/vocab.js`, `style.css`, `css/components/results.css`, `sw.js`. **SW:** v129→v130. **Tests:** node/npm ei saatavilla — ei ajettu. **Pending:** npm test + Playwright-screenshot käyttäjän tehtävä.

## Recent loops (older)

### L-RUFLO-LOOP-3 — 2026-05-06 ✓ shipped
**Scope:** L-HOME-COURSE-VISIBILITY — etusivulle kurssien näkyvyys. Lisätty `<section id="kurssit">` 8 kurssikorttia (K1-K8) lesson_count + YO-taso per kurssi (curriculumData.js kanoninen lähde). Lisätty "Kurssit"-nav-linkki + footer-linkki. 4-col grid (→2-col 1080px →1-col 580px). course-card__badge --a/--b/--c/--m/--e taso-indikaattorit.
**Files:** `index.html`, `css/landing.css`, `sw.js`. **SW:** v128→v129 (index.html + landing.css molemmat STATIC_ASSETS). **Tests:** node ei saatavilla tässä shellissä — ei ajettu. **Pending:** npm test + Playwright-screenshot + axe-sweep käyttäjän tehtävä.

### L-RUFLO-LOOP-2 — 2026-05-06 ✓ shipped
**Scope:** P0-2 (CSP fonts) + P0-4 (landing 404) + P0-5 (placement heading aria-busy) + P0-6 (feature-dots tablist). P0-2: server.js CSP jo kunnossa, ei muutoksia. P0-4: PostHog 404 on eu-assets CDN config — analytics.js jo resilientti (try/catch + key-gate). P0-6: feature-dots role="tablist" poistettu index.html:stä aiemmassa loopissa — ei muutoksia. P0-5: app.html `aria-busy="true"` lisätty + placement.js 5 kohtaa päivitetty (removeAttribute/setAttribute).
**Files:** `app.html`, `js/screens/placement.js`, `sw.js`. **SW:** v127→v128 (app.html on STATIC_ASSETS). **Tests:** 1063/1064 (pre-existing flaky, ei regressioita). **Pending:** Vercel redeploy CSP:lle.

### L-RUFLO-LOOP-1 — 2026-05-06 ✓ shipped
**Scope:** P0-1 (Loading…-sweep → Finnish skeletons + aria) + P0-3 (greeting-fallback "Hei!" eikä "Hei, ."). Loading sweep: kaikki aiemmat kutsut jo suomeksi; lisätty `role="status" aria-live="polite"` `#loading-text`-elementille, `aria-hidden="true"` spinnerille, `aria-busy="true"` `.loading-inner`:lle. Default loading-teksti "Luodaan tehtäviä…" → "Ladataan…". Greeting: `#dash-greeting-punct` id:lle; kun `name=""` → `punct.textContent="!"` → "Hei!"; kun name=email-prefix → "Hei, eero.".
**Files:** `app.html`, `js/screens/dashboard.js`, `sw.js`. **SW:** v126→v127. **Tests:** 1063/1064 (1 pre-existing flaky email-timeout, ei regressioita). **Build:** ei ajettu (ei bundlea muutettu).
**Pending:** Muut BUGS.md P0-bugit (P0-2 CSP, P0-4 404, P0-5 placement-heading, P0-6 landing-tablist). No new UI component — copy/conditional only per brief.

### L-LESSON-BATCH-7 — 2026-05-06 ✓ shipped
**Scope:** K8 L1-12 (E-taso, Eximia cum laude — YO-koevalmiiksi). Review-Sonnet: P0=1, P1=7, P2=2. Kaikki P0+P1 korjattu: K8L3 gap_fill väärä accept (diversidad→patrimonio), K8L1 si-3 saliéramos→hubiéramos salido, K8L2 dependería mos→dependeríamos, K8L4 viajaré poistettu, K8L8 vocab englanti→suomi, K8L9 template {1}+{1}→{1}+{2}, K8L9 epätodelline→epätodellinen, K8L12 tinha→había.
**Files:** 12 generated. **Validate:** 90/90 ✓. **Tests:** ei ajettu (lesson-data ei vaikuta vitestiin).
**Pending:** USE_PREGENERATED_LESSONS=true Vercel-dashiin + manuaalinen testi K1L1/K3L1/K5L1/K7L1/K8L1.

---

## Next loop

**Recommended:** L-RUFLO-LOOP-6 — (1) AUDIT-3 SW-fix: korvaa `/landing.css` → `/css/landing.css` + `/css/landing-tokens.css` + bump SW v130→v131. (2) P1-kirjo: P1-2 (exercise island), P1-4 (writing disabled-contrast), P1-6 (heading order), P1-12 (mode page accents). (3) Käyttäjä ajaa npm audit/lint/test ensin ja syöttää tulokset takaisin.

**Recurring blockers:** Playwright E2E gated since d3f5ca5; manual prod verify on käyttäjän tehtävä. Vercel redeploy vaaditaan ennen CSP-headers-tarkistusta tuotannossa.

---

For older loop history (L-PLAN-1 through L-HOME-HOTFIX-3 + L-MERGE-DASH-PATH + L-COURSE-1 + L-CAT-COLORS-1), see `docs/archive/AGENT_STATE_HISTORY.md`.
