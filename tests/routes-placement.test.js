// Integration tests for routes/placement.js — server-side grading and
// persistence of the diagnostic quiz. Validates the contract that client
// answers are graded server-side against the question bank (so clients can
// never see correct answers), and that insert failures surface as 500s.

import { describe, it, expect, beforeEach, vi } from "vitest";

const state = {
  profile: null,
  insertDiagnosticError: null,
  diagnosticCount: 0,
  latestRow: null,
  captured: { upserts: [], updates: [], inserts: [] },
};

function table(name) {
  return {
    select: (_cols, opts) => {
      if (name === "diagnostic_results" && opts?.head) {
        return {
          eq: async () => ({ count: state.diagnosticCount, error: null }),
        };
      }
      if (name === "diagnostic_results") {
        return {
          eq: () => ({
            order: () => ({
              limit: () => ({
                single: async () => ({
                  data: state.latestRow,
                  error: state.latestRow ? null : { code: "PGRST116" },
                }),
              }),
            }),
            single: async () => ({
              data: state.latestRow,
              error: state.latestRow ? null : { code: "PGRST116" },
            }),
          }),
        };
      }
      if (name === "user_profile") {
        return {
          eq: () => ({
            single: async () => ({
              data: state.profile,
              error: state.profile ? null : { code: "PGRST116" },
            }),
          }),
        };
      }
      return { eq: () => ({ single: async () => ({ data: null, error: null }) }) };
    },
    insert: async (row) => {
      state.captured.inserts.push({ name, row });
      if (name === "diagnostic_results" && state.insertDiagnosticError) {
        return { data: null, error: state.insertDiagnosticError };
      }
      return { data: null, error: null };
    },
    update: (patch) => ({
      eq: async () => {
        state.captured.updates.push({ name, patch });
        return { data: null, error: null };
      },
    }),
    upsert: async (row) => {
      state.captured.upserts.push({ name, row });
      return { data: null, error: null };
    },
  };
}

vi.mock("../supabase.js", () => ({
  default: { from: (name) => table(name) },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { userId: "test-user", email: "t@e.st" };
    next();
  },
}));

let request, app, PLACEMENT_QUESTIONS;
beforeEach(async () => {
  state.profile = null;
  state.insertDiagnosticError = null;
  state.diagnosticCount = 0;
  state.latestRow = null;
  state.captured = { upserts: [], updates: [], inserts: [] };

  if (!app) {
    const express = (await import("express")).default;
    const { default: placementRouter } = await import("../routes/placement.js");
    const pq = await import("../lib/placementQuestions.js");
    PLACEMENT_QUESTIONS = pq.PLACEMENT_QUESTIONS;
    app = express();
    app.use(express.json());
    app.use("/api/placement", placementRouter);
    request = (await import("supertest")).default;
  }
});

describe("GET /api/placement/questions", () => {
  it("strips correct answers from the payload", async () => {
    const res = await request(app).get("/api/placement/questions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.questions)).toBe(true);
    for (const q of res.body.questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("options");
      expect(q).not.toHaveProperty("correct");
      expect(q).not.toHaveProperty("explanation");
    }
  });
});

describe("POST /api/placement/submit", () => {
  it("400 when answers array is missing or empty", async () => {
    const missing = await request(app).post("/api/placement/submit").send({});
    const empty = await request(app).post("/api/placement/submit").send({ answers: [] });
    expect(missing.status).toBe(400);
    expect(empty.status).toBe(400);
  });

  it("grades answers server-side using the question bank", async () => {
    // Grab 8 real questions spanning all 4 levels
    const byLevel = { A: [], B: [], C: [], M: [] };
    for (const q of PLACEMENT_QUESTIONS) byLevel[q.level]?.push(q);
    const pool = [...byLevel.A.slice(0, 2), ...byLevel.B.slice(0, 2), ...byLevel.C.slice(0, 2), ...byLevel.M.slice(0, 2)];
    // Submit the correct answer for each question — client sends only id + selected
    const clientAnswers = pool.map((q) => ({ id: q.id, selected: q.correct }));

    const res = await request(app).post("/api/placement/submit").send({ answers: clientAnswers });
    expect(res.status).toBe(200);
    expect(res.body.totalCorrect).toBe(8);
    expect(res.body.totalQuestions).toBe(8);
    expect(res.body.placementLevel).toBe("M");
    // Each returned answer has server-side correctAnswer + explanation (hidden in GET)
    for (const a of res.body.answers) {
      expect(a).toHaveProperty("correctAnswer");
      expect(a).toHaveProperty("explanation");
      expect(a.correct).toBe(true);
    }
  });

  it("cannot cheat by sending 'correct:true' in the body", async () => {
    const q = PLACEMENT_QUESTIONS[0];
    const wrong = q.correct === "A" ? "B" : "A";
    const clientAnswers = [{ id: q.id, selected: wrong, correct: true }];
    const res = await request(app).post("/api/placement/submit").send({ answers: clientAnswers });
    expect(res.status).toBe(200);
    expect(res.body.answers[0].correct).toBe(false);
  });

  it("drops answers whose id is unknown", async () => {
    const clientAnswers = [{ id: "NOT-A-REAL-ID", selected: "A" }];
    const res = await request(app).post("/api/placement/submit").send({ answers: clientAnswers });
    expect(res.status).toBe(200);
    expect(res.body.totalQuestions).toBe(0);
  });

  it("500 when the diagnostic insert fails", async () => {
    state.insertDiagnosticError = { code: "23505", message: "bang", details: null, hint: null };
    const q = PLACEMENT_QUESTIONS[0];
    const res = await request(app).post("/api/placement/submit").send({
      answers: [{ id: q.id, selected: q.correct }],
    });
    expect(res.status).toBe(500);
  });

  it("marks isRetake=true when the user has a prior diagnostic row", async () => {
    state.diagnosticCount = 3;
    const q = PLACEMENT_QUESTIONS[0];
    const res = await request(app).post("/api/placement/submit").send({
      answers: [{ id: q.id, selected: q.correct }],
    });
    expect(res.body.isRetake).toBe(true);
  });
});

describe("POST /api/placement/choose-level", () => {
  it("400 on an invalid level", async () => {
    const res = await request(app).post("/api/placement/choose-level").send({ level: "Z" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid level and updates profile + level progress", async () => {
    state.latestRow = { id: "diag-1" };
    const res = await request(app).post("/api/placement/choose-level").send({ level: "C" });
    expect(res.status).toBe(200);
    expect(res.body.level).toBe("C");
    const profileUpdate = state.captured.updates.find((u) => u.name === "user_profile");
    expect(profileUpdate.patch.current_grade).toBe("C");
    // Two modes get level-progress upserts
    const modeUpserts = state.captured.upserts.filter((u) => u.name === "user_level_progress");
    expect(modeUpserts).toHaveLength(2);
  });
});

describe("GET /api/placement/status", () => {
  it("reports completed=false for a user with no diagnostic", async () => {
    state.latestRow = null;
    const res = await request(app).get("/api/placement/status");
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(false);
    expect(res.body.placementLevel).toBeNull();
  });

  it("reports completed=true with chosen + placement levels", async () => {
    state.latestRow = {
      placement_level: "B",
      chosen_level: "A",
      created_at: "2025-01-15T00:00:00Z",
    };
    const res = await request(app).get("/api/placement/status");
    expect(res.body.completed).toBe(true);
    expect(res.body.placementLevel).toBe("B");
    expect(res.body.chosenLevel).toBe("A");
  });
});
