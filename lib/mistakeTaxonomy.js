/**
 * Mistake taxonomy — canonical topic/subtopic labels.
 * Used to tag exercises and categorize user mistakes.
 */

// Canonical topic keys (stable — used in DB)
export const TOPIC_LABELS = {
  // Grammar
  ser_estar: "ser vs. estar",
  subjunctive: "Subjunktiivi",
  ojala_expression: "Ojalá-ilmaus",
  preterite_imperfect: "Preteriti vs. imperfekti",
  conditional: "Konditionaali",
  future: "Futuuri",
  past_tenses: "Menneet aikamuodot",
  pronouns: "Pronominit",
  reflexive_verbs: "Refleksiiviverbit",
  por_para: "Por vs. para",
  prepositions: "Prepositiot",
  articles: "Artikkelit",
  gender_agreement: "Suku ja lukukongruenssi",
  adjective_position: "Adjektiivin paikka",
  comparatives: "Vertailumuodot",
  word_order: "Sanajärjestys",
  negation: "Kieltosanat",
  irregular_verbs: "Epäsäännölliset verbit",
  regular_verbs: "Säännölliset verbit",
  gustar_verbs: "Gustar-tyyppiset verbit",
  relative_pronouns: "Relatiivipronominit",
  imperative: "Käskymuoto",
  passive_voice: "Passiivi",
  // Vocabulary
  daily_life: "Arkielämän sanasto",
  travel: "Matkustussanasto",
  food: "Ruokasanasto",
  work: "Työelämän sanasto",
  education: "Koulutussanasto",
  environment: "Ympäristösanasto",
  technology: "Teknologiasanasto",
  health: "Terveyssanasto",
  society: "Yhteiskuntasanasto",
  culture: "Kulttuurisanasto",
  abstract_vocabulary: "Abstrakti sanasto",
  idioms: "Idiomit",
  cognates: "Sukulaissanat",
  false_friends: "Väärät ystävät",
  connectors: "Konjunktiot",
  // Reading/comprehension
  inference: "Päättely",
  vocabulary_in_context: "Sana kontekstissa",
  main_idea: "Pääajatus",
};

export const VALID_TOPICS = new Set(Object.keys(TOPIC_LABELS));

/**
 * Get human-readable Finnish label for a topic key.
 */
export function topicLabel(key) {
  return TOPIC_LABELS[key] || key;
}

/**
 * Validate and filter a topics array.
 */
export function normalizeTopics(topics) {
  if (!Array.isArray(topics)) return [];
  return topics
    .filter(t => typeof t === "string")
    .map(t => t.toLowerCase().trim().replace(/[^a-z_]/g, ""))
    .filter(t => VALID_TOPICS.has(t))
    .slice(0, 3);
}

/**
 * Infer topics from exercise content when AI doesn't provide them.
 * Simple keyword-based fallback.
 */
export function inferTopics(exercise) {
  const text = [
    exercise.question,
    exercise.sentence,
    exercise.explanation,
    exercise.rule,
    exercise.finnishSentence,
  ].filter(Boolean).join(" ").toLowerCase();

  const topics = [];
  const rules = [
    [/subjunt|ojalá|que.*sea|que.*pueda|esté|tenga/i, "subjunctive"],
    [/ojalá/i, "ojala_expression"],
    [/ser|estar/i, "ser_estar"],
    [/imperfekt|preteriti|pret[ée]rit/i, "preterite_imperfect"],
    [/konditionaali|gustaría|querría|habría/i, "conditional"],
    [/por.*para|para.*por/i, "por_para"],
    [/gustar|encantar|interesar/i, "gustar_verbs"],
    [/refleksiivi|se\s|me\s|te\s/i, "reflexive_verbs"],
    [/futuuri|future|aré|arás|ará/i, "future"],
    [/artikkel|el\s|la\s|los\s|las\s/i, "articles"],
    [/adjektiiv/i, "adjective_position"],
    [/sanaj[aä]rjest/i, "word_order"],
    [/preposit/i, "prepositions"],
    [/relatiivi|que|quien|cuyo/i, "relative_pronouns"],
    [/k[äa]skymuoto|imperativ/i, "imperative"],
    [/vertail|comparati/i, "comparatives"],
  ];

  for (const [re, topic] of rules) {
    if (re.test(text) && !topics.includes(topic)) {
      topics.push(topic);
      if (topics.length >= 3) break;
    }
  }

  return topics;
}
