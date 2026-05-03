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
import { getLessonLabel } from "./lessonLabels.js";

function tablesMissing(err) {
  if (!err) return false;
  const code = err.code || err.error?.code;
  return code === "42P01" || code === "PGRST205" || /relation .* does not exist/i.test(err.message || "");
}

// L-PLAN-7 — small deterministic seed from a string. Used so the same
// (user, kurssi, lesson) triple always picks the same prior lesson for
// review when no weak-lesson signal exists. Mulberry32-ish.
function hashString(s) {
  let h = 2166136261 >>> 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
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

  // L-PLAN-7 — kumulatiivinen kertaus. Compute review-topics for this
  // lesson generation. Skipped entirely for kertaustesti and deepen runs:
  // both already cover the kurssi or the same focus respectively, adding
  // review items would dilute their pedagogical purpose.
  const reviewTopics = (isKertaustesti || isDeepen)
    ? []
    : await buildReviewTopics({ userId, kurssiKey, lessonIndex, lessons, kurssi });

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
    reviewTopics,
  };
}

// L-PLAN-7 — assemble review-topic list for a lesson generation. The
// returned items shape matches what curriculumFocusInstruction() injects
// into the prompt + what routes/exercises.js post-processing tags onto
// each AI-emitted exercise. Up to 3 items: 1 internal (M>=3), 1 cross-
// kurssi (N>=2 && lessonIndex<=2), 1 SR-personal (every 3rd lesson).
async function buildReviewTopics({ userId, kurssiKey, lessonIndex, lessons, kurssi }) {
  const out = [];

  // Lesson-types that actually produce comparable review items. Reading +
  // writing lessons emit a single piece each — adding "review tasks" to
  // them doesn't fit the format. Limit cumulative review to vocab /
  // grammar / mixed lessons.
  const lessonType = lessons.find((l) => l.sort_order === lessonIndex)?.type;
  const REVIEW_ELIGIBLE = new Set(["vocab", "grammar", "mixed"]);
  if (!REVIEW_ELIGIBLE.has(lessonType)) return out;

  // 1) Sisäinen kertaus — viimeiset 2 tehtävää kertaavat aiempaa oppituntia
  //    (kurssin sisällä). Trigger: lessonIndex >= 3 (ts. 3rd lesson onwards).
  //    education/spaced-practice-scheduler — review what was practised
  //    earlier in the same kurssi while it's still fresh.
  if (lessonIndex >= 3) {
    const previousLessons = lessons
      .filter((l) => l.sort_order < lessonIndex && REVIEW_ELIGIBLE.has(l.type));

    if (previousLessons.length > 0) {
      let chosen = null;

      // education/error-analysis-protocol — prefer the weakest prior lesson
      // (score < 0.85). When the user is anonymous or has no progress yet,
      // fall through to the deterministic seed-based pick.
      if (userId) {
        try {
          const { data, error } = await supabase
            .from("user_curriculum_progress")
            .select("lesson_index, score_correct, score_total")
            .eq("user_id", userId)
            .eq("kurssi_key", kurssiKey)
            .lt("lesson_index", lessonIndex);
          if (!error && Array.isArray(data) && data.length > 0) {
            const scored = data
              .filter((r) =>
                typeof r.score_correct === "number" &&
                typeof r.score_total === "number" &&
                r.score_total > 0,
              )
              .map((r) => ({ idx: r.lesson_index, pct: r.score_correct / r.score_total }))
              .filter((r) => previousLessons.some((p) => p.sort_order === r.idx))
              .sort((a, b) => a.pct - b.pct);
            const weakest = scored[0];
            if (weakest && weakest.pct < 0.85) {
              chosen = previousLessons.find((p) => p.sort_order === weakest.idx) || null;
            }
          }
        } catch { /* fall through */ }
      }

      if (!chosen) {
        const seed = hashString(`${userId || "anon"}_${kurssiKey}_${lessonIndex}`);
        chosen = previousLessons[seed % previousLessons.length];
      }

      if (chosen) {
        const source = `${kurssiKey}_lesson_${chosen.sort_order}`;
        out.push({
          focus: chosen.focus,
          type: chosen.type,
          source,
          label: getLessonLabel(source),
          slot: "internal",
        });
      }
    }
  }

  // 2) Kurssien välinen kertaus — N >= 2, lessonIndex 1..2, edelliseltä
  //    kurssilta yksi grammar_focus[]-aihe. education/interleaving-unit-
  //    planner — bridge sequential kurssit so K(N-1) doesn't decay.
  const kurssiNum = Number(/^kurssi_(\d+)$/.exec(kurssiKey)?.[1] || 0);
  if (kurssiNum >= 2 && lessonIndex <= 2) {
    const prevKurssiKey = `kurssi_${kurssiNum - 1}`;
    const prevKurssi = findKurssi(prevKurssiKey);
    const grammarFocus = (prevKurssi?.grammar_focus || []);
    if (grammarFocus.length > 0) {
      const focus = grammarFocus[lessonIndex - 1] || grammarFocus[0];
      const source = `${prevKurssiKey}_review`;
      out.push({
        focus,
        type: "grammar",
        source,
        label: getLessonLabel(source),
        slot: "crossKurssi",
        crossKurssi: true,
      });
    }
  }

  // 3) SR-pohjainen henkilökohtainen kertaus — joka 3. oppitunti, lisää
  //    +1 tehtävä oppilaan vanhimmasta yhä heikosta aiheesta (KAIKISSA
  //    aiemmissa kursseissa). education/individual-spacing-algorithm-
  //    explainer — yksilön forgetting-curve: vanha + heikko = ensin.
  if (userId && lessonIndex > 0 && lessonIndex % 3 === 0) {
    try {
      const { data, error } = await supabase
        .from("user_curriculum_progress")
        .select("kurssi_key, lesson_index, score_correct, score_total, completed_at")
        .eq("user_id", userId);
      if (!error && Array.isArray(data) && data.length > 0) {
        const weakOldest = data
          .filter((r) =>
            typeof r.score_correct === "number" &&
            typeof r.score_total === "number" &&
            r.score_total > 0 &&
            (r.score_correct / r.score_total) < 0.7 &&
            // Älä SR-kerratessa ehdota tämän hetkistä oppituntia tai sisäisen
            // kertauksen jo poimittua aihetta.
            !(r.kurssi_key === kurssiKey && r.lesson_index === lessonIndex) &&
            !out.some((t) => t.source === `${r.kurssi_key}_lesson_${r.lesson_index}`),
          )
          .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))[0];
        if (weakOldest) {
          const srLessons = lessonsForKurssi(weakOldest.kurssi_key);
          const srLesson = srLessons.find((l) => l.sort_order === weakOldest.lesson_index);
          if (srLesson && REVIEW_ELIGIBLE.has(srLesson.type)) {
            const source = `${weakOldest.kurssi_key}_lesson_${weakOldest.lesson_index}`;
            out.push({
              focus: srLesson.focus,
              type: srLesson.type,
              source,
              label: getLessonLabel(source),
              slot: "sr",
              isSR: true,
            });
          }
        }
      }
    } catch { /* fall through */ }
  }

  return out;
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
  const { lesson, kurssi, levelDirective = "", isDeepen = false, reviewTopics = [] } = ctx;
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

  const lines = [
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
  ];

  // L-PLAN-7 — kumulatiivinen kertaus. Up to 3 review topics may be active:
  // (a) internal — last 2 items recap an earlier lesson in this kurssi,
  // (b) crossKurssi — 1 item in lesson 1 or 2 of kurssi N≥2 recaps K(N-1),
  // (c) sr — every 3rd lesson, +1 tail item from oldest weak topic.
  const internal = reviewTopics.find((t) => t.slot === "internal");
  const crossK   = reviewTopics.find((t) => t.slot === "crossKurssi");
  const sr       = reviewTopics.find((t) => t.slot === "sr");

  // Used by the post-processing tagger AND the AI's topic_key field.
  const focusKeyTags = [];
  focusKeyTags.push(`"${lesson.focus}" — pää-aihe (is_review = false)`);

  if (internal) {
    lines.push(
      "",
      "KERTAUS — SISÄINEN (kurssin sisältä):",
      `  - Viimeiset 2 tehtävää (tehtävät ${Math.max(1, n - 1)} ja ${n}) sisältävät myös aiheen "${internal.focus}".`,
      `  - Kertauksen ydinsanasto/rakenne tästä aiheesta esiintyy luonnollisesti, ei väkisin.`,
      `  - Vaikeustaso pysyy samana kuin kurssin baseline.`,
    );
    focusKeyTags.push(`"${internal.focus}" — aiempi oppitunti, kertaus (is_review = true)`);
  }

  if (crossK) {
    lines.push(
      "",
      "KERTAUS — EDELLINEN KURSSI:",
      `  - Yksi tehtävistä keskellä (tehtävät 4–6 alueella) kertaa aihetta "${crossK.focus}".`,
      `  - Tämä on edellisen kurssin rakenne. Käytä saman tason vaikeutta kuin nykyinen taso, älä helpota.`,
    );
    focusKeyTags.push(`"${crossK.focus}" — edellinen kurssi, kertaus (is_review = true)`);
  }

  if (sr) {
    lines.push(
      "",
      "HENKILÖKOHTAINEN KERTAUS:",
      `  - Lisää tehtävämäärä yhdellä: generoi ${n + 1} tehtävää eikä ${n}.`,
      `  - Viimeinen tehtävä (tehtävä ${n + 1}) kertaa aihetta "${sr.focus}" — tämä on aihe jossa oppilaalla on aiemmin ollut vaikeuksia.`,
      `  - Sisällytä lyhyt vihje tai esimerkki, sillä kertaus tästä aiheesta on selittävä.`,
    );
    focusKeyTags.push(`"${sr.focus}" — henkilökohtainen kertaus (is_review = true)`);
  }

  if (reviewTopics.length > 0) {
    lines.push(
      "",
      "TOPIC-AVAIMET — pakollinen:",
      "  Lisää JOKAISEEN tehtävään uusi kenttä \"topic_key\" jonka arvo on TARKASTI yksi seuraavista:",
      ...focusKeyTags.map((t) => `    - ${t}`),
      "  Lisäksi merkitse jokaiseen tehtävään \"is_review\": true tai false sen mukaan, kumpaan se kuuluu.",
    );
  }

  if (levelDirective) lines.push(levelDirective);

  return lines.filter(Boolean).join("\n");
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
