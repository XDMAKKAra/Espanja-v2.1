# Deep runtime audit — deferred

**Status:** the `tests/e2e-runtime-audit-v283-deep.spec.js` spec was
deleted in v283 because the reading-flow leg hit Playwright's 15-min
test timeout. This note captures what it was supposed to cover and
the bar that has to be cleared before it gets restored.

## What the deep spec tried to do

Logged in as a Pro test account, then for each language tab (es / fr / de)
walked the *full* user surface:

1. Aloitus → Oppimispolku → course detail → lesson runner (teoria + 2-3
   exercise sivua + kertaus) → results
2. Mode-page entry (Sanasto / Kielioppi / Luetun / Kirjoitus) →
   exercise → grade → next
3. Koeharjoitus open → resume modal → enter exam → answer one item per
   part → submit → results
4. Profile + Asetukset open + close
5. Per stop: capture console errors, network errors, layout-shift
   checkpoints, full-page screenshots into `audit-screens/runtime-audit-deep/`

The shallow `e2e-runtime-audit-v283.spec.js` covers the same touch points
but takes one screenshot per surface instead of walking exercises, so it
finishes in ~50 s.

## Why it timed out

The reading-flow leg waits on `/api/reading-task` (OpenAI generation) and
then `/api/grade-reading`. Cold OpenAI calls run 8-30 s each; the spec hit
multiple of those plus retries on slow responses, and the 15-min budget
ran out before the third language tab.

Root issue: live OpenAI in an e2e spec is non-deterministic. The shallow
spec sidesteps this by never triggering a reading-task generation; the
deep spec can't because the goal is to walk the real flow.

## Bar for restoring it

Before this spec comes back to `main`:

1. **Stub or pre-warm OpenAI for the audit account.** Either:
   - Add a deterministic test fixture mode that serves a cached
     reading-task + grade response when `req.user.email` is the audit
     test account, OR
   - Run the audit against a pre-warmed cache (run shallow spec once,
     prime the server cache, then run deep against the warm cache).
2. **Cut the language matrix in half.** Audit one language per CI run,
   rotate weekly via a `LANG` env var, so each spec run stays under 5 min.
3. **Move long captures to background screenshots.** Don't `await page.screenshot()` in the hot loop — use Page.screenshot fire-and-forget into an out-dir so the timeline keeps moving.

Until 1+2 land, keep the spec out of the repo. The shallow runtime-audit
spec is the smoke surface; gaps it can't see (lesson-runner regressions,
exercise grading bugs) get caught by `tests/bug-scan` + manual screenshots
captured by the user.

Filed against: v283 audit P1 "deep audit timeout reading-flow".
