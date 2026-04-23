# DESIGN — Puheo design system spec

**Audience:** Step 2 implementer. This file is authoritative. If implementation differs, update this file first.

## Aesthetic anchor

**"Quiet modern study tool."** A calm mint-and-navy surface with Inter typography — the visual register of a focused reference app, not a consumer marketing page. Navy ink carries the content; a single mint accent marks the one action or state that matters on each screen. Shadows appear only when something is being interacted with; gradients appear only inside the hero H1. Hierarchy comes from weight, colour, and whitespace — not borders, fills, or glow.

Reference quality bar: Linear (motion restraint), Arc (layout), Notion (content-first density), Anki (no visual reward loop) — none of them copied.

Style peg (from `ui-ux-pro-max`): **refined minimal** with **editorial** headline scale and a **brutalist mono** data register for countdown / timer / score numerals.

---

## 1. Colour tokens

Single light theme. Navy ink on cool mint neutrals; mint accent for
one-per-screen action. Token source of truth: `style.css:19–136`.

### Base + surfaces

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F0FDF9` | Page background |
| `--surface` | `#FFFFFF` | Cards, panels, inputs |
| `--surface-2` | `#ECFDF5` | Nested surfaces, sidebar, countdown block |
| `--border` | `#D1FAE5` | Hairlines |
| `--border-strong` | `#A7F3D0` | Hover / emphasised hairlines |

### Ink (text)

| Token | Value | Use |
|---|---|---|
| `--ink` | `#111827` | Body, headings |
| `--ink-soft` | `#374151` | Secondary text, captions |
| `--ink-faint` | `#6B7280` | Tertiary, placeholders, countdown labels |

Legacy aliases `--text` / `--text-muted` / `--text-faint` map onto the ink tokens and stay available for existing component rules.

### Accent (mint)

| Token | Value | Use |
|---|---|---|
| `--accent` | `#2DD4BF` | Primary button fill, focus outlines, hero `.hero-accent` span |
| `--accent-hover` | `#14B8A6` | Primary button hover, one-off accent-as-text on light surfaces |
| `--accent-soft` | `#CCFBF1` | Sidebar-active background, quiet tint chips |

**Contrast lock:** `#2DD4BF` on `#FFFFFF` is 1.65:1 — mint **never** carries white text. `.btn--primary` always uses `color: var(--ink)`. Mint-as-text is only allowed on the navy `--ink` background.

### Feedback

| Token | Value | Use |
|---|---|---|
| `--success` | `#059669` | "oikein", positive diff |
| `--warn` | `#D97706` | "lähellä" |
| `--error` | `#DC2626` | "väärin", destructive, countdown `.is-urgent` |
| `--info` | `#2563EB` | Toasts, hints |

### SR grading (4-button Anki scale)

| Token | Value |
|---|---|
| `--sr-again` | `#DC2626` |
| `--sr-hard` | `#D97706` |
| `--sr-good` | `#059669` |
| `--sr-easy` | `#2563EB` |

### YO grade scale (I → L, fail → top)

| Token | Value |
|---|---|
| `--grade-i` | `#6B7280` |
| `--grade-a` | `#9CA3AF` |
| `--grade-b` | `#2563EB` |
| `--grade-c` | `#0D9488` |
| `--grade-m` | `#059669` |
| `--grade-e` | `#047857` |
| `--grade-l` | `#064E3B` |

### Exercise-type badges (cool family, each AA on white)

| Token | Value |
|---|---|
| `--ex-monivalinta` | `#0D9488` |
| `--ex-yhdistaminen` | `#2563EB` |
| `--ex-taydennys` | `#7C3AED` |
| `--ex-jarjestely` | `#0891B2` |
| `--ex-kaannos` | `#059669` |
| `--ex-luetun` | `#6366F1` |

Badges render as pill `--r-full`, 6×12 padding, Inter 600 12 px, background = colour @ 12% opacity, border = colour @ 25% opacity, text = full colour.

### Gradients

Only **one** gradient survives and it is masked into hero H1 text only:

| Token | Value |
|---|---|
| `--grad-hero` | `linear-gradient(130deg, var(--accent) 0%, var(--accent-hover) 100%)` |
| `--grad-pro` | aliases `--grad-hero` (kept for legacy callers) |

`--grad-urgency` and `--sh-glow` were deleted in the mint+navy rebrand. Do not reintroduce surface gradients, conic animated gradients, or halo box-shadows.

### Shadows (navy-based)

| Token | Value | Where it's allowed |
|---|---|---|
| `--sh-rest` | `0 1px 3px rgba(17, 24, 39, 0.08)` | Button `:active`, card `:hover` |
| `--sh-hover` | `0 4px 12px rgba(17, 24, 39, 0.10)` | Modals at rest |
| `--sh-lift` | `0 12px 32px rgba(17, 24, 39, 0.14)` | Popovers, toasts |

Default state on buttons, cards, inputs, and nav has **no** shadow.

---

## 2. Typography

**Fonts:** Inter (single family, weights 400/500/600/700/800, Latin + Latin Extended) + DM Mono (400/500) for data/countdown numerals. No serif anywhere. No italic on headlines.

Why Inter everywhere: a single typeface renders H1, H2, H3 and body consistently across marketing + app; Latin Extended covers Finnish ä/ö/å and Spanish ñ/á/é/í/ó/ú; Inter is variable-weight-ready but we keep discrete weights for stable preload.

**Load strategy:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap&subset=latin,latin-ext"
      rel="stylesheet">
```

**Tokens:**

```css
--font-display: 'Inter', system-ui, -apple-system, sans-serif;
--font-body:    'Inter', system-ui, -apple-system, sans-serif;
--font-mono:    'DM Mono', ui-monospace, monospace;
/* --font-serif removed in the mint+navy rebrand */
```

**Scale:**

| Role | Size | Line-height | Weight | Notes |
|---|---|---|---|---|
| H1 (hero) | `clamp(2.5rem, 5vw, 3.5rem)` | 1.05 | 800 | `-0.02em`, `color: var(--ink)`; `.hero-accent` span inside = 800 on `--accent` |
| H2 | `clamp(1.75rem, 3vw, 2.25rem)` | 1.15 | 700 | `-0.01em` |
| H3 | `1.25rem` | 1.3 | 700 | `var(--ink)` |
| Body | `1rem` | 1.55 | 400 | `var(--ink)`; secondary in `--ink-soft` |
| Caption | `0.875rem` | 1.4 | 500 | `var(--ink-faint)`, often uppercased w/ 0.04em tracking |
| Mono (numerals) | DM Mono `0.8125rem`+ | 1 | 500 | countdown, timer, scores — tabular-nums |

Global rules (`style.css` + `landing.css`):

```css
h1 { font: 800 var(--fs-h1)/1.05 var(--font-display); color: var(--ink); }
h2 { font: 700 var(--fs-h2)/1.15 var(--font-display); color: var(--ink); }
h3 { font: 700 var(--fs-h3)/1.3  var(--font-display); color: var(--ink); }
body { font: 400 var(--fs-body)/1.55 var(--font-body); color: var(--ink); }
```

**Finnish text test cases** — every component must fit the longest real string, not a placeholder:
- "Ylioppilastutkinto" (18 chars, no break point)
- "yhdistäminen" / "täydennys" (diacritics, must render)
- "Kartoituksen tallennus epäonnistui" (banner copy, 34 chars)
- "Aloita harjoittelu →" (CTA, with arrow)

---

## 3. Spacing scale (4px base)

```css
--s-0: 0;
--s-1: 4px;   --s-2: 8px;   --s-3: 12px;   --s-4: 16px;
--s-5: 24px;  --s-6: 32px;  --s-8: 48px;   --s-10: 64px;
```

Mapping rules:
- `--s-1..3`: icon-to-text gaps, chip padding.
- `--s-4`: default component padding.
- `--s-5..6`: section internal padding.
- `--s-8..10`: section-to-section on desktop.

---

## 4. Radius scale

```css
--r-sm: 6px;    /* chips, small inputs */
--r-md: 10px;   /* buttons, cards */
--r-lg: 16px;   /* modals, hero panels */
--r-full: 9999px; /* pills */
```

---

## 5. Shadow scale

```css
--sh-rest:   0 1px 2px rgba(0,0,0,0.3);
--sh-hover:  0 4px 12px rgba(0,0,0,0.35);
--sh-lift:   0 12px 32px rgba(0,0,0,0.5);
--sh-glow:   0 0 40px rgba(230, 57, 70, 0.35); /* brand glow for hero CTA */
```

Light-mode pairs use `rgba(0,0,0,0.08/0.12/0.18)` — softer falloff.

---

## 6. Breakpoints + layout

```css
--bp-tablet:  768px;
--bp-desktop: 1024px;
--bp-wide:    1440px;

/* Container widths per breakpoint */
--w-mobile:   100%;
--w-tablet:   720px;
--w-desktop:  min(1080px, 100vw - 64px);
--w-wide:     1280px;
```

**Acceptance (user-reported bug — Pass 0.5 deferral):**
- Mobile <768px: full-width, 16px side padding.
- Tablet 768–1023px: content ≤720px centred, sidebar collapses to bottom nav.
- Desktop ≥1024px: content ≥960px, up to 1080px. Two-column where possible (exercise + feedback panel).
- Wide ≥1440px: content capped at 1280px, centred.

Every page-wrapper gets a single `.container` class that applies these via `clamp()`. No more per-screen `max-width: 420px`.

---

## 7. Motion

```css
--dur-fast:   120ms;
--dur-base:   200ms;
--dur-slow:   320ms;
--ease-in:    cubic-bezier(.4, 0, 1, 1);
--ease-out:   cubic-bezier(0, 0, .2, 1);
--ease-inout: cubic-bezier(.4, 0, .2, 1);
```

All components declare `transition: <prop> var(--dur-base) var(--ease-out)` by default. Wrap **every** animation in `@media (prefers-reduced-motion: no-preference)`. Fixes AUDIT §10.

---

## 8. Components

For each: structure, sizes, states, measurements. States: rest / hover / focus / active / disabled.

### 8.1 Button

Variants: `primary` | `secondary` | `ghost` | `destructive`. Sizes: `sm` (32px) | `md` (44px) | `lg` (52px).

| Variant | Background | Text | Border |
|---|---|---|---|
| primary | `--brand-btn` | white | none |
| secondary | `--surface-2` | `--text` | 1px `--border` |
| ghost | transparent | `--text-muted` | none |
| destructive | transparent | `--error` | 1px `--error` |

- Radius: `--r-md`.
- Padding: `sm` 8×16, `md` 12×20, `lg` 16×28.
- Touch target: `md`/`lg` always ≥44px — even on `sm`, enforce `min-height: 44px` via invisible hit area.
- Focus: `outline: 2px solid var(--brand-light); outline-offset: 2px`.

### 8.2 Input / Textarea

- Background `--surface-2`, 1px `--border`, radius `--r-md`, padding 12×16.
- Focus: border becomes `--brand-light`, add `box-shadow: 0 0 0 3px rgba(245,158,11,0.15)`.
- Textarea: `min-height: 120px`, same treatment, `resize: vertical`.
- Error state: border + label become `--error`, help text `--error`.

### 8.3 Card

- Background `--surface`, border 1px `--border`, radius `--r-lg`, padding `--s-5`.
- Hover (interactive cards only): background `--surface-2`, shadow `--sh-hover`, transform `translateY(-2px)`.

### 8.4 Chip / tag

- Pill (`--r-full`), padding 4×12, font `--fs-caption` `--font-mono`.
- Variants: `neutral` (border only), `brand` (filled), per exercise-type badge colours from §1.

### 8.5 Skeleton (fixes AUDIT §7 gap)

Five variants, all using the same pulse animation:

| Variant | Structure |
|---|---|
| `skeleton-vocab` | 1 bar 60% (prompt) + 4 option bars |
| `skeleton-grammar` | 1 bar 40% (rule) + 1 bar 80% (sentence) + 4 option bars |
| `skeleton-writing` | 3 bars 100%/90%/70% + textarea block |
| `skeleton-reading` | Header bar + 6 paragraph bars + 3 question blocks |
| `skeleton-matching` | Two columns of 4 chips |

Keyframe (shared): `@keyframes pulse { 0%,100% { opacity: .6 } 50% { opacity: 1 } }` — 1.5s ease-in-out infinite.

### 8.6 Feedback banner

Three states: `correct` | `close` | `wrong`. Each:
- 12×16 padding, border-left 4px in the semantic colour, background `color-mix(in srgb, var(--success) 8%, var(--surface))`.
- Heading line (display font) + body explanation (body font) + optional CTA button.
- Icon slot on the left (24px SVG, matches colour).

### 8.7 Toast

Positioned bottom-right desktop / bottom-centre mobile. 320px max-width. Auto-dismiss 4s for success, sticky for error (close button required). Uses `--info` / `--success` / `--error` left border.

### 8.8 Modal

Backdrop: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(6px)`. Panel: `--surface`, `--r-lg`, `--sh-lift`, max-width 480px, padding `--s-6`. Close button top-right, 44×44. Focus trap required.

### 8.9 Top nav (marketing + app)

- Height 64px, fixed top, `rgba(12,8,8,0.75)` with `backdrop-filter: blur(14px)` (dark) / `rgba(255,255,255,0.85)` (light).
- Logo left · nav-links centre · (nav-login text) + (primary CTA) right.
- Mobile: `.nav-links` hides, primary CTA + login stay in a right-aligned flex.

### 8.10 Bottom nav (app mobile)

Only below 768px. 4 icon+label slots, 56px tall (plus safe-area bottom). Active slot: background `--surface-2`, icon colour `--brand-light`.

### 8.11 Sidebar (app desktop)

220px fixed left, `--surface-2` background. Only desktop (≥1024px). Collapses at 1024–1200px to 72px icon-only. Already correct at `style.css:146–151` — carry forward.

---

## 9. Accessibility defaults

- Focus ring everywhere: `:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 2px; }` — applied globally, overridable per-component.
- Minimum touch target: 44×44 on all interactive elements. Enforced by lint rule in Step 2 (see PLAN.md commit 10).
- Body text contrast: ≥4.5:1. `--text-muted` raised from `#9e7a7a` to `#b8988e` to hit 4.7:1 on `--surface`.
- `prefers-reduced-motion: reduce` disables confetti, pulse, slide animations.
- Every icon has `aria-hidden="true"` unless it's the only content of its button/link.
- Keyboard: `Tab` traverses every interactive element. Modals trap focus. Escape closes.

---

## 10. Dark mode only this pass (light mode deferred)

This pass ships dark-mode only. The tokens above are already named semantically (`--bg`, `--surface`, `--text`, `--text-muted`, etc.) rather than by value (no `--red-500`, no `--gray-900`), so a later pass adds light mode by swapping the values inside one `html[data-theme="light"]` block — no component rewrites needed.

The light column in every table above is the committed future pairing. Keep the column populated even though nothing reads it this pass — it's the spec for whichever pass lights up the toggle.

See `FINDINGS.md §13` for the deferral note.
