const CACHE_VERSION = "puheo-v118";
const STATIC_ASSETS = [
  "/app.html",
  "/index.html",
  // L-LIVE-AUDIT-P2 UPDATE 1+2 — bundled CSS+JS replace 16 CSS links + 28 JS modules
  // on app.html cold load. Source files stay in repo + cached below for offline robustness.
  "/app.bundle.css",
  "/app.bundle.js",
  // L-LIVE-AUDIT-P2 UPDATE 8 — self-hosted fonts (Inter + DM Mono).
  "/fonts/inter-latin-400-normal.woff2",
  "/fonts/inter-latin-500-normal.woff2",
  "/fonts/inter-latin-600-normal.woff2",
  "/fonts/inter-latin-700-normal.woff2",
  "/fonts/inter-latin-800-normal.woff2",
  "/fonts/dm-mono-latin-400-normal.woff2",
  "/fonts/dm-mono-latin-500-normal.woff2",
  "/js/pre-launch-gate.js",
  "/js/landing-init.js",
  "/js/landing-nav.js",
  "/js/app-prepaint.js",
  "/js/app-config.js",
  "/js/sw-register.js",
  "/style.css",
  "/landing.css",
  "/favicon-32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/css/components/typography.css",
  "/css/components/app-shell.css",
  "/css/components/dashboard.css",
  "/css/components/rail.css",
  "/css/components/pro-popup.css",
  "/js/screens/settings.js",
  "/js/screens/learningPath.js",
  "/css/components/mode-page.css",
  "/css/components/exercise.css",
  "/css/components/results.css",
  "/css/components/profile.css",
  "/css/components/meteors.css",
  "/css/components/onboarding-v2.css",
  "/js/screens/onboardingV2.js",
  "/css/components/curriculum.css",
  "/css/components/lesson-runner.css",
  "/js/screens/curriculum.js",
  "/js/screens/lessonRunner.js",
  "/js/screens/lessonResults.js",
  "/js/lib/lessonContext.js",
  "/js/lib/lessonAdapter.js",
  "/css/components/profile-menu.css",
  "/js/features/profileMenu.js",
  "/css/components/teaching-panel.css",
  "/js/features/teachingPanel.js",
  "/js/features/confirmDialog.js",
  "/js/features/reviewBadge.js",
  "/js/lib/lessonLabels.js",
  "/manifest.json",
  "/offline.html",
  "/js/diagnostic.js",
  "/js/main.js",
  "/js/api.js",
  "/js/state.js",
  "/js/ui/nav.js",
  "/js/ui/loading.js",
  "/js/ui/icons.js",
  "/js/ui/timeAgo.js",
  "/js/features/spacedRepetition.js",
  "/js/features/writingProgression.js",
  "/js/features/wordOfDay.js",
  "/js/features/dailyChallenge.js",
  "/js/features/celebrate.js",
  "/js/features/shareCard.js",
  "/js/features/achievements.js",
  "/js/features/meteors.js",
  "/js/features/cardTilt.js",
  "/js/features/tooltip.js",
  "/js/features/landingHero.js",
  "/js/features/scrollReveal.js",
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
  "/js/screens/profile.js",
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

  // Navigation requests (HTML documents): network-first so marketing copy
  // and SPA shell are always fresh. Falls back to cache only when offline.
  // Prevents the stale-landing-after-rebuild class of bugs.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match("/offline.html")))
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
