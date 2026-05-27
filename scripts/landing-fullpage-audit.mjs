import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
await ctx.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
const page = await ctx.newPage();

const cwd = process.cwd().split("\\").join("/");
const filePath = "file:///" + cwd + "/index.html";

await page.goto(filePath, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);

const out = "screenshots/landing/fullpage-2026-05-27.png";
await mkdir(dirname(out), { recursive: true });
await page.screenshot({ path: out, fullPage: true });

const sections = await page.$$eval("main > section", (els) =>
  els.map((e) => ({
    id: e.id || null,
    className: e.className.split(" ").slice(0, 3).join(" "),
    heading: e.querySelector("h1,h2,h3")?.textContent?.trim()?.slice(0, 80) || null,
    height_px: Math.round(e.getBoundingClientRect().height),
  })),
);
console.log("SECTIONS_IN_ORDER:");
console.log(JSON.stringify(sections, null, 2));
console.log("SCREENSHOT:", out);
await browser.close();
