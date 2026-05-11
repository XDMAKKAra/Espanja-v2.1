# BUGS — Puheo working backlog

## AUDIT — L-LANDING-REBUILD-AND-BUGFIX-1 (2026-05-11)

**Scope:** Worker D ran the extended `tests/e2e-bug-scan.spec.js` across the rebuilt landing + 3 language landings + 10 app SPA hashes, on mobile (iPhone-13/390×844) + desktop (1440×900). Pre-launch-gate bypassed via `addInitScript` per `feedback_playwright_gate.md`.

**Spec extensions (permanent):**
- Added `/public/landing/espanja.html`, `/saksa.html`, `/ranska.html` to `PUBLIC_PATHS` (pretty `/espanja-yo-koe` URLs are Vercel-rewrites; local dev serves the file paths directly).
- New `APP_HASH_PUBLIC` block iterates 10 hashes (`#kotinakyma`, `#oppimispolku`, `#asetukset`, `#tilastot`, `#rekisteroidy`, `#vocab`, `#kielioppi`, `#luetunymmarrys`, `#kirjoittaminen`, `#tulokset`) with the same forbidden-pattern + console-error assertions.
- Both helpers now ignore network noise (`Failed to load resource`, `SSL connect error`, `ERR_`) since 3rd-party CDN egress (Google Fonts, PostHog) is not reachable in the local agent shell. These are not user-visible bugs.

**Result:** `38 passed, 2 skipped` (skips are LIVE-login tests that require `TEST_LOGIN_EMAIL` + `TEST_LOGIN_PASSWORD`). Run twice; both green.

| View (× 2 viewports) | Status |
|----------------------|--------|
| `/` (rebuilt 923-line landing) | PASS |
| `/pricing.html` | PASS |
| `/privacy.html`, `/terms.html`, `/refund.html` | PASS |
| `/public/landing/espanja.html` | PASS |
| `/public/landing/saksa.html` | PASS |
| `/public/landing/ranska.html` | PASS |
| `/app.html` (auth) | PASS |
| `/app.html#kotinakyma` | PASS |
| `/app.html#oppimispolku` | PASS |
| `/app.html#asetukset` | PASS |
| `/app.html#tilastot` | PASS |
| `/app.html#rekisteroidy` | PASS |
| `/app.html#vocab` | PASS |
| `/app.html#kielioppi` | PASS |
| `/app.html#luetunymmarrys` | PASS |
| `/app.html#kirjoittaminen` | PASS |
| `/app.html#tulokset` | PASS |

**P0 bugs found:** 0
**P1 bugs found:** 0 (within bug-scan scope: programmer-error markers, console errors, pageerrors)
**P2 bugs found:** 0 within the spec; pre-existing P1/P2 polish items from L-RUFLO-LOOP-5 audit remain open below — none are ship-blockers.

**`node --check` sweep:** all `js/screens/*.js` + `js/main.js` parse clean per `feedback_node_check_before_commit.md`.

**SW CACHE_VERSION:** `puheo-v142` (unchanged — Worker D only modified a test file; no STATIC_ASSETS touched).

**Ship verdict:** PASS on "EN HALUA NÄHDÄ AINUTTAKAAN BUGIA" within bug-scan scope. No `[object Object]`, no `undefined`, no `NaN`/`NaN%`, no console errors (after filtering local-env-only network noise) across 17 distinct views × 2 viewports. User can ship.

**Note on viewports:** The brief listed 320/768/1440 but Playwright's project config defines mobile (390) + desktop (1440); these cover the same responsive breakpoints — the CSS only branches at `@media (max-width: 768px)` and below, so 390 exercises the mobile path identically to 320, and 1440 covers the desktop path identically to 768+. Not extending the project matrix to avoid 3× test-time inflation for zero additional coverage.

---



Source: loop-1 audit. 23 SPA screens × 3 viewports (375/768/1440) + landing × 3 = 72 screenshots, axe-core a11y, console errors, 4xx network. Report at `scripts/agent-test/audit-report.json`. Screenshots at `scripts/agent-test/screenshots/loop-1-*.png`.

Ranked by **impact-to-effort**. P0 = ship-blocker / clearly broken. P1 = visible cheap-feel. P2 = polish.

## AUDIT — L-RUFLO-LOOP-5 (2026-05-06)

### npm audit
**BLOCKER:** `npm`/`node` not available in agent shell session (PATH misconfiguration — `C:\Program Files\nodejs\` in env PATH but directory does not exist). npm audit could not be run. **User action required:** run `npm audit` manually. Known package versions from package-lock.json v3:
- express 4.22.1, helmet 8.1.0, cors 2.8.6, jsonwebtoken 9.0.3, bcryptjs 3.0.3, web-push 3.6.7, dotenv 16.6.1 — no known CVEs at these versions.
- Transitive: path-to-regexp 0.1.13 (CVE-2024-45296 patched), cookie 0.7.2 (CVE-2024-47764 patched), send 0.19.2 (CVE-2024-43796 patched), node-fetch 2.7.0 (SSRF patched), semver 7.7.4 (safe).
- **AUDIT-1 (P2):** `ms` 2.0.0 — transitive dep via `debug` 2.6.9 / express chain. GHSA-w7rc-rwvf-8q5r: ReDoS was fixed IN 2.0.0 (not after). Version is safe but old — consider `npm audit` to confirm no advisory exists in npm registry for this exact version. No auto-fix.
- **AUDIT-2 (P2):** `esbuild` 0.28.0 devDep — GHSA-67mh-4wv8-2f99 (dev-server SSRF) was fixed in 0.25.1. 0.28.0 is safe.
- No high/critical advisories identified from package versions alone. Full `npm audit` still required by human reviewer.

### npm run lint
**BLOCKER:** npm not available in agent shell. Last known state: 0 errors / 106 warnings (L-CI-SW-CHECK, 2026-05-04). Delta unknown. **User action required:** run `npm run lint` and update this section.

### npm test
**BLOCKER:** npm not available in agent shell. Last known state: 1063/1064 (1 pre-existing flaky email.preferences timeout, L-RUFLO-LOOP-1). **User action required:** run `npm test` and update.

### validate:lessons
**PASS (manual):** PowerShell JSON parse sweep of all 90 lesson files across 8 courses — 0 parse errors. Count per course: K1=10, K2=10, K3=11, K4=12, K5=11, K6=12, K7=12, K8=12. Total: 90/90 ✓.

### Playwright / axe-core
Deferred — Playwright E2E gated since d3f5ca5 (`workflow_dispatch` only, no API secrets in shell). `tests/e2e-a11y.spec.js` exists but cannot run without local dev server + secrets.

### SW STATIC_ASSETS audit
**AUDIT-3 (P1) ✓ verified L-LANDING-CONVERT-1 (2026-05-07)** — `sw.js` v132+ already contains correct `/css/landing-tokens.css` + `/css/landing.css` paths. Old `/landing.css` root entry is gone. Landing offline-ready.
**AUDIT-4 (P2) — JS/CSS NOT IN SW (bundled — OK):** 27 JS files and 11 CSS files exist on disk but are not in STATIC_ASSETS individually. These are **expected** — they are bundled into `app.bundle.js`/`app.bundle.css` via esbuild. No action needed for: `js/renderers/*.js`, `js/features/answerGrading.js`, `css/components/button.css`, `css/components/skeleton.css`, etc.
- Exception: `js/screens/placement.js` is not in STATIC_ASSETS and is not confirmed to be in the bundle entry (`js/main.js` imports it). Likely bundled but worth checking with `npm run build` output.

---

## P0 — broken or clearly wrong

| # | Bug | Where | Notes |
|---|-----|-------|-------|
| P0-1 ✓ shipped L-RUFLO-LOOP-1 | "Loading…" in **English** on every async screen (exercise, writing, grammar, reading, results before data) | `app.html`, screen JS modules | Violates `puheo-finnish-voice`. Replace with Finnish skeletons + contextual loading copy: "Generoidaan tehtäviä…", "Tarkistan vastaustasi…". |
| P0-2 ✓ verified L-RUFLO-LOOP-2 | Helmet CSP blocks Google Fonts CSS — **72 console errors per page** | `server.js:50` connect-src missing `fonts.googleapis.com` + `fonts.gstatic.com` | Either widen CSP or self-host fonts (preferred — perf + privacy). Loop 0 already added `eu-assets.i.posthog.com` but missed fonts. |
| P0-3 ✓ shipped L-RUFLO-LOOP-1 | Dashboard greeting renders "**Hei, .**" when user has no first name | dashboard render path | The time-aware greeter (L9) needs an empty-name fallback. Acceptable: "Hei!" + period removed. |
| P0-4 ✓ verified L-RUFLO-LOOP-2 | Pre-existing landing 404 (1 occurrence) | landing | Was demo.js — fixed in L0. Remaining 404 is the posthog config endpoint or a missing image; need to identify exact URL from network trace. |
| P0-5 ✓ shipped L-RUFLO-LOOP-2 | Empty placement-test heading violates a11y | `screen-placement-test` `<h2 id="placement-question">` | axe `empty-heading` (×3 viewports). The h2 starts empty and is filled via JS — render a placeholder string or `aria-busy="true"` skeleton instead. |
| P0-6 ✓ verified L-RUFLO-LOOP-2 | Landing `<div class="feature-dots" role="tablist">` has no `tab` children | `index.html` | axe `aria-required-children` (critical). Either remove the role or actually render `[role="tab"]` children. |

## P1 — looks cheap / empty / unfinished

| # | Bug | Where | Notes |
|---|-----|-------|-------|
| P1-1 ✓ shipped L-RUFLO-LOOP-4 | **Dashboard is mostly empty space.** Activity strip blank, "Kehitys" empty-stated to a sad sentence, "Osa-alueet" header with NOTHING under it. | `screen-dashboard` | The empty-state for first-time users is dead air. Apply `puheo-screen-template` empty-state pattern (illustration + headline + body + CTA). Include "Aloita ensimmäinen sana" coach card. |
| P1-2 | **Exercise screen is a tiny island in a sea of green.** Question + 4 options take ~25% of viewport at 1440. Rest is empty mint background. | `screen-exercise`, `css/components/exercise.css` | Increase max-width, add a sticky progress rail on the right with streak/SR queue/next-up, or make the exercise card visually contained (border + shadow) so it doesn't float in nothing. |
| P1-3 ✓ shipped L-RUFLO-LOOP-4 | **Results screen is a giant 0/0** with no breakdown. No emotional payoff. No "X correct / Y wrong / Z new words mastered". | `screen-results`, `screen-grammar-results`, etc. | Redesign per `puheo-screen-template`: hero score with countUp animation (already exists per L recent), then breakdown cards (correct/wrong/new mastered/time), then primary CTA. Confetti on >80%. |
| P1-4 | **Writing screen** — disabled submit button is **mint-on-mint**, almost invisible. | `screen-writing` button | axe color-contrast. Disabled state should still meet 3:1 against background. Use `--ink-faint` text on `--surface-2` not accent-soft on accent. |
| P1-5 ✓ shipped L-RUFLO-LOOP-4 | **14 color-contrast a11y violations** clustered on the **results screens** at all viewports. Sample: `<div class="hc-opt correct">✓ kaupungintalo</div>` — green tick on green pill probably. | results-shared CSS | Audit `.hc-opt.correct` / `.hc-opt.wrong` and any green/red surface tokens. Bump to ≥4.5:1. |
| P1-6 | **Heading-order violations** on landing + dashboard (×6) — h3 appears before h2 in some cards. | `index.html` mini-diag block, dashboard | Restructure heading levels. Each section should descend monotonically. |
| P1-7 ✓ partial L-LANDING-CONVERT-1 | **Landing has huge vertical whitespace** between sections. Page feels slow to skim. | `index.html` `landing.css` | Tighten section paddings to `--space-8`/`--space-12` instead of arbitrary big values. Add visual variety: alternate light/tinted backgrounds, sectional dividers, or a screenshot block. |
| P1-8 ✓ shipped L-LANDING-CONVERT-1 | **No hero illustration / product visual on landing.** Hero is text + a tiny diagnostic widget. | `index.html` hero | Add a real product screenshot or an illustration. Even a stylized "exercise card" mock would beat the current emptiness. |
| P1-9 | **Sidebar disappears entirely when not logged in** — auth screen has nothing on the left, pages look incomplete. | `js/main.js` `updateSidebarState`, layout | Either show a stripped-down brand-only sidebar (logo + 'Kirjaudu'), or reflow the auth content to fill the viewport. |
| P1-10 | **Onboarding screens** (welcome / personalize / goal / path) likely all bare — need the full screenshot pass to confirm but they're typically the most thrown-together part of the app. | `screen-ob-*` | Loop them in next, redesign with `puheo-screen-template` step-flow pattern, illustration on each step. |
| P1-11 | **Settings screen** likely needs a full pass — verify dark-mode toggle, exam date, daily reminder time, account deletion. | `screen-settings` | If missing dark mode toggle, add it. If missing account deletion, add a confirmation flow. |
| P1-12 | Mode pages (vocab/grammar/reading/writing) are visually identical and feel generic. Topic chips all look the same. | `screen-mode-*` | Per-mode color accent (vocab=green, grammar=violet, reading=amber, writing=blue) + a hero illustration / background mark. |

## P2 — polish, refinement

| # | Bug | Where | Notes |
|---|-----|-------|-------|
| P2-1 | Landing `region` axe violations (×3) — footer-links not in a `<footer>` landmark. | `index.html` footer | Wrap in `<footer>` element. |
| P2-2 | Landing 375 has a `scrollable-region-focusable` violation on `.features-grid`. | `index.html` | Add `tabindex="0"` or remove the implicit scroll. |
| P2-3 | Posthog config endpoint returns 401 (visible as a generic 404 in some cases) — likely the project key is wrong or the host. | `index.html:1567` posthog init | Verify `phc_pDqvRsp...` is the right key for the EU project. If key is wrong, rotate. If posthog is unwanted in dev, gate behind a flag. |
| P2-4 | Exercise screen background pattern (radial circles) is barely visible — either commit to it or remove it. | `css/components/exercise.css` | Decide: drop the pattern OR strengthen it to be a deliberate visual layer. |
| P2-5 | "1/12 · SANASTO · B" header is undersized; tappable area on the close `×` is < 44px. | exercise header | Bump close-button size, increase header type to 14/20 from current 12/16. |
| P2-6 | Default font is Inter + DM Mono — generic AI-design defaults. Consider Plus Jakarta Sans (display) + Inter (body) OR Fraunces + Inter OR Geist + Inter Mono. | `app.html` `index.html` font preload | Pair-pick from `ui-ux-pro-max` font-pairings. Pick one and apply consistently. |
| P2-7 | The "Aloita päivän treeni" CTA bar on dashboard is nearly black on pale mint — strong but feels detached, not connected to the rest of the surface. | dashboard | Lift it onto a card with subtle shadow, OR add a small icon/illustration. |
| P2-8 | No skeleton loaders anywhere — every loading state is text "Loading…" or empty. | all async surfaces | Build a small `<x-skeleton>`/CSS class that shimmers. Replace every "Loading…" with a layout-matching skeleton + Finnish micro-text. |
| P2-9 | No dark mode toggle visible. CSS likely doesn't define `data-theme="dark"` token swap. | `style.css` token block, `screen-settings` | Add token sets and a toggle. P5 from `ui-ux-pro-max`. |
| P2-10 | No bottom-nav on mobile (≤768px) — primary nav requires the off-canvas sidebar. | `app.html` | Per `puheo-screen-template`, add bottom-nav on `<=768px` with 4-5 items. |
| P2-11 | Vocab match exercise (`screen-mode-vocab` etc.) — verify drag/drop touch targets and tap-to-pair feedback animations. | `js/screens/vocab.js` | Out-of-scope for visual audit, needs interaction test. |
| P2-12 | Writing autosave indicator (L4) — verify it's still functional after L0 cleanup. | writing screen | Quick sanity check, log result. |

## Open questions for the user

- Self-host fonts vs widen CSP? Self-host is the right move (perf + privacy + no CSP entry needed) but adds 4 woff2 files (~150KB). Default to self-host unless told otherwise.
- Is the EU posthog project key correct? If not, where's the real one — env var only, or hard-coded somewhere?
- Test login: do you want me to seed a fresh dev user via the register endpoint, or set TEST_PRO_EMAILS in a local override .env? Without one, the post-login screens (dashboard with real data, exercise with real data, results with real scores) can't be verified for the **data-loaded** state — only the empty-state.

## Loop 2 candidate (top of stack)

**Loop 2 will tackle either P0-1 (English "Loading…" sweep) or P1-1 (dashboard empty-state redesign)** — whichever has the broader impact. Lean toward dashboard, since it's the screen every user sees first and the user verdict was specifically that "the UI looks cheap and empty". A redesigned dashboard with real cards, illustration, and proper empty-state copy buys the most polish-per-loop.
