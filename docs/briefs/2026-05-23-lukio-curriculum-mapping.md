# BRIEF: Lukio-curriculum-mapping per oppikirja (L-V292-LUKIO-MAPPING-1)

**Päivä:** 2026-05-23
**Loop:** L-V292-LUKIO-MAPPING-1
**Prioriteetti:** P0 (ensin, sitten V293/V294)
**Koko:** pieni-keskisuuri (1 commit, vain data + 1 utility-funktio)
**Skill-stack:** `practice-problem-sequence-designer`, `criterion-referenced-rubric-generator`, `cognitive-load-analyser`

---

## Tausta ja päätös

Puheo on YO-koe-kertaussovellus. Oppilas on **jo opiskellut** kieltä lukiossa — Puheo ei opeta uusiksi. Personalisaatiologiikka tarvitsee tiedon: kun oppilas sanoo "kävin lukion K6:n ja se meni huonosti", mihin Puheo-kurssiin painotetaan?

Käyttäjän direktiivi (2026-05-23 council-päätös):
- **EI muuteta Puheon kurssirakennetta** — kielioppi-progressio K1→K8 on jo käytännössä 1:1 yleisimpien lukio-oppikirjojen kanssa
- **EI muuteta lesson-sisältöä** — sanasto-erot LOPS-teemoihin (matkustaminen vs harrastukset K3:ssa) ovat siedettäviä
- **Lisätään uusi mapping-data** joka kertoo: per oppikirja per lukio-kurssi → mitä kielioppi-aiheita käsiteltiin → mihin Puheo-kurssiin painotetaan

## Mitä rakennetaan

### 1. Uusi tiedosto `lib/lukioMapping.js`

Sisältää kolme datarakennetta per kieli (es/de/fr):

**A) Oppikirja-mapping** — mikä kielioppi-aihe missäkin lukio-kurssissa per oppikirja

```js
// es
const ES_TEXTBOOK_MAPPING = {
  mi_mundo: {  // Mi mundo 1-3, SanomaPro, yleisin
    name: "Mi mundo",
    publisher: "SanomaPro",
    grammar_by_kurssi: {
      1: ["present_regular", "ser_estar", "articles", "numbers"],
      2: ["present_irregular", "gustar", "stem_changing", "tener_que"],
      3: ["preterite_regular", "preterite_irregular", "time_expressions"],
      4: ["imperfect", "preterite_vs_imperfect", "estaba_haciendo"],
      5: ["future_simple", "conditional", "future_perfect"],
      6: ["subjunctive_present", "imperative", "ojala"],
      7: ["subjunctive_present_advanced", "pluperfect", "passive_voice"],
      8: ["subjunctive_imperfect", "si_clauses", "review_all"],
    },
  },
  accion: {  // ¡Acción! 1-3, Otava, toiseksi yleisin
    name: "¡Acción!",
    publisher: "Otava",
    grammar_by_kurssi: {
      1: ["present_regular", "ser_estar", "gustar_intro"],
      2: ["present_irregular", "gustar", "comparatives"],
      3: ["preterite_regular", "irregular_common", "direct_objects"],
      4: ["imperfect", "preterite_vs_imperfect"],
      5: ["future_simple", "conditional", "indirect_objects"],
      6: ["subjunctive_present_intro"],
      7: ["subjunctive_present_full", "pluperfect", "relative_pronouns"],
      8: ["subjunctive_imperfect", "si_clauses", "exam_review"],
    },
  },
  default: {  // Käytetään kun "Muu" tai "En muista"
    name: "Yleinen oletus",
    publisher: null,
    grammar_by_kurssi: {
      // Sama kuin Mi mundo (yleisin) — antaa kohtuullisen oletuksen
      1: ["present_regular", "ser_estar"],
      2: ["present_irregular", "gustar"],
      3: ["preterite"],
      4: ["imperfect", "preterite_vs_imperfect"],
      5: ["future", "conditional"],
      6: ["subjunctive_present"],
      7: ["subjunctive_advanced", "pluperfect"],
      8: ["subjunctive_imperfect", "si_clauses", "review"],
    },
  },
};
```

Sama rakenne saksalle (DE: `magazin_de`, `plan_d`, `genau`, `default`) ja ranskalle (FR: `jaime`, `cest_parti`, `voila`, `default`).

**B) Reverse mapping** — kun aihe on heikko, mihin Puheo-kursseihin painotetaan

```js
const ES_TOPIC_TO_PUHEO_COURSE = {
  present_regular: ["kurssi_1"],
  present_irregular: ["kurssi_2"],
  preterite: ["kurssi_3"],
  preterite_vs_imperfect: ["kurssi_4"],
  imperfect: ["kurssi_4"],
  future: ["kurssi_5"],
  conditional: ["kurssi_5"],
  subjunctive_present: ["kurssi_6"],
  subjunctive_present_advanced: ["kurssi_6", "kurssi_7"],
  pluperfect: ["kurssi_7"],
  subjunctive_imperfect: ["kurssi_8"],
  si_clauses: ["kurssi_8"],
  // sanasto-teemat
  vocab_family: ["kurssi_1"],
  vocab_home: ["kurssi_2"],
  vocab_travel: ["kurssi_3"],
  vocab_nature: ["kurssi_4"],
  vocab_work: ["kurssi_5", "kurssi_7"],
  vocab_society: ["kurssi_6", "kurssi_8"],
  vocab_culture: ["kurssi_6"],
};
```

**C) Utility-funktiot**

```js
/**
 * Päättele mitä kielioppi-aiheita oppilas on todennäköisesti kohdannut
 * @param {string} lang - 'es' | 'de' | 'fr'
 * @param {string} textbookKey - 'mi_mundo' | 'accion' | 'default' | ...
 * @param {number[]} coursesCompleted - käytyjen lukio-kurssien numerot, esim. [1,2,3,4,6,7]
 * @returns {string[]} - lista kielioppi-aiheita, esim. ['preterite', 'subjunctive_present', ...]
 */
export function inferGrammarExposure(lang, textbookKey, coursesCompleted) { ... }

/**
 * Anna paino-vektori Puheo-kursseille perustuen heikkoihin aiheisiin
 * @param {string} lang
 * @param {string[]} weakTopics - aiheet joissa oppilas on heikko
 * @returns {Object} - { 'kurssi_1': 0.5, 'kurssi_6': 3.0, ... }
 */
export function computeCourseWeights(lang, weakTopics) { ... }
```

### 2. Tutkimustyö ennen koodausta

Tarkista nämä oppikirja-mappingit suomalaisista oppikirja-katsauksista tai SanomaPron/Otavan tuotesivuilta:
- Mi mundo 1-3: https://www.sanomapro.fi (etsi "Mi mundo")
- ¡Acción! 1-3: https://www.otava.fi (etsi "Acción")
- Saksan Magazin.de, Plan D, Genau — vastaavat
- Ranskan J'aime, C'est parti!, Voilà — vastaavat

**Jos epävarmuus oppikirjan grammar-progressiosta:** käytä `default`-rakennetta ja merkitse koodi-kommenttiin `// TODO: vahvista [oppikirja] -grammar-progressio kustantajan kanssa`. Älä keksi dataa.

### 3. Mihin tämä kytkeytyy myöhemmin

- L-V293 onboarding: jos diagnostinen testi jättää aukon, näytä kuvakanteet 3 yleisimmästä oppikirjasta per kieli (top-3 visible, "muu" + "en muista" equal-weight)
- L-V294 reasoner: käyttää `inferGrammarExposure` + `computeCourseWeights` -funktioita

## EI scope

- Lesson-sisällön muuttaminen
- Curriculum-rakenteen muuttaminen
- Onboarding-UI (L-V293)
- Reasoner-logiikka (L-V294)
- Painotuslogiikan kytkeminen exercise-generointiin (L-V294)
- Oppikirja-kuvakantet (sisältyy L-V293:een)

## Testit

```js
// tests/lukioMapping.test.js
import { inferGrammarExposure, computeCourseWeights } from '../lib/lukioMapping.js';

describe('inferGrammarExposure', () => {
  it('returns grammar topics for ES Mi mundo with courses [1,2,3]', () => {
    const result = inferGrammarExposure('es', 'mi_mundo', [1, 2, 3]);
    expect(result).toContain('present_regular');
    expect(result).toContain('preterite_regular');
    expect(result).not.toContain('subjunctive_present');
  });

  it('returns subjunctive when course 6 completed with Mi mundo', () => {
    const result = inferGrammarExposure('es', 'mi_mundo', [6]);
    expect(result).toContain('subjunctive_present');
  });

  it('falls back to default mapping for unknown textbook', () => {
    const result = inferGrammarExposure('es', 'unknown_book', [3]);
    expect(result).toContain('preterite');
  });
});

describe('computeCourseWeights', () => {
  it('returns 3x weight for Puheo course matching weak topic', () => {
    const weights = computeCourseWeights('es', ['subjunctive_present']);
    expect(weights['kurssi_6']).toBeGreaterThan(1.5);
  });

  it('returns 0.3x weight for course unrelated to weak topics', () => {
    const weights = computeCourseWeights('es', ['subjunctive_present']);
    expect(weights['kurssi_1']).toBeLessThan(0.6);
  });
});
```

## Verify-protokolla

1. Oppikirja-grammar-progressio tarkistettu vähintään yhdestä julkisesta lähteestä per oppikirja (commentoi lähde koodiin)
2. `node --check lib/lukioMapping.js` PASS
3. `npm test` — vitest spec yllä PASS
4. Manuaalinen sanity-check: `node -e "const m = require('./lib/lukioMapping.js'); console.log(m.inferGrammarExposure('es', 'mi_mundo', [3,4]))"` palauttaa preteritin + imperfektin

## Commit-viesti

```
feat(curriculum): lukio textbook-to-grammar mapping per language (L-V292-LUKIO-MAPPING-1, v292)
```

## SW

EI SW-bumppia tarvita (server-side data, ei frontend-asset).

## Pending caller

Tämä on data + utility-funktiot. Käytössä vasta L-V294 reasonerissa. Pidä koodi puhtaana ja hyvin kommentoituna — tämä on personalisaation pohja.
