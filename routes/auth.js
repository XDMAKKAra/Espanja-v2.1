import { Router } from "express";
import crypto from "crypto";
import supabase from "../supabase.js";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendEmailVerification,
} from "../email.js";
import { authLimiter, registerLimiter, forgotPasswordLimiter } from "../middleware/rateLimit.js";

const router = Router();

function validatePassword(pw) {
  if (!pw || pw.length < 8) return "Salasanan tulee olla vähintään 8 merkkiä";
  if (!/[A-Z]/.test(pw)) return "Salasanassa tulee olla vähintään yksi iso kirjain";
  if (!/[a-z]/.test(pw)) return "Salasanassa tulee olla vähintään yksi pieni kirjain";
  if (!/[0-9]/.test(pw)) return "Salasanassa tulee olla vähintään yksi numero";
  return null;
}

router.post("/register", registerLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Sähköposti ja salasana vaaditaan" });
  }
  const pwError = validatePassword(password);
  if (pwError) return res.status(400).json({ error: pwError });
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password,
    email_confirm: true,
  });
  if (createErr) {
    if (createErr.message.toLowerCase().includes("already")) {
      return res.status(400).json({ error: "Sähköposti on jo käytössä" });
    }
    return res.status(500).json({ error: "Rekisteröinti epäonnistui" });
  }
  const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (signInErr) return res.status(500).json({ error: "Kirjautuminen epäonnistui rekisteröinnin jälkeen" });

  const userEmail = created.user.email;

  sendWelcomeEmail(userEmail).catch((err) =>
    console.error("Welcome email failed:", err)
  );

  // Send verification email
  const verifyToken = crypto.randomBytes(32).toString("hex");
  await supabase.from("email_verifications").upsert(
    { email: userEmail, token: verifyToken, expires_at: new Date(Date.now() + 86400000).toISOString() },
    { onConflict: "email" }
  );
  sendEmailVerification(userEmail, verifyToken).catch((err) =>
    console.error("Verification email failed:", err)
  );

  res.json({
    token: session.session.access_token,
    refreshToken: session.session.refresh_token,
    email: userEmail,
    emailVerified: false,
  });
});

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Täytä kaikki kentät" });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (error) return res.status(401).json({ error: "Väärä sähköposti tai salasana" });
  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    email: data.user.email,
  });
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token puuttuu" });
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session) return res.status(401).json({ error: "Istunto vanhentunut" });
  res.json({
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    email: data.user.email,
  });
});

router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Sähköposti vaaditaan" });

  const normalizedEmail = email.toLowerCase().trim();
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find((u) => u.email === normalizedEmail);

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();

    await supabase.from("password_resets").upsert(
      { email: normalizedEmail, token, expires_at: expiresAt },
      { onConflict: "email" }
    );

    sendPasswordResetEmail(normalizedEmail, token).catch((err) =>
      console.error("Reset email failed:", err)
    );
  }

  res.json({ ok: true });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token ja uusi salasana vaaditaan" });
  }
  const resetPwError = validatePassword(newPassword);
  if (resetPwError) return res.status(400).json({ error: resetPwError });

  const { data: resetRow, error: lookupErr } = await supabase
    .from("password_resets")
    .select("*")
    .eq("token", token)
    .single();

  if (lookupErr || !resetRow) {
    return res.status(400).json({ error: "Virheellinen tai vanhentunut linkki" });
  }

  if (new Date(resetRow.expires_at) < new Date()) {
    await supabase.from("password_resets").delete().eq("token", token);
    return res.status(400).json({ error: "Linkki on vanhentunut. Pyydä uusi." });
  }

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find((u) => u.email === resetRow.email);
  if (!user) return res.status(400).json({ error: "Käyttäjää ei löydy" });

  const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateErr) return res.status(500).json({ error: "Salasanan vaihto epäonnistui" });

  await supabase.from("password_resets").delete().eq("token", token);

  sendPasswordChangedEmail(resetRow.email).catch((err) =>
    console.error("Password changed email failed:", err)
  );

  res.json({ ok: true });
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token puuttuu" });

  const { data: row, error: lookupErr } = await supabase
    .from("email_verifications")
    .select("*")
    .eq("token", token)
    .single();

  if (lookupErr || !row) {
    return res.status(400).json({ error: "Virheellinen tai vanhentunut linkki" });
  }

  if (new Date(row.expires_at) < new Date()) {
    await supabase.from("email_verifications").delete().eq("token", token);
    return res.status(400).json({ error: "Linkki on vanhentunut" });
  }

  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find((u) => u.email === row.email);
  if (!user) return res.status(400).json({ error: "Käyttäjää ei löydy" });

  await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  });

  await supabase.from("email_verifications").delete().eq("token", token);

  res.json({ ok: true });
});

export default router;
