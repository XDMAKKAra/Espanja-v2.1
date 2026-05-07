// L-ONBOARDING-REDESIGN-1 — onboarding flow endpoints.
// POST /api/onboarding/complete — upserts onboarding fields onto user_profile
//                                  (PK user_id) + sets onboarding_completed.
// POST /api/onboarding/waitlist  — appends a row to public.waitlist with
//                                  product = "{lang}_{level}" for de/fr courses.
// GET  /api/onboarding/waitlist/count?language=<es|de|fr> — real-data counter.

import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { computeStudyPlan } from "../lib/studyPlan.js";
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
const GRADES = ["I", "A", "B", "C", "M", "E", "L"];
const FOCUS_AREAS = ["vocab", "grammar", "writing", "reading", "exam"];

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
    const { error } = await supabase.from("waitlist").insert(row);
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
    const { count, error } = await supabase
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

export default router;
