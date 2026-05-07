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
  const { default: configRoutes } = await import("../routes/config.js");
  const { default: placementRoutes } = await import("../routes/placement.js");
  const { default: curriculumRoutes } = await import("../routes/curriculum.js");
  const { default: statusRoutes } = await import("../routes/status.js");
  const { default: dashboardV2Routes } = await import("../routes/dashboardV2.js");
  const { default: onboardingRoutes } = await import("../routes/onboarding.js");
  const { waitlistLimiter } = await import("../middleware/rateLimit.js");
  const { default: supabase } = await import("../supabase.js");

  app = express();

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "").split(",").map(s => s.trim()).filter(Boolean);
  app.use(cors(allowedOrigins.length ? {
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  } : undefined));

  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleWebhook);
  app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);
  app.use(express.json());

  app.get("/api/health", (req, res) => res.json({ status: "ok", env: !!process.env.SUPABASE_URL }));

  app.use("/api/auth", authRoutes);
  app.use("/api", progressRoutes);
  app.use("/api", exerciseRoutes);
  app.use("/api", writingRoutes);
  app.use("/api/email", emailRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/stripe", paymentRoutes);
  app.use("/api/exam", examRoutes);
  app.use("/api/sr", srRoutes);
  app.use("/api", adaptiveRoutes);
  app.use("/api/push", pushRoutes);
  app.use("/api", profileRoutes);
  app.use("/api/placement", placementRoutes);
  app.use("/api/curriculum", curriculumRoutes);
  app.use("/api/config", configRoutes);
  app.use("/api/dev", configRoutes);
  app.use("/api/status", statusRoutes);
  // L-LIVE-AUDIT-P2 UPDATE 3 — batched dashboard endpoint at /api/dashboard/v2.
  app.use("/api", dashboardV2Routes);
  app.use("/api/onboarding", onboardingRoutes);

  app.post("/api/waitlist", waitlistLimiter, async (req, res) => {
    const { email, product } = req.body;
    if (!email || !product) return res.status(400).json({ error: "Email ja tuote vaaditaan" });
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) return res.status(400).json({ error: "Tarkista sähköpostiosoite" });
    try {
      const { error } = await supabase
        .from("waitlist")
        .upsert({ email: email.toLowerCase().trim(), product }, { onConflict: "email,product" });
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      console.error("Waitlist error:", err);
      res.status(500).json({ error: "Jokin meni pieleen" });
    }
  });

} catch (e) {
  const { default: express } = await import("express");
  app = express();
  app.use((req, res) => {
    res.status(500).json({ error: e.message, stack: e.stack });
  });
}

export default app;
