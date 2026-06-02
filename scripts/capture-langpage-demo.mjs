#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V358 — Capture real app screenshots (Oppimispolku) for the compact
 * language info pages (es/de/fr). One clean, cropped desktop view per language.
 *
 * Run:  node scripts/capture-langpage-demo.mjs   (dev server must be on :3000)
 * Out:  img/app-demo/oppimispolku-{es,de,fr}.png
 */
import "dotenv/config";
import { chromium } from "@playwright/test";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const BASE  = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const EMAIL = process.env.TEST_LOGIN_EMAIL || "testpro123@gmail.com";
const PASS  = process.env.TEST_LOGIN_PASSWORD || "Testpro123";

const OUT_DIR = resolve(process.cwd(), "img/app-demo");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

async function login(page) {
  await page.addInitScript(() => {
    try { window.localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
  await page.goto(`${BASE}/app.html`);
  await page.waitForLoadState("domcontentloaded");
  const loginTab = page.locator("#tab-login");
  if (await loginTab.count()) await loginTab.click().catch(() => {});
  await page.locator("#auth-email").fill(EMAIL);
  await page.locator("#auth-password").fill(PASS);
  await Promise.all([
    page.waitForResponse(r => /\/api\/(login|auth\/login)/.test(r.url()) && r.status() < 500, { timeout: 15000 }).catch(() => null),
    page.locator("#btn-auth-submit").click(),
  ]);
  await page.waitForTimeout(800);
}

async function captureLang(page, lang) {
  await page.goto(`${BASE}/app.html#/oppimispolku?lang=${lang}`);
  await page.waitForLoadState("networkidle");
  // First post-login nav can land on the default home screen before the hash
  // route applies; a reload forces the router to boot straight to the path.
  await page.reload();
  await page.waitForLoadState("networkidle");
  // Wait for the path screen to render its first course row.
  await page.locator("#screen-path .dk-path__row, #screen-path [class*='row'], #screen-path h1")
    .first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(900);
  // Clip the top of the viewport: sidebar + path header + first courses.
  await page.screenshot({
    path: resolve(OUT_DIR, `oppimispolku-${lang}.png`),
    clip: { x: 0, y: 0, width: 1280, height: 760 },
  });
  console.log(`captured: img/app-demo/oppimispolku-${lang}.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 820 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.error("[pageerror]", e.message));
  try {
    await login(page);
    for (const lang of ["es", "de", "fr"]) await captureLang(page, lang);
  } catch (err) {
    console.error("capture failed:", err.message);
    await page.screenshot({ path: resolve(OUT_DIR, "capture-debug.png"), fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
