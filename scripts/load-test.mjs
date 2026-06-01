// scripts/load-test.mjs — L-V340 local load test.
//
// Drives the LOCAL server only (production mode), never prod/preview, never
// real Supabase, and only a tiny budget-capped burst against real OpenAI.
// Safety rests on LOAD_TEST=1, which swaps every Supabase client for an
// in-memory fake (lib/load-test-stubs.js) and stubs callOpenAI — so no matter
// which endpoint we hit, the only external calls are the ~30 explicit real-AI
// burst requests in scenario F, hard-capped at €0.10.
//
// Usage:
//   node scripts/load-test.mjs               # full run (~8-12 min)
//   DURATION=20 node scripts/load-test.mjs   # longer per-step sampling
//   PORT=3010 node scripts/load-test.mjs
//   node scripts/load-test.mjs --quick       # short smoke (levels 10,100; 5s)
//
// Writes machine-readable results to scripts/load-test-results.json. The
// markdown report (docs/briefs/L-V340-LOAD-REPORT.md) is written from those
// numbers.

import autocannon from "autocannon";
import dotenv from "dotenv";
import { spawn } from "node:child_process";
import { writeFileSync, createWriteStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import http from "node:http";

dotenv.config(); // make OPENAI_API_KEY available for the real-AI burst (scenario F)

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = Number(process.env.PORT) || 3010;
const BASE = `http://127.0.0.1:${PORT}`;
const QUICK = process.argv.includes("--quick");
const DURATION = Number(process.env.DURATION) || (QUICK ? 5 : 10);
const LEVELS = QUICK ? [10, 100] : [10, 50, 100, 200];

// ─── Request profiles ───────────────────────────────────────────────────────
// "cheap"  — GET /health: no DB, no auth. Pure app/event-loop capacity.
// "ai"     — POST /api/grade-writing: full authed AI middleware chain
//            (requireAuth → aiStrictLimiter → checkMonthlyCostLimit →
//            checkFeatureAccess → callOpenAI). AI is stubbed; this measures the
//            route + middleware, not OpenAI speed.
const AI_BODY = JSON.stringify({
  lang: "es",
  task: { taskType: "short", charMin: 50, charMax: 120, points: 10 },
  studentText:
    "Hola, me llamo Ana y estudio espanol en el instituto. Me gusta viajar, " +
    "leer libros y escuchar musica con mis amigos durante el fin de semana.",
});

const PROFILES = {
  cheap: { method: "GET", path: "/health" },
  ai: {
    method: "POST",
    path: "/api/grade-writing",
    headers: { "content-type": "application/json", authorization: "Bearer loaduser" },
    body: AI_BODY,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function waitForHealth(timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tick = () => {
      const req = http.get(`${BASE}/health`, (r) => {
        r.resume();
        if (r.statusCode === 200) return res();
        retry();
      });
      req.on("error", retry);
      req.setTimeout(1000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) return rej(new Error("server did not become healthy"));
      setTimeout(tick, 250);
    };
    tick();
  });
}

function startServer(extraEnv) {
  const env = {
    ...process.env,
    NODE_ENV: "production", // exercise the prod rate-limit + cache code paths
    LOAD_TEST: "1", // swap Supabase + OpenAI for in-memory fakes
    PORT: String(PORT),
    SENTRY_DSN: "", // keep logs clean
    AI_LANGUAGES_ENABLED: "es",
    ...extraEnv,
  };
  const child = spawn("node", ["server.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  const logPath = resolve(__dirname, "load-test-server.log");
  const log = createWriteStream(logPath, { flags: "a" });
  log.write(`\n\n===== server spawn ${new Date().toISOString()} env=${JSON.stringify(extraEnv)} =====\n`);
  let backstopHits = 0;
  child.stdout.pipe(log, { end: false });
  child.stderr.on("data", (d) => {
    const s = d.toString();
    log.write(s);
    if (s.includes("backstop hit")) backstopHits++;
  });
  child.on("exit", (code, sig) => log.write(`\n===== server exit code=${code} sig=${sig} =====\n`));
  child.__backstop = () => backstopHits;
  return child;
}

function stopServer(child) {
  return new Promise((res) => {
    if (!child || child.killed) return res();
    child.on("exit", () => res());
    child.kill();
    setTimeout(res, 2000); // safety: don't hang if exit event is missed
  });
}

async function runAutocannon({ profile, connections, duration, amount }) {
  const p = PROFILES[profile];
  const opts = {
    url: `${BASE}${p.path}`,
    method: p.method,
    headers: p.headers,
    body: p.body,
    connections,
    timeout: 30,
  };
  if (amount) opts.amount = amount;
  else opts.duration = duration;

  const r = await autocannon(opts);
  const ok2xx = r["2xx"] || 0;
  const total = r.requests.total || 0;
  return {
    connections,
    duration: amount ? null : duration,
    amount: amount || null,
    reqPerSec: round(r.requests.average),
    totalReq: total,
    p50: r.latency.p50,
    p90: r.latency.p90,
    p99: r.latency.p99,
    maxLatency: r.latency.max,
    "2xx": ok2xx,
    non2xx: r.non2xx || 0,
    errors: r.errors || 0,
    timeouts: r.timeouts || 0,
    errorPct: total ? round(((total - ok2xx) / total) * 100) : 0,
  };
}

function round(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Windows closes finished sockets into TIME_WAIT (~120s) and the default
// ephemeral-port pool is small. Back-to-back high-rate autocannon steps with no
// gap exhaust it, which shows up as connection errors / 0 req/s on the NEXT
// step (the server itself stays healthy). A short drain between steps and a
// longer one between server restarts keeps the pool from collapsing.
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const STEP_COOLDOWN_MS = Number(process.env.STEP_COOLDOWN_MS) || (QUICK ? 1000 : 3000);
const SCENARIO_COOLDOWN_MS = Number(process.env.SCENARIO_COOLDOWN_MS) || (QUICK ? 1500 : 10000);

async function rampScenario(name, meta, extraEnv, plan) {
  console.log(`\n=== Scenario ${name}: ${meta} ===`);
  console.log(`    env: ${JSON.stringify(extraEnv)}`);
  const child = startServer(extraEnv);
  const result = { name, meta, env: extraEnv, runs: [] };
  try {
    await waitForHealth();
    await pause(500); // warmup
    let first = true;
    for (const step of plan) {
      if (!first) await pause(STEP_COOLDOWN_MS);
      first = false;
      const run = await runAutocannon(step);
      run.profile = step.profile;
      run.backstopHits = child.__backstop();
      result.runs.push(run);
      const tag = step.amount ? `amount=${step.amount}` : `${run.duration}s`;
      console.log(
        `    [${step.profile}] conn=${step.connections} ${tag} → ` +
          `${run.reqPerSec} req/s  p50=${run.p50}ms p99=${run.p99}ms  ` +
          `2xx=${run["2xx"]} non2xx=${run.non2xx} err=${run.errors} to=${run.timeouts}  ` +
          `errPct=${run.errorPct}%`
      );
    }
  } catch (e) {
    result.error = e.message;
    console.error(`    Scenario ${name} failed:`, e.message);
  } finally {
    await stopServer(child);
    await pause(SCENARIO_COOLDOWN_MS); // let the killed server's port + sockets drain
  }
  return result;
}

// ─── Scenario plan ────────────────────────────────────────────────────────────

const cheapRamp = LEVELS.map((c) => ({ profile: "cheap", connections: c, duration: DURATION }));
const aiRamp = LEVELS.map((c) => ({ profile: "ai", connections: c, duration: DURATION }));
const aiRampSmall = (QUICK ? [100] : [50, 200]).map((c) => ({
  profile: "ai",
  connections: c,
  duration: DURATION,
}));

const HUGE_CAP = "1000000000"; // park the in-memory backstop for capacity runs

async function main() {
  const all = { startedAt: new Date().toISOString(), port: PORT, duration: DURATION, levels: LEVELS, scenarios: [] };

  // A — limiters ON, healthy DB. Capacity with the Supabase-backed limiter's
  //     per-request DB round-trips in the path.
  all.scenarios.push(
    await rampScenario(
      "A_rl_on",
      "rate limiters ON, healthy (stub) DB",
      { AUTHED_AI_DAILY_CAP: HUGE_CAP },
      [...cheapRamp, ...aiRamp]
    )
  );

  // B — limiters loosened. Raw route capacity, zero limiter round-trips.
  all.scenarios.push(
    await rampScenario(
      "B_rl_off",
      "rate limiters OFF (LOAD_TEST_RL_OFF=1)",
      { LOAD_TEST_RL_OFF: "1", AUTHED_AI_DAILY_CAP: HUGE_CAP },
      [...cheapRamp, ...aiRamp]
    )
  );

  // C — fail-open probe: rate-limit DB reads error out under load. Shows the
  //     limiter waves everything through (rateLimit.js:37) — the cost-control
  //     hole the brief targets.
  all.scenarios.push(
    await rampScenario(
      "C_db_fail_open",
      "rate-limit DB erroring (fail-open), limiters ON",
      { LOAD_TEST_DB_ERROR: "1", AUTHED_AI_DAILY_CAP: HUGE_CAP },
      aiRampSmall
    )
  );

  // D — slow DB: inject latency on every limiter round-trip to size its cost.
  all.scenarios.push(
    await rampScenario(
      "D_db_slow",
      "rate-limit DB +50ms latency, limiters ON",
      { LOAD_TEST_DB_LATENCY_MS: "50", AUTHED_AI_DAILY_CAP: HUGE_CAP },
      QUICK ? [{ profile: "ai", connections: 100, duration: DURATION }]
            : [{ profile: "ai", connections: 50, duration: DURATION }, { profile: "ai", connections: 200, duration: DURATION }]
    )
  );

  // E — in-memory backstop: the only gate that actually bounds a concentrated
  //     burst. Cap set low so it trips and floods 429.
  all.scenarios.push(
    await rampScenario(
      "E_backstop",
      "authed-AI in-memory backstop AUTHED_AI_DAILY_CAP=500",
      { AUTHED_AI_DAILY_CAP: "500" },
      [{ profile: "ai", connections: 100, duration: DURATION }]
    )
  );

  // F — real OpenAI burst, hard budget cap. The ONLY paid traffic.
  if (process.env.OPENAI_API_KEY) {
    all.scenarios.push(
      await rampScenario(
        "F_real_ai_burst",
        "REAL OpenAI /grade-writing burst, €0.10 cap",
        { LOAD_TEST_AI: "real", LOAD_TEST_AI_BUDGET_EUR: "0.10", AUTHED_AI_DAILY_CAP: HUGE_CAP },
        [{ profile: "ai", connections: 10, amount: QUICK ? 5 : 30 }]
      )
    );
  } else {
    console.log("\n=== Scenario F skipped: OPENAI_API_KEY not set — no real-AI burst ===");
    all.scenarios.push({ name: "F_real_ai_burst", skipped: "OPENAI_API_KEY not set" });
  }

  all.finishedAt = new Date().toISOString();
  const outPath = resolve(__dirname, "load-test-results.json");
  writeFileSync(outPath, JSON.stringify(all, null, 2));
  console.log(`\nResults written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
