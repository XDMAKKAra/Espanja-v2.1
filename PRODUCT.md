# Product

## Register

brand

> Default register is **brand** because the active design work is the marketing surface (landing, language pages, pricing, blog). Product-register tasks (anything under `/app.html`, settings, in-exercise screens) override per-task and follow the existing `style.css` Cuaderno tokens — they are not governed by this file's visual guidance.

## Users

Finnish high-school students, 16–19 years old, preparing for the **ylioppilastutkinto** (yo-koe) matriculation exam in **Spanish, German, or French — lyhyt oppimäärä** (short syllabus / B-level).

Their context when they meet Puheo:

- Stressed, time-pressed. The exam date is fixed and visible to them at all times (Puheo's countdown is reinforcement, not novelty).
- Studying solo at home, late evenings, between school and other obligations. Often on a phone, often half-distracted, almost never at a clean desk with a textbook open.
- Already exposed to school-issued textbooks (Otava, Sanoma Pro) and apps (Duolingo, Quizlet, ChatGPT). Skeptical of marketing-speak. Allergic to anything that smells like a school assignment or a startup pitch.
- The goal isn't fluency. The goal is **points on a specific exam, by a specific date**, graded on a specific rubric (YTL: viestinnällisyys, kielen rakenteet, sanasto, kokonaisuus).
- A non-trivial slice is the parent or teacher evaluating the tool *on behalf of* the student — they hit the landing first.

Job-to-be-done: *"Help me know what to study next, and tell me honestly whether my Spanish is good enough to pass yet."*

## Product Purpose

Puheo is an adaptive, AI-graded YO-koe preparation platform for the **lyhyt oppimäärä** in Spanish (open), German (autumn 2026), and French (spring 2027).

The whole product orbits one promise: **YTL-rubric-accurate writing assessment with Finnish-language error explanations**, paired with a sanasto / kielioppi / lukeminen drill loop that knows what each student needs next. The AI grader is the differentiator — Duolingo doesn't do it, Quizlet doesn't do it, school teachers can't do it nightly at 22:30.

Success looks like a student who:

1. Trusts the YTL score Puheo gives them (it correlates with their actual exam result).
2. Returns daily for 10 minutes for the months before their exam.
3. Tells one friend.

Failure modes to design against: looking like a generic AI tutor, looking like a course-builder SaaS, looking like a children's app, looking expensive enough to feel like another stress.

## Brand Personality

**Three words: encouraging, concrete, Finnish.**

- **Encouraging without flattery.** Treat the student as capable. Specific praise ("hyvä — vahva preteritti") beats generic praise ("hyvää työtä!"). Specific correction ("tarkista artikkelin sukupuoli") beats vague encouragement ("yritä uudelleen").
- **Concrete without coldness.** Use numbers, dates, rubric scores, real example sentences in real Spanish/German/French. Never abstract claims like "tehosta opiskelua" or "saavuta tavoitteesi." If the AI grader is good, *show* the AI grader.
- **Finnish without folksiness.** Sinä-form, verb-first imperatives, normal Finnish punctuation (1 234, not 1,234; commas on decimals; periods at sentence ends). YO-koe and YTL spelled out the way students recognize them. No anglicisms when a Finnish word exists ("putki" not "streak"). No "vibe" / "boost" / "level up." No exclamation-point spam.
- **Warm under the surface.** The student is stressed. Acknowledge that without being therapy-app saccharine. The countdown pill is honest, not menacing. The grader card shows a real 13/20 (arvosana E), not a fake A+.

Emotional goal: the student should feel **competent and calm**, not pumped up and not lectured.

## Anti-references

What Puheo must NOT look or feel like:

- **Linear / Vercel / Cursor / Supabase / Resend / any 2024–26 AI-SaaS dark-mode landing.** Teal-on-#0B0E0D with a glowing radial bloom is the first-order category reflex for "AI EdTech 2026." The current `landing.css` lives there. Move off.
- **Duolingo / Cake / Memrise.** Cartoon mascots, gamification-as-personality, big rounded plastic UI, owl-anthropomorphised brand. Puheo's audience is too old and too stressed for that. Game mechanics fine; cartoon costume not.
- **Quizlet / Anki.** Functional but visually mute, no point of view. Puheo should look more designed than these, not less.
- **MAOL / Otava school-textbook web property.** Government-purchased, committee-designed, dated typography, "school IT" aesthetic. Puheo is allowed to feel modern.
- **Brand-name tutor startups (Kumon, Mathnasium, "PrepCorp")** with stock-photo students and confidence-stat hero metrics. Trust here is built from real product artifacts (the grader card, real Finnish error explanations), not endorsement-style imagery.
- **ChatGPT.** Puheo is *not* "a chatbot for Spanish." The product is structured: courses, sanasto sets, YTL rubric, kertausjono. The design should reinforce that structure exists.

Visual bans inherited from `impeccable`: emoji-as-icon, gradient text, side-stripe accent borders, glassmorphism by default, hero-metric template, identical-card grids, sweeping radial glows over screenshots, "Aloita ilmaiseksi" repeated five times above the fold.

## Design Principles

1. **Show the grader, don't describe it.** The single most differentiating product artifact is the YTL-rubric assessment. It belongs *above the fold*, executed as a real marked-up student email with hovered Finnish explanations and a real rubric breakdown — not as a screenshot inside a Mac browser chrome. Everything else on the landing supports that artifact.

2. **Earn the visual register from the audience, not the category.** The student studies at a desk with paper, lit by a lamp. The product is exam prep. The natural register is **editorial-paper** (warm off-white, one strong display face, teal demoted to action-color only, no glow, no dashboard chrome), not developer dark mode. Pick the register from the physical scene, not from "AI-tool landings look like this."

3. **Speak Finnish to a stressed 17-year-old, not to a marketer.** Every visible string passes the puheo-finnish-voice skill: sinä-form, verb-first, concrete, no exclamation-point spam, no anglicisms, no condescension. Microcopy is content, not decoration.

4. **One YTL number beats three vibe stats.** Where a metric appears, it should be a real YTL score, a real word count, a real days-until-yo-koe number, or nothing. No "2 000+ aktiivista käyttäjää" until that's true; no "Tehoa opiskeluun" without the score to back it. Numbers are the proof, not the ornament.

5. **Hierarchy through restraint.** The page should have ~5 sections, not ~10. One primary CTA per viewport. One arrow per primary CTA. One accent color carrying ≤10% of the surface (Restrained color strategy). When in doubt, remove a card grid.

## Accessibility & Inclusion

- **WCAG 2.2 AA** as the floor. Body text 4.5:1 minimum, large text 3:1, focus rings always visible (`2px solid var(--accent)` with 2px offset).
- **Reduced motion respected** via `@media (prefers-reduced-motion: reduce)` (already wired in `landing-tokens.css`). The hero glow, count-up animations, and scroll reveals all collapse.
- **Mobile first**, real first. iPhone SE / 13 mini (375px) is the primary surface. Minimum 16px body text on mobile, 44×44px tap targets.
- **Finnish as the only UI language** for now. German and French versions of the landing will translate microcopy when those tiers open (autumn 2026, spring 2027); design must accommodate ~20% string-length variance.
- **No keyboard traps.** All interactive elements (FAQ accordions, pricing CTAs, language cards) reachable via Tab. Esc closes any modal/dialog (none currently on the landing).
- **Color-independent meaning.** The pricing comparison's red `×` and green `✓` are paired with text and icons, never color alone. The YTL grader's underlined errors must remain legible without the orange/red tint.
- **No flashing, no parallax-on-scroll** that breaks vestibular sensitivity. The current radial-bloom drift is borderline; it stays gated behind the prefers-reduced-motion check.
- **Screen-reader honesty.** Decorative SVGs `aria-hidden="true"`, icon-only buttons get a Finnish `aria-label`, the YTL grader card's marked-up errors carry their corrections in the accessible name, not just on hover.
