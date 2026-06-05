// L-V392 P1-3 — proves RLS is a REAL net, not just the app-level .eq("user_id")
// filters. Builds a publishable-key client carrying a real user's JWT (exactly
// what createUserClient/req.supabase produces in production), then queries
// user-owned tables WITH NO user_id filter. RLS must still scope every row to
// the JWT's user. Contrasted with the service-role client, which sees everyone.
//
// Run: node -r dotenv/config tests/verify-rls-net.mjs
//   (VERIFY_BASE=http://127.0.0.1:3000 on Windows to dodge ::1)
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.VERIFY_BASE || "http://localhost:3000";
const URL = process.env.SUPABASE_URL;
const PUB = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const SROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

let failures = 0;
const check = (name, cond, detail = "") => {
  if (!cond) failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};
const uidFromJwt = (jwt) => JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8")).sub;

const run = async () => {
  const e = process.env.TEST_PRO_EMAILS?.split(",")[0].trim();
  const p = process.env.TEST_PRO_PASSWORD;
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: e, password: p }),
  });
  if (!r.ok) throw new Error(`login failed: ${r.status}`);
  const jwt = (await r.json()).token;
  const uid = uidFromJwt(jwt);
  console.log(`user=${uid.slice(0, 8)}  BASE=${BASE}\n`);

  // RLS client: publishable key + the user's JWT (== req.supabase in prod).
  const rls = createClient(URL, PUB, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  // Service-role client: bypasses RLS, sees everyone (the contrast).
  const admin = createClient(URL, SROLE, { auth: { autoRefreshToken: false, persistSession: false } });

  for (const table of ["exercise_logs", "user_mistakes", "sr_cards"]) {
    // NO .eq("user_id") on purpose — RLS is the only thing scoping this.
    const { data: rlsRows, error: rlsErr } = await rls.from(table).select("user_id").limit(1000);
    check(`${table}: RLS query succeeds without app filter`, !rlsErr, rlsErr?.message || "");
    const foreign = (rlsRows || []).filter((row) => row.user_id !== uid);
    check(`${table}: RLS returns ONLY caller's rows (no app filter)`, foreign.length === 0,
      `rows=${rlsRows?.length} foreign=${foreign.length}`);

    // Contrast: admin sees other users' rows in the same table (proves RLS is doing the work).
    const { data: adminRows } = await admin.from(table).select("user_id").limit(1000);
    const adminForeign = (adminRows || []).filter((row) => row.user_id && row.user_id !== uid).length;
    console.log(`      (contrast) admin sees ${adminRows?.length ?? 0} rows, ${adminForeign} from other users`);
  }

  console.log(`\n${failures === 0 ? "ALL PASS — RLS is a real net" : failures + " FAILURE(S)"}`);
  process.exit(failures === 0 ? 0 : 1);
};
run().catch((err) => { console.error("ERROR:", err.message); process.exit(2); });
