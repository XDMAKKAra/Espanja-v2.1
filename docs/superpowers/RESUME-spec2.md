# Resume prompt — Spec 2 (mode-pages + drill + results)

Paste the block below into a fresh Claude Code session in this repo to resume.

---

```
Resume Spec 2 of the editorial redesign.

Spec is approved and committed at commit 60063f4:
docs/superpowers/specs/2026-04-26-mode-pages-drill-results-design.md

Now invoke the superpowers:writing-plans skill to write the implementation
plan from that spec, save it to docs/superpowers/plans/, commit, then
execute it via superpowers:subagent-driven-development (one fresh subagent
per task, two-stage review per task).

Operating conventions, locked from the prior session — don't ask, just apply:

- Stay on the main branch. The user explicitly authorized direct commits to
  main (option C) for this redesign work.
- Auto mode is on. Minimize interruptions. Prefer action over planning.
- Project memory rules:
  • Bump sw.js CACHE_VERSION on every commit that touches a STATIC_ASSETS
    file. Latest published value is "puheo-v44" (set in commit e5a504e).
  • Run `node --check js/screens/<file>.js` before committing changes to
    any screen module. vitest doesn't import them, so parse errors slip
    to prod and break click handlers.
- Spec 1 implementation pattern (which worked well — replicate the cadence):
  • 12 tasks + ~5 follow-up fix commits, dispatched as a chain of fresh
    subagents (haiku for mechanical, sonnet for integration, code-reviewer
    for quality reviews).
  • After every implementer report, dispatch a spec compliance reviewer.
    Then a code quality reviewer. Address any issues with another
    implementer dispatch before marking the task done.
  • Pause for user verification only at meaningful visual checkpoints,
    not after every task.

Spec 2 file structure summary (copy from spec §6 if needed):

  CSS: 3 new files (mode-page.css, exercise.css, results.css) +
       small additions to button.css (.btn--cta--mini, .btn--ghost)
  JS:  1 new file (js/screens/mode-page.js for briefing logic);
       edits to vocab.js / grammar.js / reading.js / verbsprint.js /
       writing.js for new option-row + topic-row markup; small edit
       to js/ui/nav.js to extend the rail-off screen set
  Tests: 2 new vitest files (mode-page.test.js, results.test.js)
  Docs: append §12 to design-system/DESIGN.md
  Markup: rewrite 5 mode-pages + 3 drill screens + 1 results screen
          in app.html
  app.js, routes/, middleware/, lib/, supabase.js, server.js are untouched.

Begin by invoking superpowers:writing-plans with argument
"spec: docs/superpowers/specs/2026-04-26-mode-pages-drill-results-design.md".
```

---

## Useful context for tomorrow's session

- Last commit on main: `60063f4` (Spec 2 design doc)
- Spec 1 implementation lived from `9659b47` (plan commit) to `e5a504e` (auth-mode fix). 17 commits total. That's the working pattern.
- Latest SW cache: `puheo-v44`. Next bump is v45.
- Tests baseline: 1044 passing across 67 test files.
- The user's complaint that triggered Spec 2: exercise screens feel empty (especially during loading). Spec 2 directly addresses that with the briefing card + always-populated eyebrow row in the drill view.
- During the brainstorm the user picked: B (mode-pages first) + A (vocab drill loop) → combined into Spec 2 scope. Briefing card style: B (briefing block before topic picker). Topic picker style: A (mono numerals).

## Known deferred items (do NOT pull into Spec 2 unless user asks)

- Spec 1 §2.2 type-scale re-tier of `--fs-h1/h2/h3/body/body-sm` — deferred because re-tiering touches every exercise screen. Spec 2 *touches* exercise screens but its job is editorial markup, not token scale rewrites. Keep deferred.
- Spec 1 dead JS: `app.js` references to `dash-pro-badge` and `dashboard.js` reads of `dash-week-val`. Null-guarded no-ops. Cleanup pass, not Spec 2.
- `.btn--cta__meta` contrast (--ink-faint on --ink) — flagged minor concern, formal verification not done. Not Spec 2's job.
