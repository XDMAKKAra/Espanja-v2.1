# AUDIT — current Puheo visual layer

**Date:** 2026-04-19 · **Branch:** `design-system/step1-spec` · **Scope:** app + marketing site before token rewrite.

This is the "before" record. Every violation is cited by file:line so Step 2 can verify fixes. Screenshots are not included — I'm a CLI agent, not a browser; the file/line citations below are the authoritative audit artefact. Step 2 should capture visual screenshots at 390×844 and 1440×900 as part of its per-screen commits.

## 1. Ad-hoc colour literals (21 violations)

Tokens live in `style.css:1–46` (`--brand`, `--brand-light`, `--correct`, `--wrong`, `--accent`, `--bg`, `--surface`, etc.) and `landing.css:1–18`. Violations below bypass them:

| Where | Literal | Fix token |
|---|---|---|
| `style.css:26` `.skip-link` | `#fff` | `--text` |
| `style.css:134, 1632, 1642` Pro-badge gradient | `linear-gradient(135deg, #f59e0b, #e63946)` | extract to `--grad-pro` |
| `style.css:248, 322, 352, 892` nav / mode / exam-option | `#fff` | `--text` |
| `style.css:1003–1010` SR answer grades | `#ef4444`, `#f59e0b`, `#22c55e`, `#3b82f6` | new `--sr-again/hard/good/easy` |
| `style.css:1040` `.btn-report:hover` | `#e74c3c` | `--brand` |
| `style.css:1253` `.bar-warn` | `#f59e0b` | `--warn` |
| `style.css:1419–1436` grade + rating scale | `#9e7070`, `#7c9abc`, `#5ba882`, `#e8d5b7`, `#c9b8ff` | new `--grade-a/b/c/e/l` |
| `style.css:1775` `.exam-timer-countdown` | `#0c0808` | `--bg` |
| `style.css:1988` `.dash-stat-streak-active` | `#f97316` | `--accent` |
| `style.css:2250–2256` `.ex-type-badge` | `#7dd3fc`, `#c084fc`, `#67e8f9` | new `--ex-context/transform/pick` |
| `landing.css:83` `.urgency-bar` gradient | `#a01818`, `#c62020` | derive from `--brand-btn` |
| `landing.css:565, 607, 620` `.price-badge.summer-badge` | `#e67e22` | `--gold` |

## 2. Heading scale inconsistency

No explicit `h1–h4` root rules. Everything is component-local `clamp()`. Result: headings drift across screens.

| Where | Effective size |
|---|---|
| `style.css:1513` `.reading-question` h2 | `clamp(1rem, 3vw, 1.3rem)` |
| `landing.css:191` `.hero h1` | `clamp(2.2rem, 6vw, 4.5rem)` |
| `index.html:777` hero h1 (inherits above) | via `.hero h1` |
| `pricing.html:19` page-content h1 | `clamp(2rem, 5vw, 3rem)` |
| `diagnose.html:125` `.intro h1` | `clamp(1.8rem, 5vw, 3rem)` |
| `privacy.html:19`, `terms.html:19`, `refund.html:19` page h1 | `clamp(2rem, 5vw, 3rem)` (duplicated) |
| `app.html:97` `#auth-title` (no explicit rule) | browser default 2em |

Impact: dashboard, exam, onboarding, writing all use ad-hoc component sizing. Every team member adding a screen invents their own scale.

## 3. Narrow desktop containers (user-reported bug)

Top-level caps across the app. On 1920×1080 the user sees ~640px of content and ~1280px of empty margins.

| File:line | Selector | max-width | Applies to |
|---|---|---|---|
| `style.css:391` | `.game-content` | 480px | exercise wrappers |
| `style.css:642` | `.word-card` | 420px | vocab cards |
| `style.css:1053, 1104` | `.level-inner` | 360px | level intros |
| `style.css:1339` | `.sr-container` | 480px | SR sessions |
| `style.css:1543` | `.reading-container` | 640px | reading exercises |
| `style.css:2052` | `.exam-container` | 640px | exam screen |
| `style.css:2344` | `.ex-intro-inner` | 480px | adaptive intros |
| `landing.css:725` | `.faq-list` | 640px | landing FAQ |
| `landing.css:639` | `.hero-cta` | 420px | landing CTA width |

Everything ≤640px on screens ≥1024px is the bug. DESIGN.md §Breakpoints fixes this.

## 4. `!important` usage (8 instances)

| File:line | Selector | Reason |
|---|---|---|
| `style.css:1178`, `landing.css:22` | `.hidden` | utility — acceptable |
| `style.css:1970` | `.mobile-nav.active` border | specificity hack |
| `style.css:2067` | `.exam-timer-warn` colour | animation override |
| `style.css:2084, 2108` | `.selected-answer` (3×) | selector war in exam/mode |
| `style.css:2118, 2120` | `.mode-btn-exam`, `.mode-locked:hover` | hover override |

6 of 8 are symptoms of selector specificity wars. Step 2 flattens selectors.

## 5. Touch targets

Spot checks against 44×44 minimum (WCAG AAA):

| File:line | Selector | Measured | Status |
|---|---|---|---|
| `style.css:197` | `.mobile-nav-btn` | 48×48 | ✓ |
| `style.css:239` | `.mode-btn` | 44+padding | ✓ |
| `style.css:833, 874, 886, 976` | modal buttons, SR options | 48+ | ✓ |
| `style.css:1027` | `.btn-sm` | ~24px | ✗ fails |
| `landing.css:176` | `.nav-links a` | unspecified | ✗ likely <44 |
| `landing.css:~1036` (footer) | footer links | unspecified | ✗ likely <44 |

## 6. Inline styles (49 instances)

Concentrated in `app.html` (28) — flex utilities, emoji-icon blocks, margin tweaks. Top offenders `app.html:808, 1165, 1346, 1430, 1447, 1521, 1605` all repeat the pattern `style="display:flex;gap:X;align-items:center;flex-wrap:wrap"`. Extract utility classes; replace.

Footer links on `pricing.html:222`, `privacy.html:118`, `terms.html:106`, `refund.html:107`, `diagnose.html:~1190`, `blog/*` all use `style="color:var(--text-muted)"`. One `.footer-link` class replaces all.

## 7. Skeleton / loading

`.skeleton-exercise` + `.skeleton-bar` + `.skeleton-option` defined at `style.css:4276–4304`. Uniform pulse animation, consistent across vocab/grammar/reading. **Missing:** writing skeleton (writing screen falls back to spinner), matching/gap-fill/sentence-construction variants (not yet built — must be added as the new exercise types from exercises/Gate A are rendered).

## 8. Font family

Declarations all token-routed, but tokens are named **inconsistently** between files:

- `style.css` exposes `--font-display`, `--font-mono` at `style.css:8–9`
- `landing.css` exposes `--font`, `--mono`, `--serif` at `landing.css:15–17`

Same physical fonts (Syne, DM Mono, Lora) — two naming schemes. Step 2 unifies.

## 9. Dark-mode coverage

App is dark-mode-only today. No light-mode palette exists. Settings screen has no theme toggle (`app.html`, `js/screens/settings.js` — no theme code). DESIGN.md specifies both light + dark token pairs; Step 2 ships the toggle.

## 10. Accessibility quick-check

- Focus ring: `landing.css:72–75` defines `:focus-visible` with brand-light outline; **`style.css` has none** — keyboard users on the app screens get no focus indicator.
- Contrast: `--brand` on `--bg` passes AA (`landing.css:7` comment already notes `--brand-btn` tuned for 5.80:1). `--text-muted` on `--surface2` measures ~3.4:1 — fails AA for body text. Used on pricing sub, onboarding hints, footer.
- Reduced motion: only `landing.css:65–67` respects `prefers-reduced-motion`. App's confetti and pulse animations don't.

---

## Summary — top 5 for Step 2

1. **Tokenise the 21 ad-hoc colours.** SR grades, grade scale, exercise-type badges, Pro gradient. Cleanest lever per hour of work.
2. **Add root `h1–h4` typography scale.** Every page currently invents its own. Five tokens, global rule, stop reinventing per-screen.
3. **Desktop container widths.** User-reported bug. Multi-tier responsive caps: 960 / 1080 / 1280 by breakpoint. Every container >1024px must hit ≥960.
4. **Extract utility classes for the 49 inline styles.** Mostly flex + spacing. `.flex-center-wrap`, `.gap-{sm,md,lg}`, `.footer-link` cover 80%.
5. **Focus ring + contrast in `style.css`.** Keyboard a11y and body-text contrast are legally shaky. Adding `:focus-visible` and swapping muted text on dark surfaces is ~20 lines.
