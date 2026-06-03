const CACHE_VERSION = "puheo-v383";
const STATIC_ASSETS = [
  "/app.html",
  "/index.html",
  "/pricing.html",
  // F-ARCH-1 §B — design tokens single source of truth.
  "/css/tokens.css",
  // L-V374 — shared Tailwind component layer (nav/footer/btn/card/pill/field).
  // Now a production dependency of 404.html; precache so it survives offline.
  "/css/tailwind.css",
  // L-LANG-LANDINGS-1 / L-V356 — per-language abikurssi SEO landing pages
  // (WordDive-brändi, jaettu index.html:n editorial-CSS-pinon kanssa).
  "/public/landing/espanja.html",
  "/public/landing/saksa.html",
  "/public/landing/ranska.html",
  "/css/landing-editorial-tokens.css",
  "/css/landing-editorial.css",
  // L-V358 — compact language info page layout (es/de/fr).
  "/css/landing-langpage.css",
  // L-V373/L-V376 — landing product screenshots (hero is eager; precache so
  // the first paint shows real app UI instead of a blank frame). Hero now has
  // one shot per language for the switcher.
  "/public/shots/app-writing-rubric-es.png",
  "/public/shots/app-writing-rubric-fr.png",
  "/public/shots/app-writing-rubric-de.png",
  "/js/landing-hero-lang.js",
  // L-V380 — zig-zag feature wall removed from the landing; its three product
  // screenshots (app-lesson/app-results/app-home-path) are no longer referenced
  // anywhere, so they are dropped from the precache.
  // L-LIVE-AUDIT-P2 UPDATE 1+2 — bundled CSS+JS replace 16 CSS links + 28 JS modules
  // on app.html cold load. Source files stay in repo + cached below for offline robustness.
  "/app.bundle.css",
  "/app.bundle.js",
  // L-V344 — self-hosted WordDive fonts (Fredoka display + Mulish body).
  "/css/fonts.css",
  "/fonts/fredoka-latin-600-normal.woff2",
  "/fonts/fredoka-latin-700-normal.woff2",
  "/fonts/fredoka-latin-ext-600-normal.woff2",
  "/fonts/fredoka-latin-ext-700-normal.woff2",
  "/fonts/mulish-latin-400-normal.woff2",
  "/fonts/mulish-latin-500-normal.woff2",
  "/fonts/mulish-latin-600-normal.woff2",
  "/fonts/mulish-latin-700-normal.woff2",
  "/fonts/mulish-latin-ext-400-normal.woff2",
  "/fonts/mulish-latin-ext-500-normal.woff2",
  "/fonts/mulish-latin-ext-600-normal.woff2",
  "/fonts/mulish-latin-ext-700-normal.woff2",
  "/js/pre-launch-gate.js",
  "/js/landing-init.js",
  "/js/landing-nav.js",
  "/js/landing-countdown.js",
  "/js/landing-catalog-lang.js",
  "/js/landing-proof-lang.js",
  "/js/landing-writing-demo.js",
  "/js/landing-lang-cta.js",
  "/img/illustrations/student-reading.svg",
  "/img/illustrations/student-walking.svg",
  "/img/illustrations/quill-inkwell.svg",
  "/img/illustrations/ornament-rosette.svg",
  // L-V373 — hero-grade + feature-* SVGs removed (replaced by product
  // screenshots on the landing). empty-state illustrations stay.
  "/img/illustrations/empty-progress.svg",
  "/img/illustrations/empty-lessons.svg",
  // L-V333 hero product mockups (replace student-reading.svg as hero centrepiece).
  "/img/product/lesson-writing.png",
  "/img/product/lesson-grade.png",
  "/js/features/offCanvasNav.js",
  "/js/features/geTip.js",
  "/css/components/off-canvas-nav.css",
  "/css/components/sidebar-shell.css",
  "/js/app-prepaint.js",
  "/js/app-config.js",
  "/js/sw-register.js",
  "/style.css",
  "/css/landing-tokens.css",
  "/css/landing.css",
  "/css/landing-editorial-tokens.css",
  "/css/landing-editorial.css",
  "/css/landing-spark.css",
  "/favicon-32.png",
  "/icon-192.png",
  "/icon-512.png",
  // L-V317 — new wordmark + favicon system (lowercase "puheo" + brick punctuation).
  "/public/brand/logo.svg",
  "/public/brand/logo-mono.svg",
  "/public/brand/logo-dark.svg",
  "/public/brand/favicon-master.svg",
  "/public/favicon/favicon-16.png",
  "/public/favicon/favicon-48.png",
  "/public/favicon/apple-touch-icon.png",
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
  "/css/components/onboarding-v3.css",
  // L-V293-ONBOARDING-DIAGNOSTIC-1a — diagnostic-first V4 styles.
  "/css/components/onboarding-v4.css",
  "/js/screens/onboardingV2.js",
  "/js/screens/onboardingV3.js",
  "/js/lib/studyPlan.js",
  "/css/components/curriculum.css",
  "/css/components/curriculum-bento.css",
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
  "/css/components/paywall.css",
  "/js/features/paywallModal.js",
  // L-LANG-INFRA-1 — coming-soon screen + settings language section.
  "/css/components/coming-soon.css",
  "/js/screens/comingSoon.js",
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

  // F-ARCH-1 §C — never cache the styleguide. It's dev-only, gated, and we
  // don't want stale token previews after a tokens.css edit.
  if (url.pathname === "/styleguide" || url.pathname === "/styleguide.html") {
    return;
  }

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
