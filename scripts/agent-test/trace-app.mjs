import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message, "\nSTACK:", e.stack));
page.on("response", (r) => { if (r.status() >= 400) console.log("HTTP", r.status(), r.url()); });
await page.goto(BASE + "/app.html", { waitUntil: "load" });
await page.waitForTimeout(2000);
await browser.close();
