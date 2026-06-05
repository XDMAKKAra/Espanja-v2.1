// L-V392 backbone persistence verification (run against a real server + Supabase).
// Proves the brief's SELKÄRANKA claim: a brand-new user's writes survive a fresh
// re-login. Registers a throwaway user, runs the core write chain over the API,
// logs in AGAIN (new token), then reads back via the dashboard to prove the data
// is still there and correctly language-scoped.
//
// Per-table DB verification (row counts for the created user_id) is done OUTSIDE
// this script via the Supabase MCP, using the userId this script prints.
//
// Run: node -r dotenv/config tests/verify-backbone.mjs
//   (set VERIFY_BASE=http://127.0.0.1:3000 on Windows to dodge ::1/IPv4 fetch)
const BASE = process.env.VERIFY_BASE || "http://localhost:3000";

let failures = 0;
function check(name, cond, detail = "") {
  const ok = !!cond;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

const jsonHeaders = { "Content-Type": "application/json" };
const authHeaders = (t) => ({ Authorization: `Bearer ${t}`, ...jsonHeaders });

async function post(path, token, body) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? authHeaders(token) : jsonHeaders,
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-json */ }
  return { status: r.status, ok: r.ok, json, text };
}

async function get(path, token) {
  const r = await fetch(`${BASE}${path}`, { headers: authHeaders(token) });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-json */ }
  return { status: r.status, ok: r.ok, json, text };
}

// Decode the `sub` (user id) claim from a JWT without verifying it — we only
// need the id to run the out-of-band per-table SQL check.
function userIdFromJwt(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    return payload.sub || null;
  } catch { return null; }
}

const run = async () => {
  const stamp = Date.now();
  const email = `puheo-backbone-${stamp}@example.com`; // example.com is reserved → no real inbox spammed
  const password = "Backbone1";
  console.log(`BASE=${BASE}  email=${email}\n`);

  // ── 1. Register (creates an auto-confirmed auth user) ─────────────────────
  const reg = await post("/api/auth/register", null, { email, password, name: "Backbone Testi" });
  check("register returns a token", reg.ok && reg.json?.token, `status=${reg.status}`);
  if (!reg.json?.token) { console.log("\nABORT: cannot continue without a token"); process.exit(2); }
  const token1 = reg.json.token;
  const userId = userIdFromJwt(token1);
  check("token carries a user id", !!userId, `userId=${userId}`);

  // ── 2. Write chain (confirmed payloads only) ──────────────────────────────
  const prog = await post("/api/progress", token1, {
    mode: "vocab", level: "B", scoreCorrect: 7, scoreTotal: 10, language: "spanish",
  });
  check("POST /progress (exercise_logs) accepted", prog.ok, `status=${prog.status}`);

  const mistake = await post("/api/mistake", token1, {
    topics: ["ser_estar"], exerciseType: "vocab", level: "B",
    question: "Yo ___ profesor", wrongAnswer: "estoy", correctAnswer: "soy",
    explanation: "Pysyvä ominaisuus → ser", language: "spanish",
  });
  check("POST /mistake (user_mistakes) accepted", mistake.ok, `status=${mistake.status}`);

  const sr = await post("/api/sr/review", token1, {
    word: "hola", question: "Mitä 'hei' on espanjaksi?", language: "spanish", grade: 4,
  });
  check("POST /sr/review (sr_cards) accepted", sr.ok, `status=${sr.status}`);

  const diagAns = await post("/api/onboarding/diagnostic/answer", token1, {
    language: "es", part: "a_grammar", question_index: 0,
    question_id: "bb_q1", user_answer: "a", is_correct: true,
  });
  check("POST /onboarding/diagnostic/answer (mini_yo_progress + user_onboarding_diagnostic) accepted",
    diagAns.ok, `status=${diagAns.status}`);

  const diagDone = await post("/api/onboarding/diagnostic/complete", token1, {
    language: "es", mini_yo_status: "completed", textbook_key: "bb_book",
  });
  check("POST /onboarding/diagnostic/complete accepted", diagDone.ok, `status=${diagDone.status}`);

  const profile = await post("/api/profile", token1, {
    current_grade: "B", target_grade: "M", weak_areas: ["ser_estar"], onboarding_completed: true,
  });
  check("POST /profile (user_profile) accepted", profile.ok, `status=${profile.status}`);

  // ── 3. RELOGIN — fresh token, brand new session ───────────────────────────
  const login = await post("/api/auth/login", null, { email, password });
  check("relogin succeeds", login.ok && login.json?.token, `status=${login.status}`);
  const token2 = login.json?.token;
  if (!token2) { console.log("\nABORT: relogin failed"); process.exit(2); }

  // ── 4. Read back with the NEW token — data must still be there ─────────────
  const dashEs = await get("/api/dashboard?language=spanish", token2);
  check("dashboard (spanish) loads after relogin", dashEs.ok, `status=${dashEs.status}`);
  check("exercise_logs session persisted across relogin", (dashEs.json?.totalSessions ?? 0) >= 1,
    `totalSessions=${dashEs.json?.totalSessions}`);

  const dashFr = await get("/api/dashboard?language=french", token2);
  check("french dashboard empty (no cross-language bleed from spanish writes)",
    (dashFr.json?.totalSessions ?? null) === 0, `fr=${dashFr.json?.totalSessions}`);

  const weak = await get("/api/weak-topics?days=7", token2);
  check("weak-topics reflects the logged mistake after relogin",
    weak.ok && (weak.json?.totalMistakes ?? 0) >= 1, `totalMistakes=${weak.json?.totalMistakes}`);

  const due = await get("/api/sr/count?language=spanish", token2);
  check("sr_cards persisted (count endpoint responds)", due.ok, `status=${due.status}`);

  const prof = await get("/api/profile", token2);
  check("user_profile persisted (current_grade=B) after relogin",
    prof.json?.profile?.current_grade === "B", `current_grade=${prof.json?.profile?.current_grade}`);

  console.log(`\nCREATED_USER_ID=${userId}`);
  console.log(`CREATED_EMAIL=${email}`);
  console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
  process.exit(failures === 0 ? 0 : 1);
};
run().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
