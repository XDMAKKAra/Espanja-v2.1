// Integration tests for routes/auth.js — register / login / refresh /
// forgot-password / reset-password / verify-email flows. The supabase client
// and email transport are both faked so we can exercise validation and
// happy-path success without network calls.

import { describe, it, expect, beforeEach, vi } from "vitest";

const state = {
  createUser: null,        // { data: {user:{email}}, error?: {message} }
  signIn: null,            // { data: {session:{access_token, refresh_token}, user:{email}}, error? }
  refreshSession: null,
  listUsers: { data: { users: [] } },
  updateUserById: { error: null },
  passwordResetsRow: null, // used by reset-password lookup
  emailVerificationsRow: null,
  inserted: [],
  updated: [],
  deleted: [],
};

function table(name) {
  return {
    upsert: async (row) => {
      state.inserted.push({ name, row });
      return { data: null, error: null };
    },
    select: () => ({
      eq: () => ({
        single: async () => {
          if (name === "password_resets") {
            return {
              data: state.passwordResetsRow,
              error: state.passwordResetsRow ? null : { code: "PGRST116", message: "no row" },
            };
          }
          if (name === "email_verifications") {
            return {
              data: state.emailVerificationsRow,
              error: state.emailVerificationsRow ? null : { code: "PGRST116", message: "no row" },
            };
          }
          return { data: null, error: null };
        },
      }),
    }),
    delete: () => ({
      eq: async () => {
        state.deleted.push(name);
        return { data: null, error: null };
      },
    }),
    update: (patch) => ({
      eq: async () => {
        state.updated.push({ name, patch });
        return { data: null, error: null };
      },
    }),
  };
}

vi.mock("../supabase.js", () => ({
  default: {
    auth: {
      admin: {
        createUser: vi.fn(async () => state.createUser),
        listUsers: vi.fn(async () => state.listUsers),
        updateUserById: vi.fn(async () => state.updateUserById),
      },
      signInWithPassword: vi.fn(async () => state.signIn),
      refreshSession: vi.fn(async () => state.refreshSession),
    },
    from: (name) => table(name),
  },
}));

vi.mock("../email.js", () => ({
  sendWelcomeEmail: vi.fn(async () => ({ ok: true })),
  sendPasswordResetEmail: vi.fn(async () => ({ ok: true })),
  sendPasswordChangedEmail: vi.fn(async () => ({ ok: true })),
  sendEmailVerification: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../middleware/rateLimit.js", () => {
  const pass = (_req, _res, next) => next();
  return {
    authLimiter: pass,
    registerLimiter: pass,
    forgotPasswordLimiter: pass,
    aiLimiter: pass,
    aiStrictLimiter: pass,
    reportLimiter: pass,
  };
});

let request, app;

beforeEach(async () => {
  state.createUser = null;
  state.signIn = null;
  state.refreshSession = null;
  state.listUsers = { data: { users: [] } };
  state.updateUserById = { error: null };
  state.passwordResetsRow = null;
  state.emailVerificationsRow = null;
  state.inserted = [];
  state.updated = [];
  state.deleted = [];

  if (!app) {
    const express = (await import("express")).default;
    const { default: authRouter } = await import("../routes/auth.js");
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRouter);
    request = (await import("supertest")).default;
  }
});

describe("POST /api/auth/register — validation", () => {
  it("400 when email missing", async () => {
    const res = await request(app).post("/api/auth/register").send({ password: "Abcdefg1" });
    expect(res.status).toBe(400);
  });

  it("400 when password missing", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  it("400 on password shorter than 8 characters", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Ab1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vähintään 8/);
  });

  it("400 on password missing an uppercase letter", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "abcdefg1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/iso kirjain/);
  });

  it("400 on password missing a lowercase letter", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "ABCDEFG1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/pieni kirjain/);
  });

  it("400 on password missing a digit", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Abcdefgh" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/numero/);
  });
});

describe("POST /api/auth/register — supabase failures", () => {
  it("400 'already in use' when Supabase says the email is taken", async () => {
    state.createUser = { data: null, error: { message: "User already registered" } };
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Abcdefg1" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/käytössä/);
  });

  it("500 on a generic Supabase error", async () => {
    state.createUser = { data: null, error: { message: "server exploded" } };
    const res = await request(app).post("/api/auth/register").send({ email: "a@b.com", password: "Abcdefg1" });
    expect(res.status).toBe(500);
  });
});

describe("POST /api/auth/register — happy path", () => {
  it("returns tokens + unverified email flag", async () => {
    state.createUser = { data: { user: { id: "u1", email: "a@b.com" } }, error: null };
    state.signIn = {
      data: {
        session: { access_token: "access", refresh_token: "refresh" },
        user: { email: "a@b.com" },
      },
      error: null,
    };
    const res = await request(app).post("/api/auth/register").send({ email: "A@B.COM", password: "Abcdefg1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe("access");
    expect(res.body.refreshToken).toBe("refresh");
    expect(res.body.emailVerified).toBe(false);
    expect(res.body.email).toBe("a@b.com");
    // A verification row should be upserted
    expect(state.inserted.some((i) => i.name === "email_verifications")).toBe(true);
  });
});

describe("POST /api/auth/login", () => {
  it("400 when fields missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("401 on wrong credentials", async () => {
    state.signIn = { data: null, error: { message: "invalid" } };
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "Abcdefg1" });
    expect(res.status).toBe(401);
  });

  it("returns tokens on success", async () => {
    state.signIn = {
      data: {
        session: { access_token: "a", refresh_token: "r" },
        user: { email: "a@b.com" },
      },
      error: null,
    };
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "Abcdefg1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe("a");
    expect(res.body.email).toBe("a@b.com");
  });
});

describe("POST /api/auth/refresh", () => {
  it("400 when refresh token missing", async () => {
    const res = await request(app).post("/api/auth/refresh").send({});
    expect(res.status).toBe(400);
  });

  it("401 on invalid refresh token", async () => {
    state.refreshSession = { data: null, error: { message: "expired" } };
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "x" });
    expect(res.status).toBe(401);
  });

  it("returns new tokens on success", async () => {
    state.refreshSession = {
      data: {
        session: { access_token: "new", refresh_token: "new-r" },
        user: { email: "a@b.com" },
      },
      error: null,
    };
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "old" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBe("new");
    expect(res.body.refreshToken).toBe("new-r");
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("400 when email missing", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
  });

  it("returns ok=true for a known email (and inserts a reset row)", async () => {
    state.listUsers = { data: { users: [{ id: "u1", email: "a@b.com" }] } };
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "A@B.COM" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(state.inserted.some((i) => i.name === "password_resets")).toBe(true);
  });

  it("returns ok=true for an unknown email (no enumeration), no insert", async () => {
    state.listUsers = { data: { users: [] } };
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "x@y.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(state.inserted.some((i) => i.name === "password_resets")).toBe(false);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("400 when token or newPassword missing", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({});
    expect(res.status).toBe(400);
  });

  it("re-runs the password strength validator", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({ token: "t", newPassword: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/vähintään 8/);
  });

  it("400 when token is not found", async () => {
    state.passwordResetsRow = null;
    const res = await request(app).post("/api/auth/reset-password").send({ token: "bad", newPassword: "Abcdefg1" });
    expect(res.status).toBe(400);
  });

  it("400 when token has expired (and the row is deleted)", async () => {
    state.passwordResetsRow = {
      token: "t",
      email: "a@b.com",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    };
    const res = await request(app).post("/api/auth/reset-password").send({ token: "t", newPassword: "Abcdefg1" });
    expect(res.status).toBe(400);
    expect(state.deleted).toContain("password_resets");
  });

  it("400 when the reset email no longer maps to a user", async () => {
    state.passwordResetsRow = {
      token: "t",
      email: "a@b.com",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    };
    state.listUsers = { data: { users: [] } };
    const res = await request(app).post("/api/auth/reset-password").send({ token: "t", newPassword: "Abcdefg1" });
    expect(res.status).toBe(400);
  });

  it("happy path: updates the password and removes the token", async () => {
    state.passwordResetsRow = {
      token: "t",
      email: "a@b.com",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    };
    state.listUsers = { data: { users: [{ id: "u1", email: "a@b.com" }] } };
    state.updateUserById = { error: null };
    const res = await request(app).post("/api/auth/reset-password").send({ token: "t", newPassword: "Abcdefg1" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(state.deleted).toContain("password_resets");
  });
});

describe("POST /api/auth/verify-email", () => {
  it("400 on missing token", async () => {
    const res = await request(app).post("/api/auth/verify-email").send({});
    expect(res.status).toBe(400);
  });

  it("400 on unknown token", async () => {
    state.emailVerificationsRow = null;
    const res = await request(app).post("/api/auth/verify-email").send({ token: "bad" });
    expect(res.status).toBe(400);
  });

  it("400 on expired token (and deletes the row)", async () => {
    state.emailVerificationsRow = {
      token: "t",
      email: "a@b.com",
      expires_at: new Date(Date.now() - 60_000).toISOString(),
    };
    const res = await request(app).post("/api/auth/verify-email").send({ token: "t" });
    expect(res.status).toBe(400);
    expect(state.deleted).toContain("email_verifications");
  });

  it("happy path: confirms the email and deletes the token", async () => {
    state.emailVerificationsRow = {
      token: "t",
      email: "a@b.com",
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    };
    state.listUsers = { data: { users: [{ id: "u1", email: "a@b.com" }] } };
    const res = await request(app).post("/api/auth/verify-email").send({ token: "t" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(state.deleted).toContain("email_verifications");
  });
});
