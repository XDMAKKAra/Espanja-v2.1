// L-V339 "fix kaikki" — full authenticated-surface sweep + concurrency
// isolation stress. Run: node -r dotenv/config tests/verify-sweep.mjs
const BASE = process.env.VERIFY_BASE || "http://localhost:3000";

let fails = 0;
const fail = (m) => { fails++; console.log("FAIL  " + m); };
const pass = (m) => console.log("PASS  " + m);

async function login(email, password) {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`login ${email} -> ${r.status}`);
  return (await r.json()).token;
}
const bearer = (t) => ({ Authorization: `Bearer ${t}` });
const sub = (jwt) => { try { return JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString()).sub; } catch { return "?"; } };

// Authenticated GET endpoints across every mounted router.
const ENDPOINTS = [
  "/api/dashboard", "/api/dashboard/v2?language=spanish", "/api/weak-topics?days=7",
  "/api/user-level", "/api/profile", "/api/sr/due", "/api/sr/count?language=spanish",
  "/api/sr/forecast?language=spanish&days=30", "/api/exam/history", "/api/adaptive/status?mode=vocab",
  "/api/placement/status", "/api/onboarding/diagnostic/state?language=es",
  "/api/digikirja/progress?lang=es&kurssi=kurssi_1&lesson=1", "/api/learning-path",
  "/api/adaptive-state?mode=vocab", "/api/seed-counts",
];

const run = async () => {
  const proTok = await login(process.env.TEST_PRO_EMAILS.split(",")[0].trim(), process.env.TEST_PRO_PASSWORD);
  const freeTok = await login(process.env.TEST_FREE_EMAILS.split(",")[0].trim(), process.env.TEST_FREE_PASSWORD);
  const proId = sub(proTok), freeId = sub(freeTok);
  console.log(`PRO=${proId.slice(0,8)}  FREE=${freeId.slice(0,8)}\n`);

  // ── 1) Functional sweep: no endpoint may 5xx for either user ──────────────
  console.log("── functional sweep (5xx = broken) ──");
  for (const [label, tok] of [["PRO", proTok], ["FREE", freeTok]]) {
    for (const ep of ENDPOINTS) {
      let s;
      try { s = (await fetch(BASE + ep, { headers: bearer(tok) })).status; }
      catch (e) { s = "ERR:" + e.message; }
      const broken = typeof s !== "number" || s >= 500;
      const line = `${label} ${ep} -> ${s}`;
      if (broken) fail(line); else console.log(`  ok  ${line}`);
    }
  }

  // ── 2) Concurrency isolation stress ──────────────────────────────────────
  // Fire many interleaved concurrent /dashboard requests from both users at
  // once. PRO must ALWAYS see its 16 spanish sessions, FREE always 0. Any
  // shared-state bleed (the auth-session class of bug) shows up as a wrong
  // count here. fresh=1 forces real DB queries (bypass the 30s cache).
  console.log("\n── concurrency isolation stress (40 interleaved) ──");
  const N = 20;
  const calls = [];
  for (let i = 0; i < N; i++) {
    calls.push(fetch(`${BASE}/api/dashboard?language=spanish`, { headers: bearer(proTok) }).then(async r => ({ who: "PRO", n: (await r.json()).totalSessions })));
    calls.push(fetch(`${BASE}/api/dashboard?language=spanish`, { headers: bearer(freeTok) }).then(async r => ({ who: "FREE", n: (await r.json()).totalSessions })));
  }
  const res = await Promise.all(calls);
  const proCounts = res.filter(r => r.who === "PRO").map(r => r.n);
  const freeCounts = res.filter(r => r.who === "FREE").map(r => r.n);
  const proOk = proCounts.every(n => n === proCounts[0]) && proCounts[0] > 0;
  const freeOk = freeCounts.every(n => n === 0);
  if (proOk) pass(`PRO stable under concurrency: all ${proCounts.length} = ${proCounts[0]}`);
  else fail(`PRO BLEED: counts varied ${JSON.stringify([...new Set(proCounts)])}`);
  if (freeOk) pass(`FREE stable under concurrency: all ${freeCounts.length} = 0`);
  else fail(`FREE BLEED: saw non-zero ${JSON.stringify([...new Set(freeCounts)])}`);

  console.log(`\n${fails === 0 ? "ALL PASS" : fails + " FAILURE(S)"}`);
  process.exit(fails === 0 ? 0 : 1);
};
run().catch(e => { console.error("ERROR:", e.message); process.exit(2); });
