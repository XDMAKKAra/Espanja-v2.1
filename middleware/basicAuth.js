// ─── Site-wide HTTP Basic Auth ─────────────────────────────────────────────
//
// Gates the entire site (HTML, static assets, API) behind a username +
// password prompt. Used as a temporary "do not look at this" wall while
// pre-launch — NOT a substitute for real per-user auth.
//
// Configure via env:
//   SITE_USERNAME — required to enable the gate
//   SITE_PASSWORD — required to enable the gate
//
// If either env var is missing, the middleware is a no-op so local dev
// keeps working without setting them.
//
// Uses constant-time comparison to avoid leaking the password via timing.

import crypto from "crypto";

function safeEqual(a, b) {
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export default function basicAuth(req, res, next) {
  const expectedUser = process.env.SITE_USERNAME;
  const expectedPass = process.env.SITE_PASSWORD;

  // Disabled if either is missing — fail open so dev does not break.
  if (!expectedUser || !expectedPass) return next();

  const header = req.headers.authorization || "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx > -1) {
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) {
        return next();
      }
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="Puheo", charset="UTF-8"');
  res.status(401).send("Authentication required");
}
