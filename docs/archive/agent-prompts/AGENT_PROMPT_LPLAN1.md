# Agent Prompt — L-PLAN-1: Onboarding redesign + Placement upgrade

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

PAUSE before L49. This is L-PLAN-1 — the most important feature loop in the project.
Read CURRICULUM_SPEC.md in full before writing a single line of code.
Also read: lib/placementQuestions.js, lib/placement.js, routes/auth.js,
and grep app.html for "#screen-ob-" to understand the existing onboarding screens.

=== CONTEXT ===

Puheo currently has a placement test (lib/placementQuestions.js — 20 hardcoded MCQ)
and onboarding screens (screen-ob-*) but they do not produce a meaningful learning path.
This loop upgrades the placement flow end-to-end so that when a student finishes onboarding,
they have a real personal plan anchored to their starting kurssi (1–8) and exam goal.

Skills to activate for this entire loop — read each SKILL.md before the relevant work:
- .claude/skills/puheo-screen-template/SKILL.md — layout, required states, breakpoints, motion
- .claude/skills/puheo-finnish-voice/SKILL.md — ALL copy the student sees, every string
- .claude/skills/puheo-ai-prompt/SKILL.md — ALL OpenAI calls: system message, JSON schema, cost guards
- .claude/skills/ui-ux-pro-max/SKILL.md — a11y rules, touch targets, focus states, font pairing

Education skills — read BEFORE the relevant sections listed below:
- .claude/skills/education/cognitive-load-analyser/SKILL.md
  → Read BEFORE designing OB-1 and OB-2. Apply to: number of fields per screen (max 4),
    question phrasing complexity, amount of information shown per step.
    Goal: keep each screen's working-memory demand ≤ 4 distinct elements.
- .claude/skills/education/intelligent-tutoring-dialogue-designer/SKILL.md
  → Read BEFORE writing the OB-3 tutorAssessment prompt (UPDATE 3 step 4).
    Apply to: the OpenAI prompt that generates the 2–3 sentence Finnish assessment.
    The tutor voice must be warm, specific, and name a concrete next step — not abstract level labels.
- .claude/skills/education/explicit-instruction-sequence-builder/SKILL.md
  → Read BEFORE designing the firstWeekPlan structure (UPDATE 3 step 5).
    Apply to: day 1 = explicit new input, day 2 = guided practice, day 3+ = independent retrieval.
    Each week's plan should follow I Do → We Do → You Do progression.
- .claude/skills/education/formative-assessment-loop-designer/SKILL.md
  → Read BEFORE writing selectDiagnosticQuestions() changes (UPDATE 1).
    Apply to: how the M_hard anchor questions branch conditionally, how immediate
    post-answer feedback (OB-2) is structured to help the student calibrate.
- .claude/skills/education/retrieval-practice-generator/SKILL.md
  → Read BEFORE deciding question format for M_hard questions (UPDATE 1 step 3).
    Apply to: making anchor questions test genuine retrieval, not recognition — prefer
    sentence completion or production over pure MCQ where possible within the existing UI.
- .claude/skills/education/spaced-practice-scheduler/SKILL.md
  → Read BEFORE generating firstWeekPlan (UPDATE 3 step 5).
    Apply to: spacing new content (day 1 lesson 1, day 2 lesson 2) vs. SR review
    (day 3+ for dailyGoalMinutes ≥ 30). Ensure the plan embeds at least one retrieval
    gap before the first review appears.
- .claude/skills/education/self-efficacy-builder-sequence/SKILL.md
  → Read BEFORE finalising OB-3 screen copy (UPDATE 2: SCREEN OB-3).
    Apply to: the placement_confidence = "low" note — frame it as a feature of the plan,
    not a judgment. Also apply to "Aloitetaan!" CTA and the first week preview framing.
- .claude/skills/education/backwards-design-unit-planner/SKILL.md
  → Read BEFORE writing the firstWeekPlan generation logic (UPDATE 3 step 5).
    Apply to: ensure each day maps to a measurable sub-goal from the kurssi, not just
    "lesson N" — taskTitle should reflect what the student will be able to DO after it.

Design plugin skills (these live in Claude Code's plugin skill registry — invoke by name):
- design:ux-copy — apply when writing ANY microcopy: button labels, empty states, error messages,
  onboarding question phrasing, progress indicators. Run BEFORE finalising copy on each screen.
- design:accessibility-review — run AFTER each screen is built. Catches WCAG issues beyond axe-core:
  reading level, cognitive load, touch target quality, focus order.
- design:design-critique — run on Playwright screenshots of each finished screen. Use to catch
  hierarchy problems, spacing inconsistencies, and anything that looks "off" before shipping.

21st.dev sourcing rule (MANDATORY for every new UI component in this loop):
Before building ANY new interactive element (button style, stepper, picker, card, list item):
1. Visit 21st.dev via Playwright and search the relevant term (e.g. 21st.dev/s/stepper,
   21st.dev/s/pill-picker, 21st.dev/s/progress-steps, 21st.dev/s/onboarding)
2. Screenshot 2–3 candidates to references/app/onboarding/21stdev/
3. Pick the most restrained dark option that matches Puheo's Linear-tier aesthetic
4. Port React+Tailwind → vanilla CSS matching css/landing.css patterns
5. Cite the exact 21st.dev component URL in IMPROVEMENTS.md

Do NOT invent new component styles from scratch. If 21st.dev has nothing suitable,
fall back to Magic UI (magicui.design) or shadcn (ui.shadcn.com), same workflow.

=== UPDATE 1: Upgrade placement test questions ===

The existing PLACEMENT_QUESTIONS in lib/placementQuestions.js are too easy to guess
(25% chance per MCQ question). Add guessing-resistance:

1. Add a `plausible_wrong_options` flag to hard questions. For B/C/M level questions,
   all 4 options must look plausible to someone guessing — no obviously silly distractors.
   Rewrite any question where one option is clearly a joke (e.g. "kissa" as distraction
   for a grammar question).

2. Add response-time tracking: the frontend records time_ms per answer.
   If median answer time < 4000ms across all questions → set placement_confidence = "low"
   → start student one kurssi lower than scored.

3. Add 2 "anchor" questions at M-level that only show if student gets all A/B/C correct.
   These determine if student can skip to Kurssi 7. Add them to PLACEMENT_QUESTIONS with
   level: "M_hard" and update selectDiagnosticQuestions() to conditionally include them.

Files to touch: lib/placementQuestions.js (rewrite weak distractors, add M_hard questions),
lib/placement.js (handle placement_confidence logic).

=== UPDATE 2: Onboarding screens — 4-screen flow ===

Read the existing screen-ob-* screens in app.html. Extend/replace them with this flow.
Do NOT delete existing screens before verifying the new flow works end-to-end.

SCREEN OB-1 — "Kerrotaan ensin perustiedot" (replaces or extends screen-ob-welcome)

Layout: centered card, max-width 520px, dark surface, step indicator "1 / 4" top-right.
Source the step indicator from 21st.dev/s/stepper — Playwright screenshot 2 candidates
to references/app/onboarding/, pick the most restrained.

Fields:
- "Mikä on viimeisin espanjan arvosanasi koulun kokeessa?"
  Segmented pill picker: En ole saanut / I / A / B / C / M / E / L
  (NOT "yo-koe arvosana" — most students haven't taken the YO exam yet.
   This is school grade. Finnish label: "Koulun viimeisin arvosana")

- "Mikä on tavoitearvosanasi yo-kokeessa?"
  Same segmented picker. Pre-select one level above the school grade as default.

- "Mikä tuntuu vaikeimmalta?" Multi-select chips (can select multiple):
  Verbien taivutus | Aikamuodot | Ser vs estar | Subjunktiivi |
  Sanasto | Kirjoittaminen | Luetun ymmärtäminen | En tiedä vielä

- "Kuinka kauan voit harjoitella päivässä?"
  4 pills: 10 min | 20 min | 30 min | 45 min+

CTA: "Seuraava →" — disabled until school grade + target grade are selected.

Store answers in component state (not yet to Supabase — send everything together in UPDATE 3).

SCREEN OB-2 — "Nyt testataan missä olet" (replaces screen-ob-placement)

Header: "8 kysymystä · noin 3 minuuttia"
Subheader: "Älä arvaile — arvaaminen hidastaa sinua. Vastaa rehellisesti."

Question display:
- One question at a time, large and centered
- Progress bar: "Kysymys X / 8" with thin accent bar below header
- Question text (Spanish sentence or word) — 20px, prominent
- 4 option buttons, full-width, stacked vertically, 48px tall (touch-safe)
- Timer running silently in background (store time_ms per answer — do NOT show timer to student)

After each answer → immediate feedback before next question:
- Correct: green border flash on button + "✓ Oikein" label + brief Finnish explanation
  (use the `explanation` field from PLACEMENT_QUESTIONS)
- Wrong: red border flash + "✗ Väärin — [explanation]"
- Auto-advance to next question after 2.0s (or immediately on tap)

Use selectDiagnosticQuestions(selfReportedGrade, 8) from lib/placementQuestions.js.
Pass selfReportedGrade from OB-1.

After all 8 answers: collect { answers[], timings[] }, proceed to OB-3.
Do not call the API yet — wait until OB-3 renders so student doesn't wait.

SCREEN OB-3 — "Tässä sinun tilanteesi" (new screen)

While this screen renders, call POST /api/placement/submit (see UPDATE 3).
Show skeleton (puheo-screen-template loading state) while waiting.

After API responds:
- Show a 2-3 sentence tutor assessment in Finnish (from API response: tutorAssessment).
  Large, centered, white text on dark card. NOT bullet points — prose.
  Style: warm, direct, specific. NOT "Your level is B." — see CURRICULUM_SPEC.md §7.

- Show 4 horizontal bars (one per area): Sanasto / Kielioppi / Kirjoittaminen / Luetun.
  Fill based on placement score per level. Use --accent for fill, --border for track.

- Show the suggested starting point:
  "Aloitamme [Kurssin N nimestä]." in accent color, 24px.

- If placement_confidence is "low": show a subtle note:
  "Vastasit nopeasti — aloitetaan rauhallisemmin varmistuksen vuoksi."
  (Do NOT shame. Just explain.)

CTA: "Aloitetaan! →" → goes to OB-4.

SCREEN OB-4 — "Sinun ensimmäinen viikkosi" (new screen)

Show a preview of the first week's plan from API response (firstWeekPlan array).

Layout: vertical list of 5 items (Mon–Fri), each item is a card row:
- Day label (Ma / Ti / Ke / To / Pe) in --text-subtle
- Task title (e.g. "Kurssi 1, oppitunti 1: Perussanasto")
- Estimated time ("~8 min")
- Task type icon (Lucide: BookOpen for vocab, Wrench for grammar, PenLine for writing)

Below the list: "Voit aina tehdä vapaita harjoituksia vasemman valikon kautta."
in --ink-faint, 14px.

CTA: "Aloita harjoittelu →" → if not logged in, goes to register/login screen.
     If already logged in, saves progress and goes to dashboard.

Apply puheo-screen-template card layout. Apply puheo-finnish-voice to ALL copy.
Verify all 4 screens at 1440 + 375. axe 0 violations on each screen.

=== UPDATE 3: New API endpoint POST /api/placement/submit ===

Create this endpoint in routes/auth.js or a new routes/placement.js file.

Request body:
```json
{
  "answers": [{ "id": "B4", "level": "B", "correct": true, "time_ms": 3200 }, ...],
  "selfReportedGrade": "B",
  "targetGrade": "M",
  "weakAreas": ["aikamuodot", "subjunktiivi"],
  "dailyGoalMinutes": 20
}
```

Server logic:
1. Run scorePlacementTest(answers) from lib/placement.js → { placementLevel, scoreByLevel }
2. Check timing: if median(answers.map(a => a.time_ms)) < 4000 → placement_confidence = "low"
3. Determine suggestedKurssi:
   - placementLevel A → kurssi_1
   - placementLevel B → kurssi_3
   - placementLevel C → kurssi_5
   - placementLevel M/E/L → kurssi_7
   - If placement_confidence === "low" → go one kurssi back (kurssi_1 minimum)
4. Generate tutorAssessment via OpenAI (callOpenAI from lib/openai.js):
   - Use puheo-ai-prompt system message preamble (see skill file)
   - Prompt (Finnish): "Oppilas on vastannut sijoitustestiin. Tulokset: [scoreByLevel JSON].
     Koulun arvosana: [selfReportedGrade]. Tavoite: [targetGrade].
     Vaikeat aiheet: [weakAreas join]. Kirjoita 2–3 lausetta suomeksi tutori-äänellä:
     missä oppilas on nyt ja mitä harjoitellaan ensin. Ole konkreettinen — mainitse
     tarkka aihe, ei abstrakti taso. Älä mainitse numeroita tai teknisiä termejä kuten
     'placementLevel'. Puhu suoraan oppilaalle (sinä-muoto)."
   - max_tokens: 120, temperature: 0.5
   - Cache to Supabase teaching_pages table with key "tutor_assessment_{userId}"
5. Generate firstWeekPlan: array of 5 objects (Mon–Fri), each:
   { day: "Ma", taskTitle: "...", estimatedMinutes: 8, type: "vocab"|"grammar"|"writing" }
   Generated deterministically from suggestedKurssi + dailyGoalMinutes (no AI needed).
   Example logic: day 1 = lesson 1 of suggestedKurssi, day 2 = lesson 2, etc.
   If dailyGoalMinutes >= 30 → add SR review as second task on day 3+.
6. If user is authenticated: save to users table:
   self_reported_grade, target_grade, weak_areas, daily_goal_minutes,
   placement_confidence, placement_kurssi, tutor_assessment
7. Return: { placementLevel, suggestedKurssi, tutorAssessment, firstWeekPlan }

Error handling: if OpenAI call fails → return a hardcoded Finnish fallback string
based on placementLevel (no AI, just a template). Never fail the whole endpoint.

Add requireAuth middleware OR allow unauthenticated (store in session for later save).
Check how existing auth routes handle this in routes/auth.js.

=== ORDER ===

1. Update 1 first (question quality + timing logic — pure lib changes, no UI risk).
2. Update 3 second (API endpoint — needed before OB-3 can render real data).
3. Update 2 last (all 4 onboarding screens — depends on API working).
4. Run axe at 1440 + 375 on each OB screen after Update 2. Fix any violations.
5. Write one IMPROVEMENTS.md line per update, prefixed [2026-04-28 L-PLAN-1].
6. Update AGENT_STATE.md: next loop = L-PLAN-2 (curriculum structure + Oppimispolku screen).
   Read CURRICULUM_SPEC.md §3 before starting L-PLAN-2.

Do NOT start L-PLAN-2 (curriculum structure) in this loop.
Do NOT touch the landing page. Do NOT bump SW unless STATIC_ASSETS change.

Source for onboarding UI: visit 21st.dev/s/stepper and 21st.dev/s/onboarding via Playwright,
screenshot 3 candidates to references/app/onboarding/, pick most restrained dark option.
Port React+Tailwind → vanilla. Cite exact component URL in IMPROVEMENTS.md.
