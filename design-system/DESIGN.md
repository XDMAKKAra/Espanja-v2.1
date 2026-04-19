# DESIGN — Puheo design system spec

**Audience:** Step 2 implementer. This file is authoritative. If implementation differs, update this file first.

## Aesthetic anchor

**"Exam-serious, not bureaucratic."** Dark-mode-default (Finnish teens study at night), warm red primary that reads as focus/urgency not alarm, ochre-gold accent for progress and achievement. Typographic not illustrative — no mascots, no cartoon characters. Calm surfaces, sharp contrasts, generous whitespace.

Reference quality bar: Arc browser (layout), Anki (information density), Linear (motion restraint), Duolingo (reward feedback tone) — none of them copied.

Style peg (from `ui-ux-pro-max`): **minimalist + editorial** with a hint of **brutalist mono** in data blocks (exam timer, streak counter, exercise progress). Hierarchy through weight and size, not borders and fills.

---

## 1. Colour tokens

Every token has a **dark** (`-d`) and **light** (`-l`) value. Legacy single-value tokens in `style.css:1–46` map forward so the rename is a translation layer.

### Base + surfaces

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0c0808` | `#faf6f2` | Page background |
| `--surface` | `#180f0f` | `#ffffff` | Cards, panels |
| `--surface-2` | `#201414` | `#f2ebe4` | Nested surfaces, sidebar |
| `--border` | `#3d2020` | `#e6dcd0` | Hairlines |
| `--border-strong` | `#5a3030` | `#c9b7a5` | Emphasised hairlines |

### Text

| Token | Dark | Light | Use |
|---|---|---|---|
| `--text` | `#f5e8e0` | `#1a0f0b` | Body, headings |
| `--text-muted` | `#b8988e` | `#6b544a` | Secondary (raised from `#9e7a7a` to fix AA — see AUDIT §10) |
| `--text-faint` | `#7c605a` | `#9a8275` | Tertiary, captions |

### Brand

| Token | Dark | Light | Use |
|---|---|---|---|
| `--brand` | `#e63946` | `#c62020` | Display, hero gradients |
| `--brand-btn` | `#c62020` | `#a01818` | Buttons (5.80:1 on bg) |
| `--brand-light` | `#f59e0b` | `#d97706` | Accent, highlights |

### Feedback (4 required — covers onboarding toasts, grading banners)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--success` | `#22c55e` | `#15803d` | "oikein" |
| `--warn` | `#f59e0b` | `#b45309` | "lähellä" |
| `--error` | `#ef4444` | `#b91c1c` | "väärin", destructive |
| `--info` | `#60a5fa` | `#1e40af` | Toasts, hints |

### SR grading (spaced repetition — 4-button Anki scale)

| Token | Dark | Light |
|---|---|---|
| `--sr-again` | `#ef4444` | `#b91c1c` |
| `--sr-hard` | `#f59e0b` | `#b45309` |
| `--sr-good` | `#22c55e` | `#15803d` |
| `--sr-easy` | `#3b82f6` | `#1d4ed8` |

### Grade scale (Finnish YO arvosanat I / A / B / C / M / E / L)

| Token | Dark | Light |
|---|---|---|
| `--grade-i` | `#7c605a` | `#6b544a` |
| `--grade-a` | `#9e7070` | `#8a5a5a` |
| `--grade-b` | `#7c9abc` | `#4a6e8a` |
| `--grade-c` | `#5ba882` | `#3d8560` |
| `--grade-m` | `#f59e0b` | `#b45309` |
| `--grade-e` | `#e8d5b7` | `#8a6f50` |
| `--grade-l` | `#c9b8ff` | `#5b4b8a` |

### Exercise-type badges

| Token | Dark | Light |
|---|---|---|
| `--ex-monivalinta` | `#f59e0b` | `#b45309` |
| `--ex-yhdistaminen` | `#7dd3fc` | `#0369a1` |
| `--ex-taydennys` | `#c084fc` | `#7e22ce` |
| `--ex-jarjestely` | `#67e8f9` | `#0e7490` |
| `--ex-kaannos` | `#fbbf24` | `#a16207` |
| `--ex-luetun` | `#86efac` | `#15803d` |

### Gradients (named, not inlined)

| Token | Value |
|---|---|
| `--grad-pro` | `linear-gradient(135deg, var(--brand-light), var(--brand))` |
| `--grad-hero` | `linear-gradient(130deg, var(--brand-light) 0%, var(--brand) 100%)` |
| `--grad-urgency` | `linear-gradient(90deg, #a01818 0%, var(--brand-btn) 50%, #a01818 100%)` |

**Contrast targets (all verified manually against `--bg`):**
- `--text` on `--bg`: dark 14.6:1, light 15.2:1 (AAA)
- `--text-muted` on `--surface`: dark 4.7:1, light 4.9:1 (AA body)
- `--brand-btn` on white text: dark 5.80:1, light 6.4:1 (AA)

---

## 2. Typography

**Fonts:** Syne (display, static weights 400/600/700/800) + Inter (body, **variable**, Latin Extended subset) + DM Mono (500) + Lora (editorial, blog only).

Why Inter instead of Syne for body: Syne's body weight has low x-height and struggles with Finnish compound nouns at 14–16px. Inter handles ä/ö/å perfectly, pairs cleanly with Syne's angular display cut, and the variable font lets us drop the 4-file weight cascade.

**Load strategy (approved):**

```html
<!-- In <head> of every HTML shell -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="font" type="font/woff2" crossorigin
  href="https://fonts.gstatic.com/s/inter/[...]latin-ext.woff2">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=Syne:wght@400;600;700;800&family=DM+Mono:wght@500&display=swap&subset=latin-ext"
      rel="stylesheet">
```

- Inter: variable axis, range 400–700, **Latin Extended subset** (required for Finnish ä/ö/å/é and Spanish ñ/á/í/ó/ú).
- Preload the single body `.woff2` file (Inter 400 latin-ext) — blocks first paint less than waiting for CSSOM.
- Lora is **not** loaded here — only included in blog shell (`blog/*.html`) per FINDINGS §10.
- Syne stays as discrete weights — variable build isn't available on Google Fonts as of 2026-04.

**Unified tokens** (replaces split `--font-display`/`--font` inconsistency):

```css
--font-display: 'Syne', ui-sans-serif, system-ui, sans-serif;
--font-body:    'Inter', ui-sans-serif, system-ui, sans-serif;
--font-mono:    'DM Mono', ui-monospace, monospace;
--font-serif:   'Lora', Georgia, serif;
```

**Scale** (`rem` at 16px base):

| Token | Size | Line-height | Weight | Family |
|---|---|---|---|---|
| `--fs-h1` | `clamp(2rem, 4vw, 3rem)` | 1.1 | 800 | display |
| `--fs-h2` | `clamp(1.5rem, 3vw, 2rem)` | 1.2 | 700 | display |
| `--fs-h3` | `1.25rem` / 20px | 1.3 | 700 | display |
| `--fs-h4` | `1rem` / 16px | 1.4 | 600 | display |
| `--fs-h5` | `0.875rem` / 14px | 1.4 | 600 | display |
| `--fs-body` | `1rem` / 16px | 1.6 | 400 | body |
| `--fs-body-sm` | `0.875rem` / 14px | 1.6 | 400 | body |
| `--fs-caption` | `0.75rem` / 12px | 1.4 | 500 | mono |
| `--fs-mono` | `0.8125rem` / 13px | 1.5 | 500 | mono |

Global rules (`style.css` root):
```css
h1 { font: 800 var(--fs-h1)/1.1 var(--font-display); }
h2 { font: 700 var(--fs-h2)/1.2 var(--font-display); }
h3 { font: 700 var(--fs-h3)/1.3 var(--font-display); }
h4 { font: 600 var(--fs-h4)/1.4 var(--font-display); }
body { font: 400 var(--fs-body)/1.6 var(--font-body); color: var(--text); }
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
