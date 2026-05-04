# Agent Prompt — L-COURSE-1
# Kurssin sisältö pre-generated → Git:iin (infrastruktuuri-loop)

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **infrastruktuuri-loop**, ei sisältö-generointi. Sinä rakennat järjestelmän jolla
> kurssin sisältö (88 oppituntia, 8 kurssia × 10-12) voidaan tallentaa JSON-tiedostoina Git:iin
> ja serverata staattisesti. Itse sisältö generoidaan myöhemmin käyttäjän toimesta erillisellä
> generointi-prompilla (`PROMPT_GENERATE_LESSON.md`), yksi oppitunti kerrallaan.

---

## Edellytys

- L-CLEANUP-1 shipattu (`grep '\[L-CLEANUP-1\]' IMPROVEMENTS.md`)
- L-LIVE-AUDIT-P0 + P1 + P2 shipattu ja Vercel-tuotanto stabiili
- Käyttäjä on vahvistanut Lighthouse-mittaukset

---

## Lue ensin — EI muutoksia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md`** — KAIKKI skillit, säännöt
2. `AGENT_STATE.md` — viimeisin tila (siivottu L-CLEANUP-1:ssä, max 50 riviä)
3. `lib/curriculumData.js` — kurssirakenne (8 kurssia × 10-12 oppituntia, level=YO-arvosana, vocab_theme, grammar_focus)
4. `routes/curriculum.js` ja `routes/exercises.js` — nykyinen runtime OpenAI -arkkitehtuuri (joka korvataan)
5. `lib/lessonContext.js` — `TARGET_GRADE_MULTIPLIERS`, `TARGET_GRADE_PASS_THRESHOLDS`, `applyTargetMultiplier()` jne. — KÄYTÄ NÄITÄ, älä keksi uusia
6. `js/screens/curriculum.js` ja `js/screens/lessonResults.js` — frontend-renderöinti
7. `lib/openai.js` — vain ymmärtääksesi mitä korvataan; älä koske
8. `.claude/skills/puheo-ai-prompt/SKILL.md` — generointi-prompin säännöt (generointi tehdään myöhemmin, mutta skeeman pitää tukea sitä)
9. IMPROVEMENTS.md viimeiset 50 riviä (siivouksen jälkeen pieni)

---

## Konteksti — mikä Puheo on

**Puheo on YO-koe-valmennuskurssi espanjan lyhyestä oppimäärästä. EI kielenoppimissivusto.**

Tärkeää tietää tästä loopista:

1. **Tasot ovat YO-arvosanoja** (I, A, B, C, M, E, L), EIVÄT CEFR-tasoja (A1, A2, B1, B2). Älä käytä CEFR-merkintöjä missään tiedostossa, schemassa tai promptissa. `level: "A"` curriculumDatassa = approbatur-tason kurssi, ei A1/A2.

2. **Käyttäjillä on `target_grade`**. Tämä on heidän tavoitearvosana, asetettu onboardingissa. Skaala on `I, A, B, C, M, E, L`. Sama kurssi-sisältö skaalautuu eri tavoin eri tavoitteille:
   - L-tavoite oppilas tekee paljon enemmän ja vaikeampia tehtäviä per oppitunti
   - C-tavoite oppilas tekee vähemmän ja helpompia

3. **Pisterajoja YO-koe lyhyt espanja (~2026):** L ≈ 95%, E ≈ 85%, M ≈ 75%, C ≈ 63%, B ≈ 52%, A ≈ 38%, I ≈ 25%. Käytä näitä **mastery-kynnysten skaalaamiseen** oppituntien sisällä, ei estämään käyttäjän etenemistä.

4. **Mastery on signaali, EI gate.** Käyttäjä voi aina edetä eteenpäin, klikkaa "Seuraava". Mutta järjestelmä merkitsee oliko oppitunti "masteroitu" (kynnys ylitetty) vai "ohitettu". Ohitetut palaavat SR-sessioissa.

5. **YO-koe-formaatti määrittää tehtävätyypit:**
   - Monivalinta (luetun ymmärtäminen, sanaston tunnistus)
   - Yhdistä (sana ↔ käännös, lause ↔ rakenne)
   - Aukkotäydennys (kielioppi kontekstissa)
   - Lyhyt + pitkä kirjoitustehtävä
   - Käännös (suomi → espanja)
   - Kirjoita itse (production, recall)

   Sisäinen vaiheisto oppitunnin sisällä on: **recognition → recall → application → synthesis**. Helpompi vaihe päästään läpi kun mastery-kynnys ylittyy, mutta käyttäjä voi aina klikata "Olen valmis tästä, jatka".

---

## Skills + design plugins käyttöön

- `puheo-screen-template` — UPDATE 4+5 (lesson runner -näkymä, side-panel)
- `puheo-finnish-voice` — UPDATE 4 + UPDATE 6 (kaikki copy: vaihe-otsikot, mastery-feedback, side-panel-painike)
- `puheo-ai-prompt` — UPDATE 7 (generointi-prompin malli — vaikka itse generointi on käyttäjän loopissa, prompti pitää suunnitella tämän skillin ohjeiden mukaan)
- `ui-ux-pro-max` — KAIKKI UPDATEt — focus-state, touch targets, kontrasti, motion

Education-skillit (PAKOLLINEN lukea ENNEN UPDATE 4-6):

**Tärkeä yleisperiaate:** Tämä loop ei kerro sinulle tarkkoja pedagogisia reseptejä (esim. "kirjoita 8 monivalintaa joissa distractorit ovat tällaisia"). Sen sijaan: lue alla olevat education-skillit ja **niiden ohjeet määräävät** miten tehtävät rakentuvat, mitä mastery tarkoittaa, miten vaiheet siirtyvät toisiinsa, jne. Skillit ovat asiantuntijoiden työtä — kunnioita niitä siellä missä tämä loopin kuvaus jättää tilaa.

- `education/practice-problem-sequence-designer` — määrää tehtävien progression vaiheiden välillä ja sisällä
- `education/spaced-practice-scheduler` — sisäinen SR oppitunnin sisällä (failedItems-mekanismi)
- `education/cognitive-load-analyser` — sano kuinka monta elementtiä vaiheeseen mahtuu ennen ylikuormitusta
- `education/self-efficacy-builder-sequence` — kaikki mastery-feedback ja "ohitettu"-viestintä menee tämän kautta
- `education/explicit-instruction-sequence-builder` — opetussivun ja ensimmäisen vaiheen suhde (I do → We do → You do)
- `education/adaptive-hint-sequence-designer` — side-panelin sisältö ja milloin se on hyödyksi
- `education/criterion-referenced-rubric-generator` — mastery-kynnyksen suhde target_gradeen ja YO-pisterajoihin
- `education/formative-assessment-loop-designer` — välitön palaute → seuraava askel -kuvio jokaisen tehtävän jälkeen
- `education/error-analysis-protocol` — miten väärin menneitä vastauksia kommentoidaan (tutor-viesti)
- `education/retrieval-practice-generator` — recognition vs. recall -ero käytännössä, milloin kumpaa käytetään

Jos joku näistä skilleistä antaa ohjeen joka on ristiriidassa tämän loopin tekstin kanssa, **noudata skilliä**. Tämän loopin teksti on infrastruktuuri-ohje — skillit ovat pedagoginen ohje.

Design plugins:
- `design:ux-copy` — UPDATE 4 + UPDATE 6 jokaiseen copy-merkkijonoon (vaihe-otsikot, mastery-feedback, side-panel-toggle)
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen, side-panel + vaihe-progressio + edistyspalkki erityisesti
- `design:design-critique` — Playwright-screenshotit lesson runner -näkymästä @ 1440 + 375
- `design:taste-frontend` jos saatavilla — UPDATE 4 + 5

**21st.dev / Magic UI sourcing — pakollinen kaikille uusille UI-komponenteille:**

Tärkeä yleisperiaate: ÄLÄ keksi UI-komponentteja tyhjästä. Jokainen uusi näkymä tai komponentti **alkaa 21st.dev-haulla**. STANDARDS §3 määrittelee fallback-järjestyksen. Suositellut hakusanat per UPDATE:

| UPDATE | Mitä tarvitaan | Hakusanat 21st.dev/s/... |
|---|---|---|
| 4 | Vaihe-progressio jossa edistyspalkki + step-laskuri + aika | `wizard`, `multi-step-form`, `progress-stepper`, `step-indicator` |
| 4 | Mastery-feedback vaiheen lopussa (mastered / almost / skipped) | `result-banner`, `score-card`, `feedback-card`, `achievement-card` |
| 5 | Side-panel oikealla desktop, bottom-sheet mobiilissa | `side-panel`, `drawer`, `help-panel`, `bottom-sheet` |
| 5 | Side-panelin tabit (sanasto / kielioppi / esimerkit / vinkit) | `tabs`, `tabs-vertical`, `pill-tabs` |
| 6 | Lesson-results yhteenveto (vaihe-status, aika, sanat SR-jonoon) | `summary-card`, `stats-grid`, `result-summary` |
| 6 | "Tämä YO-kokeessa"-callout | `callout`, `info-card`, `highlight-box` |

**Jos 21st.devistä ei löydy sopivaa**, fallback STANDARDS §3 mukaan: Magic UI → shadcn → Aceternity → Tailwind UI free / HyperUI. Sourcaa, screenshottaa, porttaa vanilla CSS:ksi. Cite EXACT URL IMPROVEMENTS.md-rivissä.

**Frontend-skillit (myös pakollinen):**

- `puheo-screen-template` — KAIKKI uudet näkymät noudattavat tätä reseptiä (layout grid, spacing, breakpoint, tokenit, motion, state-pattern)
- `ui-ux-pro-max` — a11y, touch targets, kontrasti, focus-state, motion-preferenssit, font-pairings, color-paletit
- `design:taste-frontend` jos saatavilla — KAIKKI UI-uudistukset

Älä keksi spacingia, värejä, pyöristyksiä, motion-aikoja tyhjästä — tokenit + skillit määräävät ne.

---

## UPDATE 1 — JSON-skeema oppituntien sisällölle

**Mitä tehdään:** Määritellään yksi kanoninen JSON-skeema joka kuvaa kaiken mitä yksi oppitunti tarvitsee.

### A. Luo `schemas/lesson.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Puheo Lesson",
  "type": "object",
  "required": ["meta", "teaching", "phases", "vocab", "side_panel"],
  "properties": {
    "meta": {
      "type": "object",
      "required": ["course_key", "lesson_index", "lesson_type", "level", "title"],
      "properties": {
        "course_key": { "type": "string", "pattern": "^kurssi_[1-8]$" },
        "lesson_index": { "type": "integer", "minimum": 1, "maximum": 15 },
        "lesson_type": { "enum": ["vocab", "grammar", "reading", "writing", "mixed", "test"] },
        "level": { "enum": ["I", "A", "B", "C", "M", "E", "L"], "description": "YO-arvosana, EI CEFR" },
        "title": { "type": "string" },
        "description": { "type": "string" },
        "yo_relevance": { "type": "string", "description": "Lyhyt selitys: miten tämä oppitunti näkyy YO-kokeessa" },
        "estimated_minutes_median": { "type": "integer", "minimum": 3, "maximum": 30 }
      }
    },
    "teaching": {
      "type": "object",
      "description": "Opetussisältö joka näkyy ennen tehtäviä — selitys + esimerkit. Ei pakko olla pitkä.",
      "required": ["intro_md"],
      "properties": {
        "intro_md": { "type": "string", "description": "Markdown, max ~300 sanaa. Lyhyt selitys + 2-4 esimerkkiä." },
        "key_points": { "type": "array", "items": { "type": "string" }, "description": "3-5 kohdan tiivistys." }
      }
    },
    "phases": {
      "type": "array",
      "minItems": 3,
      "maxItems": 12,
      "description": "Oppitunnin vaiheet järjestyksessä. Recognition → recall → application → synthesis. Yhden vaiheen sisällä useita tehtäviä.",
      "items": {
        "type": "object",
        "required": ["phase_id", "phase_type", "title", "items", "mastery_threshold"],
        "properties": {
          "phase_id": { "type": "string", "description": "Esim. 'p1-recognition-flashcards'" },
          "phase_type": {
            "enum": [
              "recognition_mc",
              "recognition_match",
              "recall_typed_es_to_fi",
              "recall_typed_fi_to_es",
              "application_gap_fill",
              "application_sentence_build",
              "synthesis_translate",
              "synthesis_short_writing",
              "reading_mc",
              "writing_long"
            ]
          },
          "title": { "type": "string", "description": "Suomeksi, esim. 'Tunnista — perhe ja kansallisuudet'" },
          "instruction": { "type": "string", "description": "Suomeksi, lyhyt." },
          "mastery_threshold": {
            "type": "object",
            "description": "Per target_grade. Tavoitearvosana → vaadittu osuus oikein vaiheen sisällä.",
            "properties": {
              "I": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
              "A": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
              "B": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
              "C": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
              "M": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
              "E": { "type": "number", "minimum": 0.3, "maximum": 1.0 },
              "L": { "type": "number", "minimum": 0.3, "maximum": 1.0 }
            }
          },
          "skip_for_targets": {
            "type": "array",
            "items": { "enum": ["I", "A", "B", "C", "M", "E", "L"] },
            "description": "Mitkä target_grade-tasot ohittavat tämän vaiheen kokonaan. Esim. ['I','A'] = improbatur+approbatur eivät tee tätä."
          },
          "items": {
            "type": "array",
            "minItems": 4,
            "maxItems": 30,
            "items": { "$ref": "#/definitions/exercise_item" }
          }
        }
      }
    },
    "vocab": {
      "type": "array",
      "description": "Sanasto joka kuuluu tähän oppituntiin. Side-panel näyttää tämän. SR-järjestelmä lisää nämä käyttäjän SR-jonoon.",
      "items": {
        "type": "object",
        "required": ["es", "fi"],
        "properties": {
          "es": { "type": "string" },
          "fi": { "type": "string" },
          "example_es": { "type": "string" },
          "example_fi": { "type": "string" },
          "gender": { "enum": ["m", "f", null] },
          "audio_id": { "type": ["string", "null"] }
        }
      }
    },
    "side_panel": {
      "type": "object",
      "description": "Mitä oppilas näkee oikealla 'Apua'-paneelissa kun hän avaa sen.",
      "required": ["tabs"],
      "properties": {
        "tabs": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["id", "title", "content_md"],
            "properties": {
              "id": { "enum": ["vocab", "grammar", "examples", "tips"] },
              "title": { "type": "string" },
              "content_md": { "type": "string" }
            }
          }
        }
      }
    }
  },
  "definitions": {
    "exercise_item": {
      "type": "object",
      "description": "Yksi tehtäväyksikkö — kysymys + odotetut vastaukset.",
      "oneOf": [
        { "$ref": "#/definitions/item_mc" },
        { "$ref": "#/definitions/item_match" },
        { "$ref": "#/definitions/item_typed" },
        { "$ref": "#/definitions/item_gap_fill" },
        { "$ref": "#/definitions/item_translate" },
        { "$ref": "#/definitions/item_writing" },
        { "$ref": "#/definitions/item_reading_mc" }
      ]
    },
    "item_mc": {
      "required": ["item_type", "stem", "choices", "correct_index", "explanation"],
      "properties": {
        "item_type": { "const": "mc" },
        "stem": { "type": "string" },
        "context": { "type": ["string", "null"], "description": "Mahdollinen lause-konteksti" },
        "choices": { "type": "array", "minItems": 3, "maxItems": 5, "items": { "type": "string" } },
        "correct_index": { "type": "integer", "minimum": 0 },
        "distractor_difficulty": { "enum": ["easy", "medium", "hard"], "description": "easy = ilmeinen virhe, hard = semanttisesti lähellä" },
        "explanation": { "type": "string", "description": "Suomeksi, miksi oikea on oikea" }
      }
    },
    "item_match": {
      "required": ["item_type", "pairs"],
      "properties": {
        "item_type": { "const": "match" },
        "left_label": { "type": "string", "default": "Espanja" },
        "right_label": { "type": "string", "default": "Suomi" },
        "pairs": { "type": "array", "minItems": 4, "maxItems": 12, "items": {
          "type": "object",
          "required": ["left", "right"],
          "properties": {
            "left": { "type": "string" },
            "right": { "type": "string" }
          }
        }}
      }
    },
    "item_typed": {
      "required": ["item_type", "prompt", "accept"],
      "properties": {
        "item_type": { "const": "typed" },
        "direction": { "enum": ["es_to_fi", "fi_to_es"], "default": "fi_to_es" },
        "prompt": { "type": "string" },
        "accept": { "type": "array", "minItems": 1, "items": { "type": "string" }, "description": "Lista hyväksyttäviä vastauksia. Diakriittien puute hyväksytään aina." },
        "hint": { "type": ["string", "null"] }
      }
    },
    "item_gap_fill": {
      "required": ["item_type", "sentence_template", "answers"],
      "properties": {
        "item_type": { "const": "gap_fill" },
        "sentence_template": { "type": "string", "description": "Esim. 'Mi {1} se llama Ana y mi {2} es ingeniero.'" },
        "answers": { "type": "array", "minItems": 1, "items": { "type": "array", "items": { "type": "string" } }, "description": "Per gap, lista hyväksyttäviä." },
        "word_bank": { "type": ["array", "null"], "items": { "type": "string" }, "description": "Optional: ennalta annetut sanat joista valita. null = käyttäjä kirjoittaa itse." }
      }
    },
    "item_translate": {
      "required": ["item_type", "source", "direction", "accept"],
      "properties": {
        "item_type": { "const": "translate" },
        "direction": { "enum": ["es_to_fi", "fi_to_es"] },
        "source": { "type": "string" },
        "accept": { "type": "array", "minItems": 1, "items": { "type": "string" } }
      }
    },
    "item_writing": {
      "required": ["item_type", "prompt", "min_words", "max_words", "rubric_focus"],
      "properties": {
        "item_type": { "const": "writing" },
        "prompt": { "type": "string" },
        "min_words": { "type": "integer" },
        "max_words": { "type": "integer" },
        "rubric_focus": { "type": "array", "items": { "enum": ["communication", "structure", "vocab", "overall"] } }
      }
    },
    "item_reading_mc": {
      "required": ["item_type", "passage", "questions"],
      "properties": {
        "item_type": { "const": "reading_mc" },
        "passage": { "type": "string", "description": "Espanjankielinen lukuteksti, max ~250 sanaa" },
        "questions": {
          "type": "array",
          "minItems": 3,
          "maxItems": 8,
          "items": {
            "type": "object",
            "required": ["question_fi", "choices", "correct_index"],
            "properties": {
              "question_fi": { "type": "string", "description": "Kysymys suomeksi" },
              "choices": { "type": "array", "minItems": 3, "maxItems": 5, "items": { "type": "string" } },
              "correct_index": { "type": "integer", "minimum": 0 },
              "explanation_fi": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

### B. Lisää JSON Schema -validaattori

`npm install --save-dev ajv ajv-formats` (jos ei jo ole). Luo `scripts/validate-lessons.mjs` joka:
1. Lukee `schemas/lesson.json`
2. Iteroi `data/courses/**/*.json`
3. Validoi jokaisen, raportoi virheet

Lisää `package.json`:in `scripts`-blokkiin:
```json
"validate:lessons": "node scripts/validate-lessons.mjs"
```

Aja `npm run validate:lessons` osana CI:tä myöhemmin.

**Verify:**
- `schemas/lesson.json` validoituu JSON Schemaksi (`ajv compile schemas/lesson.json` exit 0)
- `npm run validate:lessons` toimii (vaikka mitään tiedostoja ei ole vielä — palauta "0 lessons validated, all OK")

---

## UPDATE 2 — Tiedostorakenne `data/courses/` + dummy-tiedostot

**Mitä tehdään:** Luodaan kansiorakenne ja yksi dummy-tiedosto per kurssi jotta backend voi testata DB-readin korvaavaa pathia.

### A. Kansiorakenne

```
data/
  courses/
    kurssi_1/
      lesson_1.json    ← Perhe ja kansallisuudet
      lesson_2.json    ← -ar-verbit preesensissä
      ...
      lesson_10.json   ← Kertaustesti
    kurssi_2/
      ...
    kurssi_3/
      ...
    ...
    kurssi_8/
      lesson_12.json   ← Kertaustesti
    README.md          ← Selitys mitä tämä on, miten generoidaan
```

### B. Yksi dummy-tiedosto kurssia kohti (paikkamerkki)

Luo `data/courses/kurssi_1/lesson_1.json` minimaalisena (mutta valid schema mukaan), jotta backend voi testata. Sisältö esim.:

```json
{
  "meta": {
    "course_key": "kurssi_1",
    "lesson_index": 1,
    "lesson_type": "vocab",
    "level": "A",
    "title": "Perhe ja kansallisuudet — perussanasto",
    "description": "PLACEHOLDER — sisältö generoidaan myöhemmin PROMPT_GENERATE_LESSON.md:llä",
    "yo_relevance": "PLACEHOLDER",
    "estimated_minutes_median": 12
  },
  "teaching": {
    "intro_md": "PLACEHOLDER — opetussisältö generoidaan myöhemmin",
    "key_points": ["PLACEHOLDER"]
  },
  "phases": [
    {
      "phase_id": "p1-placeholder",
      "phase_type": "recognition_mc",
      "title": "PLACEHOLDER",
      "instruction": "PLACEHOLDER",
      "mastery_threshold": { "I": 0.5, "A": 0.6, "B": 0.65, "C": 0.7, "M": 0.75, "E": 0.85, "L": 0.9 },
      "items": [
        { "item_type": "mc", "stem": "PLACEHOLDER", "choices": ["a","b","c","d"], "correct_index": 0, "explanation": "PLACEHOLDER" },
        { "item_type": "mc", "stem": "PLACEHOLDER", "choices": ["a","b","c","d"], "correct_index": 0, "explanation": "PLACEHOLDER" },
        { "item_type": "mc", "stem": "PLACEHOLDER", "choices": ["a","b","c","d"], "correct_index": 0, "explanation": "PLACEHOLDER" },
        { "item_type": "mc", "stem": "PLACEHOLDER", "choices": ["a","b","c","d"], "correct_index": 0, "explanation": "PLACEHOLDER" }
      ]
    }
  ],
  "vocab": [
    { "es": "PLACEHOLDER", "fi": "PLACEHOLDER" }
  ],
  "side_panel": {
    "tabs": [
      { "id": "vocab", "title": "Sanasto", "content_md": "PLACEHOLDER" }
    ]
  }
}
```

Älä luo placeholderia kaikille 88 oppitunnille — yksi per kurssi (8 yhteensä) riittää infran testaamiseen. Käyttäjä generoi loput.

### C. README.md kansion juureen

`data/courses/README.md`:

```markdown
# Puheo course content

JSON-tiedostot, yksi per oppitunti. Validoidaan `schemas/lesson.json`-vasten.

## Generointi

Yksi oppitunti kerrallaan, käyttäjän omassa Claude Code -istunnossa
prompin `PROMPT_GENERATE_LESSON.md` mukaan. Käyttäjä committaa
generoidut tiedostot.

## Validointi

`npm run validate:lessons`

## Käyttö backendissa

`routes/curriculum.js` lukee `data/courses/{course_key}/lesson_{index}.json`
kun `USE_PREGENERATED_LESSONS=true` ympäristömuuttuja asetettu.
Muuten fallback runtime OpenAI -generointiin.
```

**Verify:**
- `npm run validate:lessons` validoi 8 placeholder-tiedostoa, exit 0
- Tiedostorakenne on luotu

---

## UPDATE 3 — Backend-endpoint joka lukee JSON:ia DB:n + OpenAI:n sijaan

**Mitä tehdään:** Lisää uusi reitti / muunna olemassaolevaa `/api/curriculum/lesson/:courseId/:lessonId` -endpointtia siten että:
- Jos `USE_PREGENERATED_LESSONS=true` ja `data/courses/{courseKey}/lesson_{index}.json` löytyy → palauta JSON sellaisenaan
- Muuten → fallback nykyiseen runtime OpenAI -logiikkaan

### A. Etsi nykyinen endpoint

Tarkista `routes/curriculum.js` — todennäköisesti `GET /:k/lesson/:i` joka kutsuu `routes/exercises.js`:n `generateLesson`-funktiota.

### B. Lisää JSON-readin haara

```js
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function readPregeneratedLesson(courseKey, lessonIndex) {
  if (process.env.USE_PREGENERATED_LESSONS !== 'true') return null;
  try {
    const filePath = path.join(process.cwd(), 'data', 'courses', courseKey, `lesson_${lessonIndex}.json`);
    const raw = await readFile(filePath, 'utf8');
    const lesson = JSON.parse(raw);
    // Tarkista placeholder — älä servaa placeholdereita käyttäjälle
    if (lesson.meta?.description?.startsWith('PLACEHOLDER')) return null;
    return lesson;
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('readPregeneratedLesson error:', err);
    return null;
  }
}

router.get('/:k/lesson/:i', async (req, res) => {
  const courseKey = req.params.k;
  const lessonIndex = parseInt(req.params.i, 10);

  // Yritä pre-generated ensin
  const pregenerated = await readPregeneratedLesson(courseKey, lessonIndex);
  if (pregenerated) {
    return res.json(pregenerated);
  }

  // Fallback nykyiseen runtime OpenAI -logiikkaan
  // (säilytä olemassa oleva koodi tässä)
  ...
});
```

### C. Frontend käsittelee uutta vastausrakennetta

Vanha vastaus oli erilainen rakenne (mahdollisesti `{ exercises: [...], lessonContext: {...} }`). Uusi rakenne on koko `lesson.json` schema. Frontendin `js/screens/curriculum.js` `loadLesson()` ja `js/screens/lessonResults.js` pitää päivittää lukemaan uutta rakennetta.

**Tärkeä:** Tee niin että frontend tunnistaa kummankin rakenteen — vanha käytössä jos pre-generated ei ole saatavilla, uusi jos on. Adapteri-kerros `js/lib/lessonAdapter.js`:
- `normalizeLesson(payload)` palauttaa aina sisäisen Lesson-objektin
- Jos `payload.phases` löytyy → uusi rakenne
- Muuten → vanha rakenne, mappaa uuteen

Tämä mahdollistaa toggle-ohjauksen: voit ajaa `USE_PREGENERATED_LESSONS=true` Vercelillä ja Kurssi 1 lesson 1 (joka on generoitu) palautetaan JSON:ina, kun taas kaikki muut lessonit yhä OpenAI:lta.

### D. Lisää env-muuttuja

`.env.example`:
```
# Pre-generated kurssin sisältö (data/courses/*.json)
# false = runtime OpenAI -generointi (default)
# true = lue JSON-tiedostosta jos saatavilla, fallback OpenAI
USE_PREGENERATED_LESSONS=false
```

Vercel-dashboard: aseta `USE_PREGENERATED_LESSONS=true` kun käyttäjä on generoinut tarpeeksi sisältöä testaamiseen.

**Verify:**
- `USE_PREGENERATED_LESSONS=true` + dummy-tiedosto Kurssi 1 lesson 1 (ei placeholder vaan oikeasti täytetty) → endpoint palauttaa sen JSON:in
- `USE_PREGENERATED_LESSONS=true` + placeholder → endpoint palauttaa OpenAI-fallback (placeholderia ei servata)
- `USE_PREGENERATED_LESSONS=false` → toimii kuten ennen
- Tests: `npm test` 1067/1067 ✓

---

## UPDATE 4 — Frontend lesson runner: vaihe-progressio

**Mitä tehdään:** Refaktoroi oppitunnin renderöinti vaihe-pohjaiseksi. Yksi vaihe = useita tehtäviä saman tyypin sisällä, mastery-kynnys per target_grade.

### A. Uusi screen `screen-lesson-runner` tai laajenna olemassa olevaa

Kerros `js/screens/lessonRunner.js` (uusi tai refaktoroitu olemassaolevasta):

Tilamalli:
```js
const lessonState = {
  lesson,                    // koko Lesson-objekti
  currentPhaseIndex: 0,      // mikä vaihe on käynnissä
  currentItemIndex: 0,       // mikä tehtävä vaiheen sisällä
  phaseResults: [],          // [{ phaseId, correctCount, totalCount, mastered, skipped }]
  failedItems: [],           // sanat/tehtävät joita käyttäjä mokasi → palautetaan myöhempiin vaiheisiin
  sidePanelOpen: false,      // käyttäjän togglattava
  startedAt: Date.now(),
};
```

Vaihe-kohtainen flow ON suunniteltava `education/practice-problem-sequence-designer` + `education/formative-assessment-loop-designer` -skillien ohjeiden mukaan. Yleisrakenne:
1. Render vaiheen otsikko + ohje
2. Render tehtävät yksi kerrallaan (tehtävän tyyppi → komponentti)
3. Käyttäjä vastaa → tallenna oikein/väärin → välitön palaute (tämän muoto määräytyy `education/formative-assessment-loop-designer`-skillin mukaan, ei tämän loopin)
4. Vaiheen lopussa: laske mastery
5. Näytä mastery-banneri (sisältö ja sävy `education/self-efficacy-builder-sequence` + `puheo-finnish-voice` -skillien mukaan, ei tämän loopin):
   - Mastered (kynnys ylittyi target_graden mukaan)
   - Almost (alle kynnyksen)
   - Skipped (käyttäjä klikkasi "Olen valmis tästä")
6. Käyttäjä klikkaa "Seuraava vaihe" → indeksi++ → uusi vaihe

ÄLÄ keksi mastery-bannerin copya itse — aja `design:ux-copy` + `puheo-finnish-voice` jokaiseen merkkijonoon. Keksi vain tila-koodit (`mastered` / `almost` / `skipped`), copy tulee skilleistä.

### B. target_grade-pohjainen vaiheiden valinta

Käyttäjän target_grade määrittää:
- Mitkä vaiheet ohitetaan kokonaan (`phase.skip_for_targets` listalta — generointi-prompti määrittelee tämän per oppitunti)
- Mitkä mastery-kynnykset käytetään (`phase.mastery_threshold[user.target_grade]` — generointi-prompti määrittelee per vaihe)

**Käytä olemassa olevia tokeneita:** `lib/lessonContext.js` sisältää `TARGET_GRADE_MULTIPLIERS`, `TARGET_GRADE_PASS_THRESHOLDS`, `applyTargetMultiplier()`, `passThresholdFor()`. Käytä niitä, älä keksi uusia. Jos lessonContext.js:ssä ei ole tarpeeksi, lisää sinne uusi helper, mutta ei runner-tasolle.

### C. Edistyspalkki + arvio jäljellä

`puheo-screen-template`-skillin mukaan oppitunnin yläosassa näkyy aina:

```
[Vaihe 2 / 5 ⏵⏵·⏵··]    Tunnista — perhe ja kansallisuudet    ~9 min jäljellä
```

- Vaihe-laskuri "2 / 5" — mihinkä monesta käyttäjä ehtii oppitunnin loppuun (target_graden mukaan, ei skipped-vaiheet)
- Pieni progress-stepper (täytetyt nuolet)
- Otsikko = nykyisen vaiheen `title`
- Aikaennuste = `(jäljellä olevat vaiheet) × (median per phase_type)`. Päivittyy oppitunnin aikana käyttäjän oman tahdin mukaan (esim. EWMA viime 5 itemin tahdista).

Run `21st.dev/s/wizard` ja `21st.dev/s/multi-step-form` — sourcaa stepper-pohja sieltä.

### D. "Olen valmis tästä, jatka" -linkki

Joka vaiheen alussa pieni linkki/painike: `Skipping vaihetta · "Olen valmis tästä"`. Klikkaus:
1. Konfirmoi modaalilla: "Ohita tämä vaihe? Sanat palaavat kertaussessioon myöhemmin."
2. Jos OK → merkkaa vaihe `skipped: true` phaseResults:iin → seuraava vaihe

Tämä on kriittinen — käyttäjä ei saa olla locked vaiheeseen. Mastery on signaali, ei portti.

### E. Sisäinen SR — failedItems palautuu

Kun käyttäjä mokaa tehtävän vaiheessa N, lisää `lessonState.failedItems`:iin tehtäväyksikkö. Vaiheessa N+1 (jos tyyppi on yhteensopiva) priorisoi failedItems-sanat ensin uusien sanojen edellä.

Esim:
- Vaihe 1 (recognition_mc): käyttäjä mokaa "abuela" ja "hermana"
- Vaihe 2 (recall_typed_es_to_fi): aloitetaan näistä kahdesta, sitten muut sanat. Tämä antaa toisen mahdollisuuden samalle sanalle, vahvempana muotona.

**Verify:**
- Avaa Kurssi 1 lesson 1 (kun se on generoitu) → näkyy vaiheina, ei kaikki kerralla
- Edistyspalkki päivittyy tehtävän aikana
- L-target-tunnukset ja I-target-tunnukset näkevät eri määrän vaiheita
- "Olen valmis tästä" -linkki toimii ja merkitsee skipped:in
- Mokattu sana palaa seuraavassa vaiheessa
- `design:design-critique` 1440 + 375
- `design:accessibility-review` 0 violations

---

## UPDATE 5 — Side-panel käyttäjän togglattava

**Mitä tehdään:** Oikealle ilmestyy "Apua"-paneeli jonka käyttäjä voi avata. Sisältää tabit: Sanasto, Kielioppi, Esimerkit, Vinkit (riippuen oppitunnin tyypistä, schemasta `side_panel.tabs[]`).

### A. UI-rakenne

Lesson runner desktop-näkymässä (≥ 1024px):
```
┌──────────────────────────────────────┬──────────────┐
│  Tehtävä-alue                        │  Side-panel  │
│  (60-70% leveydestä)                 │  (suljettu)  │
│                                       │   [Avaa]     │
└──────────────────────────────────────┴──────────────┘
```

Avattuna:
```
┌──────────────────────────────────┬──────────────────┐
│  Tehtävä-alue                    │  Side-panel      │
│                                   │  [Sanasto]       │
│                                   │  [Kielioppi]     │
│                                   │  [Esimerkit]     │
│                                   │  ...             │
└──────────────────────────────────┴──────────────────┘
```

Mobile (≤ 768px):
- Side-panel on bottom sheet joka avautuu painikkeesta. Slide up.

### B. Toggle-painike

Aina näkyvissä, kelluva tai integroitu top-bariin lesson runnerin sisällä.
- Kiinni: `📖 Apua` (ikoni + sanan "Apua")
- Auki: `✕ Sulje`
- ARIA: `aria-expanded`, `aria-controls`

### C. Sisältö

Schemasta `lesson.side_panel.tabs[]`:
- Tab 1: Sanasto (lista `vocab[]`-objekteista, espanja + suomi + esimerkki)
- Tab 2: Kielioppi (jos kurssi on grammar-painotteinen — content_md)
- Tab 3: Esimerkit (irrallisia esimerkkilauseita)
- Tab 4: YO-vinkit (mihin tämä tulee YO-kokeessa)

Render markdown kielioppi/vinkit-tabbeille (käytä yksinkertaista markdown-parseria — `marked` tai vastaava jos ei vielä käytössä).

### D. Avaaminen kirjautuu

Joka kerta kun käyttäjä avaa side-panelin VAIKEAN VAIHEEN aikana (recall, application, synthesis), tallenna `lessonState`:iin. Kun vaihe on päässyt loppuun:
- Jos side-panel oli auki yli 50% ajasta → mastery-banneri sanoo "Vahvista vielä ilman apua" eikä "Mastered"
- Tämä on **signaali** käyttäjälle, ei rangaistus. Hän voi silti edetä.

Run `education/adaptive-hint-sequence-designer` — varmista että side-panelin sisältö on **vinkki**, ei vastaus. Esim. sanasto-tabin sana voi olla saatavilla, mutta side-panel ei kerro mikä on oikea vastaus tehtävän kysymykseen.

**Verify:**
- Side-panel avautuu/sulkeutuu painikkeesta
- Tabit toimivat
- Mobile bottom sheet toimii @ 375px
- ARIA: `aria-expanded` reagoi
- Avaaminen kirjautuu lessonState:iin
- `design:design-critique` 1440 + 375
- `design:accessibility-review` — focus management oikein, escape sulkee, focus trap kun avoinna mobile bottom sheetissä

---

## UPDATE 6 — Mastery-feedback + lopullinen lesson-results

**Mitä tehdään:** Oppitunnin lopussa renderöi yhteenveto:
- Per-vaihe mastery-status (mastered / almost / skipped)
- Kokonaisaika
- Sanat jotka palaavat SR-jonoon (failedItems + skipped-vaiheiden sanat)
- "Tämä YO-kokeessa" -box (`meta.yo_relevance`)
- Seuraava oppitunti -CTA

### A. Tutorial-viesti — adaptiivinen target_gradeen

Käyttäjä target_grade=L joka mokasi → "Tarkennetaan vielä yksityiskohtia. L-tavoite vaatii ~95% pisteistä YO-kokeessa, joten näiden sanojen pitää olla automaattisia."

Käyttäjä target_grade=I joka mokasi → "Hyvä alku. I-tavoite vaatii ~25% pisteistä — olet jo lähellä tunnistustasoa. Jatketaan eteenpäin, palaamme näihin myöhemmin."

Run `puheo-finnish-voice` + `education/self-efficacy-builder-sequence`. Älä shame, älä superlativisoi, ole spesifinen.

### B. Hard requirement: jokaisessa lesson-results-näkymässä on "Tämä YO-kokeessa"

Schemasta `meta.yo_relevance`. Esim. "Kurssi 1 Oppitunti 1 sanasto näkyy YO-kokeen kuullun ymmärtämisessä noin 8-12 sanan verran. Tarkimmat distractorit ovat hermano/hermana ja primo/prima."

Tämä on Puheon brand-promise: ei pelkkä "olet oppinut kielen", vaan "olet valmistautunut YO-kokeeseen".

**Verify:**
- Renderöi lesson-results testitilillä eri target_gradeilla → tutor-viesti vaihtelee
- "Tämä YO-kokeessa"-box näkyy aina
- SR-jono päivittyy oikein (failed + skipped sanat lisätty)
- `design:ux-copy` käyty läpi

---

## UPDATE 7 — Generointi-prompin malli `PROMPT_GENERATE_LESSON.md`

**Mitä tehdään:** Tämä ON itse asiassa erillinen tiedosto jota käyttäjä käyttää myöhemmin omissa Claude Code -istunnoissaan generoidakseen oppituntien sisällön. Se EI ole agent-prompti tähän looppiin, vaan **artefakti tämän loopin tuloksena**.

Luo tiedosto `PROMPT_GENERATE_LESSON.md` repo:n juureen. Sen sisältö on annettu erillisessä tiedostossa joka on tämän promptin liitteenä — kts. `PROMPT_GENERATE_LESSON.md` joka käyttäjä on kirjoittanut. ÄLÄ keksi sisältöä tähän tiedostoon — se annetaan sinulle.

(Käyttäjälle: tämä prompti on kirjoitettu erillisenä tiedostona, näytetään seuraavassa viestissä.)

**Verify:**
- Tiedosto `PROMPT_GENERATE_LESSON.md` on repo:n juuressa
- Sen rakenne noudattaa schema-määrittelyä `schemas/lesson.json`
- Käyttäjä voi kopioida sen Claude Codeen ja täyttää oppitunti-numero

---

## Verifiointi loop:in lopussa

1. **`npm run validate:lessons`** validoi kaikki 8 placeholder-tiedostoa exit 0
2. **`npm test` 1067/1067 ✓** (tai päivitetty määrä jos uusia testejä lisättiin)
3. **`node --check`** kaikilla muokatuilla tiedostoilla puhtaana
4. **Manuaalitesti tuotantoa vasten** kun shipattu:
   - `USE_PREGENERATED_LESSONS=false` (default Vercelillä) → kaikki toimii kuten ennen
   - Aseta `USE_PREGENERATED_LESSONS=true` Vercel-dashboardissa, generoi ensimmäinen oikea oppitunti `data/courses/kurssi_1/lesson_1.json`:iin → testaa että se latautuu vaihe-rakenteena
   - Käy kaikki vaiheet läpi eri target_grade-tunnuksilla
5. **Side-panel** toimii avaamalla ja sulkemalla, mobile + desktop
6. **`design:accessibility-review`** lesson runner -näkymästä → 0 violations
7. **`design:design-critique`** lesson runner @ 1440 + 375
8. **AGENT_STATE.md saa uuden 5-rivisen merkinnän** L-COURSE-1:lle (max 50 riviä rajat)
9. **IMPROVEMENTS.md** saa 7 max 3-rivin merkintää (UPDATE 1-7)

---

## Mitä EI saa tehdä tässä loopissa

- ÄLÄ generoi mitään oikeaa kurssin sisältöä — vain placeholderit. Sisällön generoi käyttäjä erillisillä istunnoilla.
- ÄLÄ poista vanhaa runtime OpenAI -logiikkaa — fallback pitää säilyä toimivana
- ÄLÄ käytä CEFR-tasoja (A1, A2, B1, B2) missään. Vain YO-arvosanat (I, A, B, C, M, E, L).
- ÄLÄ tee mastery-kynnystä gateksi joka estää etenemistä — käyttäjä voi aina jatkaa
- ÄLÄ koske Sanasto-välilehteen (Sanasto = adaptiivinen SR, eri systeemi)
- ÄLÄ koske kirjoitustehtävien arvosteluun (yhä OpenAI runtimessa, oikein niin)
- ÄLÄ aja Supabase-migraatioita itse — ACTION REQUIRED IMPROVEMENTS.md:hen
- ÄLÄ refaktoroi `app.js`-monoliittia
- ÄLÄ koske landing-pageen
- ÄLÄ keksi uutta UI-komponenttia ilman 21st.dev-sourcing-passia

---

## Commit-konventio

Yksi commit per UPDATE:
- `feat(content): add JSON schema for lesson content [L-COURSE-1 UPDATE 1]`
- `feat(content): scaffold data/courses/ directory with placeholder lessons [L-COURSE-1 UPDATE 2]`
- `feat(api): support pre-generated lessons via USE_PREGENERATED_LESSONS env var [L-COURSE-1 UPDATE 3]`
- `feat(lesson): phase-based lesson runner with mastery thresholds [L-COURSE-1 UPDATE 4]`
- `feat(lesson): user-toggleable side panel with vocab + grammar tabs [L-COURSE-1 UPDATE 5]`
- `feat(lesson): adaptive mastery feedback + YO-koe relevance box on results [L-COURSE-1 UPDATE 6]`
- `docs(content): generation prompt template for new lessons [L-COURSE-1 UPDATE 7]`

Push → Vercel deploy → manuaalitesti tuotannossa → IMPROVEMENTS.md + AGENT_STATE.md.
