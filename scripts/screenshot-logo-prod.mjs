import { chromium, devices } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(REPO, "screenshots", "brand");
const BASE = "https://espanja-v2-1.vercel.app";

const browser = await chromium.launch();

// iPhone 13 — same emulator as Marcel's screenshot
const iphone = await browser.newContext({ ...devices["iPhone 13"], deviceScaleFactor: 3 });
const p1 = await iphone.newPage();
await p1.goto(BASE + "/", { waitUntil: "networkidle" });
await p1.screenshot({ path: join(OUT, "prod-iphone-index.png"), clip: { x: 0, y: 0, width: 390, height: 200 } });
await iphone.close();

// Verify prod SVG content (no cache)
const ctx = await browser.newContext();
const p2 = await ctx.newPage();
const resp = await p2.goto(BASE + "/public/brand/logo.svg?cache_bust=" + Date.now());
const body = await resp.text();
console.log("Prod logo.svg first 200 chars:");
console.log(body.slice(0, 200));
console.log("\nhas fill-rule='evenodd':", body.includes('fill-rule="evenodd"'));

await browser.close();
