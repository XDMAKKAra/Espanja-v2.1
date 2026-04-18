/**
 * Exercise Composer — builds OpenAI prompts combining level + scaffold + type.
 *
 * Key principle: ALL exercise types exist at ALL levels.
 * Level controls vocabulary/grammar complexity.
 * Scaffold controls how much help is visible.
 * Type controls the exercise format.
 */

import { LEVEL_DESCRIPTIONS, LANGUAGE_META } from "./openai.js";
import { scaffoldPromptFragment } from "./scaffoldEngine.js";

const EXERCISE_TYPES = ["multichoice", "gap_fill", "matching", "reorder", "translate_mini"];

const TYPE_TOPIC_AFFINITY = {
  vocab: ["multichoice", "matching", "gap_fill", "translate_mini"],
  grammar: ["gap_fill", "multichoice", "reorder", "translate_mini"],
  ser_estar: ["gap_fill", "multichoice", "reorder"],
  subjunctive: ["gap_fill", "multichoice", "translate_mini"],
  preterite_imperfect: ["gap_fill", "multichoice", "reorder"],
  verbs: ["gap_fill", "reorder", "translate_mini"],
  writing: ["translate_mini"],
  reading: ["multichoice"],
};

/**
 * Pick exercise type based on variety rules + topic affinity.
 * @param {string} topic - Current topic
 * @param {string[]} recentTypes - Last 2-3 types used
 * @param {string|null} userPreference - User's preferred type (opt-in)
 */
export function pickExerciseType(topic, recentTypes = [], userPreference = null) {
  // Eligible types for this topic
  const eligible = TYPE_TOPIC_AFFINITY[topic] || EXERCISE_TYPES;

  // Don't repeat same type 3x in a row
  let filtered = eligible;
  if (recentTypes.length >= 2 && recentTypes[0] === recentTypes[1]) {
    filtered = eligible.filter(t => t !== recentTypes[0]);
  }

  // User preference gets 50% weight
  if (userPreference && filtered.includes(userPreference) && Math.random() < 0.5) {
    return userPreference;
  }

  // Random from remaining
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Compose the full OpenAI prompt for an exercise.
 *
 * @param {Object} params
 * @param {string} params.level - User's persistent level (I–L)
 * @param {string} params.type - Exercise type
 * @param {number} params.scaffoldLevel - 0–3
 * @param {string} params.topic - Topic area
 * @param {number} params.count - Number of exercises
 * @param {string} params.language - Target language
 * @param {string} params.profileContext - User profile context string
 */
export function composePrompt({ level, type, scaffoldLevel, topic, count, language, profileContext }) {
  const lang = LANGUAGE_META[language] || LANGUAGE_META.spanish;
  const levelDesc = LEVEL_DESCRIPTIONS[level] || LEVEL_DESCRIPTIONS["B"];
  const scaffoldInstr = scaffoldPromptFragment(scaffoldLevel);

  const base = `You are generating ${lang.name} exercises for Finnish high school students (yo-koe, lyhyt oppimäärä, ${lang.yearsStudied}).
${profileContext || ""}
LEVEL: ${level} = ${levelDesc}
${scaffoldInstr}
TOPIC: ${topic}
COUNT: ${count}

CRITICAL RULES:
- Vocabulary and grammar complexity MUST match level ${level}
- The EXERCISE FORMAT is "${type}" — this is the interaction style, NOT the difficulty
- Difficulty comes from the LEVEL, not the format
- All text in Finnish for instructions/explanations, ${lang.name} for content
- Each exercise MUST include "topics" field: array of 1-3 canonical topic keys from this list:
  ser_estar, subjunctive, ojala_expression, preterite_imperfect, conditional, future,
  pronouns, reflexive_verbs, por_para, prepositions, articles, gender_agreement,
  adjective_position, comparatives, word_order, negation, irregular_verbs, regular_verbs,
  gustar_verbs, relative_pronouns, imperative, passive_voice, daily_life, travel, food,
  work, education, environment, technology, health, society, culture, abstract_vocabulary,
  idioms, false_friends, connectors, inference, vocabulary_in_context
`;

  switch (type) {
    case "gap_fill":
      return base + composeGapFill(scaffoldLevel, lang, level);
    case "matching":
      return base + composeMatching(lang, level);
    case "reorder":
      return base + composeReorder(lang, level);
    case "translate_mini":
      return base + composeTranslateMini(lang, level);
    default:
      return base + composeMultichoice(scaffoldLevel, lang, level);
  }
}

function composeMultichoice(scaffold, lang, level) {
  return `
Generate multiple-choice exercises. Each has a question and 4 options (A/B/C/D).

${scaffold >= 3 ? "Include a Finnish translation hint for the target word." : ""}
${scaffold >= 1 ? "Include a context sentence with the target word highlighted." : ""}

Return ONLY JSON array:
[{
  "id": 1,
  "type": "multichoice",
  "question": "Question text",
  ${scaffold >= 1 ? '"context": "Context sentence in ' + lang.name + '",' : ""}
  ${scaffold >= 3 ? '"translationHint": "Finnish hint",' : ""}
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": "A",
  "explanation": "Brief explanation in Finnish"
}]`;
}

function composeGapFill(scaffold, lang, level) {
  const hintInstruction = scaffold >= 2
    ? `Include "hint" field with the infinitive + grammatical form, e.g. "(ser, imperfekti)".
Include "options" array with 3 choices if scaffold is high.`
    : scaffold >= 1
      ? `Include "hint" with just the infinitive, e.g. "(ser)". No options array.`
      : `No hint, no options. Student must produce the word from memory.`;

  return `
Generate gap-fill exercises. Each has a ${lang.name} sentence with ___ blank.
${hintInstruction}

${scaffold >= 3 ? 'Include "finnishTranslation" field with the full sentence in Finnish.' : ""}

Return ONLY JSON array:
[{
  "id": 1,
  "type": "gap_fill",
  "sentence": "Cuando ___ pequeño, jugaba al fútbol.",
  ${scaffold >= 1 ? '"hint": "(ser, imperfekti)",' : ""}
  ${scaffold >= 2 ? '"options": ["era", "fue", "soy"],' : ""}
  ${scaffold >= 3 ? '"finnishTranslation": "Kun olin pieni, pelasin jalkapalloa.",' : ""}
  "correctAnswer": "era",
  "alternativeAnswers": ["era"],
  "explanation": "Brief explanation in Finnish"
}]`;
}

function composeMatching(lang, level) {
  return `
Generate a matching exercise: 6 ${lang.name} words/phrases paired with Finnish translations.
Words must be level-${level}-appropriate.

Return ONLY JSON:
{
  "type": "matching",
  "pairs": [
    { "spanish": "word in ${lang.name}", "finnish": "Finnish translation" }
  ]
}`;
}

function composeReorder(lang, level) {
  return `
Generate word-reorder exercises. Each: Finnish hint + scrambled ${lang.name} words.
Focus on word order challenges appropriate for level ${level}: adjective placement, pronoun position, negation.

Return ONLY JSON array:
[{
  "id": 1,
  "type": "reorder",
  "finnishHint": "Finnish translation of the sentence",
  "scrambled": ["word3", "word1", "word4", "word2"],
  "correct": ["word1", "word2", "word3", "word4"],
  "explanation": "Brief explanation of the word order rule in Finnish"
}]`;
}

function composeTranslateMini(lang, level) {
  return `
Generate mini-translation exercises: short Finnish sentences to translate into ${lang.name}.
Sentences should test grammar appropriate for level ${level}.

Return ONLY JSON array:
[{
  "id": 1,
  "type": "translate_mini",
  "finnishSentence": "Short Finnish sentence (5-12 words)",
  "acceptedTranslations": ["primary ${lang.name} translation", "alternative translation"],
  "grammarFocus": "grammar point tested",
  "explanation": "Brief explanation in Finnish"
}]`;
}

/**
 * Get max tokens based on exercise type and count.
 */
export function getMaxTokens(type, count) {
  const base = {
    multichoice: 400,
    gap_fill: 300,
    matching: 800,
    reorder: 350,
    translate_mini: 350,
  };
  return Math.min((base[type] || 400) * Math.max(count, 1), 3000);
}
