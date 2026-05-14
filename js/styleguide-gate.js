/* Puheo styleguide gate — F-ARCH-1 §C.
   Replaces the page with a 404 unless we are on localhost or the URL
   carries ?dev=1. Loaded as an external file because the production
   CSP rejects inline <script>. */
(function () {
  var params = new URLSearchParams(location.search);
  var host = location.hostname;
  var allowed =
    params.has("dev") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".local");
  if (allowed) return;
  document.documentElement.innerHTML =
    '<head><meta charset="utf-8"><title>404</title></head>' +
    '<body style="font-family:system-ui,sans-serif;padding:48px;color:#374151">' +
    '<h1 style="font-size:20px;margin:0 0 8px">404 — Ei löydy</h1>' +
    '<p style="margin:0;color:#6B7280">Tämä sivu on tarkoitettu kehitysympäristöön.</p>' +
    "</body>";
})();
