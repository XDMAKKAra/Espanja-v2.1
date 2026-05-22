// L-RENDER-PERF-1 (2026-05-22) — guard the perf fixes for /api/dashboard/v2.
// HOME-PAINT was skeleton-only ≥5s after login because (a) loadDashboardCore
// did SELECT * on exercise_logs with no limit, and (b) login triggered two
// sequential fetches of the endpoint (loadHome + loadDashboard) with no
// shared cache. These tests fail loudly if either fix regresses.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = join(__dirname, "..");

describe("dashboard/v2 perf guardrails", () => {
  it("loadDashboardCore caps logs query to ≤500 rows", () => {
    const src = readFileSync(join(repo, "routes/dashboardV2.js"), "utf8");
    // Find the loadDashboardCore body up to the next async function header.
    const body = src.split("async function loadDashboardCore")[1]?.split("async function ")[0] || "";
    expect(body, "loadDashboardCore not found").toBeTruthy();
    const limitMatch = body.match(/\.limit\((\d+)\)/);
    expect(limitMatch, "loadDashboardCore must have a .limit() clause on logs query").toBeTruthy();
    const n = Number(limitMatch[1]);
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(500);
  });

  it("route handler caches per-user response (in-memory TTL)", () => {
    const src = readFileSync(join(repo, "routes/dashboardV2.js"), "utf8");
    expect(src).toMatch(/dashboardV2Cache/);
    expect(src).toMatch(/DASHBOARD_V2_TTL_MS/);
    // Cache check must run before the Promise.all so a hit short-circuits.
    const handlerIdx = src.indexOf('router.get("/dashboard/v2"');
    const promiseAllIdx = src.indexOf("Promise.all", handlerIdx);
    const cacheGetIdx = src.indexOf("dashboardV2CacheGet", handlerIdx);
    expect(cacheGetIdx).toBeGreaterThan(handlerIdx);
    expect(cacheGetIdx).toBeLessThan(promiseAllIdx);
  });

  it("api.js exports a coalesced fetchDashboardV2", () => {
    const src = readFileSync(join(repo, "js/api.js"), "utf8");
    expect(src).toMatch(/export async function fetchDashboardV2/);
    expect(src).toMatch(/_dashboardV2Inflight/);
  });

  it("home.js + dashboard.js both go through fetchDashboardV2 (no raw /api/dashboard/v2 fetches)", () => {
    const home = readFileSync(join(repo, "js/screens/home.js"), "utf8");
    const dash = readFileSync(join(repo, "js/screens/dashboard.js"), "utf8");
    expect(home).toMatch(/fetchDashboardV2/);
    expect(dash).toMatch(/fetchDashboardV2/);
    // Neither file should do its own apiFetch to /api/dashboard/v2 directly,
    // or we lose the in-flight coalesce on login.
    expect(home).not.toMatch(/apiFetch\([^)]*\/api\/dashboard\/v2/);
    expect(dash).not.toMatch(/apiFetch\([^)]*\/api\/dashboard\/v2[^/]/);
  });
});
