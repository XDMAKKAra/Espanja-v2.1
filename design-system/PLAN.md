# PLAN — Step 2 commit sequence

Ordered list. One concern per commit. Each commit: title, files touched, test added/updated, acceptance criterion. Branches per gate per `01-design-system-step2.md`.

---

## Gate A — Tokens + foundation (branch `design-system/gate-a-tokens`)

### Commit 1 — `design(system): colour + spacing + radius + shadow + breakpoint tokens`
- **Files:** `style.css` (replace `:root` block lines 1–46), `landing.css` (replace `:root` block lines 1–18).
- **Test:** `tests/tokens.test.js` — parse CSS, assert every token from DESIGN §1–6 exists; assert no duplicated token names between the two files.
- **Acceptance:** every token name in DESIGN.md is reachable as a `var(--*)` in at least one file. `grep -nE '#[0-9a-fA-F]{3,6}'` in `style.css`/`landing.css` returns only tokens inside `:root`.

### Commit 2 — `design(system): typography scale + global h1–h4 rules`
- **Files:** `style.css` head, `landing.css` head, font `<link>` in every HTML shell to add Inter.
- **Test:** `tests/typography.test.js` — render a Finnish test string ("Ylioppilastutkintolautakunta") in jsdom + axe; assert computed fs matches token.
- **Acceptance:** h1/h2/h3/h4 pull from `--fs-*`. No component-local heading overrides outside DESIGN spec. `clamp()` only allowed in root tokens, not component CSS.

### Commit 3 — `design(system): button component against tokens`
- **Files:** new `css/components/button.css` imported by `style.css` + `landing.css`. Remove `.btn-primary`, `.btn-hero`, `.nav-cta`, `.price-cta`, `.btn-start` duplicates (keep as compat aliases via `@extend`-style rules).
- **Test:** `tests/button.test.js` — four variants × three sizes render with correct padding + radius + min-height. Touch target ≥44px.
- **Acceptance:** every button in the app uses one of `.btn` + variant + size. Delete hex literals from previous button rules.

### Commit 4 — `design(system): input + card against tokens`
- **Files:** new `css/components/input.css`, `css/components/card.css`.
- **Test:** focus state visible, border colour = `--brand-light`, axe clean.
- **Acceptance:** all inputs/cards on landing + app use new classes. Settings, onboarding, auth forms updated.

**Gate A exit:** screenshot each screen at mobile + desktop into `design-system/screenshots/gate-a/`. Visual diff ≤ intended scope (colours may shift slightly due to muted-text contrast fix).

---

## Gate B — Feedback + loading (branch `design-system/gate-b-feedback`)

### Commit 5 — `design(system): skeleton variants for every exercise type`
- **Files:** `css/components/skeleton.css` with 5 variants from DESIGN §8.5.
- **Test:** `tests/skeleton.test.js` — each variant renders the right structure count (bars, options).
- **Acceptance:** vocab / grammar / writing / reading / matching screens all show type-matched skeleton during loading. Writing skeleton is new — no longer falls back to spinner.

### Commit 6 — `design(system): feedback banner + toast`
- **Files:** `css/components/feedback.css`, `js/ui/toast.js`.
- **Test:** `tests/toast.test.js` — success auto-dismisses 4s, error is sticky + requires close. Feedback banner renders correct / close / wrong states with correct border colour.
- **Acceptance:** onboarding failure alert uses the toast instead of `alert()` (replaces the Pass 0.5 shim). Grading feedback uses the new banner component.

### Commit 7 — `design(system): modal shell`
- **Files:** `css/components/modal.css`, `js/ui/modal.js` (focus trap).
- **Test:** `tests/modal.test.js` — Escape closes, Tab stays within, backdrop click closes, scroll locks on body.
- **Acceptance:** every existing modal (results, settings, Pro upsell) uses the new shell. No more `!important` overrides in modal rules.

---

## Gate C — Navigation (branch `design-system/gate-c-nav`)

### Commit 8 — `design(system): top nav unified across landing + app`
- **Files:** `css/components/top-nav.css`, update all HTML shells.
- **Test:** visual regression via playwright — nav renders identically on landing and inside app shell.
- **Acceptance:** `.nav-right` wrapper + `.nav-login` + `.nav-cta` pattern from Pass 0.5 formalised. Mobile: both stay visible.

### Commit 9 — `design(system): bottom nav for mobile app`
- **Files:** `css/components/bottom-nav.css`, `app.html` structure.
- **Test:** below 768px the bottom nav is present; above it's hidden. Safe-area-inset handled.
- **Acceptance:** four slots (dashboard / exercise / writing / settings) with 56px height + safe-area padding. Active state uses `--brand-light`.

### Commit 10 — `design(system): 44px touch-target lint + fix .btn-sm`
- **Files:** `.stylelint.config.js` (new rule), fix `style.css:1027` `.btn-sm` to `min-height: 44px`.
- **Test:** stylelint fails if a selector matching interactive elements has computed height <44px (heuristic: padding + font-size calc).
- **Acceptance:** CI runs stylelint; it's green.

---

## Gate D — Per-screen re-skins (branch `design-system/gate-d-app`)

One commit per screen. Each: capture before screenshot, apply token migration, capture after, commit.

### Commit 11 — `design(system): dashboard re-skin against tokens`
- **Files:** `style.css` dashboard section (`.dashboard-*` rules), possibly `app.html` structural tweaks for two-column grid.
- **Test:** `tests/dashboard.visual.test.js` (playwright) — screenshot at 1440×900 matches the mock in SCREENS.md §3.
- **Acceptance:** desktop shows ≥960px content. Two-column stats/activity grid at ≥1024. Mobile single-column unchanged.

### Commit 12 — `design(system): learning path re-skin`
- Same pattern as 11, for learning-path screen.

### Commit 13 — `design(system): vocab exercise + side feedback panel`
- **Files:** `style.css:391`+ `.game-content`, feedback panel new structure, `app.html` adds right column.
- **Acceptance:** ≥1200px shows side panel. Below that, feedback appears inline as today.

### Commit 14 — `design(system): writing exercise + rubric side panel`
- Same pattern. Rubric pulled from a small static JSON in `lib/rubric.js`.

### Commit 15 — `design(system): grammar + reading + matching + gap-fill re-skins`
- Bundle the remaining exercise types — each is a small file-local change. Budget ~80 lines diff per exercise.

### Commit 16 — `design(system): exam screen two-column layout`
- **Acceptance:** exam reading comprehension shows text + questions side-by-side ≥1200px. Timer stays mono + pinned top-right.

---

## Gate E — Landing + marketing (branch `design-system/gate-e-landing`)

### Commit 17 — `design(system): landing re-skin on unified tokens`
- **Files:** `landing.css`, `index.html` minor structural tweaks. Widen content cap to 1080. FAQ list 800. Hero CTA untouched width.
- **Acceptance:** visual match to SCREENS §1. Lighthouse perf ≥85 maintained.

### Commit 18 — `design(system): pricing + legal pages inherit tokens`
- **Files:** `pricing.html`, `privacy.html`, `terms.html`, `refund.html`, `diagnose.html`.
- **Acceptance:** all remove their inline `<style>` blocks in favour of token-driven shared classes. Footer links use `.footer-link` utility (kills the last 20 inline styles from AUDIT §6).

### Commit 19 — `design(system): blog palette + serif body`
- **Files:** every file under `blog/`. Apply `--font-serif` (Lora) for body, `--font-display` for titles. Reuse token colours.
- **Acceptance:** every blog post visually consistent with the design system. No inline `<style>` blocks remain.

### Commit 20 — `design(system): light mode + toggle`
- **Files:** `js/theme.js` (inline in `<head>` of every HTML), settings panel entry.
- **Test:** toggling theme swaps every token without layout shift. `prefers-color-scheme` drives `auto`.
- **Acceptance:** entire app + marketing works in both modes. axe clean on both.

---

## Total: 20 commits, 5 PRs

Gate A: 4 · Gate B: 3 · Gate C: 3 · Gate D: 6 · Gate E: 4.

Diff budget per PR: ~500 lines. Gate D is the risky one — it touches every screen. Split into two PRs (D1 dashboard+path+exam; D2 exercises) if combined diff exceeds 800 lines.

## Test budget per gate

- axe-core: must be green after every commit, not just every gate.
- Lighthouse mobile perf: captured after Gate A, C, E. No regression ≥3 points.
- Visual regression: one screenshot per screen per gate, stored under `design-system/screenshots/gate-{a,b,c,d,e}/`.
- Unit tests: token existence, typography sizes, skeleton structure, modal focus trap.
