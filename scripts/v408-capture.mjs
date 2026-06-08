// L-V408 — capture screenshots of kartoitus-portaali flow
import { chromium } from "@playwright/test";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "screenshots/v408";

mkdirSync(OUT, { recursive: true });

async function capture(label, url, width, height, actions = []) {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width, height },
    storageState: undefined,
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("puheo_gate_ok_v1", "1");
    localStorage.removeItem("puheo:token");
    localStorage.removeItem("puheo:refresh");
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  for (const action of actions) {
    await action(page);
    await page.waitForTimeout(300);
  }
  const path = `${OUT}/${label}-${width}px.png`;
  await page.screenshot({ path, fullPage: false });
  console.log("captured:", path);
  await browser.close();
}

// Intro screen
await capture("intro", `${BASE}/app.html#/aloitus`, 390, 844);
await capture("intro", `${BASE}/app.html#/aloitus`, 1280, 800);

// Biography screen (after clicking Jatka)
await capture("biography", `${BASE}/app.html#/aloitus`, 390, 844, [
  async (p) => { await p.locator("#ob-v4-intro-next").click(); },
]);
await capture("biography", `${BASE}/app.html#/aloitus`, 1280, 800, [
  async (p) => { await p.locator("#ob-v4-intro-next").click(); },
]);

// Choice screen (after bio continue)
await capture("choice", `${BASE}/app.html#/aloitus`, 390, 844, [
  async (p) => { await p.locator("#ob-v4-intro-next").click(); },
  async (p) => { await p.locator("#ob-v4-bio-continue").click(); },
]);
await capture("choice", `${BASE}/app.html#/aloitus`, 1280, 800, [
  async (p) => { await p.locator("#ob-v4-intro-next").click(); },
  async (p) => { await p.locator("#ob-v4-bio-continue").click(); },
]);

console.log("All screenshots done!");
