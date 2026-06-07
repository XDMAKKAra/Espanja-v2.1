import { chromium, devices } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";
const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, "screenshots", "redesign-mockup-2026-06-01");
mkdirSync(OUT, { recursive: true });
const url = pathToFileURL(join(REPO, "docs", "audits", "redesign-mockup.html")).href;
const VPS = [
  { name: "desktop", width: 1440, height: 900, ua: undefined },
  { name: "mobile", width: 390, height: 844, ua: devices["iPhone 13"].userAgent },
];
const browser = await chromium.launch();
for (const v of VPS) {
  const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, userAgent: v.ua, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500); // let fonts settle
  await page.screenshot({ path: join(OUT, `mockup-${v.name}.png`), fullPage: true });
  console.log("captured", v.name);
  await ctx.close();
}
await browser.close();
console.log("done →", OUT);
