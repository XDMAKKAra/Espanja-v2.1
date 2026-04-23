# POSTSHIP — Pass 1 Step 2 (design system build)

**Merged:** Gates A, B, C, C.5, D, E → `main`.
**Branches deleted.** Tests: 595/595 green at close of Gate E.

## What shipped

### Gate A — Tokens + foundations (4 commits)
- Full token set (colour / spacing / radius / shadow / breakpoints / motion / gradients) in `style.css` and `landing.css`, dark-mode values only per marcel's Step 1 review.
- `--text-muted` raised from `#9e7a7a` to `#b8988e` for AA body-text contrast (AUDIT §10 fix).
- Unified font namespaces — both files now use `--font-display` / `--font-body` / `--font-mono` / `--font-serif`. Legacy aliases (`--font`, `--mono`, `--serif`, `--accent`, `--accent2`, `--gold`, `--correct`, `--wrong`, `--radius`) kept as forwards to avoid breaking anything in Gate D.
- Inter variable font (Latin Extended) loaded on every HTML shell for Finnish ä/ö/å + Spanish ñ/á/í/ó/ú.
- Global `h1–h4` rules reference `--fs-*` tokens.
- Canonical `.btn` / `.input` / `.textarea` / `.card` components in `css/components/`, imported by both CSS bundles.
- `design-system/puheo/` boilerplate deleted (was unrelated auto-generated green-luxury theme — FINDINGS §1).

### Gate B — Feedback + loading (3 commits)
- `.skeleton` with five variants (vocab / grammar / writing / reading / matching). Writing variant closes AUDIT §7 gap.
- `.banner` (correct / close / wrong / info) + `.toast` with `toast.success/error/warn/info` imperative API. Success + info auto-dismiss 4 s; error + warn sticky. Safe-area-aware on mobile.
- Pass 0.5 `alert("Tallennus epäonnistui")` migrated to `toast.error` — closes the Step 1 shim.
- `.modal` shell + `openModal()` with focus trap, Escape, `[data-modal-dismiss]` click, body scroll lock, focus restoration.

### Gate C — Navigation + a11y (3 commits)
- `.top-nav` unifying landing + diagnose inline navs. Safe-area top/left/right, translucent + backdrop blur, `.top-nav__right` cluster with login + CTA, mobile collapses `.top-nav__links`.
- `.bottom-nav` mobile-only (≤767 px), 56 px + safe-area-inset-bottom, active state in `--brand-light`.
- `tests/touch-target.test.js` — walks every interactive CSS rule, flags any `min-height < 44 px`. Documented exemptions: `.btn--sm` (44 px hit via `::before`) and `.toast__close` (secondary dismiss in an already-self-dismissing toast). Legacy `.btn-sm` at `style.css:1169` fixed to meet 44 px.

### Gate C.5 — Side-panel pilot (1 commit)
- `.split` / `.split__main` / `.split__aside` in `css/components/side-panel.css`.
- Dormant by default; activates when `body[data-ff-side-panel="1"]` is set.
- `js/features/flags.js` applies the flag from `localStorage.ff_side_panel`.
- Enable with `localStorage.setItem("ff_side_panel", "1")` in DevTools + reload. No screens wire the aside yet — it's infrastructure awaiting Pass-later adoption.

### Gate D — Per-screen desktop-width fixes (6 commits)
Six screens widened from 600–800 px to `var(--w-desktop)` (1080 px). Closes the single largest user-reported bug from Pass 0.5 ("looks like it's made only for phone use"). Mobile overrides (`@media (max-width: 768px) { max-width: 100% }`) untouched.

| Screen | Before | After |
|---|---|---|
| Dashboard | 800 px | 1080 px |
| Learning path | 640 px | 1080 px |
| Vocab / grammar / adaptive | 680 px | 1080 px |
| Writing | 600 px | 1080 px |
| Reading | 640 px | 1080 px |
| Exam | 640 px | 1080 px |

`tests/desktop-widths.test.js` enforces each selector uses the token.

### Gate E — Landing + marketing (3 commits)
- `landing.css`: `.faq-list` widened from 640 → 800 px. Urgency-bar originally tokenised to `--grad-urgency`; that token was later deleted in the mint+navy rebrand. Summer-package variants unified onto `--grad-hero` / `--accent`.
- `.footer-link` utility added to `landing.css`. Replaces 12 inline `style="color:var(--text-muted)"` across pricing / privacy / terms / refund. Closes bulk of AUDIT §6 for those pages.
- `blog/*.html` (6 files): body `font-family: 'Lora', …` → `var(--font-serif)`; pages now load Lora themselves via `<link>` with `subset=latin-ext`. `index.html`: removed the inlined Lora `@font-face` declarations (4) that were being downloaded on every landing-page visit. Saves ~40 kb on the hottest page — closes FINDINGS §10.

## Flagged — shipped but not enabled

- **Side-panel pattern** (Gate C.5): infrastructure merged, no screen wires its feedback/rubric into `.split__aside` yet. Pilot it with `localStorage.ff_side_panel = "1"` before any screen opts in.
- **Canonical `.btn` / `.card` / `.input` classes**: defined in `css/components/`. No HTML call-site has migrated from `.btn-primary` / `.nav-cta` / `.price-card` / `.auth-input` to the new names. That migration is a follow-up pass (see "Deferred" below).

## Deferred to later passes

| Item | Why | Where it goes |
|---|---|---|
| **Two-column grids** on dashboard (SCREENS §3) and exam (SCREENS §6). | Requires HTML restructuring + visual review; single-column at 1080 px already satisfies the ≥960 acceptance. | A future "density pass" or Pass 2 content work, whichever wants the extra columns. |
| **Side panels on vocab + writing** (SCREENS §4–5). | Pattern shipped behind flag (Gate C.5); no screen wires it. | Follow-up after marcel pilots the flag in DevTools. |
| **Light mode + toggle** (original Commit 20). | Dropped at Step 1 review — dark-only this pass. Tokens are already semantic, so a future pass is a single `html[data-theme="light"]` block + settings toggle. | Logged in FINDINGS §13. |
| **Visual regression harness** (Playwright). | Browsers aren't pre-installed in this dev env; CI integration deferred. | `plans/06-testing-step1.md` has a TODO line. |
| **Legacy-class HTML migration** (`.btn-primary` → `.btn .btn--primary`, etc.). | Sweeping HTML rewrite would have blown the Gate diff budget and forced visual diff captures on every screen at once. | Follow-up pass once a visual harness exists to catch regressions. Legacy CSS rules + their aliases stay in `style.css` / `landing.css`. |
| **Full inline-`<style>` extraction** on pricing / privacy / terms / refund / diagnose into `pages.css`. | Each page's inline block is already token-clean; surface area vs. duplication tradeoff favoured leaving them. | Future cleanup. |
| **Two remaining `!important` clusters** in `style.css:1970–2120` (exam + mode-select, FINDINGS §9). | Flattening the selectors requires rewriting the exam screen — out of scope for tokens-only Gate D. | Future pass when the exam screen gets structural changes. |

## Quality bar check

- **Accessibility.** Focus rings on every interactive component via `--brand-light`. Touch targets enforced by `tests/touch-target.test.js`. `--text-muted` raised for AA body contrast. Confetti + toast animations respect `prefers-reduced-motion`.
- **Performance.** Removed ~40 kb of Lora from `index.html`. Inter added to every shell (~60 kb via Google Fonts CSS) — net close to neutral, with Lighthouse expected up 1–2 points on the landing. Full Lighthouse pass deferred to the Pass 6 visual + perf gate.
- **Finnish text.** Token scale `--fs-h1..h4` + Inter Latin-ext subset handle "Ylioppilastutkintolautakunta" and "Kartoituksen tallennus epäonnistui" without overflow at the tested viewports.
- **Dark mode.** Only mode shipped. Tokens are semantic — light mode is a value-swap away.
- **No `!important` in new code.** Every new `css/components/*.css` file is clean. Legacy `!important` clusters in `style.css` are unchanged but documented (FINDINGS §9).
