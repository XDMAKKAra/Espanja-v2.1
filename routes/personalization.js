// L-V315-REASONER-1 — POST /api/personalization/build-profile.
// Lukee user_onboarding_diagnostic + mini_yo_progress -taulut,
// kutsuu lib/personalization.js -reasonerin, persistoi tuloksen,
// palauttaa frontille.

import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import {
  buildSkillProfile,
  selectWeightedTopic,
  summarizeMiniYOFromRows,
} from "../lib/personalization.js";

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
      // Part A: prefer per-topic scores stored in mini_yo_part_a_scores
      // (jsonb shape: { scoresByTopic: { subjunctive_present: 0.2, ... } }).
      // Aggregated mini_yo_progress overall accuracy stays as a fallback.
      if (diagnostic.mini_yo_part_a_scores && typeof diagnostic.mini_yo_part_a_scores === "object") {
        const stored = diagnostic.mini_yo_part_a_scores;
        miniYO = miniYO || {};
        miniYO.partA = miniYO.partA || {};
        if (stored.scoresByTopic && typeof stored.scoresByTopic === "object") {
          miniYO.partA.scoresByTopic = stored.scoresByTopic;
        }
        if (typeof stored.overallAccuracy === "number") {
          miniYO.partA.overallAccuracy = stored.overallAccuracy;
        }
      }
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

// ─── POST /api/personalization/next-topic ─────────────────────────────────
// L-V315b Task 2: palauttaa painotetusti valitun aiheen heikkojen aiheiden
// puolesta (3x sample-prob) ja vahvojen vastaan (0.3x). Frontend voi kutsua
// tätä ennen /api/generate -callia jotta exercise-pool painottuu profiilin
// mukaan. Jos käyttäjällä ei ole skill_profilea tai availableTopics on tyhjä,
// palautetaan uniform-sample (current behavior).
router.post("/next-topic", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const language = typeof req.body?.language === "string" ? req.body.language : null;
    const availableTopics = Array.isArray(req.body?.availableTopics)
      ? req.body.availableTopics.filter(t => typeof t === "string" && t.length > 0)
      : [];

    if (!VALID_LANGS.has(language)) {
      return res.status(400).json({ error: "Tuntematon kieli" });
    }
    if (availableTopics.length === 0) {
      return res.status(400).json({ error: "availableTopics on pakollinen" });
    }

    const { data: diagnostic } = await supabase
      .from("user_onboarding_diagnostic")
      .select("inferred_skill_profile")
      .eq("user_id", userId)
      .eq("language", language)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reasoned = diagnostic?.inferred_skill_profile || null;
    const skillProfile = reasoned?.skillProfile || null;
    const courseWeights = reasoned?.courseWeights || null;

    const topic = selectWeightedTopic(skillProfile, courseWeights, availableTopics, language);

    return res.json({
      topic,
      source: skillProfile ? "weighted" : "uniform",
      gapsCount: reasoned?.meta?.gapsCount ?? 0,
    });
  } catch (err) {
    console.error("personalization next-topic error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

export default router;
