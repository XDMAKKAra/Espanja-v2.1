import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("response", (r) => {
  if (r.status() >= 400) console.log("HTTP", r.status(), r.url());
});
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForTimeout(1500);
console.log("---");
await page.goto(BASE + "/app.html", { waitUntil: "load" });
await page.waitForTimeout(1500);
await browser.close();
