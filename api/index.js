import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const { default: authRoutes } = await import("../routes/auth.js");
const { default: progressRoutes } = await import("../routes/progress.js");
const { default: exerciseRoutes } = await import("../routes/exercises.js");
const { default: writingRoutes } = await import("../routes/writing.js");
const { default: emailRoutes } = await import("../routes/email.js");
const { default: paymentRoutes, handleWebhook } = await import("../routes/stripe.js");

const app = express();

// ─── CORS — restrict to allowed origins ─────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? {
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
} : undefined));

// Webhook needs raw body — must come BEFORE express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

// ─── Health check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api", progressRoutes);
app.use("/api", exerciseRoutes);
app.use("/api", writingRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/payments", paymentRoutes);

export default app;
