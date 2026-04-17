// ─── Shared application state ───────────────────────────────────────────────

export const LEVELS = ["I", "A", "B", "C", "M", "E", "L"];
export const BATCH_SIZE = 4;
export const MAX_BATCHES = 3;

export const CRITERIA_LABELS = {
  content: "Sisältö ja ymmärrettävyys",
  vocabulary: "Kielellinen laajuus",
  grammar: "Kielellinen oikeellisuus",
};

export const RATING_COLORS = {
  heikko: "rating-weak",
  kohtalainen: "rating-ok",
  "hyvä": "rating-good",
  erinomainen: "rating-excellent",
};

export let state = {
  // Shared
  mode: "vocab",
  language: "spanish",
  sessionStartTime: null,

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

  // Reading mode
  readingTopic: "animals and nature",
  readingLevel: "C",
  readingBankId: null,
  currentReading: null,
  readingQIndex: 0,
  readingScore: 0,
};

export function resetState(overrides = {}) {
  Object.assign(state, overrides);
}
