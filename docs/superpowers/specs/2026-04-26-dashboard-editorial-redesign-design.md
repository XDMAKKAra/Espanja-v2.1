# Dashboard Editorial Redesign — Spec 1: Foundation + Dashboard

**Status:** Approved 2026-04-26
**Spec scope:** Foundation (tokens, type scale, layout primitives) + Dashboard rebuild as proof.
**Out of scope (future specs):** Exercise interiors (vocab, grammar, verbsprint, reading, writing, exam), onboarding, settings, landing page (`index.html`).

---

## 1. Goal

Make the Puheo app feel like a confident editorial study tool on desktop. Fix three pain points the current app has after the mint+navy rebrand and restraint pass:

1. **Wasted space on PC** — every screen is centered in `max-width: 1080px`, leaving big empty bands on 1440 px+ monitors.
2. **Flat hierarchy** — restraint pass stripped decoration; everything reads as the same weight.
3. **Boring / characterless** — minimalist mint+navy without an anchoring move reads as generic.

The personality direction chosen is **Editorial — quiet study tool, confident type**: big Inter heavy headlines, mono numerals as the data anchor, almost no chrome, hierarchy from weight + colour + whitespace. Reference register: Linear (motion restraint), Notion (content density), the New Yorker (whitespace as a design move).

The layout strategy chosen is **two-column asymmetric (main + rail)**: a reading-comfortable main column (~640–880 px) plus a persistent right rail (~320 px) carrying status data (streak, YO-readiness, exam countdown, today's goal). Rail collapses on narrow viewports.

Success criteria:

- Dashboard fills 1440 px and 1920 px monitors without empty side bands.
- A first-time visitor reads the eyebrow → greeting → grade → CTA in that order without scanning.
- Rail data is visible without scrolling on a 13″ laptop (≥ 800 px tall).
- All existing dashboard data IDs remain wired (`dash-streak`, `dash-hero-grade`, `dash-heatmap`, etc.) — `app.js` is untouched.
- `npm test` and `node --check js/screens/*.js` pass.
- WCAG AA contrast on every text token.

---

## 2. Foundation changes (`style.css :root` and a few new files)

### 2.1 Layout tokens (replace the current width tokens)

Today the app uses `--w-tablet/--w-desktop/--w-wide` and applies `max-width: var(--w-desktop)` (1080 px) on screen-level containers. That is the wasted-space root cause. Replace with shell tokens that describe the columns of the editorial layout, not the page:

```
--app-sidebar:    220px                    /* unchanged — existing left nav */
--app-main-min:   640px                    /* editorial reading line floor */
--app-main-max:   880px                    /* reading line ceiling */
--app-rail:       320px                    /* right rail width */
--app-gutter-x:   56px                     /* horizontal padding inside main */
--app-gutter-y:   56px                     /* vertical breathing room */
--bp-rail:        1180px                   /* below this, rail collapses */
```

Keep `--bp-tablet: 768px` and `--bp-desktop: 1024px` as-is for non-shell consumers.

The shell is a CSS grid:

```
grid-template-columns: var(--app-sidebar) minmax(var(--app-main-min), 1fr) var(--app-rail);
```

The grid cell for main grows freely; the content **inside** main is capped by `max-width: var(--app-main-max)` on a `.app-main-inner` wrapper, so wide monitors get content that breathes inside an editorially-controlled reading line rather than stretching to the viewport. Below `--bp-rail` (1180 px) the rail folds — see §3.4 for the per-breakpoint rules.

No screen container (`.dashboard-inner`, `.start-inner`, etc.) sets its own `max-width` anymore. The grid + `.app-main-inner` does the constraining.

### 2.2 Typography scale (replaces current `--fs-*`)

Drop the current `--fs-h1: clamp(2.5rem, 5vw, 3.5rem)` style and re-tier so a screen has a clear three-step hierarchy: **display → section → body** with mono as a parallel data register.

```
--fs-display:    clamp(2.5rem, 4.2vw, 3.5rem)    /* greeting H1 */
--fs-h1:         clamp(1.75rem, 2.4vw, 2.25rem)  /* screen openers below greeting */
--fs-h2:         1.25rem                          /* section openers */
--fs-h3:         1rem                             /* card / list-row titles */
--fs-body:       0.9375rem                        /* 15px — slightly larger than current 14px */
--fs-body-sm:    0.8125rem                        /* 13px secondary */
--fs-meta:       0.6875rem                        /* 11px uppercase eyebrows */

--fs-mono-lg:    2.25rem                          /* rail "big" numerals (streak, countdown) */
--fs-mono-md:    1.375rem                         /* inline numbers in lists */
--fs-mono-sm:    0.75rem                          /* tags, unit suffixes, mono captions */

--ls-display:    -0.025em                         /* tighten display H1 */
--ls-eyebrow:    0.14em                           /* uppercase tracking */
```

Weights stay 400/500/600/700/**800** — already preloaded in the mint+navy commit, no font work needed.

### 2.3 Token cleanup

Drop the legacy aliases that were kept after the mint+navy migration as compatibility shims. They drift the system because new code keeps using the old names. Delete from `:root`:

- `--brand`, `--brand-btn`, `--brand-light`, `--brand-glow`
- `--accent2`, `--gold`
- `--correct`, `--wrong`
- `--surface2`
- `--radius`
- `--text`, `--text-muted`, `--text-faint`

For each removed token: grep the codebase, replace existing usages with the canonical token (`--accent`, `--accent-hover`, `--success`, `--error`, `--surface-2`, `--r-md`, `--ink`, `--ink-soft`, `--ink-faint`). Migrations happen file-by-file with verification at each step.

Keep `--w-tablet/--w-desktop/--w-wide` for now — they're still referenced by exercise screens (`vocab`, `grammar`, etc.). Those will move to the new shell in spec 2 and the old tokens get deleted then.

### 2.4 Visual restraint (no new shadows or gradients)

Mint accent stays one-per-screen. The single new chrome move is **`border-top + border-bottom`** to bracket the dashboard hero card editorial-style. That replaces shadow as the "this is the important thing" signal. No box-shadow on cards at rest. No surface gradients.

---

## 3. Dashboard layout

### 3.1 Component file structure

Move dashboard rules out of the 5775-line `style.css` into focused files:

| File | Action | Contents |
|---|---|---|
| `css/components/app-shell.css` | NEW | The 3-column grid, sidebar/main/rail rules, responsive collapse |
| `css/components/typography.css` | NEW | `.eyebrow`, `.display`, `.section-h`, `.mono-data`, `.mono-num` utilities |
| `css/components/dashboard.css` | NEW (extracted) | All `.dash-*` rules, moved out of `style.css`. Rewritten against the new system |
| `css/components/rail.css` | NEW | `.rail`, `.rail-stat`, `.rail-countdown`, `.rail-goal`, `.rail-footer` |
| `css/components/card.css` | edit | Drop shadow at rest; keep border-only |
| `css/components/button.css` | edit | Add `.btn--cta` (the navy day-drill block) |

`style.css` itself is **not** rewritten. Only its `:root` and the dashboard rules move out.

### 3.2 Shell markup

`app.html` shell becomes a single grid container. The existing left sidebar (`<aside class="app-sidebar">`) is unchanged. The new structure introduces a per-screen `.app-main` and `.app-rail`:

```html
<aside class="app-sidebar"><!-- unchanged --></aside>

<main class="app-main">
  <div id="screen-dashboard" class="screen">
    <!-- main column content here -->
  </div>
</main>

<aside class="app-rail" id="dashboard-rail">
  <!-- rail content for the active screen -->
</aside>
```

The rail is per-screen: dashboard has the stats rail; other screens (in spec 2) declare their own rail content or hide the rail entirely. When the active screen has no rail, the grid collapses to two columns (sidebar + main).

### 3.3 Dashboard slot map (top-down reading order)

**Main column:**

1. **Eyebrow** — current weekday and date as `<time datetime="...">` (e.g. "Tiistai · 26.4.").
2. **Greeting H1** — `Hei, <name>.` rendered at `--fs-display`, weight 800, letter-spacing `--ls-display`. Final period optionally rendered as the mint accent character (`em` styled `font-style: normal; color: var(--accent-hover)`).
3. **Motivational sub** — single short paragraph, generated by existing `dash-motivation` logic. `--fs-body`, `--ink-soft`, `max-width: 50ch`.
4. **Hero grade card** — replaces today's `.dash-hero-grade`. Border-bracketed (top + bottom 1 px `--border`), no background, no shadow. Layout: 96 px circle on the left (grade letter at `--fs-display`, weight 700, with 2 px `--ink` border), meta on the right (eyebrow label, `--fs-h2` headline, scale row of 7 grade chips, caption). Same data wiring as today.
5. **Level-progress strip** (existing `.dash-level-progress`) — kept inline below the hero grade, restyled flat: hairline rule above, single-line `[B → C]` mono text + thin progress bar + caption. Disappears once the user's tier is established (existing data condition).
6. **Day's drill CTA** — `.btn--cta`, navy `--ink` background, `--bg` text, 18 px × 20 px padding, `--r-md` radius. Layout: `[title + mono meta] · [→ arrow in mint]`. Replaces today's `dash-onboarding-banner`, `sr-top-bar`, `dash-sr-review`, and the scattered "start" CTAs with one block that knows what the user should do today.
   **Selection priority** (top to bottom; first match wins):
   1. Profile incomplete → "Täydennä profiilisi" / target = onboarding
   2. SR cards due today (`dash-sr-count > 0`) → "Kertaa nyt — N korttia" / target = SR review
   3. Default → "Aloita päivän treeni — N sanaa · ~5 min" / target = vocab drill seeded with weakest topic
   The block is one element; only its text content + `data-target` change.
7. **Weak topics list** — replaces today's `.dash-weak-topics` cards. Rendered as a list of rows: `[01]  [topic name]  [12 virhettä]  [42%]`, mono numerals on the left and right. Top border on each row; no card backgrounds. Section opens with an `<h3>` left, secondary "Näytä kaikki" link right.
8. **Activity heatmap** (30 days) — existing `.dash-heatmap` retained, restyled to a single mint scale (4 levels) on neutral grey base. No coloured legends; rely on tooltip.
9. **Progress chart** — existing `.dash-chart` retained, restyled to flat single-line + light area fill, mint stroke.
10. **SR forecast** (existing `.dash-forecast-section`) — retained at the bottom, restyled to match the list register (mono numerals, no card chrome).

**Rail (top-down):**

1. **Eyebrow "Tänään"** + 3 mini-stats (streak, YO-readiness %, words mastered) — each row is `[mono value] / [eyebrow label]`. Hairline border between rows.
2. **Eyebrow "YO-koe"** + countdown — big mono day count (`--fs-mono-lg`, `--error` colour when ≤ 30 days, `--ink` otherwise) with `Päivää · 28.9.2026` caption.
3. **Eyebrow "Tämä viikko"** + today's goal — `12/20 min` mono, 4 px progress bar in `--accent`, caption with percentage.
4. **Rail footer** — small `v1.4 · viimeisin sync HH:MM` text in `--ink-faint`. Signals "real tool" without occupying focus.

### 3.4 Responsive rules

| Viewport | Sidebar | Main | Rail |
|---|---|---|---|
| ≥ 1180 px | 220 px fixed | minmax(640, 1fr), padding 56 px | 320 px right rail, padding 28 px |
| 1024–1179 px | 220 px fixed | flex 1, padding 40 px | rail moves below main as horizontal 4-card strip |
| 768–1023 px | collapses to existing top nav | full width, padding 24 px | rail strip stays horizontal at top below greeting |
| < 768 px | existing bottom nav | full width, padding 16 px | rail items fold into the existing `dash-stats-row` style horizontal strip |

Below 1180 px the rail's "today" eyebrows are dropped; the items inline as a 4-up strip with mono numbers and small captions. Below 768 px the strip becomes a 2×2 grid (existing pattern).

### 3.5 Removed / merged elements

These current dashboard pieces are **gone** in the new layout:

- The 3-card `.dash-stats-row` (`🔥 streak / 📝 sessions / 📅 week`) — folded into the rail.
- The 2-card `.dash-goal-row` (countdown + daily goal) — folded into the rail.
- The `.dash-pro-area` and logout button in `.dash-header` — moves to the existing `.sidebar-footer`, which already has slots.
- `.dash-onboarding-banner`, `.sr-top-bar`, `.dash-sr-review` — absorbed into the unified Day's drill CTA, which swaps text + target based on user state.
- Decorative emoji icons inside the dashboard cards (`🔥 📝 📅 🎯 ✨`) — already hidden by the restraint pass; the markup that holds them gets cleaned out.

`.dash-section-label` divs are replaced by proper `<h3>` headings with the section style.

---

## 4. Propagation rules (added to `design-system/DESIGN.md` as new §)

A new section (`§N — Editorial system`) documents the rules every other screen must obey when migrated in spec 2:

- Use `app-shell.css` grid; never set `max-width` on a screen container.
- Open every screen with eyebrow + display H1 + sub.
- Mono numerals (`DM Mono`) for any quantity: score, count, percentage, time, count-down. Body text never carries numbers.
- Lists over cards when items are homogeneous (>3 of the same shape).
- Border-bracketed pattern (top + bottom 1 px hairline, no background) for the screen's "main thing".
- One mint accent per screen.
- Rail content is per-screen and optional; declare it adjacent to `app-main` or omit.

These rules let exercise screens, the writing screen, and exam practice converge on a coherent system in spec 2 without re-deciding tokens or layout.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Main column at 880 px max may feel narrow on a 1920 px monitor after stat cards leave | Verify in the browser mockup at 1440 px and 1920 px; if it reads narrow, raise `--app-main-max` to 960 before implementation |
| Removing `dash-onboarding-banner` as a distinct block may hurt the un-onboarded user funnel | The Day's drill CTA absorbs the onboarding ask when `profile_complete` is false: same block, swapped text + target. This is a single-source-of-truth improvement, not a removal |
| Token rename breaks existing CSS in unexpected places | Drop tokens one at a time, with a grep audit per token; replace usages in their actual files; verify visual diff before the next token |
| 320 px rail on 1180–1280 px viewports could squeeze the main column under 640 px | At those widths the responsive rule moves the rail below main; main gets full width minus sidebar |
| Editorial mood requires Inter at heavy weights — must already be loaded | Already loaded: 400/500/600/700/800 are preloaded (verified in the mint+navy commit) |
| Bumping `style.css` triggers SW cache; users keep stale CSS | Bump `sw.js` `CACHE_VERSION` as part of the implementation (per project convention) |

---

## 6. Testing

**Visual:** Screenshot the dashboard at 390×844, 768×1024, 1280×800, 1440×900, 1920×1080. Compare each against the approved browser mockup at the same width. No automated visual regression — manual eyeball.

**Functional:** Dashboard `app.js` wiring is untouched. Existing IDs preserved (`dash-streak`, `dash-hero-grade`, `dash-heatmap`, `dash-chart`, `dash-forecast-chart`, etc.). Existing data attributes preserved. `npm test` passes. `node --check` passes for every JS file in `js/screens/`.

**Accessibility:**

- `:focus-visible` outline on every nav item, CTA, list row, rail item.
- Rail and section headings as proper `<h3>`/`<h2>`.
- Eyebrow date as `<time datetime="2026-04-26">`.
- Hero grade card: when interactive, it stays a `<button>` (already is); the new "border-bracketed" style still gets a focus ring.
- Mono numerals retain the existing `aria-label` pattern that adds units (e.g. `aria-label="7 päivää putkessa"`).
- `prefers-reduced-motion` respected — no new motion is introduced by this spec.
- Contrast: every text token verified ≥ 4.5:1 on its background; mono numerals on rail surface verified ≥ 4.5:1.

**Manual QA list at end of implementation:**

- Dashboard renders correctly for: empty state (no data), partial data (no grade tier yet), full data, urgent state (≤ 7 days to exam).
- Rail collapses cleanly at 1180 px and 768 px breakpoints; no overlap with main content.
- All sidebar nav targets still work (no broken handlers).
- Toggling onboarding state swaps the Day's drill CTA text+target as expected.
- `npm run dev` boots cleanly; no console errors on dashboard mount.

---

## 7. File changes summary

| File | Change | Estimated LOC delta |
|---|---|---|
| `style.css` | `:root` rewrite (layout + type tokens, alias cleanup); remove `.dash-*` block | -200 / +60 |
| `css/components/app-shell.css` | new | +120 |
| `css/components/typography.css` | new | +80 |
| `css/components/dashboard.css` | new (extracted + rewritten) | +250 |
| `css/components/rail.css` | new | +100 |
| `css/components/card.css` | small edit | +/-10 |
| `css/components/button.css` | add `.btn--cta` | +30 |
| `app.html` | dashboard markup rewrite (slot map §3.3); shell wrap; rail container | +/-80 |
| `design-system/DESIGN.md` | new propagation section | +60 |
| `sw.js` | bump `CACHE_VERSION`; include new CSS files in `STATIC_ASSETS` | +/-6 |
| `.gitignore` | add `.superpowers/` (brainstorm scratch dir) | +1 |

`app.js` is untouched. `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js` are untouched.
