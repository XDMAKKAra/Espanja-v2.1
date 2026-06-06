/**
 * routes/digikirja.js — backend for the digikirja screen.
 *
 *   GET  /api/digikirja/itsearvio?lang&kurssi&lesson
 *   POST /api/digikirja/itsearvio          { lang, kurssi, lesson, ratings }
 *   GET  /api/digikirja/progress?lang&kurssi&lesson
 *   POST /api/digikirja/progress           { lang, kurssi, lesson, sivuId }
 *   DELETE /api/digikirja/progress         (resets the whole lesson)
 *
 * Tables (PR8b — added in migrations 038 + 039):
 *   public.user_self_assessments
 *   public.user_lesson_progress
 *
 * All routes require auth. Validation guards the four route params
 * (lang ∈ es/fr/de, kurssi_key non-empty, lesson_index >= 1) before any
 * DB hop so a bad URL gets a 400, not a Postgres constraint error.
 */

import { Router } from "express";
import adminClient from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { PRODUCT_LANGS } from "../lib/constants.js";

const router = Router();

const SUPPORTED_LANGS = PRODUCT_LANGS;

function parseRouteParams(src) {
  const lang = String(src.lang || "").toLowerCase();
  const kurssiKey = String(src.kurssi || src.kurssiKey || "");
  const lessonIndex = Number(src.lesson || src.lessonIndex);
  if (!SUPPORTED_LANGS.has(lang)) return { error: "Virheellinen kieli" };
  if (!kurssiKey || kurssiKey.length > 64) return { error: "Virheellinen kurssi" };
  if (!Number.isInteger(lessonIndex) || lessonIndex < 1 || lessonIndex > 99) {
    return { error: "Virheellinen oppitunti" };
  }
  return { lang, kurssiKey, lessonIndex };
}

// ─── Itsearviointi ────────────────────────────────────────────────────

router.get("/itsearvio", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  const parsed = parseRouteParams(req.query);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { lang, kurssiKey, lessonIndex } = parsed;

  const { data, error } = await supabase
    .from("user_self_assessments")
    .select("ratings, submitted_at")
    .eq("user_id", req.user.userId)
    .eq("lang", lang)
    .eq("kurssi_key", kurssiKey)
    .eq("lesson_index", lessonIndex)
    .maybeSingle();

  if (error) {
    console.error("itsearvio fetch failed:", error.message);
    return res.status(500).json({ error: "Itsearvioiden haku epäonnistui" });
  }
  return res.json({
    itsearvio: data
      ? { ratings: data.ratings, submittedAt: data.submitted_at }
      : null,
  });
});

router.delete("/itsearvio", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  const parsed = parseRouteParams(req.query);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { lang, kurssiKey, lessonIndex } = parsed;
  const { error } = await supabase
    .from("user_self_assessments")
    .delete()
    .eq("user_id", req.user.userId)
    .eq("lang", lang)
    .eq("kurssi_key", kurssiKey)
    .eq("lesson_index", lessonIndex);
  if (error) return res.status(500).json({ error: "Poisto epäonnistui" });
  return res.json({ ok: true });
});

router.post("/itsearvio", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  const parsed = parseRouteParams(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { lang, kurssiKey, lessonIndex } = parsed;

  const ratings = req.body?.ratings;
  if (!ratings || typeof ratings !== "object" || Array.isArray(ratings)) {
    return res.status(400).json({ error: "Virheelliset arviot" });
  }
  // Reject any non-1..5 integer rating so a malformed client can't poison
  // the row. Empty object is fine — caller may be saving a draft.
  for (const [k, v] of Object.entries(ratings)) {
    if (typeof k !== "string" || k.length > 32) {
      return res.status(400).json({ error: "Virheellinen väittämä-id" });
    }
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return res.status(400).json({ error: "Arvosanan pitää olla 1–5" });
    }
  }

  const submittedAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_self_assessments")
    .upsert({
      user_id: req.user.userId,
      lang,
      kurssi_key: kurssiKey,
      lesson_index: lessonIndex,
      ratings,
      submitted_at: submittedAt,
    }, { onConflict: "user_id,lang,kurssi_key,lesson_index" });

  if (error) {
    console.error("itsearvio upsert failed:", error.message);
    return res.status(500).json({ error: "Itsearvion tallennus epäonnistui" });
  }
  return res.json({ ok: true, submittedAt });
});

// ─── Per-sivu progress ────────────────────────────────────────────────

router.get("/progress", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  const parsed = parseRouteParams(req.query);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { lang, kurssiKey, lessonIndex } = parsed;

  const { data, error } = await supabase
    .from("user_lesson_progress")
    .select("sivu_id, done_at")
    .eq("user_id", req.user.userId)
    .eq("lang", lang)
    .eq("kurssi_key", kurssiKey)
    .eq("lesson_index", lessonIndex);

  if (error) {
    console.error("progress fetch failed:", error.message);
    return res.status(500).json({ error: "Edistymisen haku epäonnistui" });
  }
  // Return as a flat map for easy hydration into localStorage.
  const sivut = {};
  for (const row of data || []) sivut[row.sivu_id] = row.done_at;
  return res.json({ sivut });
});

router.post("/progress", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  const parsed = parseRouteParams(req.body);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { lang, kurssiKey, lessonIndex } = parsed;

  const sivuId = String(req.body?.sivuId || "");
  if (!sivuId || sivuId.length > 64) {
    return res.status(400).json({ error: "Virheellinen sivu" });
  }

  const { error } = await supabase
    .from("user_lesson_progress")
    .upsert({
      user_id: req.user.userId,
      lang,
      kurssi_key: kurssiKey,
      lesson_index: lessonIndex,
      sivu_id: sivuId,
      done_at: new Date().toISOString(),
    }, { onConflict: "user_id,lang,kurssi_key,lesson_index,sivu_id" });

  if (error) {
    console.error("progress upsert failed:", error.message);
    return res.status(500).json({ error: "Edistymisen tallennus epäonnistui" });
  }
  return res.json({ ok: true });
});

router.delete("/progress", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  const parsed = parseRouteParams(req.query);
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  const { lang, kurssiKey, lessonIndex } = parsed;

  const { error } = await supabase
    .from("user_lesson_progress")
    .delete()
    .eq("user_id", req.user.userId)
    .eq("lang", lang)
    .eq("kurssi_key", kurssiKey)
    .eq("lesson_index", lessonIndex);

  if (error) {
    console.error("progress delete failed:", error.message);
    return res.status(500).json({ error: "Edistymisen poisto epäonnistui" });
  }
  return res.json({ ok: true });
});

export default router;
