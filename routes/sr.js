import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// ─── SM-2 algorithm ────────────────────────────────────────────────────────

function sm2(card, grade) {
  let { ease_factor, interval_days, repetitions } = card;

  if (grade < 3) {
    // Failed: reset
    repetitions = 0;
    interval_days = 1;
  } else {
    // Passed
    repetitions += 1;
    if (repetitions === 1) {
      interval_days = 1;
    } else if (repetitions === 2) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
  }

  // Update ease factor (min 1.3)
  ease_factor += 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02);
  if (ease_factor < 1.3) ease_factor = 1.3;

  // Next review date
  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval_days);

  return {
    ease_factor: Math.round(ease_factor * 100) / 100,
    interval_days,
    repetitions,
    next_review: next_review.toISOString().slice(0, 10),
    last_grade: grade,
  };
}

// ─── POST /api/sr/review ───────────────────────────────────────────────────

router.post("/review", requireAuth, async (req, res) => {
  const { word, question, language = "spanish", grade } = req.body;

  if (!word || grade === undefined || grade < 0 || grade > 5) {
    return res.status(400).json({ error: "word ja grade (0-5) vaaditaan" });
  }

  const userId = req.user.userId;

  try {
    // Get existing card or create default
    const { data: existing } = await supabase
      .from("sr_cards")
      .select("*")
      .eq("user_id", userId)
      .eq("word", word)
      .eq("language", language)
      .single();

    const current = existing || {
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
    };

    const updated = sm2(current, grade);

    const { error } = await supabase
      .from("sr_cards")
      .upsert({
        user_id: userId,
        word,
        question: question || word,
        language,
        ...updated,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,word,language" });

    if (error) throw error;

    res.json({ ok: true, ...updated });
  } catch (err) {
    console.error("SR review error:", err.message);
    res.status(500).json({ error: "Kertauspäivitys epäonnistui" });
  }
});

// ─── GET /api/sr/due ───────────────────────────────────────────────────────

router.get("/due", requireAuth, async (req, res) => {
  const { language = "spanish", limit = 20 } = req.query;
  const userId = req.user.userId;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { data, error } = await supabase
      .from("sr_cards")
      .select("id, word, question, language, ease_factor, interval_days, repetitions, next_review, last_grade")
      .eq("user_id", userId)
      .eq("language", language)
      .lte("next_review", today)
      .order("next_review", { ascending: true })
      .limit(Number(limit) || 20);

    if (error) throw error;

    res.json({ cards: data || [], count: data?.length || 0 });
  } catch (err) {
    console.error("SR due error:", err.message);
    res.status(500).json({ error: "Kertauskorttien haku epäonnistui" });
  }
});

// ─── GET /api/sr/count ─────────────────────────────────────────────────────

router.get("/count", requireAuth, async (req, res) => {
  const { language = "spanish" } = req.query;
  const userId = req.user.userId;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { count, error } = await supabase
      .from("sr_cards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("language", language)
      .lte("next_review", today);

    if (error) throw error;

    res.json({ count: count || 0 });
  } catch (err) {
    res.json({ count: 0 });
  }
});

export default router;
