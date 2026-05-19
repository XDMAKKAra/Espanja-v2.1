# PR 1 of 3 — Path-screen 3-column hybrid (Eduix layout, Old-Spain palette)

**Date:** 2026-05-19
**Branch:** `auto/path-3col-hybrid`

## Why

User reference screenshots from MAFY, Eduix (FIN4.1), Otava (Särmä 8) all
share a pattern Puheo doesn't follow:

- **Left rail = chapter TOC** (all courses listed, current expanded inline)
- **Middle = current course detail** (lessons as numbered grid)
- **Right rail = progress stats** (read-only summary, no CTA noise)
- **Sans-serif everywhere** (no decorative serif), one quiet brand colour
- **Numbered hierarchy** ("G4.5 Täydennä", "Kurssi 1.3 Sanasto") — never
  "Aloita harjoittelu" floating CTAs

Puheo's current path-screen renders as a one-column dashboard with a
right rail that mixes day-CTA + chart + empty-state — and a flicker bug
where the dashboard briefly flashes empty after the second render
overwrites the first.

This PR is a **structural pivot**: same Old-Spain colour palette
(cream paper + brick accent), but the layout and chrome shift toward
the Eduix functional digi-textbook pattern. Fraunces stops carrying the
register; Manrope sans takes over for everything except a single
display element per screen.

## Scope

### P0 — Fix double-render flicker

Root cause: `dashboard.js loadDashboard()` calls `loadCurriculum()` in
the cache-hit branch, AND `renderDashboard()` in both the cache-hit
branch and the post-fetch branch. The second `renderDashboard` removes
the `dash-greeting--in` class to re-trigger the blur-fade entrance —
during the requestAnimationFrame gap, the hero is opacity 0. If the
post-fetch render runs >1 frame after the user's eye lands, they see
the flash.

The earlier 1.5s dedupe (PR #92) only deduped the curriculum kick. It
didn't dedupe the `renderDashboard` itself. Fix: skip the post-fetch
`renderDashboard` when the payload hasn't changed AND the cache-hit
render ran within the last `DASHBOARD_DEDUPE_MS`. Use a content hash
(stringified payload length + first 32 chars) for cheap equality.

### P0 — Three-column path-screen

`#screen-path .path-grid` becomes a 3-col CSS grid on `≥1280px`:

```
┌──────────────┬─────────────────────────┬──────────────┐
│ TOC          │  Current course         │ Stats rail   │
│ 280px        │  fluid (~620px)         │ 280px        │
│              │                         │              │
│ Kurssi 1 ✓  │ ┌──────┬──────┬──────┐ │ DAILY CTA    │
│ Kurssi 2 →  │ │ 1.1  │ 1.2  │ 1.3  │ │              │
│   ├ 1.1 ✓   │ └──────┴──────┴──────┘ │ Streak: 1 pv │
│   ├ 1.2 →   │  [lessons]              │ Sessions: 0  │
│   └ 1.3 🔒  │                         │ YO-readiness │
│ Kurssi 3 🔒 │                         │              │
│  ...         │                         │ Chart-empty  │
└──────────────┴─────────────────────────┴──────────────┘
```

Below 1280px the right rail folds to the bottom of the middle column.
Below 1024px the TOC folds to a horizontal top-strip with course chips
(matches Eduix mobile).

### P0 — Drop Fraunces from body text

`body.app` overrides currently set Fraunces on h1/h2/h3/.display. Keep
Fraunces ONLY for:
- The single greeting line ("Iltaa, testpro123.") on path screen
- The big course title on the open course in middle column
- The auth screen left aside title

Everything else (course-card title, lesson card title, sidebar items,
KPI tile values, eyebrows, buttons) becomes **Manrope sans-serif**.
Reads as a digi-textbook (Eduix/Mafy use Inter/system), not a printed
volume. Fraunces stays as the **personality moment**, not the default.

### P0 — Numbered hierarchy

Course titles become `"1. Kuka olen"` (numeric prefix). Lessons inside
become `"1.1 Tervehdys"`, `"1.2 Verbi olla"`, etc. — set at render time
in `js/screens/curriculum.js renderCard()` and `renderBentoCard()`.

### P0 — Drop the fleuron + brick PÄIVÄN HARJOITUS eyebrow

Both were added in PR #95 (editorial chrome) and read as ornamental on
the new functional layout. Remove cleanly so the layout breathes.

### Out of scope (later PRs)

- PR 2: lesson-page three-column layout (left lesson TOC, middle
  exercise, right teaching panel) + breadcrumb.
- PR 3: inline gap-fill exercise rendering (Eduix screenshot 203255
  pattern — clickable blanks in flowing prose).

## Components

- `js/screens/curriculum.js`
  - `renderCard(k, stepNumber)` — add numeric prefix `${stepNumber}. ${title}`
  - `renderBentoCard(...)` — add `${courseNum}.${lessonNum}` prefix
  - New: `renderPathTOC(root)` — renders the left rail TOC, listens for
    course-click events, calls `toggleKurssi` to expand inline.
- `js/screens/dashboard.js`
  - Add `_lastRenderHash` tracking; skip second `renderDashboard` when
    hash matches cache-hit hash AND elapsed < `DASHBOARD_DEDUPE_MS`.
- `app.html`
  - `#screen-path` body restructured: add `<aside class="path-toc">`
    before `.path-grid`, change `.path-grid` to 3-col.
- `css/components/curriculum.css` and `css/app-old-spain.css`
  - 3-col grid styles, TOC styles, Manrope swap on body text,
    drop fleuron rules, drop PÄIVÄN HARJOITUS eyebrow.

## Acceptance

- Open path screen on a fresh-cache load → greeting + course list +
  rail render once, no flash to empty.
- Resize 1440 → 1024 → 768: 3-col → 2-col + bottom rail → mobile stack,
  no horizontal overflow at any breakpoint.
- Course titles read `"1. Kuka olen"`, lesson titles read
  `"1.1 Tervehdys"`.
- Body text is Manrope sans. Greeting + open-course title are Fraunces.
- `sw.js` cache version bumped + bundle rebuilt.
- `npm test` green.

## Out-of-scope follow-ups documented

PR 2 spec stub: `docs/superpowers/specs/2026-05-XX-lesson-3col-design.md`
PR 3 spec stub: `docs/superpowers/specs/2026-05-XX-inline-exercises-design.md`
