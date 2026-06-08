import { Router } from "express";
import adminClient from "../supabase.js";
import { getRequestDb } from "../lib/requestContext.js";
import { requireAuth, optionalAuth, checkFeatureAccess } from "../middleware/auth.js";
import { callOpenAI, normalizeLang } from "../lib/openai.js";
import { captureAdaptiveSignals, sanitiseGradedItems } from "../lib/adaptiveCapture.js";
import { readLessonFile } from "../lib/curriculum.js";
import { pickFeedback, toneBucketFor, bandFor, concentrationConcept } from "../lib/feedbackTemplates.js";
import { buildReviewQueue } from "../lib/reviewQueue.js";
import {
  CURRICULUM_KURSSIT,
  CURRICULUM_LESSONS,
  LANG_CURRICULA,
  lessonsForKurssi,
  findKurssi,
} from "../lib/curriculumData.js";
import {
  applyTargetMultiplier,
  passThresholdFor,
  VALID_TARGET_GRADES,
} from "../lib/lessonContext.js";
import { PRODUCT_LANGS } from "../lib/constants.js";
import { buildTeachingPrompt, buildTeachingFallback } from "../lib/curriculumTeaching.js";
import {
  summariseProgress,
  sanitiseReviewItems,
  buildReviewSummary,
  sanitiseWrongAnswers,
  toneBlock,
  fallbackMetacognitive,
  fallbackGreeting,
} from "../lib/curriculumProgress.js";

const router = Router();

// L-PLAN-6 — fetch the user's target_grade for multiplier + threshold logic.
// Falls back to "B" when the column is missing or the row has no value.
async function fetchTargetGrade(userId) {
  const supabase = getRequestDb(adminClient); // L-V392 P1-3: RLS-scoped per request
  if (!userId) return "B";
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("target_grade")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return "B";
    const t = data?.target_grade;
    return (typeof t === "string" && VALID_TARGET_GRADES.includes(t)) ? t : "B";
  } catch { return "B"; }
}

// Treat "table doesn't exist" as a soft fallback — pre-migration the API
// still serves the JS-mirror so the UI can render. PGRST205 = table not in
// schema cache; 42P01 = relation does not exist.
function tablesMissing(err) {
  if (!err) return false;
  const code = err.code || err.error?.code;
  return code === "42P01" || code === "PGRST205" || /relation .* does not exist/i.test(err.message || "");
}

async function fetchKurssitDb() {
  const supabase = getRequestDb(adminClient);
  const { data, error } = await supabase
    .from("curriculum_kurssit")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    if (tablesMissing(error)) return null;
    throw error;
  }
  return data;
}

async function fetchLessonsDb(kurssiKey) {
  const supabase = getRequestDb(adminClient);
  const { data, error } = await supabase
    .from("curriculum_lessons")
    .select("*")
    .eq("kurssi_key", kurssiKey)
    .order("sort_order", { ascending: true });
  if (error) {
    if (tablesMissing(error)) return null;
    throw error;
  }
  return data;
}

// L-V390: lang-scope the per-course progress read. Kurssi keys (kurssi_1..8)
// are shared across all three languages, so without filtering by lang a
// Spanish completion of kurssi_1/lesson_1 leaked into the German and French
// course-detail views as "1.1 Suoritettu". The list endpoint (GET /) was
// already lang-scoped (migration foundation); the detail endpoint was the gap.
async function fetchUserProgressDb(userId, kurssiKey, lang = "es") {
  const supabase = getRequestDb(adminClient);
  const { data, error } = await supabase
    .from("user_curriculum_progress")
    .select("kurssi_key, lesson_index, completed_at, score_correct, score_total")
    .eq("user_id", userId)
    .eq("lang", lang)
    .eq(kurssiKey ? "kurssi_key" : "user_id", kurssiKey || userId);
  if (error) {
    if (tablesMissing(error)) return null;
    throw error;
  }
  return data || [];
}

// ─── GET /api/curriculum ────────────────────────────────────────────────────
const SUPPORTED_LANGS = PRODUCT_LANGS;

router.get("/", optionalAuth, async (req, res) => {
  const supabase = getRequestDb(adminClient);
  try {
    // L-LANG-INFRA-1 — ?lang= selects the language. Default "es".
    const lang = SUPPORTED_LANGS.has(req.query.lang) ? req.query.lang : "es";

    // For languages without content, return a structured "not available" response.
    if (lang !== "es") {
      const langKurssit = LANG_CURRICULA[lang] || [];
      if (langKurssit.length === 0) {
        return res.json({
          kurssit: [],
          available: false,
          language: lang,
          message: "Sisältöä ei vielä julkaistu — liity wait-listille",
        });
      }
    }

    let kurssit = null;
    // DB kurssit are currently Spanish-only; skip DB fetch for non-es.
    if (lang === "es") {
      try {
        kurssit = await fetchKurssitDb();
      } catch (err) {
        console.error("curriculum fetch error:", err.message);
      }
    }
    if (!kurssit || kurssit.length === 0) kurssit = LANG_CURRICULA[lang] || CURRICULUM_KURSSIT;

    let progressByKurssi = {};
    if (req.user?.userId) {
      try {
        // Multi-lang progress bleed fix (migration 040): user_curriculum_progress
        // now carries a `lang` column, so the curriculum response only counts
        // the rows that match the language the user is viewing. Without this,
        // a Spanish completion bled into the German / French course list as
        // "1/10 lessons completed" — the bug report from 2026-05-19.
        const { data, error } = await supabase
          .from("user_curriculum_progress")
          .select("kurssi_key, lesson_index, completed_at, score_correct, score_total")
          .eq("user_id", req.user.userId)
          .eq("lang", lang);
        if (error && !tablesMissing(error)) throw error;
        for (const row of data || []) {
          (progressByKurssi[row.kurssi_key] ||= []).push(row);
        }
      } catch (err) {
        console.error("curriculum progress fetch:", err.message);
      }
    }

    // Compute unlock + summary per kurssi.
    const out = [];
    let prevPassed = true; // kurssi_1 always unlocked
    for (const k of kurssit) {
      const lessons = lessonsForKurssi(k.key);
      const kertausIdx = lessons.length; // last lesson is kertaustesti
      const userRows = progressByKurssi[k.key] || [];
      const summary = summariseProgress(userRows, k.key, kertausIdx);
      const isUnlocked = req.user ? prevPassed : (k.sort_order === 1);
      out.push({
        key: k.key,
        title: k.title,
        description: k.description,
        level: k.level,
        sortOrder: k.sort_order,
        lessonCount: k.lesson_count,
        lessonsCompleted: summary.lessonsCompleted,
        isUnlocked,
        lastScore: summary.lastScore,
        kertausPassed: summary.kertausPassed,
      });
      prevPassed = summary.kertausPassed;
    }

    res.json({ kurssit: out });
  } catch (err) {
    console.error("GET /api/curriculum error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// ─── GET /api/curriculum/tutor-message ──────────────────────────────────────
// Registered BEFORE the /:kurssiKey dynamic route so its literal path is not
// shadowed. Implementation lives at the bottom of the file (search for
// "tutor-message" handler) — this stub forwards to the deferred handler so
// the route is mounted at the right priority.
router.get("/tutor-message", optionalAuth, (req, res, next) => _tutorMessageHandler(req, res, next));

// ─── GET /api/curriculum/review-queue ───────────────────────────────────────
// L-V411 Vaihe C — the resurface surface. Returns bank items for the learner's
// weak / SR-due concepts, calibrated to their grip. Gated to the kurssi
// (mestari) tier, same as adaptive capture; free/treeni get an empty locked
// queue (no error). Registered before /:kurssiKey so the literal path wins.
router.get("/review-queue", requireAuth, async (req, res) => {
  try {
    const lang = PRODUCT_LANGS.has(req.query?.lang) ? req.query.lang : "es";
    const limit = Math.max(1, Math.min(20, Number(req.query?.limit) || 12));
    const access = await checkFeatureAccess(req.user.userId, "mistake_tracking");
    if (!access.allowed) {
      return res.json({ items: [], concepts: [], dueCount: 0, locked: true });
    }
    const queue = await buildReviewQueue({
      userId: req.user.userId,
      lang,
      db: req.supabase || adminClient,
      limit,
    });
    res.json({ ...queue, locked: false });
  } catch (err) {
    console.error("review-queue error:", err.message);
    res.status(500).json({ error: "Kertausjonon haku epäonnistui" });
  }
});

// ─── POST /api/curriculum/capture ───────────────────────────────────────────
// L-V411 Vaihe C (digikirja port) — the digikirja lesson reader has no
// /complete call, so it flushes graded answers here per phase. Mirrors the
// capture half of /complete: gated to the kurssi (mestari) tier, writes
// user_mistakes + sr_cards. This is the real data source for the flywheel,
// since digikirja (not lessonRunner) is the live lesson path.
router.post("/capture", requireAuth, async (req, res) => {
  try {
    const lang = PRODUCT_LANGS.has(req.body?.lang) ? req.body.lang : "es";
    const access = await checkFeatureAccess(req.user.userId, "mistake_tracking");
    if (!access.allowed) return res.json({ captured: false, locked: true });
    const gradedItems = sanitiseGradedItems(req.body?.gradedItems);
    if (!gradedItems.length) return res.json({ captured: false });
    const cap = await captureAdaptiveSignals(
      req.supabase || adminClient, req.user.userId, normalizeLang(lang), gradedItems
    );
    res.json({ captured: true, ...cap });
  } catch (err) {
    console.error("capture error:", err.message);
    res.status(500).json({ error: "Tallennus epäonnistui" });
  }
});

// ─── GET /api/curriculum/:kurssiKey ─────────────────────────────────────────
router.get("/:kurssiKey", optionalAuth, async (req, res) => {
  const supabase = getRequestDb(adminClient);
  try {
    const { kurssiKey } = req.params;
    // L-V390: read the language so progress is scoped to the course the user
    // is actually viewing, not bled across languages by shared kurssi keys.
    const lang = SUPPORTED_LANGS.has(req.query.lang) ? req.query.lang : "es";
    const fallback = findKurssi(kurssiKey);
    if (!fallback) return res.status(404).json({ error: "Kurssia ei löydy" });

    let kurssi = null;
    try {
      const { data, error } = await supabase
        .from("curriculum_kurssit")
        .select("*")
        .eq("key", kurssiKey)
        .maybeSingle();
      if (error && !tablesMissing(error)) throw error;
      kurssi = data;
    } catch (err) {
      console.error("kurssi fetch:", err.message);
    }
    if (!kurssi) kurssi = fallback;

    let lessons = null;
    try {
      lessons = await fetchLessonsDb(kurssiKey);
    } catch (err) {
      console.error("lessons fetch:", err.message);
    }
    if (!lessons || lessons.length === 0) lessons = lessonsForKurssi(kurssiKey);

    let progressByIndex = {};
    if (req.user?.userId) {
      try {
        const data = await fetchUserProgressDb(req.user.userId, kurssiKey, lang);
        for (const row of data || []) progressByIndex[row.lesson_index] = row;
      } catch (err) {
        console.error("progress fetch:", err.message);
      }
    }

    const lessonsOut = lessons.map((l) => {
      const p = progressByIndex[l.sort_order];
      return {
        id: l.id ?? l.sort_order,
        sortOrder: l.sort_order,
        type: l.type,
        focus: l.focus,
        exerciseCount: l.exercise_count,
        teachingSnippet: l.teaching_snippet,
        completed: !!p,
        score: p ? { correct: p.score_correct, total: p.score_total } : null,
      };
    });

    res.json({
      kurssi: {
        key: kurssi.key,
        title: kurssi.title,
        description: kurssi.description,
        level: kurssi.level,
        vocabTheme: kurssi.vocab_theme,
        grammarFocus: kurssi.grammar_focus || [],
        lessonCount: kurssi.lesson_count,
        sortOrder: kurssi.sort_order,
      },
      lessons: lessonsOut,
    });
  } catch (err) {
    console.error("GET /api/curriculum/:k error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// L-PLAN-5 UPDATE 1: build a teaching-page Markdown via OpenAI for any
// supported lesson type (grammar, mixed, vocab, reading, writing).
// Cached in `teaching_pages` keyed by `${kurssiKey}_lesson_${sortOrder}`.
//
const TEACHING_TYPES = new Set(["grammar", "mixed", "vocab", "reading", "writing"]);

async function getOrGenerateTeachingPage(kurssiKey, sortOrder, lesson) {
  const supabase = getRequestDb(adminClient);
  if (!lesson || !TEACHING_TYPES.has(lesson.type)) return null;
  const topicKey = `${kurssiKey}_lesson_${sortOrder}`;

  // Check cache
  try {
    const { data, error } = await supabase
      .from("teaching_pages")
      .select("content_md")
      .eq("topic_key", topicKey)
      .maybeSingle();
    if (!error && data?.content_md) return { contentMd: data.content_md, cached: true };
  } catch { /* table missing or other — fall through to generation */ }

  const prompt = buildTeachingPrompt(lesson, kurssiKey);
  const maxTok = lesson.type === "writing" ? 450 : (lesson.type === "vocab" ? 600 : 400);

  let contentMd = null;
  try {
    const ai = await callOpenAI(prompt, maxTok, { temperature: 0.3 });
    if (ai?.contentMd && typeof ai.contentMd === "string" && ai.contentMd.length > 50) {
      contentMd = ai.contentMd.trim();
    }
  } catch (err) {
    console.warn("teaching-page OpenAI failed:", err.message);
  }

  if (!contentMd) {
    contentMd = buildTeachingFallback(lesson);
  }

  // Cache it (best-effort). teaching_pages is a shared table with no per-user
  // RLS write policy, so this write stays on the admin client.
  try {
    await adminClient.from("teaching_pages").upsert({
      topic_key: topicKey,
      content_md: contentMd,
      generated_at: new Date().toISOString(),
    });
  } catch { /* cache table missing — fine */ }

  return { contentMd, cached: false };
}

// L-LANG-INFRA-1 — delegate to lib/curriculum.js readLessonFile so the
// data/courses/${lang}/ path is managed in one place. Lang defaults to "es".
async function readPregeneratedLesson(courseKey, lessonIndex, lang = "es") {
  if (process.env.USE_PREGENERATED_LESSONS !== "true") return null;
  return readLessonFile(courseKey, lessonIndex, lang);
}

// ─── GET /api/curriculum/:kurssiKey/lesson/:lessonIndex ─────────────────────
router.get("/:kurssiKey/lesson/:lessonIndex", optionalAuth, async (req, res) => {
  try {
    const { kurssiKey } = req.params;
    const lessonIndex = Number(req.params.lessonIndex);
    if (!Number.isInteger(lessonIndex) || lessonIndex < 1) {
      return res.status(400).json({ error: "Virheellinen oppitunnin numero" });
    }
    if (!findKurssi(kurssiKey)) {
      return res.status(404).json({ error: "Kurssia ei löydy" });
    }

    // L-COURSE-1 UPDATE 3 / L-LANG-INFRA-1 — pre-generated short-circuit.
    // Returns the full schema-shaped object plus lessonContext (target_grade)
    // so the runner can pick mastery thresholds + skip_for_targets correctly.
    // For non-ES langs, readPregeneratedLesson returns { available: false }
    // which is surfaced to the client rather than falling through to AI gen.
    const lang = SUPPORTED_LANGS.has(req.query.lang) ? req.query.lang : "es";
    const pregenerated = await readPregeneratedLesson(kurssiKey, lessonIndex, lang);
    if (pregenerated) {
      if (pregenerated.available === false) {
        return res.status(503).json({
          available: false,
          language: pregenerated.language,
          message: pregenerated.message,
        });
      }
      const tg = req.user?.userId ? await fetchTargetGrade(req.user.userId) : "B";
      return res.json({ pregenerated, lessonContext: { targetGrade: tg } });
    }

    let lessons = null;
    try {
      lessons = await fetchLessonsDb(kurssiKey);
    } catch { /* fall through */ }
    if (!lessons || lessons.length === 0) lessons = lessonsForKurssi(kurssiKey);

    const lesson = lessons.find((l) => l.sort_order === lessonIndex);
    if (!lesson) return res.status(404).json({ error: "Oppituntia ei löydy" });

    let teachingPage = null;
    try {
      teachingPage = await getOrGenerateTeachingPage(kurssiKey, lessonIndex, lesson);
    } catch (err) {
      console.warn("teaching-page generate failed:", err.message);
    }

    // L-PLAN-6 — adjust the exposed exerciseCount by the user's target_grade.
    // Anonymous (no user) sees the baseline so the public preview is honest;
    // logged-in users see their own pacing.
    const targetGrade = req.user?.userId ? await fetchTargetGrade(req.user.userId) : "B";
    const baselineCount = Number(lesson.exercise_count) || 8;
    const adjustedCount = applyTargetMultiplier(baselineCount, targetGrade);

    res.json({
      lesson: {
        id: lesson.id ?? lesson.sort_order,
        kurssiKey,
        sortOrder: lesson.sort_order,
        type: lesson.type,
        focus: lesson.focus,
        // L-PLAN-6 — `exerciseCount` stays the baseline so the existing
        // contract is unchanged. `lessonContext.exerciseCount` exposes
        // the target-grade-adjusted count the UI prefers when present.
        exerciseCount: baselineCount,
        teachingSnippet: lesson.teaching_snippet,
      },
      lessonContext: { targetGrade, exerciseCount: adjustedCount, baselineExerciseCount: baselineCount },
      teachingPage,
    });
  } catch (err) {
    console.error("GET lesson error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// Compute the fast-track flag: 3 consecutive lessons in the same kurssi with
// score ≥ 85%. Returns true only when the user has just completed a third
// such lesson in a row.
async function checkFastTrack(userId, kurssiKey) {
  const supabase = getRequestDb(adminClient);
  try {
    const { data, error } = await supabase
      .from("user_curriculum_progress")
      .select("lesson_index, score_correct, score_total, completed_at")
      .eq("user_id", userId)
      .eq("kurssi_key", kurssiKey)
      .order("completed_at", { ascending: false })
      .limit(3);
    if (error) return false;
    const rows = data || [];
    if (rows.length < 3) return false;
    return rows.every((r) =>
      typeof r.score_correct === "number" &&
      typeof r.score_total === "number" &&
      r.score_total > 0 &&
      (r.score_correct / r.score_total) >= 0.85
    );
  } catch { return false; }
}

// ─── POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete ───────────
router.post("/:kurssiKey/lesson/:lessonIndex/complete", requireAuth, async (req, res) => {
  const supabase = getRequestDb(adminClient);
  try {
    const { kurssiKey } = req.params;
    const lessonIndex = Number(req.params.lessonIndex);
    const scoreCorrect = Number(req.body?.scoreCorrect ?? 0);
    const scoreTotal = Number(req.body?.scoreTotal ?? 0);
    const wrongAnswers = sanitiseWrongAnswers(req.body?.wrongAnswers);
    // L-PLAN-7 — review item array drives the post-results summary.
    const reviewItems = sanitiseReviewItems(req.body?.reviewItems);
    const reviewSummary = buildReviewSummary(reviewItems);

    // L-V410 Vaihe 1 (CAPTURE) — graded answers from the main lesson runner.
    // Used below to (a) feed the adaptive layer for kurssi-tier accounts and
    // (b) give the tutor prompt the actual mistakes when the legacy
    // wrongAnswers array is empty (lessonRunner sends gradedItems instead).
    const gradedItems = sanitiseGradedItems(req.body?.gradedItems);
    const effectiveWrong = wrongAnswers.length
      ? wrongAnswers
      : gradedItems
          .filter((g) => !g.correct)
          .slice(0, 20)
          .map((g) => ({
            question: g.question,
            studentAnswer: g.studentAnswer,
            correctAnswer: g.correctAnswer,
            topic_key: (g.topics && g.topics[0]) || null,
          }));

    if (!findKurssi(kurssiKey)) return res.status(404).json({ error: "Kurssia ei löydy" });

    const lessons = lessonsForKurssi(kurssiKey);
    const lesson = lessons.find((l) => l.sort_order === lessonIndex);
    if (!lesson) return res.status(404).json({ error: "Oppituntia ei löydy" });

    // Persist completion (best-effort — never block the UX).
    // Migration 040 widened the PK to include lang; default to 'es' for
    // legacy clients (lessonRunner) that don't pass lang in the body yet.
    const completeLang = SUPPORTED_LANGS.has(req.body?.lang) ? req.body.lang
      : SUPPORTED_LANGS.has(req.query?.lang) ? req.query.lang
      : "es";
    try {
      await supabase.from("user_curriculum_progress").upsert({
        user_id: req.user.userId,
        lang: completeLang,
        kurssi_key: kurssiKey,
        lesson_index: lessonIndex,
        completed_at: new Date().toISOString(),
        score_correct: scoreCorrect,
        score_total: scoreTotal,
      }, { onConflict: "user_id,lang,kurssi_key,lesson_index" });
    } catch (err) {
      console.warn("progress upsert:", err.message);
    }

    // L-PLAN-4 UPDATE 5 — streak bridge. The dashboard streak counter (and
    // every per-mode dashboard.js stat) reads from `exercise_logs`, not from
    // `user_curriculum_progress`. Without this row the curriculum loop would
    // not register as activity for the streak / weekly counters. Map lesson
    // type to the existing VALID_MODES set in routes/progress.js so the row
    // is shaped identically to free-practice writes.
    try {
      const STREAK_MODE = ({
        vocab: "vocab",
        grammar: "grammar",
        mixed: "grammar",
        reading: "reading",
        writing: "writing",
        test: "exam",
      })[lesson.type] || "vocab";
      await supabase.from("exercise_logs").insert({
        user_id: req.user.userId,
        mode: STREAK_MODE,
        language: normalizeLang(completeLang),
        level: null,
        score_correct: scoreCorrect,
        score_total: scoreTotal,
        ytl_grade: null,
      });
    } catch (err) {
      // Never fail the endpoint over the bridge — streak is convenience.
      console.warn("[curriculum/complete] exercise_logs insert failed:", err.message);
    }

    // L-V410 Vaihe 1 (CAPTURE) — feed the adaptive flywheel. Gated to the
    // kurssi (mestari) tier via the mistake_tracking feature; free/treeni keep
    // the static behaviour. Best-effort: a capture failure never blocks the
    // completion response.
    if (gradedItems.length) {
      try {
        const access = await checkFeatureAccess(req.user.userId, "mistake_tracking");
        if (access.allowed) {
          const cap = await captureAdaptiveSignals(
            supabase, req.user.userId, normalizeLang(completeLang), gradedItems
          );
          console.log(`[curriculum/complete] adaptive capture: ${cap.srUpserted} SR cards, ${cap.mistakesInserted} mistakes`);
        }
      } catch (err) {
        console.warn("[curriculum/complete] adaptive capture failed:", err.message);
      }
    }

    // Determine kurssi-complete status
    // L-PLAN-6 — pass-threshold is now target_grade-dependent (I/A 0.7,
    // B/C 0.8, M 0.85, E/L 0.9). The default PASS_THRESHOLD constant
    // remains as the B/C baseline for any non-curriculum callers.
    const targetGrade = await fetchTargetGrade(req.user.userId);
    const targetThreshold = passThresholdFor(targetGrade);
    const isKertaustesti = lesson.type === "test" && lessonIndex === lessons.length;
    const passPct = scoreTotal > 0 ? (scoreCorrect / scoreTotal) : 0;
    const kurssiComplete = isKertaustesti && passPct >= targetThreshold;

    // Find next kurssi
    const all = CURRICULUM_KURSSIT;
    const idx = all.findIndex((k) => k.key === kurssiKey);
    const nextKurssi = (kurssiComplete && idx >= 0 && idx + 1 < all.length) ? all[idx + 1] : null;

    const kurssiName = (CURRICULUM_KURSSIT.find((k) => k.key === kurssiKey)?.title || kurssiKey).split(" — ").slice(1).join(" — ") || kurssiKey;

    // L-V411 Vaihe B — deterministic template lookup, ZERO runtime AI for
    // discrete lessons (the AI-free flywheel). Tone follows target_grade, band
    // follows score-vs-threshold, and the message is concept-specific when the
    // mistakes concentrate on one tagged concept (effectiveWrong topic_key).
    // Free-production essays keep AI grading in routes/writing.js; this path is
    // mc/typed/gap_fill/translate only.
    let tutorMessage = "";
    let metacognitivePrompt = "";
    {
      const toneBucket = toneBucketFor(targetGrade);
      const nextKurssiName = nextKurssi
        ? "kurssille " + (String(nextKurssi.title || "").replace(/^Kurssi\s*\d+\s*[:—-]\s*/, "").trim() || nextKurssi.title)
        : "vielä syvemmälle";
      const fb = isKertaustesti
        ? pickFeedback({
            lang: completeLang,
            toneBucket,
            kertaustesti: kurssiComplete ? "pass" : "fail",
            vars: { kurssi: kurssiName, seuraava_kurssi: nextKurssiName },
          })
        : pickFeedback({
            lang: completeLang,
            toneBucket,
            band: bandFor(passPct, targetThreshold),
            concept: concentrationConcept(effectiveWrong),
            vars: { aihe: lesson.focus, seuraava: "seuraavaan oppituntiin" },
          });
      if (fb) {
        tutorMessage = fb.tutorMessage;
        metacognitivePrompt = fb.metacognitivePrompt;
      }
    }

    if (!tutorMessage) {
      // Hardcoded Finnish fallback so endpoint never fails the user.
      if (isKertaustesti && kurssiComplete) {
        tutorMessage = `Hienoa työtä — kurssin "${kurssiName}" kertaustesti meni läpi. Jatketaan${nextKurssi ? ` kohti kurssia ${nextKurssi.title}` : " vielä syvemmälle"}.`;
      } else if (isKertaustesti) {
        tutorMessage = `Hyvä yritys, mutta kurssin "${kurssiName}" rakenteet kaipaavat vielä harjoittelua. Käydään niitä läpi rauhassa ennen etenemistä.`;
      } else if (passPct >= 0.80) {
        tutorMessage = `Hieno suoritus aiheesta "${lesson.focus}" — kurssi etenee hyvin. Seuraavaksi siirrytään seuraavaan oppituntiin.`;
      } else {
        tutorMessage = `Aihe "${lesson.focus}" kaipaa vielä harjoittelua. Annan sinulle 3 lisätehtävää tästä rakenteesta ennen kuin jatkat eteenpäin.`;
      }
    }
    if (!metacognitivePrompt) {
      metacognitivePrompt = fallbackMetacognitive(passPct, lesson.focus);
    }

    // Fast-track offer — 3 consecutive ≥85% in this kurssi.
    const fastTrack = await checkFastTrack(req.user.userId, kurssiKey);

    res.json({
      kurssiComplete,
      nextKurssiUnlocked: !!nextKurssi,
      nextKurssiKey: nextKurssi?.key || null,
      nextKurssiTitle: nextKurssi?.title || null,
      tutorMessage,
      metacognitivePrompt,
      // L-PLAN-7 — surface the review summary so the lesson-results card
      // can render the "Kertasit myös tätä" -osio.
      reviewSummary,
      fastTrack,
      isKertaustesti,
      passed: !isKertaustesti || kurssiComplete,
    });
  } catch (err) {
    console.error("POST complete error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// ─── GET /api/curriculum/tutor-message ──────────────────────────────────────
// L-PLAN-3 — daily-cached AI tutor greeting for the dashboard. The cache key
// lives on user_profile (tutor_greeting + tutor_greeting_at). Anonymous
// callers receive { message: null } so the dashboard hides the card cleanly.
//
// CURRICULUM_SPEC §7: 1–2 sentences, concrete, sinä-muoto, references the
// student's last session + current kurssi + days-to-exam + weakest area.

const TUTOR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXAM_DATE = "2026-09-28";

async function _tutorMessageHandler(req, res) {
  const supabase = getRequestDb(adminClient);
  // Anonymous → no card.
  if (!req.user?.userId) return res.json({ message: null });
  const userId = req.user.userId;

  // 1. Read user_profile for cache + context.
  let profile = null;
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("tutor_greeting, tutor_greeting_at, placement_kurssi, weak_areas, exam_date, current_grade, target_grade")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error) profile = data || null;
  } catch (err) {
    console.warn("tutor-message profile fetch:", err.message);
  }

  // 2. Cache hit?
  const cachedAt = profile?.tutor_greeting_at ? new Date(profile.tutor_greeting_at).getTime() : 0;
  const cachedMessage = profile?.tutor_greeting;
  if (cachedMessage && cachedAt && Date.now() - cachedAt < TUTOR_CACHE_TTL_MS) {
    return res.json({ message: cachedMessage, cached: true });
  }

  // 3. Build context for the prompt.
  let lastSession = null;
  try {
    const { data, error } = await supabase
      .from("user_curriculum_progress")
      .select("kurssi_key, lesson_index, score_correct, score_total, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1);
    if (error && !tablesMissing(error)) throw error;
    lastSession = (data || [])[0] || null;
  } catch (err) {
    console.warn("tutor-message progress fetch:", err.message);
  }

  let lastFocus = null;
  if (lastSession) {
    const lessons = lessonsForKurssi(lastSession.kurssi_key);
    const lesson = lessons.find((l) => l.sort_order === lastSession.lesson_index);
    lastFocus = lesson?.focus || null;
  }

  const kurssiKey = lastSession?.kurssi_key || profile?.placement_kurssi || "kurssi_1";
  const kurssi = findKurssi(kurssiKey);
  const kurssiTitle = kurssi?.title || "";

  const examDateStr = profile?.exam_date || DEFAULT_EXAM_DATE;
  const examDate = new Date(examDateStr);
  const daysToExam = Number.isFinite(examDate.getTime())
    ? Math.max(0, Math.round((examDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const weakAreas = Array.isArray(profile?.weak_areas) ? profile.weak_areas : [];
  const weakArea = weakAreas[0] || null;

  // 4. Try OpenAI. On any failure → time-of-day fallback. Never fail the endpoint.
  let message = null;
  try {
    const scoreLine = lastSession && lastSession.score_total
      ? `${lastSession.score_correct}/${lastSession.score_total}`
      : "ei vielä tuloksia";
    const aiPrompt = [
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Puhut suoraan oppilaalle (sinä-muoto), suomeksi.",
      "Tyyli: lyhyt, konkreettinen, lämmin. Ei yleisiä rohkaisuja, ei abstraktia tasopuhetta.",
      "Älä käytä bullet-listoja. Älä mainitse pistemääriä numeroin.",
      "",
      toneBlock(profile?.target_grade),
      "",
      `Oppilaan tilanne:`,
      `- Nykyinen kurssi: ${kurssiTitle || "ei vielä määritetty"}`,
      `- Viimeisin oppitunti: ${lastFocus || "ei vielä suoritettu"}`,
      `- Viimeisimmän session tulos: ${scoreLine}`,
      `- Heikoin alue: ${weakArea || "ei vielä tunnistettu"}`,
      `- Päivää YO-kokeeseen: ${daysToExam ?? "ei tiedossa"}`,
      "",
      "Kirjoita TARKASTI 1–2 lausetta, jotka ottavat huomioon yllä olevan kontekstin.",
      "Esimerkkejä oikeasta tyylistä (älä kopioi — generoi uusi):",
      "  - \"Hyvä putki! Eilen preteriti sujui hyvin — tänään mennään imperfektiin.\"",
      "  - \"Subjunktiivi tuottaa vielä haasteita. Tänään harjoitellaan sitä lisää.\"",
      "  - \"152 päivää kokeeseen. Olet kurssilla 3/8 — hyvää vauhtia.\"",
      "",
      'Palauta JSON: { "message": "..." }',
    ].join("\n");
    const ai = await callOpenAI(aiPrompt, 80, { temperature: 0.7 });
    const t = String(ai?.message || "").trim();
    // Sanity-check: ≥20 chars, no leading bullet/dash, ≤300 chars.
    if (t.length >= 20 && t.length <= 300 && !/^[\s\-•*]/.test(t)) {
      message = t;
    }
  } catch (err) {
    console.warn("tutor-message AI failed:", err.message);
  }

  if (!message) {
    message = fallbackGreeting({ daysToExam, lastFocus, weakArea, kurssiTitle });
  }

  // 5. Cache to user_profile (best-effort).
  try {
    await supabase
      .from("user_profile")
      .upsert({
        user_id: userId,
        tutor_greeting: message,
        tutor_greeting_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  } catch (err) {
    // Columns may not exist yet pre-migration — fall through, the response
    // is still served. Silenced to avoid log noise on every dashboard load.
    if (!tablesMissing(err)) console.warn("tutor-message cache:", err.message);
  }

  res.json({ message, cached: false });
}

export default router;
