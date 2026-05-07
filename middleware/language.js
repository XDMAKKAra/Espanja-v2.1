// ─── Language gate middleware ────────────────────────────────────────────────
// Resolves the active language for a request and guards non-ES languages
// behind an environment flag (AI_LANGUAGES_ENABLED).
//
// Usage in routes:
//   import { resolveLang, requireSupportedLanguage } from "../middleware/language.js";
//   const lang = resolveLang(req);          // resolve only, no gate
//   if (requireSupportedLanguage(req, res)) return;  // gate + early return

/**
 * Resolve the active language code for a request.
 * Priority: req.query.lang → req.user?.target_language → body.lang → 'es'
 * Always returns a lowercase string.
 * @param {import('express').Request} req
 * @returns {string} e.g. 'es' | 'de' | 'fr'
 */
export function resolveLang(req) {
  const raw =
    req.query?.lang ||
    req.user?.target_language ||
    req.body?.lang ||
    "es";
  return String(raw).toLowerCase().trim() || "es";
}

/**
 * Gate that blocks languages not listed in AI_LANGUAGES_ENABLED.
 * Sends a 403 JSON response when the language is not supported and returns true
 * so the caller can do `if (requireSupportedLanguage(req, res)) return;`.
 *
 * Returns false (no response sent) when the language is allowed.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {boolean} true = blocked (response already sent), false = allowed
 */
export function requireSupportedLanguage(req, res) {
  const enabled = (process.env.AI_LANGUAGES_ENABLED || "es")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const lang = resolveLang(req);
  if (!enabled.includes(lang)) {
    res.status(403).json({ error: "language_not_supported_yet", language: lang });
    return true;
  }
  return false;
}
