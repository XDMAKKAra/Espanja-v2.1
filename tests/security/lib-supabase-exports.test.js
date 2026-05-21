// @vitest-environment node
//
// Smoke test for lib/supabase.js — confirms the exports the rest of
// the codebase relies on are present and shaped correctly.

import { describe, it, expect } from "vitest";
import { adminClient, createUserClient } from "../../lib/supabase.js";

describe("lib/supabase.js exports", () => {
  it("exports adminClient when env is configured", () => {
    if (process.env.SUPABASE_URL) {
      expect(adminClient).not.toBeNull();
      expect(typeof adminClient.from).toBe("function");
      expect(typeof adminClient.auth?.getUser).toBe("function");
    } else {
      expect(adminClient).toBeNull();
    }
  });

  it("createUserClient(jwt) returns a client when env is configured", () => {
    if (!process.env.SUPABASE_URL) return;
    const client = createUserClient("fake-jwt-token");
    expect(client).not.toBeNull();
    expect(typeof client.from).toBe("function");
  });

  it("createUserClient(null) falls back to adminClient", () => {
    const client = createUserClient(null);
    expect(client).toBe(adminClient);
  });
});

describe("supabase.js compat shim", () => {
  it("re-exports adminClient as default + named exports", async () => {
    const mod = await import("../../supabase.js");
    expect(mod.default).toBe(adminClient);
    expect(mod.adminClient).toBe(adminClient);
    expect(mod.createUserClient).toBe(createUserClient);
  });
});
