# Puheo Agent State

**Last updated:** 2026-04-28T20:30:00Z
**Last completed loop:** 42 (Section A of the landing rebuild — Setup)
**Next loop:** 43 (LANDING_PLAN.md Section B + C 1–2 — sticky nav + hero with browser-frame + floating streak chip + radial gradient). Read `LANDING_PLAN.md`, `docs/superpowers/specs/2026-04-28-landing-rebuild-design.md`, and the appendix in that spec listing what survived from `landing/`. The browser-frame + floating-card content live in `references/puheo-screens/` (4 screens × 2 widths) and `references/landing/` (5 reference sites — Linear is the primary aesthetic target, Duolingo confirmed as the loud counter-example).
**Active roadmap:** `PLAN.md` — user-directed P0 items (4 bug fixes + 3 redesigns; redesign 7 = 8-loop landing rebuild, L42 ✓ → L49). Items 1–7 run BEFORE any new feature work.

## What I just did
Loop 42 — **LANDING_PLAN.md Section A (Setup) — six sub-deliverables.** (a) Skimmed `landing/` (DESIGN.md, AUDIT.md, RESEARCH.md, PLAN.md) and folded a 5-bullet survivors block into the spec doc as an appendix — exam date pinned at **28.9.2026**, Y-tunnus / live-payment constraint flagged (LANDING_PLAN.md's free-signup-only CTA rule sidesteps it), 2 080+ exercises as the round-number "2 000+ harjoitustehtävää" claim, tone-of-voice rules from RESEARCH.md (calm + direct; "YTL:n mukainen" = highest-trust signal), 6 FAQ answers reusable verbatim. Discards listed. (b) Captured Linear / Vercel / Stripe / Cron (cal.com) / Duolingo at 1440×900 hero + below-fold via `scripts/agent-test/loop42-refs-capture.mjs` → 10 PNGs in `references/landing/<site>/`. Verified Linear's restrained-dark aesthetic is on-target; Duolingo confirmed as the kid-friendly counter-example we're not. (c) Wrote `css/landing-tokens.css` (162 lines) — scoped to `.landing` so it doesn't leak into app.html — dark surface palette, Geist + Inter fallback (with size-adjust for FOUT), 8/16/24/32/48/72/96 type scale, --tracking-tight for displays, motion 150-300ms ease-out, prefers-reduced-motion collapse, exam-date custom property. Reuses the app's `--accent: #2DD4BF` for landing→app brand continuity. (d) Built `scripts/agent-test/loop42-puheo-screens.mjs` — Playwright with `serviceWorkers: "block"`, 17 explicit `/api/*` mocks plus a `**/api/**` catch-all, registered in REVERSE-priority order (Playwright matches most-recently-added first — discovered the hard way after my first run rendered the placement-test fallback). Captured 8 screenshots: dashboard / profile / mode-vocab / writing × {1440, 375}. Real Puheo content visible: "Iltaa, ronja", 12-day streak, 47 sessions, daily challenge, SR review card, charts, settings chips. (e) Built `scripts/agent-test/loop42-capture-grading.mjs` (logs in with Pro test creds, fetches a writing-task, posts a deliberately-flawed B1/B2 student answer, saves the JSON). No creds in `.env` yet, so I shipped a hand-crafted placeholder fixture at `references/puheo-screens/grading-response.json` with the `_placeholder: true` marker — matches the real response shape exactly so L45's showcase markup ships either way. User can replace with real output any time before L45. (f) Extended `js/screens/auth.js` to honour `#rekisteroidy` / `#kirjaudu` URL hashes alongside the existing `?mode=register` query-param so landing CTAs can deep-link. Parse-checked.

No SW bump (landing files are not in `STATIC_ASSETS` per the spec — landing stays out of the cache for always-fresh marketing).

## Previously
Loop 41 — **PLAN item 6: right sidebar rebuilt to 2-panel.** Top: compact user-identity card (36px gradient avatar + monospace name + 🔥 streak chip + hover arrow) → click navigates to profile (Linear top-right user menu pattern). Below: mutually exclusive panels — free user gets Pro upsell card adapted from Astra Buy+ (Puheo+ wordmark + "+" badge, "Pääse YO-kokeesta läpi paremmin arvosanoin." tagline, 3 +-bullet features, accent CTA "Kokeile Pro 7 pv ilmaiseksi +" wired to existing startCheckout/LemonSqueezy); Pro user gets daily peek (today's minutes goal + word of day). Removed duplicated stats (streak/readiness/total/countdown — they live on the dashboard greeting and the rebuilt profile now). Verified both states via `loop41-rail-rebuild.mjs`. SW v90 → v91. Sources: Linear (top-right user menu), Astra Buy+ card (`references/astra/Screenshot 2026-04-27 221631.png` — wordmark + "+" badge + single CTA pattern).

## Previously
Loop 40 — **PLAN item 5: profile rebuilt to ONE viewport (1440×900).** Replaced 8-section scrollable profile with: compact hero strip (avatar + name + handle + badges + YO-koe countdown chip Astra-style), 4-cell stats row (streak / total / week / YO-valmius% — readiness derived from L38's fixed formula), 4-up mode breakdown (uppercase mono label + 24px display number, was 2-up list rows), two-column footer (3 recent activities | 5 inline-editable settings chips with Muokkaa pill). Achievements section dropped from profile (still on dashboard rail). New `openSettingsEditor(fieldKey)` exported from settings.js + a `puheo:profile-updated` CustomEvent dispatched on save so chips re-render without re-fetching. Verified: 1440×900 fits with 106px breathing room; chip click opens modal correctly; all 8 settings fields still work; blur-fade hero from L36 still works. SW v89 → v90. Sources: Linear/Vercel/Cron/Raycast desktop profile aesthetic; Astra Buy+ chip pattern (references/astra/Screenshot 2026-04-27 221631.png + 221659.png).

## Previously
Loop 39 — **PLAN items 3 + 4 bundled: NaN pv sitten + right-rail overflow.** (3) New shared `js/ui/timeAgo.js` defensive helper — accepts ISO/epoch/Date, falls back to "äskettäin" on bad input, never emits NaN. Both `dashboard.js` and `profile.js` now import it. (4) Couldn't reproduce overflow at any of 1180/1280/1440/1920 (probe = scrollWidth > clientWidth on every rail descendant). Applied belt-and-braces defensive guard anyway: `.app-rail, .app-rail * { min-width: 0 }` + `overflow-wrap: anywhere; word-break: break-word` on rail content. SW v87 → v89 (also added `settings.js`, `learningPath.js` to STATIC_ASSETS — silently missing despite being part of the SPA). All 4 P0 bugs from the user's brief now closed.

## Previously
Loop 38 — **PLAN item 2: YO-readiness math fixed.** Two compounding bugs in `js/features/writingProgression.js computeReadinessMap`: (A) path-node `bestPct` is a 0..1 fraction but `pct = Math.round((bestPct||0) * 100) / 100` divided by 100 again, so the 60/30/10 thresholds never fired — every in-progress topic stayed at level 0; (B) `readinessPct = mastered/total` treated partial progress as zero. Fixed both: scale (drop the second `/100`) + weighted partial credit (`sum(level) / (totalCells * 4) * 100`). 8 sessions in a representative payload now read 36 % (was 14 %). SW v86 → v87.

## Previously
Loop 37 — **PLAN item 1: Settings Muokkaa buttons fixed.** Real-browser click at the button center hit-tested through to `<main id="app-main">` instead of the button — verified via `document.elementFromPoint()` and `page.mouse.click(x,y)`. Root cause: `.app-main` (z-index:1, position:relative) creates stacking context A; `.screen.active` (position:absolute, z-index:auto) is layer-6 inside A but doesn't establish its own context; descendants share resolution with `<main>` and hit-testing resolves to the parent. **Fix:** added `z-index: 1; isolation: isolate;` to `.screen.active` (style.css:354). All 8 settings fields verified (`loop37f-all-fields.mjs`); profile screen regression-checked via `loop36-profile-blur-fade.mjs`. SW v85 → v86.

## Previously
Loop 36 — **Profile hero blur-fade arrival** — extends L35's pattern to a second screen surface. Avatar / name / handle / badges with 0 / 80 / 140 / 200 ms stagger. Trigger via double-rAF + `profile-hero--in` class in `loadProfile`. Reduced-motion short-circuits. SW v84 → v85. Verified — 160 ms readback shows avatar 58% opacity, name 21%, handle/badges still pre-start.

## Previously
Loop 35 — **Dashboard hero blur-fade arrival** sourced from Magic UI blur-fade. Pure CSS — no `motion` dep. Children animate `opacity` + `transform: translateY(6px → 0)` + `filter: blur(6px → 0)` with per-child `--bf-delay` (0 / 80 / 160 ms) so the eyebrow → display → sub land in reading order over ~640 ms. Trigger: double-rAF + `dash-greeting--in` class in `renderDashboard`. Reduced-motion short-circuits. SW v83 → v84. Verified — 140 ms readback shows correct mid-transition states (eyebrow 58% opacity, display 21% with 4.84 px blur, sub still hidden).

## Previously
Loop 34 — **Profile activity timeline staggered reveal** sourced from Magic UI animated-list. Pure CSS + a single rAF in JS — no `motion` dep. Initial state opacity:0 + translateY(8px) + scale(0.985), per-row `--enter-delay: ${i*55}ms`, `.--enter` flips to opacity:1 + identity. 8-row cascade ~440ms. `prefers-reduced-motion` short-circuits to instant. SW v82 → v83.

## Previously
Loop 33 — **Global shadcn-style tooltip** replacing native `title=`. New module `js/features/tooltip.js` listens for `pointerenter`/`pointerleave`/`focusin`/`focusout`/`pointerdown` in capture phase, walks via `closest("[data-tooltip]")`, shows a single shared `<div role="tooltip">` with token colors + 140 ms fade + flippable arrow. Suppresses native `title=` during hover, restores on leave. Honors `prefers-reduced-motion`. Migrations: 4 share-button `title=` → `data-tooltip=`; readiness cells `title=` → `data-tooltip=`. SW v81 → v82. Bug surfaced + fixed: capture-phase events fire on Document/Window where target isn't an Element — added `asElement(node)` guard.

## Previously
Loop 32 — **Auth-screen grid-pattern backdrop**. Sourced from Magic UI `grid-pattern.tsx`; ported to vanilla SVG (single `<pattern>` tile with a corner-piece `M.5 40V.5H40` path). CSS: `position: absolute; z-index: -1; opacity: 0.10; color: var(--ink);` plus `mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%)` so the grid fades at corners. Gentle 18s drift animation gated by `prefers-reduced-motion`. `#screen-auth` got `position: relative; isolation: isolate;`; `.auth-shell` got `z-index: 1` so it stacks above. SW v80 → v81. Verified at 1440 + 375 — grid lines visible across the screen with corners fading.

## Previously
Loop 31 — **3D tilt + cursor-tracked glare on the .mode-btn cards** (Sanasto / Puheoppi / Luetun / Kirjoittaminen / Koeharjoitus). New `js/features/cardTilt.js` writes `--tilt-rx`, `--tilt-ry`, `--tilt-scale`, `--tilt-mx`, `--tilt-my`, `--tilt-glare-opacity` as CSS vars on pointermove. CSS in `style.css` adds `perspective: 1200px` to `.mode-picker`, applies `transform: rotateX/Y scale` to `.mode-btn`, and a `::before` radial-gradient glare. Coarse-pointer + reduced-motion both short-circuit. Max ±8° rotation, scale 1.015. Wired via dynamic `import` in `js/main.js`. SW v79 → v80. Verified — hover at upper-right of Puheoppi gave rx=3.83°, ry=5.60°, glare=1, accent glow visible.

## Previously
Loop 30 — **"Kehitys ajan mittaan" chart polish** sourced from shadcn line-chart aesthetic. Replaced hardcoded `#e63946` / `#f59e0b` literals with `var(--accent)` + `currentColor` (dark-mode-ready). Ported a Catmull-Rom-to-cubic-Bezier interpolation by hand so the line is a smooth natural spline (`type="natural"` in shadcn). Removed per-point dots; kept a 3-layer bullseye endpoint (halo + solid + inner surface punch). Removed the dashed amber "tänään" vertical line — shadcn-style charts don't carry that decoration. Verified with a 14-point grade series. SW v78 → v79.

## Previously
Loop 29 — **YO-valmius readiness ring** on the right rail. Sourced Magic UI `animated-circular-progress-bar`; ported to vanilla SVG with a single accent-stroke fill ring (the original's two-arc gap aesthetic reads as noise at 80 px). `<circle r="34">` × 2 (track + fill) with `stroke-dasharray: 213.628; stroke-dashoffset: 213.628;` rotated -90deg so 0% starts at 12 o'clock. `transition: stroke-dashoffset 1.4s cubic-bezier(...)` + accent drop-shadow halo. Inner number is flex-baseline-aligned so "21" + "%" read as one composed unit. Wired via `loadAndRenderReadinessMap` — `countUp` on the digit + `requestAnimationFrame(() => ringEl.style.strokeDashoffset = ...)` for the arc. SW v77 → v78. Verified mid-anim and settled at clip 1080,0 360x400 — 19%→21% with matching arc length.

## Previously
Loop 28 — **Meteors decoration behind dashboard hero, mounts when streak ≥ 7**. Sourced from Magic UI `meteors.tsx`; ported to vanilla CSS + a tiny mounter that animates `--mx` / `--my` directly in screen-space (registered via `@property` for smooth interpolation) and applies a static `rotate(-25deg)` for tail orientation. Tail is a `::before` extending 90 px right of the head with a linear-gradient fade. New files: `css/components/meteors.css`, `js/features/meteors.js` (`mountMeteors` / `unmountMeteors`, idempotent via `dataset.meteorsMounted`). Wired in `js/screens/dashboard.js` after the streak class toggle: 16 meteors at streak 7-29, 24 meteors at streak ≥ 30, none below. `app.html`: added `<div class="meteors-fx" id="dash-meteors" hidden>` inside `.dash-greeting` + linked the stylesheet. `.dash-greeting` got `position: relative`, `isolation: isolate`, `min-height: 96px` so the absolute meteor field has somewhere to live; eyebrow / display / sub got `position:relative; z-index:1` to stay readable above the streaks. Honors `prefers-reduced-motion` and suppresses below 600 px viewport. Verified at 3 streak states via `scripts/agent-test/loop28-meteors.mjs` with deterministic-frame pause for screenshots. SW v76 → v77.

## Session arc (L26 → L36, all under the new curator/integrator model)
- **L26** — achievements grid + sourced Magic UI `shine-border` polish (mask-composite: exclude → unlocked badge foil) + `localStorage`-tracked "Uusi" pill pulse for newly-seen badges.
- **L27** — `countUp` (in-house, conceptually = Magic UI `number-ticker`) on dashboard streak + total counters; new `celebrateStreakMilestone(streak)` in `js/features/celebrate.js` reusing `canvas-confetti` for once-per-crossing 3/7/30 burst.
- **L28** — Magic UI `meteors` ported to vanilla, mounted behind dashboard hero on streak ≥ 7.
- **L29** — Magic UI `animated-circular-progress-bar` ported as the YO-valmius readiness ring on the right rail.
- **L30** — shadcn line-chart visual language ported to `renderProgressChart` (natural spline + token colors + bullseye endpoint).
- **L31** — Aceternity 3d-card-effect + Magic UI magic-card cursor-spotlight ported to the .mode-btn cards (CSS-var-driven, coarse-pointer / reduced-motion safe).
- **L32** — Magic UI grid-pattern ported to vanilla SVG as the auth-screen backdrop with a radial mask + 18s drift.
- **L33** — shadcn/ui Tooltip primitive ported to a single global vanilla module replacing native `title=` across share buttons + readiness cells.
- **L34** — Magic UI animated-list reveal pattern ported as a CSS-only top-down stagger on the profile activity timeline.
- **L35** — Magic UI blur-fade ported as the dashboard hero arrival — eyebrow / display / sub stagger with simultaneous opacity + translateY + filter:blur transitions.
- **L36** — Same blur-fade pattern extended to the profile hero (avatar / name / handle / badges, 4-child stagger).
- **Cumulative SW bump:** v73 (start of session) → v85 (now).

## What I'm doing next
**Loop 43 = LANDING_PLAN.md Section B + C 1–2 — sticky nav + hero.** Read the survivors appendix at the bottom of `docs/superpowers/specs/2026-04-28-landing-rebuild-design.md` first (5 bullets — exam-date 28.9.2026, Y-tunnus constraint, 2 000+ harjoituksia claim, tone-of-voice rules, FAQ reusables). Then look at `references/landing/linear/hero-1440.png` and `references/landing/vercel/hero-1440.png` for layout instinct (Linear is the primary aesthetic target). Then build:
1. Section refactor of `index.html` head — keep SEO/JSON-LD scaffolding, swap the body's `<link rel="stylesheet" href="landing.css">` to `css/landing-tokens.css` (and start a fresh `css/landing.css` as the new component sheet). Add `class="landing"` to `<html>` so the tokens take effect.
2. Sticky 64 px nav: Puheo wordmark left + "Tuote / Hinnoittelu / FAQ" anchor links + "Kirjaudu" ghost button + "Aloita ilmaiseksi" filled accent → `/app.html#rekisteroidy`. Transparent → `rgba(10,10,10,0.8)` + backdrop-blur on scroll.
3. Hero 60/40 desktop, stacked mobile. Eyebrow `ESPANJAN YO-KOE • LYHYT OPPIMÄÄRÄ`, H1 72 px tracking-tight, sub 20 px text-muted, two buttons (primary "Aloita ilmaiseksi →" + ghost "Katso miten se toimii" smooth-scrolling to #miten). 14 px trust strip "Ei luottokorttia • Suomen kielellä • Toimii selaimessa".
4. Browser-frame component (~40 lines vanilla CSS) embedding `references/puheo-screens/dashboard-1440.png`, rotated -3deg, accent shadow lift.
5. Floating Puheo card behind it — isolate the streak chip from `dashboard-1440.png` (or hand-build a minimal version), float at -3deg with `box-shadow: 0 24px 64px -32px var(--accent-glow)`.
6. Subtle radial gradient blob behind everything as glow.
7. Verify via `scripts/agent-test/loop43-nav-hero.mjs` at 1440 + 375; axe-core zero new violations; one IMPROVEMENTS line citing the Linear hero source. PLAN.md polish queue (cmd-K palette, dialog primitive, marquee, auth tabs redesign) is now L50+.

## Working context
- Dev server still on :3000.
- Test creds still empty in `.env`. All L26-L28 tests mock the dashboard payload via `page.route("**/api/dashboard", ...)` after `serviceWorkers: "block"` (CRITICAL — without it the SW intercepts /api/* and bypasses the route stub; lost 30 min in L27 to this).
- BUGS.md status unchanged from L24 (5 P2 left, low-impact / interaction-bound).
- npm new in this session: zero. Everything ported in CSS or used existing `canvas-confetti@1.9.4`.
- Files touched L28: `css/components/meteors.css` (NEW), `js/features/meteors.js` (NEW), `app.html` (CSS link + meteors div in dash-greeting), `css/components/dashboard.css` (.dash-greeting positioning), `js/screens/dashboard.js` (imports + mount/unmount call), `sw.js` (v76→v77 + 2 STATIC_ASSETS), `scripts/agent-test/loop28-meteors.mjs` (NEW — deterministic-frame pause technique).
- Risky / mid-flight: nothing. All additive; meteors silently no-op for streak < 7.

## Sources catalog (curator-model toolkit) — keep growing
- **Magic UI** (`github.com/magicuidesign/magicui` — `apps/www/registry/magicui/`).
  - **L26 sources:** `border-beam.tsx`, `shine-border.tsx` (mask-composite: exclude technique → ported to `.profile-badge-card--unlocked::before`), `magic-card.tsx` (radial-spotlight hover concept).
  - **L27 sources:** `number-ticker.tsx` (concept reference; in-house `countUp` already implements the spring-eased count-up).
  - **L28 sources:** `meteors.tsx` (full port — animation simplified to direct screen-space translate via `@property` `--mx` / `--my`; original's `rotate(angle) translateX(-720px)` produces unintuitive paths).
  - **Available, unsourced:** `bento-grid`, `animated-circular-progress-bar` (target for L29), `marquee`, `dock`, `aurora-text`, `sparkles-text`, `text-animate`, `typing-animation`, `word-rotate`, `interactive-grid-pattern`, `flickering-grid`, `shimmer-button`, `pulsating-button`, `ripple-button`, `globe`, `orbiting-circles`, `animated-list`, `animated-shiny-text`, `animated-subscribe-button`, `blur-fade`, `dot-pattern`, `grid-pattern`, `hero-video-dialog`, `hyper-text`, `lens`, `light-rays`, `line-shadow-text`, `morphing-text`, `neon-gradient-card`, `noise-texture`, `particles`, `progressive-blur`, `rainbow-button`, `retro-grid`, `ripple`, `scroll-progress`, `striped-pattern`, `text-reveal`, `warp-background`.
- **Aceternity UI** — 3D-card-effect pattern noted; hover-effect-cards 404'd, revisit via GitHub source.
- **shadcn/ui** (`ui.shadcn.com`). Not yet sourced from. Top targets: `chart`, `command`, `dialog`, `data-table`, `tabs`. **L29 candidate.**
- **HyperUI / Tailwind UI free / DaisyUI / Headless UI / Tabler / Preline** — none sourced yet.
- **21st.dev** — no achievement components surfaced; will widen.
- **Lucide icons** — already inline as path-d strings in `BADGES`.
- **canvas-confetti** (npm, installed L0) — used L20 (results) and L27 (streak milestone).
- **Playwright** (npm, installed L0) — `serviceWorkers: "block"` is mandatory when mocking `/api/*`.
- **Inspiration screenshots** — `scripts/agent-test/inspiration/` from earlier session.

## Skills and plugins in use
- `puheo-screen-template` — applied L4..L11, L25, L27 (countUp on dashboard)
- `puheo-finnish-voice` — applied across most loops
- `puheo-ai-prompt` — applied L16..L22
- `ui-ux-pro-max` — most loops; L26 P2+P5+P6, L27 P5, **L28 P2+P5+P6+P7**
- npm: `canvas-confetti@1.9.4`. Playwright (devDependency).

## Files I have memorized — do NOT re-read on resume
- `CLAUDE.md`, all 3 puheo-*/SKILL.md, ui-ux-pro-max/SKILL.md
- `app.html` — 39-screen structure incl. `#screen-profile` with `#profile-achievements`; `<header class="dash-greeting">` now has `<div class="meteors-fx" id="dash-meteors" hidden>` as first child; linked `meteors.css` after `profile.css`.
- `js/main.js` boot order; NAV_HASH `profile: "#/oma-sivu"`; sidebar selector incl. `.sidebar-user[data-nav]`.
- `js/screens/profile.js` — calls `renderAchievementsInto`.
- `js/features/achievements.js` — `BADGES` (10), `evaluateAchievements`, `renderAchievementsInto`. localStorage `puheo_seen_badges`.
- `js/features/celebrate.js` — `celebrateScore(pct)` (L20) + `celebrateStreakMilestone(streak)` (L27). localStorage `puheo_streak_milestone`. STREAK_BANDS `[3, 7, 30]`.
- `js/features/meteors.js` — `mountMeteors(el, {count, angleDeg, min/maxDelaySec, min/maxDurationSec})` + `unmountMeteors(el)`. Idempotent via `dataset.meteorsMounted`. Default angle `-25deg` (visual tilt, not motion direction).
- `js/screens/mode-page.js` — `countUp(el, target, duration=1200)`, ease-out-cubic + reduced-motion fallback.
- `js/screens/dashboard.js` — `loadDashboard`, `renderDashboard` (local), MODE_META, `saveProgress`, `navigateToMode`, `loadLastSettings`, `saveLastSettings`. **L27**: countUp on `#dash-streak` + `#dash-total-sessions`, `celebrateStreakMilestone` after streak class toggle. **L28**: `mountMeteors(#dash-meteors, {count: streak >= 30 ? 24 : 16})` when streak ≥ 7; `unmountMeteors` otherwise.
- `js/screens/{vocab,grammar,reading,writing}.js` — share-card handlers, anti-repetition, daily challenge wiring.
- `js/features/shareCard.js`, `js/features/dailyChallenge.js`, `js/features/wordOfDay.js` — per L18..L23 entries.
- `js/state.js` — recent* anti-repetition fields.
- `lib/openai.js`, `lib/writingGrading.js`, `routes/exercises.js`, `routes/writing.js` — shape unchanged in L26-L28.
- `routes/progress.js` — `/api/dashboard` returns `{ totalSessions, modeStats, recent, chartData (60 days), estLevel, gradeEstimate, streak, weekSessions, prevWeekSessions, suggestedLevel, modeDaysAgo, pro, aiUsage }`.
- `css/components/profile.css` — L26 shine-border + pulse + hover.
- `css/components/dashboard.css` — `.dash-greeting` updated L28 with position:relative, isolation, min-height 96px, z-indexed children.
- `css/components/meteors.css` — `.meteors-fx` + `.meteor` + `::before` tail; `@keyframes meteorFall` animates `--mx`/`--my` (registered via `@property`); `prefers-reduced-motion` and `<600px` short-circuits.
- `sw.js` is `puheo-v77`. STATIC_ASSETS now includes meteors.css + meteors.js. Other tracked files (celebrate.js, achievements.js, profile.css, profile.js, dailyChallenge.js, shareCard.js, wordOfDay.js, app.html) already listed since earlier loops.
- `server.js` CSP after L3.
- **Playwright gotcha (L27):** `serviceWorkers: "block"` when mocking `/api/*`.

## Files that ARE worth re-reading on resume
- `AGENT_STATE.md` (this file)
- `IMPROVEMENTS.md` (last 30 lines)
- `BUGS.md` (5 P2 left)
- The single file the next loop will edit (Loop 29 — likely `app.html` + dashboard.css for the readiness ring SVG, or `routes/progress.js` if readiness needs a real value).

## Loop measurement (unchanged from L25)
- axe violations: 28 → 0 (held since L6)
- App console errors: 69 → 0 (one CSP-script-src worker block from sentry blob — pre-existing)
- BUGS.md P0: 6 → 1 (P0-4 server-restart-bound)
- BUGS.md P1: 12 → 0
- BUGS.md P2: 12 → 5
- Lighthouse desktop landing: 99 / 100 / 92
- Lighthouse desktop app: 93 / 100 / 96 (CLS 0.000)

## Note on context budget for next /clear
L26 + L27 + L28 each cited at least one outside source. Curator model is sticking. Three screen surfaces touched (profile achievements, dashboard counters, dashboard hero). All additive — zero existing functionality lost. Safe to `/clear` here.
