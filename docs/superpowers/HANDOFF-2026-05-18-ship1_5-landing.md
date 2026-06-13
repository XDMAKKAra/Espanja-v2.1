# Handoff — Ship 1.5 Landing Redesign

**Date:** 2026-05-18
**Previous session:** Ship 1 (PR #62) tried editorial-textbook direction, **rejected as AI-slop by user**. PR left open but not merged. Direction pivoted to "Old-Spain illustrated, Mafy-grade professional but distinctive".

---

## Production state right now

- **Main:** v166 (commit 12f08f3). Landing is dark-mint AI-startup register.
- **Branch `auto/textbook-redesign-ship1-landing`** (commit 223e342): editorial-textbook attempt. Lives on GitHub as **PR #62 (open, not merged)**. User rejected it on grounds it looks like classic AI-slop template.
- **Working tree:** clean on main currently (Ship 1 work is on the branch).

## Why Ship 1 failed

- Off-white paper + Source Serif 4 hero + 50/50 split + 3 identical testimonial cards + big rubric table → exactly the AI-default editorial template
- Used "Espanjan YO-koe ei ole kielikoe" headline — **excludes French and German learners**, who are also Puheo's audience
- Used specific lukio names in testimonials (legal risk)

Detailed pattern list: `memory/ship1_ai_slop_mistakes.md` (loaded automatically).

---

## Ship 1.5 — approved direction

### Aesthetic vector
**"Successful lukio-prep that looks more expensive than Mafy"**, *not* a Mafy clone. Reference points: MasterClass, Khan Academy 2024, NYT Cooking. Differs from competitors:

| Competitor | Their look | Puheo direction |
|---|---|---|
| Mafy | blue + student photos + stat bar | terracotta + olive + Humaaans illustrations + verifiable stats only |
| Studeo | pastel violet + gamified | rich Mediterranean + editorial restraint |
| Eezy | peach+purple + celebration photo | considered, illustrated, less marketing-y |
| Valmennuskeskus | purple + corporate | warm, modern, premium |
| Current Puheo (main) | dark mint + AI accents | drop entirely |

### Color tokens (OKLCH)

```css
--ed-bg:         oklch(96% 0.012 75);   /* warm cream paperi */
--ed-bg-card:    oklch(98% 0.008 75);   /* slightly lifted */
--ed-bg-deep:    oklch(93% 0.018 75);   /* one step warmer */
--ed-ink:        oklch(18% 0.012 30);   /* warm near-black */
--ed-ink-muted:  oklch(38% 0.012 30);
--ed-ink-subtle: oklch(56% 0.012 30);

--ed-accent:        oklch(42% 0.15 28);   /* deep terracotta primary */
--ed-accent-hover:  oklch(36% 0.15 28);
--ed-accent-soft:   oklch(42% 0.15 28 / 0.10);

--ed-olive:         oklch(38% 0.07 110); /* secondary, asiantuntemus */
--ed-olive-soft:    oklch(38% 0.07 110 / 0.12);

--ed-gold:          oklch(62% 0.11 78);  /* marginalia, käytetään harvoin */
```

### Typography

- **Display:** Fraunces (Google Fonts, variable axis SOFT/WONK for editorial pull)
- **Body:** Manrope (Google Fonts, geometric humanist)
- **Mono:** JetBrains Mono (already in use)
- **Banned:** Inter (design-taste-frontend rule), Source Serif 4 (Ship 1 trauma), Geist (replaced by Manrope for warmer character)

Google Fonts link:
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..700,0..100,0..1;1,9..144,400..700,0..100,0..1&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Illustration strategy

**Pablo Stanley's Humaaans** (`github.com/pablostanley/humaaans`, MIT license). Real artist's modular character library. Steps:

1. Download `humaaans-2.0.zip` or fork from GitHub
2. Pick 4–5 figures (sitting reading, walking with backpack, standing thinking, group of two)
3. **Recolor** clothing to terracotta + olive + cream via find-replace in the SVG source. Skin tones varied (Humaaans ships with multiple)
4. Save to `/img/illustrations/student-{name}.svg`
5. Embed as `<img>` in landing OR inline `<svg>` for color-token theming

**Claude must be able to edit these SVGs directly** in future sessions — user wants the option to refine illustrations in code, not only in Figma. Keep all illustrations as inline-editable SVG, no PNG conversions.

### Layout principles (design-taste DESIGN_VARIANCE=8)

- Hero: **70/30 asymmetric** (illustration ~70% width left, copy 30% right) — NOT 50/50
- Italic-emphasis **on one word only** in headline (not whole headline)
- Testimonials: **asymmetric, not 3-col cards**. Try: one big quote with character illustration + 1–2 inline-text fragments alongside
- Pricing: comparison table OK (Ship 1 got this right) but reduce maroon column emphasis
- Stat row: **only verifiable numbers** (course count, lesson count, vocab count) — NO disputable percentages
- Course catalog visible on landing (8 kurssia of selected language displayed as tiles, language switcher visible)
- Headline must cover **es / fr / de** (NEVER one language only)

### Copy rules

- Drop the word "AI", "tekoäly", "Tekoälyvalmennus" from the visible landing. Use "kalibroitu YTL:n rubric:llä" instead
- No em-dashes anywhere (—). Use period, comma, colon, parenthesis
- Trust line ≠ "Suomalainen tuote · Ei luottokorttia · Toimii selaimessa" (SaaS cliché). Use language coverage line: "Espanja, ranska ja saksa. Lyhyen oppimäärän YO-koe."
- Testimonials: `Etunimi, ikä, sesonki, kieli, grade-shift` only. NO city, NO lukio. Example: "Eemil, 18, kevät 2026, lyhyt espanja: M → E"
- One testimonial per language minimum (one each for es/fr/de)
- FAQ keeps Mafy-comparison question from Ship 1 (only good copy from that branch)

### Components to fetch from 21st.dev MCP

User explicitly authorized 21st.dev component inspiration. Suggested queries:

1. `21st_magic_component_inspiration("hero asymmetric illustrated 70/30")`
2. `21st_magic_component_inspiration("testimonial asymmetric one large quote with character")`
3. `21st_magic_component_inspiration("course catalog grid 4-col illustrated")`
4. `21st_magic_component_inspiration("stat row inline verifiable numbers")`

Use these for layout/CSS inspiration. Do not copy components verbatim if not aesthetically aligned with Old-Spain palette.

### Motion (emil-design-eng)

- Button `:active { transform: scale(0.97); transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1); }`
- Page reveal: stagger `opacity: 0 → 1` + `translateY(8px) → 0` cascade per hero element, 50ms intervals, 480ms duration
- Hover on testimonial illustration: 1.5px parallax shift, NOT scale
- NO ease-in anywhere; ease-out-quart `cubic-bezier(0.23, 1, 0.32, 1)`
- All gated under `@media (prefers-reduced-motion: no-preference)`

---

## Implementation order

1. **Branch:** create `auto/ship1_5-landing-old-spain` from main (NOT from Ship 1 branch — fresh start)
2. **Tokens:** rewrite `css/landing-editorial-tokens.css` with Old-Spain palette + Fraunces/Manrope
3. **Humaaans:** download, recolor 4 figures, save to `/img/illustrations/`
4. **Stylesheet:** rewrite `css/landing-editorial.css` from scratch (Ship 1's CSS is template-y; do not extend it)
5. **HTML:** rewrite `index.html` hero + testimonials + course catalog + stat row + pricing + FAQ + CTA + footer
6. **SW:** bump cache version (currently v167 on Ship 1 branch, main is v166 → use v168)
7. **Playwright:** snapshot spec + key-element assertions (`tests/e2e-ship1_5-landing.spec.js`)
8. **node --check** all touched JS
9. **Commit + PR + auto-merge** via `gh pr merge --squash --delete-branch --auto`

After landing ships: **close PR #62** since Ship 1.5 supersedes it.

---

## Available skills and MCP tools

### Required skill stack (FRONTEND task → invoke ALL before first Write/Edit/Bash)

- `frontend-design` — bold aesthetic direction (anti-slop)
- `design-taste-frontend` — DESIGN_VARIANCE=8 enforcement, font + color + layout bans
- `ui-ux-pro-max` — a11y, touch targets, contrast
- `emil-design-eng` — motion specifics
- `impeccable` — shared design laws + register (brand vs product)

**SKIP these** for this task (user requested 2026-05-18):
- `puheo-screen-template` (too constraining for marketing page)
- `puheo-finnish-voice` (constrains tone too much)

### Available MCP tools

- `mcp__magic__21st_magic_component_inspiration` — fetch component layouts from 21st.dev
- `mcp__magic__21st_magic_component_builder` — generate components
- `mcp__magic__21st_magic_component_refiner` — refine generated components
- `mcp__magic__logo_search` — find logos
- `mcp__claude_ai_Supabase__*` — for DB if needed (not for this task)

### Critical project rules (loaded from memory automatically)

- `feedback_sw_cache_bump.md` — bump SW CACHE_VERSION on STATIC_ASSETS change
- `feedback_node_check_before_commit.md` — `node --check js/screens/*.js` before commit
- `feedback_auto_push_workflow.md` — feature-branch + gh PR auto-merge, no direct main push
- `feedback_playwright_works_in_harness.md` — playwright works, don't skip
- `feedback_playwright_gate.md` — addInitScript sets puheo_gate_ok_v1=1 before goto
- `project_target_languages_multi.md` — Puheo is ES/FR/DE, not just Spanish
- `feedback_landing_direction_2026_05_18.md` — palette, fonts, illustration, layout
- `ship1_ai_slop_mistakes.md` — exact patterns rejected
- `feedback_no_fabricated_provable_claims.md` — testimonial rules

### Useful repo files

- `index.html` — current landing (Ship 1 still on `auto/textbook-redesign-ship1-landing`)
- `css/landing-editorial-tokens.css` + `css/landing-editorial.css` — Ship 1 attempt, **do not extend**, rewrite
- `js/landing-countdown.js` — YO countdown logic, reuse as-is
- `sw.js` — STATIC_ASSETS list + CACHE_VERSION
- `app.html` — app shell (not in scope this ship)
- `tests/e2e-ship1-landing.spec.js` — Ship 1 verification (delete or replace in Ship 1.5)
- `tests/e2e-redesign-audit.spec.js` + `tests/e2e-redesign-audit-app.spec.js` — full-app audit scripts
- `audit-screens/` — Ship 1 screenshots (gitignored)

---

## Resume prompt for next session

Copy this verbatim into a new chat:

```
Jatka Puheon työtä tasan siitä mihin jäin viime chatissa (2026-05-18).

Lue ensin nämä järjestyksessä:
1. docs/superpowers/HANDOFF-2026-05-18-ship1_5-landing.md
2. memory/ship1_ai_slop_mistakes.md
3. memory/feedback_landing_direction_2026_05_18.md
4. memory/project_target_languages_multi.md

Tila: main on v166. Ship 1 (PR #62, branch auto/textbook-redesign-ship1-landing) torjuttiin AI-slop:na. PR jätetty auki mutta ei mergattu — uusi branch luodaan mainista.

Skill-stack FRONTEND-luokassa: kutsu frontend-design, design-taste-frontend, ui-ux-pro-max, emil-design-eng, impeccable ENNEN ensimmäistä Write/Edit/Bash-kutsua. Käyttäjä pyysi 2026-05-18 SKIPATA puheo-screen-template ja puheo-finnish-voice. Aloita vastaus rivillä "Skills invoked: ..."

Käytä myös 21st.dev MCP -toolia (mcp__magic__21st_magic_component_inspiration) hero / testimonial / course catalog / stat row -komponenttien inspiraatioon ennen koodia.

Tehtävä: rakenna Ship 1.5 — Old-Spain illustrated landing. Tokens + Humaaans-illustrations + Fraunces+Manrope + 70/30 asymmetric hero + multi-language copy (es/fr/de) + verifiable-stat-row + asymmetric testimonials. Tarkka spec on HANDOFF-tiedostossa.

Implementation order: branch auto/ship1_5-landing-old-spain → tokens → Humaaans recolor → stylesheet rewrite → index.html rewrite → SW bump v168 → Playwright spec → commit + auto-merge PR. Sulje PR #62 sen jälkeen.

Aloita "luettu, aloitan branchin auto/ship1_5-landing-old-spain ja kysyn 21st.dev:ltä hero-inspiraatiota". Älä kysy hyväksyntää yksittäisistä päätöksistä joita HANDOFF jo sanoo — vain isoista pivotista jos joku on epäselvä.
```

Promptin lyhyt nimi muistamiseen: **"resume puheo ship 1.5"**
