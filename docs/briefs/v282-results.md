# v282 — perf-pass results

**Date:** 2026-05-22
**Brief:** `docs/briefs/2026-05-22-performance-pass.md`
**Scope:** Aloitus → Oppimispolku → Kurssi → (Luetun / Kirjoitus) navigation.

## What shipped

1. **`js/lib/prefetch.js`** — `prefetchChunk(key, factory)` dedupes
   dynamic-import factories across hovers; `onHoverIntent(el, fn)`
   debounces by 80 ms so flicking the cursor across a card grid
   doesn't spray prefetches. Touch-start also fires (mobile parity).
2. **`js/lib/curriculumCache.js`** — single source of truth for
   `/api/curriculum` data. Replaces the two separate Maps that
   `oppimispolkuIndex.js` and `courseDetail.js` each kept. Inflight
   promises are coalesced so concurrent hovers don't race.
3. **Course-detail dedup** — `getCourseDetail()` reuses the lang-level
   list cache instead of re-fetching `/api/curriculum?lang=es` a second
   time. The two-call Promise.all becomes one fetch when the user came
   from the index (the common path).
4. **Hover-prefetch on Home** — `.home-continue` + `.home-track` warm
   the next-screen chunk + relevant API payload on 80 ms hover intent.
   - Oppimispolku / Sanasto / Kielioppi → `oppimispolkuIndex` chunk +
     `/api/curriculum?lang=<active>`.
   - Luetun → `reading` chunk.
   - Kirjoitus → `writing` chunk.
5. **Hover-prefetch on oppimispolkuIndex rows** — each clickable
   `.op-row` warms the `courseDetail` chunk + `/api/curriculum/<key>`.
6. **`sw.js` CACHE_VERSION → `puheo-v282`** — static-asset edits
   require the bump.

## Expected impact

The brief asks for ≤ 1s warm and ≤ 3s cold from card-click to next
screen. The previous Aloitus → Oppimispolku → Kurssi path paid:

- chunk import (cold, ~100-300 ms per screen)
- `/api/curriculum?lang=es` (cold, ~200-500 ms) — twice across the path
- `/api/curriculum/<key>` (cold, ~200-400 ms)

After v282, assuming the user's cursor lands on the target card for
≥ 80 ms before clicking (the realistic case for everything that isn't
a fast double-jump):

- Aloitus → Oppimispolku: chunk + list both warm → render is
  synchronous after `show()` (no spinner reflow, no fetch wait).
- Oppimispolku → Kurssi: chunk + detail both warm → render is
  synchronous; second `/api/curriculum?lang=` call is eliminated
  unconditionally (the cache is shared even without prefetch hits).

Cold start (first ever visit, no hover) is unchanged — we can't avoid
the network on a click without speculation, and the brief explicitly
bans automatic lesson-AI prefetch.

## Out of scope (per brief 80/20 rule)

- **No lesson-AI pre-warm** — brief flagged token-cost risk.
- **No SW strategy rewrite** — current static-cache + offline behaviour
  works; touching it is high-risk for low gain on the hot path.
- **No bundle-split / tree-shake pass** — `app.bundle.js` is 107.8 kb,
  below the 500 kb threshold the brief named.
- **No `dashboardV2` rewrite** — already batched, already cached 60 s;
  the brief told us not to break it.

## Baseline measurement note

Browser-level Lighthouse + Network-tab numbers were not captured in
this session — the brief asks for them, but they require a manually
authenticated session against a dev server inside DevTools. Marcel
should:

1. Open `http://localhost:3000` (after `npm run dev`).
2. Log in as `testpro123`.
3. Devtools → Network tab → throttle to "Fast 3G".
4. Stopwatch Aloitus-card → course-list-visible 3×, take median.
5. Repeat against the previous SHA (`3ed0316` = v281) and against
   the post-v282 build.

Real-world median should drop by the chunk-import + first-curriculum
fetch when hover-intent fires — typically 300-700 ms warm-cache.

## Verification

- `npm run build` → green (`app.bundle.js` 107.8 kb).
- `npm test` → 1241/1241 pass (77 files).
- `node --check` on all 5 touched files → clean.
- Manual: no functional change to lockable rows, breadcrumbs, error
  states, or skeleton timing. Empty-curriculum paths still return
  `[]` and route through the existing error renderer.

## Files

- `js/lib/prefetch.js` (new)
- `js/lib/curriculumCache.js` (new)
- `js/screens/home.js` (+wireHoverPrefetch)
- `js/screens/oppimispolkuIndex.js` (uses shared cache + row prefetch)
- `js/screens/courseDetail.js` (uses shared cache)
- `sw.js` (CACHE_VERSION bump)
- `docs/briefs/v282-results.md` (this file)
