// L-V315-REASONER-1 — POST /api/personalization/build-profile.
// Lukee user_onboarding_diagnostic + mini_yo_progress -taulut,
// kutsuu lib/personalization.js -reasonerin, persistoi tuloksen,
// palauttaa frontille.

import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { buildSkillProfile, summarizeMiniYOFromRows } from "../lib/personalization.js";

const router = Router();

const VALID_LANGS = new Set(["es", "de", "fr"]);

router.post("/build-profile", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const language = typeof req.body?.language === "string" ? req.body.language : null;
    if (!VALID_LANGS.has(language)) {
      return res.status(400).json({ error: "Tuntematon kieli" });
    }

    // 1. Lue diagnostic-rivi (sisältää courses + grades + biography + textbook + part_c).
    const { data: diagnostic, error: diagErr } = await supabase
      .from("user_onboarding_diagnostic")
      .select("*")
      .eq("user_id", userId)
      .eq("language", language)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (diagErr) {
      console.error("personalization: diagnostic read failed:", diagErr.message);
      return res.status(500).json({ error: "Profiilin lataus epäonnistui" });
    }
    if (!diagnostic) {
      return res.status(404).json({ error: "Diagnostiikkaa ei löytynyt" });
    }

    // 2. Lue mini_yo_progress per-osio-tarkkuutta varten (jos olemassa).
    const { data: progressRows } = await supabase
      .from("mini_yo_progress")
      .select("part, question_id, is_correct")
      .eq("user_id", userId)
      .eq("language", language);

    let miniYO = null;
    if (diagnostic.mini_yo_status !== "skipped") {
      miniYO = summarizeMiniYOFromRows(progressRows || []);
      // Part C on AI-graded ja talletettu erilliseen kenttään.
      if (diagnostic.mini_yo_part_c_writing && typeof diagnostic.mini_yo_part_c_writing === "object") {
        miniYO = miniYO || {};
        miniYO.partC = diagnostic.mini_yo_part_c_writing;
      }
    }

    // 3. Aja reasoner.
    let result;
    try {
      result = await buildSkillProfile({
        lang: language,
        miniYO,
        coursesCompleted: Array.isArray(diagnostic.courses_completed) ? diagnostic.courses_completed : [],
        courseGrades: diagnostic.course_grades || {},
        biography: diagnostic.biography || {},
        textbookKey: diagnostic.textbook_key || null,
      });
    } catch (reasonErr) {
      console.error("personalization: reasoner failed:", reasonErr.message);
      return res.status(500).json({ error: "Profiilin rakennus epäonnistui" });
    }

    // 4. Persistoi inferred_skill_profile-kenttään (best-effort).
    try {
      await supabase
        .from("user_onboarding_diagnostic")
        .update({ inferred_skill_profile: result, updated_at: new Date().toISOString() })
        .eq("id", diagnostic.id);
    } catch (persistErr) {
      // Älä epäonnistuta vastausta jos persist epäonnistui; käyttäjä saa silti tuloksen.
      console.error("personalization: persist failed:", persistErr.message);
    }

    return res.json(result);
  } catch (err) {
    console.error("personalization: unexpected error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

export default router;
