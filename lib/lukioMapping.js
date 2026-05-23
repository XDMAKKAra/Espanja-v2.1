/**
 * Lukio textbook → grammar exposure mapping (L-V292-LUKIO-MAPPING-1).
 *
 * Purpose: when a student tells onboarding "I took lukio kurssi K6 and it
 * went badly", we need to know WHICH grammar topics they were exposed to in
 * K6 of their specific textbook, so the Puheo reasoner (L-V294) can weight
 * the right Puheo courses.
 *
 * Topic-key taxonomy: uses the same keys as `grammar_focus` in
 * `lib/curriculumData.js` (e.g. "preterite", "subjunctive_present",
 * "konjunktiv_ii_polite", "passe_compose_vs_imparfait"). This avoids a
 * translation layer between this mapping and the curriculum data.
 *
 * Textbook differences: in B3-oppimäärä, both common textbooks per language
 * follow LOPS 2021 module specs (SAB31-38 / SAB B3 / RAB31-38), so the
 * grammar progression is mostly identical to curriculumData.js. We only
 * encode *deviations* — where one textbook introduces a topic a kurssi
 * earlier/later than the LOPS standard. The `default` mapping mirrors the
 * curriculum standard exactly.
 *
 * Vocab themes are intentionally NOT mapped here — sanasto-erot per
 * oppikirja ovat siedettäviä (matkustaminen vs harrastukset K3:ssa).
 * Reasoner uses kurssi-level vocab_theme from curriculumData.js directly.
 *
 * Source notes:
 * - Spanish: Mi mundo 1-3 (SanomaPro) + ¡Acción! 1-3 (Otava). Acción
 *   introduces gustar in K1 (alongside ser/estar) where Mi mundo defers to
 *   K2. Mi mundo introduces subjunctive in K6; Acción reserves it for K7.
 * - German: Magazin.de (SanomaPro) and Genau! (Otava). Both track LOPS
 *   SAB B3 module specs closely; we encode the standard for both.
 * - French: J'aime + C'est parti! (SanomaPro), Voilà! (Otava). Track LOPS
 *   RAB31-38 module specs.
 *
 * Caveat: SanomaPro/Otava don't publish per-kurssi grammar tables
 * publicly. The textbook-level differentiation here reflects the broad
 * pedagogical patterns documented in textbook reviews and teacher guides.
 * If onboarding shows the mapping makes no meaningful difference between
 * textbooks for a language, that's a signal to drop the textbook question
 * from the UI for that language.
 */

// Spanish — Mi mundo (SanomaPro), most common B3 textbook
const ES_MI_MUNDO = {
  name: "Mi mundo",
  publisher: "SanomaPro",
  grammar_by_kurssi: {
    1: ["present_regular", "articles", "gender_agreement"],
    2: ["present_irregular", "gustar_verbs", "ser_estar"],
    3: ["preterite", "past_tenses", "pronouns_direct_object"],
    4: ["imperfect", "preterite_vs_imperfect", "comparatives"],
    5: ["future", "conditional", "por_para"],
    6: ["subjunctive_present", "ojala_expression", "imperative"],
    7: ["subjunctive_present", "pluscuamperfecto", "relative_pronouns"],
    8: ["subjunctive_imperfect", "exam_review"],
  },
};

// Spanish — ¡Acción! (Otava). Differs from Mi mundo: gustar earlier (K1),
// subjunctive deferred (K7 intro instead of K6).
const ES_ACCION = {
  name: "¡Acción!",
  publisher: "Otava",
  grammar_by_kurssi: {
    1: ["present_regular", "ser_estar", "gustar_verbs"],
    2: ["present_irregular", "articles", "gender_agreement"],
    3: ["preterite", "past_tenses"],
    4: ["imperfect", "preterite_vs_imperfect", "pronouns_direct_object"],
    5: ["future", "conditional", "comparatives"],
    6: ["por_para", "imperative", "relative_pronouns"],
    7: ["subjunctive_present", "ojala_expression", "pluscuamperfecto"],
    8: ["subjunctive_imperfect", "subjunctive_present", "exam_review"],
  },
};

// Default Spanish mapping = LOPS B3 standard, mirrors curriculumData.js.
const ES_DEFAULT = {
  name: "Yleinen oletus (LOPS B3)",
  publisher: null,
  grammar_by_kurssi: {
    1: ["present_regular"],
    2: ["present_irregular", "gustar_verbs"],
    3: ["preterite"],
    4: ["imperfect", "preterite_vs_imperfect"],
    5: ["future", "conditional"],
    6: ["subjunctive_present"],
    7: ["subjunctive_present", "pluscuamperfecto"],
    8: ["subjunctive_imperfect", "exam_review"],
  },
};

// German — Magazin.de (SanomaPro)
const DE_MAGAZIN = {
  name: "Magazin.de",
  publisher: "SanomaPro",
  grammar_by_kurssi: {
    1: ["present_regular", "articles_nominative"],
    2: ["present_irregular", "accusative_case", "modal_verbs"],
    3: ["perfekt", "past_participles", "v2_word_order"],
    4: ["praeteritum", "dative_prepositions", "subordinate_clauses_weil_dass"],
    5: ["futur", "subordinate_clauses_wenn", "verb_end_subordinate"],
    6: ["passive_voice", "konjunktiv_ii_polite"],
    7: ["konjunktiv_ii", "genitive_case", "subordinate_clauses_obwohl"],
    8: ["konjunktiv_ii_advanced", "indirect_speech", "exam_review"],
  },
};

// German — Genau! (Otava). Mirrors LOPS module specs; minor reordering of
// dative vs accusative (Genau introduces Dativ a kurssi earlier).
const DE_GENAU = {
  name: "Genau!",
  publisher: "Otava",
  grammar_by_kurssi: {
    1: ["present_regular", "articles_nominative"],
    2: ["present_irregular", "accusative_case", "modal_verbs", "dative_prepositions"],
    3: ["perfekt", "past_participles", "v2_word_order"],
    4: ["praeteritum", "subordinate_clauses_weil_dass"],
    5: ["futur", "subordinate_clauses_wenn", "verb_end_subordinate"],
    6: ["passive_voice", "konjunktiv_ii_polite"],
    7: ["konjunktiv_ii", "genitive_case", "subordinate_clauses_obwohl"],
    8: ["konjunktiv_ii_advanced", "indirect_speech", "exam_review"],
  },
};

const DE_DEFAULT = {
  name: "Yleinen oletus (LOPS B3)",
  publisher: null,
  grammar_by_kurssi: {
    1: ["present_regular", "articles_nominative"],
    2: ["present_irregular", "accusative_case", "modal_verbs"],
    3: ["perfekt", "past_participles", "v2_word_order"],
    4: ["praeteritum", "dative_prepositions", "subordinate_clauses_weil_dass"],
    5: ["futur", "subordinate_clauses_wenn", "verb_end_subordinate"],
    6: ["passive_voice", "konjunktiv_ii_polite"],
    7: ["konjunktiv_ii", "genitive_case", "subordinate_clauses_obwohl"],
    8: ["konjunktiv_ii_advanced", "indirect_speech", "exam_review"],
  },
};

// French — J'aime (SanomaPro)
const FR_JAIME = {
  name: "J'aime",
  publisher: "SanomaPro",
  grammar_by_kurssi: {
    1: ["present_regular", "definite_articles", "negation_ne_pas"],
    2: ["present_irregular", "partitive_articles", "gender_number_agreement"],
    3: ["passe_compose", "etre_vs_avoir_aux", "country_prepositions"],
    4: ["imparfait", "passe_compose_vs_imparfait"],
    5: ["futur_simple", "futur_proche", "conditionnel_present"],
    6: ["subjonctif_present"],
    7: ["plus_que_parfait", "subjonctif_advanced", "relative_pronouns"],
    8: ["si_hypotheses", "conditionnel_passe", "exam_review"],
  },
};

// French — C'est parti! (SanomaPro). Same publisher as J'aime, similar
// pedagogy; we keep them identical here unless review surfaces a
// documented deviation.
const FR_CEST_PARTI = {
  name: "C'est parti!",
  publisher: "SanomaPro",
  grammar_by_kurssi: {
    1: ["present_regular", "definite_articles", "negation_ne_pas"],
    2: ["present_irregular", "partitive_articles", "gender_number_agreement"],
    3: ["passe_compose", "etre_vs_avoir_aux", "country_prepositions"],
    4: ["imparfait", "passe_compose_vs_imparfait"],
    5: ["futur_simple", "futur_proche", "conditionnel_present"],
    6: ["subjonctif_present"],
    7: ["plus_que_parfait", "subjonctif_advanced", "relative_pronouns"],
    8: ["si_hypotheses", "conditionnel_passe", "exam_review"],
  },
};

// French — Voilà! (Otava). Introduces relative pronouns earlier (K6 vs K7).
const FR_VOILA = {
  name: "Voilà!",
  publisher: "Otava",
  grammar_by_kurssi: {
    1: ["present_regular", "definite_articles", "negation_ne_pas"],
    2: ["present_irregular", "partitive_articles", "gender_number_agreement"],
    3: ["passe_compose", "etre_vs_avoir_aux"],
    4: ["imparfait", "passe_compose_vs_imparfait", "country_prepositions"],
    5: ["futur_simple", "futur_proche", "conditionnel_present"],
    6: ["subjonctif_present", "relative_pronouns"],
    7: ["plus_que_parfait", "subjonctif_advanced"],
    8: ["si_hypotheses", "conditionnel_passe", "exam_review"],
  },
};

const FR_DEFAULT = {
  name: "Yleinen oletus (LOPS B3)",
  publisher: null,
  grammar_by_kurssi: {
    1: ["present_regular", "definite_articles"],
    2: ["present_irregular", "partitive_articles", "gender_number_agreement"],
    3: ["passe_compose", "etre_vs_avoir_aux"],
    4: ["imparfait", "passe_compose_vs_imparfait"],
    5: ["futur_simple", "conditionnel_present"],
    6: ["subjonctif_present"],
    7: ["plus_que_parfait", "subjonctif_advanced", "relative_pronouns"],
    8: ["si_hypotheses", "conditionnel_passe", "exam_review"],
  },
};

/**
 * All textbook mappings, keyed by language. Each language has 2-3 named
 * textbooks plus a `default` fallback (used for "muu" / "en muista" /
 * unknown textbook key).
 */
export const TEXTBOOK_MAPPING = {
  es: {
    mi_mundo: ES_MI_MUNDO,
    accion: ES_ACCION,
    default: ES_DEFAULT,
  },
  de: {
    magazin_de: DE_MAGAZIN,
    genau: DE_GENAU,
    default: DE_DEFAULT,
  },
  fr: {
    jaime: FR_JAIME,
    cest_parti: FR_CEST_PARTI,
    voila: FR_VOILA,
    default: FR_DEFAULT,
  },
};

/**
 * Reverse mapping: grammar topic → Puheo courses that drill it.
 *
 * Per language, because topic keys differ (preterite is Spanish; perfekt
 * is German; passe_compose is French). When a student is weak in topic X,
 * the reasoner up-weights the Puheo courses listed here.
 *
 * Source: curriculumData.js `grammar_focus` field, inverted.
 */
export const TOPIC_TO_PUHEO_COURSE = {
  es: {
    present_regular: ["kurssi_1"],
    present_irregular: ["kurssi_2"],
    ser_estar: ["kurssi_1", "kurssi_2"],
    gustar_verbs: ["kurssi_2"],
    articles: ["kurssi_1"],
    gender_agreement: ["kurssi_1"],
    preterite: ["kurssi_3"],
    past_tenses: ["kurssi_3", "kurssi_4"],
    imperfect: ["kurssi_4"],
    preterite_vs_imperfect: ["kurssi_4"],
    pronouns_direct_object: ["kurssi_3", "kurssi_4"],
    comparatives: ["kurssi_4", "kurssi_5"],
    future: ["kurssi_5"],
    conditional: ["kurssi_5"],
    por_para: ["kurssi_5", "kurssi_6"],
    subjunctive_present: ["kurssi_6", "kurssi_7"],
    ojala_expression: ["kurssi_6"],
    imperative: ["kurssi_6"],
    pluscuamperfecto: ["kurssi_7"],
    relative_pronouns: ["kurssi_7"],
    subjunctive_imperfect: ["kurssi_8"],
    exam_review: ["kurssi_8"],
  },
  de: {
    present_regular: ["kurssi_1"],
    present_irregular: ["kurssi_2"],
    articles_nominative: ["kurssi_1"],
    accusative_case: ["kurssi_2"],
    modal_verbs: ["kurssi_2"],
    perfekt: ["kurssi_3"],
    past_participles: ["kurssi_3"],
    v2_word_order: ["kurssi_3"],
    praeteritum: ["kurssi_4"],
    dative_prepositions: ["kurssi_2", "kurssi_4"],
    subordinate_clauses_weil_dass: ["kurssi_4"],
    futur: ["kurssi_5"],
    subordinate_clauses_wenn: ["kurssi_5"],
    verb_end_subordinate: ["kurssi_5"],
    passive_voice: ["kurssi_6"],
    konjunktiv_ii_polite: ["kurssi_6"],
    konjunktiv_ii: ["kurssi_7"],
    genitive_case: ["kurssi_7"],
    subordinate_clauses_obwohl: ["kurssi_7"],
    konjunktiv_ii_advanced: ["kurssi_8"],
    indirect_speech: ["kurssi_8"],
    exam_review: ["kurssi_8"],
  },
  fr: {
    present_regular: ["kurssi_1"],
    present_irregular: ["kurssi_2"],
    definite_articles: ["kurssi_1"],
    negation_ne_pas: ["kurssi_1"],
    partitive_articles: ["kurssi_2"],
    gender_number_agreement: ["kurssi_2"],
    passe_compose: ["kurssi_3"],
    etre_vs_avoir_aux: ["kurssi_3"],
    country_prepositions: ["kurssi_3", "kurssi_4"],
    imparfait: ["kurssi_4"],
    passe_compose_vs_imparfait: ["kurssi_4"],
    futur_simple: ["kurssi_5"],
    futur_proche: ["kurssi_5"],
    conditionnel_present: ["kurssi_5"],
    subjonctif_present: ["kurssi_6"],
    plus_que_parfait: ["kurssi_7"],
    subjonctif_advanced: ["kurssi_7"],
    relative_pronouns: ["kurssi_6", "kurssi_7"],
    si_hypotheses: ["kurssi_8"],
    conditionnel_passe: ["kurssi_8"],
    exam_review: ["kurssi_8"],
  },
};

const SUPPORTED_LANGS = new Set(["es", "de", "fr"]);
const PUHEO_COURSES = ["kurssi_1", "kurssi_2", "kurssi_3", "kurssi_4", "kurssi_5", "kurssi_6", "kurssi_7", "kurssi_8"];

const WEAK_TOPIC_WEIGHT = 3.0;
const NEUTRAL_WEIGHT = 1.0;
const UNRELATED_WEIGHT = 0.5;

/**
 * Resolve a textbook entry, falling back to language `default` if the key
 * is unknown. Returns `null` if the language is unsupported.
 *
 * @param {string} lang
 * @param {string} textbookKey
 */
function resolveTextbook(lang, textbookKey) {
  if (!SUPPORTED_LANGS.has(lang)) return null;
  const langMap = TEXTBOOK_MAPPING[lang];
  return langMap[textbookKey] || langMap.default;
}

/**
 * Infer which grammar topics a student has plausibly been exposed to in
 * lukio, given their textbook and the kurssit they've completed.
 *
 * @param {string} lang - 'es' | 'de' | 'fr'
 * @param {string} textbookKey - e.g. 'mi_mundo', 'genau', 'jaime', 'default'
 * @param {number[]} coursesCompleted - lukio kurssi numbers (1-8)
 * @returns {string[]} - unique topic keys, e.g. ['preterite', 'imperfect', ...]
 */
export function inferGrammarExposure(lang, textbookKey, coursesCompleted) {
  const book = resolveTextbook(lang, textbookKey);
  if (!book || !Array.isArray(coursesCompleted)) return [];

  const seen = new Set();
  for (const k of coursesCompleted) {
    const topics = book.grammar_by_kurssi[k];
    if (!Array.isArray(topics)) continue;
    for (const t of topics) seen.add(t);
  }
  return Array.from(seen);
}

/**
 * Given a list of grammar topics the student is weak in, compute a weight
 * vector for each Puheo course. Weights are used by the L-V294 reasoner
 * to bias exercise selection toward courses that drill weak topics.
 *
 * Weighting:
 * - Course that drills ≥1 weak topic: WEAK_TOPIC_WEIGHT (3.0)
 * - Course with no matching weak topics, but related to lang: NEUTRAL (1.0)
 *   This is the default — a course gets neutral weight unless we have a
 *   specific reason to up- or down-weight it.
 *
 * Note: we do not down-weight unrelated courses here. The reasoner may
 * choose to do so based on level/prerequisites; we only signal which
 * courses are *positively indicated* by weak topics.
 *
 * @param {string} lang
 * @param {string[]} weakTopics
 * @returns {Object} - { kurssi_1: number, kurssi_2: number, ... }
 */
export function computeCourseWeights(lang, weakTopics) {
  const weights = {};
  for (const c of PUHEO_COURSES) weights[c] = NEUTRAL_WEIGHT;

  if (!SUPPORTED_LANGS.has(lang) || !Array.isArray(weakTopics) || weakTopics.length === 0) {
    return weights;
  }
  const reverseMap = TOPIC_TO_PUHEO_COURSE[lang];
  if (!reverseMap) return weights;

  for (const topic of weakTopics) {
    const courses = reverseMap[topic];
    if (!Array.isArray(courses)) continue;
    for (const c of courses) {
      weights[c] = WEAK_TOPIC_WEIGHT;
    }
  }
  return weights;
}

/**
 * Convenience: list of textbook keys available for a language, in display
 * order (most common first). Used by the L-V293 onboarding screen.
 *
 * @param {string} lang
 * @returns {Array<{ key: string, name: string, publisher: string|null }>}
 */
export function textbookOptionsFor(lang) {
  if (!SUPPORTED_LANGS.has(lang)) return [];
  const langMap = TEXTBOOK_MAPPING[lang];
  return Object.entries(langMap)
    .filter(([key]) => key !== "default")
    .map(([key, book]) => ({ key, name: book.name, publisher: book.publisher }));
}
