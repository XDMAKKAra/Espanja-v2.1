// Find what's contributing to the remaining 145px overflow.
import { chromium } from "playwright";
const BASE = "http://localhost:3000";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: "block" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  localStorage.setItem("puheo_token", "mock");
  localStorage.setItem("puheo_email", "testpro123@gmail.com");
  localStorage.setItem("puheo_gate_ok_v1", "1");
});
const ok = (b) => (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
await page.route("**/api/profile", ok({ profile: { onboarding_completed: true, target_grade: "M", target_language: "es" } }));
await page.route("**/api/auth/me", ok({ ok: true, pro: true }));
await page.route("**/api/dashboard", ok({}));
await page.route("**/api/learning-path", ok({ path: [] }));
await page.route("**/api/sr/**", ok({}));
await page.route("**/api/placement/**", ok({ needed: false }));

await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.evaluate(async () => { const m = await import("/js/screens/settings.js"); await m.showSettings(); });
await page.waitForTimeout(400);

const probe = await page.evaluate(() => {
  const children = Array.from(document.body.children).map((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName, id: el.id, cls: typeof el.className === "string" ? el.className : "",
      hidden: el.hidden, display: cs.display, position: cs.position,
      rectTop: Math.round(r.top), rectBottom: Math.round(r.bottom), rectHeight: Math.round(r.height),
      visible: cs.display !== "none",
    };
  });
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scrollHeight: document.documentElement.scrollHeight,
    bodyChildren: children.filter((c) => c.visible && c.rectHeight > 0),
  };
});
console.log(JSON.stringify(probe, null, 2));
await ctx.close(); await browser.close();
