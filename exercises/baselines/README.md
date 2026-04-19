# Audit baselines

Baseline numbers for Lighthouse (performance / a11y / best-practices) and pa11y (WCAG2AA) captured before Gate A of the new-exercise-types build. Every PR in this build (Gates A–E) should re-capture these and attach a delta table to the PR description.

---

## How to capture

Requires a running dev server on `localhost:3000`:

```sh
npm start                                 # in a separate terminal
npm run audit:lighthouse                  # writes exercises/baselines/lighthouse-app.json
npm run audit:lighthouse:landing          # writes exercises/baselines/lighthouse-landing.json
npm run audit:a11y                        # writes exercises/baselines/pa11y.json
```

Then regenerate the summary:

```sh
node -e "require('fs').writeFileSync('exercises/baselines/scores.json', JSON.stringify({captured_at:new Date().toISOString().slice(0,10),git_commit:require('child_process').execSync('git rev-parse --short HEAD').toString().trim(),lighthouse:{landing:(l=>({url:l.finalDisplayedUrl,performance:l.categories.performance.score,accessibility:l.categories.accessibility.score,best_practices:l.categories['best-practices'].score}))(require('./exercises/baselines/lighthouse-landing.json')),app:(l=>({url:l.finalDisplayedUrl,performance:l.categories.performance.score,accessibility:l.categories.accessibility.score,best_practices:l.categories['best-practices'].score}))(require('./exercises/baselines/lighthouse-app.json'))},pa11y:(p=>({total_urls:p.total,passes:p.passes,errors:p.errors,errors_by_url:Object.fromEntries(Object.entries(p.results).map(([u,v])=>[u,v.length]))}))(require('./exercises/baselines/pa11y.json'))},null,2))"
```

---

## Files

| File | What it is | Size |
|---|---|---|
| `scores.json` | Human-readable summary of the raw JSONs below. Read this first. | ~1 KB |
| `lighthouse-landing.json` | Full Lighthouse report for `/` (landing page). | ~540 KB |
| `lighthouse-app.json` | Full Lighthouse report for `/app.html` (SPA entry). | ~430 KB |
| `pa11y.json` | Full pa11y-ci output for the three URLs listed in `pa11y-ci.config.json`. | ~10 KB |
| `pa11y-ci.config.json` | URL list + defaults for `npm run audit:a11y`. | <1 KB |

---

## When to re-capture

Re-capture **before** you open a PR that touches any of:

- `app.html`, `index.html`, `diagnose.html` (markup changes).
- `style.css` (layout, color, contrast, font, sizing).
- `js/screens/*.js`, `js/ui/*.js`, `js/renderers/*.js` (render-path changes).
- Any new exercise type added under `js/renderers/`.
- Any change that could plausibly affect page-load JS payload or layout shift.

Attach a short delta table in the PR description:

```
Lighthouse (app.html)     baseline → PR
  performance             0.90     → 0.88   (-0.02)
  accessibility           1.00     → 1.00   (=)
  best_practices          0.96     → 0.96   (=)

pa11y (total errors)      21       → 21     (=)
```

**Regression policy:**
- Any new-screen a11y error blocks merge. Pre-existing errors stay documented here, not regressed.
- Lighthouse performance drop > 0.05 on any audited page blocks merge unless justified in the PR description.
- Accessibility or best-practices drop of any size blocks merge.

---

## Pre-existing issues (not this build's job)

As of capture date, pa11y flags **21 errors** across the three URLs. These are legacy and not blocked by the new-exercise-types work:

- Missing `<title>` on landing + unlabelled email input (`#waitlist-email`).
- Empty heading `#placement-question` before content loads (hydrates later).
- 5 unlabelled `<select>` elements on `/app.html` (topic selects).
- 3 unlabelled text inputs / textareas on `/app.html` (gap-fill, translate, reading, exam-writing).
- 2 low-contrast elements on `/diagnose.html`.

Each of these should be closed by the team that owns the surface, not by this build. New-exercise-type renderers produced by Gates B–E **must not add** to this count.

---

## Why no CI

This repo has no `.github/workflows/`. Audits are manual until a dedicated CI pass lands — see `exercises/FINDINGS.md` F16. Vercel's deploy-time checks are not a substitute.
