#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V333 verification — capture the landing at 5 viewport widths so reviews
 * can compare desktop-fill before/after.
 *
 * Outputs to docs/screenshots/landing-v333-{1920,1440,1024,390,320}.png.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const OUT_DIR = resolve(process.cwd(), "docs/screenshots");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { w: 1920, h: 1080, label: "1920" },
  { w: 1440, h: 900,  label: "1440" },
  { w: 1024, h: 768,  label: "1024" },
  { w: 390,  h: 844,  label: "390"  },
  { w: 320,  h: 568,  label: "320"  },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  for (const v of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: v.w, height: v.h },
      deviceScaleFactor: v.w >= 1024 ? 1 : 2,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      try { window.localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
    });
    await page.goto(`${BASE}/`);
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(900);
    const out = resolve(OUT_DIR, `landing-v333-${v.label}.png`);
    await page.screenshot({ path: out, fullPage: v.w >= 1440 });
    console.log(`captured: docs/screenshots/landing-v333-${v.label}.png (${v.w}x${v.h})`);
    await context.close();
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
