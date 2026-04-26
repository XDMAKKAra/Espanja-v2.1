# Dashboard Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Puheo dashboard around an editorial two-column (main + rail) shell, fix wasted-space-on-PC, replace flat hierarchy with confident type, and lay foundation tokens that the rest of the app will adopt in Spec 2.

**Architecture:** New CSS shell grid (`sidebar | main | rail`) with content capped via `.app-main-inner`. New typography utility classes (`.eyebrow`, `.display`, `.section-h`, mono numerals). Dashboard `.dash-*` rules extracted from the 5775-line `style.css` into `css/components/dashboard.css`. Day's drill CTA logic isolated in a new `js/screens/dash-cta.js` module — purely additive, tested with vitest. All existing data IDs and wiring preserved.

**Tech Stack:** Vanilla HTML/CSS/JS (no framework, no build step). Vitest for unit tests. Manual visual verification at 5 viewport sizes (390 / 768 / 1280 / 1440 / 1920). `node --check` pre-commit on touched JS (per project convention — see `feedback_node_check_before_commit`). `sw.js` `CACHE_VERSION` bump on any `STATIC_ASSETS` edit (per project convention — see `feedback_sw_cache_bump`).

**Spec:** `docs/superpowers/specs/2026-04-26-dashboard-editorial-redesign-design.md`

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `style.css` | edit (`:root` + remove dashboard rules) | Token source of truth; non-dashboard rules stay |
| `css/components/typography.css` | NEW | Editorial type utilities: `.eyebrow`, `.display`, `.section-h`, mono numerals |
| `css/components/app-shell.css` | NEW | 3-column grid (sidebar / main / rail) + responsive collapse |
| `css/components/dashboard.css` | NEW (extracted) | All `.dash-*` rules, restyled against the new system |
| `css/components/rail.css` | NEW | Persistent right rail blocks (`.rail-stat`, `.rail-countdown`, `.rail-goal`) |
| `css/components/card.css` | minor edit | Drop shadow at rest |
| `css/components/button.css` | minor edit | Add `.btn--cta` (the navy day-drill block) |
| `app.html` | edit | Shell wrap; dashboard markup rewrite; rail container; new `<link>` tags |
| `js/screens/dash-cta.js` | NEW | Day's drill CTA selection logic — pure function + DOM update |
| `js/screens/dashboard.js` | minor edit | Call `dash-cta` updater; remove duplicated banner/SR-bar wiring |
| `tests/dash-cta.test.js` | NEW | Vitest unit tests for selection logic |
| `design-system/DESIGN.md` | edit (append) | New propagation rules section |
| `sw.js` | edit (multiple times) | Bump `CACHE_VERSION`; add new CSS + JS files to `STATIC_ASSETS` |

`app.js`, `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js` are all untouched.

**Convention notes:**
- Every commit that touches a file in `STATIC_ASSETS` bumps `CACHE_VERSION` in the same commit. Today's value is `puheo-v29`; the first bump in this plan goes to `puheo-v30`. Each subsequent bump increments by one.
- `node --check js/screens/<file>.js` before committing any change to a screen module — vitest doesn't import these.
- Conventional commit prefixes: `feat(ux):`, `refactor(css):`, `chore(tokens):`, `style(dashboard):`.

---

## Task 1: Add new foundation tokens (additive only)

Add the new layout and type tokens. **Do not remove anything yet.** This task is purely additive so the app keeps rendering identically while new tokens become available for later tasks.

**Files:**
- Modify: `style.css:19-141` (the `:root` block)

- [ ] **Step 1: Read current `:root` block**

Read `style.css:19-141`. Confirm the existing tokens you'll be sitting next to.

- [ ] **Step 2: Append new tokens after the existing scale**

Find the closing `}` of the `:root` block and insert before it:

```css
  /* === Editorial redesign — Spec 1 (added 2026-04-26) === */

  /* Layout shell tokens */
  --app-sidebar:    220px;
  --app-main-min:   640px;
  --app-main-max:   880px;
  --app-rail:       320px;
  --app-gutter-x:   56px;
  --app-gutter-y:   56px;
  --bp-rail:        1180px;

  /* Editorial type scale */
  --fs-display:    clamp(2.5rem, 4.2vw, 3.5rem);
  --fs-mono-lg:    2.25rem;
  --fs-mono-md:    1.375rem;
  --fs-mono-sm:    0.75rem;
  --fs-meta:       0.6875rem;
  --ls-display:    -0.025em;
  --ls-eyebrow:    0.14em;
```

The existing `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-body`, `--fs-body-sm`, `--fs-caption`, `--fs-mono` stay (they're still used by non-dashboard screens). The new `--fs-display` is what the greeting H1 will use.

- [ ] **Step 3: Verify the app still renders unchanged**

Run `npm run dev`, open `http://localhost:3000/app.html`, log in to a test account. Confirm dashboard renders identically to before — no token is yet consumed.

- [ ] **Step 4: Commit**

```bash
git add style.css
git commit -m "$(cat <<'EOF'
chore(tokens): add editorial layout + type tokens

Additive only — new tokens for the dashboard redesign (shell grid widths,
display type scale, mono sizes). No consumers yet; nothing renders differently.
EOF
)"
```

---

## Task 2: Create the three new CSS files and wire them into `app.html`

Create `typography.css`, `app-shell.css`, and `rail.css` with all classes the dashboard rebuild will need. Wire them into `app.html`. Bump SW cache. Selectors don't yet match anything in the DOM, so the visual is unchanged.

**Files:**
- Create: `css/components/typography.css`
- Create: `css/components/app-shell.css`
- Create: `css/components/rail.css`
- Modify: `app.html:25` (add three `<link>` tags)
- Modify: `sw.js:1-27` (bump version, add new files)

- [ ] **Step 1: Write `css/components/typography.css`**

```css
/* Editorial typography utilities — see DESIGN.md "Editorial system" §
   Used by dashboard (Spec 1) and every screen migrated in Spec 2. */

.eyebrow {
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  line-height: 1;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.display {
  font-family: var(--font-display);
  font-size: var(--fs-display);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: var(--ls-display);
  color: var(--ink);
  margin: 0;
}

.display .accent {
  font-style: normal;
  color: var(--accent-hover);
}

.section-h {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 28px 0 14px;
}

.section-h h3 {
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--ink);
}

.section-h a {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  font-weight: 500;
  color: var(--ink-faint);
  text-decoration: none;
}

.section-h a:hover { color: var(--ink); }

.mono-num {
  font-family: var(--font-mono);
  font-feature-settings: "tnum" 1;
  color: var(--ink);
}

.mono-num--lg { font-size: var(--fs-mono-lg); font-weight: 600; line-height: 1; }
.mono-num--md { font-size: var(--fs-mono-md); font-weight: 600; line-height: 1; }
.mono-num--sm { font-size: var(--fs-mono-sm); font-weight: 500; line-height: 1; }
```

- [ ] **Step 2: Write `css/components/app-shell.css`**

```css
/* App shell grid — sidebar + main + rail
   See spec §2.1 + §3.4 for breakpoints. */

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns:
    var(--app-sidebar)
    minmax(var(--app-main-min), 1fr)
    var(--app-rail);
  background: var(--bg);
}

/* When a screen has no rail, app-shell becomes 2-column.
   Toggle via [data-rail="off"] on .app-shell. */
.app-shell[data-rail="off"] {
  grid-template-columns: var(--app-sidebar) 1fr;
}

.app-main {
  grid-column: 2 / 3;
  padding: var(--app-gutter-y) var(--app-gutter-x);
  min-width: 0; /* prevent grid blowout */
}

.app-main-inner {
  max-width: var(--app-main-max);
  margin: 0;
}

.app-rail {
  grid-column: 3 / 4;
  background: var(--surface);
  border-left: 1px solid var(--border);
  padding: var(--app-gutter-y) 28px 32px;
  min-width: 0;
}

/* === 1024–1179 px: rail moves below main as horizontal strip === */
@media (max-width: 1179px) {
  .app-shell {
    grid-template-columns: var(--app-sidebar) 1fr;
    grid-template-rows: 1fr auto;
  }
  .app-main { grid-column: 2 / 3; grid-row: 1 / 2; padding: 40px; }
  .app-rail {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    border-left: 0;
    border-top: 1px solid var(--border);
    padding: 24px 40px;
  }
}

/* === 768–1023 px: sidebar collapses (existing top-nav takes over) === */
@media (max-width: 1023px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }
  .app-main  { grid-column: 1 / -1; padding: 24px; }
  .app-rail  { grid-column: 1 / -1; padding: 16px 24px; }
  .app-sidebar { display: none; }
}

/* === < 768 px: rail folds into a 2x2 stat strip === */
@media (max-width: 767px) {
  .app-main { padding: 16px; }
  .app-rail { padding: 12px 16px; }
}
```

- [ ] **Step 3: Write `css/components/rail.css`**

```css
/* Right rail blocks — used by dashboard (Spec 1). */

.rail__group + .rail__group { margin-top: 28px; }

.rail__h {
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin: 0 0 10px;
}

.rail-stat {
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.rail-stat:first-of-type { border-top: 0; padding-top: 0; }

.rail-stat__v {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-lg);
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  font-feature-settings: "tnum" 1;
}
.rail-stat__v small {
  font-size: var(--fs-mono-sm);
  font-weight: 500;
  color: var(--ink-faint);
  margin-left: 4px;
}
.rail-stat__l {
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-top: 6px;
}
.rail-stat__delta {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
  font-weight: 500;
  color: var(--success);
  margin-left: 8px;
}
.rail-stat__delta--down { color: var(--error); }

.rail-countdown {
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.rail-countdown__big {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-lg);
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
  font-feature-settings: "tnum" 1;
}
.rail-countdown.is-urgent .rail-countdown__big { color: var(--error); }
.rail-countdown__lbl {
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-top: 6px;
}

.rail-goal {
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.rail-goal__v {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-md);
  font-weight: 600;
  line-height: 1;
  color: var(--ink);
}
.rail-goal__v small {
  font-size: var(--fs-mono-sm);
  font-weight: 500;
  color: var(--ink-faint);
}
.rail-goal__bar {
  height: 4px;
  background: var(--surface-2);
  border-radius: 2px;
  margin-top: 10px;
  overflow: hidden;
}
.rail-goal__bar i {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 200ms var(--ease-out);
}
.rail-goal__l {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  color: var(--ink-faint);
  margin-top: 8px;
}

.rail-footer {
  margin-top: 32px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  color: var(--ink-faint);
}

/* Horizontal strip mode (≤ 1179 px) — see app-shell.css */
@media (max-width: 1179px) {
  .app-rail {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }
  .app-rail .rail__h,
  .app-rail .rail-footer { display: none; }
  .rail-stat,
  .rail-countdown,
  .rail-goal {
    border-top: 0;
    padding: 0;
  }
  .rail-stat__v,
  .rail-countdown__big {
    font-size: var(--fs-mono-md);
  }
}
@media (max-width: 767px) {
  .app-rail {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
```

- [ ] **Step 4: Wire the three files into `app.html`**

Find `app.html:25` (`<link rel="stylesheet" href="style.css" />`). Insert immediately after:

```html
  <link rel="stylesheet" href="css/components/typography.css" />
  <link rel="stylesheet" href="css/components/app-shell.css" />
  <link rel="stylesheet" href="css/components/rail.css" />
```

- [ ] **Step 5: Bump `sw.js` cache and add new files to `STATIC_ASSETS`**

In `sw.js:1`, change `puheo-v29` to `puheo-v30`. In `sw.js:2-27`, add three entries near the other CSS:

```javascript
const CACHE_VERSION = "puheo-v30";
const STATIC_ASSETS = [
  "/app.html",
  "/index.html",
  "/style.css",
  "/landing.css",
  "/css/components/typography.css",
  "/css/components/app-shell.css",
  "/css/components/rail.css",
  "/manifest.json",
  // … existing entries
];
```

- [ ] **Step 6: Verify nothing rendered differently**

Hard-refresh `http://localhost:3000/app.html` (DevTools → Network → "Disable cache" → reload). Confirm dashboard renders identically. The new selectors aren't matched yet.

- [ ] **Step 7: Commit**

```bash
git add css/components/typography.css css/components/app-shell.css css/components/rail.css app.html sw.js
git commit -m "$(cat <<'EOF'
feat(ux): add editorial CSS primitives — typography, app-shell, rail

Three new component files for the dashboard redesign:
- typography.css: .eyebrow, .display, .section-h, mono number utilities
- app-shell.css: 3-column grid + responsive collapse
- rail.css: persistent right-rail blocks

Wired into app.html; SW cache bumped to v30. No DOM consumers yet.
EOF
)"
```

---

## Task 3: Drop legacy `--brand*` token aliases

Migrate every consumer of `--brand`, `--brand-btn`, `--brand-light`, `--brand-glow` to canonical tokens, then delete the aliases.

**Files:**
- Modify: every file that grep finds (mostly `style.css`, `css/components/*.css`, possibly `landing.css`, `app.html`, `index.html`)

- [ ] **Step 1: Audit usage**

Run from project root:

```bash
grep -rn "var(--brand)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--brand-btn)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--brand-light)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--brand-glow)" --include='*.css' --include='*.html' --include='*.js'
```

- [ ] **Step 2: Replace each with the canonical token**

Mapping (per the legacy block at `style.css:131-140`):
- `var(--brand)` → `var(--accent)`
- `var(--brand-btn)` → `var(--accent-hover)`
- `var(--brand-light)` → `var(--accent)`
- `var(--brand-glow)` → delete the rule containing it (these are all leftover halo effects from the pre-restraint era; the spec forbids them)

For each file the grep hit, open it, replace via Edit tool. If `--brand-glow` appears in a `box-shadow` rule, delete the entire rule. If it appears as a fallback in a longer `box-shadow` chain, remove just that layer.

- [ ] **Step 3: Delete the four token declarations**

In `style.css:131-140`, remove these four lines:
```css
  --brand:       var(--accent);
  --brand-btn:   var(--accent-hover);
  --brand-light: var(--accent);
  --brand-glow:  rgba(45, 212, 191, 0.15);
```

- [ ] **Step 4: Verify visual diff**

Hard-refresh `app.html` and `index.html` in browser. Click through dashboard, vocab, grammar, writing, settings. Compare against pre-change screenshots. There should be **zero** visible differences (these were aliases, not unique values).

- [ ] **Step 5: Re-run the audit greps**

Same four `grep` commands. They should return no matches.

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "$(cat <<'EOF'
chore(tokens): drop --brand* legacy aliases

Migrated every consumer to canonical --accent / --accent-hover.
--brand-glow rules deleted (halo effects forbidden by mint+navy spec).
No visual change — aliases shared values with their canonicals.
EOF
)"
```

---

## Task 4: Drop `--gold`, `--accent2`, `--correct`, `--wrong` aliases

Same pattern as Task 3, different tokens.

**Files:** any file the greps hit.

- [ ] **Step 1: Audit usage**

```bash
grep -rn "var(--gold)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--accent2)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--correct)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--wrong)" --include='*.css' --include='*.html' --include='*.js'
```

- [ ] **Step 2: Replace each**

- `var(--gold)` → `var(--accent)`
- `var(--accent2)` → `var(--accent-hover)`
- `var(--correct)` → `var(--success)`
- `var(--wrong)` → `var(--error)`

- [ ] **Step 3: Delete the four declarations**

In `style.css`, remove from the legacy alias block:
```css
  --accent2:     var(--accent-hover);
  --gold:        var(--accent);
  --correct:     var(--success);
  --wrong:       var(--error);
```

- [ ] **Step 4: Verify visual diff**

Hard-refresh; click through every screen with semantic feedback colours (vocab grading, writing feedback, exam scores). Confirm no colour shift.

- [ ] **Step 5: Re-run greps to confirm zero matches**

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "$(cat <<'EOF'
chore(tokens): drop --gold/--accent2/--correct/--wrong aliases

Migrated every consumer to --accent / --accent-hover / --success / --error.
No visual change.
EOF
)"
```

---

## Task 5: Drop `--surface2`, `--radius`, `--text*` aliases (final cleanup)

Largest of the cleanup tasks — `--text` aliases are widely used. Verify carefully.

**Files:** the greps will find many.

- [ ] **Step 1: Audit usage**

```bash
grep -rn "var(--surface2)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--radius)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--text)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--text-muted)" --include='*.css' --include='*.html' --include='*.js'
grep -rn "var(--text-faint)" --include='*.css' --include='*.html' --include='*.js'
```

`--text` is the most likely to have many hits. Keep going — each is a 1-token replace.

- [ ] **Step 2: Replace each**

- `var(--surface2)` → `var(--surface-2)`
- `var(--radius)` → `var(--r-md)`
- `var(--text)` → `var(--ink)`
- `var(--text-muted)` → `var(--ink-soft)`
- `var(--text-faint)` → `var(--ink-faint)`

For files with many hits, use `Edit` with `replace_all: true`.

- [ ] **Step 3: Delete the legacy alias block**

In `style.css` (around line 130–140 after prior cleanups), remove the entire `/* Legacy aliases */` block. The `:root` ends with the new editorial tokens added in Task 1.

- [ ] **Step 4: Verify visual diff carefully**

Hard-refresh. Walk through: dashboard, vocab (during a question), grammar, writing (during feedback), exam, settings, onboarding. Look for any text colour shift, any radius change, any surface fill flip. Investigate any anomaly before proceeding.

- [ ] **Step 5: Re-run greps to confirm zero matches**

- [ ] **Step 6: Commit**

```bash
git add -u
git commit -m "$(cat <<'EOF'
chore(tokens): drop final legacy aliases (--surface2, --radius, --text*)

Migrated to --surface-2 / --r-md / --ink / --ink-soft / --ink-faint.
Token cleanup complete — :root now contains only the canonical mint+navy
tokens plus the new editorial tokens from Task 1.
EOF
)"
```

---

## Task 6: Wrap `app.html` shell in the grid + extract `dashboard.css`

Two related changes that go together: convert the body's flex layout into the new grid, and move all `.dash-*` rules out of `style.css` into a focused dashboard component file. Visual should remain unchanged after this task — this is structural prep for the rebuild.

**Files:**
- Modify: `app.html` (shell wrap around existing markup)
- Modify: `style.css` (remove `.dash-*` rules, remove flex on body)
- Create: `css/components/dashboard.css` (paste extracted rules)
- Modify: `sw.js` (bump version, add dashboard.css)

- [ ] **Step 1: Find the `.dash-*` rule range in `style.css`**

```bash
grep -n "^\.dash-" style.css | head -3
grep -n "^\.dash-" style.css | tail -3
```

This gives the first and last `.dash-*` rule lines. Note them (will be roughly 600–2050 based on grep output).

- [ ] **Step 2: Cut `.dash-*` rules to `css/components/dashboard.css`**

Use Read to read the range, Write the content to `css/components/dashboard.css` with a header comment:

```css
/* Dashboard component styles — extracted from style.css 2026-04-26.
   Spec: docs/superpowers/specs/2026-04-26-dashboard-editorial-redesign-design.md
   Rules below will be progressively rewritten in subsequent tasks.
   For now, identical to the rules previously in style.css. */
```

Then use Edit on `style.css` to delete the same range.

- [ ] **Step 3: Wrap `app.html` shell in grid**

Find `app.html:27` (`<body>`). The current structure is:

```
<body>
  ... header things ...
  <aside class="app-sidebar">...</aside>
  <main id="app-main">
    <div id="screen-dashboard">...</div>
    ... other screens ...
  </main>
  ... bottom nav etc ...
</body>
```

Wrap `<aside class="app-sidebar">` and `<main id="app-main">` in a `.app-shell` container (leave header / overlay / bottom-nav siblings outside the shell):

```html
<div class="app-shell" id="app-shell">
  <aside class="app-sidebar">...</aside>
  <main class="app-main" id="app-main">
    <div class="app-main-inner">
      <!-- existing screens stay here unchanged for now -->
      <div id="screen-dashboard" class="screen">
        <div class="dashboard-inner">
          ... existing content ...
        </div>
      </div>
      ... other screens ...
    </div>
  </main>
  <aside class="app-rail" id="app-rail" hidden></aside>
</div>
```

The rail is rendered hidden for this task — no content yet. The `hidden` attribute removes it from the grid (browser native behavior).

Note: the existing `body { display: flex; overflow: hidden }` in `style.css:169-176` fights the new grid. Remove `display: flex` and `overflow: hidden` from `body`; keep `min-height: 100vh`. The shell's grid handles layout now.

- [ ] **Step 4: Drop `max-width: var(--w-desktop)` from `.dashboard-inner`**

In `css/components/dashboard.css` (just extracted), find the `.dashboard-inner` rule. Remove its `max-width` and centering. The `.app-main-inner` wrapper now caps width.

- [ ] **Step 5: Wire `dashboard.css` and bump SW**

In `app.html` `<head>`, after the three CSS links from Task 2, add:

```html
  <link rel="stylesheet" href="css/components/dashboard.css" />
```

In `sw.js`: bump to `puheo-v31`, add `"/css/components/dashboard.css"` to `STATIC_ASSETS`.

- [ ] **Step 6: Verify dashboard renders unchanged on multiple widths**

Hard-refresh. Resize browser through 1920 → 1440 → 1280 → 1024 → 768 → 390. The dashboard content should appear in the same place visually as before, with the rail slot empty (since `app-rail` is `hidden`). No horizontal overflow at any width.

If the layout breaks, the most likely cause is the `body` flex removal. Inspect with DevTools and reconcile.

- [ ] **Step 7: Run `node --check` on touched JS (none in this task, but confirm habit)**

```bash
# No JS touched in this task. Skip.
```

- [ ] **Step 8: Commit**

```bash
git add app.html style.css css/components/dashboard.css sw.js
git commit -m "$(cat <<'EOF'
refactor(css): extract dashboard rules + wrap app.html in grid shell

Dashboard styles moved to css/components/dashboard.css (was buried in
the 5775-line style.css). app.html body now uses the .app-shell grid
from app-shell.css. Rail slot reserved (hidden until dashboard rebuild
fills it). No visual change at this stage.

SW cache bumped to v31.
EOF
)"
```

---

## Task 7: Rebuild dashboard greeting block + hero grade card

Two visual rebuilds in the main column. Replace `.dash-header` with the editorial greeting (eyebrow + display H1 + sub) and re-style `.dash-hero-grade` to the border-bracketed pattern (no shadow, hairline top + bottom).

**Files:**
- Modify: `app.html` (greeting markup, hero grade markup)
- Modify: `css/components/dashboard.css` (rewrite `.dash-greeting`, `.dash-hero-grade` rules)
- Modify: `js/screens/dashboard.js` (preserve dynamic greeting/motivation injection)
- Modify: `sw.js` (bump version)

- [ ] **Step 1: Replace `.dash-header` markup in `app.html`**

Find `app.html:426-435` (the `.dash-header` block). Replace with:

```html
      <header class="dash-greeting">
        <p class="eyebrow"><time id="dash-date">—</time></p>
        <h1 class="display">Hei, <span id="dash-username"></span><span class="accent">.</span></h1>
        <p class="dash-greeting__sub" id="dash-motivation"></p>
      </header>
```

Note: the pro badge + logout that lived in `.dash-header` are deferred to Task 11 (move to sidebar footer). Remove them from this block. The IDs `dash-username` and `dash-motivation` are preserved so existing `js/screens/dashboard.js` wiring keeps working.

- [ ] **Step 2: Add dynamic date wiring to `js/screens/dashboard.js`**

Find the function that runs on dashboard mount in `js/screens/dashboard.js` (search for `dash-username`). At the top of that function, add:

```javascript
  const dateEl = document.getElementById("dash-date");
  if (dateEl) {
    const now = new Date();
    const weekday = now.toLocaleDateString("fi-FI", { weekday: "long" });
    const dm = now.toLocaleDateString("fi-FI", { day: "numeric", month: "numeric" });
    dateEl.textContent = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} · ${dm}`;
    dateEl.setAttribute("datetime", now.toISOString().slice(0, 10));
  }
```

- [ ] **Step 3: Rewrite `.dash-greeting` rules in `css/components/dashboard.css`**

Find the existing `.dash-header` rules and replace with:

```css
.dash-greeting {
  margin-bottom: 32px;
}
.dash-greeting .display {
  margin: 8px 0 12px;
  max-width: 14ch;
}
.dash-greeting__sub {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  line-height: 1.5;
  color: var(--ink-soft);
  margin: 0;
  max-width: 50ch;
}
```

Delete any `.dash-header`, `.dash-greeting` (old), `.dash-motivation`, `.dash-pro-area` rules left over.

- [ ] **Step 4: Rewrite `.dash-hero-grade` to border-bracketed pattern**

In `css/components/dashboard.css`, find `.dash-hero-grade` and replace its rules (and all its children's rules) with:

```css
.dash-hero-grade {
  display: flex;
  gap: 28px;
  align-items: center;
  padding: 22px 0 24px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 32px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
  color: inherit;
}
.dash-hero-grade:hover { background: transparent; }
.dash-hero-grade:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }

.dash-hero-left { flex: 0 0 auto; }
.dash-hero-grade-circle {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--surface);
  border: 2px solid var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: var(--fs-display);
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
}

.dash-hero-right { flex: 1; min-width: 0; }
.dash-hero-label {
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 6px;
}
.dash-hero-sub {
  font-family: var(--font-display);
  font-size: var(--fs-h2);
  font-weight: 700;
  line-height: 1.2;
  color: var(--ink);
  margin: 0 0 8px;
}
.dash-hero-scale { display: flex; gap: 4px; margin-bottom: 8px; }
.dash-hero-scale span {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: var(--surface-2);
  font-family: var(--font-display);
  font-size: var(--fs-mono-sm);
  font-weight: 600;
  line-height: 22px;
  text-align: center;
  color: var(--ink-faint);
}
.dash-hero-scale span.is-current {
  background: var(--ink);
  color: var(--bg);
}
.dash-hero-caption {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  color: var(--ink-faint);
  max-width: 38ch;
  margin: 0;
}

/* Tier modifiers — tone the circle border by tier (no fill) */
.dash-hero-grade--tier-none .dash-hero-grade-circle { border-color: var(--border-strong); color: var(--ink-faint); }
.dash-hero-grade--tier-low  .dash-hero-grade-circle { border-color: var(--ink-soft); }
.dash-hero-grade--tier-mid  .dash-hero-grade-circle { border-color: var(--ink); }
.dash-hero-grade--tier-high .dash-hero-grade-circle { border-color: var(--accent-hover); color: var(--accent-hover); }
```

- [ ] **Step 5: Update hero scale rendering to use `.is-current`**

In `js/screens/dashboard.js`, search for where `dash-hero-scale` chips get marked active. The previous active class was likely `.active` or `.current`. Update to `.is-current` to match the new CSS. (If you don't find an existing class, set `.is-current` on the matching `data-g` element.)

- [ ] **Step 6: `node --check` on dashboard.js**

```bash
node --check js/screens/dashboard.js
```

Expected: silent (no parse errors).

- [ ] **Step 7: Verify visually at 1440 × 900 and 768 × 1024**

Hard-refresh. Confirm:
- Date eyebrow renders ("Tiistai · 26.4." style)
- "Hei, <name>." renders at display size with mint period
- Hero grade card has top + bottom hairlines, no shadow, no fill
- Grade circle renders (96 px, navy border, letter inside)
- Scale row chips render; current chip is the inverted (navy fill, white text) one
- No horizontal overflow

Compare side-by-side against the approved browser mockup (`.superpowers/brainstorm/<sid>/content/dashboard-mockup.html`).

- [ ] **Step 8: Bump SW + commit**

In `sw.js`, bump to `puheo-v32`.

```bash
git add app.html css/components/dashboard.css js/screens/dashboard.js sw.js
git commit -m "$(cat <<'EOF'
feat(ux): dashboard greeting + hero grade — editorial pass

- Replace .dash-header with eyebrow date + display H1 + motivational sub
- Rebuild .dash-hero-grade as border-bracketed (top + bottom hairlines,
  no shadow, no fill) per editorial spec §3.3
- 96px navy-bordered grade circle; scale chips use .is-current
- Pro badge / logout deferred to sidebar footer (Task 11)

SW cache bumped to v32.
EOF
)"
```

---

## Task 8: Day's drill CTA — module + tests + DOM block

Build the unified Day's drill CTA. Pure-function selection logic in a new module; vitest unit tests; a single DOM block in `app.html` that the module updates on dashboard mount; removal of the three banners it replaces.

**Files:**
- Create: `js/screens/dash-cta.js`
- Create: `tests/dash-cta.test.js`
- Modify: `app.html` (add the CTA block; remove `.dash-onboarding-banner`, `.sr-top-bar`, `.dash-sr-review` blocks)
- Modify: `css/components/button.css` (add `.btn--cta`)
- Modify: `js/screens/dashboard.js` (call the CTA updater on mount; remove banner-show/SR-bar wiring)
- Modify: `sw.js` (bump version, add dash-cta.js)

- [ ] **Step 1: Write failing test `tests/dash-cta.test.js`**

```javascript
import { describe, it, expect } from "vitest";
import { selectDashboardCta } from "../js/screens/dash-cta.js";

describe("selectDashboardCta", () => {
  it("returns onboarding CTA when profile incomplete (highest priority)", () => {
    const result = selectDashboardCta({
      profileComplete: false,
      srDueCount: 5,           // would otherwise win
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("onboarding");
    expect(result.title).toMatch(/Täydennä profiilisi/i);
    expect(result.target).toBe("onboarding");
  });

  it("returns SR review CTA when cards are due and profile complete", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 12,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("sr");
    expect(result.title).toMatch(/Kertaa nyt/i);
    expect(result.title).toContain("12");
    expect(result.target).toBe("sr-review");
  });

  it("returns daily drill CTA when no due cards and profile complete", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 0,
      weakestTopic: "preterito",
    });
    expect(result.kind).toBe("drill");
    expect(result.title).toMatch(/Aloita päivän treeni/i);
    expect(result.meta).toMatch(/PRETERITO/i);
    expect(result.target).toBe("vocab");
  });

  it("falls back to generic drill copy when weakestTopic is missing", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: 0,
      weakestTopic: null,
    });
    expect(result.kind).toBe("drill");
    expect(result.meta).not.toContain("null");
    expect(result.meta).toMatch(/sanaa/i);
  });

  it("treats undefined srDueCount as zero", () => {
    const result = selectDashboardCta({
      profileComplete: true,
      srDueCount: undefined,
      weakestTopic: "ser-vs-estar",
    });
    expect(result.kind).toBe("drill");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run tests/dash-cta.test.js
```

Expected: FAIL — module doesn't exist (`Cannot find module`).

- [ ] **Step 3: Write `js/screens/dash-cta.js`**

```javascript
/* Dashboard "Day's drill" CTA — selection logic + DOM updater.
   Spec: docs/superpowers/specs/2026-04-26-dashboard-editorial-redesign-design.md §3.3
   Selection priority (first match wins):
     1. Profile incomplete  → onboarding
     2. SR cards due        → SR review
     3. Default             → daily drill (seeded with weakest topic) */

export function selectDashboardCta({ profileComplete, srDueCount, weakestTopic }) {
  if (!profileComplete) {
    return {
      kind: "onboarding",
      title: "Täydennä profiilisi",
      meta: "2 MIN · RÄÄTÄLÖI HARJOITTELU",
      target: "onboarding",
    };
  }

  const due = Number(srDueCount) || 0;
  if (due > 0) {
    return {
      kind: "sr",
      title: `Kertaa nyt — ${due} ${due === 1 ? "kortti" : "korttia"}`,
      meta: `${due} ODOTTAA · ~${Math.max(2, Math.round(due / 4))} MIN`,
      target: "sr-review",
    };
  }

  const topicTag = weakestTopic
    ? String(weakestTopic).toUpperCase()
    : null;
  return {
    kind: "drill",
    title: "Aloita päivän treeni",
    meta: topicTag
      ? `20 SANAA · 5 MIN · ${topicTag}`
      : "20 SANAA · 5 MIN",
    target: "vocab",
  };
}

export function renderDashboardCta(rootEl, state) {
  if (!rootEl) return;
  const { title, meta, target, kind } = selectDashboardCta(state);
  const titleEl = rootEl.querySelector("[data-cta-title]");
  const metaEl = rootEl.querySelector("[data-cta-meta]");
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = meta;
  rootEl.dataset.target = target;
  rootEl.dataset.kind = kind;
}
```

- [ ] **Step 4: Run the test — verify it passes**

```bash
npx vitest run tests/dash-cta.test.js
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Add `.btn--cta` to `css/components/button.css`**

Append:

```css
/* Day's drill CTA — single primary action on the dashboard.
   Navy block, mint arrow, mono meta. */
.btn--cta {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 18px 20px;
  background: var(--ink);
  color: var(--bg);
  border: 0;
  border-radius: var(--r-md);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-display);
  margin-bottom: 36px;
  transition: background 120ms var(--ease-out);
}
.btn--cta:hover { background: #1F2937; }
.btn--cta:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.btn--cta__title {
  flex: 1;
  font-size: var(--fs-h3);
  font-weight: 600;
  line-height: 1.1;
  margin: 0 0 3px;
  color: var(--bg);
}
.btn--cta__meta {
  display: block;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--ink-faint);
}
.btn--cta__arrow {
  font-size: var(--fs-h3);
  font-weight: 600;
  color: var(--accent);
}
```

- [ ] **Step 6: Add the CTA block to `app.html` and remove the three replaced blocks**

Find these three blocks in `app.html` and **delete** them entirely:
- `.dash-onboarding-banner` (around lines 437–444)
- `.sr-top-bar` (around lines 446–451)
- `.dash-sr-review` (around lines 555–559)

Insert the unified CTA block immediately **after** the `.dash-hero-grade` markup (and after the grade explainer modal, before `.dash-level-progress`):

```html
      <button type="button" class="btn--cta" id="dash-day-cta" data-target="vocab" data-kind="drill">
        <div class="btn--cta__l">
          <div class="btn--cta__title" data-cta-title>Aloita päivän treeni</div>
          <div class="btn--cta__meta" data-cta-meta>20 SANAA · 5 MIN</div>
        </div>
        <span class="btn--cta__arrow" aria-hidden="true">→</span>
      </button>
```

- [ ] **Step 7: Wire `js/screens/dashboard.js` to call the updater**

At the top of `js/screens/dashboard.js`, add:

```javascript
import { renderDashboardCta } from "./dash-cta.js";
```

In the dashboard mount function (where `dash-username` is set), after that block, add:

```javascript
  // Day's drill CTA — unified button (onboarding / SR / drill)
  const ctaEl = document.getElementById("dash-day-cta");
  if (ctaEl) {
    renderDashboardCta(ctaEl, {
      profileComplete: state?.profile?.profile_complete === true,
      srDueCount: state?.sr?.dueToday || 0,
      weakestTopic: state?.weakTopics?.[0]?.topic || null,
    });
    ctaEl.onclick = () => {
      const target = ctaEl.dataset.target;
      if (target === "onboarding") window.location.hash = "#onboarding";
      else if (target === "sr-review") document.getElementById("btn-start-review")?.click();
      else document.getElementById("nav-vocab")?.click();
    };
  }
```

(Adjust the `state.*` paths to match the actual shape exposed in `dashboard.js`. Read 30–60 lines around the `dash-username` set to find the right shape.)

Also delete the previously-existing wiring that toggled `.sr-top-bar`, `.dash-sr-review`, and `.dash-onboarding-banner` visibility. Search for those IDs in `dashboard.js` and remove the dead branches.

- [ ] **Step 8: `node --check`**

```bash
node --check js/screens/dashboard.js
node --check js/screens/dash-cta.js
```

Expected: silent.

- [ ] **Step 9: Bump SW + register the new module**

In `sw.js`: bump to `puheo-v33`. Add `"/js/screens/dash-cta.js"` to `STATIC_ASSETS`.

- [ ] **Step 10: Manual verify all three CTA states**

Hard-refresh `app.html`. With a test account where:
- Profile incomplete → CTA reads "Täydennä profiilisi"
- SR cards due > 0 → CTA reads "Kertaa nyt — N korttia"
- Otherwise → CTA reads "Aloita päivän treeni" with mono meta

Click each variant and confirm it routes correctly (onboarding screen / SR review / vocab screen).

- [ ] **Step 11: Re-run tests + commit**

```bash
npx vitest run
```

Expected: all pre-existing tests still pass; new dash-cta tests pass.

```bash
git add js/screens/dash-cta.js tests/dash-cta.test.js app.html css/components/button.css js/screens/dashboard.js sw.js
git commit -m "$(cat <<'EOF'
feat(ux): unified Day's drill CTA — onboarding / SR / drill in one block

Replaces three legacy banners (.dash-onboarding-banner, .sr-top-bar,
.dash-sr-review) with a single navy CTA block on the dashboard. Selection
logic isolated in js/screens/dash-cta.js and unit-tested. Priority:
profile-incomplete > SR-due > daily drill.

SW cache bumped to v33.
EOF
)"
```

---

## Task 9: Weak topics list + activity heatmap + chart restyle

Three small visual rebuilds in the main column. Weak topics goes from cards to numbered rows. Heatmap collapses to a single mint scale. Chart drops chrome.

**Files:**
- Modify: `app.html` (weak-topics section heading; activity section heading; remove `.dash-stats-row` and `.dash-goal-row` blocks — these move to rail in Task 10)
- Modify: `css/components/dashboard.css` (rewrite `.dash-weak-*`, `.dash-heatmap*`, `.dash-chart*`)
- Modify: `js/screens/dashboard.js` (update weak-topic row markup if existing render uses cards)
- Modify: `sw.js` (bump)

- [ ] **Step 1: Inspect the current weak-topic render markup in `js/screens/dashboard.js`**

```bash
grep -n "dash-weak" js/screens/dashboard.js
```

The render function builds DOM nodes for each weak topic. Read 30 lines around the match. Note the current item template (probably uses `.dash-weak-item`, `.dash-weak-top`, `.dash-weak-label`, `.dash-weak-count`, `.dash-weak-bar`).

- [ ] **Step 2: Update the render to emit row markup**

Replace the per-item template in `js/screens/dashboard.js` with:

```javascript
function renderWeakTopicRow(topic, index) {
  const row = document.createElement("div");
  row.className = "dash-weak__row";
  row.innerHTML = `
    <span class="dash-weak__n mono-num mono-num--md">${String(index + 1).padStart(2, "0")}</span>
    <span class="dash-weak__name">${escapeHtml(topic.label)}</span>
    <span class="dash-weak__err mono-num mono-num--sm">${topic.errorCount} virhettä</span>
    <span class="dash-weak__pct mono-num mono-num--sm">${Math.round(topic.accuracy * 100)}%</span>
  `;
  row.addEventListener("click", () => /* existing handler */);
  return row;
}
```

(Match the existing field names from `topic.*` — this is the shape; rename if the actual fields differ. Reuse the existing click handler.)

If `escapeHtml` doesn't already exist in dashboard.js, import or copy a small one — search for "escapeHtml" first.

- [ ] **Step 3: Replace `.dash-weak-*` rules in `css/components/dashboard.css`**

Find all `.dash-weak-*` rules in dashboard.css and replace with:

```css
.dash-weak-topics { margin-bottom: 32px; }
.dash-weak-list { border-top: 1px solid var(--border); }

.dash-weak__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 100ms var(--ease-out);
}
.dash-weak__row:hover { background: var(--surface-2); }

.dash-weak__n   { flex: 0 0 36px; color: var(--ink); }
.dash-weak__name {
  flex: 1;
  font-family: var(--font-display);
  font-size: var(--fs-h3);
  font-weight: 500;
  color: var(--ink);
}
.dash-weak__err { color: var(--error); }
.dash-weak__pct { flex: 0 0 50px; text-align: right; color: var(--ink-faint); }
```

- [ ] **Step 4: Replace `.dash-section-label` with `.section-h <h3>`**

Find every `.dash-section-label` div in `app.html` and rewrite to:

```html
<div class="section-h">
  <h3>Heikoimmat aiheet · 7 päivää</h3>
</div>
```

(Add a secondary `<a>Näytä kaikki</a>` link only on weak-topics, where the spec calls for one. Skip on other sections.)

In `css/components/dashboard.css`, delete the `.dash-section-label` rule (`.section-h` from `typography.css` replaces it).

- [ ] **Step 5: Restyle heatmap to single mint scale**

Find `.dash-heatmap*` rules. Replace the cell colour scale with a 4-step mint:

```css
.dash-heatmap-section { margin-bottom: 28px; }

.dash-heatmap {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 3px;
  padding-top: 8px;
}
.heatmap-cell { aspect-ratio: 1; min-width: auto; border-radius: 2px; background: var(--surface-2); }
.heatmap-cell.l1 { background: #CCFBF1; }   /* matches --accent-soft */
.heatmap-cell.l2 { background: #5EEAD4; }
.heatmap-cell.l3 { background: var(--accent); }
.heatmap-cell.l4 { background: #0F766E; }   /* deeper mint for the busiest days */
```

- [ ] **Step 6: Restyle chart container — drop card chrome**

Find `.dash-chart-section` / `.dash-chart-container` rules and replace with:

```css
.dash-chart-section { margin-bottom: 28px; }
.dash-chart-container {
  height: 120px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--border);
  padding: 0;
}
.dash-chart-empty {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  color: var(--ink-faint);
  padding: 32px 0;
  text-align: center;
}
```

If the chart uses SVG inside, ensure stroke colour is `var(--accent)` and any fill is at low opacity. Inspect the existing render in dashboard.js (search for "chart" inside it) and adjust if the colours are hardcoded.

- [ ] **Step 7: Remove `.dash-stats-row` and `.dash-goal-row` from `app.html`**

These move to the rail in Task 10. **Delete** the markup blocks at:
- `.dash-stats-row` (around lines 497–513)
- `.dash-goal-row` (around lines 516–532)

Their inner IDs (`dash-streak`, `dash-total-sessions`, `dash-week-val`, `dash-week-trend`, `dash-countdown-value`, `dash-today-minutes`, `dash-goal-minutes`, `dash-goal-bar-fill`) move to the rail markup in Task 10. **Do not delete the JS that writes to those IDs** — leave it intact; it'll find the elements again once Task 10 puts them in the rail.

In `css/components/dashboard.css`, delete `.dash-stat-*`, `.dash-goal-*` rules (the rail will have its own).

- [ ] **Step 8: `node --check` + visual verify**

```bash
node --check js/screens/dashboard.js
```

Hard-refresh. Confirm:
- Weak topics renders as numbered rows with mono numerals
- Heatmap shows 4 mint shades, no other colour
- Chart renders without card chrome
- Stats row & goal row are gone (rail empty for now — that's expected; Task 10 fills it)
- No layout breakage

Note: dashboard will look incomplete in this task because rail content moved out of main but isn't placed in rail yet. Task 10 fixes that. Don't ship this commit alone.

- [ ] **Step 9: Bump SW + commit**

`sw.js` → `puheo-v34`.

```bash
git add app.html css/components/dashboard.css js/screens/dashboard.js sw.js
git commit -m "$(cat <<'EOF'
feat(ux): weak-topics list + flat heatmap/chart

- Weak topics: cards → numbered rows with mono numerals
- Heatmap: collapse to single 4-step mint scale
- Chart: drop card chrome, hairline border-bottom only
- Section labels: .dash-section-label → .section-h <h3>
- Removed .dash-stats-row + .dash-goal-row markup (moves to rail in Task 10)

SW cache bumped to v34. Dashboard intentionally incomplete at this commit;
Task 10 places the moved content in the right rail.
EOF
)"
```

---

## Task 10: Rail markup, content, and wiring

Fill the rail container that's been hidden since Task 6. Render 3 stats + countdown + goal + footer. Wire to existing data IDs. Verify responsive collapse.

**Files:**
- Modify: `app.html` (rail markup; remove `hidden` from `app-rail`)
- Modify: `js/screens/dashboard.js` (verify existing IDs still wire — should "just work")
- Modify: `sw.js` (bump)

- [ ] **Step 1: Replace `<aside class="app-rail" id="app-rail" hidden></aside>` with rendered rail**

In `app.html`, find the rail container added in Task 6 and replace with:

```html
<aside class="app-rail" id="app-rail" aria-label="Tilannekatsaus">

  <section class="rail__group" aria-labelledby="rail-today-h">
    <h2 class="rail__h" id="rail-today-h">Tänään</h2>
    <div class="rail-stat">
      <div class="rail-stat__v"><span class="mono-num" id="dash-streak">0</span><small>pv</small></div>
      <div class="rail-stat__l">Putki</div>
    </div>
    <div class="rail-stat">
      <div class="rail-stat__v"><span class="mono-num" id="dash-yo-readiness">—</span><small>%</small></div>
      <div class="rail-stat__l">YO-valmius<span class="rail-stat__delta" id="dash-yo-delta"></span></div>
    </div>
    <div class="rail-stat">
      <div class="rail-stat__v"><span class="mono-num" id="dash-total-sessions">0</span></div>
      <div class="rail-stat__l">Harjoituksia</div>
    </div>
  </section>

  <section class="rail__group" aria-labelledby="rail-exam-h">
    <h2 class="rail__h" id="rail-exam-h">YO-koe</h2>
    <div class="rail-countdown" id="dash-exam-countdown">
      <div class="rail-countdown__big mono-num" id="dash-countdown-value">—</div>
      <div class="rail-countdown__lbl">Päivää · 28.9.2026</div>
    </div>
  </section>

  <section class="rail__group" aria-labelledby="rail-goal-h">
    <h2 class="rail__h" id="rail-goal-h">Tämä viikko</h2>
    <div class="rail-goal" id="dash-daily-goal">
      <div class="rail-goal__v"><span class="mono-num" id="dash-today-minutes">0</span><small>/<span id="dash-goal-minutes">20</span> min</small></div>
      <div class="rail-goal__bar"><i id="dash-goal-bar-fill"></i></div>
      <div class="rail-goal__l">Tänään tavoitteesta</div>
    </div>
  </section>

  <div class="rail-footer">
    Puheo v1.4 · synkattu <span id="dash-rail-sync">—</span>
  </div>
</aside>
```

The IDs `dash-streak`, `dash-total-sessions`, `dash-countdown-value`, `dash-today-minutes`, `dash-goal-minutes`, `dash-goal-bar-fill`, `dash-exam-countdown`, `dash-daily-goal` are unchanged — `js/screens/dashboard.js` writes to them already.

The new ID `dash-yo-readiness` and `dash-yo-delta` may not yet have wiring; if not present in dashboard.js, add minimal wiring after the existing stat updates:

```javascript
  const readinessEl = document.getElementById("dash-yo-readiness");
  if (readinessEl && state?.summary?.readiness != null) {
    readinessEl.textContent = Math.round(state.summary.readiness * 100);
  }
  const deltaEl = document.getElementById("dash-yo-delta");
  if (deltaEl && state?.summary?.readinessDelta != null) {
    const d = state.summary.readinessDelta;
    deltaEl.textContent = (d > 0 ? `+${d}` : `${d}`);
    deltaEl.classList.toggle("rail-stat__delta--down", d < 0);
  }
```

(Adjust paths to actual data shape — read the existing `state` accessors near the streak update to find the shape.)

- [ ] **Step 2: Add urgent-state toggling for the rail countdown**

The existing dashboard code computes `daysUntilExam`. Find where `dash-countdown-value` gets its number written. After the write, toggle the urgent class:

```javascript
  const cd = document.getElementById("dash-exam-countdown");
  if (cd) cd.classList.toggle("is-urgent", daysUntilExam <= 30);
```

`is-urgent` is the class that swaps the number to `--error`.

- [ ] **Step 3: Add the sync-time footer wiring**

Near the bottom of the dashboard mount function, add:

```javascript
  const syncEl = document.getElementById("dash-rail-sync");
  if (syncEl) {
    const t = new Date();
    syncEl.textContent = t.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
  }
```

- [ ] **Step 4: `node --check`**

```bash
node --check js/screens/dashboard.js
```

- [ ] **Step 5: Verify at every breakpoint**

Hard-refresh. Test viewport sizes:

| Width | Expected layout |
|---|---|
| 1920 | sidebar 220 / main with content capped at 880 / rail 320 |
| 1440 | sidebar 220 / main fluid / rail 320 |
| 1280 | sidebar 220 / main fluid / rail 320 |
| 1180 | sidebar 220 / main fluid / rail 320 (still 3-col) |
| 1100 | sidebar 220 / main full width / rail as horizontal 4-strip below main |
| 900  | sidebar hidden, top-nav takes over / rail as 4-strip |
| 640  | rail as 2x2 grid |
| 390  | rail as 2x2, mobile bottom-nav |

At each breakpoint: confirm rail content is visible, no horizontal overflow, all numbers are populated.

- [ ] **Step 6: A11y check**

DevTools → Accessibility → ensure rail headings appear in the document outline as `<h2>`, the dashboard greeting as `<h1>`, and section openers as `<h3>`. Tab through all interactive elements; focus ring visible everywhere.

- [ ] **Step 7: Bump SW + commit**

`sw.js` → `puheo-v35`.

```bash
git add app.html js/screens/dashboard.js sw.js
git commit -m "$(cat <<'EOF'
feat(ux): dashboard right rail — stats, countdown, goal

Three rail groups (Tänään / YO-koe / Tämä viikko) plus a sync footer.
All wiring reuses existing IDs; new dash-yo-readiness wires to
state.summary.readiness. Urgent countdown toggles --error colour
under 30 days.

SW cache bumped to v35.
EOF
)"
```

---

## Task 11: Sidebar footer cleanup + small polish

The pro badge and logout that previously lived in `.dash-header` need to land somewhere. The sidebar already has `.sidebar-footer` with `.sidebar-user` and `.sidebar-item` slots. Move them there. Also: ensure the legacy `.app-countdown` top-bar (lines 58-63 of app.html) doesn't conflict with the new rail countdown — hide on dashboard since rail has it; keep on exercise screens.

**Files:**
- Modify: `app.html` (sidebar footer slot, dashboard pro/logout, app-countdown logic)
- Modify: `css/components/dashboard.css` (delete leftover `.dash-pro-area` rule)
- Modify: `js/screens/dashboard.js` (route pro badge + logout into sidebar footer)
- Modify: `sw.js` (bump)

- [ ] **Step 1: Inspect sidebar-footer markup**

Read `app.html:95-103`. Note the existing `<div class="sidebar-footer">` with `<div class="sidebar-user" id="sidebar-user"></div>` and `<button id="sidebar-logout">`.

- [ ] **Step 2: Add pro badge slot to sidebar-footer**

In `app.html` `.sidebar-footer`, after `<div class="sidebar-user" id="sidebar-user"></div>`, add:

```html
      <div class="sidebar-pro-slot" id="sidebar-pro-slot"></div>
```

- [ ] **Step 3: Update pro badge wiring in `js/screens/dashboard.js`**

Search for `dash-pro-badge`. The element is gone (removed in Task 7). Update its writes to target `sidebar-pro-slot` instead. The existing `id="sidebar-pro-badge"` exists in app.html but apparently unused — keep `sidebar-pro-slot` as the new container; render the same badge HTML inside it.

- [ ] **Step 4: Update logout wiring**

The dashboard had a `<button class="btn-logout" id="btn-logout">`. The sidebar already has `<button class="sidebar-item" id="sidebar-logout">Kirjaudu ulos</button>`. Confirm the existing app.js logout handler binds to `sidebar-logout`. If it bound only to `btn-logout`, update the binding.

```bash
grep -n "btn-logout\|sidebar-logout" app.js js/screens/*.js
```

If `btn-logout` was the only binding, change the listener to bind to `sidebar-logout` instead. Keep handler logic identical.

- [ ] **Step 5: Hide top-bar `.app-countdown` on dashboard**

The persistent top-bar countdown (`app.html:58-63`) is redundant with the rail countdown on the dashboard screen. In `js/screens/dashboard.js`, on dashboard show:

```javascript
  const topCountdown = document.getElementById("app-countdown");
  if (topCountdown) topCountdown.classList.add("hidden");
```

Other screens leave it as-is; their dashboard-leave handlers can `classList.remove("hidden")` if needed, but a fresh page load to a non-dashboard screen will render it normally.

- [ ] **Step 6: Delete leftover dead rules**

In `css/components/dashboard.css`, remove `.dash-pro-area`, `.btn-logout`, `.dash-greeting > div` and any other rules that referenced the removed dashboard header sub-elements.

- [ ] **Step 7: `node --check` + visual verify**

```bash
node --check js/screens/dashboard.js
```

Hard-refresh. Confirm:
- Sidebar footer shows user, pro badge, settings, logout
- Logout button works (same handler as before)
- Top-bar `.app-countdown` is hidden on dashboard (rail handles it)
- Top-bar `.app-countdown` still appears on vocab/grammar/etc.
- No empty space where pro badge / logout used to sit on dashboard

- [ ] **Step 8: Bump SW + commit**

`sw.js` → `puheo-v36`.

```bash
git add app.html css/components/dashboard.css js/screens/dashboard.js sw.js
git commit -m "$(cat <<'EOF'
refactor(ux): move pro badge + logout to sidebar footer

The dashboard header was deleted in Task 7; pro badge and logout now
live in the existing sidebar footer (sidebar-user + sidebar-pro-slot
+ sidebar-logout). Top-bar app-countdown hidden on dashboard since
the rail carries it.

SW cache bumped to v36.
EOF
)"
```

---

## Task 12: Document propagation rules + final QA

Capture the editorial system as a propagation reference in `design-system/DESIGN.md` so Spec 2 (exercise interiors) starts from the same primitives. Run a full visual + functional QA pass.

**Files:**
- Modify: `design-system/DESIGN.md` (append new section)
- Modify: `docs/superpowers/specs/` (mark spec implemented if a tracking convention exists; otherwise skip)

- [ ] **Step 1: Append new section to `design-system/DESIGN.md`**

Find the end of the file. Append:

```markdown
---

## N. Editorial system (Spec 1 primitives — applies to every screen)

The dashboard rebuild (2026-04-26) introduced a layout + type system every other screen will adopt in Spec 2. Rules below are non-negotiable for new screen designs.

### Shell

- Use `app-shell.css` grid: `sidebar | main | rail`. Never set `max-width` on a screen container.
- Content inside main is capped by `.app-main-inner { max-width: var(--app-main-max) }`.
- A screen with no rail toggles `data-rail="off"` on `.app-shell`; the grid collapses to two columns.
- Responsive collapse: rail folds below main at `--bp-rail` (1180 px); sidebar hides at 1024 px (top-nav takes over); rail folds to 2x2 below 768 px.

### Typography

- Open every screen with three elements in this order: `eyebrow → display H1 → motivational sub`.
- Use `.eyebrow` for the top-most metadata line (date, breadcrumb, count).
- Use `.display` only for the screen's primary heading. Once per screen.
- Use `<h2>` inside `.section-h` for section openers (with optional secondary link on the right).
- Use `<h3>` inside cards or list-row titles.
- Body copy at `var(--fs-body)` (15 px); secondary at `var(--fs-body-sm)` (13 px).

### Mono numerals

- DM Mono (`var(--font-mono)`) carries every quantity: score, count, percentage, time, countdown.
- Body text never carries numbers. Wrap inline numbers in `<span class="mono-num">N</span>`.
- Sizes: `.mono-num--lg` for rail / hero numerals, `.mono-num--md` for inline list rows, `.mono-num--sm` for tags + unit suffixes.
- Always enable tabular figures: `font-feature-settings: "tnum" 1`.

### Lists vs. cards

- Lists (`.dash-weak__row` style) when items are homogeneous (>3 of the same shape).
- Cards (with hairline top + bottom borders, no fill) when an item is the singular "main thing" on the screen.
- Grids of cards are forbidden in main; only the rail uses a grid (and only when collapsed).

### Colour

- One mint accent (`var(--accent)` / `var(--accent-hover)`) per screen — for the primary CTA, the focus outline, or the accent-as-text move (e.g. the period in `Hei, Mona<span class="accent">.</span>`).
- Body text uses `var(--ink)`; secondary `var(--ink-soft)`; tertiary `var(--ink-faint)`.
- Hairlines use `var(--border)` (default) or `var(--border-strong)` (hover).
- Feedback colours stay confined to their semantic role: `var(--success)` for correct, `var(--error)` for wrong / urgent, etc.

### Chrome budget

- No box-shadow at rest on cards, buttons, or rail blocks. Shadows only appear during interaction (`:active`, modals at rest).
- No surface gradients. The single allowed gradient is `--grad-hero`, masked into hero H1 text only.
- Border-bracketed pattern (top + bottom 1 px hairline, no fill) is the "this is the important thing" signal — replaces shadow.

### Rail content

- Rail is per-screen and optional. Declare it as a sibling `<aside class="app-rail">` or omit (set `data-rail="off"`).
- Three-tier rhythm: `eyebrow header → mono value + label rows → rail-footer`.
- Rail items are always read-only status, never primary actions.
```

(Renumber the section to fit the existing DESIGN.md numbering — the file has §1-§7+ already; pick the next number.)

- [ ] **Step 2: Run final manual QA across viewports**

For each: 390 / 768 / 1280 / 1440 / 1920 — load `app.html`, log in, dashboard. Confirm:

| Item | All widths |
|---|---|
| Greeting (eyebrow + H1 + sub) renders | ✓ |
| Hero grade card has hairline brackets, navy circle, scale chips | ✓ |
| Day's drill CTA renders correct copy for current state | ✓ |
| Weak topics list (numbered rows, mono numerals) | ✓ |
| Heatmap (single mint scale) | ✓ |
| Chart renders | ✓ |
| Forecast section renders | ✓ |
| Rail visible (1180+) or as strip below (< 1180) | ✓ |
| Rail stats populated: streak, readiness, sessions | ✓ |
| Rail countdown shows days until 28.9.2026 | ✓ |
| Rail goal bar reflects today's minutes | ✓ |
| Sidebar footer: user, pro badge, settings, logout | ✓ |
| No horizontal overflow at any width | ✓ |
| No console errors on load | ✓ |
| Tab order makes sense; every interactive has focus ring | ✓ |

- [ ] **Step 3: Functional regression**

```bash
npm test
node --check js/screens/dashboard.js
node --check js/screens/dash-cta.js
```

All pass. Open a vocab session, complete a few questions, return to dashboard — confirm streak increments, readiness updates, weak topics updates.

- [ ] **Step 4: Commit propagation rules**

```bash
git add design-system/DESIGN.md
git commit -m "$(cat <<'EOF'
docs(design): editorial system — propagation rules for Spec 2

Captures the layout + type primitives the dashboard rebuild introduced.
Future screen migrations (vocab, grammar, writing, exam, etc.) follow
these rules. Closes Spec 1 (foundation + dashboard).
EOF
)"
```

- [ ] **Step 5: Final spec close-out**

The dashboard editorial redesign (Spec 1) is now implemented. Push to `main` (or open a PR if your workflow requires) — the user will decide. Plan execution complete.

---

## Self-review notes

**Spec coverage check:**

| Spec section | Implemented in |
|---|---|
| §2.1 Layout tokens | Task 1 |
| §2.2 Type scale | Task 1 |
| §2.3 Token cleanup | Tasks 3, 4, 5 |
| §2.4 Visual restraint | Tasks 7, 9 |
| §3.1 Component file structure | Tasks 2, 6 |
| §3.2 Shell markup | Task 6 |
| §3.3 Slot map | Tasks 7, 8, 9, 10 |
| §3.4 Responsive | Task 2 (CSS), Task 10 (verify) |
| §3.5 Removed/merged elements | Tasks 7, 8, 9, 11 |
| §4 Propagation rules | Task 12 |
| §6 Testing | Task 8 unit tests, Tasks 7/9/10/12 visual |
| §7 SW cache bumps | Tasks 2, 6, 7, 8, 9, 10, 11 (each STATIC_ASSETS-touching commit bumps) |

All sections covered.

**Type/name consistency:**
- `selectDashboardCta({ profileComplete, srDueCount, weakestTopic })` — same signature used in test (Task 8 step 1) and impl (step 3).
- `renderDashboardCta(rootEl, state)` — same signature used in module (step 3) and dashboard.js wiring (step 7).
- Class names: `.dash-weak__row`, `.dash-weak__n`, `.dash-weak__name`, `.dash-weak__err`, `.dash-weak__pct` consistent across CSS (Task 9 step 3) and JS render (step 2).
- Rail classes: `.rail-stat`, `.rail-stat__v`, `.rail-stat__l`, `.rail-stat__delta`, `.rail-countdown`, `.rail-countdown__big`, `.rail-countdown__lbl`, `.rail-goal`, `.rail-goal__v`, `.rail-goal__bar`, `.rail-goal__l`, `.rail-footer` — defined in Task 2 step 3, used in Task 10 step 1.
- IDs preserved: `dash-streak`, `dash-total-sessions`, `dash-countdown-value`, `dash-today-minutes`, `dash-goal-minutes`, `dash-goal-bar-fill`, `dash-username`, `dash-motivation`, `dash-hero-grade`, `dash-hero-label`, `dash-hero-scale`, `dash-hero-caption`, `dash-heatmap`, `dash-chart`, `dash-forecast-chart`, `dash-weak-list`. Confirmed against grep of original `app.html`.
- New IDs introduced (Task 10): `dash-yo-readiness`, `dash-yo-delta`, `dash-rail-sync`, `dash-day-cta`, `dash-date`, `sidebar-pro-slot`. Each is referenced in exactly one task to avoid drift.

**Convention checks:**
- Every commit that touches `STATIC_ASSETS` files bumps `CACHE_VERSION` (per memory `feedback_sw_cache_bump`). v29 → v36 across 7 bumps.
- `node --check js/screens/dashboard.js` runs before any commit that edits it (per memory `feedback_node_check_before_commit`).
- All files preserved that the spec said are off-limits: `app.js`, `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js`.
