/**
 * Guards Pass 0.6 — manual taso-picker is gone; level now comes from
 * GET /api/user-level, which resolves to (in order):
 *   1. user_level_progress.current_level
 *   2. diagnostic_results.chosen_level || placement_level
 *   3. Mode-specific default (B vocab, C grammar/reading).
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

let _levelProgressRow = null;
let _diagnosticRow = null;

vi.mock("../supabase.js", () => {
  const fromStub = (table) => {
    const builder = {};
    const chain = ["select", "eq", "order", "limit"];
    chain.forEach((m) => { builder[m] = vi.fn(() => builder); });
    builder.maybeSingle = vi.fn(async () => {
      if (table === "user_level_progress") return { data: _levelProgressRow, error: null };
      if (table === "diagnostic_results") return { data: _diagnosticRow, error: null };
      return { data: null, error: null };
    });
    builder.single = builder.maybeSingle;
    return builder;
  };
  return { default: { from: vi.fn(fromStub) } };
});

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => { req.user = { userId: "test-user", email: "t@puheo.test" }; next(); },
  isPro: async () => true,
}));

let app;
beforeAll(async () => {
  const express = (await import("express")).default;
  const { default: progressRoutes } = await import("../routes/progress.js");
  app = express();
  app.use(express.json());
  app.use("/api", progressRoutes);
});

function resetState() {
  _levelProgressRow = null;
  _diagnosticRow = null;
}

describe("GET /api/user-level — resolution order", () => {
  it("1. uses user_level_progress.current_level when present", async () => {
    resetState();
    _levelProgressRow = { current_level: "C" };
    const res = await request(app).get("/api/user-level?mode=vocab&topic=ser_estar");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ mode: "vocab", level: "C", source: "level_progress" });
  });

  it("2. falls back to diagnostic_results when no level_progress row", async () => {
    resetState();
    _diagnosticRow = { placement_level: "E", chosen_level: null };
    const res = await request(app).get("/api/user-level?mode=grammar");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ mode: "grammar", level: "E", source: "placement" });
  });

  it("2b. chosen_level wins over placement_level", async () => {
    resetState();
    _diagnosticRow = { placement_level: "C", chosen_level: "M" };
    const res = await request(app).get("/api/user-level?mode=reading");
    expect(res.body.level).toBe("M");
  });

  it("3. falls back to mode default B when neither exists (vocab)", async () => {
    resetState();
    const res = await request(app).get("/api/user-level?mode=vocab");
    expect(res.body).toMatchObject({ level: "B", source: "default" });
  });

  it("3. falls back to mode default C when neither exists (grammar)", async () => {
    resetState();
    const res = await request(app).get("/api/user-level?mode=grammar");
    expect(res.body).toMatchObject({ level: "C", source: "default" });
  });

  it("3. falls back to mode default C when neither exists (reading)", async () => {
    resetState();
    const res = await request(app).get("/api/user-level?mode=reading");
    expect(res.body).toMatchObject({ level: "C", source: "default" });
  });

  it("rejects unknown mode with 400", async () => {
    resetState();
    const res = await request(app).get("/api/user-level?mode=bogus");
    expect(res.status).toBe(400);
  });
});

/**
 * Guard against regression: no manual level picker should exist in app.html
 * EXCEPT the verbsprint duration picker (different purpose, same CSS class).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appHtml = readFileSync(resolve(__dirname, "..", "app.html"), "utf8");

describe("app.html — no active level-picker buttons remain", () => {
  it("the 3 mode-page level pickers are gone", () => {
    expect(appHtml).not.toMatch(/<div\s+class="level-picker"\s+id="vocab-page-level-picker"/);
    expect(appHtml).not.toMatch(/<div\s+class="level-picker"\s+id="grammar-page-level-picker"/);
    expect(appHtml).not.toMatch(/<div\s+class="level-picker"\s+id="reading-page-level-picker"/);
  });

  it("verbsprint duration picker survives (different purpose)", () => {
    expect(appHtml).toMatch(/id="verbsprint-duration-picker"/);
    expect(appHtml).toMatch(/data-duration=/);
  });

  it("no lvl-btn with data-level remains (verbsprint data-duration is fine)", () => {
    // Legacy pickers leave behind empty hidden divs with the id preserved
    // for any orphan querySelector, but no .lvl-btn[data-level] children.
    const dataLevelBtns = (appHtml.match(/<button[^>]*class="lvl-btn[^"]*"[^>]*data-level=/g) || []).length;
    expect(dataLevelBtns).toBe(0);
  });
});
