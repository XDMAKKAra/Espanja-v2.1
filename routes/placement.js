import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { selectDiagnosticQuestions } from "../lib/placementQuestions.js";
import {
  scorePlacementTest,
  placementConfidence,
  suggestStartingKurssi,
} from "../lib/placement.js";
import {
  generateFirstWeekPlan,
  fallbackTutorAssessment,
  KURSSI_META,
} from "../lib/curriculum.js";
import { callOpenAI } from "../lib/openai.js";

const router = Router();

// Optional-auth helper: populates req.user when a valid token is sent,
// otherwise lets the request continue. Used by /onboarding so guests
// can complete the diagnostic before signing up.
async function optionalAuth(req, _res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
      if (user) req.user = { userId: user.id, email: user.email };
    } catch { /* anonymous fall-through */ }
  }
  next();
}

// GET /api/placement/questions — get diagnostic test questions
router.get("/questions", requireAuth, async (req, res) => {
  try {
    // Get user's reported grade from profile (if any)
    let reportedGrade = null;
    const { data: profile } = await supabase
      .from("user_profile")
      .select("current_grade")
      .eq("user_id", req.user.userId)
      .single();

    if (profile?.current_grade && profile.current_grade !== "en tiedä") {
      reportedGrade = profile.current_grade;
    }

    const questions = selectDiagnosticQuestions(reportedGrade, 8);

    // Strip correct answers — client shouldn't see them
    const clientQuestions = questions.map(q => ({
      id: q.id,
      level: q.level,
      type: q.type,
      question: q.question,
      options: q.options,
      // No correct/explanation sent
    }));

    res.json({ questions: clientQuestions });
  } catch (err) {
    console.error("Placement questions error:", err.message);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// POST /api/placement/submit — submit diagnostic answers and get results
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const { answers: clientAnswers } = req.body;
    // clientAnswers: [{ id: "A1", selected: "A" }, ...]

    if (!Array.isArray(clientAnswers) || clientAnswers.length === 0) {
      return res.status(400).json({ error: "Vastaukset puuttuvat" });
    }

    // Re-fetch the full question data to grade server-side
    // (We use reported grade to get same distribution, but questions are randomized
    //  so we match by ID)
    let reportedGrade = null;
    const { data: profile } = await supabase
      .from("user_profile")
      .select("current_grade")
      .eq("user_id", req.user.userId)
      .single();

    if (profile?.current_grade && profile.current_grade !== "en tiedä") {
      reportedGrade = profile.current_grade;
    }

    // Get all placement questions to look up correct answers
    const { PLACEMENT_QUESTIONS } = await import("../lib/placementQuestions.js");
    const questionMap = new Map(PLACEMENT_QUESTIONS.map(q => [q.id, q]));

    // Grade each answer
    const graded = clientAnswers.map(a => {
      const q = questionMap.get(a.id);
      if (!q) return null;
      return {
        id: a.id,
        level: q.level,
        correct: a.selected === q.correct,
        selected: a.selected,
        correctAnswer: q.correct,
        explanation: q.explanation,
      };
    }).filter(Boolean);

    // Score
    const result = scorePlacementTest(graded);

    // Check if this is a retake
    const { count } = await supabase
      .from("diagnostic_results")
      .select("*", { count: "exact", head: true })
      .eq("user_id", req.user.userId);

    const isRetake = (count || 0) > 0;

    // Save diagnostic result — this row is what gates future placement status,
    // so a silent failure here meant users saw the placement flow every login.
    const { error: insertError } = await supabase.from("diagnostic_results").insert({
      user_id: req.user.userId,
      placement_level: result.placementLevel,
      chosen_level: result.placementLevel, // updated later if user picks alternative
      total_correct: result.totalCorrect,
      total_questions: result.totalQuestions,
      score_by_level: result.scoreByLevel,
      question_ids: graded.map(g => g.id),
      is_retake: isRetake,
    });
    if (insertError) {
      console.error("Placement insert error:", {
        user_id: req.user.userId,
        code: insertError.code || null,
        message: insertError.message,
        details: insertError.details || null,
        hint: insertError.hint || null,
      });
      return res.status(500).json({ error: "Kartoituksen tallennus epäonnistui" });
    }

    // Update user_profile with placement level
    const { error: profileError } = await supabase
      .from("user_profile")
      .update({
        current_grade: result.placementLevel,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", req.user.userId);
    if (profileError) {
      console.error("Placement profile update error:", {
        user_id: req.user.userId,
        code: profileError.code || null,
        message: profileError.message,
      });
    }

    // Update user_level_progress for all modes
    const modes = ["vocab", "grammar"];
    for (const mode of modes) {
      const { error: lpError } = await supabase
        .from("user_level_progress")
        .upsert({
          user_id: req.user.userId,
          mode,
          current_level: result.placementLevel,
          level_started_at: new Date().toISOString(),
          questions_at_level: 0,
        }, { onConflict: "user_id,mode" });
      if (lpError) {
        console.error("Placement level_progress upsert error:", {
          user_id: req.user.userId, mode, code: lpError.code || null, message: lpError.message,
        });
      }
    }

    // Return full results with explanations
    res.json({
      placementLevel: result.placementLevel,
      alternativeLevel: result.alternativeLevel,
      scoreByLevel: result.scoreByLevel,
      totalCorrect: result.totalCorrect,
      totalQuestions: result.totalQuestions,
      answers: graded,
      isRetake,
    });
  } catch (err) {
    console.error("Placement submit error:", err.message);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// POST /api/placement/choose-level — user picks a different level than suggested
router.post("/choose-level", requireAuth, async (req, res) => {
  try {
    const { level } = req.body;
    const VALID = ["A", "B", "C", "M", "E", "L"];
    if (!VALID.includes(level)) {
      return res.status(400).json({ error: "Virheellinen taso" });
    }

    // Update latest diagnostic result
    const { data: latest } = await supabase
      .from("diagnostic_results")
      .select("id")
      .eq("user_id", req.user.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      await supabase
        .from("diagnostic_results")
        .update({ chosen_level: level })
        .eq("id", latest.id);
    }

    // Update profile and level progress
    await supabase
      .from("user_profile")
      .update({
        current_grade: level,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", req.user.userId);

    for (const mode of ["vocab", "grammar"]) {
      await supabase
        .from("user_level_progress")
        .upsert({
          user_id: req.user.userId,
          mode,
          current_level: level,
          level_started_at: new Date().toISOString(),
          questions_at_level: 0,
        }, { onConflict: "user_id,mode" });
    }

    res.json({ ok: true, level });
  } catch (err) {
    console.error("Choose level error:", err.message);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// GET /api/placement/status — check if user has completed diagnostic
router.get("/status", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("diagnostic_results")
      .select("placement_level, chosen_level, created_at")
      .eq("user_id", req.user.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(500).json({ error: "Palvelinvirhe" });
    }

    res.json({
      completed: !!data,
      placementLevel: data?.placement_level || null,
      chosenLevel: data?.chosen_level || null,
      completedAt: data?.created_at || null,
    });
  } catch (err) {
    console.error("Placement status error:", err.message);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// ─── L-PLAN-1: New onboarding flow ──────────────────────────────────────────
//
// GET  /api/placement/onboarding-questions — returns the 8 core questions
//   plus 2 M_hard anchor candidates. Includes correct answers + explanations
//   because the OB-2 screen renders inline feedback per question. This is
//   only the placement test; nothing here is gradeable in production.
router.get("/onboarding-questions", optionalAuth, async (req, res) => {
  try {
    const { selectOnboardingQuestions } = await import(
      "../lib/placementQuestions.js"
    );
    const reportedGrade = String(req.query.selfReportedGrade || "").trim() || null;
    const { core, mHardCandidates } = selectOnboardingQuestions(reportedGrade, 8);
    res.json({ core, mHardCandidates });
  } catch (err) {
    console.error("Onboarding questions error:", err.message);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// POST /api/placement/onboarding — score + persist + plan
router.post("/onboarding", optionalAuth, async (req, res) => {
  try {
    const {
      answers,
      selfReportedGrade,
      targetGrade,
      weakAreas,
      dailyGoalMinutes,
    } = req.body || {};

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Vastaukset puuttuvat" });
    }

    // 1) Score
    const result = scorePlacementTest(answers);

    // 2) Confidence from response timings
    const { confidence, medianMs } = placementConfidence(answers);

    // 3) Suggested starting kurssi
    const suggestedKurssi = suggestStartingKurssi(
      result.placementLevel,
      confidence,
    );

    // 4) Tutor assessment via OpenAI (with template fallback)
    let tutorAssessment = "";
    const weakAreasFi = Array.isArray(weakAreas) && weakAreas.length
      ? weakAreas.join(", ")
      : "ei mainittuja";
    const aiPrompt = [
      "Olet Puheo, suomalainen AI-tutori, joka valmistaa lukiolaista",
      "ylioppilastutkinnon espanjan lyhyen oppimäärän kokeeseen.",
      "Selitykset ovat suomeksi, lyhyitä ja konkreettisia.",
      "",
      "Oppilas on juuri tehnyt sijoitustestin. Tulokset:",
      `- Pisteet tasoittain: ${JSON.stringify(result.scoreByLevel)}`,
      `- Koulun viimeisin arvosana: ${selfReportedGrade || "ei kerrottu"}`,
      `- Tavoitearvosana: ${targetGrade || "ei kerrottu"}`,
      `- Itse mainitut vaikeat aiheet: ${weakAreasFi}`,
      `- Aloituskurssi: ${KURSSI_META[suggestedKurssi]?.name || suggestedKurssi}`,
      "",
      "Kirjoita 2–3 lausetta suomeksi tutori-äänellä:",
      "missä oppilas on nyt ja mitä harjoitellaan ensin.",
      "Ole konkreettinen — mainitse tarkka aihe, ei abstrakti taso.",
      "Älä mainitse numeroita tai teknisiä termejä kuten 'placementLevel'.",
      "Puhu suoraan oppilaalle (sinä-muoto). Älä kirjoita listaa.",
      "",
      'Palauta JSON: { "tutorAssessment": "..." }',
    ].join("\n");

    try {
      const aiRes = await callOpenAI(aiPrompt, 160, { temperature: 0.5 });
      const text = String(aiRes?.tutorAssessment || "").trim();
      // Sanity: at least 30 chars and no bullet leaders.
      if (text.length >= 30 && !/^[\s\-•*]/.test(text)) {
        tutorAssessment = text;
      }
    } catch (err) {
      console.warn("Tutor assessment AI failed:", err.message);
    }
    if (!tutorAssessment) {
      tutorAssessment = fallbackTutorAssessment(
        result.placementLevel,
        suggestedKurssi,
        confidence,
      );
    }

    // 5) Deterministic first-week plan
    const firstWeekPlan = generateFirstWeekPlan(
      suggestedKurssi,
      Number(dailyGoalMinutes) || 20,
    );

    // 6) Persist if authenticated
    if (req.user?.userId) {
      try {
        await supabase
          .from("user_profile")
          .upsert(
            {
              user_id: req.user.userId,
              self_reported_grade: selfReportedGrade || null,
              target_grade: targetGrade || null,
              weak_areas: Array.isArray(weakAreas) ? weakAreas : null,
              daily_goal_minutes: Number(dailyGoalMinutes) || null,
              placement_confidence: confidence,
              placement_kurssi: suggestedKurssi,
              tutor_assessment: tutorAssessment,
              current_grade: result.placementLevel,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
      } catch (err) {
        // Persisting is best-effort — the plan is the user-facing payload.
        console.warn("Onboarding profile persist failed:", err.message);
      }
    }

    res.json({
      placementLevel: result.placementLevel,
      placementConfidence: confidence,
      medianResponseMs: medianMs,
      suggestedKurssi,
      suggestedKurssiName: KURSSI_META[suggestedKurssi]?.name || suggestedKurssi,
      scoreByLevel: result.scoreByLevel,
      tutorAssessment,
      firstWeekPlan,
    });
  } catch (err) {
    console.error("Onboarding submit error:", err.message);
    res.status(500).json({ error: "Palvelinvirhe" });
  }
});

export default router;
