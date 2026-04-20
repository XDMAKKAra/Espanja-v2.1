// Integration tests for routes/sr.js — spaced-repetition (SM-2) endpoint.
// Mounts the real router with a scripted Supabase mock so the SM-2 math,
// response shape, and request validation are all exercised.

import { describe, it, expect, beforeEach, vi } from "vitest";

const sr = {
  existingCard: null,
  upsertRow: null,
  dueCards: [],
  countValue: 0,
  forecastRows: [],
};

// Build a chainable query object whose terminal calls resolve to scripted data.
// Every .eq / .lte / .order call returns `this`; .single, .limit, and direct
// `then` (via await) resolve with the right payload depending on what the
// caller asked for.
function makeChain({ head, selectCols }) {
  const chain = {
    _head: head,
    _selectCols: selectCols,
    eq() { return chain; },
    lte() { return chain; },
    order() { return chain; },
    limit: async () => ({ data: sr.dueCards, error: null }),
    single: async () => ({
      data: sr.existingCard,
      error: sr.existingCard ? null : { code: "PGRST116" },
    }),
    // For count endpoint (head:true) and forecast (raw-awaited)
    then(resolve) {
      if (head) return resolve({ count: sr.countValue, error: null });
      // Forecast endpoint reads next_review rows directly (awaited chain).
      return resolve({ data: sr.forecastRows, error: null });
    },
  };
  return chain;
}

vi.mock("../supabase.js", () => ({
  default: {
    from: () => ({
      select: (cols, opts) => makeChain({ head: !!opts?.head, selectCols: cols }),
      upsert: async (row) => {
        sr.upsertRow = row;
        return { data: null, error: null };
      },
    }),
  },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { userId: "test-user", email: "t@e.st" };
    next();
  },
}));

let request, app;
beforeEach(async () => {
  sr.existingCard = null;
  sr.upsertRow = null;
  sr.dueCards = [];
  sr.countValue = 0;
  sr.forecastRows = [];
  if (!app) {
    const express = (await import("express")).default;
    const { default: srRouter } = await import("../routes/sr.js");
    app = express();
    app.use(express.json());
    app.use("/api/sr", srRouter);
    request = (await import("supertest")).default;
  }
});

describe("POST /api/sr/review — validation", () => {
  it("400 on missing word", async () => {
    const res = await request(app).post("/api/sr/review").send({ grade: 4 });
    expect(res.status).toBe(400);
  });

  it("400 on missing grade", async () => {
    const res = await request(app).post("/api/sr/review").send({ word: "casa" });
    expect(res.status).toBe(400);
  });

  it("400 on grade > 5", async () => {
    const res = await request(app).post("/api/sr/review").send({ word: "casa", grade: 7 });
    expect(res.status).toBe(400);
  });

  it("400 on grade < 0", async () => {
    const res = await request(app).post("/api/sr/review").send({ word: "casa", grade: -1 });
    expect(res.status).toBe(400);
  });

  it("grade 0 is valid (failed review)", async () => {
    const res = await request(app).post("/api/sr/review").send({ word: "casa", grade: 0 });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/sr/review — SM-2 math", () => {
  it("first successful review sets repetitions=1, interval=1", async () => {
    sr.existingCard = null; // brand-new → defaults EF=2.5
    const res = await request(app).post("/api/sr/review").send({ word: "gato", grade: 4 });
    expect(res.status).toBe(200);
    expect(res.body.repetitions).toBe(1);
    expect(res.body.interval_days).toBe(1);
    expect(res.body.previousInterval).toBe(0);
    expect(res.body.intervalGrew).toBe(true);
    expect(res.body.ease_factor).toBeGreaterThanOrEqual(1.3);
  });

  it("failed grade resets repetitions and clamps interval to 1", async () => {
    sr.existingCard = { ease_factor: 2.5, interval_days: 20, repetitions: 5 };
    const res = await request(app).post("/api/sr/review").send({ word: "gato", grade: 2 });
    expect(res.body.repetitions).toBe(0);
    expect(res.body.interval_days).toBe(1);
    expect(res.body.intervalGrew).toBe(false);
  });

  it("second successful review sets interval=6", async () => {
    sr.existingCard = { ease_factor: 2.5, interval_days: 1, repetitions: 1 };
    const res = await request(app).post("/api/sr/review").send({ word: "perro", grade: 5 });
    expect(res.body.repetitions).toBe(2);
    expect(res.body.interval_days).toBe(6);
  });

  it("third+ successful review multiplies by ease factor", async () => {
    sr.existingCard = { ease_factor: 2.5, interval_days: 6, repetitions: 2 };
    const res = await request(app).post("/api/sr/review").send({ word: "perro", grade: 5 });
    expect(res.body.repetitions).toBe(3);
    // 6 * ~2.6 ≈ 16 (grade 5 bumps EF up)
    expect(res.body.interval_days).toBeGreaterThan(10);
  });

  it("ease factor is floored at 1.3", async () => {
    sr.existingCard = { ease_factor: 1.35, interval_days: 3, repetitions: 2 };
    const res = await request(app).post("/api/sr/review").send({ word: "perro", grade: 0 });
    expect(res.body.ease_factor).toBeGreaterThanOrEqual(1.3);
  });

  it("upserts the card with next_review in YYYY-MM-DD", async () => {
    sr.existingCard = null;
    await request(app).post("/api/sr/review").send({ word: "libro", grade: 4 });
    expect(sr.upsertRow).toBeTruthy();
    expect(sr.upsertRow.word).toBe("libro");
    expect(sr.upsertRow.user_id).toBe("test-user");
    expect(sr.upsertRow.next_review).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("GET /api/sr/due", () => {
  it("returns empty list when no cards are due", async () => {
    sr.dueCards = [];
    const res = await request(app).get("/api/sr/due");
    expect(res.status).toBe(200);
    expect(res.body.cards).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it("annotates cards with daysSinceLearned + reviewNumber", async () => {
    const learnedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    sr.dueCards = [
      { id: 1, word: "casa", language: "spanish", repetitions: 2, created_at: learnedAt },
    ];
    const res = await request(app).get("/api/sr/due");
    expect(res.body.cards[0].daysSinceLearned).toBe(5);
    expect(res.body.cards[0].reviewNumber).toBe(3);
  });
});

describe("GET /api/sr/count", () => {
  it("returns the due-card count", async () => {
    sr.countValue = 7;
    const res = await request(app).get("/api/sr/count");
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(7);
  });
});

describe("GET /api/sr/forecast", () => {
  const today = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };
  const plus = (n) => {
    const t = today();
    t.setDate(t.getDate() + n);
    return t.toISOString().slice(0, 10);
  };

  it("buckets due dates by day offset", async () => {
    sr.forecastRows = [
      { next_review: plus(0) },
      { next_review: plus(2) },
      { next_review: plus(2) },
      { next_review: plus(5) },
    ];
    const res = await request(app).get("/api/sr/forecast?days=7");
    expect(res.status).toBe(200);
    expect(res.body.forecast).toHaveLength(7);
    expect(res.body.forecast[0].count).toBe(1);
    expect(res.body.forecast[2].count).toBe(2);
    expect(res.body.forecast[5].count).toBe(1);
    expect(res.body.totalCards).toBe(4);
    expect(res.body.dueToday).toBe(1);
  });

  it("rolls overdue cards into day 0 (today)", async () => {
    sr.forecastRows = [{ next_review: plus(-3) }];
    const res = await request(app).get("/api/sr/forecast?days=7");
    expect(res.body.forecast[0].count).toBe(1);
    expect(res.body.dueToday).toBe(1);
  });

  it("clamps days below 7 up to 7", async () => {
    const res = await request(app).get("/api/sr/forecast?days=3");
    expect(res.body.forecast).toHaveLength(7);
  });

  it("clamps days above 60 down to 60", async () => {
    const res = await request(app).get("/api/sr/forecast?days=100");
    expect(res.body.forecast).toHaveLength(60);
  });
});
