const CACHE_VERSION = "puheo-v48";
const STATIC_ASSETS = [
  "/app.html",
  "/index.html",
  "/style.css",
  "/landing.css",
  "/css/components/typography.css",
  "/css/components/app-shell.css",
  "/css/components/dashboard.css",
  "/css/components/rail.css",
  "/css/components/mode-page.css",
  "/css/components/exercise.css",
  "/css/components/results.css",
  "/manifest.json",
  "/offline.html",
  "/js/diagnostic.js",
  "/js/main.js",
  "/js/api.js",
  "/js/state.js",
  "/js/ui/nav.js",
  "/js/ui/loading.js",
  "/js/ui/icons.js",
  "/js/features/spacedRepetition.js",
  "/js/features/writingProgression.js",
  "/js/screens/auth.js",
  "/js/screens/dashboard.js",
  "/js/screens/vocab.js",
  "/js/screens/grammar.js",
  "/js/screens/reading.js",
  "/js/screens/writing.js",
  "/js/screens/exam.js",
  "/js/screens/fullExam.js",
  "/js/screens/adaptive.js",
  "/js/screens/dash-cta.js",
  "/js/screens/mode-page.js",
];

// ─── Install: precache static assets ────────────────────────────────────────

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ─────────────────────────────────────────────

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: cache-first for static, network-first for API ───────────────────

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin
  if (e.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API calls: network-first, no cache
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // Static assets: cache-first, update in background (stale-while-revalidate)
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => {
          // If no cache and no network, show offline page for navigation
          if (e.request.mode === "navigate") {
            return caches.match("/offline.html");
          }
          return cached;
        });

      return cached || networkFetch;
    })
  );
});

// ─── Push notifications ─────────────────────────────────────────────────────

self.addEventListener("push", (e) => {
  let data = { title: "Puheo", body: "Sinulla on uusia harjoituksia!", url: "/app.html" };

  try {
    if (e.data) data = { ...data, ...e.data.json() };
  } catch { /* use defaults */ }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/app.html" },
      actions: [
        { action: "open", title: "Avaa" },
        { action: "dismiss", title: "Myöhemmin" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();

  if (e.action === "dismiss") return;

  const url = e.notification.data?.url || "/app.html";

  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes("/app.html") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});
