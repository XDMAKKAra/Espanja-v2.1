/**
 * Regression test for Bug 1: onboarding_completed must persist.
 *
 * The live bug was a silent `catch {}` in the client swallowing profile-save
 * failures. These tests guard the server contract so future regressions show
 * up as failing tests, not user screenshots.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

// Keep supabase controllable per-test via the mock registered here.
const upsertMock = vi.fn();
const selectSingleMock = vi.fn();

vi.mock("../supabase.js", () => {
  const fromStub = () => {
    const builder = {};
    const chain = ["select", "eq"];
    chain.forEach((m) => { builder[m] = vi.fn(() => builder); });
    builder.single = vi.fn(() => selectSingleMock());
    builder.upsert = vi.fn((payload, opts) => {
      upsertMock(payload, opts);
      return {
        select: () => ({ single: async () => ({ data: payload, error: null }) }),
      };
    });
    return builder;
  };
  return { default: { from: vi.fn(fromStub) } };
});

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => { req.user = { userId: "test-user-id", email: "t@puheo.test" }; next(); },
}));

let app;
beforeAll(async () => {
  const express = (await import("express")).default;
  const { default: profileRoutes } = await import("../routes/profile.js");
  app = express();
  app.use(express.json());
  app.use("/api", profileRoutes);
});

describe("POST /api/profile — onboarding persistence", () => {
  it("persists onboarding_completed=true to the user_profile row", async () => {
    upsertMock.mockClear();
    const res = await request(app).post("/api/profile").send({
      current_grade: "M",
      target_grade: "M",
      exam_date: "2026-03-15",
      weak_areas: ["grammar"],
      strong_areas: [],
      weekly_goal_minutes: 140,
      preferred_session_length: 20,
      onboarding_completed: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(upsertMock).toHaveBeenCalledOnce();
    const [payload] = upsertMock.mock.calls[0];
    expect(payload.user_id).toBe("test-user-id");
    expect(payload.onboarding_completed).toBe(true);
    expect(payload.completed_at).toBeTypeOf("string");
  });

  it("GET /api/profile returns onboarding_completed=true after persistence", async () => {
    selectSingleMock.mockResolvedValueOnce({
      data: { user_id: "test-user-id", onboarding_completed: true },
      error: null,
    });
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(200);
    expect(res.body.profile.onboarding_completed).toBe(true);
  });

  it("returns 400 (not silent 200) on invalid target_grade so client sees the failure", async () => {
    const res = await request(app).post("/api/profile").send({
      target_grade: "Z",
      onboarding_completed: true,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tavoitearvosana/i);
  });
});
