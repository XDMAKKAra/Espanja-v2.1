// ─── Frontend analytics: PostHog + Sentry ──────────────────────────────────

let posthog = null;
let sentryBrowser = null;

// SHA-256 hash for GDPR-safe email identification
async function hashEmail(email) {
  if (!email) return null;
  const data = new TextEncoder().encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function initAnalytics(userId, email) {
  // PostHog
  const phKey = window.__POSTHOG_KEY;
  if (phKey) {
    try {
      const mod = await import("https://cdn.jsdelivr.net/npm/posthog-js@1/dist/module.full.no-external.mjs");
      posthog = mod.default;
      posthog.init(phKey, {
        api_host: "https://eu.i.posthog.com",
        persistence: "localStorage",
        autocapture: false,
        capture_pageview: false,
      });

      if (userId) {
        const emailHash = await hashEmail(email);
        posthog.identify(userId, { email_hash: emailHash });
      }
    } catch { /* silent */ }
  }

  // Sentry (browser)
  const sentryDsn = window.__SENTRY_DSN;
  if (sentryDsn) {
    try {
      // Use dynamic import for Sentry browser SDK
      const script = document.createElement("script");
      script.src = "https://browser.sentry-cdn.com/8.0.0/bundle.min.js";
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (window.Sentry) {
          window.Sentry.init({
            dsn: sentryDsn,
            environment: window.location.hostname === "localhost" ? "development" : "production",
            tracesSampleRate: 0.1,
          });
          if (userId) {
            window.Sentry.setUser({ id: userId });
          }
        }
      };
      document.head.appendChild(script);
    } catch { /* silent */ }
  }
}

// ─── Event tracking ────────────────────────────────────────────────────────

export function track(event, properties = {}) {
  if (posthog) {
    try { posthog.capture(event, properties); } catch { /* silent */ }
  }
}

export function trackExerciseStarted(mode, level, topic, language) {
  track("exercise_started", { mode, level, topic, language });
}

export function trackExerciseCompleted(mode, level, correct, total, durationMs) {
  track("exercise_completed", { mode, level, correct, total, duration_ms: durationMs });
  // Pass 4 Commit 7 — drives the paywall first-session gate. Client-side
  // counter is sufficient for the suppression decision; server still owns
  // the real count for the dashboard widget.
  try {
    const key = "puheo_completed_sessions";
    const current = Number(localStorage.getItem(key) || 0);
    localStorage.setItem(key, String(current + 1));
  } catch { /* silent */ }
  // Pass 4 Commit 10 — daily cap (vocab/grammar only).
  if (mode === "vocab" || mode === "grammar") {
    import("../lib/dailyCap.js").then(({ incrementDailyCount, FREE_DAILY_CAP }) => {
      const count = incrementDailyCount();
      if (count === FREE_DAILY_CAP) {
        track("free_cap_hit", { mode, count });
      }
    }).catch(() => { /* silent */ });
  }
}

export function trackExamStarted(durationMode) {
  track("exam_started", { duration_mode: durationMode });
}

export function trackExamCompleted(grade, totalPoints, maxPoints) {
  track("exam_completed", { grade, total_points: totalPoints, max_points: maxPoints });
}

export function trackCheckoutStarted() {
  track("checkout_started");
}

export function trackCheckoutCompleted() {
  track("checkout_completed");
  track("paywall_converted", { source: "checkout" });
}

export function trackProUpsellShown(trigger) {
  track("paywall_shown", trigger ? { trigger } : {});
}

export function trackProUpsellDismissed(trigger) {
  track("paywall_dismissed", trigger ? { trigger } : {});
}

export function trackPaywallConverted(source) {
  track("paywall_converted", source ? { source } : {});
}

export function trackError(context, message) {
  track("error_shown", { context, message });
}
