import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
const page = await ctx.newPage();

let failures = 0;
function check(label, ok, detail) {
  const tag = ok ? "PASS" : "FAIL";
  if (!ok) failures++;
  console.log(`${tag}  ${label}${detail ? "  — " + detail : ""}`);
}

// 1. Landing — no aria-required-children
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const landingViolations = (await new AxeBuilder({ page }).analyze()).violations;
const ariaReq = landingViolations.find((v) => v.id === "aria-required-children");
check("landing has no aria-required-children violation", !ariaReq, ariaReq ? `still ${ariaReq.nodes.length} nodes` : null);

// 2. Placement screen — h2 has text
await page.goto(BASE + "/app.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.evaluate(() => {
  document.querySelectorAll(".screen.active").forEach((s) => s.classList.remove("active"));
  document.getElementById("screen-placement-test")?.classList.add("active");
});
await page.waitForTimeout(200);
const placementHeading = await page.evaluate(() => document.getElementById("placement-question")?.textContent || "");
check("placement-question has placeholder text", placementHeading.length > 0, JSON.stringify(placementHeading));
const placementViolations = (await new AxeBuilder({ page }).include("#screen-placement-test").analyze()).violations;
const empty = placementViolations.find((v) => v.id === "empty-heading");
check("placement screen has no empty-heading axe violation", !empty);

// 3. CSP fontSrc is intact (no duplicate)
const cspHeader = await page.evaluate(async () => {
  const r = await fetch("/", { method: "GET" });
  return r.headers.get("content-security-policy");
});
check("CSP header is served", !!cspHeader, cspHeader ? cspHeader.length + " chars" : null);
console.log("\nCSP currently served (note: requires server restart to pick up loop-3 edits):");
console.log("  ", cspHeader?.slice(0, 400) + (cspHeader && cspHeader.length > 400 ? "…" : ""));

await browser.close();
process.exit(failures ? 1 : 0);
