// Service-worker registration — extracted from inline <script> in
// app.html for strict CSP. Same as before: register if supported,
// silent on failure (offline.html still works as a graceful fallback).

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
