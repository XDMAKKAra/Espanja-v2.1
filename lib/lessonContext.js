/**
 * L-PLAN-3 — resolve curriculum context for an exercise generation request.
 *
 * Used by routes/exercises.js: when the client sends { lesson: { kurssiKey,
 * lessonIndex } } in the body, we override level/topic/count with the
 * curriculum's values and inject the lesson focus into the OpenAI prompt
 * as a hard constraint.
 *
 * The fallback to the JS mirror (lib/curriculumData.js) means the wiring
 * works pre-migration too — the routes already use the same fallback.
 *
 * L-PLAN-6 — `target_grade` from `user_profile` now drives a per-grade
 * `exercise_count` multiplier and a level-directive snippet that ratchets
 * difficulty up or down vs. the kurssi's baseline level.
 */

import supabase from "../supabase.js";
import {
  CURRICULUM_KURSSIT,
  CURRICULUM_LESSONS,
  lessonsForKurssi,
  findKurssi,
} from "./curriculumData.js";

function tablesMissing(err) {
  if (!err) return false;
  const code = err.code || err.error?.code;
  return code === "42P01" || code === "PGRST205" || /relation .* does not exist/i.test(err.message || "");
}

// L-PLAN-6 — target-grade → exercise-count multiplier, level order, and
// pass-threshold for kertaustestit. The multiplier intentionally caps at
// 1.5× on L (12 items vs. 8 baseline) to stay inside the cognitive-load
// budget per education/cognitive-load-analyser (≤ ~12 items per session).
export const TARGET_GRADE_MULTIPLIERS = {
  I: 0.7, A: 0.85, B: 1.0, C: 1.0, M: 1.15, E: 1.3, L: 1.5,
};
export const TARGET_GRADE_PASS_THRESHOLDS = {
  I: 0.7, A: 0.7, B: 0.8, C: 0.8, M: 0.85, E: 0.9, L: 0.9,
};
const LEVEL_ORDER = ["I", "A", "B", "C", "M", "E", "L"];
export const VALID_TARGET_GRADES = LEVEL_ORDER;

export function multiplierFor(targetGrade) {
  return TARGET_GRADE_MULTIPLIERS[targetGrade] ?? 1.0;
}

export function passThresholdFor(targetGrade) {
  return TARGET_GRADE_PASS_THRESHOLDS[targetGrade] ?? 0.8;
}

export function applyTargetMultiplier(baselineCount, targetGrade) {
  const m = multiplierFor(targetGrade);
  const n = Math.round(Number(baselineCount || 0) * m);
  return Math.max(1, n);
}

// Build the directive that nudges the OpenAI prompt above or below the
// kurssi's baseline level. Empty string when target == kurssi level (no
// directive needed) or when one side is missing.
export function buildLevelDirective(targetGrade, kurssiLevel) {
  if (!targetGrade || !kurssiLevel) return "";
  const targetIdx = LEVEL_ORDER.indexOf(targetGrade);
  const lessonIdx = LEVEL_ORDER.indexOf(kurssiLevel);
  if (targetIdx < 0 || lessonIdx < 0) return "";
  if (targetIdx === lessonIdx) return "";
  if (targetIdx > lessonIdx) {
    return [
      "",
      "VAIKEUSTASO:",
      `Oppilaan tavoite on ${targetGrade}, kurssin taso on ${kurssiLevel}. Käytä rikkaampaa sanastoa ja monimutkaisempia rakenteita kuin baseline.`,
      "Distraktorit ovat lähekkäin oikeaa vastausta — ei selvästi väärää vaihtoehtoa.",
      "Lauseet saavat olla pidempiä ja sisältää sivulauseita.",
      "",
    ].join("\n");
  }
  return [
    "",
    "VAIKEUSTASO:",
    `Oppilaan tavoite on ${targetGrade}, kurssin taso on ${kurssiLevel}. Pidä rakenne yksinkertaisempana, anna selkeät vihjeet.`,
    "Distraktorit voivat olla helpompia ja kauempana oikeaa vastausta.",
    "Käytä lyhyitä päälauseita, vältä sivulauseita.",
    "",
  ].join("\n");
}

async function fetchTargetGrade(userId) {
  if (!userId) return "B";
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("target_grade")
      .eq("user_id", userId)
      .maybeSingle();
    if (error && !tablesMissing(error)) return "B";
    const t = data?.target_grade;
    if (typeof t === "string" && LEVEL_ORDER.includes(t)) return t;
    return "B";
  } catch { return "B"; }
}

/**
 * Resolve { kurssiKey, lessonIndex } → curriculum context.
 *
 * Returns null on bad input or unknown kurssi/lesson. Otherwise returns:
 *   {
 *     kurssi: { key, title, level, vocab_theme, grammar_focus, lesson_count },
 *     lesson: { sort_order, type, focus, exercise_count, teaching_snippet },
 *     isKertaustesti: boolean,
 *   }
 */
export async function resolveLessonContext(payload, userId = null) {
  if (!payload || typeof payload !== "object") return null;
  const kurssiKey = String(payload.kurssiKey || "").trim();
  const lessonIndex = Number(payload.lessonIndex);
  if (!kurssiKey || !Number.isInteger(lessonIndex) || lessonIndex < 1) return null;

  let kurssi = null;
  try {
    const { data, error } = await supabase
      .from("curriculum_kurssit")
      .select("*")
      .eq("key", kurssiKey)
      .maybeSingle();
    if (error && !tablesMissing(error)) throw error;
    kurssi = data;
  } catch { /* fall through to JS mirror */ }
  if (!kurssi) kurssi = findKurssi(kurssiKey);
  if (!kurssi) return null;

  let lessons = null;
  try {
    const { data, error } = await supabase
      .from("curriculum_lessons")
      .select("*")
      .eq("kurssi_key", kurssiKey)
      .order("sort_order", { ascending: true });
    if (error && !tablesMissing(error)) throw error;
    lessons = data;
  } catch { /* fall through */ }
  if (!lessons || lessons.length === 0) lessons = lessonsForKurssi(kurssiKey);

  const lesson = lessons.find((l) => l.sort_order === lessonIndex);
  if (!lesson) return null;

  const isKertaustesti = lesson.type === "test" && lessonIndex === lessons.length;

  // L-PLAN-6 — apply target-grade multiplier + level-directive.
  const targetGrade = await fetchTargetGrade(userId);
  const baselineCount = Number(lesson.exercise_count) || 8;
  const adjustedCount = applyTargetMultiplier(baselineCount, targetGrade);
  // Deepen-mode (UPDATE 4) is a fixed 4-item run regardless of multiplier;
  // callers pass `mode: "deepen"` in the payload to opt in.
  const isDeepen = payload.mode === "deepen";
  const levelDirective = buildLevelDirective(targetGrade, kurssi.level);

  return {
    kurssi: {
      key: kurssi.key,
      title: kurssi.title,
      level: kurssi.level,
      vocab_theme: kurssi.vocab_theme,
      grammar_focus: kurssi.grammar_focus || [],
      lesson_count: kurssi.lesson_count,
    },
    lesson: {
      sort_order: lesson.sort_order,
      type: lesson.type,
      focus: lesson.focus,
      // exercise_count exposes the baseline; adjusted_exercise_count is the
      // target-grade-aware count routes use for OpenAI + clamping.
      exercise_count: baselineCount,
      adjusted_exercise_count: isDeepen ? 4 : adjustedCount,
      teaching_snippet: lesson.teaching_snippet,
    },
    targetGrade,
    levelDirective,
    isKertaustesti,
    isDeepen,
  };
}

/**
 * Build the Finnish "stay on focus" constraint snippet that gets injected
 * into the OpenAI prompt for a regular (non-test) curriculum lesson.
 *
 * L-PLAN-5 UPDATE 3 — recognition → production order is enforced
 * explicitly. The first third of items are recognition/multiple-choice,
 * the middle third guided production with options, the final third full
 * production without scaffolding. Core vocabulary recurs so the last item
 * tests retention of the first.
 */
export function curriculumFocusInstruction(ctx) {
  if (!ctx) return "";
  const { lesson, kurssi, levelDirective = "", isDeepen = false } = ctx;
  // L-PLAN-6 — tehtäväjärjestys mitoitetaan TARGET-GRADE-aware-määrällä,
  // ei baseline-määrällä, jotta L-tason 12 tehtävää jakautuu 4/4/4 eikä
  // 3/3/2 kuten kurssin kahdeksanlevyinen baseline kaikuisi.
  const n = Number(lesson.adjusted_exercise_count) || Number(lesson.exercise_count) || 8;
  const recogEnd = Math.max(1, Math.round(n / 3));
  const guidedEnd = Math.max(recogEnd + 1, Math.round((2 * n) / 3));
  if (isDeepen) {
    return [
      "",
      "TÄRKEÄ — SYVENNYSKIERROS (L-tavoite):",
      `Aihe: ${lesson.focus}. Kurssi: ${kurssi.title} (taso ${kurssi.level}).`,
      "Nämä ovat L-tason lisätehtäviä. Käytä monimutkaisempia konjunktioita, distraktorit ovat lähekkäin oikeaa vastausta, vältä yksinkertaisia esimerkkejä.",
      `Generoi TARKASTI ${n} tehtävää, kaikki täysiä tuotantotehtäviä (ei monivalintoja jos mahdollista).`,
      levelDirective,
    ].filter(Boolean).join("\n");
  }
  return [
    "",
    "TÄRKEÄ — KURSSI-KONTEKSTI:",
    `Tehtävät liittyvät TARKASTI aiheeseen: ${lesson.focus}.`,
    `Kurssi: ${kurssi.title} (taso ${kurssi.level}).`,
    "ÄLÄ generoi tehtäviä muista aiheista. Kaikki tehtävät testaavat tätä yhtä rakennetta tai sanastoaluetta.",
    "",
    "TEHTÄVÄJÄRJESTYS (recognition → production), pakottava:",
    `  - Tehtävät 1–${recogEnd}: tunnistustehtäviä (monivalinta tai aukko, oppilas tunnistaa oikean muodon).`,
    `  - Tehtävät ${recogEnd + 1}–${guidedEnd}: ohjattuja tuotantotehtäviä (oppilas valitsee oikean muodon useammasta vaihtoehdosta).`,
    `  - Tehtävät ${guidedEnd + 1}–${n}: täysiä tuotantotehtäviä (oppilas tuottaa muodon ilman valintoja).`,
    "",
    "YDINSANASTON KIERRÄTYS:",
    `  - Vähintään 3 avainsanaa joita käytät tehtävässä 1, esiinnyt myös tehtävässä ${n}.`,
    "  - ÄLÄ vaihda kaikkia sanoja kesken sarjan — toistolla opitut asiat juurtuvat.",
    levelDirective,
  ].filter(Boolean).join("\n");
}

/**
 * Special-case constraint for the kurssi's last-lesson kertaustesti.
 * Spans every grammar_focus[] topic of the kurssi evenly.
 */
export function curriculumTestInstruction(ctx) {
  if (!ctx) return "";
  const { lesson, kurssi, levelDirective = "" } = ctx;
  const topics = (kurssi.grammar_focus || []).join(", ") || "kaikki kurssin aiheet";
  const n = Number(lesson.adjusted_exercise_count) || Number(lesson.exercise_count) || 15;
  return [
    "",
    "TÄRKEÄ — KERTAUSTESTI:",
    `Tämä on kurssin "${kurssi.title}" kertaustesti.`,
    `Tehtävät kattavat tasaisesti kaikki kurssin aiheet: ${topics}.`,
    "Älä painota yhtä aihetta yli muiden — jaa tehtävät niin, että jokaisesta yllä olevasta aiheesta tulee suurin piirtein yhtä monta kysymystä.",
    "Lisää JOKAISEEN tehtävään uusi kenttä \"topic_key\" jonka arvo on TARKASTI yksi yllä luetelluista aiheen avaimista.",
    `Generoi yhteensä ${n} kysymystä.`,
    levelDirective,
  ].filter(Boolean).join("\n");
}
