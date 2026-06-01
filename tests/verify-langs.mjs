// L-V339 "fr/de live" — verify all three languages: content gate open, lesson
// content served, dashboard scoped per language, progress writes labeled and
// non-bleeding. Run: node -r dotenv/config tests/verify-langs.mjs
const BASE = process.env.VERIFY_BASE || "http://localhost:3000";
let fails = 0;
const check = (name, cond, detail = "") => { if (!cond) fails++; console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`); };

async function login(email, password) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) throw new Error(`login -> ${r.status}`);
  return (await r.json()).token;
}
const bearer = (t) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" });
const sessions = async (tok, lang) => (await (await fetch(`${BASE}/api/dashboard?lang=${lang}`, { headers: bearer(tok) })).json()).totalSessions;

const run = async () => {
  const tok = await login(process.env.TEST_PRO_EMAILS.split(",")[0].trim(), process.env.TEST_PRO_PASSWORD);

  // ── 1) Content gate open: every language serves a real lesson ─────────────
  for (const lang of ["es", "fr", "de"]) {
    const r = await fetch(`${BASE}/api/curriculum/kurssi_1/lesson/1?lang=${lang}`, { headers: bearer(tok) });
    const p = (await r.json().catch(() => ({}))).pregenerated;
    const served = r.ok && p && p.available !== false && (p.phases || []).length > 0;
    check(`gate open: ${lang} kurssi_1 lesson_1 serves content`, served, `status=${r.status} phases=${p ? (p.phases || []).length : "null"} title=${p?.meta?.title || "?"}`);
  }

  // ── 2) Dashboard scoped per language (?lang=) + no cross-language bleed ────
  const es0 = await sessions(tok, "es");
  const fr0 = await sessions(tok, "fr");
  const de0 = await sessions(tok, "de");
  check("es dashboard has sessions", es0 > 0, `es=${es0}`);
  check("fr dashboard empty (no bleed)", fr0 === 0, `fr=${fr0}`);
  check("de dashboard empty (no bleed)", de0 === 0, `de=${de0}`);

  // ── 3) Write via ?lang=fr (as injectLangParam does, no body language) ─────
  const w = await fetch(`${BASE}/api/progress?lang=fr`, { method: "POST", headers: bearer(tok), body: JSON.stringify({ mode: "vocab", level: "A", scoreCorrect: 7, scoreTotal: 10 }) });
  check("POST /progress?lang=fr accepted", w.ok, `status=${w.status}`);
  const fr1 = await sessions(tok, "fr");
  const es1 = await sessions(tok, "es");
  const de1 = await sessions(tok, "de");
  check("fr write lands in fr dashboard", fr1 === fr0 + 1, `fr ${fr0}->${fr1}`);
  check("fr write did NOT bleed to es", es1 === es0, `es ${es0}->${es1}`);
  check("fr write did NOT bleed to de", de1 === de0, `de ${de0}->${de1}`);

  console.log(`\n${fails === 0 ? "ALL PASS" : fails + " FAILURE(S)"}`);
  process.exit(fails === 0 ? 0 : 1);
};
run().catch(e => { console.error("ERROR:", e.message); process.exit(2); });
