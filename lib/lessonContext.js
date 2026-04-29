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
export async function resolveLessonContext(payload) {
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
      exercise_count: lesson.exercise_count,
      teaching_snippet: lesson.teaching_snippet,
    },
    isKertaustesti,
  };
}

/**
 * Build the Finnish "stay on focus" constraint snippet that gets injected
 * into the OpenAI prompt for a regular (non-test) curriculum lesson.
 */
export function curriculumFocusInstruction(ctx) {
  if (!ctx) return "";
  const { lesson, kurssi } = ctx;
  return [
    "",
    "TÄRKEÄ — KURSSI-KONTEKSTI:",
    `Tehtävät liittyvät TARKASTI aiheeseen: ${lesson.focus}.`,
    `Kurssi: ${kurssi.title} (taso ${kurssi.level}).`,
    "ÄLÄ generoi tehtäviä muista aiheista. Kaikki tehtävät testaavat tätä yhtä rakennetta tai sanastoaluetta.",
    "Järjestä tehtävät niin, että helpoin tunnistustehtävä tulee ensin ja vaikein tuotantotehtävä viimeisenä (recognition → production).",
    "Toista ydinsanoja tai -muotoja viimeisessä tehtävässä uudelleen, jotta opitut asiat juurtuvat — älä vaihda kaikkia sanoja kesken sarjan.",
    "",
  ].join("\n");
}

/**
 * Special-case constraint for the kurssi's last-lesson kertaustesti.
 * Spans every grammar_focus[] topic of the kurssi evenly.
 */
export function curriculumTestInstruction(ctx) {
  if (!ctx) return "";
  const { lesson, kurssi } = ctx;
  const topics = (kurssi.grammar_focus || []).join(", ") || "kaikki kurssin aiheet";
  return [
    "",
    "TÄRKEÄ — KERTAUSTESTI:",
    `Tämä on kurssin "${kurssi.title}" kertaustesti.`,
    `Tehtävät kattavat tasaisesti kaikki kurssin aiheet: ${topics}.`,
    "Älä painota yhtä aihetta yli muiden — jaa tehtävät niin, että jokaisesta yllä olevasta aiheesta tulee suurin piirtein yhtä monta kysymystä.",
    "Lisää JOKAISEEN tehtävään uusi kenttä \"topic_key\" jonka arvo on TARKASTI yksi yllä luetelluista aiheen avaimista.",
    `Generoi yhteensä ${lesson.exercise_count} kysymystä.`,
    "",
  ].join("\n");
}
