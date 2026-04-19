# Pass 1 — Visual design system · Step 2 (build)

Step 1 (`01-design-system-step1.md`) produced `design-system/AUDIT.md`, `DESIGN.md`, `SCREENS.md`, `PLAN.md`, `FINDINGS.md`. Read all of those first. This prompt does not restate tokens, component specs, or screen mocks — `DESIGN.md` and `SCREENS.md` are authoritative.

## Approved modifications from marcel

> _Fill before running. If empty, run PLAN.md verbatim._

- _(modification 1)_

## Commit sequence

Run commits from `design-system/PLAN.md` in order. Rules per commit:

1. Re-read the relevant DESIGN.md / SCREENS.md section first.
2. Smallest change that satisfies the acceptance criterion.
3. Test added or updated in the same commit.
4. Visual regression: capture before + after screenshots at 390×844 and 1440×900 for any screen touched.
5. Commit message: `design(system): <scope>`.

## Phase gates

**Gate A — Tokens + foundation components.** Tokens in CSS custom properties, button/input/card re-implemented against tokens. Existing screens must still work (the token names map to old values where needed). Screenshots prove no regression.

**Gate B — Feedback + loading.** Skeleton variants for every exercise type (vocab, writing, grammar, reading, matching, gap-fill, sentence-construction, translation, reading-comprehension). Feedback banner (correct/lähellä/väärin) against tokens. Toast + modal updated.

**Gate C — Navigation.** Bottom nav + top nav updated. Mobile safe-area handled. 44px minimum touch targets enforced — lint rule added.

**Gate D — Per-screen re-skins.** Each app screen re-skinned against tokens, one commit per screen. Dashboard → learning path → vocab → writing → grammar → reading → exam → full exam. Visual diff ≤ intended scope per screen.

**Gate E — Landing + blog inheritance.** `index.html`, `landing.css`, `pricing.html`, `privacy.html`, `refund.html`, all blog posts re-skinned. Marketing site now uses the same token set as the app. No more visual seam.

## Quality bar

- **Accessibility.** Color contrast ratio ≥4.5:1 for body text, ≥3:1 for large. Focus ring visible on every interactive element. `axe-core` run clean after each gate.
- **Performance.** Lighthouse mobile performance ≥85 after Gate E. No regression vs baseline.
- **Finnish text fits.** Test every component with the longest Finnish string from `js/ui/strings.js` — no overflow, no truncation unless spec'd.
- **Dark mode works.** Every token has a dark-mode pair. Toggle exists in settings and actually works.
- **No `!important`** in new code. Any legacy `!important` touched in a commit gets removed or justified.

## Branching

- Branch per gate off fresh `main`. Five PRs total (Gates A–E).
- Do not combine gates.
- If a gate's PR exceeds ~500 lines of diff, split it.

## Done

- All 5 gates merged.
- `axe-core` + Lighthouse green.
- Visual regression screenshot set committed under `design-system/screenshots/`.
- `design-system/POSTSHIP.md` one-pager: what shipped, what's flagged, what's deferred.
