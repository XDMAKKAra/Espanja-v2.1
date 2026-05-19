# Home + Course Overview rebuild (4-PR program)

**Date:** 2026-05-19
**Branches:** `auto/lesson-apua-fix`, `auto/home-screen`, `auto/course-overview`, `auto/strip-sidebar-routing`

## Why

Current architecture: a global sidebar with four nav buttons (Oppimispolku /
Luetun ymmärt. / Kirjoittaminen / Koeharjoitus). Lessons live inside
Oppimispolku; the other three are standalone modes. User asked for a
restructured hierarchy where Oppimispolku is "its own world" per language
+ course, the global sidebar disappears, and a Home screen with language
pick + course library sits above it.

Reference screenshots: 212311 (Otava-style course library, cover thumbnails
+ "..." menu), 212154 (lesson with phase TOC working — but Apua panel from
the right gone, which is a regression we need to fix first).

## Target architecture

```
HOME ─→ language tabs (ES/FR/DE) + course grid (Otava-style)
  ↓ pick course
COURSE OVERVIEW ─→ 4 mode tiles: Oppimispolku / Kirjoitustehtävä /
                   Luetun ymmärtäminen / Koeharjoitus, with tier-lock badges
  ↓ pick mode
PATH (Oppimispolku) ─→ existing path-screen, scoped to one course
  ↓ pick lesson
LESSON ─→ existing 3-col lesson screen (TOC + exercise + Apua)
```

Sidebar nav is removed. The breadcrumb is the only navigation chrome —
Home / Course / Mode / Lesson, each clickable.

## Decomposition

### PR 1 — Apua-panel toggle restored (small, P0 regression fix)

PR #97 set `.lr-help-btn { display: none }` at ≥1280px because the side-panel
was supposed to be always-on as the right column. User screenshot 212154
shows the always-on rail isn't actually visible (the lesson layout falls
back to the 2-col `.lr-shell--exercise` rules when `lr-shell--three` is
applied — needs a CSS audit). Fix:

- Audit why the .lr-side-panel doesn't show on the right column on
  ≥1280px even though the grid-template-area "panel" is allocated.
- If the always-on approach is too brittle, restore the slide-in toggle:
  remove the `display: none` on `.lr-help-btn` at ≥1280px and let the
  side-panel work as before.
- Verify Apua content (intro + key_points) populates correctly.

Scope: CSS + maybe one line in lessonRunner.js. Single PR, <50 LoC.

### PR 2 — HOME screen with language tabs + course library

New screen `#screen-home`:

- Top: app logo + page title "Aloita harjoittelu"
- Language tabs row (ES/FR/DE) — reuse the existing landing grader-card
  switcher pattern. Tab persistence via `localStorage('puheo:lang')`.
- Grid below: 8 course cards per language, Otava-style:
  - Cover area: simple SVG illustration per course (we don't have
    photographs; generate 8 distinct geometric patterns + per-language
    accent colour overlay). Stored at
    `public/illustrations/course-cover-N.svg` (8 files, reused across
    languages, accent overlay set via CSS based on body class).
  - Body: "Kurssi N — Title", level badge, lessons-completed/total
    progress bar, status chip (Lukittu / Aloita / Jatka / Suoritettu).
  - "..." menu (right corner): "Aloita alusta", "Avaa kurssi", "Lisätietoja".
- Empty-state when language not yet released: "Saksa tulossa kesäkuussa".

JS:
- New `js/screens/home.js` exports `loadHome()`. Fetches
  `/api/curriculum?lang=X` for the active tab, caches per language. Card
  click navigates to `#/kurssi/{lang}/{kurssiKey}`.
- `js/main.js` adds `home` to NAV_HASH, navigateTo "home" calls loadHome.

HTML: `<div id="screen-home" class="screen">` with empty container that
home.js owns.

CSS: new `css/components/home.css` with the tabs + grid + card styles.

### PR 3 — COURSE OVERVIEW screen with 4-mode picker

New screen `#screen-course-overview`:

- Breadcrumb: "Aloitus / Kurssi N — Title"
- Hero: cover illustration (same SVG as HOME card) + course meta (level,
  lesson count, % complete) + "Aloita alusta" + "Avaa oppimispolku"
- 4 mode tiles in a 2×2 grid:
  - Oppimispolku — opens path with this course expanded
  - Kirjoitustehtävä — opens screen-writing scoped to this course's topics
  - Luetun ymmärtäminen — opens screen-reading scoped to this course
  - Koeharjoitus — opens screen-fullExam (full-exam flow)
- Per-tile tier lock badge:
  - Pro/Treeni: no badge, full access
  - Free: lock icon + "X kertaa jäljellä" pulled from
    `checkFeatureAccess(userId, mode)` server response
  - Free with quota exhausted: lock + "Avaa Treeni" link

JS: `js/screens/courseOverview.js` exports `loadCourseOverview(lang, kurssiKey)`.
Pulls course detail from `/api/curriculum/{key}` + tier limits from
`/api/feature-access` (existing endpoint). Mode-tile click navigates to
the respective screen, threading `kurssiKey` as a context filter.

Hash route: `#/kurssi/{lang}/{kurssiKey}` → loadCourseOverview.

### PR 4 — Strip sidebar nav, rewire routing

- Remove the four sidebar items (Oppimispolku, Luetun ymmärt., Kirjoit.,
  Koeharjoitus) from app.html. Keep Asetukset + Kirjaudu ulos as
  "settings cluster" at the bottom — those don't fit the home/course
  flow.
- Replace `navigateTo("path")` calls with `navigateTo("home")` everywhere
  the default is the entry screen.
- Hash routes:
  - `#/aloitus` → home
  - `#/kurssi/{lang}/{key}` → course overview
  - `#/oppimispolku/{lang}/{key}` → path scoped to course
  - `#/oppitunti/{lang}/{key}/{lessonNum}` → lesson runner
  - `#/luetun/{lang}/{key}` → reading mode
  - `#/kirjoitus/{lang}/{key}` → writing mode
  - `#/koeharjoitus/{lang}/{key}` → exam mode
- Backwards-compat: old hashes (`#/oppimispolku` without lang/key) redirect
  to `/aloitus`.
- Each screen's "back" CTA points one level up (lesson → path, path →
  course, course → home).
- Mobile bottom-nav: replace nav-mode chips with a single "← Aloitus" /
  "← Kurssi" contextual back chip.

## Tier-lock detail (PR 3)

Pulled live from `/api/feature-access?mode=X`. Server already implements
free-tier counters per `mode` keyword (vocab/grammar/reading/writing/exam).
For HOME and COURSE OVERVIEW we treat:

- `oppimispolku` — uses `vocab` + `grammar` counters internally (each
  lesson hits one of them). Display: "X kertaa jäljellä" = min of the
  two remaining counters.
- `kirjoitustehtävä` — `writing` counter.
- `luetun ymmärtäminen` — `reading` counter.
- `koeharjoitus` — `exam` counter (existing).

Lock states:
- `>0` remaining → "X kertaa jäljellä" pill, mode unlocked
- `0` remaining + free tier → "Avaa Treeni" CTA, mode locked
- `Infinity` / pro tier → no badge

## Acceptance

- PR 1: Apua panel visible on lesson screen on ≥1280px (right column,
  always on), OR the slide-in toggle works on <1280px.
- PR 2: `/app.html#/aloitus` renders HOME with 3 language tabs + course
  grid. Switching tabs swaps the grid without reload. Course click
  navigates to `#/kurssi/{lang}/{key}`.
- PR 3: Course overview shows the 4 mode tiles. Free user sees lock +
  remaining-counter badges. Pro user sees no badges.
- PR 4: Sidebar nav removed. Hash routes hierarchical. Back buttons
  walk up the tree. No dead-end screens.
- Each PR: `sw.js` bumped, bundle rebuilt, all 1219 vitest specs green.
