import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { sm2, bandToQuality } from "../lib/scheduler.js";

const router = Router();

// ─── POST /api/sr/review ───────────────────────────────────────────────────

router.post("/review", requireAuth, async (req, res) => {
  const { word, question, language = "spanish", grade, band, topic } = req.body;

  // Accept either legacy numeric grade or new band string
  const quality = band ? bandToQuality(band) : grade;

  if (!word || quality === undefined || quality < 0 || quality > 5) {
    return res.status(400).json({ error: "word ja grade (0-5) tai band vaaditaan" });
  }

  const userId = req.user.userId;

  try {
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
      reviews_total: 0,
      reviews_correct: 0,
    };

    const previousInterval = current.interval_days || 0;
    const updated = sm2(current, quality);
    const now = new Date().toISOString();

    const upsertPayload = {
      user_id: userId,
      word,
      question: question || word,
      language,
      ...updated,
      last_band: band || null,
      reviews_total: (current.reviews_total || 0) + 1,
      reviews_correct: (current.reviews_correct || 0) + (quality >= 3 ? 1 : 0),
      first_reviewed_at: current.first_reviewed_at || now,
      updated_at: now,
    };

    if (topic) upsertPayload.topic = topic;
    if (updated.state === "mastered" && !current.mastered_at) upsertPayload.mastered_at = now;
    if (updated.state === "lapsed") upsertPayload.lapsed_at = now;

    const { error } = await supabase
      .from("sr_cards")
      .upsert(upsertPayload, { onConflict: "user_id,word,language" });

    if (error) throw error;

    res.json({
      ok: true,
      ...updated,
      previousInterval,
      intervalGrew: updated.interval_days > previousInterval,
    });
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
      .select("id, word, question, language, ease_factor, interval_days, repetitions, next_review, last_grade, created_at, updated_at")
      .eq("user_id", userId)
      .eq("language", language)
      .lte("next_review", today)
      .order("next_review", { ascending: true })
      .limit(Number(limit) || 20);

    if (error) throw error;

    // Annotate with days since learned + last review
    const now = Date.now();
    const cards = (data || []).map(c => {
      const learnedAt = new Date(c.created_at).getTime();
      const daysSinceLearned = Math.floor((now - learnedAt) / (24 * 60 * 60 * 1000));
      return {
        ...c,
        daysSinceLearned,
        reviewNumber: (c.repetitions || 0) + 1,
      };
    });

    res.json({ cards, count: cards.length });
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

// ─── GET /api/sr/forecast ──────────────────────────────────────────────────

router.get("/forecast", requireAuth, async (req, res) => {
  const { language = "spanish", days = 30 } = req.query;
  const userId = req.user.userId;
  const clampedDays = Math.max(7, Math.min(60, Number(days) || 30));

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + clampedDays);

    const { data, error } = await supabase
      .from("sr_cards")
      .select("next_review")
      .eq("user_id", userId)
      .eq("language", language)
      .lte("next_review", endDate.toISOString().slice(0, 10));

    if (error) throw error;

    // Bucket by day
    const buckets = new Array(clampedDays).fill(0);
    const todayStr = today.toISOString().slice(0, 10);

    for (const card of data || []) {
      const reviewDate = new Date(card.next_review);
      reviewDate.setHours(0, 0, 0, 0);
      const dayDiff = Math.floor((reviewDate - today) / (24 * 60 * 60 * 1000));
      if (dayDiff < 0) {
        // Overdue → bucket into day 0 (today)
        buckets[0]++;
      } else if (dayDiff < clampedDays) {
        buckets[dayDiff]++;
      }
    }

    // Build response with dates
    const forecast = buckets.map((count, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return {
        date: d.toISOString().slice(0, 10),
        dayOffset: i,
        count,
      };
    });

    const totalCards = (data || []).length;
    const dueTodayOrOverdue = buckets[0];

    res.json({
      forecast,
      totalCards,
      dueToday: dueTodayOrOverdue,
      maxDaily: Math.max(...buckets),
    });
  } catch (err) {
    console.error("SR forecast error:", err.message);
    res.status(500).json({ error: "Ennusteen haku epäonnistui" });
  }
});

export default router;
