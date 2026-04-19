import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { selectDiagnosticQuestions } from "../lib/placementQuestions.js";
import { scorePlacementTest } from "../lib/placement.js";

const router = Router();

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

export default router;
