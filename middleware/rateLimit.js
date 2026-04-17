import rateLimit from "express-rate-limit";

// Disable the IPv6 key generator validation (dev/local only issue)
const validate = { keyGeneratorIpFallback: false };

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Liian monta pyyntöä. Yritä hetken kuluttua uudelleen." },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Liian monta rekisteröintiyritystä. Yritä myöhemmin." },
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Liian monta pyyntöä. Yritä myöhemmin." },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Olet käyttänyt tuntikysyntäsi. Yritä myöhemmin." },
  validate,
});

export const aiStrictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { error: "Olet käyttänyt tuntikysyntäsi. Yritä myöhemmin." },
  validate,
});
