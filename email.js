import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "Kielio <noreply@kielio.fi>";
const APP_URL = process.env.APP_URL || "https://kielio.fi";

// ─── Shared email layout ─────────────────────────────────────────────────────

function layout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fi">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#0e0e12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e12;padding:40px 20px">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a24;border-radius:16px;overflow:hidden">

<!-- Header -->
<tr><td style="padding:32px 40px 0">
  <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:#fff">
    Kiel<span style="color:#6d5ef4">io</span>
  </div>
</td></tr>

<!-- Body -->
<tr><td style="padding:24px 40px 40px">
  <h1 style="color:#fff;font-size:22px;margin:0 0 16px;font-weight:600">${title}</h1>
  <div style="color:#a0a0b8;font-size:15px;line-height:1.6">
    ${bodyHtml}
  </div>
</td></tr>

<!-- Footer -->
<tr><td style="padding:20px 40px;border-top:1px solid #2a2a3a">
  <p style="color:#555;font-size:12px;margin:0;text-align:center">
    Kielio — Adaptiivinen tekoälyharjoittelu ylioppilaskirjoituksiin<br/>
    <a href="${APP_URL}" style="color:#6d5ef4;text-decoration:none">${APP_URL.replace("https://", "")}</a>
  </p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;
}

function btn(text, url) {
  return `<div style="text-align:center;margin:28px 0">
    <a href="${url}" style="display:inline-block;background:#6d5ef4;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px">${text}</a>
  </div>`;
}

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email, name) {
  const displayName = name || email.split("@")[0];
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Tervetuloa Kielioon! 🎓",
    html: layout("Tervetuloa, " + displayName + "!", `
      <p>Tilisi on luotu onnistuneesti. Olet valmis aloittamaan harjoittelun ylioppilaskirjoituksia varten.</p>
      <p>Kielio tarjoaa sinulle:</p>
      <ul style="color:#c0c0d8;padding-left:20px">
        <li><strong style="color:#fff">Adaptiivinen sanastoharjoittelu</strong> — taso mukautuu osaamiseesi</li>
        <li><strong style="color:#fff">Kielioppidrilli</strong> — ser/estar, subjunktiivi, konditionaali...</li>
        <li><strong style="color:#fff">Luetun ymmärtäminen</strong> — oikeita yo-koe-tyyppisiä tekstejä</li>
        <li><strong style="color:#fff">Kirjoittaminen + AI-palaute</strong> — YTL-kriteerien mukainen arviointi</li>
      </ul>
      ${btn("Aloita harjoittelu →", APP_URL + "/app.html")}
      <p style="color:#666;font-size:13px">Jos et luonut tiliä Kielioon, voit jättää tämän viestin huomiotta.</p>
    `),
  });
}

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${APP_URL}/app.html?reset_token=${resetToken}`;
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Salasanan palautus — Kielio",
    html: layout("Salasanan palautus", `
      <p>Sait tämän viestin, koska pyysit salasanan palautusta.</p>
      <p>Klikkaa alla olevaa painiketta asettaaksesi uuden salasanan. Linkki on voimassa <strong style="color:#fff">1 tunnin</strong>.</p>
      ${btn("Aseta uusi salasana →", resetUrl)}
      <p style="color:#666;font-size:13px">Jos et pyytänyt salasanan vaihtoa, voit jättää tämän viestin huomiotta. Tilisi on turvassa.</p>
      <p style="color:#555;font-size:12px;word-break:break-all">Tai kopioi linkki: ${resetUrl}</p>
    `),
  });
}

export async function sendPasswordChangedEmail(email) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Salasanasi on vaihdettu — Kielio",
    html: layout("Salasana vaihdettu", `
      <p>Salasanasi on vaihdettu onnistuneesti.</p>
      <p>Jos et tehnyt tätä muutosta, ota meihin heti yhteyttä vastaamalla tähän viestiin.</p>
      ${btn("Kirjaudu sisään →", APP_URL + "/app.html")}
    `),
  });
}

export async function sendEmailVerification(email, verifyToken) {
  const verifyUrl = `${APP_URL}/app.html?verify_token=${verifyToken}`;
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Vahvista sähköpostisi — Kielio",
    html: layout("Vahvista sähköpostiosoitteesi", `
      <p>Kiitos rekisteröitymisestä Kielioon! Vahvista sähköpostiosoitteesi klikkaamalla alla olevaa painiketta.</p>
      ${btn("Vahvista sähköposti →", verifyUrl)}
      <p style="color:#666;font-size:13px">Linkki on voimassa 24 tuntia.</p>
      <p style="color:#555;font-size:12px;word-break:break-all">Tai kopioi linkki: ${verifyUrl}</p>
    `),
  });
}

export async function sendWeeklyProgressEmail(email, stats) {
  const { name, weekSessions, streak, estLevel, prevWeekSessions, bestMode, bestModePct } = stats;
  const displayName = name || email.split("@")[0];

  const trend = weekSessions > prevWeekSessions ? "📈" : weekSessions < prevWeekSessions ? "📉" : "➡️";
  const trendText = weekSessions > prevWeekSessions
    ? `+${weekSessions - prevWeekSessions} enemmän kuin viime viikolla`
    : weekSessions < prevWeekSessions
    ? `${prevWeekSessions - weekSessions} vähemmän kuin viime viikolla`
    : "Sama kuin viime viikolla";

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `Viikkoraporttisi — ${weekSessions} harjoitusta ${trend}`,
    html: layout("Viikkoraportti", `
      <p>Hei ${displayName}! Tässä viikon yhteenveto:</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
        <tr>
          <td style="background:#1e1e2e;border-radius:10px;padding:16px;text-align:center;width:33%">
            <div style="color:#6d5ef4;font-size:28px;font-weight:700">${weekSessions}</div>
            <div style="color:#888;font-size:12px;margin-top:4px">harjoitusta</div>
          </td>
          <td width="12"></td>
          <td style="background:#1e1e2e;border-radius:10px;padding:16px;text-align:center;width:33%">
            <div style="color:#6d5ef4;font-size:28px;font-weight:700">${streak}</div>
            <div style="color:#888;font-size:12px;margin-top:4px">päivän putki</div>
          </td>
          <td width="12"></td>
          <td style="background:#1e1e2e;border-radius:10px;padding:16px;text-align:center;width:33%">
            <div style="color:#6d5ef4;font-size:28px;font-weight:700">${estLevel || "—"}</div>
            <div style="color:#888;font-size:12px;margin-top:4px">arvioitu taso</div>
          </td>
        </tr>
      </table>

      <p>${trend} ${trendText}</p>
      ${bestMode ? `<p>Paras alueesi: <strong style="color:#fff">${bestMode}</strong> (${bestModePct}% oikein)</p>` : ""}
      ${btn("Jatka harjoittelua →", APP_URL + "/app.html")}
    `),
  });
}

export async function sendStreakReminderEmail(email, stats) {
  const { name, streak, lastPracticeDate } = stats;
  const displayName = name || email.split("@")[0];

  return resend.emails.send({
    from: FROM,
    to: email,
    subject: `${streak} päivän putkesi on vaarassa! 🔥`,
    html: layout("Putkesi on vaarassa!", `
      <p>Hei ${displayName}!</p>
      <div style="text-align:center;margin:24px 0">
        <div style="font-size:48px">🔥</div>
        <div style="color:#fff;font-size:32px;font-weight:700;margin-top:8px">${streak} päivää</div>
        <div style="color:#888;font-size:14px">Älä anna putken katketa!</div>
      </div>
      <p>Et ole vielä harjoitellut tänään. Yksi nopea harjoitus riittää pitämään putken yllä!</p>
      ${btn("Harjoittele nyt →", APP_URL + "/app.html")}
      <p style="color:#555;font-size:12px">Voit poistaa muistutukset tiliasetuksistasi.</p>
    `),
  });
}
