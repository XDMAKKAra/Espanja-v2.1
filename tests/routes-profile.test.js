// Integration tests for routes/profile.js — exercises the large validation
// block on POST /api/profile (grades, target grades, weak/strong areas,
// overlap rule) and the mastery-seed guardrails.

import { describe, it, expect, beforeEach, vi } from "vitest";

const state = {
  profile: null,
  selectError: null,
  upsertResult: { data: { user_id: "test-user" }, error: null },
  masteryUpserts: [],
};

vi.mock("../supabase.js", () => ({
  default: {
    from: (name) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: state.profile, error: state.selectError }),
        }),
      }),
      upsert: (rows) => {
        if (name === "user_mastery") {
          state.masteryUpserts.push(rows);
          return { data: null, error: null };
        }
        return {
          select: () => ({
            single: async () => state.upsertResult,
          }),
        };
      },
    }),
  },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { userId: "test-user", email: "t@e.st" };
    next();
  },
  isPro: async () => false,
  isTestProEmail: () => false,
  getUserTier: async () => null,
}));

let request, app;
beforeEach(async () => {
  state.profile = null;
  state.selectError = null;
  state.upsertResult = { data: { user_id: "test-user" }, error: null };
  state.masteryUpserts = [];

  if (!app) {
    const express = (await import("express")).default;
    const { default: profileRouter } = await import("../routes/profile.js");
    app = express();
    app.use(express.json());
    app.use("/api", profileRouter);
    request = (await import("supertest")).default;
  }
});

describe("GET /api/profile", () => {
  it("returns the profile when one exists", async () => {
    state.profile = { user_id: "test-user", current_grade: "B" };
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(200);
    expect(res.body.profile.current_grade).toBe("B");
  });

  it("returns null profile for PGRST116 (no row)", async () => {
    state.profile = null;
    state.selectError = { code: "PGRST116", message: "no rows" };
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeNull();
  });

  it("500 on a generic Supabase error", async () => {
    state.profile = null;
    state.selectError = { code: "OTHER", message: "disconnected" };
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(500);
  });
});

describe("POST /api/profile — validation", () => {
  it("rejects an invalid current_grade", async () => {
    const res = await request(app).post("/api/profile").send({ current_grade: "Z" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nykyinen arvosana/);
  });

  it("rejects an invalid target_grade", async () => {
    // L-PLAN-6 — A and I joined the valid I..L ladder, so use a value
    // outside the ladder ("Z") to assert the validator still rejects.
    const res = await request(app).post("/api/profile").send({ target_grade: "Z" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/tavoitearvosana/);
  });

  it("accepts target_grade = A (within the L-PLAN-6 ladder)", async () => {
    state.upsertResult = { data: { user_id: "test-user", target_grade: "A" }, error: null };
    const res = await request(app).post("/api/profile").send({ target_grade: "A" });
    expect(res.status).toBe(200);
  });

  it("rejects spanish_courses_completed outside 1–8", async () => {
    const res = await request(app).post("/api/profile").send({ spanish_courses_completed: 9 });
    expect(res.status).toBe(400);
  });

  it("rejects non-integer spanish_courses_completed", async () => {
    const res = await request(app).post("/api/profile").send({ spanish_courses_completed: 3.5 });
    expect(res.status).toBe(400);
  });

  it("rejects spanish_grade_average outside 4–10", async () => {
    const res = await request(app).post("/api/profile").send({ spanish_grade_average: 11 });
    expect(res.status).toBe(400);
  });

  it("rejects an unknown study_background", async () => {
    const res = await request(app).post("/api/profile").send({ study_background: "yliopisto" });
    expect(res.status).toBe(400);
  });

  it("rejects a non-array weak_areas", async () => {
    const res = await request(app).post("/api/profile").send({ weak_areas: "grammar" });
    expect(res.status).toBe(400);
  });

  it("rejects unknown entries inside weak_areas", async () => {
    const res = await request(app).post("/api/profile").send({ weak_areas: ["grammar", "bogus"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/bogus/);
  });

  it("rejects strong_areas with more than 3 entries", async () => {
    const res = await request(app).post("/api/profile").send({
      strong_areas: ["grammar", "vocabulary", "pronouns", "writing"],
    });
    expect(res.status).toBe(400);
  });

  it("rejects 'unknown' inside strong_areas (valid only in weak_areas)", async () => {
    const res = await request(app).post("/api/profile").send({ strong_areas: ["unknown"] });
    expect(res.status).toBe(400);
  });

  it("rejects overlap between weak_areas and strong_areas", async () => {
    const res = await request(app).post("/api/profile").send({
      weak_areas: ["grammar", "writing"],
      strong_areas: ["grammar"],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/heikkous ja vahvuus/);
  });

  it("rejects an unknown referral_source", async () => {
    const res = await request(app).post("/api/profile").send({ referral_source: "billboard" });
    expect(res.status).toBe(400);
  });

  it("happy path: saves a valid profile", async () => {
    state.upsertResult = {
      data: { user_id: "test-user", current_grade: "B", onboarding_completed: true },
      error: null,
    };
    const res = await request(app).post("/api/profile").send({
      current_grade: "B",
      target_grade: "L",
      spanish_courses_completed: 3,
      weak_areas: ["grammar"],
      strong_areas: ["vocabulary"],
      onboarding_completed: true,
    });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.profile.current_grade).toBe("B");
  });

  it("500 surfaces debug info when the upsert fails", async () => {
    state.upsertResult = {
      data: null,
      error: { code: "23503", message: "fk violation", details: "x", hint: "y" },
    };
    const res = await request(app).post("/api/profile").send({ current_grade: "B" });
    expect(res.status).toBe(500);
    expect(res.body.debug_code).toBe("23503");
    expect(Array.isArray(res.body.debug_fields)).toBe(true);
  });
});

describe("POST /api/profile/mastery-seed", () => {
  it("400 when mastery is not an array", async () => {
    const res = await request(app).post("/api/profile/mastery-seed").send({ mastery: "oops" });
    expect(res.status).toBe(400);
  });

  it("400 when array has more than 20 entries", async () => {
    const many = Array.from({ length: 21 }, () => ({ topic_key: "present_regular", best_pct: 1 }));
    const res = await request(app).post("/api/profile/mastery-seed").send({ mastery: many });
    expect(res.status).toBe(400);
  });

  it("skips entries with unknown topic_key", async () => {
    const res = await request(app).post("/api/profile/mastery-seed").send({
      mastery: [{ topic_key: "made_up", best_pct: 1.0 }],
    });
    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(0);
  });

  it("skips entries below 0.5 correctness (normal unlock chain handles those)", async () => {
    const res = await request(app).post("/api/profile/mastery-seed").send({
      mastery: [{ topic_key: "present_regular", best_pct: 0.2 }],
    });
    expect(res.body.inserted).toBe(0);
  });

  it("inserts an available row for valid high-confidence entries (but does not credit mastery)", async () => {
    const res = await request(app).post("/api/profile/mastery-seed").send({
      mastery: [
        { topic_key: "present_regular", best_pct: 1.0 },
        { topic_key: "preterite", best_pct: 0.9 },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.inserted).toBe(2);
    const inserted = state.masteryUpserts[0];
    for (const row of inserted) {
      expect(row.status).toBe("available");
      expect(row.best_pct).toBe(0); // never credits mastery from a 1-question diagnostic
    }
  });
});
