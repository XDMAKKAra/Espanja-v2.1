// ─── API + Auth state ───────────────────────────────────────────────────────

export const API = window.location.origin;

// L-LANG-INFRA-1: AI routes that must receive ?lang= so the backend can select
// the right language model/prompt. Matched as prefix against the request URL.
const AI_ROUTE_PREFIXES = [
  "/api/exercises",
  "/api/writing",
  "/api/exam",
  "/api/reading",
];

// Inject ?lang=<state.language> onto AI routes. Lazy-imports state to avoid a
// circular dep at module parse time (api.js → state.js is fine; state.js has
// no imports, but the import() guard keeps things clean across bundlers).
function injectLangParam(url) {
  try {
    // Import state synchronously — state.js is a plain ES module with no async
    // code, so by the time any fetch fires it will already be evaluated.
    // We access it via a module-level cache set by setStateFn() below.
    if (!_stateFn) return url;
    const lang = _stateFn();
    if (!lang || lang === "es") return url; // es is backend default — no-op
    const u = new URL(url, window.location.origin);
    const isAiRoute = AI_ROUTE_PREFIXES.some((p) => u.pathname.startsWith(p));
    if (!isAiRoute) return url;
    u.searchParams.set("lang", lang);
    return u.toString();
  } catch {
    return url;
  }
}

let _stateFn = null;
/** Call once from main.js after state is loaded: setLangFn(() => state.language) */
export function setLangFn(fn) { _stateFn = fn; }

let authToken        = localStorage.getItem("puheo_token");
let authRefreshToken = localStorage.getItem("puheo_refresh_token");
let authEmail        = localStorage.getItem("puheo_email");

export function isLoggedIn() { return !!authToken; }

export function getAuthEmail() { return authEmail; }

export function authHeader() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

export function setAuth(token, refreshToken, email) {
  authToken        = token;
  authRefreshToken = refreshToken;
  authEmail        = email;
  localStorage.setItem("puheo_token",         token);
  localStorage.setItem("puheo_refresh_token", refreshToken);
  localStorage.setItem("puheo_email",         email);
}

export function clearAuth() {
  authToken = null;
  authRefreshToken = null;
  authEmail = null;
  localStorage.removeItem("puheo_token");
  localStorage.removeItem("puheo_refresh_token");
  localStorage.removeItem("puheo_email");
  // L-LIVE-AUDIT-P2 UPDATE 3+4 — drop cached profile + batched payload on logout
  _profileCache = null;
  _profileCacheTime = 0;
  _dashboardV2 = null;
}

// Auto-refresh: if any authed request gets 401, try refreshing once then retry
let _refreshing = null;

// show is injected later to avoid circular dependency
let _showFn = null;
export function setShowFn(fn) { _showFn = fn; }

export async function apiFetch(url, opts = {}) {
  // L-LANG-INFRA-1: inject ?lang= on AI routes for non-ES languages.
  url = injectLangParam(url);
  let res = await fetch(url, opts);

  // ── 403 paywall intercept ────────────────────────────────────────────────
  // Intercept quota / tier gate errors and open the paywall modal so callers
  // don't need to handle it individually.  The response is still returned so
  // callers that want to react programmatically can do so.
  if (res.status === 403) {
    // Clone before reading so the caller can still consume the body.
    const cloned = res.clone();
    cloned.json().then((data) => {
      if (!data || typeof data !== "object") return;
      const errCode = data.error;
      if (errCode !== "free_quota_exceeded" && errCode !== "tier_required") return;
      // Lazy-import to avoid circular dep at parse time.
      import("./features/paywallModal.js").then(({ openPaywall, deriveVariant }) => {
        const variant = deriveVariant(data.current_tier, data.tier_required);
        openPaywall({ variant });
      }).catch(() => { /* no-op if modal not available */ });
    }).catch(() => { /* JSON parse failed — leave to caller */ });
    return res;
  }

  if (res.status !== 401 || !authRefreshToken) return res;

  if (!_refreshing) {
    _refreshing = fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: authRefreshToken }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("refresh_failed");
        const d = await r.json();
        setAuth(d.token, d.refreshToken, d.email);
      })
      .catch(() => { clearAuth(); if (_showFn) _showFn("screen-auth"); })
      .finally(() => { _refreshing = null; });
  }
  await _refreshing;
  if (!authToken) return res;

  const newOpts = { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${authToken}` } };
  return fetch(url, newOpts);
}

// ─── L-LIVE-AUDIT-P2 UPDATE 4 — in-memory profile cache ────────────────────
// /api/profile measured 902 ms in the live audit and is fetched on every
// screen mount (settings, dashboard, profile, onboarding, several modals).
// 5-minute TTL keeps the live feel without dragging the cold-load timeline.
// Settings-screen save flows MUST call invalidateProfileCache() to force a
// refresh on the next read.
let _profileCache = null;
let _profileCacheTime = 0;
const PROFILE_CACHE_MS = 5 * 60 * 1000;

export async function getProfile({ force = false } = {}) {
  const now = Date.now();
  if (!force && _profileCache && now - _profileCacheTime < PROFILE_CACHE_MS) {
    return _profileCache;
  }
  const r = await apiFetch(`${API}/api/profile`, { headers: authHeader() });
  if (!r.ok) throw new Error(`profile_fetch_${r.status}`);
  _profileCache = await r.json();
  _profileCacheTime = now;
  return _profileCache;
}

export function invalidateProfileCache() {
  _profileCache = null;
  _profileCacheTime = 0;
}

// L-LIVE-AUDIT-P2 UPDATE 3 — single batched payload from /api/dashboard/v2.
// Stash the full response so per-section helpers (loadAdaptiveState,
// loadWeakTopics, loadAndRenderReadinessMap, loadLearningPath) can consume
// from cache instead of re-fetching their endpoint. Cleared on auth change.
let _dashboardV2 = null;
export function setDashboardV2(payload) { _dashboardV2 = payload || null; }
export function getDashboardV2Section(key) { return _dashboardV2?.[key] ?? null; }
export function clearDashboardV2() { _dashboardV2 = null; }

// ─── retryable — Pass 6 C16 ────────────────────────────────────────────────
// Wraps a fetch-returning async fn with bounded retries + backoff. Retries
// on network errors and 5xx; does not retry 4xx (client error). Preserves
// the original promise contract so callers can .json()/check .ok as usual.
//
//   const res = await retryable(() => apiFetch(url, opts), { attempts: 3 });
//
// On exhaustion, rethrows the last error or returns the last Response.

export async function retryable(fn, { attempts = 3, baseDelayMs = 400 } = {}) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fn();
      if (res.ok || (res.status >= 400 && res.status < 500)) return res;
      lastErr = new Error(`HTTP ${res.status}`);
      lastErr.response = res;
    } catch (err) {
      lastErr = err;
    }
    if (i < attempts - 1) {
      const delay = baseDelayMs * 2 ** i + Math.random() * baseDelayMs;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  if (lastErr?.response) return lastErr.response;
  throw lastErr ?? new Error("retryable: unknown failure");
}

// ─── offlineQueue — best-effort IndexedDB write buffer (Pass 6 C16) ─────────
// When a write fails due to network / 5xx, callers can enqueue the payload
// so we retry it on the next successful reconnect. Keeps the UI responsive
// (student keeps working; a banner tells them writes are pending).

const Q_NAME = "puheo_pending_writes";

function openQueueDB() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) return reject(new Error("no_indexeddb"));
    const req = indexedDB.open("puheo", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(Q_NAME)) db.createObjectStore(Q_NAME, { autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueWrite(entry) {
  try {
    const db = await openQueueDB();
    const tx = db.transaction(Q_NAME, "readwrite");
    tx.objectStore(Q_NAME).add({ ...entry, queuedAt: Date.now() });
    return new Promise((r) => { tx.oncomplete = () => r(true); tx.onerror = () => r(false); });
  } catch { return false; }
}

export async function flushWriteQueue(sendFn) {
  let flushed = 0;
  try {
    const db = await openQueueDB();
    const tx = db.transaction(Q_NAME, "readwrite");
    const store = tx.objectStore(Q_NAME);
    const req = store.getAll();
    const entries = await new Promise((r) => { req.onsuccess = () => r(req.result); req.onerror = () => r([]); });
    for (const entry of entries) {
      try {
        const ok = await sendFn(entry);
        if (ok) flushed++;
      } catch { /* leave in queue */ }
    }
    if (flushed === entries.length) {
      store.clear();
    }
  } catch { /* ignore */ }
  return flushed;
}
