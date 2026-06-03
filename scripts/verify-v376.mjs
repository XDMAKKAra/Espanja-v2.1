#!/usr/bin/env node
/* eslint-disable no-console */
/* L-V376 verification: landing hero frame + language switcher.
   Captures 1440px + 390px, plus the hero after switching to FR and DE. */
import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const OUT = resolve(process.cwd(), "screenshots/v376");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

async function gate(page) {
  await page.addInitScript(() => {
    try { window.localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    // Desktop full page
    const dctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
    const dp = await dctx.newPage();
    await gate(dp);
    await dp.goto(`${BASE}/index.html`);
    await dp.waitForLoadState("networkidle");
    await dp.waitForTimeout(600);
    await dp.screenshot({ path: resolve(OUT, "desktop-1440-full.png"), fullPage: true });

    // Hero only (ES default), then FR, then DE
    const hero = dp.locator("#hero");
    await hero.screenshot({ path: resolve(OUT, "hero-es.png") });
    await dp.locator('#hero-lang-switch [data-lang="fr"]').click();
    await dp.waitForTimeout(400);
    await hero.screenshot({ path: resolve(OUT, "hero-fr.png") });
    await dp.locator('#hero-lang-switch [data-lang="de"]').click();
    await dp.waitForTimeout(400);
    await hero.screenshot({ path: resolve(OUT, "hero-de.png") });

    // Assert the src actually swapped
    const srcDe = await dp.locator("#hero-shot").getAttribute("src");
    console.log("hero-shot src after DE click:", srcDe);

    // Horizontal scroll check at 390
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const mp = await mctx.newPage();
    await gate(mp);
    await mp.goto(`${BASE}/index.html`);
    await mp.waitForLoadState("networkidle");
    await mp.waitForTimeout(500);
    const overflow = await mp.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    console.log("mobile horizontal overflow px:", overflow);
    await mp.screenshot({ path: resolve(OUT, "mobile-390-full.png"), fullPage: true });
    // mobile hero crop
    await mp.locator("#hero").screenshot({ path: resolve(OUT, "mobile-390-hero.png") });
  } catch (e) {
    console.error("verify failed:", e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
run();
