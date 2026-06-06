// L-ONBOARDING-REDESIGN-1 — onboarding flow endpoints.
// POST /api/onboarding/complete — upserts onboarding fields onto user_profile
//                                  (PK user_id) + sets onboarding_completed.
// POST /api/onboarding/waitlist  — appends a row to public.waitlist with
//                                  product = "{lang}_{level}" for de/fr courses.
// GET  /api/onboarding/waitlist/count?language=<es|de|fr> — real-data counter.

import { Router } from "express";
import adminClient from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { computeStudyPlan } from "../lib/studyPlan.js";
import { GRADES } from "../lib/constants.js";
import { Resend } from "resend";

const router = Router();

// Lazy Resend client (same pattern as email.js — avoids crash when key missing in CI).
let _resend = null;
function getResend() {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}
const EMAIL_FROM = process.env.EMAIL_FROM || "Puheo <noreply@puheo.fi>";

const LANG_LABELS = { es: "espanjan", de: "saksan", fr: "ranskan" };

const LANGS = ["es", "de", "fr"];
const LEVELS = ["lyhyt", "pitka"];
const FOCUS_AREAS = ["vocab", "grammar", "writing", "reading", "exam"];

// L-V293-ONBOARDING-DIAGNOSTIC-1a constants.
const DIAGNOSTIC_PARTS = ["a_grammar", "b_reading", "c_writing"];
const MINI_YO_STATUSES = ["in_progress", "completed", "partial", "skipped"];
const KURSSI_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8];
const BIO_HOME = ["yes", "no", "some"];
const BIO_LIVED = ["over_year", "months", "vacations", "never"];
const BIO_FREQ = ["daily", "weekly", "monthly", "rarely"];

function sanitizeArray(input, allowed) {
  if (!Array.isArray(input)) return [];
  const set = new Set();
  for (const v of input) {
    const s = String(v).slice(0, 32);
    if (allowed.includes(s)) set.add(s);
  }
  return [...set];
}

router.post("/complete", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  try {
    const {
      target_language,
      target_level,
      current_level,
      target_grade,
      exam_date,
      weekly_minutes,
      focus_areas,
    } = req.body || {};

    const update = {
      user_id: req.user.userId,
      onboarding_completed: true,
    };

    if (LANGS.includes(target_language)) update.target_language = target_language;
    if (LEVELS.includes(target_level)) update.target_level = target_level;
    if (GRADES.includes(current_level)) update.current_grade = current_level;
    if (GRADES.includes(target_grade)) update.target_grade = target_grade;

    if (typeof exam_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(exam_date)) {
      update.exam_date = exam_date;
    }
    if (Number.isFinite(weekly_minutes)) {
      update.weekly_goal_minutes = Math.min(600, Math.max(15, Math.round(weekly_minutes)));
    }
    update.weak_areas = sanitizeArray(focus_areas, FOCUS_AREAS);

    const { error } = await supabase
      .from("user_profile")
      .upsert(update, { onConflict: "user_id" });

    if (error) {
      console.error("Onboarding complete write failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }

    const plan = computeStudyPlan({
      current_level: update.current_grade,
      target_grade: update.target_grade,
      exam_date: update.exam_date,
    });

    return res.json({ ok: true, plan });
  } catch (err) {
    console.error("Onboarding complete error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

router.post("/waitlist", async (req, res) => {
  try {
    const { email, language, level } = req.body || {};
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Virheellinen sähköposti" });
    }
    if (!LANGS.includes(language)) {
      return res.status(400).json({ error: "Tuntematon kieli" });
    }
    const safeLevel = LEVELS.includes(level) ? level : "lyhyt";
    const row = {
      email: email.toLowerCase().slice(0, 255),
      product: `${language}_${safeLevel}`,
    };
    const { error } = await adminClient.from("waitlist").insert(row);
    if (error) {
      console.error("Waitlist insert failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }

    // Send confirmation email — non-fatal (row is already inserted).
    const langLabel = LANG_LABELS[language] || "kielen";
    try {
      await getResend().emails.send({
        from: EMAIL_FROM,
        to: row.email,
        subject: `Olet listalla — Puheo ${langLabel} kurssi`,
        html: `<!DOCTYPE html>
<html lang="fi">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:40px 20px;background:#0e0e12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a24;border-radius:16px;overflow:hidden">
<tr><td style="padding:32px 40px 0">
  <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#fff">Puhe<span style="color:#6d5ef4">o</span></div>
</td></tr>
<tr><td style="padding:24px 40px 40px">
  <h1 style="color:#fff;font-size:22px;margin:0 0 16px;font-weight:600">Sinut on merkitty listalle</h1>
  <div style="color:#a0a0b8;font-size:15px;line-height:1.6">
    <p>Saimme ilmoittautumisesi waitlistille (${langLabel} kurssi). Lähetämme sinulle viestin heti, kun kurssi avautuu.</p>
    <p>— Puheo</p>
  </div>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid #2a2a3a">
  <p style="color:#555;font-size:12px;margin:0;text-align:center">Puheo — Adaptiivinen tekoälyharjoittelu ylioppilaskirjoituksiin</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
        text: `Hei,\n\nSaimme ilmoittautumisesi waitlistille (${langLabel} kurssi). Ilmoitamme heti kun kurssi avautuu.\n\n— Puheo`,
      });
    } catch (emailErr) {
      console.warn("Waitlist confirm email failed (non-fatal):", emailErr.message);
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Waitlist error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

router.get("/waitlist/count", async (req, res) => {
  try {
    const lang = req.query.language;
    if (!LANGS.includes(lang)) {
      return res.status(400).json({ error: "Tuntematon kieli" });
    }
    const { count, error } = await adminClient
      .from("waitlist")
      .select("*", { count: "exact", head: true })
      .like("product", `${lang}_%`);
    if (error) {
      console.error("Waitlist count failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }
    return res.json({ language: lang, count: count || 0 });
  } catch (err) {
    console.error("Waitlist count error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// ─── L-V293-ONBOARDING-DIAGNOSTIC-1a ────────────────────────────────────────
// Diagnostic-first onboarding flow. Endpoints:
//   GET    /api/onboarding/diagnostic/state?language=es
//   POST   /api/onboarding/diagnostic/answer   (per-question UPSERT, pause-resume)
//   POST   /api/onboarding/diagnostic/courses  (multi-select kurssit + grades)
//   POST   /api/onboarding/diagnostic/biography
//   POST   /api/onboarding/diagnostic/complete (final write, sets mini_yo_status)
// All require auth; admin client writes; RLS enforces if anon-key ever used.

function isValidLang(v) { return typeof v === "string" && LANGS.includes(v); }
function isValidPart(v) { return typeof v === "string" && DIAGNOSTIC_PARTS.includes(v); }
function isValidGrade(v) { return Number.isInteger(v) && v >= 4 && v <= 10; }
function clampInt(v, min, max) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

async function ensureDiagnosticRow(userId, language) {
  // Server-internal helper (called outside a single user's RLS scope by some
  // paths) — stays on the admin client. Row carries user_id so it's still scoped.
  const { data, error } = await adminClient
    .from("user_onboarding_diagnostic")
    .upsert({ user_id: userId, language }, { onConflict: "user_id,language", ignoreDuplicates: false })
    .select()
    .single();
  if (error) {
    console.error("ensureDiagnosticRow failed:", error.message);
    return null;
  }
  return data;
}

// Returns saved progress so the client can resume mid-test.
router.get("/diagnostic/state", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  try {
    const language = req.query.language;
    if (!isValidLang(language)) {
      return res.status(400).json({ error: "Tuntematon kieli" });
    }
    const userId = req.user.userId;

    const [{ data: diag }, { data: progress }] = await Promise.all([
      supabase
        .from("user_onboarding_diagnostic")
        .select("*")
        .eq("user_id", userId)
        .eq("language", language)
        .maybeSingle(),
      supabase
        .from("mini_yo_progress")
        .select("part, question_index, question_id, user_answer, is_correct, answered_at")
        .eq("user_id", userId)
        .eq("language", language)
        .order("question_index", { ascending: true }),
    ]);

    return res.json({
      diagnostic: diag || null,
      progress: progress || [],
    });
  } catch (err) {
    console.error("diagnostic state error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

// Per-question UPSERT. Latest answer per (user, lang, part, question_index) wins.
router.post("/diagnostic/answer", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  try {
    const { language, part, question_index, question_id, user_answer, is_correct } = req.body || {};
    if (!isValidLang(language)) return res.status(400).json({ error: "Tuntematon kieli" });
    if (!isValidPart(part)) return res.status(400).json({ error: "Tuntematon osio" });
    const qi = clampInt(question_index, 0, 100);
    if (qi === null) return res.status(400).json({ error: "Virheellinen kysymyksen indeksi" });
    if (typeof question_id !== "string" || question_id.length === 0 || question_id.length > 64) {
      return res.status(400).json({ error: "Virheellinen kysymys-id" });
    }

    const userId = req.user.userId;
    await ensureDiagnosticRow(userId, language);

    const row = {
      user_id: userId,
      language,
      part,
      question_index: qi,
      question_id,
      user_answer: user_answer ?? null,
      is_correct: typeof is_correct === "boolean" ? is_correct : null,
      answered_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("mini_yo_progress")
      .upsert(row, { onConflict: "user_id,language,part,question_index" });

    if (error) {
      console.error("diagnostic answer write failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("diagnostic answer error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

router.post("/diagnostic/courses", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  try {
    const { language, courses_completed, course_grades } = req.body || {};
    if (!isValidLang(language)) return res.status(400).json({ error: "Tuntematon kieli" });

    const courses = Array.isArray(courses_completed)
      ? [...new Set(courses_completed.filter(n => KURSSI_NUMBERS.includes(n)))]
      : [];

    const grades = {};
    if (course_grades && typeof course_grades === "object") {
      for (const k of courses) {
        const g = course_grades[String(k)] ?? course_grades[k];
        if (g === "skipped" || g === null) grades[k] = null;
        else if (isValidGrade(g)) grades[k] = g;
      }
    }

    const userId = req.user.userId;
    await ensureDiagnosticRow(userId, language);

    const { error } = await supabase
      .from("user_onboarding_diagnostic")
      .update({ courses_completed: courses, course_grades: grades })
      .eq("user_id", userId)
      .eq("language", language);

    if (error) {
      console.error("diagnostic courses write failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("diagnostic courses error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

router.post("/diagnostic/biography", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  try {
    const { language, home_usage, lived_abroad, frequency } = req.body || {};
    if (!isValidLang(language)) return res.status(400).json({ error: "Tuntematon kieli" });

    const biography = {
      home_usage: BIO_HOME.includes(home_usage) ? home_usage : null,
      lived_abroad: BIO_LIVED.includes(lived_abroad) ? lived_abroad : null,
      frequency: BIO_FREQ.includes(frequency) ? frequency : null,
    };

    const userId = req.user.userId;
    await ensureDiagnosticRow(userId, language);

    const { error } = await supabase
      .from("user_onboarding_diagnostic")
      .update({ biography })
      .eq("user_id", userId)
      .eq("language", language);

    if (error) {
      console.error("diagnostic biography write failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("diagnostic biography error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

router.post("/diagnostic/complete", requireAuth, async (req, res) => {
  // L-V392 P1-3: user-owned data via per-request RLS client (see progress.js).
  const supabase = req.supabase || adminClient;
  try {
    const { language, mini_yo_status, textbook_key } = req.body || {};
    if (!isValidLang(language)) return res.status(400).json({ error: "Tuntematon kieli" });
    if (!MINI_YO_STATUSES.includes(mini_yo_status)) {
      return res.status(400).json({ error: "Virheellinen status" });
    }

    const userId = req.user.userId;
    await ensureDiagnosticRow(userId, language);

    const update = {
      mini_yo_status,
      completed_at: new Date().toISOString(),
    };
    if (typeof textbook_key === "string" && textbook_key.length > 0 && textbook_key.length <= 32) {
      update.textbook_key = textbook_key;
    }

    const { error } = await supabase
      .from("user_onboarding_diagnostic")
      .update(update)
      .eq("user_id", userId)
      .eq("language", language);

    if (error) {
      console.error("diagnostic complete write failed:", error.message);
      return res.status(500).json({ error: "Tallennus epäonnistui" });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error("diagnostic complete error:", err.message);
    return res.status(500).json({ error: "Palvelinvirhe" });
  }
});

export default router;
