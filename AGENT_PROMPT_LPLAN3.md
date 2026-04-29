# Agent Prompt — L-PLAN-3: Exercise loop wired to curriculum + Tutor voice on dashboard

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

PAUSE before starting. This is L-PLAN-3.
Read CURRICULUM_SPEC.md §4, §5, §7 in full before writing a single line of code.
Verify L-PLAN-2 shipped: check IMPROVEMENTS.md for [2026-04-28 L-PLAN-2] lines.
If L-PLAN-2 is not listed, STOP and run L-PLAN-2 first.

Also read:
- routes/exercises.js — existing exercise generation + grading
- routes/progress.js — existing progress saving
- routes/curriculum.js — the new file from L-PLAN-2
- js/screens/ (or app.js) — existing exercise screen flow to understand how scores are collected

=== CONTEXT ===

L-PLAN-2 added the 8-kurssi data layer and Oppimispolku screen, with a temporary
"Merkitse suoritetuksi" button instead of real exercise scoring.
This loop wires the exercise modes to the curriculum: when a student starts a lesson,
exercises are generated in the right topic + level, their score is recorded, and they
get a tutor message after each session. The dashboard also gets a real AI-generated
daily greeting instead of a hardcoded message.

Skills to activate — read each SKILL.md before the relevant work:
- .claude/skills/puheo-screen-template/SKILL.md — results card, tutor message states
- .claude/skills/puheo-finnish-voice/SKILL.md — ALL tutor messages, feedback copy
- .claude/skills/puheo-ai-prompt/SKILL.md — ALL OpenAI calls in this loop
- .claude/skills/ui-ux-pro-max/SKILL.md — a11y on results screen

Education skills — read BEFORE the relevant sections listed below:
- .claude/skills/education/retrieval-practice-generator/SKILL.md
  → Read BEFORE modifying exercise generation (UPDATE 1).
    Apply to: exercises generated for a curriculum lesson must use spaced retrieval principles —
    new vocabulary introduced in the first exercise must reappear in the last exercise of the session.
    Pass lesson focus (e.g. "preteriti -ar verbit") to the exercise prompt as a constraint.
- .claude/skills/education/practice-problem-sequence-designer/SKILL.md
  → Read BEFORE implementing lesson exercise ordering (UPDATE 1).
    Apply to: within a session, sequence exercises from recognition → production.
    For grammar: first fill-in-the-blank (recognition), then sentence construction (production).
    Do not mix recognition and production randomly — order matters for cognitive load.
- .claude/skills/education/formative-assessment-loop-designer/SKILL.md
  → Read BEFORE implementing the lesson completion + tutorMessage flow (UPDATE 2).
    Apply to: the tutorMessage after a session must close the loop — it must reference what
    the student just did, identify one gap (if any), and name the very next step.
    Never give a tutorMessage that could apply to any student equally.
- .claude/skills/education/error-analysis-protocol/SKILL.md
  → Read BEFORE writing the tutorMessage OpenAI prompt (UPDATE 2).
    Apply to: the prompt must pass the specific wrong answers to the AI, not just a score.
    The AI must cite the shortest contiguous error span, name the rule, show the correction.
    See also: puheo-ai-prompt §6 (error excerpt rule).
- .claude/skills/education/metacognitive-prompt-library/SKILL.md
  → Read BEFORE writing the post-session results screen copy (UPDATE 2).
    Apply to: after showing score, show ONE metacognitive prompt (not a question — a
    reflection sentence) that helps the student notice their own pattern.
    Example: "Huomasit varmasti, että preteriti -ir verbeissä on eri pääte kuin -ar verbeissä."
    This is shown below the score, above the tutorMessage. Max 1 sentence.
- .claude/skills/education/intelligent-tutoring-dialogue-designer/SKILL.md
  → Read BEFORE writing the dashboard tutor greeting (UPDATE 3).
    Apply to: the greeting is a dialogue move, not a notification. It must acknowledge the
    student's last action specifically, then give one concrete next step. Never generic.
- .claude/skills/education/flow-state-condition-designer/SKILL.md
  → Read BEFORE designing the fast-track trigger UI (UPDATE 2).
    Apply to: 3 consecutive lessons >85% = offer to skip ahead. The offer must be framed
    as a choice, not an automatic redirect. The student must feel in control of their pace.
- .claude/skills/education/self-efficacy-builder-sequence/SKILL.md
  → Read BEFORE finalising all post-session copy (UPDATE 2 and UPDATE 3).
    Apply to: error feedback must not shame. Progress messages must be specific and earned.
    "Hyvin meni!" alone is banned — must follow with what specifically went well.

Design plugin skills:
- design:ux-copy — run on ALL microcopy: post-session labels, score display, fast-track offer,
  dashboard greeting format, error messages in exercises.
- design:accessibility-review — run AFTER the post-session results card is built.
- design:design-critique — run on Playwright screenshot of the results card at 1440 + 375.

21st.dev sourcing rule (MANDATORY for new UI components):
The post-session results card is a new component. Before building it:
1. Visit 21st.dev/s/results and 21st.dev/s/score-card via Playwright
2. Screenshot 2 candidates to references/app/results/21stdev/
3. Pick the most restrained dark option
4. Port to vanilla CSS. Cite URL in IMPROVEMENTS.md.

=== UPDATE 1: Wire exercise generation to curriculum lesson context ===

When a student taps "Aloita harjoittelu →" on #screen-lesson (L-PLAN-2), sessionStorage
contains { currentLesson: { kurssiKey, lessonIndex, type } }.

Modify the exercise generation calls in routes/exercises.js to accept optional
lesson context: { kurssiKey, lessonIndex } in the request body.

When lesson context is provided:
1. Fetch the lesson from curriculum_lessons (kurssiKey + lessonIndex).
2. Use lesson.focus as a constraint in the exercise prompt:
   Add to the OpenAI prompt: "Tehtävät liittyvät TARKASTI aiheeseen: [lesson.focus].
   ÄLÄ generoi tehtäviä muista aiheista. Kaikki tehtävät testaavat tätä yhtä rakennetta."
3. Use lesson.kurssi.level as the difficulty level (replace user's current level if different).
4. exercise_count from curriculum_lessons.exercise_count (default 8).

For the kertaustesti lesson (type = 'test'):
- Generate 15 mixed questions across all grammar_focus[] topics of the kurssi.
- Add to prompt: "Tämä on kertaustesti. Tehtävät kattavat tasaisesti kaikki kurssin aiheet:
  [kurssi.grammar_focus join]. Älä painota yhtä aihetta yli muiden."
- Track which topic each question belongs to (add topic_key field to exercise response).
  This is used by UPDATE 2 to generate targeted tutorMessage.

For lessons without curriculum context (free practice): behavior unchanged.

Do NOT break existing free-practice flow. The lesson context is always optional.

=== UPDATE 2: Post-session results + lesson completion ===

After a student completes all exercises in a curriculum lesson, show a results card.
Currently the exercise flow probably shows some result UI — extend it rather than replace.

Post-session results card (new component, sourced from 21st.dev per rule above):

Top section:
- Score display: "X / Y oikein" in large mono-num font (--accent color for good score, --warn for low).
- Accuracy ring or bar: X% filled. Simple, not animated excessively.

Middle section (metacognitive prompt — from metacognitive-prompt-library skill):
- 1 sentence in --ink-soft, italic, 15px. Not a question — a reflection observation.
  Generated from the wrong answers pattern. If all correct: a positive observation about mastery.
  Example: "Preteriti -ir verbeillä oli hieman enemmän virheitä kuin -ar verbeillä — ihan normaalia tässä vaiheessa."
  This is NOT the tutorMessage — it's shorter and more neutral.

Bottom section (tutorMessage):
- 2–3 sentences, Finnish, warm and specific (from OpenAI — see prompt below).
- If score ≥ 80%: celebrate the specific thing + preview next lesson.
- If score < 80%: name the exact failing pattern + say what happens next (3 extra practice lessons on that topic).
- Show while fetching with skeleton (1 sentence placeholder height).

CTAs:
- Primary: "Jatka oppimispolkua →" → back to #screen-oppimispolku.
- Secondary (only if score ≥ 80% and lesson was kertaustesti): "Aloita [next kurssi title] →"
- Fast-track offer (only if 3 consecutive >85%): inline callout below score:
  "Menet hienosti! Hypätäänkö suoraan seuraavaan oppituntiin?" [Kyllä] [Ei, jatkan tästä]

tutorMessage OpenAI prompt:
- Use puheo-ai-prompt system preamble.
- Pass: scoreCorrect, scoreTotal, wrongAnswers[] (with topic_key + correct_answer + student_answer),
  lesson.focus, kurssiKey, lessonIndex.
- Prompt (Finnish): "Oppilas suoritti oppitunnin aiheesta '[lesson.focus]'. Tulos: [X/Y].
  Väärät vastaukset: [wrongAnswers map to 'opiskelija kirjoitti X, oikea vastaus Y (aihe: topic_key)'].
  Kirjoita 2–3 lausetta suomeksi tutori-äänellä. Jos virheitä on: mainitse juuri se rakenne
  jossa virheitä oli, selitä lyhyt sääntö, kerro seuraava askel. Jos kaikki oikein:
  mainitse mitä konkreettisesti hallitaan nyt, vihjaa seuraavaan aiheeseen.
  Älä mainitse pistemäärää numerona. Puhu suoraan oppilaalle (sinä-muoto)."
- max_tokens: 150, temperature: 0.5
- On OpenAI failure: return hardcoded Finnish template based on score range. Never fail the endpoint.

After showing results, call POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete
with { scoreCorrect, scoreTotal }. This was built in L-PLAN-2 — use it.

Remove the temporary "Merkitse suoritetuksi" button from #screen-lesson (L-PLAN-2 added this).
Replace with the real results flow above.

=== UPDATE 3: Dashboard tutor greeting ===

Read CURRICULUM_SPEC.md §7 (Tutoriääni) before implementing.

GET /api/dashboard/tutor-message endpoint (add to routes/curriculum.js or routes/progress.js):

requireAuth (if no auth, skip — return null).

Server logic:
1. Check Supabase `users` table for last cached tutor_assessment — if generated within 24h, return it.
2. Fetch context for this user:
   - Last session: most recent row from user_curriculum_progress (kurssi_key, lesson_index, score_correct, score_total, completed_at)
   - Current kurssi: users.placement_kurssi (or derive from progress)
   - Days to exam: users.exam_date — today (if exam_date set, else null)
   - Weakest area: from users.weak_areas[0] (from placement)
3. Build OpenAI prompt (puheo-ai-prompt system preamble):
   "Oppilas: kurssi [N]/8, viimeisin oppitunti '[lesson.focus]', tulos [X/Y].
   Heikin alue: [weak_areas[0]]. Päiviä yo-kokeeseen: [N tai 'ei asetettu'].
   Kirjoita 1–2 lausetta suomeksi tutori-äänellä. Esimerkit oikeasta tyylistä:
   'Hyvä putki! Eilen preteriti sujui hyvin — tänään mennään imperfektiin.'
   'Subjunktiivi tuottaa vielä haasteita. Tänään harjoitellaan sitä lisää.'
   '152 päivää kokeeseen. Olet kurssilla 3/8 — hyvää vauhtia.'
   Älä kopioi esimerkkejä — generoi uusi, spesifi viesti tälle oppilaalle."
   max_tokens: 80, temperature: 0.7
4. Cache result to users.tutor_assessment + users.tutor_assessment_at (add column if needed).
5. Return: { message: "..." }
6. On OpenAI failure: return one of 4 hardcoded Finnish fallback strings based on time of day.
   Never fail the endpoint.

Frontend (dashboard screen):
- Add a tutor message card at the top of the dashboard, above all other content.
  Card: max-width 640px, centered, dark surface, no header — just the message text.
  Font: 17px, --ink, line-height 1.6. No avatar, no icon — just the words.
  Loading: 2-line skeleton shimmer.
  On null (unauthenticated): show nothing (hide card entirely).
- Call GET /api/dashboard/tutor-message on dashboard load.
- Do NOT re-fetch on every render — cache in sessionStorage for the session.

=== ORDER ===

1. Update 1 (exercise wiring — pure backend change, no new UI).
2. Update 3 (dashboard tutor greeting — independent of Update 2, can run in parallel but do 3 before 2).
3. Update 2 (post-session results — depends on Update 1 for score data).
4. Remove the temporary "Merkitse suoritetuksi" button from #screen-lesson.
5. Run axe at 1440 + 375 on: results card, dashboard (with tutor greeting). Fix violations.
6. Playwright screenshot results card + dashboard at 1440 + 375 → design:design-critique → fix.
7. Write one IMPROVEMENTS.md line per update, prefixed [2026-04-28 L-PLAN-3].
8. Update AGENT_STATE.md: next loop = L-PLAN-4 (streak system + fast leveling UI + Kurssi 1 seed content full test).

Do NOT start L-PLAN-4 in this loop.
Do NOT touch the landing page. Do NOT bump SW unless STATIC_ASSETS change.
Do NOT rewrite existing exercise screens — only extend with curriculum context + results card.
