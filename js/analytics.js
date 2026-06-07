// ─── Frontend analytics: Vercel Web Analytics + PostHog + Sentry ───────────

let posthog = null;
let sentryBrowser = null;
let vercelAnalytics = null;

// SHA-256 hash for GDPR-safe email identification
async function hashEmail(email) {
  if (!email) return null;
  const data = new TextEncoder().encode(email.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// PostHog — analytics. GDPR-gated: the caller (consent.js) only invokes this
// once the user has granted analytics consent. Sets a localStorage identifier
// and captures product-usage events. Never call this without consent.
export async function initAnalytics(userId, email) {
  if (posthog) return; // already running, don't double-init
  const phKey = window.__POSTHOG_KEY;
  if (!phKey) return;
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

// Stop analytics after a consent revocation: opt out of future capture, clear
// PostHog's stored identifiers, and null the handle so track() goes silent.
export function disableAnalytics() {
  try {
    if (posthog) {
      posthog.opt_out_capturing?.();
      posthog.reset?.();
    }
  } catch { /* silent */ }
  posthog = null;
}

// Vercel Web Analytics — privacy-friendly page view tracking. This runs
// automatically and does not require consent as it's privacy-friendly (no
// cookies, no personal data). Only works in production on Vercel deployments.
export async function initVercelAnalytics() {
  if (vercelAnalytics) return; // already initialized
  try {
    // Import the inject function from @vercel/analytics
    const { inject } = await import("@vercel/analytics");
    inject();
    vercelAnalytics = true;
  } catch (err) {
    // Silent fail - analytics is optional and only works on Vercel
    console.debug("Vercel Analytics not available:", err.message);
  }
}

// Sentry (browser) — error monitoring. Runs under legitimate interest (keeping
// the service stable), not analytics consent, so it is NOT gated. It sets no
// non-essential identifiers and scrubs PII from every event before sending.
// Production only, never on localhost (dev noise).
export function initErrorMonitoring() {
  if (sentryBrowser) return;
  const sentryDsn = window.__SENTRY_DSN;
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  if (!sentryDsn || isLocalhost) return;
  try {
    const script = document.createElement("script");
    script.src = "https://browser.sentry-cdn.com/8.0.0/bundle.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      if (!window.Sentry) return;
      sentryBrowser = window.Sentry;
      window.Sentry.init({
        dsn: sentryDsn,
        environment: "production",
        tracesSampleRate: 0.1,
        // Do not attach IP, cookies or other default PII to events.
        sendDefaultPii: false,
        beforeSend(event) {
          // Drop request cookies/headers and the user object so no email,
          // token or session detail leaves the browser with an error report.
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
          }
          delete event.user;
          return event;
        },
      });
    };
    document.head.appendChild(script);
  } catch { /* silent */ }
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
