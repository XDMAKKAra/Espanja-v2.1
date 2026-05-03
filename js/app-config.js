// Analytics + feature-flag config — extracted from inline <script>
// in app.html so a strict CSP (script-src without 'unsafe-inline')
// can ship. Sets window globals consumed by js/main.js → js/analytics.js.
//
// Must load synchronously BEFORE the type=module main.js so the
// globals are present when the module starts executing. In DOM order
// the classic <script src> for this file precedes the
// <script type="module" src="js/main.js"> tag, which is enough —
// module scripts are implicitly deferred.

window.__POSTHOG_KEY = "phc_pDqvRspyx5eukF7fHFz2P3oKWmNAwJXChBBCPAUsfpwE";
// Pass 4 Commit 9 — default to waitlist mode until /api/config/public
// hydrates. Fail-safe: never hit live checkout before y-tunnus.
window.__WAITLIST_MODE = true;
window.__DEV_PRO_ENABLED = false;
window.__SENTRY_DSN = "https://7cb568cdf1a71bc8881775edab27ab86@o4511236850909184.ingest.de.sentry.io/4511236858511440";
