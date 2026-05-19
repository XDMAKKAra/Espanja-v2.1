# Mode-first hierarchy + ohjaamo + library-shelf course list

**Date:** 2026-05-19
**Branches:** several — `auto/ohjaamo`, `auto/oppimispolku-shelf`, `auto/mode-router-rewire`

## Why

User feedback 2026-05-19 (after PRs #105-108):
- Mode picker (oppimispolku / kirjoit / luetun / koeharj.) is currently
  *inside* the course overview, but should be at the **top level** after
  language pick. Most modes don't need a course context — they're
  standalone flows.
- HOME page is too thin — needs an **"ohjaamo"** showing student level,
  streak, sessions, YO-valmius. Free users see streak + sessions; level
  and YO-valmius are paywalled behind Treeni.
- Gradient cover squares on the 8 course cards look AI-slop. Replace
  with **library-shelf typography** (no cover image at all — number tag
  + title + progress in clean editorial layout).

## Target architecture

```
HOME (#/aloitus)
├─ Language tabs (ES / FR / DE), persisted to localStorage
├─ Greeting "Iltaa, testpro123."
├─ OHJAAMO panel (lang-scoped):
│    • Streak             ← free + pro
│    • Sessions tehty     ← free + pro
│    • Taso (YTL grade)   ← pro only; free sees lock + blurred
│    • YO-valmius %       ← pro only; free sees lock + blurred
│    • [for free] "Avaa Treeni nähdäksesi koko ohjaamon" CTA
└─ 4 MODE cards (no cover graphics):
     ┌─ 📚 Oppimispolku       → #/oppimispolku?lang=X
     │     "Vaiheittainen kurssi sanasto- ja kielioppitehtävineen"
     │     "Yksi oppitunti per päivä — Treeni: rajoittamaton"
     ├─ ✍️ Kirjoitustehtävä   → #/kirjoitus?lang=X
     │     "AI arvioi YTL-rubriikilla"
     │     "3 tehtävää per kuukausi — Treeni: rajoittamaton"
     ├─ 📖 Luetun ymmärtäminen → #/luetun?lang=X
     │     "Aitoja YO-tyylisiä tekstejä + monivalintatehtävät"
     │     "5 tekstiä per päivä"
     └─ 🎓 Koeharjoitus        → #/koeharjoitus?lang=X
           "Koko YO-koe simulaationa"
           "🔒 Avaa Treeni" (hard lock for free)

OPPIMISPOLKU INDEX (#/oppimispolku?lang=X)
├─ Breadcrumb: Aloitus / Oppimispolku
├─ Title "Oppimispolku — 8 kurssia"
└─ 8 KURSSIT — library-shelf rows (no cover graphics):
     ┌───┬─────────────────────────┬─────────────────┐
     │ 1 │ Kuka olen               │ ●●●●○○○○○○ 4/10 │ ← clickable row
     │ 2 │ Arki ja elämä           │ ──────────  🔒  │ ← locked row, muted
     │ 3 │ Mitä tein               │ ──────────  🔒  │
     │ ⋮ │ ...                     │                 │
     └───┴─────────────────────────┴─────────────────┘
   Each row: number gutter (mono numerals) | title + level | progress.
   Hairline rules between rows. No cards, no shadows, no covers. Reads
   as a textbook chapter index page.

COURSE SCREEN (#/oppimispolku/{lang}/{kurssi})
├─ Breadcrumb: Aloitus / Oppimispolku / Kurssi 1
├─ Hero: course number + title + description + progress bar
└─ 10 OPPITUNTIA — same library-shelf row style:
     1.  Perhe ja kansallisuudet ── perussanasto       ●●●● 14 min
     2.  -ar-verbit preesensissä ── säännöllinen taivutus     16 min
     ...

LESSON (existing #screen-lesson, unchanged)
- Breadcrumb: Aloitus / Oppimispolku / Kurssi 1 / 1. Perhe ja kansallisuudet
- "← Poistu" link at top-left of the lesson page
- Teaching page → 9-10 phases (Tehtävät TOC on the left)
```

## Visual direction (anti-AI-slop)

- **No gradient cover squares anywhere.** Every screen uses typography
  + thin rules + brick accent only.
- **One personality moment per screen** (Fraunces display title); rest
  is Manrope sans.
- **Numbers as glyphs**, not as filled blocks. Mono numerals in gutter
  columns where they tag a row.
- **Brick accent reserved** for: active state, primary CTA, paywall
  callouts. Not for decoration.
- **Library-shelf rows** for kursselista + oppituntilistaa. Equivalent
  of a printed textbook's TOC page.

## Free vs Treeni gating

Sourced from `window._userProfile.subscription_status`. Helper:
`isProTier()` already lives in courseOverview.js — extract to
`js/lib/tier.js` shared by HOME ohjaamo + mode cards + paywall callouts.

- **Free** (`!isProTier()`):
  - Sees streak + sessions in ohjaamo.
  - Sees "Tasosi" + "YO-valmius" cells blurred with lock glyph; clicking
    opens paywall modal.
  - Sees mode badges "Yksi oppitunti per päivä" / "3 tehtävää / kk" /
    "5 tekstiä / pv" — soft limits (existing /api/feature-access already
    throttles server-side).
  - Koeharjoitus mode card has hard lock + brick "Avaa Treeni" badge.
- **Pro / Treeni / lifetime**:
  - Full ohjaamo data.
  - No badges on mode cards.
  - Koeharjoitus open.

## Components

1. `js/lib/tier.js` — `isProTier()` + `getTierLabel()` exports
2. `js/screens/home.js` — REWRITE: ohjaamo panel + 4 mode cards (drop
   the current 8-course grid)
3. `js/screens/oppimispolkuIndex.js` — NEW: 8-course library-shelf list
4. `js/screens/courseDetail.js` — NEW or REUSE: course's 10 lessons
   library-shelf list (currently lives in curriculum.js bento — adapt)
5. `js/screens/courseOverview.js` — REMOVE (mode-picker per course no
   longer exists)
6. `css/components/home.css` — REWRITE for ohjaamo + cleaner mode cards
7. `css/components/library-shelf.css` — NEW: shared row style for
   kurssi + lesson lists
8. `js/main.js` — hash patterns:
   - `#/aloitus` → home
   - `#/oppimispolku?lang=X` → oppimispolku index (8 courses)
   - `#/oppimispolku/{lang}/{kurssi}` → course detail (10 lessons)
   - `#/oppitunti/{lang}/{kurssi}/{n}` → lesson runner
   - `#/kirjoitus?lang=X` → existing writing flow
   - `#/luetun?lang=X` → existing reading flow
   - `#/koeharjoitus?lang=X` → existing exam flow
   - Backwards-compat redirects for legacy hashes

## PR sequence

- **PR A** — `auto/ohjaamo`: new HOME (drop course grid, add ohjaamo +
  4 mode cards). Reuse existing dashboard.js data fetch
  (`/api/dashboard/v2`) for streak/sessions/level. Free-tier blur on
  level + YO-valmius cells.
- **PR B** — `auto/oppimispolku-shelf`: rewrite the path → oppimispolku
  index. Replace `#screen-path` content with library-shelf 8-course
  list. Course click → course-detail.
- **PR C** — `auto/course-detail-shelf`: course-detail screen with
  10-lesson library-shelf. Lesson click → existing lesson runner.
- **PR D** — `auto/cleanup-old-screens`: remove courseOverview.js +
  HOME's old course grid + dead path-grid 3-col scaffolding. Cleanup
  + bundle shrink.

Each PR ships independently (old code coexists during the transition).

## Acceptance per PR

PR A:
- `/app.html#/aloitus` renders the new HOME: tabs + greeting +
  ohjaamo + 4 mode cards.
- Free user: sees streak + sessions, level + YO-valmius blurred.
- Pro user: all 4 stats visible.
- Mode cards link to their respective hashes.
- `sw.js` bumped, bundle rebuilt, all vitest specs green.

PR B:
- `#/oppimispolku?lang=es` renders 8-course library-shelf.
- Locked courses: muted row + 🔒 marker.
- Click unlocked course → `#/oppimispolku/es/{kurssi}`.

PR C:
- `#/oppimispolku/es/kurssi_1` renders 10-lesson library-shelf.
- Click lesson → `#/oppitunti/es/kurssi_1/1` → existing lesson runner.

PR D:
- HOME's old 8-card grid removed. courseOverview.js deleted.
- `#/kurssi/{lang}/{key}` redirects to `#/oppimispolku/{lang}/{key}`.
