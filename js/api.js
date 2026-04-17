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
