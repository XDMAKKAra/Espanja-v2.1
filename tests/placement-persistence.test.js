/**
 * Regression test for Bug 1b: diagnostic_results must persist, or status
 * will keep reporting completed:false and force users back through the
 * placement flow every login.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";

const insertMock = vi.fn();
let _nextInsertError = null;
let _diagnosticRow = null;

vi.mock("../supabase.js", () => {
  const fromStub = (table) => {
    const builder = {};
    const chain = ["select", "eq", "order", "limit"];
    chain.forEach((m) => { builder[m] = vi.fn(() => builder); });
    builder.single = vi.fn(async () => {
      if (table === "user_profile") return { data: { current_grade: "en tiedä" }, error: null };
      if (table === "diagnostic_results") return { data: _diagnosticRow, error: _diagnosticRow ? null : { code: "PGRST116" } };
      return { data: null, error: null };
    });
    builder.insert = vi.fn(async (payload) => {
      insertMock(table, payload);
      if (_nextInsertError) return { data: null, error: _nextInsertError };
      if (table === "diagnostic_results") {
        _diagnosticRow = {
          placement_level: payload.placement_level,
          chosen_level: payload.chosen_level,
          created_at: new Date().toISOString(),
        };
      }
      return { data: null, error: null };
    });
    builder.update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }));
    builder.upsert = vi.fn(async () => ({ error: null }));
    // Count query for is_retake check
    builder.then = undefined;
    Object.defineProperty(builder, "count", { value: 0, writable: true });
    return builder;
  };
  // Override so head:true count query resolves properly
  const from = vi.fn((t) => {
    const b = fromStub(t);
    const origSelect = b.select;
    b.select = vi.fn((_cols, opts) => {
      if (opts && opts.head) {
        // chainable that ultimately resolves with count
        const c = { eq: vi.fn(async () => ({ count: 0, error: null })) };
        return c;
      }
      return origSelect();
    });
    return b;
  });
  return { default: { from } };
});

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => { req.user = { userId: "test-user-id", email: "t@puheo.test" }; next(); },
}));

let app;
beforeAll(async () => {
  const express = (await import("express")).default;
  const { default: placementRoutes } = await import("../routes/placement.js");
  app = express();
  app.use(express.json());
  app.use("/api/placement", placementRoutes);
});

const validAnswers = [
  { id: "A1", selected: "A" }, { id: "A2", selected: "A" },
  { id: "B1", selected: "A" }, { id: "B2", selected: "A" },
  { id: "C1", selected: "A" }, { id: "C2", selected: "A" },
  { id: "M1", selected: "A" }, { id: "M2", selected: "A" },
];

describe("POST /api/placement/submit — persistence", () => {
  it("inserts a diagnostic_results row and status then reports completed:true", async () => {
    insertMock.mockClear();
    _nextInsertError = null;
    _diagnosticRow = null;

    const submit = await request(app).post("/api/placement/submit").send({ answers: validAnswers });
    expect(submit.status).toBe(200);
    expect(submit.body.placementLevel).toBeDefined();

    const diagInsert = insertMock.mock.calls.find(c => c[0] === "diagnostic_results");
    expect(diagInsert).toBeDefined();
    expect(diagInsert[1].user_id).toBe("test-user-id");

    const status = await request(app).get("/api/placement/status");
    expect(status.status).toBe(200);
    expect(status.body.completed).toBe(true);
  });

  it("returns 500 (not silent 200) when diagnostic_results insert fails", async () => {
    _nextInsertError = { code: "42501", message: "new row violates row-level security policy" };
    _diagnosticRow = null;
    const res = await request(app).post("/api/placement/submit").send({ answers: validAnswers });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/kartoituksen tallennus/i);
  });
});
