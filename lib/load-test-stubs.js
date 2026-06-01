// lib/load-test-stubs.js — in-memory fakes used ONLY under load testing.
//
// Activated when process.env.LOAD_TEST === "1". Completely inert otherwise:
// nothing here runs unless lib/supabase.js / lib/openai.js explicitly opt in.
//
// Why this exists (L-V340): the load test must never touch the production
// Supabase project or the real OpenAI API under bulk concurrency. Every DB
// access in the app funnels through the three exports of lib/supabase.js
// (adminClient / authClient / createUserClient), so replacing those with an
// in-memory fake is a single chokepoint that guarantees zero prod writes no
// matter which endpoint the load driver hits.
//
// The fake deliberately MIRRORS production Postgres semantics for the one
// table whose behaviour we want to measure — rate_limit_buckets — including
// the `ON CONFLICT DO UPDATE SET count = 1` overwrite that the real upsert in
// middleware/rateLimit.js performs. That way any finding about rate-limit
// under-counting transfers to prod instead of being a stub artefact.

export const LOAD_TEST = process.env.LOAD_TEST === "1";

// Injectable DB behaviour for stress scenarios (set by the load driver):
//   LOAD_TEST_DB_LATENCY_MS — add N ms to every query (simulate slow Supabase)
//   LOAD_TEST_DB_ERROR=1    — make rate_limit_buckets reads return an error,
//                             exercising the fail-open path (rateLimit.js:37)
const DB_LATENCY_MS = Number(process.env.LOAD_TEST_DB_LATENCY_MS) || 0;
const DB_ERROR = process.env.LOAD_TEST_DB_ERROR === "1";

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── In-memory rate_limit_buckets store ─────────────────────────────────────
// Map<key, Map<window_start_iso, count>>. Mirrors the (key, window_start) PK.
const _rlBuckets = new Map();

function rlSelect(key, gteWindowStartIso) {
  const byWindow = _rlBuckets.get(key);
  if (!byWindow) return [];
  const rows = [];
  for (const [ws, count] of byWindow) {
    if (!gteWindowStartIso || ws >= gteWindowStartIso) rows.push({ count });
  }
  return rows;
}

function rlUpsertOverwrite(key, windowStartIso) {
  // Mirror production: ON CONFLICT (key, window_start) DO UPDATE SET count = 1.
  // supabase-js upsert sends the literal row {count:1}, so a conflicting bucket
  // is RESET to 1, never incremented. Reproducing this exactly is the point.
  let byWindow = _rlBuckets.get(key);
  if (!byWindow) {
    byWindow = new Map();
    _rlBuckets.set(key, byWindow);
  }
  byWindow.set(windowStartIso, 1);
}

// Mirrors the increment_rate_limit RPC (migration 20260601): atomically bump
// the current minute bucket and return the sliding-window total. This is the
// FIXED behaviour — a concentrated burst now accumulates and gets counted.
function rlIncrement(key, windowMs) {
  const nowMs = Date.now();
  const bucketMs = Math.floor(nowMs / 60000) * 60000;
  let byWindow = _rlBuckets.get(key);
  if (!byWindow) {
    byWindow = new Map();
    _rlBuckets.set(key, byWindow);
  }
  byWindow.set(bucketMs, (byWindow.get(bucketMs) || 0) + 1);
  const cutoff = nowMs - windowMs;
  let total = 0;
  for (const [ws, count] of byWindow) {
    if (ws >= cutoff) total += count;
  }
  return total;
}

// ─── Chainable query builder fake ───────────────────────────────────────────
// Supports the full surface used across routes/middleware. Every filter method
// returns `this`; the builder is thenable so `await builder` and
// `await builder.single()` both resolve to a Supabase-shaped { data, error }.

class StubQuery {
  constructor(table) {
    this._table = table;
    this._op = "select";
    this._eq = {};
    this._gte = {};
    this._single = false;
    this._head = false;
    this._payload = null;
  }
  select(_cols, opts) {
    this._op = this._op === "select" ? "select" : this._op;
    if (opts?.head) this._head = true;
    return this;
  }
  insert(payload) { this._op = "insert"; this._payload = payload; return this; }
  upsert(payload) { this._op = "upsert"; this._payload = payload; return this; }
  update(payload) { this._op = "update"; this._payload = payload; return this; }
  delete() { this._op = "delete"; return this; }
  eq(col, val) { this._eq[col] = val; return this; }
  gte(col, val) { this._gte[col] = val; return this; }
  // No-op filters — kept chainable so any route query shape works.
  neq() { return this; }
  gt() { return this; }
  lt() { return this; }
  lte() { return this; }
  in() { return this; }
  is() { return this; }
  not() { return this; }
  or() { return this; }
  ilike() { return this; }
  like() { return this; }
  contains() { return this; }
  match() { return this; }
  filter() { return this; }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; return this; }

  async _run() {
    if (DB_LATENCY_MS) await delay(DB_LATENCY_MS);

    // rate_limit_buckets is the one table we model with real semantics.
    if (this._table === "rate_limit_buckets") {
      if (this._op === "select") {
        if (DB_ERROR) {
          return { data: null, error: { message: "injected DB error (LOAD_TEST_DB_ERROR)" } };
        }
        const key = this._eq.key;
        const gteWs = this._gte.window_start;
        const rows = rlSelect(key, gteWs);
        return { data: rows, error: null, count: rows.length };
      }
      if (this._op === "upsert" || this._op === "insert" || this._op === "update") {
        const row = Array.isArray(this._payload) ? this._payload[0] : this._payload;
        if (row?.key && row?.window_start) rlUpsertOverwrite(row.key, row.window_start);
        return { data: null, error: null };
      }
      return { data: null, error: null };
    }

    // Everything else: benign empty success. Routes are written defensively
    // (`const { data } = await ...; data?.foo`) so null data is safe and means
    // "fresh user with no rows" — exactly the shape we want under load.
    if (this._head) return { data: null, error: null, count: 0 };
    if (this._single) return { data: null, error: null };
    return { data: [], error: null, count: 0 };
  }

  then(onFulfilled, onRejected) {
    return this._run().then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this._run().catch(onRejected);
  }
}

// ─── Auth fake ──────────────────────────────────────────────────────────────
// Treats the Bearer token AS the user id, so the load driver controls whether
// traffic is single-user (same token → per-user AI limiter keys collide) or
// multi-user (vary the token). No network, no JWT verification.
function makeAuth() {
  const userFor = (idOrJwt) => ({
    id: String(idOrJwt || "lt-anon"),
    email: `${String(idOrJwt || "lt-anon")}@loadtest.local`,
  });
  return {
    async getUser(jwt) {
      if (DB_LATENCY_MS) await delay(DB_LATENCY_MS);
      return { data: { user: userFor(jwt) }, error: null };
    },
    admin: {
      async getUserById(id) {
        if (DB_LATENCY_MS) await delay(DB_LATENCY_MS);
        return { data: { user: userFor(id) }, error: null };
      },
      async listUsers() {
        return { data: { users: [] }, error: null };
      },
    },
    async signInWithPassword() {
      return { data: { user: userFor("lt-signin"), session: { access_token: "lt-token" } }, error: null };
    },
    async refreshSession() {
      return { data: { session: { access_token: "lt-token" } }, error: null };
    },
  };
}

export function createStubClient() {
  return {
    from(table) { return new StubQuery(table); },
    async rpc(fn, params) {
      if (DB_LATENCY_MS) await delay(DB_LATENCY_MS);
      if (fn === "increment_rate_limit") {
        // LOAD_TEST_DB_ERROR exercises the fail-open path (rateLimit.js).
        if (DB_ERROR) return { data: null, error: { message: "injected DB error (LOAD_TEST_DB_ERROR)" } };
        const total = rlIncrement(params.p_key, Number(params.p_window_ms) || 0);
        return { data: total, error: null };
      }
      return { data: null, error: { message: "stub rpc" } };
    },
    auth: makeAuth(),
  };
}

// Test/diagnostic hook — lets a harness inspect or reset bucket state.
export const __rlStore = {
  buckets: _rlBuckets,
  reset() { _rlBuckets.clear(); },
};
