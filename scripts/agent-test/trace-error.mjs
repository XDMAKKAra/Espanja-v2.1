// Trace which file/line throws "Cannot read properties of null (reading 'addEventListener')"
import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => {
  console.log("PAGEERROR:", e.message);
  console.log("STACK:", e.stack);
});
await page.goto(BASE + "/", { waitUntil: "load" });
await page.waitForTimeout(1500);
await browser.close();
