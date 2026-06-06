// L-V398 P0 — proves the kartoitus does NOT re-trigger once finished.
//
// Deterministic: injects a fake auth token and mocks every /api/** call, so it
// needs only the static server (no live Supabase / no DB writes). It controls
// the server's view of profile.onboarding_completed via a closure flag and
// walks the V4 flow (skip path) to the summary "start" step, where the fix
// posts onboarding_completed:true. It then reloads and asserts the gate
// (checkOnboarding) no longer shows the kartoitus.
//
// Run (server must be up on localhost:3000):
//   node tests/verify-v398-retrigger.mjs
import { chromium } from "playwright";

const BASE = process.env.VERIFY_BASE || "http://localhost:3000";

const run = async () => {
  let completed = false;          // server-side onboarding_completed, flips on POST
  let capturedComplete = false;   // did the flow POST onboarding_completed:true?

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Pretend a logged-in user. isLoggedIn() only checks the token's presence.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_token", "verify-fake-token");
      localStorage.setItem("puheo_refresh_token", "verify-fake-refresh");
      localStorage.setItem("puheo_email", "verify@puheo.fi");
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo:lang", "es");
    } catch {}
  });

  // Mock the whole API surface the flow touches.
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    if (url.includes("/api/profile")) {
      if (method === "POST") {
        let body = {};
        try { body = JSON.parse(req.postData() || "{}"); } catch {}
        if (body.onboarding_completed === true) {
          capturedComplete = true;
          completed = true;
        }
        return route.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify({ ok: true, profile: { onboarding_completed: true } }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ profile: { onboarding_completed: completed, target_language: "es", current_grade: "B" } }) });
    }

    if (url.includes("/api/dashboard/v2")) {
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ ok: true, profile: { onboarding_completed: completed }, streak: {}, today: {}, placement: { completed: true } }) });
    }

    // Everything else (diagnostic complete/courses/biography, personalization,
    // user-level, etc.) → benign 200.
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  const errors = [];
  page.on("pageerror", (e) => errors.push(`UNCAUGHT: ${e.message}`));

  const activeId = () => page.evaluate(() => document.querySelector(".screen.active")?.id || null);
  const clickWait = async (sel, nextSel) => {
    await page.waitForSelector(sel, { state: "visible", timeout: 8000 });
    await page.click(sel);
    if (nextSel) await page.waitForSelector(nextSel, { state: "visible", timeout: 8000 });
  };

  const results = [];
  const assert = (label, cond) => { results.push({ label, ok: !!cond }); };

  // ── 1) Boot: flag false → kartoitus must appear ─────────────────────────────
  await page.goto(`${BASE}/app.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const firstActive = await activeId();
  assert("kartoitus appears when onboarding_completed=false (#screen-ob-v4-intro active)",
    firstActive === "screen-ob-v4-intro");

  // ── 2) Walk the skip path to the results "start" step ───────────────────────
  await clickWait("#ob-v4-intro-skip", "#screen-ob-v4-courses.active");
  await clickWait("#ob-v4-courses-continue", "#screen-ob-v4-biography.active");
  await clickWait("#ob-v4-bio-continue", "#screen-ob-v4-summary.active");
  // Summary "start" (logged-in) → markOnboardingComplete() posts the flag.
  await clickWait("#ob-v4-summary-start", "#screen-ob-v4-choice.active");
  await page.waitForTimeout(400);
  assert("flow POSTed onboarding_completed:true at results step", capturedComplete);

  // ── 3) Reload: flag now true → kartoitus must NOT reappear ───────────────────
  await page.goto(`${BASE}/app.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const afterReload = await activeId();
  assert("kartoitus does NOT reappear after completion (intro not active)",
    afterReload !== "screen-ob-v4-intro");
  assert("no ob-v4 screen is active after reload",
    !String(afterReload || "").startsWith("screen-ob-v4-"));
  assert("legacy placement test does NOT fire after completion",
    afterReload !== "screen-placement-test" && afterReload !== "screen-placement-intro");

  await browser.close();

  // ── Report ──────────────────────────────────────────────────────────────────
  console.log(`\nL-V398 re-trigger verification (${BASE})\n`);
  let pass = 0;
  for (const r of results) {
    console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.label}`);
    if (r.ok) pass++;
  }
  console.log(`\n  active after walk-start step recorded; first=${firstActive}, afterReload=${afterReload}`);
  if (errors.length) {
    console.log(`\n  ${errors.length} uncaught page error(s):`);
    errors.slice(0, 5).forEach((e) => console.log(`    - ${e}`));
  }
  console.log(`\n  ${pass}/${results.length} checks passed\n`);
  process.exit(pass === results.length ? 0 : 1);
};

run().catch((e) => { console.error(e); process.exit(1); });
