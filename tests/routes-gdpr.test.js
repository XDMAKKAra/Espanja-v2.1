// Tests for routes/gdpr.js — data export + account deletion.
// The security property under test: both endpoints act ONLY on the
// authenticated user's id (req.user.userId). There is no caller-supplied
// target, so a request can never reach another user's data even if it tries
// to smuggle one in the body.

import { describe, it, expect, beforeEach, vi } from "vitest";

const state = { exportFilters: [], deleteFilters: [], deletedAuthUser: null };

const adminClient = {
  from() {
    return {
      select() {
        return {
          eq(col, val) {
            state.exportFilters.push({ col, val });
            return Promise.resolve({ data: [{ user_id: val }], error: null });
          },
        };
      },
      delete() {
        return {
          eq(col, val) {
            state.deleteFilters.push({ col, val });
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  },
  auth: {
    admin: {
      deleteUser: async (id) => {
        state.deletedAuthUser = id;
        return { error: null };
      },
    },
  },
};

vi.mock("../supabase.js", () => ({ adminClient, default: adminClient }));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { userId: "test-user", email: "Owner@Example.test" };
    next();
  },
}));

let request, app;
beforeEach(async () => {
  state.exportFilters = [];
  state.deleteFilters = [];
  state.deletedAuthUser = null;
  if (!app) {
    const express = (await import("express")).default;
    const { default: gdprRouter } = await import("../routes/gdpr.js");
    app = express();
    app.use(express.json());
    app.use("/api/gdpr", gdprRouter);
    request = (await import("supertest")).default;
  }
});

describe("GET /api/gdpr/export", () => {
  it("returns a downloadable JSON file scoped to the caller", async () => {
    const res = await request(app).get("/api/gdpr/export");
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("attachment");
    expect(res.body.account.id).toBe("test-user");
    // Every table read filters on the authenticated user_id, nothing else.
    expect(state.exportFilters.length).toBeGreaterThan(0);
    for (const f of state.exportFilters) {
      expect(f.col).toBe("user_id");
      expect(f.val).toBe("test-user");
    }
  });
});

describe("POST /api/gdpr/delete-account", () => {
  it("deletes only the caller's rows and auth account", async () => {
    const res = await request(app).post("/api/gdpr/delete-account").send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(state.deletedAuthUser).toBe("test-user");
    for (const f of state.deleteFilters) {
      if (f.col === "user_id") expect(f.val).toBe("test-user");
      if (f.col === "email") expect(f.val).toBe("owner@example.test"); // lowercased
    }
  });

  it("ignores a smuggled target id in the body (no cross-user deletion)", async () => {
    const res = await request(app)
      .post("/api/gdpr/delete-account")
      .send({ userId: "victim-id", user_id: "victim-id", email: "victim@example.test" });
    expect(res.status).toBe(200);
    expect(state.deletedAuthUser).toBe("test-user");
    const touchedVictim = state.deleteFilters.some((f) => String(f.val).includes("victim"));
    expect(touchedVictim).toBe(false);
  });
});
