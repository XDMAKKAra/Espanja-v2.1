// L-V339 client wiring proof: in a real browser, switching the home language
// tab must make the dashboard fetch carry ?lang=<that language>. This is the
// link between the tab UI and the API that the backend scoping depends on.
// Run: node -r dotenv/config tests/verify-client-lang.mjs
import { chromium } from "playwright";
const BASE = process.env.VERIFY_BASE || "http://localhost:3000";

const run = async () => {
  // Get a real pro token via the API.
  const lr = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.TEST_PRO_EMAILS.split(",")[0].trim(), password: process.env.TEST_PRO_PASSWORD }) });
  const { token, refreshToken, email } = await lr.json();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // Seed gate bypass + auth + all three languages enabled BEFORE app boots.
  await page.addInitScript(([tok, ref, mail]) => {
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.setItem("puheo_token", tok);
    localStorage.setItem("puheo_refresh_token", ref || "");
    localStorage.setItem("puheo_email", mail || "");
    localStorage.setItem("puheo:enabled-langs", JSON.stringify(["es", "fr", "de"]));
    localStorage.setItem("puheo:lang", "es");
  }, [token, refreshToken, email]);

  const dashUrls = [];
  page.on("request", (req) => {
    const u = req.url();
    if (u.includes("/api/dashboard")) dashUrls.push(u);
  });

  await page.goto(`${BASE}/app.html#kotinakyma`);
  await page.waitForLoadState("networkidle");
  // Click the French tab.
  const frTab = page.locator('.home-tab[data-lang="fr"]');
  await frTab.waitFor({ timeout: 10000 });
  dashUrls.length = 0; // only care about requests AFTER the switch
  await frTab.click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle");

  const frRequest = dashUrls.find((u) => /[?&]lang=fr\b/.test(u));
  const anyDash = dashUrls.length > 0;
  console.log("dashboard requests after FR tab click:");
  dashUrls.forEach((u) => console.log("  " + u.replace(BASE, "")));
  console.log(`\nPASS  fr tab triggered a dashboard fetch: ${anyDash}`);
  console.log(`${frRequest ? "PASS" : "FAIL"}  dashboard fetch carried ?lang=fr`);

  await browser.close();
  process.exit(frRequest ? 0 : 1);
};
run().catch((e) => { console.error("ERROR:", e.message); process.exit(2); });
