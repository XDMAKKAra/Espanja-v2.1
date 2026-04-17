import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.js";
import progressRoutes from "./routes/progress.js";
import exerciseRoutes from "./routes/exercises.js";
import writingRoutes from "./routes/writing.js";
import emailRoutes from "./routes/email.js";
import paymentRoutes, { handleWebhook } from "./routes/stripe.js";

const app = express();

// ─── CORS — restrict to allowed origins ─────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? {
  origin(origin, cb) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
} : undefined));

// LemonSqueezy webhook needs raw body — must come BEFORE express.json()
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), handleWebhook);

app.use(express.json());

// ─── Static files ───────────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ─── Health check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ─── Request logging ────────────────────────────────────────────────────────
let _reqId = 0;
app.use((req, res, next) => {
  const id = ++_reqId;
  const start = Date.now();
  req.requestId = id;
  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = { id, method: req.method, path: req.path, status: res.statusCode, duration };
    if (res.statusCode >= 500) console.error(JSON.stringify(log));
    else if (res.statusCode >= 400) console.warn(JSON.stringify(log));
  });
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api", progressRoutes);
app.use("/api", exerciseRoutes);
app.use("/api", writingRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/payments", paymentRoutes);

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
