---
name: Puheo Landing
description: Visual system for the brand-register marketing surfaces (landing, language pages, pricing). Captured at end-of-life, before the editorial-paper rebuild.
colors:
  bg-charcoal: "#0B0E0D"
  bg-elevated: "#131818"
  surface-translucent: "rgba(255, 255, 255, 0.04)"
  surface-hover: "rgba(255, 255, 255, 0.06)"
  border-hairline: "rgba(255, 255, 255, 0.08)"
  border-strong: "rgba(255, 255, 255, 0.14)"
  text: "#fafafa"
  text-muted: "#a1a1aa"
  text-subtle: "#71717a"
  accent-mint: "#2DD4BF"
  accent-mint-deep: "#14B8A6"
  accent-soft: "rgba(45, 212, 191, 0.12)"
  accent-glow: "rgba(45, 212, 191, 0.20)"
  ink-on-mint: "#052924"
typography:
  display:
    fontFamily: "Geist, Geist Fallback, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "72px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, Geist Fallback, Inter, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, Geist Fallback, Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, Geist Fallback, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
  label:
    fontFamily: "Geist, Geist Fallback, Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.10em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
spacing:
  "1": "8px"
  "2": "16px"
  "3": "24px"
  "4": "32px"
  "6": "48px"
  "8": "64px"
  "12": "96px"
  "16": "128px"
components:
  button-primary:
    backgroundColor: "{colors.accent-mint}"
    textColor: "{colors.ink-on-mint}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-mint-deep}"
    textColor: "{colors.ink-on-mint}"
  button-primary-lg:
    backgroundColor: "{colors.accent-mint}"
    textColor: "{colors.ink-on-mint}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "52px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-translucent}"
    textColor: "{colors.text}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  card-surface:
    backgroundColor: "{colors.surface-translucent}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-elevated:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-eyebrow-pill:
    backgroundColor: "{colors.surface-translucent}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
    height: "28px"
---

# Design System: Puheo Landing

## 1. Overview

**Creative North Star: "The Tinted-Mint Workshop"**

A restrained dark canvas with a single mint accent, designed to feel like a quiet, late-evening workstation. The original brief, recorded verbatim in `css/landing.css`, was *"Aesthetic: restrained Linear / Vercel"*: a tinted-neutral base biased ~3% toward the brand hue (`#0B0E0D` charcoal, not pure black), one accent (`#2DD4BF` mint) carrying every primary action, hairline white-on-dark borders, Geist throughout, motion limited to 150–320 ms ease-out. The intent was discipline; the visual result reads as the 2024–26 AI-SaaS dark-mode template (Linear, Vercel, Cursor, Supabase, Resend), which is precisely the first-order category reflex the project's PRODUCT.md now identifies as the primary anti-reference.

This file documents the system as it currently ships, end-of-life. It is the baseline being replaced by an editorial-paper rebuild, not the target. Re-run `/impeccable document` after the rebuild lands and this file will describe the new system.

The strategic principle PRODUCT.md sets above this — *"Earn the visual register from the audience, not the category"* — is the rule the current system violates by category-reflex inheritance. Every choice below is honest about the inheritance.

**Key Characteristics:**
- Single accent, mint (`#2DD4BF`), used as the only saturated color on the page.
- Tinted neutrals: charcoal (`#0B0E0D`) biased toward the accent hue at ~3% chroma, no pure `#000`.
- Hairline white-on-dark borders at 8% and 14% opacity, never a solid stroke.
- Type pairing: Geist 400/500/600/700 for everything, with Geist Mono reserved for numeric monospace.
- Radii: pill for actions, 8–24 px for surfaces, no sharp 0 px corners.
- Motion: 150 / 220 / 320 ms ease-out only. No bounce, no spring, no scroll-driven choreography beyond a single reveal stagger.
- One ornament: a radial-bloom background at the page top (`radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45, 212, 191, 0.10) 0%, transparent 55%)`) and a soft drop-shadow on the dashboard browser-frame.

## 2. Colors

A Restrained color strategy: one accent ≤10% of the surface, tinted neutrals everywhere else.

### Primary
- **Mint Signal** (`#2DD4BF`): the single saturated hue. Filled on the primary CTA button, on the eyebrow countdown dot, on the radial-bloom gradient, on every YTL rubric-score chip, on the FAQ chevron, and on the focus ring. Hover deepens to **Mint Deep** (`#14B8A6`). The system depends on this color being rare enough that landing on it reads as "this is the action."

### Neutral
- **Charcoal Base** (`#0B0E0D`): the page background. Charcoal, not black: tinted ~3% toward the mint hue so the surface and the accent feel like the same brand light.
- **Charcoal Elevated** (`#131818`): cards, the browser-frame chrome, raised surfaces.
- **Surface Translucent** (`rgba(255,255,255,0.04)`): hover and quiet-card affordance. Sits on charcoal as a 4% white wash.
- **Surface Hover** (`rgba(255,255,255,0.06)`): the same wash at 6% for pressed/hovered state.
- **Hairline Border** (`rgba(255,255,255,0.08)`): default 1 px border on every card, every divider, every nav under-line. Never a solid color.
- **Strong Border** (`rgba(255,255,255,0.14)`): ghost-button border, focus-adjacent edges.
- **Paper White** (`#fafafa`): primary text. Not `#fff`.
- **Muted Slate** (`#a1a1aa`): secondary text (sub-headlines, trust line, footer body).
- **Subtle Slate** (`#71717a`): eyebrow labels (uppercase + 10% tracking), micro-text.
- **Ink on Mint** (`#052924`): text color on the primary CTA. A deep mint-charcoal, not black, so the button never feels harsh.

### Named Rules

**The Mint-Once Rule.** Mint appears at most once per visible viewport in saturated form. The accent button is mint, *or* the eyebrow dot is mint, *or* the rubric score is mint, but never all three at full saturation in the same vertical screen. Repetition desaturates the signal.

**The No-Pure-Black, No-Pure-White Rule.** `#000` is prohibited; `#fff` is prohibited. Neutrals are tinted toward the mint hue at chroma 0.005–0.01 so the system reads as warm-tech, not stock-template dark.

**The Hairline Border Rule.** Borders are always white-on-dark at 8% or 14% opacity, never a solid color, never thicker than 1 px. A 2 px or saturated border on a card is a category-reflex failure.

## 3. Typography

**Display Font:** Geist (fallback: a locally-mapped "Geist Fallback" pointing at Inter or system-ui)
**Body Font:** Geist (same family, no separate body face)
**Label/Mono Font:** Geist Mono (for numeric monospace: countdown digits, scores, percentages)

**Character:** A single typographic voice. Geist's slightly geometric, generously-spaced sans carries everything from the 72 px hero display down to the 12 px eyebrow label. The pairing's restraint is the point: no display-serif moment, no editorial counterpoint, no second voice. This is the same choice every modern AI-tool landing makes; PRODUCT.md identifies it as the second-order reflex the rebuild needs to escape.

### Hierarchy
- **Display** (Geist 600, `72 px / clamp(...)`, `line-height: 1.05`, `letter-spacing: -0.04em`): hero `h1` and the largest section headlines.
- **Headline** (Geist 600, `48 px`, `line-height: 1.05`, `letter-spacing: -0.04em`): section `h2`. "Kolme aluetta. Sama YO-rubriikki.", "8 kurssia. Alusta YO-kokeeseen.", etc.
- **Title** (Geist 600, `24 px`, `line-height: 1.25`, `letter-spacing: -0.02em`): card titles (`.pillar__title`, `.course-card__title`, `.pricing-card__name`).
- **Body** (Geist 400, `16 px`, `line-height: 1.55`): all running text, sub-headlines under section heads, FAQ answers, pricing fineprint. Line length capped at ~65 ch via `max-width` on text-only blocks.
- **Label** (Geist 500, `12 px`, uppercase, `letter-spacing: 0.10em`): every eyebrow (`.pillars__eyebrow`, `.courses__eyebrow`, `.pricing__eyebrow`). The system's only uppercase voice.
- **Mono** (Geist Mono 400, `14 px`): countdown digits in the hero eyebrow pill, YTL score numerals where layout-stability matters. Tabular numerals via `font-feature-settings: "tnum" 1`.

### Named Rules

**The Single-Voice Rule.** One typeface, full stop. Geist Mono is the only allowed second face, and only for digits. A display serif is prohibited in this system — the editorial-paper rebuild will overturn this rule deliberately, but as long as this DESIGN.md describes the current system, the prohibition stands.

**The Tight-Tracking Rule.** Display and headline tracking is `-0.04em`; title is `-0.02em`; body is `0`; eyebrow labels are `+0.10em` (uppercase). Tracking changes carry as much hierarchy weight as size changes.

## 4. Elevation

The system is **flat by default, with two earned elevations**: the dashboard browser-frame in the hero, and the final CTA card. Everywhere else, depth is conveyed by surface tone (charcoal → charcoal-elevated) and hairline borders, not shadows.

### Shadow Vocabulary
- **Frame Shadow** (`box-shadow: 0 40px 80px -20px rgba(0,0,0,0.5)`): exclusively on the hero `.browser-frame`. Communicates "this is a product surface, hovering above the page."
- **Card Shadow** (`box-shadow: 0 24px 48px -24px rgba(0,0,0,0.4)`): currently defined as a token (`--shadow-card`) but used sparingly. Reserved for the grader card and the final CTA card.
- **Glow Shadow** (`box-shadow: 0 40px 80px -20px rgba(45,212,191,0.20)`): mint-tinted ambient glow on the primary-CTA card. The system's only colored shadow.

### Named Rules

**The Earned-Elevation Rule.** A surface gets a shadow only if it represents a real product artifact (the dashboard frame, the grader card, the final-CTA moment). Decorative drop-shadows on every card are prohibited. If a card needs to feel grouped, it gets a hairline border instead.

**The No-Glow-On-Glow Rule.** Mint glow appears at most once per page. The hero already carries a radial background bloom; a second mint glow on the final CTA card is the maximum. Multiple decorative mint glows is the category reflex.

## 5. Components

### Buttons
- **Shape:** Pill (`border-radius: 999px`).
- **Heights:** 44 px default, 52 px `--lg` modifier. 44 px is the WCAG touch-target minimum and the system's enforced floor.
- **Primary** (`.btn--primary`): mint background (`#2DD4BF`), ink-on-mint text (`#052924`), 600-weight, `padding: 0 18px`. Hover deepens to `#14B8A6` with text shift to `#042520`. No transform, no scale on hover.
- **Ghost** (`.btn--ghost`): transparent background, strong hairline border (`rgba(255,255,255,0.14)`), paper-white text. Hover fills with `surface-translucent`.
- **Quiet** (`.btn--quiet`): no background, no border, muted-slate text. Used for the nav "Kirjaudu" link only. Hover lifts to paper-white.
- **Focus:** `outline: 2px solid #2DD4BF` with `outline-offset: 3px`. Never removed.

### Eyebrow Pill (signature component)
- **Style:** Capsule-shaped `<p>` with `surface-translucent` background, hairline border, 12 px uppercase Geist 500 label + Geist Mono countdown digits.
- **Embedded:** mint dot (8 px circle, `--accent`) separating the brand label from the live countdown.
- **Role:** the only mint-saturated element in the hero. Lives directly above the h1.

### Cards
- **Pillar Cards** (`.pillar`): charcoal-elevated background, 16 px radius, hairline border, 24 px internal padding. Each carries an SVG icon, h3, body, metric line, and a "demo" mini-component showing real Spanish content.
- **Course Cards** (`.course-card`): same shape, smaller (`.course-card__num` `01–08` leading number, `.course-card__badge` YTL grade letter `A/B/C/M/E`). Uniform 8-up grid.
- **Pricing Cards** (`.pricing-card`): full-width on mobile, 3-up on desktop. The "Mestari" tier card (`.pricing-card--pro[data-popular="true"]`) carries a "Suosituin" chip and a mint border-tint to elevate it within the row.
- **Corner Style:** all cards 16 px (`--r-lg`).
- **Backgrounds:** `--surface-translucent` (4% white) at rest. No hover state on most cards — they are not interactive.
- **Borders:** hairline (`--border`, 8% white). Never thicker.
- **Internal Padding:** 24 px desktop, 20 px mobile.

### FAQ Items
- **Shape:** `<details>` blocks, no card, hairline divider between rows.
- **Question:** 18 px Geist 500, paper-white, with a mint chevron that rotates 90° when `[open]`.
- **Answer:** 16 px body in muted-slate, max line length 65 ch.

### Browser-Frame (hero signature component)
- **Style:** A faked OS-window with traffic-light dots (red/yellow/green at 12 px) and a fake URL bar (`puheo.fi/oma-sivu`), wrapping a screenshot of the actual product dashboard.
- **Role:** Above-the-fold product proof.
- **Note:** The PRODUCT.md "Show the grader, don't describe it" principle prescribes replacing this with the live grader card. Component is documented here as it currently ships, marked for replacement.

### Grader Card (`.grader-card`)
- **Shape:** 24 px radius, charcoal-elevated, with `card-shadow`.
- **Marked-up prose:** real Spanish text with `<span class="ge" data-cat="...">` wrappers carrying tooltipped Finnish error explanations. Categories: `spelling` (yellow underline), `grammar` (mint underline).
- **Rubric block:** 4 YTL rows (Viestinnällisyys, Kielen rakenteet, Sanasto, Kokonaisuus) each with name + score + one-line feedback, plus a total + YO arvosana line.
- **Role:** PRODUCT.md's stated hero artifact. Currently buried in section 7 of 10; design principle prescribes promotion to above-the-fold.

### Navigation
- **Style:** Sticky 64 px header, transparent at top, `rgba(10,10,10,0.78)` + 12 px backdrop-blur once `data-scrolled="true"`.
- **Links:** 14 px Geist 500, muted-slate, hover to paper-white. No underlines.
- **CTAs:** "Kirjaudu" as a quiet button, "Aloita ilmaiseksi" as a primary button on the right.

## 6. Do's and Don'ts

### Do:
- **Do** keep mint (`#2DD4BF`) under 10% of any visible surface. The accent's job is to be rare.
- **Do** use Geist as the only typeface and Geist Mono only for digits. The Single-Voice Rule is the system.
- **Do** tint every neutral toward the mint hue. `#0B0E0D` not `#0a0a0a`; `#fafafa` not `#fff`.
- **Do** use hairline borders at 8% / 14% white opacity, 1 px maximum.
- **Do** restrict shadows to earned moments (the browser frame, the grader card, the final CTA glow). Three shadow tokens, three uses.
- **Do** keep motion at 150 / 220 / 320 ms ease-out. No bounce, no spring.
- **Do** respect `prefers-reduced-motion: reduce` by collapsing all transitions to 0 ms.
- **Do** keep all body text at 16 px or larger on mobile; cap touch targets at 44 × 44 px floor.

### Don't:
- **Don't** ship anything that looks like Linear, Vercel, Cursor, Supabase, or Resend (PRODUCT.md anti-reference). Teal-on-charcoal with a radial bloom is the first-order category reflex for "AI EdTech 2026"; the rebuild's job is to escape it.
- **Don't** ship anything that looks like Duolingo, Cake, or Memrise (PRODUCT.md anti-reference). Cartoon mascots, gamification-as-personality, plastic rounded UI: the audience is 17, not 7.
- **Don't** ship anything that looks like Quizlet, Anki, MAOL, or Otava (PRODUCT.md anti-reference). Visually mute or school-IT dated is the opposite failure mode.
- **Don't** use `#000` or `#fff` anywhere. Tinted neutrals only.
- **Don't** use gradient text (`background-clip: text`). Solid color, hierarchy via weight and size.
- **Don't** use a side-stripe accent border on cards or callouts. Full borders, background tints, leading numbers; never `border-left: 4px solid mint`.
- **Don't** use glassmorphism decoratively. The nav backdrop-blur is the system's one glass moment; no glass cards in the body.
- **Don't** repeat four 3-up card grids vertically (current landing does this; the rebuild fixes it). Identical-card-grids is an absolute ban.
- **Don't** use emoji as iconography. Flag emoji (🇪🇸 🇩🇪 🇫🇷) on language cards is a current violation; the rebuild replaces them with typographic treatments of the language names.
- **Don't** use Inter as the rendered fallback. The `@font-face` Geist Fallback maps to Inter; if Geist fails to load, the user sees a banned font. Prefer `system-ui` first.
- **Don't** add a second mint glow alongside the hero radial bloom. One glow per page, maximum.
- **Don't** scale or translate cards on hover. The Screen Template skill bans `transform: scale()` because it shifts layout. Color and border-opacity shifts only.
- **Don't** ship `transition: all`. Animate `transform` and `opacity` (or specific properties) only.
- **Don't** stack five primary CTAs labeled "Aloita ilmaiseksi" above the fold (current landing does this). PRODUCT.md design principle: one primary CTA per viewport.
