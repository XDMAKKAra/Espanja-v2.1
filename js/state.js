// ─── Shared application state ───────────────────────────────────────────────

export const LEVELS = ["I", "A", "B", "C", "M", "E", "L"];
export const BATCH_SIZE = 4;
export const MAX_BATCHES = 3;

export const CRITERIA_LABELS = {
  viestinnallisyys: "Viestinnällisyys",
  kielen_rakenteet:  "Kielen rakenteet",
  sanasto:           "Sanasto",
  kokonaisuus:       "Kokonaisuus",
};

export let state = {
  // Shared
  mode: "vocab",
  // L-LANG-INFRA-1: target language code ("es" | "de" | "fr"). Hydrated from
  // user_profile.target_language after login. Default "es" (Spanish).
  language: "es",
  sessionStartTime: null,

  // First-ever session flag (set by S4 onboarding, consumed + cleared
  // by the vocab/grammar result screen after the celebration overlay).
  firstSession: false,

  // Vocab mode
  exercises: [],
  current: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  batchCorrect: 0,
  batchNumber: 0,
  level: "B",
  startLevel: "B",
  peakLevel: "B",
  topic: "general vocabulary",
  bankId: null,
  recentVocabHeadwords: [],

  // Writing mode
  writingTaskType: "short",
  writingTopic: "general",
  currentWritingTask: null,

  // Grammar mode
  grammarTopic: "mixed",
  grammarLevel: "C",
  grammarExercises: [],
  grammarBankId: null,
  grammarCurrent: 0,
  grammarCorrect: 0,
  grammarErrors: [],
  quickReviewStreak: 0,
  quickReviewAutoTriggered: false,
  recentGrammarRules: [],

  // Reading mode
  readingTopic: "animals and nature",
  readingLevel: "C",
  readingBankId: null,
  recentReadingTitles: [],
  currentReading: null,
  readingQIndex: 0,
  readingScore: 0,
};

export function resetState(overrides = {}) {
  Object.assign(state, overrides);
}

// L-LANG-INFRA-1: set the active language and persist nothing (source of truth
// is user_profile.target_language; this is in-memory only for the session).
export function setLanguage(lang) {
  const allowed = ["es", "de", "fr"];
  state.language = allowed.includes(lang) ? lang : "es";
}

// Convert the 2-letter session code ("es"/"de"/"fr") into the full
// language name the server's VALID_LANGUAGES set accepts
// ("spanish"/"german"/"french"). Exercise endpoints validate against
// the long form — sending the short code silently 400s with
// "Virheellinen kieli" and no exercise ever loads.
const LANG_LONG = { es: "spanish", de: "german", fr: "french" };
export function apiLang(lang = state.language) {
  return LANG_LONG[lang] || "spanish";
}
