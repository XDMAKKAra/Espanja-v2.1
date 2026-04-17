import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { sendWeeklyProgressEmail, sendStreakReminderEmail } from "../email.js";
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
  for (const log of logs.filter((l) => nowMs - new Date(l.created_at).getTime() < weekMs)) {
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
  const cronSecret = req.headers["x-cron-secret"];
  if (cronSecret !== process.env.CRON_SECRET) {
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
    return res.json({ weeklyProgress: true, streakReminders: true });
  }
  res.json({
    weeklyProgress: data.weekly_progress,
    streakReminders: data.streak_reminders,
  });
});

router.put("/preferences", requireAuth, async (req, res) => {
  const { weeklyProgress, streakReminders } = req.body;
  const { error } = await supabase.from("email_preferences").upsert(
    {
      user_id: req.user.userId,
      weekly_progress: weeklyProgress ?? true,
      streak_reminders: streakReminders ?? true,
    },
    { onConflict: "user_id" }
  );
  if (error) return res.status(500).json({ error: "Asetusten tallennus epäonnistui" });
  res.json({ ok: true });
});

export default router;
