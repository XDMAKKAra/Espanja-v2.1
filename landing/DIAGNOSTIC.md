# Diagnostic Redesign Spec — Puheo Pass 3

Covers both `diagnose.html` (full-page standalone) and the inline mini-diagnostic in `index.html`.

---

## Current State Audit

### `diagnose.html`

The standalone diagnostic page has a multi-screen SPA structure:
- Screen 1: Intro with 3 stats, big CTA button.
- Screen 2: Test questions (15 questions, adaptive difficulty).
- Screen 3: Results + email capture.

**What's working:**
- Correct Cuaderno design tokens in inline CSS.
- Multi-level difficulty (B1/B2/C1 tagging visible from CSS).
- Result screen shows grade + breakdown by category.

**What's broken:**
- 15 questions is too many — dropout before completion is high. Students open on phone between classes; 15 MCQs = ~8 minutes = abandonment.
- The email gate comes BEFORE showing the result ("Saa tuloksesi — jätä sähköpostisi"). This is an email wall. It kills trust and conversion for students who have privacy concerns.
- The intro screen shows 3 "stats" (e.g., number of questions, time) but no concrete promise about what the result means. "Selvitä tasosi" is vague. "Saat arvosana-arvion + kolmen heikoimman alueesi lista" is concrete.
- No grade scale explanation. Finnish students who don't know I/A/B/C/M/E/L can't interpret their result.
- On mobile, the `test-options` have `font-size: 15px` with full-width cards — good. But the progress bar is very thin (4px) — barely visible.
- Nav links to `app.html` but not contextually — a student who just completed the test wants to go directly to the exercise type they failed, not the app home.

### `index.html` mini-diagnostic

- Only 3 questions — feels like a demo, not a real assessment.
- Same email-before-grade problem.
- Grade displayed as raw letter ("C") with no scale explanation.
- "Aloita arvio" button has same styling as hero primary CTA — visual hierarchy confusion.

---

## Redesigned `diagnose.html`

### Architecture

8 questions, adaptive (starts B1, adjusts up or down based on performance). Total time: ~3 minutes.

Screens:
```
[intro] → [question × 8] → [result (shown unconditionally)] → [email capture (optional)]
```

No email wall. Grade shown first. Email asked after.

---

### Screen 1: Intro

```
[nav: logo | Kirjaudu sisään | Aloita ilmaiseksi]

[centered, max-width 480px]

ADAPTIIVINEN TAITOTASO-ARVIO

Missä tasolla olet espanjassa?

Vastaa 8 kysymykseen — saat:
• Arvosana-arvion (I–L)
• Kolmen heikoimman alueesi lista
• Henkilökohtainen harjoitussuunnitelma

↓

[button: Aloita arvio — 3 minuuttia →]

Ei kirjautumista. Vastauksesi pysyvät selaimessasi.
```

**Stats removed** — they added noise without value. Replaced with a concrete promise of what the result gives.

---

### Screen 2: Questions

**Question display:**

```
[progress: ━━━━━━━━━━━━━━━░░░░░░░  3/8]
[question type badge: SANASTO / KIELIOPPI / LUETUN YMMÄRTÄMINEN]
[difficulty indicator: Taso B1 / B2 / C1 — subtle, not anxiety-inducing]

[question stem — large serif font]
¿Qué significa "el ayuntamiento"?

[options — 1-column on mobile, 2-column on desktop]
  [A] kaupungintalo
  [B] sairaala
  [C] koulu
  [D] yliopisto
```

After answering:
- Correct: option turns green, brief explanation shown (1 sentence max), "Seuraava →" appears.
- Wrong: selected option turns red, correct option highlighted green, explanation shown, "Seuraava →" appears.
- Timer: NO visible countdown timer. Anxiety kills performance and trust on an assessment page. Exam simulation has a timer; the diagnostic does not.

**Question bank: reuse existing `data/diagnose_questions.json`** — 60 questions already exist, 10 per grade level (A, B, C, M, E, L), evenly distributed across sanasto (24), kielioppi (18), luettu (18). Don't write new questions. Select 8 that cover the grade scale with adaptive branching.

**Base path (fixed 8-question sequence, no branching):**

| # | Level | Type | Suggested ID (from existing bank) | Topic |
|---|-------|------|-----------------------------------|-------|
| Q1 | A | sanasto | A-V1 `la casa` | Baseline — any student taking Spanish can answer |
| Q2 | A | kielioppi | A-G1 `Yo ___ estudiante` | Basic ser/hay distinction |
| Q3 | B | sanasto | B-V1 (pick a B-level vocab) | Medium vocabulary |
| Q4 | C | kielioppi | C-G1 (pick a ser/estar distinction) | Intermediate grammar |
| Q5 | C | luettu | C-R1 (pick a 2-sentence reading) | Reading comprehension |
| Q6 | M | kielioppi | M-G1 (subjunctive trigger, e.g., `es importante que`) | Key YO-koe discriminator |
| Q7 | E | sanasto | E-V1 (formal/academic vocabulary) | Upper-level vocabulary |
| Q8 | L | kielioppi | L-G1 (condicional or complex subjunctive) | Laudatur discriminator |

**Adaptive branching (optional, v2):** If Q1–Q2 both wrong, replace Q3–Q4 with easier A-level questions. If Q1–Q4 all correct, replace Q5 with an M-level question to test harder earlier. Keep Q6–Q8 as the "grade-ceiling discriminators" regardless of branch.

**Grade estimate formula:** Weight each correct answer by the CEFR-mapped weight of its level (A=1, B=1.2, C=1.5, M=2, E=2.5, L=3). Sum the correct-answer weights and map to a letter grade band (see grade-mapping section below).

Selecting the exact 8 IDs from the 60-question bank is a commit-11 implementation detail. The rule: one Q from each of A, B, C, M, E, L levels, plus two extras from C and M (the mid-band where most students land).

**Difficulty badge language:** Use "Perustaso / Keskitaso / Vaativa" in Finnish (not B1/B2/C1 which requires CEFR knowledge). The internal system tracks CEFR but displays in plain Finnish.

---

### Screen 3: Result (shown unconditionally — no email required)

```
[large grade letter, ochre gradient: e.g. "C"]
Arviomme: arvosana C — Tyydyttävä

[grade scale key — always shown]
Arviointiasteikko: I · A · B · C · M · E · L
                   ↑ hylätty           laudatur ↑

[breakdown table]
┌────────────────────────────┐
│ Sanasto        ●●●●○  Hyvä  │
│ Kielioppi      ●●○○○  Kehit. │
│ Luetun ymm.    ●●●○○  Koht. │
└────────────────────────────┘

Heikoin alue: Kielioppi — erityisesti subjunktiivi ja preteriti/imperfekti-ero

Tavoite arvosanaan M: noin 6–8 viikkoa säännöllisellä harjoittelulla

[primary CTA: Tee henkilökohtainen harjoittelusuunnitelma →]
  → links to app.html (pre-filled with weak areas if URL params support it)

[secondary: Aloita harjoittelu suoraan →]
  → links to app.html?focus=grammar

─────────────────────────────────

[email section — below the fold, after result is visible]

Haluatko viikoittaisen harjoittelusuunnitelman sähköpostiisi?

[email input: email@esimerkki.fi]
[submit: Saa suunnitelma →]

Ei roskapostia. Voit peruuttaa milloin tahansa.
```

**Key UX decisions:**
1. Grade shown at top, prominent, immediately — student gets value first.
2. Grade scale explained inline — no confusion.
3. Breakdown table uses bullet/dot indicators, not just numbers — more scannable on mobile.
4. "Heikoin alue" is the personalized hook — student sees their specific gap, not generic advice.
5. Primary CTA goes to app.html — natural next step after assessment.
6. Email input is BELOW the CTAs — not a gate. Student has already gotten value. Email is optional bonus.

**Email submit behavior:**
- POST to Resend with tag `diagnostic_result`, include grade and weakest area in the email payload.
- Show: "Kiitos! Saat harjoittelusuunnitelman sähköpostiisi pian. Aloita harjoittelu nyt →"
- No email wall — "Ei kiitos" always available.

---

### Post-exam State

After 28.9.2026:
- Intro text changes to "Harjoittele espanjaa ensi kevään YO-koetta varten" (or similar).
- Grade calculation logic unchanged — still useful for students who want to practice year-round.
- This requires a date check in JS, same pattern as urgency bar.

---

## Redesigned Mini-Diagnostic (index.html)

### Changes from current

| | Current | Redesigned |
|--|---------|-----------|
| Questions | 3 | 5 |
| Email | Before grade (wall) | After grade (optional) |
| Grade scale | Not shown | Always shown (I–L key) |
| "Next" button | Shown immediately | Requires answer selection |
| CTA styling | Same as hero primary | Distinct secondary button style |
| Mobile options | 2-column grid | 1-column on ≤520px |
| Hover bug | Background #261818 (dark) | Corrected to --surface-2 token |

### 5-question bank (inline)

| # | Type | Topic |
|---|------|-------|
| Q1 | Vocabulary | Common noun (B1) |
| Q2 | Grammar | Ser vs estar (B1/B2) |
| Q3 | Grammar | Subjunctive trigger (B2) |
| Q4 | Vocabulary | Less common word (B2) |
| Q5 | Grammar | Preterito vs imperfecto (B2/C1) |

Result shows: grade letter + scale key + 2-row breakdown (Sanasto / Kielioppi) + CTA to app.html. Email capture is the same "after value" pattern as the full diagnostic.

---

## Technical Implementation Notes

1. Questions stored as a JS array in the file — no server call needed for the diagnostic flow.
2. Grade calculation: simple weighted score. Each B1 question = 1 point if correct. Each B2 = 1.5 points. Each C1 = 2 points. Total → map to grade scale.
3. Grade→scale mapping (weighted-score bands, given the existing bank uses A/B/C/M/E/L level labels matching Finnish YO grades):
   - Total possible weighted score if all 8 correct = 1 + 1 + 1.2 + 1.5 + 1.5 + 2 + 2.5 + 3 = 13.7
   - 0–2.5: I (improbatur)
   - 2.5–4.5: A (approbatur)
   - 4.5–6.5: B (lubenter approbatur)
   - 6.5–8.5: C (cum laude)
   - 8.5–10.5: M (magna cum laude)
   - 10.5–12.5: E (eximia cum laude)
   - 12.5–13.7: L (laudatur)
   - Tune bands once first 100 results come in — current brackets are provisional.
4. Adaptive logic (full diagnostic): After Q2, if score ≥ 2/2, flag `level = 'upper'` and serve harder Q3–Q5. If score ≤ 1/2, serve easier variants.
5. URL params: After result, CTA links to `app.html?diagnostic=c&weak=grammar` — app.html can read these and pre-select relevant exercise mode.
6. localStorage: Save diagnostic result to `puheo_diagnostic` key so returning users see "Viimeisin tuloksesi: C" on the index page mini-diagnostic instead of the generic intro.
