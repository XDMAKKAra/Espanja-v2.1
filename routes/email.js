import { Router } from "express";
import crypto from "node:crypto";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";

// Constant-time comparison for the cron-secret header. Prevents timing
// side-channels from leaking the secret one byte at a time.
function cronSecretValid(provided) {
  const expected = process.env.CRON_SECRET;
  if (!expected || typeof provided !== "string") return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
import {
  sendWeeklyProgressEmail,
  sendStreakReminderEmail,
  sendD1WeaknessEmail,
  sendD7OfferEmail,
  sendExamCountdownEmail,
} from "../email.js";
import { isPro } from "../middleware/auth.js";
import { WEAKNESS_SENTENCES, WEAKNESS_FALLBACK } from "../lib/weakness.js";
import { GRADES, GRADE_ORDER, DAY_MS, WEEK_MS, calculateStreak, calculateEstLevel } from "../lib/openai.js";

const router = Router();

router.post("/weekly-progress", requireAuth, async (req, res) => {
  const userId = req.user.userId;
  const email = req.user.email;

  const { data: logs } = await supabase
    .from("exercise_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!logs?.length) return res.status(400).json({ error: "Ei dataa vielä" });

  const nowMs = Date.now();
  const weekSessions = logs.filter((l) => nowMs - new Date(l.created_at).getTime() < WEEK_MS).length;
  const prevWeekSessions = logs.filter((l) => {
    const age = nowMs - new Date(l.created_at).getTime();
    return age >= WEEK_MS && age < 2 * WEEK_MS;
  }).length;

  const streak = calculateStreak(logs);
  const estLevel = calculateEstLevel(logs);

  const modeMap = {};
  for (const log of logs.filter((l) => nowMs - new Date(l.created_at).getTime() < WEEK_MS)) {
    if (!modeMap[log.mode]) modeMap[log.mode] = { pcts: [] };
    if (log.score_total > 0) modeMap[log.mode].pcts.push(Math.round((log.score_correct / log.score_total) * 100));
  }
  let bestMode = null, bestModePct = 0;
  for (const [mode, s] of Object.entries(modeMap)) {
    if (s.pcts.length) {
      const avg = Math.round(s.pcts.reduce((a, b) => a + b, 0) / s.pcts.length);
      if (avg > bestModePct) { bestModePct = avg; bestMode = mode; }
    }
  }

  try {
    await sendWeeklyProgressEmail(email, {
      name: email.split("@")[0],
      weekSessions, streak, estLevel, prevWeekSessions, bestMode, bestModePct,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Weekly email failed:", err);
    res.status(500).json({ error: "Sähköpostin lähetys epäonnistui" });
  }
});

router.post("/streak-reminders", async (req, res) => {
  if (!cronSecretValid(req.headers["x-cron-secret"])) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);

  // Optimized: query users who practiced yesterday but NOT today directly from exercise_logs
  // This avoids the N+1 pattern of fetching all users then querying logs for each
  const { data: yesterdayLogs } = await supabase
    .from("exercise_logs")
    .select("user_id, created_at")
    .gte("created_at", new Date(Date.now() - 30 * DAY_MS).toISOString())
    .order("created_at", { ascending: false });

  if (!yesterdayLogs?.length) return res.json({ ok: true, sent: 0 });

  // Group by user
  const userLogs = {};
  for (const log of yesterdayLogs) {
    if (!userLogs[log.user_id]) userLogs[log.user_id] = [];
    userLogs[log.user_id].push(log);
  }

  let sent = 0;

  for (const [userId, logs] of Object.entries(userLogs)) {
    const daySet = new Set(logs.map((l) => l.created_at.slice(0, 10)));
    const hasPracticedToday = daySet.has(todayStr);
    const practicedYesterday = daySet.has(yesterdayStr);

    if (hasPracticedToday || !practicedYesterday) continue;

    const streak = calculateStreak(logs);

    if (streak >= 2) {
      // Fetch user email only for users we need to send to
      const { data: { user } } = await supabase.auth.admin.getUserById(userId);
      if (!user?.email) continue;

      // Check email preferences
      const { data: prefs } = await supabase
        .from("email_preferences")
        .select("streak_reminders")
        .eq("user_id", userId)
        .single();
      if (prefs && prefs.streak_reminders === false) continue;

      // Try push notification first, fall back to email
      let pushed = 0;
      try {
        const { sendPushToUser } = await import("./push.js");
        pushed = await sendPushToUser(userId, {
          title: `🔥 ${streak} päivän putki!`,
          body: "Älä katkaise putkea — harjoittele tänään!",
          url: "/app.html",
        });
      } catch { /* push not available */ }

      if (pushed === 0) {
        sendStreakReminderEmail(user.email, {
          name: user.email.split("@")[0],
          streak,
          lastPracticeDate: yesterdayStr,
        }).catch((err) => console.error("Streak reminder failed for", user.email, err));
      }
      sent++;
    }
  }

  res.json({ ok: true, sent });
});

router.get("/preferences", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", req.user.userId)
    .single();

  if (error || !data) {
    return res.json({
      weeklyProgress: true, streakReminders: true,
      d1Weakness: true, d7Offer: true, examCountdown: true,
    });
  }
  res.json({
    weeklyProgress: data.weekly_progress,
    streakReminders: data.streak_reminders,
    d1Weakness: data.d1_weakness ?? true,
    d7Offer: data.d7_offer ?? true,
    examCountdown: data.exam_countdown ?? true,
  });
});

router.put("/preferences", requireAuth, async (req, res) => {
  const { weeklyProgress, streakReminders, d1Weakness, d7Offer, examCountdown } = req.body;
  const row = { user_id: req.user.userId };
  if (weeklyProgress !== undefined) row.weekly_progress = weeklyProgress;
  if (streakReminders !== undefined) row.streak_reminders = streakReminders;
  if (d1Weakness !== undefined) row.d1_weakness = d1Weakness;
  if (d7Offer !== undefined) row.d7_offer = d7Offer;
  if (examCountdown !== undefined) row.exam_countdown = examCountdown;
  const { error } = await supabase.from("email_preferences").upsert(row, { onConflict: "user_id" });
  if (error) return res.status(500).json({ error: "Asetusten tallennus epäonnistui" });
  res.json({ ok: true });
});

// ─── Pass 4 lifecycle drip (cron-signed) ────────────────────────────────────

function cronGuard(req, res) {
  if (!cronSecretValid(req.headers["x-cron-secret"])) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function getUsersRegisteredInWindow(startAgoMs, endAgoMs) {
  // listUsers is paginated; for the near-term volume we expect this is fine.
  const since = new Date(Date.now() - endAgoMs).toISOString();
  const until = new Date(Date.now() - startAgoMs).toISOString();
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return (data?.users || []).filter((u) => {
    const t = u.created_at;
    return t >= since && t <= until;
  });
}

// POST /api/email/d1-weakness — runs hourly. Targets users registered
// 23–25 h ago with placement_completed = true.
router.post("/d1-weakness", async (req, res) => {
  if (!cronGuard(req, res)) return;
  const HOUR = 60 * 60 * 1000;
  const users = await getUsersRegisteredInWindow(23 * HOUR, 25 * HOUR);
  let sent = 0;

  for (const u of users) {
    const { data: profile } = await supabase
      .from("user_profile")
      .select("placement_completed, weakness_category")
      .eq("user_id", u.id)
      .single();
    if (!profile?.placement_completed) continue;

    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("d1_weakness")
      .eq("user_id", u.id)
      .single();
    if (prefs && prefs.d1_weakness === false) continue;

    const category = profile.weakness_category || null;
    const weaknessSentence = (category && WEAKNESS_SENTENCES[category]) || WEAKNESS_FALLBACK;
    const weaknessShort = category ? category.replace(/_/g, " ") : "sanasto";

    // Real-example lookup: most recent wrong answer in this category from
    // exercise_logs. Not every log carries category metadata (legacy rows
    // don't); fall back to the pre-curated seed-bank example if absent.
    let example = null;
    if (category) {
      const { data: wrongLogs } = await supabase
        .from("exercise_logs")
        .select("item_snapshot, category, created_at")
        .eq("user_id", u.id)
        .eq("correct", false)
        .eq("category", category)
        .order("created_at", { ascending: false })
        .limit(1);
      if (wrongLogs?.[0]?.item_snapshot) {
        const snap = wrongLogs[0].item_snapshot;
        example = {
          prompt: snap.question || snap.prompt || "",
          options: snap.options || [],
          correctLetter: snap.correctLetter || "",
          correctText: snap.correctText || "",
          explain: snap.explain || "",
        };
      }
    }

    await sendD1WeaknessEmail(u.email, { weaknessShort, weaknessSentence, example }).catch(() => {});
    sent++;
  }

  res.json({ ok: true, sent, fallback_count: users.length - sent });
});

// POST /api/email/d7-offer — runs hourly. Targets users registered
// 167–169 h ago (≈ 7 days). Template branches on Pro status.
router.post("/d7-offer", async (req, res) => {
  if (!cronGuard(req, res)) return;
  const HOUR = 60 * 60 * 1000;
  const users = await getUsersRegisteredInWindow(167 * HOUR, 169 * HOUR);
  let sent = 0;

  for (const u of users) {
    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("d7_offer")
      .eq("user_id", u.id)
      .single();
    if (prefs && prefs.d7_offer === false) continue;

    // 7-day stats.
    const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
    const { data: logs } = await supabase
      .from("exercise_logs")
      .select("score_correct, score_total, mode, level")
      .eq("user_id", u.id)
      .gte("created_at", weekAgo);
    const exercisesCompleted = logs?.length || 0;
    const totalPts = (logs || []).reduce((s, l) => s + (l.score_correct || 0), 0);
    const totalMax = (logs || []).reduce((s, l) => s + (l.score_total || 0), 0);
    const correctPct = totalMax ? Math.round((totalPts / totalMax) * 100) : 0;
    const topicsTouched = new Set((logs || []).map((l) => l.mode)).size;

    const userIsPro = await isPro(u.id);

    // L-PRICING-REVAMP-1 — 3-tier model. Treeni = open practice, Mestari = full
    // YO-prep with course path. Both have 8-week packages priced as ~2× monthly.
    const seasonalBlock = "Treeni 9 €/kk tai Mestari 19 €/kk. 8 viikon paketti Treeni 19 € · Mestari 39 €.";

    const level = logs?.[0]?.level || "C";

    await sendD7OfferEmail(u.email, {
      exercisesCompleted, correctPct, topicsTouched,
      seasonalBlock, isPro: userIsPro, level,
    }).catch(() => {});
    sent++;
  }

  res.json({ ok: true, sent });
});

// POST /api/email/exam-countdown — runs daily at 08:00 Helsinki. Targets
// users whose exam_date is ~30 or ~7 days out.
router.post("/exam-countdown", async (req, res) => {
  if (!cronGuard(req, res)) return;

  // Pull all user_profiles with an exam_date set; filter in JS by days-out
  // window. At current volumes this is fine; add indexed daily job later.
  const { data: profiles } = await supabase
    .from("user_profile")
    .select("user_id, exam_date");
  if (!profiles?.length) return res.json({ ok: true, sent: 0 });

  let sent = 0;
  for (const p of profiles) {
    if (!p.exam_date) continue;
    const daysOut = Math.round((new Date(p.exam_date) - Date.now()) / DAY_MS);
    const inWindow = daysOut === 30 || daysOut === 7;
    if (!inWindow) continue;

    const { data: prefs } = await supabase
      .from("email_preferences")
      .select("exam_countdown")
      .eq("user_id", p.user_id)
      .single();
    if (prefs && prefs.exam_countdown === false) continue;

    const { data: { user } } = await supabase.auth.admin.getUserById(p.user_id);
    if (!user?.email) continue;

    await sendExamCountdownEmail(user.email, {
      daysOut,
      examDate: new Date(p.exam_date).toLocaleDateString("fi-FI"),
    }).catch(() => {});
    sent++;
  }
  res.json({ ok: true, sent });
});

export default router;
