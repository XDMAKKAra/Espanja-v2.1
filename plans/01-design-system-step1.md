# Pass 1 — Visual design system · Step 1 (design only)

You are working in `C:\Users\marce\OneDrive\Documents\espanja paska\` — Puheo, a Spanish YO-koe prep app for Finnish high schoolers. Exam 28.9.2026. Stack: vanilla JS SPA, Node/Express, Supabase, OpenAI. Finnish UI only. This pass is the **visual design system** — a coherent set of tokens + components that unifies the app and marketing site.

**Do NOT begin this pass until the new-exercise-types Step 2 (`exercise-types-step2-prompt.md`) is fully merged to `main` through Gate E.** Visual work on top of in-flight feature work is the recipe for endless merge pain.

## Skills to load

Before you do anything else, load and read these skills:
- `.claude/skills/ui-ux-pro-max/SKILL.md` — 67 styles, 96 palettes, 57 font pairings, 99 UX guidelines. This is your visual library.
- `.claude/skills/design-taste-frontend/SKILL.md` — the taste layer.
- `.claude/skills/theme-factory/SKILL.md` — token generation.

## Why this pass

Puheo looks like a hobby project. The new-types pass makes it *functionally* strong but the visual layer is still inconsistent: ad-hoc color choices, headings that don't scale, cramped spacing, mobile nav that collides with content, skeleton states that don't match the real components. This pass fixes the visual language *before* we rework landing + onboarding, so those next passes inherit a polished system rather than inventing their own.

## Scope

Design (not implement) a token-based design system suitable for a paid language-learning product aimed at Finnish 17–19-year-olds. Aesthetic target: **clean, calm, exam-serious but not boring**. Reference quality bar: Duolingo, Brilliant, Anki, but localized and restrained — Finnish teens don't respond to bubbly cartoon energy, they respond to competence.

## Deliverables (Step 1 only, no production code)

Create `design-system/` folder (the folder exists at the repo root — fill it). Produce these files:

### 1. `design-system/AUDIT.md`
Screenshot the current app at 390×844 (mobile) and 1440×900 (desktop). For each of: landing, app login, dashboard, learning path, vocab exercise, writing exercise, exam. Catalog every violation: ad-hoc colors, heading size inconsistencies, spacing collisions, touch-target <44px, skeleton/real-component mismatch, font weight inconsistencies. Cite file + line for each. This is the "before" artifact.

### 2. `design-system/DESIGN.md`
The design system spec:
- **Color tokens**: 1 primary, 1 secondary, 1 neutral ramp (5 steps), 4 feedback colors (success/warn/error/info), dark-mode pair for each. Pick from `ui-ux-pro-max` palettes. Name each token.
- **Typography scale**: 1 font family (or pair — headline + body). Finnish needs ä/ö so verify glyph coverage. 5 heading sizes, body, caption, mono. Include line-heights.
- **Spacing scale**: 4px base, geometric progression up to 64px.
- **Radius scale**: 3 steps.
- **Shadow scale**: 3 steps (resting / hovered / lifted).
- **Component specs** — for each of: button (primary/secondary/ghost/destructive × sm/md/lg), input, textarea, card, chip/tag, skeleton (vocab/writing/grammar/reading variants), feedback banner (correct/lähellä/väärin), toast, modal, bottom-nav, top-nav. Show both states + measurements.
- **Motion tokens**: duration-fast/base/slow, easing-in/out/in-out.
- **Accessibility defaults**: contrast ratios, focus ring, touch target minimums.

### 3. `design-system/SCREENS.md`
Re-mock every app screen at both viewports using the new tokens. ASCII mocks or Mermaid diagrams are fine — this isn't Figma, it's a spec for Step 2 to implement. Flag every place the new system diverges from current implementation.

### 4. `design-system/PLAN.md`
Ordered commit list for Step 2, one concern per commit. Target 10–14 commits: tokens first, then foundational components (button, input, card), then feedback (skeleton, banner, toast), then navigation, then per-screen re-skins (dashboard → learning path → vocab → writing → grammar → reading → exam). Each commit: title, files, test, acceptance criterion.

### 5. `design-system/FINDINGS.md`
Surprises discovered during the audit that affect Step 2: weird legacy CSS, conflicting inline styles, `!important` abuse, third-party CSS that fights the system (if any). File + line citations.

## Ground rules

- Do not write production CSS yet. Only tokens-as-values in a spec doc.
- Finnish-text-safe: every sample must use real Finnish copy with ä/ö/å/é characters — not lorem ipsum.
- Mobile-first **in mindset**, but not in outcome — see explicit desktop acceptance below. Today's site caps content at 360–680px across nearly every screen (`style.css:391, 642, 1053, 1104, 1339, 1543, 2052, 2344`) and on a 1920px monitor leaves ~1280px of empty margin. That's a bug, not a feature.
- No external UI library added. Existing stack is vanilla JS + CSS; stay there.
- Reuse before invent — if the training-improvement pass shipped a skeleton class that fits, extend it.

## Desktop acceptance criterion (user-reported bug)

**Hard requirement (deferred from Pass 0.5):** Desktop layout (≥1024px) must use ≥960px of content width on dashboard and every exercise screen. Empty desktop margins are a bug, not a feature.

User reported the site "looks like it's made only for phone use — very narrow." Design system MUST specify breakpoints and content widths that fix this:
- **Mobile (<768px):** full-width, as today.
- **Tablet (768–1023px):** content capped at ~720px, sidebar collapses.
- **Desktop (≥1024px):** content uses ≥960px on dashboard, learning path, and every exercise screen. Two-column layouts where it makes sense (exercise + feedback panel side-by-side, dashboard stats + recent activity side-by-side).
- **Wide (≥1440px):** cap at 1280–1440px, centered. Never let content stretch edge-to-edge on ultra-wide monitors — but never force it below 960px on normal desktop either.

DESIGN.md and SCREENS.md must both show desktop mocks that honour these widths. The audit must explicitly flag every container currently capped below 960px.

## TODO from Pass 0.5 — "Haasta itseäsi" escape hatch

Pass 0.5 removed the manual taso-picker because it overrode per-topic mastery. Some users will still legitimately want to try a harder level. DESIGN.md must spec a small subordinate "Kokeile vaikeampaa →" affordance (text link, not a button) that lives on the *exercise* screen (not the mode page, not in the start flow). Behaviour: bumps the current session one CEFR level up without changing stored mastery. Place it in the side-panel area if the side-panel pattern lands, otherwise a corner link. This is a spec requirement for this pass; implementation lands in Step 2 alongside the re-skin.

## Stop here

When