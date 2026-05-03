import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

// Lazy Resend client — instantiated on first send() call so the module can
// be imported in test/CI environments that don't have RESEND_API_KEY set.
// Importing this file no longer crashes when the env var is missing.
let _resend = null;
const resend = {
  get emails() {
    if (!_resend) {
      const key = process.env.RESEND_API_KEY;
      if (!key) {
        throw new Error("RESEND_API_KEY is not set — cannot send email.");
      }
      _resend = new Resend(key);
    }
    return _resend.emails;
  },
};

const FROM = process.env.EMAIL_FROM || "Puheo <noreply@puheo.fi>";
const APP_URL = process.env.APP_URL || "https://puheo.fi";

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
    Puhe<span style="color:#6d5ef4">o</span>
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
    Puheo — Adaptiivinen tekoälyharjoittelu ylioppilaskirjoituksiin<br/>
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
    subject: "Tervetuloa Puheoon! 🎓",
    html: layout("Tervetuloa, " + displayName + "!", `
      <p>Tilisi on luotu onnistuneesti. Olet valmis aloittamaan harjoittelun ylioppilaskirjoituksia varten.</p>
      <p>Puheo tarjoaa sinulle:</p>
      <ul style="color:#c0c0d8;padding-left:20px">
        <li><strong style="color:#fff">Adaptiivinen sanastoharjoittelu</strong> — taso mukautuu osaamiseesi</li>
        <li><strong style="color:#fff">Puheoppidrilli</strong> — ser/estar, subjunktiivi, konditionaali...</li>
        <li><strong style="color:#fff">Luetun ymmärtäminen</strong> — oikeita yo-koe-tyyppisiä tekstejä</li>
        <li><strong style="color:#fff">Kirjoittaminen + AI-palaute</strong> — YTL-kriteerien mukainen arviointi</li>
      </ul>
      ${btn("Aloita harjoittelu →", APP_URL + "/app.html")}
      <p style="color:#666;font-size:13px">Jos et luonut tiliä Puheoon, voit jättää tämän viestin huomiotta.</p>
    `),
  });
}

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${APP_URL}/app.html?reset_token=${resetToken}`;
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Salasanan palautus — Puheo",
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
    subject: "Salasanasi on vaihdettu — Puheo",
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
    subject: "Vahvista sähköpostisi — Puheo",
    html: layout("Vahvista sähköpostiosoitteesi", `
      <p>Kiitos rekisteröitymisestä Puheoon! Vahvista sähköpostiosoitteesi klikkaamalla alla olevaa painiketta.</p>
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

// ─── Pass 4 lifecycle drip ───────────────────────────────────────────────────

// D1 — personalised weakness. Either uses an exercise_logs row (the user's
// actual most-recent wrong answer) or a pre-curated seed-bank fallback.
export async function sendD1WeaknessEmail(email, data) {
  const { weaknessShort, weaknessSentence, example } = data;
  // example: { prompt, options: [A,B,C,D], correctLetter, correctText, explain }
  const opts = (example?.options || []).map(o => `<div style="color:#c0c0d8;margin:2px 0">${o}</div>`).join("");
  const answerBlock = example
    ? `
      <div style="background:#1e1e2e;border-radius:10px;padding:16px;margin:16px 0">
        <div style="color:#888;font-size:12px;margin-bottom:8px">Esimerkki:</div>
        <div style="color:#fff;font-size:16px;margin-bottom:10px">${example.prompt}</div>
        ${opts}
        <div style="color:#6d5ef4;margin-top:12px">Oikea vastaus: <strong>${example.correctLetter} — ${example.correctText}</strong>.${example.explain ? ` <span style="color:#a0a0b8">${example.explain}</span>` : ""}</div>
      </div>`
    : "";
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Yksi asia, jonka voit korjata tällä viikolla.",
    html: layout("Heikoin kohtasi tasotestissä", `
      <p>Tasotestisi paljasti: <strong style="color:#fff">${weaknessSentence}</strong></p>
      ${answerBlock}
      <p>Puheossa odottaa kolmen harjoituksen sarja, joka iskee tähän suoraan (~8 min).</p>
      ${btn("Avaa harjoitukset →", APP_URL + "/app.html?ref=email-d1")}
      <p style="color:#555;font-size:12px">Voit peruuttaa nämä viestit tiliasetuksistasi.</p>
    `),
  });
}

// D7 — split by is_pro. One endpoint, two templates.
export async function sendD7OfferEmail(email, data) {
  const { exercisesCompleted = 0, correctPct = 0, topicsTouched = 0, seasonalBlock = "", isPro = false, level = "" } = data;
  if (isPro) {
    return resend.emails.send({
      from: FROM,
      to: email,
      subject: "Viikko mennyt. Näin jatketaan.",
      html: layout("Viikkosuunnitelma", `
        <p>Kiitos Pro-tilauksesta. Viikko mennyt.</p>
        <p>Ehdotuksemme seuraavalle viikolle:</p>
        <ul style="color:#c0c0d8;padding-left:20px">
          <li>3× kirjoitusharjoitus (YTL-aiheita)</li>
          <li>2× lukuteksti tasoltasi ${level || "C"}</li>
          <li>Päivittäinen sanastokertaus</li>
        </ul>
        ${btn("Avaa viikkosuunnitelma →", APP_URL + "/app.html?ref=email-d7-pro")}
      `),
    });
  }
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Ensimmäinen viikko takana — Pro vie maaliin.",
    html: layout("Viikko takana", `
      <p>Hienoa aloitusta. Koonti viikostasi:</p>
      <ul style="color:#c0c0d8;padding-left:20px">
        <li><strong style="color:#fff">${exercisesCompleted}</strong> harjoitusta</li>
        <li><strong style="color:#fff">${correctPct}%</strong> oikein</li>
        <li><strong style="color:#fff">${topicsTouched}</strong> aihetta käsitelty</li>
      </ul>
      <p>Seuraavaksi YO-kokeen tärkein osa: <strong style="color:#fff">kirjoitus</strong>. Se on Pro-ominaisuus — AI-palaute YTL-rubriikin mukaan ei ole halpaa tuottaa.</p>
      ${seasonalBlock ? `<p>${seasonalBlock}</p>` : ""}
      ${btn("Tutustu Pro-tilaukseen →", APP_URL + "/app.html?upsell=d7&ref=email-d7")}
      <p style="color:#666;font-size:13px">Ei kiinnosta? Kaikki sanastotyökalut säilyvät Free-tilillä rajattomasti.</p>
    `),
  });
}

// Exam countdown — one endpoint handles both -30 and -7, branched on daysOut.
export async function sendExamCountdownEmail(email, data) {
  const { daysOut, examDate = "28.9.2026" } = data;
  if (daysOut <= 7) {
    return resend.emails.send({
      from: FROM,
      to: email,
      subject: "Viikko YO-kokeeseen — viimeinen suunnitelmasi.",
      html: layout(`${daysOut} päivää kokeeseen`, `
        <p>Tästä eteenpäin:</p>
        <ul style="color:#c0c0d8;padding-left:20px">
          <li><strong style="color:#fff">ÄLÄ</strong> opettele uutta. Ei yllätyksiä.</li>
          <li>Käy virhelistasi läpi (20 min/pv).</li>
          <li>Yksi simulaatio viikon alkupuolella.</li>
          <li>Lepoa. Nukkuminen parantaa kielen hakua enemmän kuin yksi drilli lisää.</li>
        </ul>
        ${btn("Avaa virhelista →", APP_URL + "/app.html?tab=errors&ref=email-t7")}
        <p style="color:#666;font-size:13px">Tsemppiä — näet koetuloksen lokakuussa.</p>
      `),
    });
  }
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: "Kuukausi YO-kokeeseen — vaihdetaan simulaatioihin.",
    html: layout(`${daysOut} päivää kokeeseen (${examDate})`, `
      <p>Paras valmistautumistapa vaihtuu:</p>
      <ul style="color:#c0c0d8;padding-left:20px">
        <li>Ennen: sekalaiset harjoitukset.</li>
        <li><strong style="color:#fff">Nyt: täyskoe-simulaatiot.</strong></li>
      </ul>
      <p>Kaksi simulaatiota viikossa riittää. Rauhallista loppusuoraa.</p>
      ${btn("Avaa simulaatio →", APP_URL + "/app.html?mode=exam-simulation&ref=email-t30")}
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
        <div style="color:#fff;font-size:32px;font-weight:700;margin-top:8px">${streak} päivää</div>
        <div style="color:#888;font-size:14px">Älä anna putken katketa!</div>
      </div>
      <p>Et ole vielä harjoitellut tänään. Yksi nopea harjoitus riittää pitämään putken yllä!</p>
      ${btn("Harjoittele nyt →", APP_URL + "/app.html")}
      <p style="color:#555;font-size:12px">Voit poistaa muistutukset tiliasetuksistasi.</p>
    `),
  });
}
