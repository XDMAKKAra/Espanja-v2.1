# Puheo Agent State

**Last updated:** 2026-05-07
**Current state:** L-LANG-LANDINGS-1 ✓ shipped. Per-language SEO-landingit + post-login kieli-routing. Vanha `index.html` (953 r) → `public/landing/espanja.html` (canonical `/espanja-yo-koe`, JSON-LD `Course` lisätty, asset-polut absoluuttisiksi). Uusi geneerinen `index.html` (254 r): hub + 3 kielikorttia. Uudet `public/landing/{saksa,ranska}.html` (DE/FR placeholderit; "Tulossa" + waitlist-modaali, lokalisoidut hero-mockupit, JSON-LD `Course`). Per-language CSS overrides `css/landing-{de,fr}.css` (sininen / burgundi accent). `vercel.json` rewrites `/espanja-yo-koe`/`/saksan-yo-koe`/`/ranskan-yo-koe` → `public/landing/*.html`. `sitemap.xml` +3 entryä, `robots.txt` Disallow `/app`+`/onboarding`+`/diagnose.html`. `routes/onboarding.js`: waitlist-endpoint lähettää nyt Resend-kuittauksen (non-fatal) + uusi `GET /waitlist/count?language=`. SW v138→v139 (uudet HTML+CSS STATIC_ASSETS-listalla). Post-login lang-routing oli jo L-LANG-INFRA-1:ssä (main.js:756-760). Phase 2: live-test 12/12 PASS, 2 skipped (TEST_LOGIN ei asetettu). **NEXT (`02-queue/05_LINT_CLEANUP.md`):** ESLint/parse-error-cleanup. **ACTION REQUIRED (käyttäjä):** (a) `npm run build` rebuildaamaan `app.bundle.css/js`; (b) Vercel-deploy → testaa `/espanja-yo-koe` + `/saksan-yo-koe` + `/ranskan-yo-koe` URL:t toimivat (rewrites-validointi vain prodissa); (c) saksa-landingilla → liity waitlistille → Resend-email tulee perille (jos `RESEND_API_KEY` envissä).

---

## Recent loops (last 5)

### L-LANG-LANDINGS-1 — 2026-05-07 ✓ shipped
**Scope:** SEO-landingit per kieli (`/espanja-yo-koe`, `/saksan-yo-koe`, `/ranskan-yo-koe`) + uusi geneerinen hub. Worker A: vanha `index.html` siirretty `public/landing/espanja.html`-polkuun (canonical + Course JSON-LD + absoluuttiset asset-polut), uusi `index.html` (254 r) hub-sivu 3 kielikortilla, uudet `public/landing/{saksa,ranska}.html` placeholder-tilassa lokalisoiduilla hero-mockupeilla + waitlist-modaali, `css/landing-{de,fr}.css` accent-overridet (sininen #4f7cff / burgundi #a8324a). Worker B: `vercel.json` 3 rewriteä, `sitemap.xml` +3 entryä, `robots.txt` Disallow `/app`+`/app.html`+`/onboarding`+`/diagnose.html`. Worker C: `routes/onboarding.js` waitlist-endpoint lähettää Resend-kuittausemailin (non-fatal try/catch), uusi `GET /api/onboarding/waitlist/count?language=` -laskuri (real-data, ei keksitty). Cleanup §11 oli jo edellisten looppien jälkeen täytetty (app.html ja onboardingV3.js sisälsivät jo "Mestari"+"19 €/kk").
**Files:** `index.html` (rewrite), `public/landing/{espanja,saksa,ranska}.html` (NEW), `css/landing-{de,fr}.css` (NEW), `css/landing.css` (+85 r hub-CSS), `vercel.json`, `sitemap.xml`, `robots.txt`, `routes/onboarding.js`, `sw.js`. **SW:** v138→v139. **Pending:** käyttäjän `npm run build` + Vercel-deploy (rewrites-tarkistus prodissa).

### L-LANG-INFRA-1 — 2026-05-07 ✓ shipped
**Scope:** Multi-language infra. Worker A: `git mv` 90 lesson-JSON `data/courses/es/`:n alle, DE/FR README-skeletot, `LANG_CURRICULA={es,de,fr}` + back-compat `CURRICULUM_KURSSIT`, `routes/curriculum.js` `?lang=`-tuki, validate-lessons 90/90 PASS. Worker B: `LANG_LABEL`-export + prompt-buildereiden `lang`-parametri (kielineutraalit promptit, ES few-shotit gated `lang==='es'`), `middleware/language.js` (`resolveLang`+`requireSupportedLanguage`), 403 gate writing/exercises/exam-reiteissä. Worker C: `state.language`+setLanguage, `apiFetch` `?lang=` non-ES-reiteille, `#screen-coming-soon` (waitlist), Settings "Vaihda kieli" + confirm-modaali. Phase 3 a11y-fix: close-btn 44×44, role="main" coming-soon, role=status+aria-live double-announce poistettu, focus-trap+Escape molempiin modaaleihin, focus cancel-nappiin destruktiivisen sijaan.
**Files:** `data/courses/{es,de,fr}/**`, `lib/{curriculumData,curriculum,openai,writingGrading}.js`, `routes/{curriculum,exercises,writing,exam}.js`, `middleware/language.js` (NEW), `scripts/validate-lessons.mjs`, `js/{state,api,main}.js`, `js/screens/{dashboard,onboardingV3,settings,comingSoon}.js`, `css/components/coming-soon.css` (NEW), `app.html`, `sw.js`. **SW:** v137→v138. **Pending:** käyttäjän `npm run build`.

### L-PRICING-REVAMP-2 — 2026-05-07 ✓ shipped
**Scope:** Paywall-wirings + Settings tier UI + Customer Portal. Backend gate (`checkFeatureAccess`+`incrementFreeUsage`) writing/reading/exam/lesson/adaptive-reiteille. Frontend paywall-modaali 3 variantilla (quota/feature/upgrade), `apiFetch` 403→modaali, Settings "Tilaus" + Stripe portal CTA, dashboard Free-chip. Phase 2: live-test PASS, code-review 0 todellista P0, a11y serious-fix 4 kpl.
**Files:** `routes/{writing,exercises,exam}.js`, `js/features/paywallModal.js` (NEW), `css/components/paywall.css` (NEW), `app.html`, `js/{api,main}.js`, `js/screens/{settings,dashboard}.js`, `scripts/bundle-entry.css`, `sw.js`. **SW:** v136→v137. **Pending:** käyttäjän `npm run build`, Stripe-aktivointi.

### L-BUG-HUNT-DASHBOARD-1 — 2026-05-07 ✓ shipped (Phase 2 partial)
**Scope:** Bug-hunt screenissä jonka käyttäjä raportoi näyttävän [object Object]:ja. Worker löysi profile.js:216 (`count: modeStats[m]` → `.sessions`); Opus-fix lisäsi dashboard.js:1314 NaN-guardin (writing-progression `d.avg.toFixed()`). Code-reviewer-verifier: 0 P0, 2 P1, 5 P2. Live-tester (Playwright) ei toiminut shellissä — SKIPPED.
**Files:** `js/screens/profile.js`, `js/screens/dashboard.js`, `sw.js`. **SW:** v135→v136. **Pending:** käyttäjän selaintesti + `npm run build`.

### L-DB-TABLE-FIX-1 — 2026-05-07 ✓ shipped
**Scope:** Korjasi 3 shipped-tiedostoa (`routes/onboarding.js`, `middleware/auth.js`, `routes/stripe.js`) käyttämään `user_profile`-taulua, koska sekä onboarding- että pricing-workerit kirjoittivat olemattomalle `public.users`:lle. Migraatiot oli jo ajettu MCP:llä PRICING-REVAMP-1:n yhteydessä.
**Files:** `routes/onboarding.js`, `middleware/auth.js`, `routes/stripe.js`. **SW:** ei bumppia. **Pending:** ei.

### L-PRICING-REVAMP-1 — 2026-05-07 ✓ shipped
**Scope:** 3-tier hinnoittelumalli (per ROADMAP järjestys 3). Tähtäin→Mestari rename + €29→€19 / €49→€39 cleanup yhdistetty Stripe-setupiin. Vanha kesäpaketti+Pro 9,99 -malli korvattu Free/Treeni/Mestari -triolla. routes/stripe.js placeholder→toiminnallinen lazy-loaded SDK:lla, idempotenttinen webhook (stripe_events-taulu).
**Files:** `pricing.html` (rewrite), `index.html` (pricing section + JSON-LD + FAQ), `app.html` (ob3-link), `routes/stripe.js` (rewrite), `middleware/auth.js` (+tier helpers), `routes/email.js` (seasonalBlock), `js/screens/onboardingV3.js` (comment), `ui-ux-prompt.md`, `server.js` + `api/index.js` (mount /api/stripe), `sw.js` (+pricing.html). **SW:** v134→v135. **Archive:** `onboarding/PAYWALL.md` + `EMAILS.md` → `docs/archive/onboarding-old-pricing/`. **Pending:** Stripe-dashboard tuotteet+envit, `npm install stripe`, SQL migraatio (users tier-kolumnit + free_usage + stripe_events), Playwright + axe-sweep.

### L-ONBOARDING-REDESIGN-1 — 2026-05-07 ✓ shipped
**Scope:** 9-vaihe onboarding-redesign (per ROADMAP järjestys 1). Persuasion-first ennen Pro-ostoa. Reveal-vaihe rakentaa lukusuunnitelman (weeksUntilExam / lessonsPerWeek / minutesPerWeek) + 8 kurssikorttia. Saksa/Ranska → wait-list-modaali. Vanha V2 säilytetty `#/aloitus-v2`-hashilla.
**Files:** `app.html` (+9 screens), `js/screens/onboardingV3.js`, `js/lib/studyPlan.js`, `lib/studyPlan.js`, `routes/onboarding.js`, `css/components/onboarding-v3.css`, `js/main.js`, `server.js`, `api/index.js`, `sw.js`. **SW:** v133→v134. **Tests:** ei ajettu (npm/Playwright ei saatavilla shellissä). **Pending:** SQL migraatio (users-kolumnit + onboarding_waitlist-taulu) käyttäjän ajettava Supabase SQL-editorissa; `npm run build` rebuildaa bundlen; selaintesti `/app.html#/aloitus`.

### L-LANDING-CONVERT-1 — 2026-05-07 ✓ shipped
**Scope:** Etusivun convert-redesign. UPDATE 1: `<body class="landing">` (P0 — aktivoi 246 `.landing`-CSS-sääntöä). UPDATE 2: hero-mockup CSS-driven 3-frame loop. UPDATE 3: courses-osiolle A→E -tasoprogressio-rail; K8 highlight. UPDATE 4: alternating elevated surfaces.
**Files:** `index.html`, `css/landing.css`, `sw.js`. **SW:** v132→v133. **Tests:** ei ajettu.

---

## Next loop

**Recommended (per ROADMAP):** L-LANG-LANDINGS-1 (`02-queue/04_LANG_LANDINGS_1.md`) — `/espanja /saksa /ranska` SEO-landing-sivut + login-jälkeinen oletuskielen routing. Edellytys L-LANG-INFRA-1 ✓ täyttyy.

**Harness status:** npm + Playwright TOIMIVAT Bash-toolissa (validoitu 2026-05-07, ks. memory: `feedback_playwright_works_in_harness.md`). `npm run test:bug-scan` käytössä Phase 2B gateinä.

---

For older loop history (L-RUFLO-LOOP-1..5 + L-PLAN-1..8 + L-HOME-HOTFIX-3 + L-MERGE-DASH-PATH + L-COURSE-1 + L-CAT-COLORS-1 + L-LESSON-BATCH-1..7), see `docs/archive/AGENT_STATE_HISTORY.md`.
