// Integration tests for routes/push.js — web-push subscription endpoints.
// The actual VAPID config is skipped by leaving env unset; we only exercise
// the request shape + Supabase upsert/delete for subscribe/unsubscribe.

import { describe, it, expect, beforeEach, vi } from "vitest";

const state = { upserts: [], deletes: [] };

vi.mock("../supabase.js", () => ({
  default: {
    from: () => ({
      upsert: async (row) => {
        state.upserts.push(row);
        return { data: null, error: null };
      },
      delete: () => ({
        eq: () => ({
          eq: async () => {
            state.deletes.push("delete");
            return { data: null, error: null };
          },
        }),
      }),
    }),
  },
}));

vi.mock("../middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.user = { userId: "test-user", email: "t@e.st" };
    next();
  },
}));

// Neutralise web-push so setVapidDetails isn't called with garbage
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: async () => ({ statusCode: 201 }),
  },
}));

let request, app;
beforeEach(async () => {
  state.upserts = [];
  state.deletes = [];
  if (!app) {
    // Ensure we don't accidentally have VAPID keys from env
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;

    const express = (await import("express")).default;
    const { default: pushRouter } = await import("../routes/push.js");
    app = express();
    app.use(express.json());
    app.use("/api/push", pushRouter);
    request = (await import("supertest")).default;
  }
});

describe("GET /api/push/vapid-key", () => {
  it("returns the configured public key (null when unset)", async () => {
    const res = await request(app).get("/api/push/vapid-key");
    expect(res.status).toBe(200);
    expect(res.body.key).toBeNull();
  });
});

describe("POST /api/push/subscribe", () => {
  it("400 when subscription is missing", async () => {
    const res = await request(app).post("/api/push/subscribe").send({});
    expect(res.status).toBe(400);
  });

  it("400 when endpoint is missing", async () => {
    const res = await request(app).post("/api/push/subscribe").send({
      subscription: { keys: { p256dh: "a", auth: "b" } },
    });
    expect(res.status).toBe(400);
  });

  it("400 when keys are missing", async () => {
    const res = await request(app).post("/api/push/subscribe").send({
      subscription: { endpoint: "https://example.com/push/abc" },
    });
    expect(res.status).toBe(400);
  });

  it("happy path: upserts a subscription row keyed by endpoint", async () => {
    const res = await request(app).post("/api/push/subscribe").send({
      subscription: {
        endpoint: "https://example.com/push/abc",
        keys: { p256dh: "pub", auth: "authsecret" },
      },
    });
    expect(res.status).toBe(200);
    expect(state.upserts).toHaveLength(1);
    const row = state.upserts[0];
    expect(row.user_id).toBe("test-user");
    expect(row.endpoint).toBe("https://example.com/push/abc");
    expect(row.p256dh).toBe("pub");
    expect(row.auth).toBe("authsecret");
  });
});

describe("POST /api/push/unsubscribe", () => {
  it("400 when endpoint is missing", async () => {
    const res = await request(app).post("/api/push/unsubscribe").send({});
    expect(res.status).toBe(400);
  });

  it("deletes the matching row", async () => {
    const res = await request(app).post("/api/push/unsubscribe").send({ endpoint: "https://x.test/abc" });
    expect(res.status).toBe(200);
    expect(state.deletes).toHaveLength(1);
  });
});
