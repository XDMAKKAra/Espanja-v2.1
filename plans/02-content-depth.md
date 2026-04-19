# Pass 2 — Content depth (single prompt, content not code)

You are working in `C:\Users\marce\OneDrive\Documents\espanja paska\`. Puheo's biggest weakness right now is content depth: not enough exercises, passages, prompts. AI-generated exercises feel samey because there's no hand-curated seed bank to anchor variety. This pass **fixes content, not code**.

**Do NOT begin until Pass 0 (exercise types) and Pass 1 (design system) are both fully merged to `main`.** The new exercise types define the schemas content must fit; the design system defines how content renders. Seeding before those land wastes work.

## Skills

No coding skill needed — this pass is curation + generation + QA. However, the `claude-education-skills` library (installed under `.claude/skills/claude-education-skills/`) has 6 skills that directly sharpen this work. Load them before generating content:

- **Vocabulary Tiering** — sorts the 500-item vocab seed into Tier 1 (everyday) / Tier 2 (academic/exam) / Tier 3 (domain-specific). YO-koe rewards Tier 2; enforce the target ratio below.
- **Retrieval Practice Generator** — shapes exercise prompts to demand retrieval (produce from memory), not recognition. Apply to aukkotehtävä, käännös, lauseen muodostus seeds.
- **Cognitive Load Calibrator** — flags reading passages / sentences that over-tax working memory for a B1 learner. QA gate for reading-passages.json and aukkotehtava.json.
- **Academic Sentence Frames** — Spanish sentence starters ("En mi opinión…", "A pesar de que…") tied to genre. Feeds writing-prompts.json `example_high_score_essay` + rubric.
- **Assessment Validity Checker** — does this item measure what it claims to measure? QA gate applied post-generation, before marcel review.
- **Scaffolded Task Modification** — generates A2 warm-up variants of B1 items for struggling students. Used for the `cefr` field's A2 slice.

Your job is to pair with marcel to produce content using these skills as guardrails, then QA it.

## Scope

Hand-curate (with AI assist) seed banks for every exercise type, across the YTL lyhyt oppimäärä B1 topic list. Deliverables are **data files committed under `data/seeds/`**, not code changes. Schema defined in `exercises/SHARED.md` §1.

## Topic list (YTL lyhyt oppimäärä scope)

Anchor on the topics Puheo already tags in `lib/exerciseComposer.js` `TYPE_TOPIC_AFFINITY`. If that list is incomplete vs the YTL syllabus, extend it (flag each addition for marcel approval). Core topics include but aren't limited to:

- ser / estar
- preterite vs imperfect
- subjunctive (present — past subjunctive OUT of scope per grammar scope rules)
- por / para
- reflexives
- direct / indirect object pronouns
- gustar-class verbs
- comparatives / superlatives
- future + conditional (simple only)
- common irregulars
- topical vocab: perhe, koulu, harrastukset, matkustaminen, ruoka, terveys, kaupunki, luonto, työelämä, teknologia, media, kulttuuri, tunteet, aika + päivämäärät, numerot + raha, kodin esineet, vaatteet, kehon osat

## Deliverables

Produce files under `data/seeds/`:

### 1. `data/seeds/vocab.json` — 500 items
Per item: `{ id, topic, cefr, spanish, finnish, pos, context, alt_translations[] }`. Every item has a real Spanish context sentence (not "Esta es una casa" placeholders). 20 topic buckets × 25 items each. CEFR distribution: ~70% B1, ~20% A2, ~10% B2. Reject duplicates by `spanish` stem.

### 2. `data/seeds/reading-passages.json` — 60 passages
Per passage: `{ id, topic, cefr, title, body (80-150 words), questions[] }` where each question has `{ question_fi, rubric, sample_answer_fi }`. 2–4 questions per passage. Questions must be in Finnish, require inference (not just copy-paste from passage), and mirror real YO reading-section questions.

### 3. `data/seeds/writing-prompts.json` — 30 prompts
Per prompt: `{ id, genre ("message" | "opinion" | "description" | "narration"), cefr, topic, prompt_fi, min_words, max_words, rubric, example_high_score_essay }`. 4 genres × 7–8 prompts each. Length targets match YTL norms (80–120 words typical).

### 4. `data/seeds/aukkotehtava.json` — 40 per topic × 12 topics = 480 items
Per item: `{ id, topic, cefr, sentence_with_gap, answer, alt_answers[], hint_fi }`. Gap always the target learning point (e.g. ser/estar conjugation for ser_estar topic).

### 5. `data/seeds/matching.json` — 40 sets per topic × 12 topics = 480 sets
Per set: `{ id, topic, cefr, subtype ("fi_es" | "halves" | "qa" | "def"), pairs[] }` where `pairs[]` has 4–6 entries each.

### 6. `data/seeds/translation.json` — 20 pairs per topic × 12 topics = 240 items
Per item: `{ id, topic, cefr, finnish, valid_spanish[] (3-5 alternatives), grammar_note_fi }`.

### 7. `data/seeds/sentence-construction.json` — 20 per topic × 12 topics = 240 items
Per item: `{ id, topic, cefr, finnish_prompt, required_words[] (3-5 Spanish words), sample_answers[] (2-3), rubric }`.

### 8. `data/seeds/grammar.json` — 15 items per in-scope rule
Per item: `{ id, rule, cefr, subtype ("gap" | "correction" | "transform" | "pick_rule"), prompt_fi, body, correct, explanation_fi }`. Covers every rule in `lib/grammarScope.js` scope list.

## QA process

Generate in batches of 50–100 per file. After each batch, **stop and run the QA checklist**. Don't accumulate 500 items before reviewing — you'll find systematic errors late.

QA checklist per batch:
- **Finnish accuracy:** every Finnish string checked for diacritics, word order, register (use `sinä` not `te` — this is a study app for teens, not a formal letter).
- **Spanish accuracy:** every Spanish string grammar-checked. No ambiguous translations marked as single-answer.
- **Scope compliance:** nothing uses past subjunctive, conditional perfect, passive voice, future subjunctive (out of B1 scope).
- **No duplicates:** by stem within a file; by stem + topic across files where the content overlaps.
- **CEFR tag honest:** B1 items shouldn't secretly require B2 vocab. Cross-check with **Cognitive Load Calibrator** for reading passages and longer sentences.
- **Distractors fair:** same part of speech, same tense, plausible from context.
- **Ambiguity handled:** matching pairs don't have two correct answers; translation has `valid_spanish[]` covering real alternatives.
- **Validity:** apply **Assessment Validity Checker** — does this item actually test the topic it's tagged with, or does it accidentally test reading speed / vocab guessing / something else?
- **Tier mix (vocab only):** apply **Vocabulary Tiering** — target ratio is roughly 35% Tier 1 / 50% Tier 2 / 15% Tier 3. YO-koe rewards Tier 2; over-indexing on Tier 1 means we're teaching kids words they already know.

## Wire-up commits (minimal code)

After content lands, one small wire-up commit:
- Add a `data/seeds/index.json` manifest listing every seed file + count + last-updated timestamp.
- Update `lib/exerciseComposer.js` bank-first probability config so new types prefer seeds over on-demand generation when the seed bank has coverage.
- Add a boot-time sanity check that logs seed-bank stats (`500 vocab, 60 passages, …`) on server start.

## Ground rules

- **Curate, don't just generate.** AI-generated seeds that you haven't eyeballed are worse than no seeds — they'll embed AI quirks into every student session forever. Plan time for review, not just time for generation.
- **Finnish UI strings** go to `js/ui/strings.js`, not into seeds. Seeds are content, not UI copy.
- **Progress visibility.** After each batch, post a count: "50 vocab done, 450 to go, flagged 3 for review."
- **Batch commits.** One commit per batch of ~100 items per file, with a short note listing flagged items.

## Stop at checkpoints

After each of the 8 files hits its target count, stop and report:
- Count per topic bucket (even distribution?).
- CEFR distribution.
- Items flagged for marcel review (expect 2–5% — stuff the model was uncertain about).
- Any scope violations you auto-rejected.

Wait for marcel's OK before moving to the next file.

## Done

- 8 seed files populated to target counts.
- `data/seeds/index.json` manifest.
- Wire-up commit merged.
- `data/seeds/POSTSHIP.md` — one-page summary: total item count, cost spent on generation, QA flag rate, any deferred decisions.
