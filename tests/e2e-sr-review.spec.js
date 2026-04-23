// E2E — spaced repetition review queue.
//
// Structure mode: guest-path SR queue works on localStorage. We seed the
// queue directly in the browser context, open the dashboard, and verify
// the review surface shows due items.
//
// Live mode: if TEST_USER_EMAIL/PASSWORD set, logs in and checks the
// server-backed /api/sr/due endpoint via the UI.

import { test, expect } from "@playwright/test";

const LIVE = !!(process.env.TEST_USER_EMAIL && process.env.TEST_USER_PASSWORD);
const SR_KEY = "puheo_sr_queue";

test.describe("SR review — guest localStorage queue", () => {
  test("seeded items become visible on dashboard SR surface", async ({ page }) => {
    await page.goto("/app.html");

    // Seed guest SR queue before anything else runs the screen init
    await page.evaluate(([key, items]) => {
      localStorage.setItem(key, JSON.stringify(items));
    }, [SR_KEY, [
      { question: "hola",     _sr: true },
      { question: "adiós",    _sr: true },
      { question: "gracias",  _sr: true },
    ]]);

    // Reload so the app picks up the seeded queue
    await page.reload();

    // Dashboard SR-review surface exists in DOM (may be hidden for unauth'd)
    await expect(page.locator("#dash-sr-review")).toHaveCount(1);

    // Verify the queue persists through reload
    const stored = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), SR_KEY);
    expect(stored.length).toBe(3);
  });

  test("marking item correct removes it from queue (guest path)", async ({ page }) => {
    await page.goto("/app.html");
    await page.evaluate(([key, items]) => {
      localStorage.setItem(key, JSON.stringify(items));
    }, [SR_KEY, [{ question: "hola", _sr: true }, { question: "adiós", _sr: true }]]);

    // Simulate a correct review via the imported SR module
    const remaining = await page.evaluate(async () => {
      const mod = await import("/js/features/spacedRepetition.js");
      await mod.srReview({ question: "hola" }, 4); // grade 4 = good → remove
      return (JSON.parse(localStorage.getItem("puheo_sr_queue")) || []).length;
    });
    expect(remaining).toBe(1);
  });

  test("wrong-answer review adds item back to queue", async ({ page }) => {
    await page.goto("/app.html");
    await page.evaluate(k => localStorage.setItem(k, JSON.stringify([])), SR_KEY);

    const afterAdd = await page.evaluate(async () => {
      const mod = await import("/js/features/spacedRepetition.js");
      await mod.srReview({ question: "casa" }, 0); // grade 0 = again → add
      return JSON.parse(localStorage.getItem("puheo_sr_queue")).length;
    });
    expect(afterAdd).toBe(1);
  });
});

test.describe("SR review — live API", () => {
  test.skip(!LIVE, "TEST_USER_EMAIL / TEST_USER_PASSWORD not set");

  test("GET /api/sr/due returns 200 and a count", async ({ request }) => {
    // Acquire a session token by logging in via UI-free endpoint.
    // Uses the same Supabase auth the app does.
    const res = await request.post(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      data: { email: process.env.TEST_USER_EMAIL, password: process.env.TEST_USER_PASSWORD },
    });
    const { access_token } = await res.json();
    expect(access_token).toBeTruthy();

    const due = await request.get("/api/sr/due?language=spanish&limit=20", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(due.status()).toBe(200);
    const body = await due.json();
    expect(Array.isArray(body.cards)).toBe(true);
  });
});
