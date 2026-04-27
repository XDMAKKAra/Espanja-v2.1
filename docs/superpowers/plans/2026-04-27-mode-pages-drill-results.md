# Mode-Pages + Drill + Results — Implementation Plan (Spec 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-04-26-mode-pages-drill-results-design.md` (commit 60063f4)

**Goal:** Apply Spec 1's editorial system to all 5 mode-pages, the universal drill view (vocab / grammar / reading), and the universal results view, so every screen in the most-traversed flow reads as the same family.

**Architecture:** Three new component CSS files (`mode-page.css`, `exercise.css`, `results.css`) consume Spec 1 tokens; one new shared module (`js/screens/mode-page.js`) owns briefing-card data wiring + topic-row interaction; per-screen render JS (`vocab.js`, `grammar.js`, `reading.js`, `monivalinta.js` renderer) emits the new option-row markup. `app.html` markup is rewritten in-place, preserving every data ID that downstream JS reads.

**Tech Stack:** vanilla JS (ES modules), vanilla CSS, vitest, Express backend untouched.

---

## Reality reconciliation (deviations from spec)

The spec promised "`app.js`, `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js` are untouched." That promise breaks against reality:

1. **`app.js` IS touched.** Today's start-button handlers (lines 1073–1108) read `.topic-card.active`; the new markup uses `.mode-topic` rows with `aria-checked="true"`. Each mode's start handler needs its selector switched to `[data-topic][aria-checked="true"]` (or `[data-tense]`/`[data-type]`). The delegated `.topic-cards` click handler at line 1054 is dropped (replaced by `mode-page.js`). The `renderModePageStats` function at line 1040 is dropped (replaced by `loadBriefing`). Net change: ~30 lines edited, ~15 lines removed.
2. **`js/ui/nav.js` does NOT need changes.** Its current rule is "rail-off for everything except `screen-dashboard`." Mode-pages, drill, and results screens already get rail-off for free. Spec 1's §6 file-changes table was wrong about this — no edit required.
3. **API data shape doesn't match the briefing card 1:1.** `/api/dashboard` returns `modeStats[mode] = { sessions, bestGrade, avgPct }`, plus global `streak`, `weekSessions`, `modeDaysAgo`. There is no per-mode `accuracy7d` / `sessionsThisWeek` / `weakestTopic` field. Briefing-card data mapping (Task 6):
   - "Tarkkuus" ← `modeStats[mode].avgPct` (or `—`)
   - "Sessiota" (label changed from "viikossa" to "yhteensä") ← `modeStats[mode].sessions`
   - "Putki" ← global `streak` (the API doesn't provide per-mode streak — accept the global as a reasonable approximation)
   - "Viimeksi" eyebrow ← `modeDaysAgo[mode]` rendered as "VIIMEKSI · N pv sitten" (or "ENSIMMÄINEN KERTA" for null)
   - "Suosittelemme" line: skipped if no data (and entire card collapses to `.mode-briefing--empty` if `sessions === 0`)
4. **Adaptive (`js/screens/adaptive.js`) shares the `monivalinta.js` renderer with vocab/grammar.** When that renderer's option markup changes (Task 11), adaptive inherits the new look — visual consistency win, no separate work needed. Verified at implementation time.
5. **Verbsprint drill stays as-is** per spec §1 (out of scope). Only its mode-page is rewritten.

---

## File changes summary

| File | Status | Why |
|---|---|---|
| `css/components/mode-page.css` | **NEW** | Briefing card + topic rows + per-mode bespoke blocks |
| `css/components/exercise.css` | **NEW** | Drill eyebrow row + options + feedback + skeleton |
| `css/components/results.css` | **NEW** | Score display + breakdown list + actions |
| `css/components/button.css` | EDIT | Add `.btn--cta--mini` and `.btn--ghost` modifiers |
| `js/screens/mode-page.js` | **NEW** | `loadBriefing()`, topic-row click delegation, `generateCoachLine` |
| `js/renderers/monivalinta.js` | EDIT | Emit `.ex-option` markup with `__l`/`__t` spans |
| `js/screens/vocab.js` | EDIT | Switch `.option-btn` selectors → `.ex-option`; new feedback layout |
| `js/screens/grammar.js` | EDIT | Same — selectors + feedback layout |
| `js/screens/reading.js` | EDIT | Inline option creation → new markup |
| `js/screens/verbSprint.js` | EDIT | Topic-row markup change for mode-page only |
| `js/screens/writing.js` | EDIT | Topic-row markup change for mode-page only |
| `app.html` | EDIT | 5 mode-pages + 3 drill screens + 3 results screens markup |
| `app.js` | EDIT | Start-button selectors; drop legacy delegated handler + `renderModePageStats` |
| `sw.js` | EDIT | Bump cache to `puheo-v45`; add 3 CSS files + `mode-page.js` to `STATIC_ASSETS` |
| `tests/mode-page.test.js` | **NEW** | `loadBriefing` rendering + degradation + topic-picker toggling |
| `tests/results.test.js` | **NEW** | `generateCoachLine` band coverage |
| `design-system/DESIGN.md` | EDIT | Append §12 |

`routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js`, `js/ui/nav.js` truly untouched.

---

## Operating rules (from CLAUDE.md and project memory)

- **Stay on `main`.** Direct commits authorized for this redesign work (option C).
- **Bump `sw.js` `CACHE_VERSION`** in any commit that adds or modifies a `STATIC_ASSETS` file. Current value is `puheo-v44`; first cache bump in this plan goes to `puheo-v45` (Task 1). Subsequent commits that change STATIC_ASSETS files bump again (`v46`, `v47`, …) — each implementation task that touches a tracked CSS/JS file MUST bump the version in the same commit.
- **`node --check js/screens/<file>.js`** before every commit that edits a screen module. vitest does not import these and parse errors slip to prod.
- **Run `npm test`** at every checkpoint. Baseline 1044 passing. New tests in this plan add to that baseline; no existing tests should break.
- **Each task ends in a single commit** with a Conventional Commits message (e.g. `feat(mode-page): add briefing card to vocab mode`).

---

## Task 1: CSS scaffolding + button modifiers + SW cache bump

**Files:**
- Create: `css/components/mode-page.css`
- Create: `css/components/exercise.css`
- Create: `css/components/results.css`
- Modify: `css/components/button.css` (append `.btn--cta--mini` + `.btn--ghost`)
- Modify: `app.html` (add 3 `<link>` tags in `<head>`)
- Modify: `sw.js` (bump `CACHE_VERSION` to `puheo-v45`; add 3 CSS files to `STATIC_ASSETS`)

This task lays the foundation: empty CSS files exist and are loaded by `app.html`; the SW cache is bumped so users get them. No DOM consumers yet — visual unchanged.

- [ ] **Step 1: Create `css/components/mode-page.css` with header comment**

```css
/* Mode-page template — Spec 2 §3
   Briefing card, numbered topic rows, start CTA shared across all 5 mode-pages.
   Consumes Spec 1 tokens (--ink, --ink-soft, --ink-faint, --border, --accent,
   --font-display, --font-mono, --fs-h1/h3/body/body-sm/meta, --ls-eyebrow,
   --r-sm, --r-md, --ease-out). No new tokens introduced. */
```

- [ ] **Step 2: Create `css/components/exercise.css` with header comment**

```css
/* Drill view — Spec 2 §4
   Universal exercise screen styling for vocab, grammar, and reading drills.
   Eyebrow row + 1px progress bar + display prompt + lettered option rows
   + feedback + mini CTA. Skeleton matches actual content shape so loading
   state never reads as empty. No new tokens. */
```

- [ ] **Step 3: Create `css/components/results.css` with header comment**

```css
/* Results view — Spec 2 §5
   Universal results screen styling: eyebrow → big mono score → breakdown
   list → next-action CTAs. Replaces #screen-results, #screen-grammar-results,
   #screen-reading-results visual treatments. No new tokens. */
```

- [ ] **Step 4: Append `.btn--cta--mini` and `.btn--ghost` to `css/components/button.css`**

```css

/* Mini variant of the navy CTA — used inline (drill "Seuraava" button, etc.).
   Same look, compact padding and smaller title. */
.btn--cta--mini {
  padding: 12px 16px;
  margin-bottom: 0;
  width: auto;
  display: inline-flex;
  gap: 12px;
}
.btn--cta--mini .btn--cta__title { font-size: var(--fs-body); }
.btn--cta--mini .btn--cta__arrow { font-size: var(--fs-body); }

/* Ghost button — secondary action that lives next to .btn--cta.
   Border-only, transparent fill. No icon-coloured arrow. */
.btn--ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  font-family: var(--font-display);
  font-size: var(--fs-body);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 100ms var(--ease-out), background 100ms var(--ease-out);
}
.btn--ghost:hover { border-color: var(--border-strong); background: var(--surface-2); }
.btn--ghost:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 5: Wire the 3 new stylesheets into `app.html`**

Insert these three lines immediately after the existing `<link rel="stylesheet" href="css/components/dashboard.css" />` at line 29:

```html
  <link rel="stylesheet" href="css/components/mode-page.css" />
  <link rel="stylesheet" href="css/components/exercise.css" />
  <link rel="stylesheet" href="css/components/results.css" />
```

- [ ] **Step 6: Update `sw.js`**

Change line 1 from `const CACHE_VERSION = "puheo-v44";` to `const CACHE_VERSION = "puheo-v45";`.

In `STATIC_ASSETS` (currently lines 2–32), add three entries grouped with the existing component CSS lines (after `"/css/components/rail.css"`):

```js
  "/css/components/mode-page.css",
  "/css/components/exercise.css",
  "/css/components/results.css",
```

- [ ] **Step 7: Verify build is clean**

Run: `node --check sw.js`
Expected: no output (clean parse).

Run: `npm test`
Expected: 1044 passing (no test changes yet).

Open `app.html` in a browser, hard-refresh, confirm DevTools Network tab shows the 3 new CSS files loaded with HTTP 200 and no console errors.

- [ ] **Step 8: Commit**

```bash
git add css/components/mode-page.css css/components/exercise.css css/components/results.css css/components/button.css app.html sw.js
git commit -m "feat(spec2): scaffold mode-page/exercise/results CSS + button modifiers (puheo-v45)"
```

---

## Task 2: Briefing card CSS

**Files:**
- Modify: `css/components/mode-page.css`

Adds the styles for `.mode-briefing` and its empty-state modifier. Pure CSS — no markup yet, no DOM consumers, no SW bump (only the contents of an already-tracked file change; SW will pick it up on next user reload because the bytes differ). Visual unchanged at render time.

- [ ] **Step 1: Append briefing-card styles to `css/components/mode-page.css`**

```css

/* §3.3 Briefing card — eyebrow + 3 mono stats + suggest line.
   Border-bracketed, sits below the display H1. */
.mode-briefing {
  padding: 22px 0 24px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin: 0 0 32px;
}
.mode-briefing .eyebrow { margin: 0 0 14px; }
.mode-briefing__stats {
  display: flex;
  gap: 48px;
  margin: 0 0 18px;
  flex-wrap: wrap;
}
.mode-briefing__stat {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  flex-direction: column;
  align-items: flex-start;
}
.mode-briefing__stat small {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
  color: var(--ink-faint);
  margin-left: 2px;
}
.mode-briefing__stat-l {
  display: block;
  font-family: var(--font-display);
  font-size: var(--fs-meta);
  font-weight: 500;
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-top: 6px;
}
.mode-briefing__suggest {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin: 0;
}
.mode-briefing__suggest strong {
  font-weight: 600;
  color: var(--ink);
}
.mode-briefing__intro {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin: 0;
  max-width: 50ch;
}
.mode-briefing--empty .mode-briefing__stats,
.mode-briefing--empty .mode-briefing__suggest {
  display: none;
}
```

- [ ] **Step 2: Verify file parses**

Run a quick visual sanity check by opening any current mode-page in the browser; no `.mode-briefing` rules apply yet because no markup uses them.

Run: `npm test`
Expected: 1044 passing.

- [ ] **Step 3: Commit**

```bash
git add css/components/mode-page.css
git commit -m "feat(mode-page): briefing-card CSS (no consumers yet)"
```

---

## Task 3: Topic-row + start-CTA-meta + per-mode bespoke CSS

**Files:**
- Modify: `css/components/mode-page.css`

Adds `.mode-topics` / `.mode-topic` rules and the per-mode bespoke modifier blocks (`.mode-page--grammar`, `.mode-page--verbsprint`, etc.). No markup consumers yet.

- [ ] **Step 1: Append topic-row + per-mode CSS to `css/components/mode-page.css`**

```css

/* §3.4 Topic picker — numbered rows replacing .topic-cards grid.
   Active row has 3px mint left border + .is-current background. */
.mode-topics {
  margin: 0 0 32px;
  border-top: 1px solid var(--border);
}
.mode-topics .eyebrow {
  margin: 22px 0 6px;
}
.mode-topic {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-bottom: 1px solid var(--border);
  border-left: 3px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-display);
  transition: background 100ms var(--ease-out), border-left-color 100ms var(--ease-out);
}
.mode-topic:hover { background: var(--surface-2); }
.mode-topic.is-current {
  border-left-color: var(--accent);
  background: var(--surface);
}
.mode-topic:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
.mode-topic__n { flex: 0 0 36px; color: var(--ink); }
.mode-topic__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mode-topic__name {
  flex: 1;
  font-size: var(--fs-h3);
  font-weight: 500;
  color: var(--ink);
}
.mode-topic__desc {
  font-size: var(--fs-body-sm);
  color: var(--ink-faint);
}
.mode-topic__chev {
  font-size: var(--fs-h3);
  color: var(--ink-faint);
}
.mode-topic.is-current .mode-topic__chev { color: var(--accent); }

/* §3.5 Mode-page CTA wrapper — .btn--cta is full-width here, sometimes
   accompanied by a .btn--ghost (grammar quickreview). */
.mode-page__cta-row {
  display: flex;
  align-items: stretch;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}
.mode-page__cta-row .btn--cta { flex: 1 1 320px; margin-bottom: 0; }

/* §3.6 Bespoke per-mode pieces */
.mode-page--verbsprint .mode-page__duration {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 24px;
}
.mode-page--verbsprint .mode-page__duration-pill {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-md);
  font-weight: 500;
  padding: 8px 18px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--ink-soft);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: border-color 100ms var(--ease-out), color 100ms var(--ease-out);
}
.mode-page--verbsprint .mode-page__duration-pill.is-current {
  color: var(--ink);
  border-color: var(--ink);
}
.mode-page--verbsprint .mode-page__duration-hint {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  color: var(--ink-faint);
  margin: 0 0 0 4px;
}

.mode-page__pro-note {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  color: var(--ink-soft);
  margin: 0 0 16px;
  padding: 10px 14px;
  border: 1px dashed var(--border);
  border-radius: var(--r-sm);
}
.mode-page__pro-note.hidden { display: none; }

/* Display heading + sub paragraph live above the briefing card. */
.mode-page .display { margin: 0 0 8px; }
.mode-page__sub {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin: 0 0 32px;
  max-width: 50ch;
}

/* Outer mode-page wrapper consumes the existing .app-main-inner padding. */
.mode-page { padding: 0; }
```

- [ ] **Step 2: Run test suite**

Run: `npm test`
Expected: 1044 passing.

- [ ] **Step 3: Commit**

```bash
git add css/components/mode-page.css
git commit -m "feat(mode-page): topic-row + bespoke-block CSS"
```

---

## Task 4: Drill + results CSS

**Files:**
- Modify: `css/components/exercise.css`
- Modify: `css/components/results.css`

Populates the two empty exercise/results stylesheets with everything from spec §4.4 / §4.5 and §5.3. No markup consumers yet.

- [ ] **Step 1: Append all rules from spec §4.4 and §4.5 to `css/components/exercise.css`**

```css

/* §4 Drill view layout */
.exercise { padding: 0; }
.exercise__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.exercise__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.exercise__sep {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
}
.exercise__exit {
  background: transparent;
  border: 0;
  color: var(--ink-faint);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}
.exercise__exit:hover { color: var(--ink); }
.exercise__exit:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.exercise__progress {
  height: 1px;
  background: var(--border);
  margin-bottom: 32px;
  overflow: hidden;
}
.exercise__progress i {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 200ms var(--ease-out);
  width: 0;
}

.exercise .display { max-width: 32ch; margin: 0 0 12px; }
.exercise__context {
  font-family: var(--font-display);
  font-size: var(--fs-body-sm);
  font-style: italic;
  color: var(--ink-soft);
  margin: 0 0 28px;
  max-width: 50ch;
}
.exercise__context:empty,
.exercise__context.hidden { display: none; }

.exercise__options {
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid var(--border);
  margin-bottom: 24px;
}
.ex-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 16px;
  border: 0;
  border-bottom: 1px solid var(--border);
  border-left: 3px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-family: var(--font-display);
  transition: background 100ms var(--ease-out);
  width: 100%;
}
.ex-option:hover:not(.is-disabled) { background: var(--surface-2); }
.ex-option:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.ex-option__l {
  flex: 0 0 28px;
  font-family: var(--font-mono);
  font-size: var(--fs-mono-md);
  font-weight: 600;
  color: var(--ink);
  line-height: 1;
  padding-top: 2px;
}
.ex-option__t {
  flex: 1;
  font-size: var(--fs-h3);
  color: var(--ink);
  line-height: 1.4;
}
.ex-option.is-correct {
  border-left-color: var(--success);
  background: color-mix(in srgb, var(--success) 8%, transparent);
}
.ex-option.is-wrong {
  border-left-color: var(--error);
  background: color-mix(in srgb, var(--error) 8%, transparent);
}
.ex-option.is-disabled {
  cursor: default;
  opacity: 0.6;
}

.exercise__feedback {
  border-top: 1px solid var(--border);
  padding: 14px 0;
  margin-bottom: 14px;
}
.exercise__feedback.hidden { display: none; }
.exercise__feedback-status { color: var(--ink); }
.exercise__feedback-status.is-correct { color: var(--success); }
.exercise__feedback-status.is-wrong { color: var(--error); }
.exercise__feedback-correct {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin-top: 4px;
}

.exercise__next.btn--cta--mini { margin-top: 4px; }

/* §4.5 Skeleton state */
.skeleton-row {
  background: var(--surface-2);
  border-radius: var(--r-sm);
  height: 18px;
  margin-bottom: 8px;
}
.skeleton-row--display { width: 60%; height: 28px; margin: 8px 0 28px; }
.skeleton-row--option { width: 80%; height: 20px; margin-bottom: 14px; }
.skeleton-row--option:nth-child(odd) { width: 70%; }
.exercise__loading-caption {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
  color: var(--ink-faint);
  margin: 24px 0 0;
}
```

- [ ] **Step 2: Append all rules from spec §5.3 to `css/components/results.css`**

```css

/* §5 Results view */
.results { padding: 0; }
.results__score {
  margin: 12px 0 4px;
  font-family: var(--font-mono);
  font-weight: 600;
}
.results__sub {
  font-family: var(--font-display);
  margin: 0 0 18px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.results__sub small {
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
  color: var(--ink-faint);
}
.results__sub .exercise__sep {
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: var(--fs-mono-sm);
}
.results__coach {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  margin: 0 0 32px;
  max-width: 50ch;
}
.results__coach:empty { display: none; }

.results__breakdown { margin: 0 0 32px; }
.results__breakdown .eyebrow { margin: 0 0 8px; }
.results__list { border-top: 1px solid var(--border); }
.results__row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.results__row-n { flex: 0 0 36px; color: var(--ink); }
.results__row-q {
  flex: 1;
  font-size: var(--fs-h3);
  font-family: var(--font-display);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.results__row-correct {
  font-size: var(--fs-body-sm);
  color: var(--success);
  font-style: italic;
}
.results__row-mark {
  flex: 0 0 24px;
  text-align: right;
  font-family: var(--font-mono);
  font-weight: 600;
}
.results__row--correct .results__row-mark { color: var(--success); }
.results__row--wrong .results__row-mark { color: var(--error); }

.results__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
.results__back {
  font-family: var(--font-display);
  font-size: var(--fs-body);
  color: var(--ink-soft);
  text-decoration: underline;
  text-align: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 8px;
}
.results__back:hover { color: var(--ink); }
```

- [ ] **Step 3: Run test suite**

Run: `npm test`
Expected: 1044 passing.

- [ ] **Step 4: Commit**

```bash
git add css/components/exercise.css css/components/results.css
git commit -m "feat(spec2): drill + results CSS"
```

---

## Task 5: `js/screens/mode-page.js` — module skeleton + topic-row delegation

**Files:**
- Create: `js/screens/mode-page.js`
- Modify: `app.html` (add `<script type="module">` import or have `app.js` import it — see Step 4)
- Modify: `sw.js` (add to `STATIC_ASSETS`; bump to `puheo-v46`)

Creates the new module that owns mode-page interaction. This task ships the topic-row click delegation only; `loadBriefing` lands in Task 6 and `generateCoachLine` in Task 13.

- [ ] **Step 1: Create `js/screens/mode-page.js`**

```js
/**
 * Mode-page module — Spec 2 §3.
 *
 * Owns:
 *  - Briefing card population (loadBriefing).
 *  - Topic-row interaction (radio-group toggle on click + keyboard).
 *  - Start-CTA meta line live update on topic change.
 *  - generateCoachLine helper used by results.
 *
 * Why a separate module: keeps app.js from growing further; the briefing
 * card needs cached dashboard state and there's no good home for that
 * in vocab.js / grammar.js / reading.js individually.
 */

const TOPIC_LABELS = {
  // vocab
  "general vocabulary": "Yleinen sanasto",
  "society and politics": "Yhteiskunta",
  "environment and nature": "Ympäristö",
  "health and body": "Terveys",
  "travel and transport": "Matkailu",
  "culture and arts": "Kulttuuri",
  "work and economy": "Työ & talous",
  // grammar
  mixed: "Sekaisin",
  ser_estar: "Ser vs. Estar",
  hay_estar: "Hay vs. Estar",
  subjunctive: "Subjunktiivi",
  conditional: "Konditionaali",
  preterite_imperfect: "Pret. vs. Imperf.",
  pronouns: "Pronominit",
  // reading
  "animals and nature": "Eläimet & luonto",
  "travel and places": "Matkailu & paikat",
  "culture and history": "Kulttuuri & historia",
  "social media and technology": "Some & teknologia",
  "health and sports": "Terveys & urheilu",
  environment: "Ympäristö",
};

/**
 * Wire one topic-picker container.
 * Clicking a row reassigns .is-current + aria-checked,
 * and (if a CTA is provided) updates its meta line.
 *
 * @param {HTMLElement} container — `.mode-topics` element
 * @param {{ ctaEl?: HTMLElement, ctaMetaTemplate?: (topic: string) => string }} [opts]
 */
export function wireTopicPicker(container, { ctaEl, ctaMetaTemplate } = {}) {
  if (!container) return;
  container.addEventListener("click", (e) => {
    const row = e.target.closest(".mode-topic");
    if (!row || !container.contains(row)) return;
    setCurrentRow(container, row);
    if (ctaEl && ctaMetaTemplate) {
      updateCtaMeta(ctaEl, row, ctaMetaTemplate);
    }
  });
  // Keyboard: Space/Enter on a focused row toggles it (button default
  // behaviour fires click, so this is for completeness — radio semantics).
}

function setCurrentRow(container, row) {
  container.querySelectorAll(".mode-topic").forEach((r) => {
    r.classList.remove("is-current");
    r.setAttribute("aria-checked", "false");
  });
  row.classList.add("is-current");
  row.setAttribute("aria-checked", "true");
}

function updateCtaMeta(ctaEl, row, template) {
  const metaEl = ctaEl.querySelector(".btn--cta__meta");
  if (!metaEl) return;
  const topicId = row.dataset.topic || row.dataset.tense || row.dataset.type || "";
  metaEl.textContent = template(topicId);
}

/** Look up a Finnish display name for a topic ID. Falls back to the raw ID. */
export function topicLabel(topicId) {
  return TOPIC_LABELS[topicId] || topicId;
}
```

- [ ] **Step 2: Run `node --check js/screens/mode-page.js`**

Expected: clean (no output).

- [ ] **Step 3: Add `mode-page.js` to `sw.js` STATIC_ASSETS, bump cache**

In `sw.js`:
- Bump line 1: `const CACHE_VERSION = "puheo-v46";`
- Add `"/js/screens/mode-page.js",` to `STATIC_ASSETS` after `"/js/screens/dash-cta.js",` (group with other screen modules).

- [ ] **Step 4: Import the module from `app.js`**

The module's exports are consumed by mode-page rewrites (Tasks 7–9). For now, just add a single import line near the top of `app.js` to ensure the file is loaded and the SW caches it. Add after the existing imports block (find the run of `import { … }` statements at the top of `app.js`):

```js
import { wireTopicPicker, topicLabel } from "./js/screens/mode-page.js";
```

If `app.js` imports from `./js/...` already, follow that exact prefix; otherwise use `/js/screens/mode-page.js` form to match existing imports.

Verify the imports don't break anything else.

- [ ] **Step 5: Verify**

Run: `node --check app.js && node --check js/screens/mode-page.js && node --check sw.js`
Expected: clean for all three.

Run: `npm test`
Expected: 1044 passing.

- [ ] **Step 6: Commit**

```bash
git add js/screens/mode-page.js sw.js app.js
git commit -m "feat(mode-page): module + topic-picker wiring (puheo-v46)"
```

---

## Task 6: `loadBriefing` + first unit test

**Files:**
- Modify: `js/screens/mode-page.js`
- Create: `tests/mode-page.test.js`

Adds the briefing-card rendering helper. Pure DOM manipulation — no fetch, just consumes `window._dashModeStats` (already populated by `app.js renderModePageStats`-era logic) plus `window._dashStreak` / `window._dashModeDaysAgo` (we'll start populating these from `dashboard.js` in Task 7's app.js edit). Tests use jsdom defaults (vitest already configured).

- [ ] **Step 1: Append `loadBriefing` to `js/screens/mode-page.js`**

```js

/**
 * Populate the briefing-card slots for `modeId` from cached dashboard state.
 *
 * Reads from `window._dashModeStats[modeId]`, `window._dashStreak`,
 * `window._dashModeDaysAgo[modeId]`. If any field is missing, that row
 * shows "—". If `modeStats[modeId].sessions === 0` (or the entire entry
 * is missing), the briefing collapses to its empty-state variant.
 *
 * @param {string} modeId — "vocab" | "grammar" | "reading" | "writing" | "verbsprint"
 */
export function loadBriefing(modeId) {
  const briefing = document.getElementById(`${modeId}-briefing`);
  if (!briefing) return;

  const stats = (typeof window !== "undefined" && window._dashModeStats?.[modeId]) || null;
  const streak = (typeof window !== "undefined" && window._dashStreak) || 0;
  const daysAgo = (typeof window !== "undefined" && window._dashModeDaysAgo?.[modeId]);

  // Empty-state branch — first-time visitor or no data for this mode.
  if (!stats || !stats.sessions || stats.sessions === 0) {
    briefing.classList.add("mode-briefing--empty");
    const eyebrow = briefing.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = "ENSIMMÄINEN KERTA";
    let intro = briefing.querySelector(".mode-briefing__intro");
    if (!intro) {
      intro = document.createElement("p");
      intro.className = "mode-briefing__intro";
      intro.textContent = "Aloita Sekaisin-aiheella nähdäksesi, mihin aiheeseen sinun kannattaa keskittyä.";
      briefing.appendChild(intro);
    }
    return;
  }

  // Populated branch.
  briefing.classList.remove("mode-briefing--empty");

  const eyebrow = briefing.querySelector(".eyebrow");
  if (eyebrow) {
    eyebrow.textContent = formatLastEyebrow(daysAgo);
  }

  const accEl = briefing.querySelector(`#${modeId}-last-acc`);
  if (accEl) accEl.textContent = stats.avgPct == null ? "—" : String(stats.avgPct);

  const sessEl = briefing.querySelector(`#${modeId}-week-sessions`);
  if (sessEl) sessEl.textContent = stats.sessions == null ? "—" : String(stats.sessions);

  const streakEl = briefing.querySelector(`#${modeId}-streak`);
  if (streakEl) streakEl.textContent = streak == null ? "—" : String(streak);
}

function formatLastEyebrow(daysAgo) {
  if (daysAgo == null) return "VIIMEKSI · —";
  if (daysAgo === 0) return "VIIMEKSI · TÄNÄÄN";
  if (daysAgo === 1) return "VIIMEKSI · EILEN";
  return `VIIMEKSI · ${daysAgo} PV SITTEN`;
}
```

- [ ] **Step 2: Create `tests/mode-page.test.js`**

```js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadBriefing, topicLabel, wireTopicPicker } from "../js/screens/mode-page.js";

function buildBriefingDom(modeId) {
  document.body.innerHTML = `
    <div id="${modeId}-briefing" class="mode-briefing">
      <p class="eyebrow"></p>
      <div class="mode-briefing__stats">
        <div><span class="mono-num mono-num--lg" id="${modeId}-last-acc">—</span></div>
        <div><span class="mono-num mono-num--lg" id="${modeId}-week-sessions">—</span></div>
        <div><span class="mono-num mono-num--lg" id="${modeId}-streak">—</span></div>
      </div>
    </div>
  `;
}

describe("loadBriefing", () => {
  beforeEach(() => {
    window._dashModeStats = undefined;
    window._dashStreak = undefined;
    window._dashModeDaysAgo = undefined;
  });
  afterEach(() => { document.body.innerHTML = ""; });

  it("renders empty state when no stats are cached", () => {
    buildBriefingDom("vocab");
    loadBriefing("vocab");
    expect(document.getElementById("vocab-briefing").classList.contains("mode-briefing--empty")).toBe(true);
    expect(document.querySelector(".eyebrow").textContent).toBe("ENSIMMÄINEN KERTA");
  });

  it("renders empty state when sessions is zero", () => {
    buildBriefingDom("vocab");
    window._dashModeStats = { vocab: { sessions: 0, avgPct: null, bestGrade: null } };
    loadBriefing("vocab");
    expect(document.getElementById("vocab-briefing").classList.contains("mode-briefing--empty")).toBe(true);
  });

  it("populates the three stats when data is available", () => {
    buildBriefingDom("grammar");
    window._dashModeStats = { grammar: { sessions: 12, avgPct: 78, bestGrade: "M" } };
    window._dashStreak = 4;
    window._dashModeDaysAgo = { grammar: 2 };
    loadBriefing("grammar");
    expect(document.getElementById("grammar-last-acc").textContent).toBe("78");
    expect(document.getElementById("grammar-week-sessions").textContent).toBe("12");
    expect(document.getElementById("grammar-streak").textContent).toBe("4");
    expect(document.querySelector("#grammar-briefing .eyebrow").textContent).toBe("VIIMEKSI · 2 PV SITTEN");
  });

  it("formats today / yesterday / null distinctly in the eyebrow", () => {
    buildBriefingDom("vocab");
    window._dashModeStats = { vocab: { sessions: 1, avgPct: 50, bestGrade: null } };

    window._dashModeDaysAgo = { vocab: 0 };
    loadBriefing("vocab");
    expect(document.querySelector("#vocab-briefing .eyebrow").textContent).toBe("VIIMEKSI · TÄNÄÄN");

    window._dashModeDaysAgo = { vocab: 1 };
    loadBriefing("vocab");
    expect(document.querySelector("#vocab-briefing .eyebrow").textContent).toBe("VIIMEKSI · EILEN");

    window._dashModeDaysAgo = { vocab: null };
    loadBriefing("vocab");
    expect(document.querySelector("#vocab-briefing .eyebrow").textContent).toBe("VIIMEKSI · —");
  });

  it("writes — when individual fields are null", () => {
    buildBriefingDom("vocab");
    window._dashModeStats = { vocab: { sessions: 5, avgPct: null, bestGrade: null } };
    window._dashStreak = null;
    window._dashModeDaysAgo = { vocab: 3 };
    loadBriefing("vocab");
    expect(document.getElementById("vocab-last-acc").textContent).toBe("—");
    expect(document.getElementById("vocab-week-sessions").textContent).toBe("5");
    expect(document.getElementById("vocab-streak").textContent).toBe("—");
  });
});

describe("topicLabel", () => {
  it("returns the Finnish label for a known topic", () => {
    expect(topicLabel("subjunctive")).toBe("Subjunktiivi");
  });

  it("falls back to the raw id for unknown topics", () => {
    expect(topicLabel("xyz_unknown")).toBe("xyz_unknown");
  });
});

describe("wireTopicPicker", () => {
  it("toggles is-current + aria-checked on row click", () => {
    document.body.innerHTML = `
      <div class="mode-topics">
        <button class="mode-topic is-current" data-topic="a" aria-checked="true"></button>
        <button class="mode-topic" data-topic="b" aria-checked="false"></button>
      </div>
    `;
    const container = document.querySelector(".mode-topics");
    wireTopicPicker(container);

    const second = container.querySelectorAll(".mode-topic")[1];
    second.click();

    const all = container.querySelectorAll(".mode-topic");
    expect(all[0].classList.contains("is-current")).toBe(false);
    expect(all[0].getAttribute("aria-checked")).toBe("false");
    expect(all[1].classList.contains("is-current")).toBe(true);
    expect(all[1].getAttribute("aria-checked")).toBe("true");
  });

  it("updates a CTA meta line via template fn on row click", () => {
    document.body.innerHTML = `
      <div class="mode-topics">
        <button class="mode-topic is-current" data-topic="alpha" aria-checked="true"></button>
        <button class="mode-topic" data-topic="beta" aria-checked="false"></button>
      </div>
      <button class="btn--cta" id="cta">
        <span class="btn--cta__meta">OLD</span>
      </button>
    `;
    const container = document.querySelector(".mode-topics");
    const ctaEl = document.getElementById("cta");
    wireTopicPicker(container, {
      ctaEl,
      ctaMetaTemplate: (id) => `META · ${id.toUpperCase()}`,
    });

    container.querySelectorAll(".mode-topic")[1].click();
    expect(ctaEl.querySelector(".btn--cta__meta").textContent).toBe("META · BETA");
  });
});
```

- [ ] **Step 3: Run the new tests**

Run: `npm test -- mode-page`
Expected: PASS for all 8 tests.

Run: `npm test`
Expected: 1052 passing (1044 + 8 new).

- [ ] **Step 4: Commit**

```bash
git add js/screens/mode-page.js tests/mode-page.test.js
git commit -m "feat(mode-page): loadBriefing helper + tests"
```

---

## Task 7: Vocab mode-page rewrite + dashboard state cache + start-button selector

**Files:**
- Modify: `app.html` (rewrite `#screen-mode-vocab`, lines 583–619)
- Modify: `app.js` (drop `renderModePageStats`; replace `.topic-cards` delegated handler; switch vocab start-button selector; populate `window._dashStreak` / `window._dashModeDaysAgo`)
- Modify: `js/screens/dashboard.js` (cache `streak` and `modeDaysAgo` to window — see Step 4)

Single-mode vertical slice: vocab. By the end of this task, the vocab mode-page renders with the new template + briefing card + topic rows + correct start CTA. Other 4 mode-pages still use old markup; they'll be migrated in Tasks 8–11.

- [ ] **Step 1: Rewrite vocab mode-page markup in `app.html`**

Replace the entire block at lines 583–619 (`<div id="screen-mode-vocab" class="screen">…</div>`) with:

```html
  <div id="screen-mode-vocab" class="screen">
    <div class="mode-page mode-page--vocab">
      <p class="eyebrow">SANASTO · YO LYHYT</p>
      <h1 class="display">Sanasto</h1>
      <p class="mode-page__sub">Adaptiivinen sanastoharjoittelu yo-kokeeseen</p>

      <div class="mode-briefing" id="vocab-briefing">
        <p class="eyebrow">VIIMEKSI · —</p>
        <div class="mode-briefing__stats">
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="vocab-last-acc">—</span><small>%</small></span>
            <span class="mode-briefing__stat-l">Tarkkuus</span>
          </div>
          <div class="mode-briefing__stat">
            <span class="mono-num mono-num--lg" id="vocab-week-sessions">—</span>
            <span class="mode-briefing__stat-l">Sessiota</span>
          </div>
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="vocab-streak">—</span><small>pv</small></span>
            <span class="mode-briefing__stat-l">Putki</span>
          </div>
        </div>
      </div>

      <div class="mode-topics" role="radiogroup" aria-labelledby="vocab-topics-label">
        <p class="eyebrow" id="vocab-topics-label">Aihe</p>
        <button class="mode-topic is-current" data-topic="general vocabulary" role="radio" aria-checked="true">
          <span class="mode-topic__n mono-num mono-num--md">01</span>
          <span class="mode-topic__name">Yleinen sanasto</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="society and politics" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">02</span>
          <span class="mode-topic__name">Yhteiskunta</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="environment and nature" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">03</span>
          <span class="mode-topic__name">Ympäristö</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="health and body" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">04</span>
          <span class="mode-topic__name">Terveys</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="travel and transport" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">05</span>
          <span class="mode-topic__name">Matkailu</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="culture and arts" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">06</span>
          <span class="mode-topic__name">Kulttuuri</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="work and economy" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">07</span>
          <span class="mode-topic__name">Työ &amp; talous</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
      </div>

      <div class="mode-page__cta-row">
        <button class="btn--cta" id="btn-start-vocab" data-target="vocab">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Aloita sanastoharjoittelu</span>
            <span class="btn--cta__meta">~5 MIN · YLEINEN SANASTO</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </div>
```

Note: the old `data-topic` values are preserved verbatim. The old button IDs (`btn-start-vocab`) are preserved verbatim. The old `mode-page-stats` container is replaced by `mode-briefing`. The old level-display block (`vocab-page-level-display`) is dropped — Pass 0.6 already retired the manual taso-picker per the comment in the original markup, and the briefing card replaces the stats slot.

- [ ] **Step 2: Have `dashboard.js` cache `streak` + `modeDaysAgo` to `window`**

Open `js/screens/dashboard.js`. The destructured `renderDashboard({...})` already receives `streak` and `modeDaysAgo`. Find a stable insertion point near the top of the function (after the `name` line, around line 70). Insert:

```js
  // Spec 2 §3.3 — cache fields the briefing card needs across mode-pages.
  if (typeof window !== "undefined") {
    window._dashStreak = streak;
    window._dashModeDaysAgo = modeDaysAgo;
  }
```

`window._dashModeStats` is already populated by `app.js` (existing line in `app.js`'s response handler — verify with `grep -n '_dashModeStats' app.js`). If it's not, add a line in the same place that does `window._dashModeStats = modeStats;`.

- [ ] **Step 3: Drop `renderModePageStats` from `app.js`**

In `app.js`:
- Remove the entire function `renderModePageStats(mode) { … }` at lines 1040–1051.
- Remove the call `renderModePageStats(mode);` at line 1026 inside `showModePage`. Replace it with a `loadBriefing` call:

```js
  // Spec 2 §3.3 — populate the briefing card for this mode.
  loadBriefing(mode);
```

If `loadBriefing` isn't yet imported by `app.js`, add it to the existing import line from Task 5:

```js
import { wireTopicPicker, topicLabel, loadBriefing } from "./js/screens/mode-page.js";
```

- [ ] **Step 4: Drop the old `.topic-cards` delegated handler from `app.js`**

In `app.js`, remove the block at lines 1054–1061:

```js
document.querySelectorAll(".topic-cards").forEach((grid) => {
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".topic-card");
    if (!card) return;
    grid.querySelectorAll(".topic-card").forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
  });
});
```

Replace with mode-page wiring (delegated to `wireTopicPicker`). Insert near the same location:

```js
// Spec 2 §3.4 — wire the new .mode-topics radio-group rows.
document.querySelectorAll(".mode-topics").forEach((container) => {
  // Find the CTA in the same .mode-page wrapper (if any) and use its
  // data-cta-meta attribute (set per mode below) as the template.
  const modePage = container.closest(".mode-page");
  const ctaEl = modePage?.querySelector(".btn--cta");
  wireTopicPicker(container, {
    ctaEl,
    ctaMetaTemplate: (id) => {
      const label = topicLabel(id).toUpperCase();
      const tmpl = ctaEl?.dataset.ctaMeta || "{TOPIC}";
      return tmpl.replace("{TOPIC}", label);
    },
  });
});
```

- [ ] **Step 5: Switch the vocab start-button selector in `app.js`**

Find the block at lines 1073–1084 (`if ($("btn-start-vocab")) …`). Update the topic selector:

```js
if ($("btn-start-vocab")) $("btn-start-vocab").addEventListener("click", () => {
  state.mode = "vocab";
  state.level = "B";  // server-driven; see Pass 0.6 note in original markup
  state.topic = document.querySelector('#screen-mode-vocab .mode-topic[aria-checked="true"]')?.dataset.topic || "general vocabulary";
  state.startLevel = state.level;
  state.peakLevel = state.level;
  state.batchNumber = 0;
  state.totalCorrect = 0;
  state.totalAnswered = 0;
  state.sessionStartTime = Date.now();
  loadNextBatch();
});
```

(The `state.level` line previously read from a `#vocab-page-level-picker` selector that no longer exists in the new markup — Pass 0.6 retired the manual picker, so we hardcode the default `"B"`. The actual level still comes from `/api/user-level`; this assignment is a non-load-bearing default.)

- [ ] **Step 6: Add a CTA-meta template attribute to vocab CTA**

In `app.html`, locate the new `<button class="btn--cta" id="btn-start-vocab"…>` you wrote in Step 1. Add a `data-cta-meta` attribute:

```html
<button class="btn--cta" id="btn-start-vocab" data-target="vocab" data-cta-meta="~5 MIN · {TOPIC}">
```

This drives the live-update done by `wireTopicPicker`'s `ctaMetaTemplate` (Step 4).

- [ ] **Step 7: Verify**

Run: `node --check app.js && node --check js/screens/dashboard.js && node --check js/screens/mode-page.js`
Expected: clean.

Run: `npm test`
Expected: 1052 passing (no regression; new module tests still pass).

Open `app.html` in the browser, log in, click "Sanasto" from the dashboard. Expected:
- The vocab mode-page renders with the eyebrow, display H1, briefing card (real data if user has any, otherwise "ENSIMMÄINEN KERTA"), topic rows.
- Clicking a row sets the mint left border and updates the CTA meta to include the new topic name.
- Pressing the CTA starts the drill (existing flow — no change).
- Browser console: no errors.

- [ ] **Step 8: Commit**

```bash
git add app.html app.js js/screens/dashboard.js
git commit -m "feat(mode-page): vocab editorial rewrite — briefing + topic rows + live CTA meta"
```

---

## Task 8: Grammar mode-page rewrite (with quickreview ghost button)

**Files:**
- Modify: `app.html` (rewrite `#screen-mode-grammar`, lines 622–658)
- Modify: `app.js` (switch grammar start-button selector)

- [ ] **Step 1: Rewrite grammar mode-page markup in `app.html`**

Replace the entire block at lines 622–658 with:

```html
  <div id="screen-mode-grammar" class="screen">
    <div class="mode-page mode-page--grammar">
      <p class="eyebrow">PUHEOPPI · YO LYHYT</p>
      <h1 class="display">Puheoppi</h1>
      <p class="mode-page__sub">Kohdennetut harjoitukset YO-kokeen yleisimpiin virheisiin</p>

      <div class="mode-briefing" id="grammar-briefing">
        <p class="eyebrow">VIIMEKSI · —</p>
        <div class="mode-briefing__stats">
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="grammar-last-acc">—</span><small>%</small></span>
            <span class="mode-briefing__stat-l">Tarkkuus</span>
          </div>
          <div class="mode-briefing__stat">
            <span class="mono-num mono-num--lg" id="grammar-week-sessions">—</span>
            <span class="mode-briefing__stat-l">Sessiota</span>
          </div>
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="grammar-streak">—</span><small>pv</small></span>
            <span class="mode-briefing__stat-l">Putki</span>
          </div>
        </div>
      </div>

      <div class="mode-topics" role="radiogroup" aria-labelledby="grammar-topics-label">
        <p class="eyebrow" id="grammar-topics-label">Puheoppiaihe</p>
        <button class="mode-topic is-current" data-topic="mixed" role="radio" aria-checked="true">
          <span class="mode-topic__n mono-num mono-num--md">01</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Sekaisin</span>
            <span class="mode-topic__desc">Kaikki aiheet</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="ser_estar" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">02</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Ser vs. Estar</span>
            <span class="mode-topic__desc">Pysyvä vs. tilapäinen</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="hay_estar" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">03</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Hay vs. Estar</span>
            <span class="mode-topic__desc">Olemassaolo vs. sijainti</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="subjunctive" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">04</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Subjunktiivi</span>
            <span class="mode-topic__desc">Ojalá, para que…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="conditional" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">05</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Konditionaali</span>
            <span class="mode-topic__desc">Me gustaría…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="preterite_imperfect" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">06</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Pret. vs. Imperf.</span>
            <span class="mode-topic__desc">Yksittäinen vs. toistuva</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="pronouns" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">07</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Pronominit</span>
            <span class="mode-topic__desc">Que, quien, donde…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
      </div>

      <div class="mode-page__cta-row">
        <button class="btn--ghost" id="btn-show-quickreview" hidden>Näytä kertaus ensin</button>
        <button class="btn--cta" id="btn-start-grammar" data-target="grammar" data-cta-meta="~6 MIN · {TOPIC}">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Aloita kielioppiharjoittelu</span>
            <span class="btn--cta__meta">~6 MIN · SEKAISIN</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </div>
```

The `btn-show-quickreview` ID is preserved so existing show/hide logic from `app.js` keeps working.

- [ ] **Step 2: Switch grammar start-button selector in `app.js`**

Find the block at lines 1086–1092 (`if ($("btn-start-grammar")) …`) and update:

```js
if ($("btn-start-grammar")) $("btn-start-grammar").addEventListener("click", () => {
  state.mode = "grammar";
  state.grammarLevel = "C";  // server-driven default; matches old fallback
  state.grammarTopic = document.querySelector('#screen-mode-grammar .mode-topic[aria-checked="true"]')?.dataset.topic || "mixed";
  state.sessionStartTime = Date.now();
  loadGrammarDrill();
});
```

- [ ] **Step 3: Verify**

Run: `node --check app.js`
Expected: clean.

Run: `npm test`
Expected: 1052 passing.

Open the browser, navigate to the grammar mode-page. Expected:
- Grammar mode-page renders with eyebrow + display + briefing + 7 topic rows with Finnish disambiguation desc lines + ghost quickreview button (if shown by existing logic) + start CTA.
- Clicking a topic row updates the meta to include the topic name in caps (e.g. "~6 MIN · SUBJUNKTIIVI").
- Start CTA opens the grammar drill.

- [ ] **Step 4: Commit**

```bash
git add app.html app.js
git commit -m "feat(mode-page): grammar editorial rewrite — briefing + topic rows + ghost quickreview"
```

---

## Task 9: Verbsprint mode-page rewrite (with duration picker)

**Files:**
- Modify: `app.html` (rewrite `#screen-mode-verbsprint`, lines 661–694)
- Modify: `app.js` (verbsprint start-button selector + duration picker handler)

Verbsprint is a quirk: its drill is out of scope (stays as the existing `vs-*` markup at lines 696–742), but its **mode-page** gets the new template. So a user lands on a clean editorial mode-page, then clicks Aloita and is dropped into the unchanged sprint UI. That's an acknowledged visual mismatch (spec §7 risks table).

- [ ] **Step 1: Rewrite verbsprint mode-page markup in `app.html`**

Replace the entire block at lines 661–694 (the `<div id="screen-mode-verbsprint">…</div>`, NOT touching the `#screen-verbsprint` drill below it) with:

```html
  <div id="screen-mode-verbsprint" class="screen">
    <div class="mode-page mode-page--verbsprint">
      <p class="eyebrow">VERBISPRINTTI · YO LYHYT</p>
      <h1 class="display">Verbisprintti</h1>
      <p class="mode-page__sub">Nopea taivutusharjoitus — 40 yleisintä verbiä YO-tasolla</p>

      <div class="mode-briefing" id="verbsprint-briefing">
        <p class="eyebrow">VIIMEKSI · —</p>
        <div class="mode-briefing__stats">
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="verbsprint-last-acc">—</span><small>%</small></span>
            <span class="mode-briefing__stat-l">Tarkkuus</span>
          </div>
          <div class="mode-briefing__stat">
            <span class="mono-num mono-num--lg" id="verbsprint-week-sessions">—</span>
            <span class="mode-briefing__stat-l">Sprinttiä</span>
          </div>
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="verbsprint-streak">—</span><small>pv</small></span>
            <span class="mode-briefing__stat-l">Putki</span>
          </div>
        </div>
      </div>

      <div class="mode-topics" role="radiogroup" aria-labelledby="verbsprint-topics-label">
        <p class="eyebrow" id="verbsprint-topics-label">Aikamuoto</p>
        <button class="mode-topic is-current" data-tense="preterite" role="radio" aria-checked="true">
          <span class="mode-topic__n mono-num mono-num--md">01</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Preteriti</span>
            <span class="mode-topic__desc">Hablé, tuve, fui…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-tense="imperfect" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">02</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Imperfekti</span>
            <span class="mode-topic__desc">Hablaba, tenía…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-tense="subjunctive_present" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">03</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Subj. preesens</span>
            <span class="mode-topic__desc">Ojalá hable, tenga…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-tense="conditional" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">04</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Konditionaali</span>
            <span class="mode-topic__desc">Hablaría, tendría…</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-tense="imperative" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">05</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Imperatiivi</span>
            <span class="mode-topic__desc">¡Habla! ¡Ten!</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
      </div>

      <div class="mode-page__duration" role="radiogroup" aria-label="Sprintin kesto">
        <button class="mode-page__duration-pill is-current" data-duration="10" role="radio" aria-checked="true">10</button>
        <button class="mode-page__duration-pill" data-duration="20" role="radio" aria-checked="false">20</button>
        <span class="mode-page__duration-hint">taivutusta per sprintti</span>
      </div>

      <div class="mode-page__cta-row">
        <button class="btn--cta" id="btn-start-verbsprint" data-target="verbsprint" data-cta-meta="{TOPIC}">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Aloita sprintti</span>
            <span class="btn--cta__meta">PRETERITI · 10 TAIVUTUSTA</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Update verbsprint start-button selector + add duration-pill handler in `app.js`**

Find the verbsprint start handler in `app.js` (search for `btn-start-verbsprint` — there's an existing handler somewhere not in the lines I quoted). Update its tense selector to `[aria-checked="true"]`:

```js
state.verbsprintTense = document.querySelector('#screen-mode-verbsprint .mode-topic[aria-checked="true"]')?.dataset.tense || "preterite";
state.verbsprintDuration = Number(document.querySelector('#screen-mode-verbsprint .mode-page__duration-pill.is-current')?.dataset.duration || 10);
```

Add a duration-pill click handler just below:

```js
// Spec 2 §3.6 — verbsprint duration picker.
document.querySelectorAll('#screen-mode-verbsprint .mode-page__duration-pill').forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll('#screen-mode-verbsprint .mode-page__duration-pill').forEach((p) => {
      p.classList.remove("is-current");
      p.setAttribute("aria-checked", "false");
    });
    pill.classList.add("is-current");
    pill.setAttribute("aria-checked", "true");
  });
});
```

- [ ] **Step 3: Verify**

Run: `node --check app.js`
Expected: clean.

Run: `npm test`
Expected: 1052 passing.

Visual check in browser: verbsprint mode-page shows new template; duration pill toggles correctly; Aloita CTA still launches the (unchanged) sprint drill.

- [ ] **Step 4: Commit**

```bash
git add app.html app.js
git commit -m "feat(mode-page): verbsprint editorial rewrite — briefing + tense rows + duration pills"
```

---

## Task 10: Reading mode-page rewrite (with pro-note)

**Files:**
- Modify: `app.html` (rewrite `#screen-mode-reading`, lines 775–808)
- Modify: `app.js` (reading start-button selector)

- [ ] **Step 1: Rewrite reading mode-page markup**

Replace the block at lines 775–808 with:

```html
  <div id="screen-mode-reading" class="screen">
    <div class="mode-page mode-page--reading">
      <p class="eyebrow">LUETUN YMMÄRTÄMINEN · YO LYHYT</p>
      <h1 class="display">Luetun ymmärtäminen</h1>
      <p class="mode-page__sub">AI-luotu espanjankielinen teksti + kysymykset</p>

      <div class="mode-briefing" id="reading-briefing">
        <p class="eyebrow">VIIMEKSI · —</p>
        <div class="mode-briefing__stats">
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="reading-last-acc">—</span><small>%</small></span>
            <span class="mode-briefing__stat-l">Tarkkuus</span>
          </div>
          <div class="mode-briefing__stat">
            <span class="mono-num mono-num--lg" id="reading-week-sessions">—</span>
            <span class="mode-briefing__stat-l">Sessiota</span>
          </div>
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="reading-streak">—</span><small>pv</small></span>
            <span class="mode-briefing__stat-l">Putki</span>
          </div>
        </div>
      </div>

      <div class="mode-topics" role="radiogroup" aria-labelledby="reading-topics-label">
        <p class="eyebrow" id="reading-topics-label">Tekstin aihe</p>
        <button class="mode-topic is-current" data-topic="animals and nature" role="radio" aria-checked="true">
          <span class="mode-topic__n mono-num mono-num--md">01</span>
          <span class="mode-topic__name">Eläimet &amp; luonto</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="travel and places" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">02</span>
          <span class="mode-topic__name">Matkailu &amp; paikat</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="culture and history" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">03</span>
          <span class="mode-topic__name">Kulttuuri &amp; historia</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="social media and technology" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">04</span>
          <span class="mode-topic__name">Some &amp; teknologia</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="health and sports" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">05</span>
          <span class="mode-topic__name">Terveys &amp; urheilu</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="environment" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">06</span>
          <span class="mode-topic__name">Ympäristö</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
      </div>

      <p class="mode-page__pro-note hidden" id="reading-pro-note">
        🔒 Pro-ominaisuus —
        <button class="btn-link" style="display:inline;width:auto;padding:0" id="reading-upgrade-btn">Päivitä Pro</button>
      </p>

      <div class="mode-page__cta-row">
        <button class="btn--cta" id="btn-start-reading" data-target="reading" data-cta-meta="~10 MIN · {TOPIC}">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Aloita luetun ymmärtäminen</span>
            <span class="btn--cta__meta">~10 MIN · ELÄIMET &amp; LUONTO</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Switch reading start-button selector in `app.js`**

Find the block at lines 1094–1100 and update:

```js
if ($("btn-start-reading")) $("btn-start-reading").addEventListener("click", () => {
  state.mode = "reading";
  state.readingLevel = "C";  // server-driven default
  state.readingTopic = document.querySelector('#screen-mode-reading .mode-topic[aria-checked="true"]')?.dataset.topic || "animals and nature";
  state.sessionStartTime = Date.now();
  loadReadingTask();
});
```

- [ ] **Step 3: Verify**

Run: `node --check app.js`; `npm test`
Expected: clean / 1052 passing.

- [ ] **Step 4: Commit**

```bash
git add app.html app.js
git commit -m "feat(mode-page): reading editorial rewrite — briefing + topic rows + pro-note"
```

---

## Task 11: Writing mode-page rewrite (task-type rows + topic rows)

**Files:**
- Modify: `app.html` (rewrite `#screen-mode-writing`, lines 811–853)
- Modify: `app.js` (writing start-button selector)

Writing is unique: it has TWO topic-row groups — one for task-type (lyhyt 33p / laajempi 66p), one for topic. Both use the new `.mode-topic` row pattern.

- [ ] **Step 1: Rewrite writing mode-page markup**

Replace the block at lines 811–853 with:

```html
  <div id="screen-mode-writing" class="screen">
    <div class="mode-page mode-page--writing">
      <p class="eyebrow">KIRJOITTAMINEN · YO LYHYT</p>
      <h1 class="display">Kirjoittaminen</h1>
      <p class="mode-page__sub">Kirjoitustehtävä + YTL-kriteerien mukainen AI-arviointi</p>

      <div class="mode-briefing" id="writing-briefing">
        <p class="eyebrow">VIIMEKSI · —</p>
        <div class="mode-briefing__stats">
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="writing-last-acc">—</span><small>%</small></span>
            <span class="mode-briefing__stat-l">Tarkkuus</span>
          </div>
          <div class="mode-briefing__stat">
            <span class="mono-num mono-num--lg" id="writing-week-sessions">—</span>
            <span class="mode-briefing__stat-l">Tehtäviä</span>
          </div>
          <div class="mode-briefing__stat">
            <span><span class="mono-num mono-num--lg" id="writing-streak">—</span><small>pv</small></span>
            <span class="mode-briefing__stat-l">Putki</span>
          </div>
        </div>
      </div>

      <div class="mode-topics" role="radiogroup" aria-labelledby="writing-types-label" id="writing-type-cards">
        <p class="eyebrow" id="writing-types-label">Tehtävätyyppi</p>
        <button class="mode-topic is-current" data-type="short" role="radio" aria-checked="true">
          <span class="mode-topic__n mono-num mono-num--md">01</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Lyhyt tehtävä</span>
            <span class="mode-topic__desc">33 p · 160–240 merkkiä</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-type="long" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">02</span>
          <span class="mode-topic__body">
            <span class="mode-topic__name">Laajempi tehtävä</span>
            <span class="mode-topic__desc">66 p · 300–450 merkkiä</span>
          </span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
      </div>

      <div class="mode-topics" role="radiogroup" aria-labelledby="writing-topics-label" id="writing-topic-cards">
        <p class="eyebrow" id="writing-topics-label">Aihe</p>
        <button class="mode-topic is-current" data-topic="general" role="radio" aria-checked="true">
          <span class="mode-topic__n mono-num mono-num--md">01</span>
          <span class="mode-topic__name">Sekalaiset</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="environment and sustainability" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">02</span>
          <span class="mode-topic__name">Ympäristö</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="social life and relationships" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">03</span>
          <span class="mode-topic__name">Ihmissuhteet</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="travel and places" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">04</span>
          <span class="mode-topic__name">Matkailu</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="culture and identity" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">05</span>
          <span class="mode-topic__name">Kulttuuri</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
        <button class="mode-topic" data-topic="work and future" role="radio" aria-checked="false">
          <span class="mode-topic__n mono-num mono-num--md">06</span>
          <span class="mode-topic__name">Työ &amp; tulevaisuus</span>
          <span class="mode-topic__chev" aria-hidden="true">→</span>
        </button>
      </div>

      <p class="mode-page__pro-note hidden" id="writing-pro-note">
        🔒 Pro-ominaisuus —
        <button class="btn-link" style="display:inline;width:auto;padding:0" id="writing-upgrade-btn">Päivitä Pro</button>
      </p>

      <div class="mode-page__cta-row">
        <button class="btn--cta" id="btn-start-writing" data-target="writing" data-cta-meta="LYHYT · {TOPIC}">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Aloita kirjoittaminen</span>
            <span class="btn--cta__meta">LYHYT · SEKALAISET</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  </div>
```

Note both row groups have `.mode-topics` class — `wireTopicPicker` will be invoked twice (once per group) thanks to the existing `forEach` in `app.js` Step 4 of Task 7.

- [ ] **Step 2: Switch writing start-button selector in `app.js`**

Find the block at lines 1102–1108 and update:

```js
if ($("btn-start-writing")) $("btn-start-writing").addEventListener("click", () => {
  state.mode = "writing";
  state.writingTaskType = document.querySelector('#writing-type-cards .mode-topic[aria-checked="true"]')?.dataset.type || "short";
  state.writingTopic = document.querySelector('#writing-topic-cards .mode-topic[aria-checked="true"]')?.dataset.topic || "general";
  state.sessionStartTime = Date.now();
  loadWritingTask();
});
```

- [ ] **Step 3: Verify**

Run: `node --check app.js`; `npm test`
Expected: clean / 1052 passing.

Visual check: writing mode-page shows two `.mode-topics` groups, each independently togglable. Start CTA fires correctly.

- [ ] **Step 4: Commit**

```bash
git add app.html app.js
git commit -m "feat(mode-page): writing editorial rewrite — task-type + topic rows"
```

---

## Task 12: Drill view markup + monivalinta renderer migration

**Files:**
- Modify: `app.html` (rewrite `#screen-exercise` markup, lines 999–1100, AND `#screen-grammar`, lines 1259–1290)
- Modify: `js/renderers/monivalinta.js` (emit `.ex-option` markup with `__l`/`__t` spans)
- Modify: `js/screens/vocab.js` (selectors `.option-btn` → `.ex-option`; remove old kbd-hint reference)
- Modify: `js/screens/grammar.js` (selectors and class names)

This is the biggest single-task change. Vocab and grammar both consume `monivalinta.js`, so once it emits `.ex-option`, both screens see the new look. Reading is migrated separately in Task 13 because it has its own inline option creation.

- [ ] **Step 1: Update `js/renderers/monivalinta.js` to emit new markup**

Replace the function body (lines 29–57) with:

```js
export function renderMonivalinta(ex, container, { onAnswer } = {}) {
  if (ex?.type !== 'monivalinta') {
    throw new Error(`renderMonivalinta: expected type "monivalinta", got "${ex?.type}"`);
  }
  const mc = ex.payload?.monivalinta;
  if (!mc || !Array.isArray(mc.options)) {
    throw new Error('renderMonivalinta: missing payload.monivalinta.options');
  }

  container.replaceChildren();

  mc.options.forEach((text, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ex-option';
    btn.dataset.idx = String(idx);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');

    const letter = OPTION_LETTERS[idx] || String(idx + 1);
    const lSpan = document.createElement('span');
    lSpan.className = 'ex-option__l';
    lSpan.textContent = letter;
    const tSpan = document.createElement('span');
    tSpan.className = 'ex-option__t';
    tSpan.textContent = text;
    btn.append(lSpan, tSpan);

    btn.addEventListener('click', () => {
      onAnswer?.({
        chosenIndex: idx,
        correctIndex: mc.correctIndex,
        isCorrect: idx === mc.correctIndex,
        button: btn,
      });
    });
    container.appendChild(btn);
  });
}
```

The container must have `role="radiogroup"` for the buttons' radio role to be valid. App.html already gives it `role="group"` — Task 12 Step 4 below switches it to `radiogroup`.

- [ ] **Step 2: Update vocab.js selectors**

In `js/screens/vocab.js`, replace every occurrence of `.option-btn` with `.ex-option`. There are at least 11 references (lines 287, 294, 305, 312, 313, 406, 424, 493, 583, 683, 804, 812 per Task 0 grep). Use Edit's `replace_all: true` ONLY in this specific file:

```
Edit(file: js/screens/vocab.js, old: .option-btn, new: .ex-option, replace_all: true)
```

Also replace `.correct` and `.wrong` class assignments (which today live alongside `.option-btn`) with `.is-correct` and `.is-wrong` to match the new CSS. Search for `classList.add("correct")` / `classList.add("wrong")` in vocab.js — there are several. Update each to `classList.add("is-correct")` and `classList.add("is-wrong")`.

Likewise, search for `.classList.add("disabled")` / `b.disabled = true` patterns. Keep `b.disabled = true` (it disables the button), but also add `b.classList.add("is-disabled")` so the new CSS dim styling kicks in. (If the disabled state already gets visual treatment via the `:disabled` pseudo-class, we can rely on that — but our new CSS uses `.is-disabled` explicitly.)

In a single sweep:
- `.option-btn` → `.ex-option`
- `classList.add("correct")` → `classList.add("is-correct")`
- `classList.add("wrong")` → `classList.add("is-wrong")`
- After existing `b.disabled = true` lines, add `b.classList.add("is-disabled")` — but only at the point where we disable ALL buttons after a click. Search for the loop pattern `forEach((b) => (b.disabled = true))` and update it to:

```js
.forEach((b) => { b.disabled = true; b.classList.add("is-disabled"); });
```

- [ ] **Step 3: Update grammar.js selectors**

Same treatment for `js/screens/grammar.js`:
- `.option-btn` → `.ex-option` (multiple occurrences)
- `.correct` / `.wrong` class names on options → `.is-correct` / `.is-wrong`
- Disable loop gets `.is-disabled` added.

The grammar renderer also writes `b.textContent.trim()[0]` to derive a letter. With the new `.ex-option__l`/`.ex-option__t` split, that pattern needs adjusting. In `grammar.js` find the pattern around line 137:

```js
document.querySelectorAll("#gram-options-grid .option-btn").forEach((b) => {
  if (b.textContent.trim()[0] === ex.correct) b.classList.add("correct");
});
```

Replace with:

```js
document.querySelectorAll("#gram-options-grid .ex-option").forEach((b) => {
  const letter = b.querySelector(".ex-option__l")?.textContent;
  if (letter === ex.correct) b.classList.add("is-correct");
});
```

Same treatment for vocab.js if it uses a similar `textContent.trim()[0]` pattern (search for it; it appears around line 800 or so).

Also: `.gridTemplateColumns` styling at grammar.js:111 (`grid.style.gridTemplateColumns = "1fr"`) is no longer relevant — the new `.exercise__options` CSS uses flex-column. Remove those two lines (line 110–114 ≈), and also remove any other `style.gridTemplateColumns = "1fr 1fr"` assignment in vocab.js / grammar.js. The new layout is always one-column.

- [ ] **Step 4: Rewrite `#screen-exercise` markup in `app.html`**

Replace the block at lines 999–1100 with:

```html
  <div id="screen-exercise" class="screen">
    <div class="exercise" id="exercise-root">
      <header class="exercise__top">
        <div class="exercise__meta">
          <span class="mono-num mono-num--sm" id="ex-counter">1 / 12</span>
          <span class="exercise__sep">·</span>
          <span class="eyebrow" id="ex-topic">SANASTO</span>
          <span class="exercise__sep">·</span>
          <span class="ex-level-badge mono-num mono-num--sm" id="ex-level-badge">B</span>
        </div>
        <button class="exercise__exit" id="btn-exit-exercise" type="button" aria-label="Poistu harjoituksesta">×</button>
      </header>
      <div class="exercise__progress"><i id="progress-fill"></i></div>

      <div class="scaffold-indicator hidden" id="scaffold-indicator">
        <span class="scaffold-fire hidden" id="scaffold-fire">🔥</span>
        <span class="scaffold-text" id="scaffold-text"></span>
        <button class="scaffold-help-btn hidden" id="scaffold-help-btn">Pyydä vihjettä</button>
      </div>

      <div class="question-block" id="exercise-question-block">
        <div class="ex-type-badge hidden" id="ex-type-badge"></div>
        <p class="exercise__context hidden" id="ex-context-sentence"></p>
        <p class="question-label" id="question-label">¿Qué significa?</p>
        <h2 class="display" id="question-text">Loading…</h2>
      </div>

      <div class="exercise-skeleton-slot hidden" id="exercise-skeleton-slot" aria-live="polite"></div>

      <div class="exercise__options" id="options-grid" role="radiogroup" aria-label="Vastausvaihtoehdot"></div>

      <!-- Gap-fill: text input (existing) -->
      <div class="gap-fill-area hidden" id="gap-fill-area">
        <div class="gap-fill-sentence" id="gap-fill-sentence"></div>
        <div class="gap-fill-hint hidden" id="gap-fill-hint"></div>
        <button class="btn-hint hidden" id="gap-fill-hint-btn">Vihje</button>
        <div class="gap-fill-input-row">
          <input type="text" id="gap-fill-input" class="gap-fill-input" placeholder="Kirjoita puuttuva sana…" autocomplete="off" spellcheck="false" />
          <button class="btn-primary btn-sm" id="gap-fill-submit">Tarkista</button>
        </div>
        <div class="gap-fill-feedback hidden" id="gap-fill-feedback"></div>
      </div>

      <!-- Matching, reorder, translate-mini, etc. — UNCHANGED, kept as-is from original. -->
      <div class="matching-area hidden" id="matching-area">
        <div class="matching-cols">
          <div class="matching-col" id="matching-left"></div>
          <div class="matching-col" id="matching-right"></div>
        </div>
        <div class="matching-hint hidden" id="matching-hint"></div>
        <button class="btn-hint hidden" id="matching-hint-btn">Vihje</button>
        <div class="matching-status" id="matching-status"></div>
      </div>

      <div class="reorder-area hidden" id="reorder-area">
        <div class="reorder-hint" id="reorder-hint"></div>
        <div class="reorder-chips" id="reorder-chips"></div>
        <div class="reorder-target" id="reorder-target">
          <span class="reorder-placeholder">Klikkaa sanoja oikeaan järjestykseen</span>
        </div>
        <div class="reorder-actions">
          <button class="btn-secondary btn-sm" id="reorder-undo">Kumoa</button>
          <button class="btn-primary btn-sm" id="reorder-submit">Tarkista</button>
        </div>
        <div class="reorder-feedback hidden" id="reorder-feedback"></div>
      </div>

      <div class="translate-area hidden" id="translate-area">
        <div class="translate-source" id="translate-source"></div>
        <div class="translate-hint hidden" id="translate-hint"></div>
        <button class="btn-hint hidden" id="translate-hint-btn">Vihje</button>
        <textarea id="translate-input" class="translate-input" placeholder="Kirjoita käännös espanjaksi…" rows="2" spellcheck="false"></textarea>
        <button class="btn-primary" id="translate-submit">Lähetä arvioitavaksi →</button>
        <div class="translate-feedback hidden" id="translate-feedback"></div>
      </div>

      <div class="exercise__feedback explanation-block hidden" id="explanation-block">
        <div class="exercise__feedback-status mono-num mono-num--md hidden" id="ex-feedback-status"></div>
        <p class="exercise__feedback-correct" id="explanation-text"></p>
        <div class="sr-grade-row hidden" id="sr-grade-row">
          <span class="sr-grade-label">Kuinka hyvin muistit?</span>
          <div class="sr-grade-buttons">
            <button class="sr-grade-btn sr-again" data-grade="0">Uudelleen</button>
            <button class="sr-grade-btn sr-hard" data-grade="2">Vaikea</button>
            <button class="sr-grade-btn sr-good" data-grade="4">Hyvä</button>
            <button class="sr-grade-btn sr-easy" data-grade="5">Helppo</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn--cta btn--cta--mini" id="btn-next">
            <span class="btn--cta__title">Seuraava</span>
            <span class="btn--cta__arrow" aria-hidden="true">→</span>
          </button>
          <button class="btn-report hidden" id="btn-report-vocab" title="Raportoi virheellinen tehtävä">⚠ Virhe tehtävässä</button>
        </div>
      </div>

      <div class="kbd-hint" id="vocab-kbd-hint">
        <span class="kbd-key">1</span><span class="kbd-key">2</span><span class="kbd-key">3</span><span class="kbd-key">4</span>
        <span class="kbd-sep">tai</span>
        <span class="kbd-key">A</span><span class="kbd-key">B</span><span class="kbd-key">C</span><span class="kbd-key">D</span>
        <span class="kbd-sep">·</span>
        <span class="kbd-key">↵</span><span class="kbd-label">seuraava</span>
      </div>
    </div>
  </div>
```

The `#progress-fill` ID becomes the inner `<i>` of `.exercise__progress`. JS that does `progressEl.style.width = "50%"` keeps working because the bar fill IS the targeted `<i>`. The `#ex-counter`, `#ex-level-badge`, `#question-label`, `#question-text` IDs are preserved verbatim.

The `btn-exit-exercise` ID is new — wire its handler in Step 5.

- [ ] **Step 5: Add `btn-exit-exercise` click handler in `app.js`**

Find a sensible spot (near the other start-button handlers) and add:

```js
// Spec 2 §4.1 — drill exit returns to dashboard.
const btnExitExercise = $("btn-exit-exercise");
if (btnExitExercise) {
  btnExitExercise.addEventListener("click", () => {
    show("screen-dashboard");
  });
}
```

If `show` is not yet imported in app.js, find the existing import and add it. (Likely already imported.)

- [ ] **Step 6: Rewrite `#screen-grammar` markup in `app.html`**

Replace the block at lines 1259–1290 with:

```html
  <div id="screen-grammar" class="screen">
    <div class="exercise" id="grammar-exercise-root">
      <header class="exercise__top">
        <div class="exercise__meta">
          <span class="mono-num mono-num--sm" id="gram-counter">1 / 6</span>
          <span class="exercise__sep">·</span>
          <span class="eyebrow" id="gram-topic-badge">PUHEOPPI</span>
          <span class="exercise__sep">·</span>
          <span class="ex-level-badge mono-num mono-num--sm" id="gram-level-badge">C</span>
        </div>
        <button class="exercise__exit" id="btn-exit-gram" type="button" aria-label="Poistu harjoituksesta">×</button>
      </header>
      <div class="exercise__progress"><i id="gram-progress-fill"></i></div>

      <div class="question-block" id="gram-question-block">
        <p class="question-label" id="gram-instruction">Täydennä aukko.</p>
        <h2 class="display" id="gram-sentence">Loading…</h2>
      </div>

      <div class="exercise-skeleton-slot hidden" id="gram-skeleton-slot" aria-live="polite"></div>

      <div class="exercise__options" id="gram-options-grid" role="radiogroup" aria-label="Vastausvaihtoehdot"></div>

      <div class="exercise__feedback explanation-block hidden" id="gram-explanation-block">
        <div class="gram-rule-tag mono-num mono-num--sm" id="gram-rule-tag"></div>
        <p class="exercise__feedback-correct" id="gram-explanation-text"></p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <button class="btn--cta btn--cta--mini" id="gram-btn-next">
            <span class="btn--cta__title">Seuraava</span>
            <span class="btn--cta__arrow" aria-hidden="true">→</span>
          </button>
          <button class="btn-report hidden" id="btn-report-gram" title="Raportoi virheellinen tehtävä">⚠ Virhe tehtävässä</button>
        </div>
      </div>

      <div class="kbd-hint">
        <span class="kbd-key">A</span><span class="kbd-key">B</span><span class="kbd-key">C</span><span class="kbd-key">D</span>
        <span class="kbd-sep">·</span>
        <span class="kbd-key">↵</span><span class="kbd-label">seuraava</span>
      </div>
    </div>
  </div>
```

Add `btn-exit-gram` handler in `app.js` (near the vocab one):

```js
const btnExitGram = $("btn-exit-gram");
if (btnExitGram) btnExitGram.addEventListener("click", () => show("screen-dashboard"));
```

- [ ] **Step 7: Verify**

Run: `node --check js/renderers/monivalinta.js js/screens/vocab.js js/screens/grammar.js app.js`
Expected: clean.

Run: `npm test`
Expected: 1052 passing — including the existing `tests/renderer-dispatcher.test.js` and any monivalinta-specific tests. If any test asserts on `.option-btn` className, those tests need updating to `.ex-option`. Search before running:

```bash
grep -rn 'option-btn' tests/
```

If any matches: update each test to use `.ex-option`. Common spots: `tests/renderer-dispatcher.test.js`, `tests/scaffold-engine.test.js`. Bump them in this commit.

Open the browser, run a vocab drill end-to-end:
- Eyebrow row shows `1 / 12 · SANASTO · B` and the exit X button.
- 1px progress bar fills.
- Question and 4 options render with `A` / `B` / `C` / `D` letterforms in the left column.
- Click an option: correct option goes mint, wrong goes red, all others dim.
- Feedback area shows mono status + explanation + next CTA.
- Click Next: round advances.

Repeat for a grammar drill.

- [ ] **Step 8: Commit**

```bash
git add app.html app.js js/renderers/monivalinta.js js/screens/vocab.js js/screens/grammar.js tests/
git commit -m "feat(spec2): drill markup + monivalinta renderer — vocab + grammar editorial"
```

---

## Task 13: Reading drill rewrite

**Files:**
- Modify: `app.html` (rewrite the `#screen-reading` block at lines 1311–1371)
- Modify: `js/screens/reading.js` (inline option creation → new markup)

Reading has two sub-screens (`reading-sub-text` for the article, `reading-sub-questions` for questions). Spec 2's drill section primarily styles the `reading-sub-questions` sub-screen.

- [ ] **Step 1: Rewrite reading drill markup**

Replace lines 1311–1371 with:

```html
  <div id="screen-reading" class="screen">
    <div class="exercise reading-inner" id="reading-exercise-root">

      <div id="reading-sub-text">
        <header class="exercise__top">
          <div class="exercise__meta">
            <span class="eyebrow" id="reading-source-tag">TEXTO · LUETUN YMM.</span>
            <span class="exercise__sep">·</span>
            <span class="ex-level-badge mono-num mono-num--sm" id="reading-level-badge">C</span>
          </div>
          <button class="exercise__exit" id="btn-exit-reading-text" type="button" aria-label="Poistu">×</button>
        </header>
        <div class="exercise__progress"><i style="width:0%"></i></div>

        <h1 class="display reading-title" id="reading-title">Título</h1>
        <div class="reading-text-body" id="reading-text-body"></div>
        <button class="btn--cta btn--cta--mini" id="btn-start-questions">
          <span class="btn--cta__title">Aloita kysymykset</span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <div id="reading-sub-questions" class="hidden">
        <header class="exercise__top">
          <div class="exercise__meta">
            <span class="mono-num mono-num--sm" id="reading-q-counter">1 / 4</span>
            <span class="exercise__sep">·</span>
            <span class="eyebrow" id="reading-q-type">MONIVALINTA</span>
          </div>
          <button class="exercise__exit" id="btn-exit-reading" type="button" aria-label="Poistu">×</button>
        </header>
        <div class="exercise__progress"><i id="reading-progress-fill"></i></div>

        <details class="reading-text-ref">
          <summary>Näytä teksti ▾</summary>
          <div class="reading-text-ref-content" id="reading-text-ref-content"></div>
        </details>

        <div class="question-block">
          <h2 class="display" id="reading-question-text">Loading…</h2>
        </div>

        <div id="reading-options-container">
          <div class="exercise__options" id="reading-options-grid" role="radiogroup" aria-label="Vastausvaihtoehdot"></div>
        </div>
        <div id="reading-tf-container" class="hidden">
          <div class="tf-buttons">
            <button class="tf-btn" id="tf-true">✓ Oikein</button>
            <button class="tf-btn" id="tf-false">✗ Väärin</button>
          </div>
          <div class="kbd-hint" style="justify-content:center">
            <span class="kbd-key">T</span><span class="kbd-label">Oikein</span>
            <span class="kbd-sep">·</span>
            <span class="kbd-key">F</span><span class="kbd-label">Väärin</span>
          </div>
        </div>
        <div id="reading-short-container" class="hidden">
          <textarea id="reading-short-input" class="reading-short-textarea" placeholder="Kirjoita vastauksesi suomeksi…"></textarea>
          <button class="btn--cta btn--cta--mini" id="reading-short-submit">
            <span class="btn--cta__title">Tarkista</span>
            <span class="btn--cta__arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div class="exercise__feedback explanation-block hidden" id="reading-explanation-block">
          <p class="exercise__feedback-correct" id="reading-explanation-text"></p>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button class="btn--cta btn--cta--mini" id="reading-btn-next">
              <span class="btn--cta__title">Seuraava</span>
              <span class="btn--cta__arrow" aria-hidden="true">→</span>
            </button>
            <button class="btn-report hidden" id="btn-report-reading" title="Raportoi virheellinen tehtävä">⚠ Virhe tehtävässä</button>
          </div>
        </div>
      </div>

    </div>
  </div>
```

- [ ] **Step 2: Update `js/screens/reading.js` option rendering**

Replace `renderReadingOptions` (lines 101–126) with:

```js
function renderReadingOptions(q) {
  const grid = $("reading-options-grid");
  grid.innerHTML = "";
  q.options.forEach((opt) => {
    const letter = opt.trim()[0];
    const text = opt.replace(/^[A-D]\)\s*/, "").trim();
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ex-option";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");

    const lSpan = document.createElement("span");
    lSpan.className = "ex-option__l";
    lSpan.textContent = letter;
    const tSpan = document.createElement("span");
    tSpan.className = "ex-option__t";
    tSpan.textContent = text;
    btn.append(lSpan, tSpan);

    btn.addEventListener("click", () => {
      const isCorrect = letter === q.correct;
      if (isCorrect) {
        btn.classList.add("is-correct");
        state.readingScore++;
      } else {
        btn.classList.add("is-wrong");
        grid.querySelectorAll(".ex-option").forEach((b) => {
          const bLetter = b.querySelector(".ex-option__l")?.textContent;
          if (bLetter === q.correct) b.classList.add("is-correct");
        });
      }
      grid.querySelectorAll(".ex-option").forEach((b) => {
        b.disabled = true;
        b.classList.add("is-disabled");
      });
      $("reading-explanation-text").textContent = q.explanation;
      $("reading-explanation-block").classList.remove("hidden");
    });
    grid.appendChild(btn);
  });
}
```

Add exit handlers in `app.js`:

```js
const btnExitReading = $("btn-exit-reading");
if (btnExitReading) btnExitReading.addEventListener("click", () => show("screen-dashboard"));
const btnExitReadingText = $("btn-exit-reading-text");
if (btnExitReadingText) btnExitReadingText.addEventListener("click", () => show("screen-dashboard"));
```

- [ ] **Step 3: Verify**

Run: `node --check js/screens/reading.js app.js`
Expected: clean.

Run: `npm test`
Expected: 1052 passing.

Open the browser, log in, run a reading drill end-to-end:
- Reading article view shows eyebrow + display title + body + CTA-mini start.
- Clicking Aloita reveals questions sub-screen with eyebrow row + progress bar + question + 4 lettered options.
- Click an option → correct/wrong highlighting works as in vocab/grammar.

- [ ] **Step 4: Commit**

```bash
git add app.html app.js js/screens/reading.js
git commit -m "feat(spec2): reading drill — eyebrow row + lettered options"
```

---

## Task 14: `generateCoachLine` helper + tests + results-view CSS / markup

**Files:**
- Modify: `js/screens/mode-page.js` (add `generateCoachLine`)
- Create: `tests/results.test.js`
- Modify: `app.html` (rewrite `#screen-results`, `#screen-grammar-results`, `#screen-reading-results`)
- Modify: `app.js` / `js/screens/vocab.js` / `js/screens/grammar.js` / `js/screens/reading.js` — find every place that writes to results IDs and adapt to the new ID set

The biggest risk in this task is locating every JS code path that writes to results screens. There are at least three (vocab, grammar, reading), and possibly app.js for vocab. Plan: grep first, edit second.

- [ ] **Step 1: Add `generateCoachLine` to `js/screens/mode-page.js`**

```js

/**
 * Generate the short Finnish coaching line shown above the breakdown list.
 * Pure function — easy to unit test.
 *
 * @param {{ scorePct: number, sessionWeakestLabel?: string|null }} params
 * @returns {string}
 */
export function generateCoachLine({ scorePct, sessionWeakestLabel }) {
  if (scorePct >= 90) return "Loistavaa. Pidä vauhtia yllä.";
  if (scorePct >= 70) {
    return sessionWeakestLabel
      ? `Hyvä. Paranna ${sessionWeakestLabel}-aihetta.`
      : "Hyvä. Pidä taso yllä.";
  }
  if (scorePct >= 50) {
    return sessionWeakestLabel
      ? `Tasolla. ${sessionWeakestLabel} kaipaa toistoa.`
      : "Tasolla. Kertaa kaikki aiheet.";
  }
  return "Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa.";
}
```

- [ ] **Step 2: Create `tests/results.test.js`**

```js
import { describe, it, expect } from "vitest";
import { generateCoachLine } from "../js/screens/mode-page.js";

describe("generateCoachLine", () => {
  it("returns the >=90% line at 90 and above", () => {
    expect(generateCoachLine({ scorePct: 90 })).toBe("Loistavaa. Pidä vauhtia yllä.");
    expect(generateCoachLine({ scorePct: 100 })).toBe("Loistavaa. Pidä vauhtia yllä.");
  });

  it("returns the 70-89 with-weakest line", () => {
    expect(generateCoachLine({ scorePct: 75, sessionWeakestLabel: "subjunktiivi" }))
      .toBe("Hyvä. Paranna subjunktiivi-aihetta.");
  });

  it("returns the 70-89 no-weakest line", () => {
    expect(generateCoachLine({ scorePct: 80, sessionWeakestLabel: null }))
      .toBe("Hyvä. Pidä taso yllä.");
    expect(generateCoachLine({ scorePct: 80 })).toBe("Hyvä. Pidä taso yllä.");
  });

  it("returns the 50-69 lines", () => {
    expect(generateCoachLine({ scorePct: 60, sessionWeakestLabel: "preteriti" }))
      .toBe("Tasolla. preteriti kaipaa toistoa.");
    expect(generateCoachLine({ scorePct: 50 })).toBe("Tasolla. Kertaa kaikki aiheet.");
  });

  it("returns the <50% line regardless of weakest label", () => {
    expect(generateCoachLine({ scorePct: 49 }))
      .toBe("Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa.");
    expect(generateCoachLine({ scorePct: 0, sessionWeakestLabel: "x" }))
      .toBe("Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa.");
  });
});
```

- [ ] **Step 3: Run new tests, expect to pass**

Run: `npm test -- results`
Expected: PASS (5 tests).

Run: `npm test`
Expected: 1057 passing (1052 + 5).

- [ ] **Step 4: Locate all results-rendering call sites**

Run:
```bash
grep -rn 'results-score\|results-actions\|results-eyebrow\|grade-display\|score-row\|gram-score\|reading-score\|gram-error-summary\|reading-overall' app.js js/screens/
```

You should find writes in `app.js` (vocab results), `js/screens/grammar.js` (grammar results render), `js/screens/reading.js` (reading results render). Capture the exact functions and their write patterns. They become the migration targets in Step 5.

- [ ] **Step 5: Rewrite `#screen-results`, `#screen-grammar-results`, `#screen-reading-results` markup in `app.html`**

Replace `#screen-results` (lines 1115–1136):

```html
  <div id="screen-results" class="screen">
    <div class="results">
      <p class="eyebrow"><span id="res-mode-label">VALMIS · SANASTO</span> · <span class="mono-num mono-num--sm" id="res-time">—</span></p>
      <h1 class="display results__score">
        <span class="mono-num" id="res-score-num">0</span> / <span class="mono-num" id="res-score-tot">0</span>
      </h1>
      <p class="results__sub">
        <span class="mono-num mono-num--md" id="res-pct">0</span><small>%</small>
        <span class="exercise__sep">·</span>
        <span class="eyebrow" id="res-topic-label">—</span>
      </p>
      <p class="results__coach" id="res-coach"></p>

      <div class="results__breakdown">
        <p class="eyebrow">Yhteenveto</p>
        <div class="results__list" id="res-list"></div>
      </div>

      <div class="results__actions">
        <button class="btn--cta" id="btn-restart" data-cta-meta="SAMALLA AIHEELLA">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Uusi sarja</span>
            <span class="btn--cta__meta" id="res-again-meta">SAMALLA AIHEELLA</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
        <button class="results__back" id="btn-back-home" type="button">Takaisin valintaan</button>
        <button class="btn-share" id="btn-share-vocab" hidden>📤 Jaa tulos</button>
      </div>

      <!-- Hidden compatibility shims for any legacy code that still queries the old IDs.
           Renders nothing visually; safe to remove once all consumers are migrated. -->
      <span id="results-score" hidden></span>
      <span id="results-timer" hidden></span>
      <span id="results-learning" hidden></span>
      <span id="results-learning-body" hidden></span>
    </div>
  </div>
```

The compatibility shims preserve any existing `getElementById("results-score")` writes from crashing. Once all consumers are migrated (verified in Step 6), the shims can be removed in a follow-up cleanup commit.

Replace `#screen-grammar-results` (lines 1293–1308):

```html
  <div id="screen-grammar-results" class="screen">
    <div class="results">
      <p class="eyebrow">VALMIS · PUHEOPPI · <span class="mono-num mono-num--sm" id="gram-res-time">—</span></p>
      <h1 class="display results__score">
        <span class="mono-num" id="gram-res-num">0</span> / <span class="mono-num" id="gram-res-tot">0</span>
      </h1>
      <p class="results__sub">
        <span class="mono-num mono-num--md" id="gram-res-pct">0</span><small>%</small>
        <span class="exercise__sep">·</span>
        <span class="eyebrow" id="gram-res-topic">—</span>
      </p>
      <p class="results__coach" id="gram-res-coach"></p>

      <div class="results__breakdown">
        <p class="eyebrow">Yhteenveto</p>
        <div class="results__list" id="gram-res-list"></div>
      </div>

      <a class="blog-cta-banner hidden" id="gram-blog-cta" href="#" target="_blank" rel="noopener">
        <span class="blog-cta-icon" aria-hidden="true">📖</span>
        <span class="blog-cta-text">
          <span class="blog-cta-kicker" id="gram-blog-cta-kicker">Haluatko syventyä?</span>
          <span class="blog-cta-title" id="gram-blog-cta-title">Lue artikkeli →</span>
        </span>
      </a>

      <div class="results__actions">
        <button class="btn--cta" id="gram-btn-restart">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Uusi harjoitus</span>
            <span class="btn--cta__meta">SAMALLA AIHEELLA</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <!-- Compat shim for legacy IDs -->
      <span id="gram-score-display" hidden></span>
      <span id="gram-score-text" hidden></span>
      <span id="gram-error-summary" hidden></span>
    </div>
  </div>
```

Replace `#screen-reading-results` (lines 1374–1385):

```html
  <div id="screen-reading-results" class="screen">
    <div class="results">
      <p class="eyebrow">VALMIS · LUETUN YMM. · <span class="mono-num mono-num--sm" id="reading-res-time">—</span></p>
      <h1 class="display results__score">
        <span class="mono-num" id="reading-res-num">0</span> / <span class="mono-num" id="reading-res-tot">0</span>
      </h1>
      <p class="results__sub">
        <span class="mono-num mono-num--md" id="reading-res-pct">0</span><small>%</small>
      </p>
      <p class="results__coach" id="reading-res-coach"></p>

      <div class="results__breakdown">
        <p class="eyebrow">Yhteenveto</p>
        <div class="results__list" id="reading-res-list"></div>
      </div>

      <div class="results__actions">
        <button class="btn--cta" id="reading-btn-home">
          <span class="btn--cta__l">
            <span class="btn--cta__title">Etusivulle</span>
            <span class="btn--cta__meta">DASHBOARD</span>
          </span>
          <span class="btn--cta__arrow" aria-hidden="true">→</span>
        </button>
        <button class="results__back" id="reading-btn-new" type="button">Uusi teksti</button>
      </div>

      <!-- Compat shim -->
      <span id="reading-score-display" hidden></span>
      <span id="reading-score-text" hidden></span>
      <span id="reading-overall-feedback" hidden></span>
    </div>
  </div>
```

- [ ] **Step 6: Update results-rendering JS in `app.js` / `vocab.js` / `grammar.js` / `reading.js`**

For each results-render call site you found in Step 4:

1. Capture: total correct, total questions, topic label (in caps), session-weakest topic if computable, and the per-question outcome list (each entry: question text, correct flag, the correct answer text shown when wrong).
2. Compute `pct = Math.round(correct / total * 100)`.
3. Write to the new IDs:
   - `res-score-num` ← correct
   - `res-score-tot` ← total
   - `res-pct` ← pct
   - `res-topic-label` ← topic.toUpperCase() (use `topicLabel` from mode-page.js for the display name)
   - `res-mode-label` ← e.g. `"VALMIS · SANASTO"` for vocab
   - `res-time` ← current `HH:MM`
   - `res-coach` ← `generateCoachLine({ scorePct: pct, sessionWeakestLabel })` (import from mode-page.js)
   - `res-list` ← innerHTML of `<div class="results__row results__row--correct|--wrong">` per question
4. Replace the same logic for grammar (`gram-res-*` IDs) and reading (`reading-res-*` IDs).

For the example vocab path, the renderer that previously did:

```js
$("results-score").textContent = `${state.totalCorrect} / ${state.totalAnswered} oikein`;
```

becomes:

```js
import { generateCoachLine, topicLabel } from "./js/screens/mode-page.js";

const correct = state.totalCorrect;
const total = state.totalAnswered;
const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
$("res-score-num").textContent = String(correct);
$("res-score-tot").textContent = String(total);
$("res-pct").textContent = String(pct);
$("res-topic-label").textContent = topicLabel(state.topic).toUpperCase();
$("res-mode-label").textContent = "VALMIS · SANASTO";
$("res-time").textContent = new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" });
$("res-coach").textContent = generateCoachLine({ scorePct: pct, sessionWeakestLabel: null });
const list = $("res-list");
list.innerHTML = "";
state.sessionAnswers?.forEach((a, idx) => {
  const row = document.createElement("div");
  row.className = `results__row results__row--${a.isCorrect ? "correct" : "wrong"}`;
  const n = String(idx + 1).padStart(2, "0");
  row.innerHTML = `
    <span class="mono-num mono-num--md results__row-n">${n}</span>
    <span class="results__row-q">
      <span>${escapeHtml(a.question)}</span>
      ${a.isCorrect ? "" : `<span class="results__row-correct">${escapeHtml(a.correctAnswer)}</span>`}
    </span>
    <span class="results__row-mark" aria-label="${a.isCorrect ? "Oikein" : "Väärin"}">${a.isCorrect ? "✓" : "✗"}</span>
  `;
  list.appendChild(row);
});
```

Reuse the existing `escapeHtml` helper from `app.js` if available (search for it first). If `state.sessionAnswers` doesn't exist as a list of per-question outcomes, capture it: at the moment a question is graded inside vocab.js / grammar.js / reading.js, append `{ question, correctAnswer, isCorrect }` to `state.sessionAnswers` (initialize it in the start-handler). This is a small addition to the answer-handler in each module, scoped to a few lines.

If capturing per-question answers proves brittle for one of the three modules in the time-budget for this task, ship without the breakdown list for that mode — leave the `#res-list`-equivalent empty — and call out the gap in the commit message. The score / coach line / actions render fine without it; the breakdown is the value-add that completes the spec but isn't load-bearing.

- [ ] **Step 7: Verify**

Run: `node --check app.js js/screens/vocab.js js/screens/grammar.js js/screens/reading.js js/screens/mode-page.js`
Expected: clean.

Run: `npm test`
Expected: 1057 passing.

Open the browser. Run a vocab session to completion → results screen shows: VALMIS · SANASTO · HH:MM eyebrow; big mono `8 / 10`; `80% · YLEINEN SANASTO` sub; coach line; numbered breakdown rows with ✓/✗; CTA + back link.

Repeat for grammar and reading.

- [ ] **Step 8: Commit**

```bash
git add app.html app.js js/screens/mode-page.js js/screens/vocab.js js/screens/grammar.js js/screens/reading.js tests/results.test.js
git commit -m "feat(spec2): results editorial — score, coach, breakdown across vocab/grammar/reading"
```

---

## Task 15: Documentation + final QA

**Files:**
- Modify: `design-system/DESIGN.md` (append §12)
- Modify: `sw.js` (final cache bump if any STATIC_ASSETS file was added; otherwise verify version is current)

- [ ] **Step 1: Verify `sw.js` cache + STATIC_ASSETS reflect every file added in Tasks 1–14**

Open `sw.js`. Confirm:
- `CACHE_VERSION` is at least `puheo-v46` (incremented in Task 5).
- `STATIC_ASSETS` includes `mode-page.css`, `exercise.css`, `results.css`, `js/screens/mode-page.js`.

If any of those is missing, add it now and bump cache to `puheo-v47`.

- [ ] **Step 2: Append §12 to `design-system/DESIGN.md`**

Read the existing DESIGN.md first (`Read design-system/DESIGN.md` to see the §11 ending). Append at the end:

```markdown

## §12 — Mode-pages, drill, and results (Spec 2)

These three screen families share one editorial template and consume the same Spec 1 primitives. Reading order top-to-bottom:

### Mode-pages

`eyebrow → display H1 → motivational sub → briefing card → topic rows → optional config → start CTA`

- **Briefing card** (`.mode-briefing`): 3 mono stats + Finnish suggest line (or "ENSIMMÄINEN KERTA" when no data). Border-bracketed, lives between sub paragraph and topic picker. Populated by `loadBriefing(modeId)` from cached dashboard state.
- **Topic rows** (`.mode-topic`): vertical list, mono numerals (`01`, `02`, …), name + optional disambiguation desc + chevron. Active row gets a 3 px mint left border. Same pattern as the dashboard weak-topic list.
- **Start CTA** (`.btn--cta`): navy block with mint arrow, mono meta line that updates live when topic changes (`data-cta-meta="… · {TOPIC}"` template). Mini variant `.btn--cta--mini` exists for inline use (drill "Seuraava", reading "Aloita kysymykset").
- **Bespoke per-mode pieces** (kept small, modifier-scoped): grammar gets a `.btn--ghost` quickreview button beside the CTA; verbsprint gets a duration-pill picker; reading and writing get an inline pro-note paragraph; writing gets two `.mode-topics` groups (task-type + topic).

### Drill view

`eyebrow row + counter/topic/level + exit X → 1 px mint progress bar → display prompt → optional context italic → lettered option rows → feedback band → mini CTA`

- **Eyebrow row** is always populated, including during loading. The skeleton (4 grey rows + caption "Ladataan tehtävää…") matches the actual content shape so the surface never reads as empty.
- **Lettered options** (`.ex-option` with `.ex-option__l` letter + `.ex-option__t` text). Letterforms `A B C D` (not mono numerals — letters mean "answer key", numerals mean "ranking").
- **Feedback band**: hairline above, mono status line (`OIKEIN ✓` / `VÄÄRIN`) + correct answer when wrong.

### Results view

`eyebrow → big mono N/M score → "P% · TOPIC" sub → coach line → breakdown list → primary CTA + secondary back link`

- **Coaching line** is generated by `generateCoachLine({ scorePct, sessionWeakestLabel })` — pure function, four bands (≥90, 70–89, 50–69, <50). Topic name kept lowercase in the coaching line on purpose (reads as natural Finnish).
- **Breakdown list** (`.results__list`): numbered row per question, `✓`/`✗` mark on the right; wrong rows show the correct answer in italic mint underneath.
- **Two-action footer**: primary navy CTA (re-run same topic) + secondary text-link back to mode-page.

### Propagation rules carried from Spec 1

- All three families inherit Spec 1's tokens, font stack, and `app-shell.css` chrome. No new tokens introduced.
- Rail is hidden on every mode-page, drill, and results screen (data-rail=off automatic).
- `prefers-reduced-motion` respected — skeleton has no shimmer in default ship; gated under `prefers-reduced-motion: no-preference` if added later.
```

- [ ] **Step 3: Run full test suite + node --check across modified screen files**

```bash
node --check js/screens/mode-page.js
node --check js/screens/dashboard.js
node --check js/screens/vocab.js
node --check js/screens/grammar.js
node --check js/screens/reading.js
node --check js/renderers/monivalinta.js
node --check app.js
node --check sw.js
npm test
```

Expected: clean across all parses; 1057 passing.

- [ ] **Step 4: Manual QA pass per spec §8 list**

Walk through each item:
- [ ] All 5 mode-pages render with briefing card filled (or empty-state for first-time mode).
- [ ] Topic-picker active row shows the mint left border; clicking another row reassigns it.
- [ ] Start CTA's mono meta updates when topic changes.
- [ ] Drill view shows skeleton with eyebrow already populated during loading. (If skeleton path isn't visibly exercised because loading is fast, manually throttle the network in DevTools to confirm.)
- [ ] Drill view options highlight correct/wrong with mint/red left border + tinted background.
- [ ] Results screen shows score, breakdown, and the two CTAs.
- [ ] All five mode pages route to the right drill (no broken handlers).
- [ ] "Uusi sarja samalla aiheella" actually re-runs the same topic.
- [ ] "Takaisin valintaan" routes back to the correct mode-page.
- [ ] Rail is hidden (collapsed shell) on every mode-page, drill, and results screen.
- [ ] `npm run dev` boots cleanly; no console errors on any of the new screens.

If any item fails, write a follow-up commit and re-run.

- [ ] **Step 5: Commit**

```bash
git add design-system/DESIGN.md sw.js
git commit -m "docs(design): §12 — mode-pages, drill, results editorial system"
```

---

## Self-review — spec coverage

| Spec § | Implemented in task |
|---|---|
| §2 Foundation reuse | Tasks 1–4 (CSS scaffolding consumes Spec 1 tokens; verified at implementation) |
| §3.1 Shell mode | No-op — `js/ui/nav.js` already defaults rail-off everywhere except dashboard |
| §3.2 Slot map | Tasks 7–11 (one mode-page per task) |
| §3.3 Briefing card | Task 2 (CSS), Task 6 (`loadBriefing` + tests), Task 7 (vocab markup), Tasks 8–11 (other modes) |
| §3.4 Topic rows | Task 3 (CSS), Task 5 (`wireTopicPicker` + tests), Tasks 7–11 (markup per mode) |
| §3.5 Start CTA | Task 1 (`.btn--cta--mini`), Task 5 (live meta-line update via `wireTopicPicker`), Tasks 7–11 (per-mode CTAs) |
| §3.6 Per-mode bespoke | Task 8 (grammar `.btn--ghost`), Task 9 (verbsprint duration), Task 10 (reading pro-note), Task 11 (writing two-row groups) |
| §3.7 Markup file structure | Tasks 7–11 |
| §4 Drill view | Task 4 (CSS), Task 12 (vocab + grammar markup + monivalinta renderer), Task 13 (reading) |
| §4.5 Skeleton | Task 4 (CSS only — JS doesn't render skeleton today; existing `.exercise-skeleton-slot` is the consumer for future skeleton fill, but the new CSS classes work the moment skeleton-slot HTML uses them; no JS task is required for ship) |
| §5 Results view | Task 4 (CSS), Task 14 (markup + JS migration + `generateCoachLine` + tests) |
| §6 File changes summary | Reconciled in "Reality reconciliation" above |
| §7 Risks | Mitigations applied: empty-state fallback (Task 6), per-module render JS isolated (Tasks 12, 13), small-viewport row wrap (CSS in Task 3), unbounded breakdown list (CSS overflow inherited from app-shell) |
| §8 Testing | Task 6 + Task 14 add unit tests; Task 15 manual QA list |
| §9 Sequencing | Plan task order matches: foundation → mode-page-by-mode → drill → results → docs |

**Gaps acknowledged:**
- The skeleton state in §4.5 is CSS-only by design; no JS exists today to render it. Adding skeleton injection JS would be a separate task — out of plan scope, called out in the spec §7 mitigation ("ship without shimmer first; instrument time-to-first-question").
- The `state.sessionAnswers` capture for the results breakdown is best-effort — if any mode has trouble capturing per-question outcomes within the Task 14 budget, that mode ships without the breakdown list. Spec §7 also flags this as acceptable degradation.
- The "Suosittelemme" line in the briefing card is dropped in this plan because the API doesn't surface a `weakestTopic` field. Empty-state still shows the "Aloita Sekaisin-aiheella…" intro. Adding the suggest line is a future enhancement once the API exposes per-mode weak-topic data.
