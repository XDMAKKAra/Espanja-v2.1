import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const VALID_GRADES = ["I", "A", "B", "C", "M", "E", "L", "en tiedä"];
const VALID_TARGET_GRADES = ["B", "C", "M", "E", "L"];
const VALID_REFERRALS = ["friend", "teacher", "google", "tiktok", "instagram", "other"];
const VALID_STUDY_BACKGROUNDS = ["lukio", "ylakoulu_lukio", "alakoulu", "asunut", "kotikieli"];
const VALID_WEAK_AREAS = [
  "vocabulary", "grammar", "ser_estar", "subjunctive", "preterite_imperfect",
  "conditional", "pronouns", "writing", "reading", "idioms", "verbs", "unknown",
];

// Must match keys in lib/learningPath.js
const VALID_MASTERY_TOPICS = new Set([
  "present_regular", "present_irregular", "preterite", "imperfect",
  "preterite_vs_imperfect", "future", "conditional", "subjunctive_present",
  "pluscuamperfecto", "subjunctive_imperfect",
]);

// GET /api/profile — fetch user profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("*")
      .eq("user_id", req.user.userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows — that's fine
      console.error("Profile fetch error:", error.message);
      return res.status(500).json({ error: "Profiilin haku epäonnistui" });
    }

    return res.json({ profile: data || null });
  } catch (err) {
    console.error("Profile error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// POST /api/profile — create or update user profile
router.post("/profile", requireAuth, async (req, res) => {
  try {
    const {
      current_grade,
      spanish_courses_completed,
      spanish_grade_average,
      study_background,
      target_grade,
      exam_date,
      weak_areas,
      strong_areas,
      weekly_goal_minutes,
      preferred_session_length,
      referral_source,
      onboarding_completed,
    } = req.body;

    // Validate
    if (current_grade && !VALID_GRADES.includes(current_grade)) {
      return res.status(400).json({ error: "Virheellinen nykyinen arvosana" });
    }
    if (target_grade && !VALID_TARGET_GRADES.includes(target_grade)) {
      return res.status(400).json({ error: "Virheellinen tavoitearvosana" });
    }
    if (
      spanish_courses_completed != null &&
      !(Number.isInteger(spanish_courses_completed) && spanish_courses_completed >= 1 && spanish_courses_completed <= 8)
    ) {
      return res.status(400).json({ error: "Virheellinen kurssimäärä (1–8 tai null)" });
    }
    if (
      spanish_grade_average != null &&
      !(Number.isInteger(spanish_grade_average) && spanish_grade_average >= 4 && spanish_grade_average <= 10)
    ) {
      return res.status(400).json({ error: "Virheellinen keskiarvo (4–10 tai null)" });
    }
    if (study_background != null && !VALID_STUDY_BACKGROUNDS.includes(study_background)) {
      return res.status(400).json({ error: "Virheellinen opiskelutausta" });
    }
    if (weak_areas && !Array.isArray(weak_areas)) {
      return res.status(400).json({ error: "weak_areas pitää olla taulukko" });
    }
    if (weak_areas) {
      const invalid = weak_areas.filter(a => !VALID_WEAK_AREAS.includes(a));
      if (invalid.length > 0) {
        return res.status(400).json({ error: `Virheelliset heikkoudet: ${invalid.join(", ")}` });
      }
    }
    if (strong_areas !== undefined && strong_areas !== null) {
      if (!Array.isArray(strong_areas)) {
        return res.status(400).json({ error: "strong_areas pitää olla taulukko tai null" });
      }
      if (strong_areas.length > 3) {
        return res.status(400).json({ error: "Enintään 3 vahvuutta" });
      }
      const invalid = strong_areas.filter(a => !VALID_WEAK_AREAS.includes(a) || a === "unknown");
      if (invalid.length > 0) {
        return res.status(400).json({ error: `Virheelliset vahvuudet: ${invalid.join(", ")}` });
      }
      if (Array.isArray(weak_areas)) {
        const overlap = strong_areas.filter(a => weak_areas.includes(a));
        if (overlap.length > 0) {
          return res.status(400).json({ error: `Sama alue ei voi olla heikkous ja vahvuus: ${overlap.join(", ")}` });
        }
      }
    }

    const profileData = {
      user_id: req.user.userId,
      updated_at: new Date().toISOString(),
    };

    if (current_grade !== undefined) profileData.current_grade = current_grade;
    if (spanish_courses_completed !== undefined) profileData.spanish_courses_completed = spanish_courses_completed;
    if (spanish_grade_average !== undefined) profileData.spanish_grade_average = spanish_grade_average;
    if (target_grade !== undefined) profileData.target_grade = target_grade;
    if (exam_date !== undefined) profileData.exam_date = exam_date;
    if (study_background !== undefined) profileData.study_background = study_background;
    if (weak_areas !== undefined) profileData.weak_areas = weak_areas;
    if (strong_areas !== undefined) profileData.strong_areas = strong_areas;
    if (weekly_goal_minutes !== undefined) profileData.weekly_goal_minutes = Number(weekly_goal_minutes) || 60;
    if (preferred_session_length !== undefined) profileData.preferred_session_length = Number(preferred_session_length) || 10;
    if (referral_source !== undefined) {
      if (referral_source && !VALID_REFERRALS.includes(referral_source)) {
        return res.status(400).json({ error: "Virheellinen referral_source" });
      }
      profileData.referral_source = referral_source;
    }

    if (onboarding_completed) {
      profileData.onboarding_completed = true;
      profileData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("user_profile")
      .upsert(profileData, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("Profile save error:", {
        user_id: req.user.userId,
        code: error.code || null,
        message: error.message,
        details: error.details || null,
        hint: error.hint || null,
        attempted_fields: Object.keys(profileData),
      });
      // Surface DB details to the client so onboarding regressions are
      // debuggable without Vercel log access. Revert to a generic string
      // once we have server-log tooling.
      return res.status(500).json({
        error: "Profiilin tallennus epäonnistui",
        debug_code: error.code || null,
        debug_message: error.message || null,
        debug_details: error.details || null,
        debug_hint: error.hint || null,
        debug_fields: Object.keys(profileData),
      });
    }

    return res.json({ ok: true, profile: data });
  } catch (err) {
    console.error("Profile error:", {
      user_id: req.user && req.user.userId || null,
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// POST /api/profile/mastery-seed — initial mastery rows from landing mini-diagnostic.
// Correct answers pre-unlock that topic (status="available") without cascading.
// Uses ignoreDuplicates so re-registering or re-seeding never overwrites real progress.
router.post("/profile/mastery-seed", requireAuth, async (req, res) => {
  try {
    const { mastery } = req.body;
    if (!Array.isArray(mastery)) {
      return res.status(400).json({ error: "mastery-lista puuttuu" });
    }
    if (mastery.length > 20) {
      return res.status(400).json({ error: "Liian monta merkint\u00e4\u00e4" });
    }

    const now = new Date().toISOString();
    const rows = [];
    for (const m of mastery) {
      if (!m || typeof m.topic_key !== "string") continue;
      if (!VALID_MASTERY_TOPICS.has(m.topic_key)) continue;
      const bestPct = Math.max(0, Math.min(1, Number(m.best_pct) || 0));
      // Only pre-unlock for correct answers; skip wrong ones (normal unlock chain handles those)
      if (bestPct < 0.5) continue;
      rows.push({
        user_id: req.user.userId,
        topic_key: m.topic_key,
        status: "available",
        best_pct: 0,       // don't credit mastery from 1-question diagnostic
        best_score: 0,
        attempts: 0,
        unlocked_at: now,
        updated_at: now,
      });
    }

    if (rows.length === 0) return res.json({ ok: true, inserted: 0 });

    const { error } = await supabase
      .from("user_mastery")
      .upsert(rows, { onConflict: "user_id,topic_key", ignoreDuplicates: true });

    if (error) {
      console.error("Mastery seed error:", error.message);
      return res.status(500).json({ error: "Siemennys ep\u00e4onnistui" });
    }

    return res.json({ ok: true, inserted: rows.length });
  } catch (err) {
    console.error("Mastery seed error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

export default router;
