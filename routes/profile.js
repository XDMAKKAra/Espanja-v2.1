import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const VALID_GRADES = ["I", "A", "B", "C", "M", "E", "L", "en tiedä"];
const VALID_TARGET_GRADES = ["B", "C", "M", "E", "L"];
const VALID_REFERRALS = ["friend", "teacher", "google", "tiktok", "instagram", "other"];
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
      target_grade,
      exam_date,
      study_years,
      weak_areas,
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
    if (weak_areas && !Array.isArray(weak_areas)) {
      return res.status(400).json({ error: "weak_areas pitää olla taulukko" });
    }
    if (weak_areas) {
      const invalid = weak_areas.filter(a => !VALID_WEAK_AREAS.includes(a));
      if (invalid.length > 0) {
        return res.status(400).json({ error: `Virheelliset heikkoudet: ${invalid.join(", ")}` });
      }
    }

    const profileData = {
      user_id: req.user.userId,
      updated_at: new Date().toISOString(),
    };

    if (current_grade !== undefined) profileData.current_grade = current_grade;
    if (target_grade !== undefined) profileData.target_grade = target_grade;
    if (exam_date !== undefined) profileData.exam_date = exam_date;
    if (study_years !== undefined) profileData.study_years = Number(study_years) || 0;
    if (weak_areas !== undefined) profileData.weak_areas = weak_areas;
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
      console.error("Profile save error:", error.message);
      return res.status(500).json({ error: "Profiilin tallennus epäonnistui" });
    }

    return res.json({ ok: true, profile: data });
  } catch (err) {
    console.error("Profile error:", err.message);
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
