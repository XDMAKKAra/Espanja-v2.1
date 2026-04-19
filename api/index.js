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
