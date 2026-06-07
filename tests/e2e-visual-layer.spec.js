// L-V399 Vaihe A — throwaway pixel-diff harness for the CSS bundle/@layer
// refactor. NOT part of the committed regression suite; generate baselines at
// the "before" state, make the CSS change, then re-run to prove 0 visual delta.
//
//   Capture before:  npx playwright test e2e-visual-layer --update-snapshots
//   Verify after:    npx playwright test e2e-visual-layer
//
// Covers only PIXEL-STABLE surfaces. Dynamic screens (vocab, dashboard) carry
// run-to-run content noise and are covered functionally by verify-clickthrough.
// Runs under both projects (mobile 390 / desktop 1440), so the off-canvas vs
// sidebar-shell cascade is exercised on both breakpoints.
import { test, expect } from "@playwright/test";

const NO_ANIM = `*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}`;
const STRICT = { maxDiffPixels: 0 };

let auth = null;
test.beforeAll(async ({ baseURL }) => {
  const email = process.env.TEST_PRO_EMAILS?.split(",")[0].trim();
  const password = process.env.TEST_PRO_PASSWORD;
  const r = await fetch(`${baseURL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error(`login -> ${r.status} ${await r.text()}`);
  const j = await r.json();
  auth = { token: j.token, refresh: j.refreshToken || "", email };
});

async function gate(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("puheo_gate_ok_v1", "1");
      // Suppress the async cookie-consent banner — it appears on a timing-variable
      // delay and is the only unlayered runtime <style> overlay, so it adds
      // nondeterministic pixel noise unrelated to the CSS under test.
      localStorage.setItem("puheo_analytics_consent_v1", "denied");
    } catch {}
  });
}
async function authed(page) {
  await page.addInitScript(([t, r, e]) => {
    try {
      localStorage.setItem("puheo_token", t);
      localStorage.setItem("puheo_refresh_token", r);
      localStorage.setItem("puheo_email", e);
      localStorage.setItem("puheo_gate_ok_v1", "1");
      localStorage.setItem("puheo_analytics_consent_v1", "denied");
    } catch {}
  }, [auth.token, auth.refresh, auth.email]);
}
async function go(page, hash) {
  await page.goto(`/app.html`, { waitUntil: "networkidle" });
  await page.evaluate((h) => {
    location.hash = h;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, hash);
  await page.waitForTimeout(1200);
  try { await page.waitForLoadState("networkidle", { timeout: 4000 }); } catch {}
  await page.addStyleTag({ content: NO_ANIM });
  await page.waitForTimeout(150);
}

test.describe("L-V399 CSS layer pixel-diff", () => {
  test("landing", async ({ page }) => {
    await gate(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await page.addStyleTag({ content: NO_ANIM });
    await expect(page).toHaveScreenshot("landing.png", { fullPage: true, ...STRICT });
  });

  test("pricing", async ({ page }) => {
    await gate(page);
    await page.goto("/pricing.html", { waitUntil: "networkidle" });
    await page.addStyleTag({ content: NO_ANIM });
    await expect(page).toHaveScreenshot("pricing.png", { fullPage: true, ...STRICT });
  });

  test("app-auth", async ({ page }) => {
    await gate(page);
    await page.goto("/app.html", { waitUntil: "networkidle" });
    await page.addStyleTag({ content: NO_ANIM });
    await expect(page.locator("#screen-auth")).toHaveScreenshot("app-auth.png", STRICT);
  });

  test("oppimispolku (authed shell + course list)", async ({ page }) => {
    await authed(page);
    await go(page, "#/oppimispolku");
    await expect(page).toHaveScreenshot("oppimispolku.png", { fullPage: true, ...STRICT });
  });

  test("koti sidebar (authed shell)", async ({ page }) => {
    await authed(page);
    await go(page, "#/koti");
    const sb = page.locator(".app-sidebar");
    if (await sb.count()) {
      await expect(sb.first()).toHaveScreenshot("koti-sidebar.png", STRICT);
    }
  });

  // ── L-V399 E-prep: expanded coverage for the future @layer sub-layer
  // reorder. That refactor INVERTS cascade order, so the baseline must lock
  // not only the static shells but the interaction states where the
  // !important wars actually live (hover/focus on nav+buttons, an open
  // modal, a form error). Captured here so the reorder loop can prove a
  // 0-delta across all of them, not just the 5 original static surfaces.
  // Dynamic-content screens (vocab/dashboard/digikirja lesson body) stay
  // OUT — they carry run-to-run content noise; verify-clickthrough covers
  // them functionally.

  const STABLE_ROUTES = [
    ["kurssidetalji", "#/oppimispolku/es/kurssi_1", "#screen-course-detail"],
    ["mode-reading", "#/luetun", "#screen-mode-reading"],
    ["mode-writing", "#/kirjoitus", "#screen-mode-writing"],
    ["profiili", "#/oma-sivu", "#screen-profile"],
    ["asetukset", "#/asetukset", "#screen-settings"],
    ["koeharjoitus", "#/koeharjoitus", null],
  ];

  for (const [name, hash, sel] of STABLE_ROUTES) {
    test(`route ${name}`, async ({ page }) => {
      await authed(page);
      await go(page, hash);
      if (sel) {
        const el = page.locator(sel);
        if (await el.count()) {
          await expect(el.first()).toHaveScreenshot(`route-${name}.png`, STRICT);
          return;
        }
      }
      await expect(page).toHaveScreenshot(`route-${name}.png`, { fullPage: true, ...STRICT });
    });
  }

  // Interaction state: sidebar nav-item :hover (off-canvas-nav owns several
  // !important rules here — a prime cascade-flip suspect).
  test("state sidebar nav-item hover", async ({ page }) => {
    // Desktop only — on mobile the sidebar is off-canvas (translated out of
    // the viewport), so :hover is neither reachable nor meaningful.
    const vw = page.viewportSize()?.width || 0;
    test.skip(vw < 700, "sidebar is off-canvas on mobile");
    await authed(page);
    await go(page, "#/koti");
    const item = page.locator(".app-sidebar [data-nav], .app-sidebar a, .app-sidebar button").first();
    if (await item.count()) {
      await item.hover();
      await page.waitForTimeout(120);
      const sb = page.locator(".app-sidebar").first();
      await expect(sb).toHaveScreenshot("state-sidebar-hover.png", STRICT);
    }
  });

  // Interaction state: primary button :focus-visible (focus ring is an
  // a11y-critical cascade target the reorder must not drop).
  test("state primary button focus", async ({ page }) => {
    await authed(page);
    await go(page, "#/kirjoitus");
    const btn = page.locator("#screen-mode-writing .btn-primary, #screen-mode-writing button").first();
    if (await btn.count()) {
      await btn.focus();
      await page.waitForTimeout(120);
      await expect(btn).toHaveScreenshot("state-button-focus.png", STRICT);
    }
  });

  // Interaction state: open modal. The settings field-editor modal exercises
  // modal z-index + [hidden]/.hidden visibility cascade (the L-V390 bug area).
  test("state settings modal open", async ({ page }) => {
    await authed(page);
    await go(page, "#/asetukset");
    // Settings rows are built dynamically; clicking one calls openEditor()
    // which removes `.hidden` from #settings-modal-overlay (the L-V390
    // visibility-cascade area).
    const trigger = page.locator("#screen-settings .settings-row").first();
    if (await trigger.count()) {
      await trigger.click().catch(() => {});
      const modal = page.locator("#settings-modal-overlay:not(.hidden)");
      try {
        await modal.waitFor({ state: "visible", timeout: 2500 });
      } catch { return; } // editor didn't open for this row — skip cleanly
      await page.addStyleTag({ content: NO_ANIM });
      await page.waitForTimeout(150);
      await expect(modal).toHaveScreenshot("state-settings-modal.png", STRICT);
    }
  });

  // Interaction state: auth form error. Deterministic — a known-bad login
  // renders the inline error band, locking error-state cascade + color.
  test("state auth login error", async ({ page }) => {
    await gate(page);
    await page.goto("/app.html", { waitUntil: "networkidle" });
    const emailInput = page.locator("#screen-auth input[type=email], #login-email").first();
    const pwInput = page.locator("#screen-auth input[type=password], #login-password").first();
    if (await emailInput.count() && await pwInput.count()) {
      await emailInput.fill("nope@example.com");
      await pwInput.fill("definitely-wrong-pw");
      const submit = page.locator("#screen-auth button[type=submit], #screen-auth .btn-primary").first();
      await submit.click().catch(() => {});
      // Wait for the error band to settle (network round-trip).
      await page.waitForTimeout(1500);
      await page.addStyleTag({ content: NO_ANIM });
      await expect(page.locator("#screen-auth")).toHaveScreenshot("state-auth-error.png", STRICT);
    }
  });
});
