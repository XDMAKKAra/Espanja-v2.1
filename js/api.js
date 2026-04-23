// ─── API + Auth state ───────────────────────────────────────────────────────

export const API = window.location.origin;

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
}

// Auto-refresh: if any authed request gets 401, try refreshing once then retry
let _refreshing = null;

// show is injected later to avoid circular dependency
let _showFn = null;
export function setShowFn(fn) { _showFn = fn; }

export async function apiFetch(url, opts = {}) {
  let res = await fetch(url, opts);
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
