# Agent Prompt — L-PLAN-2: Curriculum structure + Oppimispolku screen

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

PAUSE before starting. This is L-PLAN-2 — the curriculum backbone.
Read CURRICULUM_SPEC.md §3, §4, §8, §9 in full before writing a single line of code.
Also read: lib/learningPath.js, lib/levelEngine.js, routes/progress.js.
Verify L-PLAN-1 shipped by checking IMPROVEMENTS.md for [2026-04-28 L-PLAN-1] lines.
If L-PLAN-1 is not listed, STOP and run L-PLAN-1 first.

=== CONTEXT ===

L-PLAN-1 added the placement flow and POST /api/placement/submit.
This loop builds the curriculum data layer (Supabase tables + seed data) and
the Oppimispolku screen where the student sees their 8-course path, current position,
and can navigate to any unlocked lesson. After this loop, a student can tap a lesson
and land on a teaching page + exercise — the learning loop is closed.

Skills to activate — read each SKILL.md before the relevant work:
- .claude/skills/puheo-screen-template/SKILL.md — card layout, empty/loading/error states
- .claude/skills/puheo-finnish-voice/SKILL.md — ALL copy
- .claude/skills/puheo-ai-prompt/SKILL.md — teaching page generation
- .claude/skills/ui-ux-pro-max/SKILL.md — a11y, touch targets, focus order

Education skills — read BEFORE the relevant sections listed below:
- .claude/skills/education/curriculum-knowledge-architecture-designer/SKILL.md
  → Read BEFORE writing the Supabase seed SQL (UPDATE 1).
    Apply to: verifying the 8-course sequence has no knowledge gaps — each kurssi
    must scaffold onto the previous one. Check that grammar_focus arrays reference
    LEARNING_PATH keys that actually exist in lib/learningPath.js.
- .claude/skills/education/backwards-design-unit-planner/SKILL.md
  → Read BEFORE writing curriculum_lessons seed data (UPDATE 1).
    Apply to: every lesson must have a measurable sub-goal in its `focus` field.
    "lesson 3 of kurssi 2" is not enough — "preteriti -er/-ir verbit: 80% accuracy" is.
- .claude/skills/education/interleaving-unit-planner/SKILL.md
  → Read BEFORE finalising lesson order within each kurssi (UPDATE 1).
    Apply to: ensure vocab + grammar + mixed lessons are interleaved, not blocked
    (all vocab, then all grammar). CURRICULUM_SPEC.md §3 already interleaves — verify seed matches.
- .claude/skills/education/worked-example-fading-designer/SKILL.md
  → Read BEFORE writing teaching_snippet content for curriculum_lessons (UPDATE 1).
    Apply to: early lessons in a kurssi get a teaching_snippet with a worked example;
    later lessons in the same kurssi get a shorter hint (fading support as competency builds).
- .claude/skills/education/formative-assessment-loop-designer/SKILL.md
  → Read BEFORE implementing the kertaustesti completion logic (UPDATE 2 and UPDATE 3).
    Apply to: the <80% path — generate 3 targeted remediation lessons, not generic retry.
    The tutorMessage on lesson complete must name the specific grammar rule that failed.
- .claude/skills/education/adaptive-hint-sequence-designer/SKILL.md
  → Read BEFORE writing the teaching page API endpoint (UPDATE 3).
    Apply to: the teaching page must not just explain — it must sequence hints from
    "here is the rule" to "here is a worked example" to "now you try" before the first exercise.
- .claude/skills/education/developmental-progression-synthesis/SKILL.md
  → Read BEFORE deciding kurssi unlock rules (UPDATE 2).
    Apply to: verify the A→B→C→M→E progression in the 8 kurssit matches developmental
    readiness. Kurssi 3 (preteriti) must not unlock until Kurssi 2 (irregular present) passes —
    preteriti irregular forms assume present tense automaticity.

Design plugin skills:
- design:ux-copy — run on ALL microcopy: kurssi titles, lesson labels, progress indicators,
  unlock messages, empty state ("Ei kursseja") and error state copy.
- design:accessibility-review — run AFTER the Oppimispolku screen is built. Check:
  keyboard navigation through course list, focus order, contrast on locked-state cards.
- design:design-critique — run on Playwright screenshot of finished Oppimispolku at 1440 + 375.

21st.dev sourcing rule (MANDATORY for every new UI component):
Before building the Oppimispolku course list and progress indicators:
1. Visit 21st.dev/s/timeline and 21st.dev/s/steps via Playwright
2. Screenshot 2 candidates to references/app/curriculum/21stdev/
3. Pick the most restrained dark option matching Puheo's Linear-tier aesthetic
4. Port React+Tailwind → vanilla CSS matching css/landing.css patterns
5. Cite exact 21st.dev component URL in IMPROVEMENTS.md

=== UPDATE 1: Database — tables + seed data ===

Create a new migration file: supabase/migrations/YYYYMMDD_curriculum.sql

1. Create tables from CURRICULUM_SPEC.md §8:
   - curriculum_kurssit (key, title, description, level, vocab_theme, grammar_focus[], lesson_count, sort_order)
   - curriculum_lessons (id, kurssi_key, sort_order, type, focus, exercise_count, teaching_snippet)
   - teaching_pages (topic_key, content_md, generated_at)
   - user_curriculum_progress (user_id, kurssi_key, lesson_index, completed_at, score_correct, score_total)
   - ALTER TABLE users: add self_reported_grade, target_grade, weak_areas, daily_goal_minutes,
     placement_confidence, placement_kurssi, tutor_assessment IF NOT EXISTS
     (L-PLAN-1 may have added some — check before adding)

2. Seed curriculum_kurssit with all 8 kurssit from CURRICULUM_SPEC.md §3.
   Map grammar_focus[] to LEARNING_PATH keys from lib/learningPath.js — use exact key strings.
   Example: Kurssi 3 grammar_focus = ['preterite_regular', 'preterite_irregular_common'].
   If a LEARNING_PATH key does not exist yet, ADD it to lib/learningPath.js first.

3. Seed curriculum_lessons for all 8 kurssit — one row per oppitunti from CURRICULUM_SPEC.md §3.
   teaching_snippet: 2 sentences max, Finnish, shown just before the lesson starts.
   - First lesson of each kurssi: full worked example in snippet (worked-example-fading-designer rule)
   - Last 2 lessons before the kertaustesti: snippet shrinks to one hint sentence only
   - Kertaustesti lesson: snippet = "Nyt testataan mitä olet oppinut — [topic]. [X] kysymystä."

4. Apply migration: run `npx supabase db push` or `supabase migration up` depending on project setup.
   Verify tables exist and row counts match expected (8 kurssit, 86 total lessons per CURRICULUM_SPEC.md).

=== UPDATE 2: API endpoints ===

Create routes/curriculum.js (new file). Mount at app.use('/api/curriculum', curriculumRouter).

Endpoints to implement (from CURRICULUM_SPEC.md §9):

GET /api/curriculum
  - Fetch all 8 kurssit from curriculum_kurssit, ordered by sort_order.
  - For authenticated users: JOIN user_curriculum_progress to compute per-kurssi:
      lessonsCompleted (count of completed lesson_index rows)
      lastScore (most recent score_correct/score_total)
      isUnlocked: kurssi_1 always true; kurssi_N unlocked if kurssi_{N-1} kertaustesti passed (score_correct/score_total >= 0.80)
  - For unauthenticated: return all kurssit with isUnlocked: true for kurssi_1 only, others false.
  - Return: { kurssit: [ { key, title, description, level, lessonCount, lessonsCompleted, isUnlocked, lastScore } ] }

GET /api/curriculum/:kurssiKey
  - Fetch kurssi details + all curriculum_lessons for that kurssi.
  - For auth users: include completion status per lesson from user_curriculum_progress.
  - Return: { kurssi, lessons: [ { id, sortOrder, type, focus, exerciseCount, teachingSnippet, completed, score } ] }

GET /api/curriculum/:kurssiKey/lesson/:lessonIndex
  - Fetch lesson details from curriculum_lessons.
  - If lesson type is 'grammar' or 'mixed' AND this is the FIRST time the user sees it:
      Check teaching_pages table for topic_key = "{kurssiKey}_lesson_{lessonIndex}".
      If not cached: generate via OpenAI (see below), cache, return.
      If cached: return from cache.
  - Exercises: do NOT generate exercises in this endpoint — exercises are already handled
    by existing routes/exercises.js. Return lesson metadata only; frontend calls exercises.js separately.
  - Return: { lesson, teachingPage: { contentMd } | null }

  Teaching page generation (OpenAI):
  - Use puheo-ai-prompt system preamble (see skill file)
  - Prompt: "Kirjoita opetussivu aiheesta: [lesson.focus]. Rakenne TARKASTI:
    # [Otsikko]
    [1 kappale, max 80 sanaa, selkokielinen suomi]
    ## Muodostus
    [Taulukko tai listaus — vain jos kielioppiaihe]
    ## Esimerkki
    > [1–2 lausetta espanjaksi + käännös]
    ## YO-vinkki 💡
    [1–2 lausetta mitä YO-koe testaa tästä aiheesta]"
  - max_tokens: 400, temperature: 0.3
  - Cache result in teaching_pages with topic_key = "{kurssiKey}_lesson_{lessonIndex}"

POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete
  - requireAuth middleware
  - Body: { scoreCorrect, scoreTotal }
  - Upsert into user_curriculum_progress.
  - If this lesson is the kertaustesti (type = 'test'):
      If score >= 80%: mark kurssi complete, unlock next kurssi, generate tutorMessage (success path)
      If score < 80%: generate tutorMessage (remediation path — name specific failing topic)
  - tutorMessage generation:
      Success: "Kurssi [N] suoritettu! [1 sentence praising the hardest thing they learned]. Jatketaan [next kurssi title]een."
      Remediation: "Hyvin meni, mutta [specific grammar topic from failing lessons] tarvitsee vielä harjoittelua.
                   Harjoitellaan lisää ennen etenemistä." Max 2 sentences. Finnish, tutor voice.
      Fallback (if OpenAI fails): hardcoded Finnish template per kurssi — never fail the endpoint.
  - Return: { kurssiComplete, nextKurssiUnlocked, nextKurssiKey, tutorMessage }

Error handling:
  - 404 if kurssiKey not in DB.
  - 403 if kurssi is locked for this user (isUnlocked = false).
  - All DB errors return Finnish error string (puheo-finnish-voice: "Jokin meni pieleen — yritä uudelleen").

=== UPDATE 3: Oppimispolku screen ===

Read the existing app.html for "#screen-" naming convention and how screens are shown/hidden.
Read js/app.js or js/screens/ to understand the screen switching pattern.
Do NOT break existing screens.

Add a new screen: #screen-oppimispolku (or #screen-curriculum — match whichever convention exists).
Wire it to the left nav item that currently exists for "Oppimispolku" (grep app.html for the label).

Layout (Desktop 1440px):
- Page header: "Oppimispolku" h2 + subtitle "8 kurssia · YO-koevalmiiksi"
- Sourced step/timeline component from 21st.dev (see 21st.dev sourcing rule above)
- 8 kurssi cards in a vertical list (not grid — progress is linear):
  Each card (80px tall, full-width):
    LEFT: step number circle (filled accent = current, filled success = done, outline = locked)
    CENTER: kurssi title + level chip (A/B/C/M/E) + progress bar ("X / Y oppituntia")
    RIGHT: status label ("Suoritettu ✓" / "Jatka →" / "Lukittu 🔒") or CTA button

  Locked kurssit: card is dimmed (opacity 0.45), cursor not-allowed, no click.
  Current kurssi: card has accent left border (3px solid var(--accent)).
  Completed kurssit: muted success color, no CTA.

- Tap/click on unlocked kurssi → expands inline (no new screen) to show lesson list.
  Lesson list: compact rows (48px each):
    - Lesson number + type icon (BookOpen=vocab, Wrench=grammar, BookText=mixed, PenLine=writing, CheckSquare=test)
    - Focus label (e.g. "Preteriti -ar verbit")
    - Completion tick or "Aloita" CTA
  - Tap on uncompleted lesson → navigate to #screen-lesson (see below)

Layout (Mobile 375px):
- Same vertical list, cards stack full width.
- Step number circle shrinks to 32px.
- Progress bar below title (not inline).
- Lesson list expands below card, same compact rows.

Loading state: 8 skeleton cards (gray bars matching final layout, shimmer 1400ms).
Empty state (no auth): show kurssi_1 card unlocked + rest locked + "Rekisteröidy nähdäksesi oma polkusi" CTA.
Error state: "Ei yhteyttä — yritä uudelleen" + retry button.

Add a new screen: #screen-lesson
This screen shows ONE lesson: teaching page (if available) + CTA to start exercises.

Layout:
- Back button "← Oppimispolku" top-left.
- Teaching page rendered as Markdown (use existing MD renderer if available, else simple innerHTML with sanitization).
  Wrap in card: max-width 640px, centered, dark surface, padding 32px.
- Below teaching page (or directly if no teaching page): 
  "Aloita harjoittelu →" CTA button (full-width on mobile, auto on desktop).
  This button navigates to the appropriate exercise mode (vocab → existing vocab screen,
  grammar → existing grammar screen) with the lesson's kurssiKey + lessonIndex passed as context.
  For now: pass context via sessionStorage { currentLesson: { kurssiKey, lessonIndex, type } }.
  The exercise screens don't need to read this in this loop — that's L-PLAN-3.
- After exercises complete (L-PLAN-3 will wire this): call POST .../complete and show result.
  For now: show a "Merkitse suoritetuksi" button that calls the complete endpoint with a mock score.
  (Temporary — L-PLAN-3 will replace with real score from exercises.)

Apply puheo-screen-template card layout to ALL cards and sections.
Apply puheo-finnish-voice to ALL copy (kurssi titles, lesson labels, status labels, empty states, errors).
Verify at 1440 + 375. axe 0 violations.

=== ORDER ===

1. Update 1 first (DB migration + seed — no UI risk, pure data).
2. Update 2 (API endpoints — needed before screen can load real data).
3. Update 3 last (Oppimispolku + Lesson screens — depends on API).
4. Run axe at 1440 + 375 on Oppimispolku screen. Fix any violations.
5. Playwright screenshot at 1440 + 375 → run design:design-critique against it → fix issues.
6. Write one IMPROVEMENTS.md line per update, prefixed [2026-04-28 L-PLAN-2].
7. Update AGENT_STATE.md: next loop = L-PLAN-3 (exercise loop wired to curriculum + tutor voice on dashboard).

Do NOT start L-PLAN-3 in this loop.
Do NOT touch the landing page. Do NOT bump SW unless STATIC_ASSETS change.
Do NOT modify existing exercise screens — only add curriculum context to sessionStorage.
