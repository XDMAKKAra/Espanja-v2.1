// SR scheduler — exam-aware SM-2 with partial-credit bands and state machine

export const EXAM_DATE = new Date("2026-09-28T00:00:00Z");

export const SESSION_BUDGETS = {
  kevyt:        { total: 8,  reviews: 6,  newCards: 2  },
  normaali:     { total: 24, reviews: 18, newCards: 6  },
  intensiivinen:{ total: 42, reviews: 30, newCards: 12 },
};

// Band → SM-2 quality
// lahella→2 deliberately avoids full reset on "almost right" conjugations
export function bandToQuality(band) {
  switch (band) {
    case "taydellinen":  return 5;
    case "ymmarrettava": return 3;
    case "lahella":      return 2;
    case "vaarin":       return 0;
    default:             return 0;
  }
}

export function daysUntilExam(now = new Date()) {
  return Math.ceil((EXAM_DATE - now) / (24 * 60 * 60 * 1000));
}

// Clamp interval so no card is ever scheduled past exam day
export function examCap(interval_days, now = new Date()) {
  const left = daysUntilExam(now);
  if (left <= 0)  return 1;
  if (left <= 14) return Math.min(interval_days, Math.max(1, Math.ceil(left / 3)));
  if (left <= 60) return Math.min(interval_days, 21);
  return Math.min(interval_days, left - 1);
}

export function deriveState({ ease_factor, interval_days, repetitions, last_quality }) {
  if (repetitions === 0 && last_quality == null) return "new";
  if (last_quality != null && last_quality < 3)  return "lapsed";
  if (repetitions <= 2 || interval_days < 7)     return "learning";
  if (ease_factor >= 2.5 && interval_days >= 21 && last_quality >= 3) return "mastered";
  return "review";
}

// SM-2 with exam cap and partial-credit quality mapping
export function sm2(card, quality, now = new Date()) {
  let { ease_factor = 2.5, interval_days = 0, repetitions = 0 } = card;

  if (quality < 3) {
    repetitions = 0;
    interval_days = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval_days = 1;
    } else if (repetitions === 2) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
  }

  ease_factor += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  if (ease_factor < 1.3) ease_factor = 1.3;

  interval_days = examCap(interval_days, now);

  const next_review = new Date(now);
  next_review.setDate(next_review.getDate() + interval_days);

  const updated = {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    last_quality: quality,
    next_review: next_review.toISOString().slice(0, 10),
    last_grade: quality,
  };

  updated.state = deriveState(updated);

  return updated;
}
