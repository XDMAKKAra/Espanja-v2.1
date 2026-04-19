let app;

try {
  const { default: express } = await import("express");
  const { default: cors } = await import("cors");

  const { default: authRoutes } = await import("../routes/auth.js");
  const { default: progressRoutes } = await import("../routes/progress.js");
  const { default: exerciseRoutes } = await import("../routes/exercises.js");
  const { default: writingRoutes } = await import("../routes/writing.js");
  const { default: emailRoutes } = await import("../routes/email.js");
  const { default: paymentRoutes, handleWebhook } = await import("../routes/stripe.js");
  const { default: examRoutes } = await import("../routes/exam.js");
  const { default: srRoutes } = await import("../routes/sr.js");
  const { default: adaptiveRoutes } = await import("../routes/adaptive.js");
  const { default: pushRoutes } = await import("../routes/push.js");
  const { default: profileRoutes } = await import("../routes/profile.js");
  const { default: placementRoutes } = await import("../routes/placement.js");

  app = express();

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "").split(",").map(s => s.trim()).filter(Boolean);
  app.use(cors(allowedOrigins.length ? {
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  } : undefined));

  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ status: "ok", env: !!process.env.SUPABASE_URL }));

  // TEMP: diagnose TEST_PRO_EMAILS resolution (remove after debugging)
  const { requireAuth, isPro } = await import("../middleware/auth.js");
  const { default: supabaseClient } = await import("../supabase.js");
  app.get("/api/debug/pro", requireAuth, async (req, res) => {
    const { data } = await supabaseClient.auth.admin.getUserById(req.user.userId);
    const email = data?.user?.email || null;
    const rawEnv = process.env.TEST_PRO_EMAILS || "";
    const parsed = rawEnv.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
    const match = email ? parsed.includes(email.toLowerCase()) : false;
    const proResult = await isPro(req.user.userId);
    // Sanity: are OTHER env vars reaching this function?
    const envProbe = {
      TEST_PRO_EMAILS_length: (process.env.TEST_PRO_EMAILS || "").length,
      TEST_FREE_EMAILS_length: (process.env.TEST_FREE_EMAILS || "").length,
      SUPABASE_URL_set: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY_set: !!process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
      VERCEL_URL: process.env.VERCEL_URL || null,
      VERCEL_GIT_COMMIT_SHA: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7),
      // List any env keys starting with TEST_ (case-insensitive)
      testKeys: Object.keys(process.env).filter(k => /^TEST/i.test(k)),
    };
    res.json({
      email,
      emailLowercase: email?.toLowerCase() || null,
      testProEmailsRaw: rawEnv,
      testProEmailsRawLength: rawEnv.length,
      testProEmailsParsed: parsed,
      matchInList: match,
      isProResult: proResult,
      envProbe,
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", progressRoutes);
  app.use("/api", exerciseRoutes);
  app.use("/api", writingRoutes);
  app.use("/api/email", emailRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/exam", examRoutes);
  app.use("/api/sr", srRoutes);
  app.use("/api", adaptiveRoutes);
  app.use("/api/push", pushRoutes);
  app.use("/api", profileRoutes);
  app.use("/api/placement", placementRoutes);

} catch (e) {
  const { default: express } = await import("express");
  app = express();
  app.use((req, res) => {
    res.status(500).json({ error: e.message, stack: e.stack });
  });
}

export default app;
