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
  language: "spanish",
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
