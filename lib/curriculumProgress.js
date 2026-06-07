// L-V399 Vaihe C1 — pure progress/formatter helpers extracted from
// routes/curriculum.js to shrink that god route file. Behavior-preserving:
// these are pure functions (no routing, DB, or side effects), moved verbatim.
// The routes import them back; route ordering and handlers are untouched.
import { getLessonLabel } from "./lessonLabels.js";

export const PASS_THRESHOLD = 0.80;

// Compute kurssi-level summary fields from a flat user-progress array.
export function summariseProgress(allProgress, kurssiKey, kertausLessonIndex) {
  const rows = allProgress.filter((r) => r.kurssi_key === kurssiKey);
  const lessonsCompleted = rows.length;
  const sorted = [...rows].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  const lastScore = sorted[0]
    ? { correct: sorted[0].score_correct, total: sorted[0].score_total }
    : null;
  const kertaus = rows.find((r) => r.lesson_index === kertausLessonIndex);
  const kertausPassed = kertaus
    && typeof kertaus.score_correct === "number"
    && typeof kertaus.score_total === "number"
    && kertaus.score_total > 0
    && (kertaus.score_correct / kertaus.score_total) >= PASS_THRESHOLD;
  return { lessonsCompleted, lastScore, kertausPassed };
}

// L-PLAN-7 — compute the "Kertasit myös tätä" summary from per-item
// reviewItems[] sent by the client. Bins by (review_source, topic_key)
// and emits one row per distinct review topic with a non-shaming
// headline matched to the band: 100% → "Vahvistui", >0% → "Pieni
// muistutus", 0% → "Tämä kaipaa vielä huomiota". Skill applied:
// design:ux-copy + education/self-efficacy-builder-sequence.
export function sanitiseReviewItems(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((r) => r && typeof r === "object")
    .slice(0, 12)
    .map((r) => ({
      topic_key: String(r.topic_key || "").slice(0, 80) || null,
      review_source: String(r.review_source || "").slice(0, 80) || null,
      review_source_label: String(r.review_source_label || "").slice(0, 200) || null,
      correct: !!r.correct,
    }));
}

export function buildReviewSummary(reviewItems) {
  if (!Array.isArray(reviewItems) || reviewItems.length === 0) return [];
  const bins = new Map();
  for (const r of reviewItems) {
    const key = r.review_source || r.topic_key || "unknown";
    if (!bins.has(key)) {
      bins.set(key, {
        topic_key: r.topic_key || null,
        review_source: r.review_source || null,
        label: r.review_source_label || (r.review_source ? getLessonLabel(r.review_source) : (r.topic_key || "")),
        correct: 0,
        total: 0,
      });
    }
    const row = bins.get(key);
    row.total += 1;
    if (r.correct) row.correct += 1;
  }
  const out = [];
  for (const row of bins.values()) {
    let headline;
    if (row.total > 0 && row.correct === row.total) headline = "Vahvistui";
    else if (row.correct > 0) headline = "Pieni muistutus";
    else headline = "Tämä kaipaa vielä huomiota";
    out.push({ ...row, headline });
  }
  return out;
}

// Sanitise wrongAnswers[] from the client. We trust nothing — every field is
// clamped to a string ≤200 chars, list capped at 20 entries.
export function sanitiseWrongAnswers(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((a) => a && typeof a === "object")
    .slice(0, 20)
    .map((a) => ({
      question: String(a.question || "").slice(0, 200),
      studentAnswer: String(a.studentAnswer || "").slice(0, 200),
      correctAnswer: String(a.correctAnswer || "").slice(0, 200),
      topic_key: String(a.topic_key || "").slice(0, 60) || null,
    }));
}

// L-PLAN-6 — tone descriptor per target_grade. Same Finnish, different
// register. Applied via puheo-finnish-voice + education/intelligent-
// tutoring-dialogue-designer + education/self-efficacy-builder-sequence:
// I/A keep the warmth and forbid shame; M/E/L raise the bar without
// keventely. Frame: tavoite mahdollistaa, ei vaadi.
const TONE_DESCRIPTORS = {
  I: "Erittäin kannustava, kärsivällinen, juhli pieniä voittoja, älä koskaan moittele virheistä. Käytä lämmin sävy.",
  A: "Lämmin, kärsivällinen, nimeä konkreettinen onnistuminen, vihjaa seuraavaan askeleeseen pehmeästi.",
  B: "Suora ja lämmin, nimeä mitä meni hyvin ja mitä parannetaan, ehdota seuraava askel.",
  C: "Suora, nimeä rakenne joka oli vahva, mainitse yksi spesifi parannuskohde.",
  M: "Suora ja vaativa mutta lämmin, oletuksena että oppilas haluaa parantua, käytä ammattikielen termiä jos relevantti.",
  E: "Vaativa, suora, oletuksena täydellinen hallinta tavoitteena, älä keventele virheitä.",
  L: "Erittäin vaativa, oleta täydellinen kontrolli, nosta esille hienoja vivahde-eroja, vaadi lisätyötä jos jokin oli horjuva.",
};
export function toneBlock(targetGrade) {
  const t = TONE_DESCRIPTORS[targetGrade] || TONE_DESCRIPTORS.B;
  return [
    "TYYLI:",
    `- Tavoite ${targetGrade || "B"}: ${t}`,
    "- Aina sinä-muoto, suomeksi, max 2 lausetta.",
    "- Ei \"Hyvää työtä!\" -geneerisyyksiä.",
  ].join("\n");
}

// Pick a fallback metacognitive prompt based on score band. The AI is the
// preferred source — this only fires when the AI call fails.
export function fallbackMetacognitive(scorePct, lessonFocus) {
  if (scorePct >= 0.95) return `Pystyt nyt tunnistamaan rakenteen "${lessonFocus}" lähes virheettömästi — se on jo automatisoitumassa.`;
  if (scorePct >= 0.80) return `Hallitset jo aiheen "${lessonFocus}" peruskäytön — pari tarkkuusvirhettä on tässä vaiheessa täysin normaalia.`;
  if (scorePct >= 0.60) return `Aiheessa "${lessonFocus}" on vielä hiottavaa — se on yksi rakenne joka kaipaa toistoa, ei uutta sääntöä.`;
  return `"${lessonFocus}" on tässä vaiheessa vielä haastava — palaa rauhassa peruskäyttöön ennen edistyneempiä tehtäviä.`;
}

export function timeOfDayFinnish() {
  const h = new Date().getHours();
  if (h < 5) return "yo";
  if (h < 11) return "aamu";
  if (h < 17) return "päivä";
  if (h < 22) return "ilta";
  return "yo";
}

export function fallbackGreeting({ daysToExam, lastFocus, weakArea, kurssiTitle }) {
  // Time-of-day flavoured fallbacks so the card feels alive even when AI fails.
  const tod = timeOfDayFinnish();
  const tervehdys = tod === "aamu" ? "Hyvää huomenta!" : tod === "ilta" ? "Iltaa!" : "Tervetuloa takaisin.";
  if (lastFocus) {
    return `${tervehdys} Viime kerralla harjoittelit aiheesta "${lastFocus}". Jatketaan siitä — tänään tehdään seuraava askel.`;
  }
  if (weakArea) {
    return `${tervehdys} Sinulla on vielä haasteita aiheessa "${weakArea}". Tänään harjoitellaan sitä rauhassa.`;
  }
  if (kurssiTitle) {
    return `${tervehdys} Olet kurssilla "${kurssiTitle}". Tehdään tänään yksi pieni askel eteenpäin.`;
  }
  if (Number.isInteger(daysToExam) && daysToExam > 0) {
    return `${tervehdys} ${daysToExam} päivää YO-kokeeseen — pieni harjoitus tänään pitää vauhdin yllä.`;
  }
  return `${tervehdys} Aloitetaan päivän harjoitus rauhassa.`;
}
