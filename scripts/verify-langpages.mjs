#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V358 verification — compact language info pages (es/de/fr).
 * Checks per page (desktop 1280 + mobile 390):
 *  - 5 sections present (#kurssit, #nayte, #esimerkki, why, hero)
 *  - no horizontal scroll
 *  - demo app image loads (naturalWidth > 0)
 *  - CTA click sets localStorage puheo:lang
 *  - no console errors
 *  - page height < index.html height
 */
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const PAGES = [
  { file: "/public/landing/espanja.html", lang: "es" },
  { file: "/public/landing/saksa.html",   lang: "de" },
  { file: "/public/landing/ranska.html",  lang: "fr" },
];

async function bodyHeight(page, path) {
  await page.goto(`${BASE}${path}`);
  await page.waitForLoadState("networkidle");
  return page.evaluate(() => document.body.scrollHeight);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  let failures = 0;
  const fail = (m) => { console.error("  ✗ " + m); failures++; };
  const ok = (m) => console.log("  ✓ " + m);

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const gate = async (p) => p.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });

  // index.html baseline height (desktop)
  const idxPage = await ctx.newPage();
  await gate(idxPage);
  const indexH = await bodyHeight(idxPage, "/index.html");
  console.log(`index.html desktop height: ${indexH}px`);
  await idxPage.close();

  for (const { file, lang } of PAGES) {
    console.log(`\n=== ${file} (${lang}) ===`);
    for (const vp of [{ w: 1280, h: 900, name: "desktop" }, { w: 390, h: 844, name: "mobile" }]) {
      const c = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
      const page = await c.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      page.on("pageerror", (e) => errors.push(e.message));
      await gate(page);
      await page.goto(`${BASE}${file}`);
      await page.waitForLoadState("networkidle");

      // Sections
      for (const sel of ["#hero", "#kurssit", "#nayte", "#esimerkki", ".lp-why"]) {
        const n = await page.locator(sel).count();
        if (n) ok(`${vp.name}: ${sel} present`); else fail(`${vp.name}: ${sel} MISSING`);
      }
      // ladder rows = 8
      const rows = await page.locator(".lp-ladder__row").count();
      rows === 8 ? ok(`${vp.name}: 8 course rows`) : fail(`${vp.name}: ${rows} course rows (want 8)`);

      // horizontal scroll
      const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      scrollX <= 1 ? ok(`${vp.name}: no h-scroll (${scrollX})`) : fail(`${vp.name}: h-scroll ${scrollX}px`);

      // demo image loaded
      const imgOk = await page.locator(".lp-demo__frame img").evaluate((el) => el.complete && el.naturalWidth > 0).catch(() => false);
      imgOk ? ok(`${vp.name}: demo image loaded`) : fail(`${vp.name}: demo image NOT loaded`);

      // height < index (desktop only, fair comparison)
      if (vp.name === "desktop") {
        const h = await page.evaluate(() => document.body.scrollHeight);
        h < indexH ? ok(`desktop height ${h} < index ${indexH}`) : fail(`desktop height ${h} >= index ${indexH}`);
      }

      // console errors
      errors.length === 0 ? ok(`${vp.name}: no console errors`) : fail(`${vp.name}: console errors: ${errors.join(" | ")}`);

      // CTA sets puheo:lang (desktop)
      if (vp.name === "desktop") {
        await page.evaluate(() => { try { localStorage.removeItem("puheo:lang"); } catch {} });
        const cta = page.locator("[data-lang-cta]").first();
        await cta.dispatchEvent("pointerdown");
        const stored = await page.evaluate(() => localStorage.getItem("puheo:lang"));
        stored === lang ? ok(`CTA set puheo:lang=${stored}`) : fail(`CTA puheo:lang=${stored} (want ${lang})`);
      }

      // crosslinks present (2 other languages)
      const cross = await page.locator(".lp-crosslang a").count();
      cross === 2 ? ok(`${vp.name}: 2 crosslinks`) : fail(`${vp.name}: ${cross} crosslinks (want 2)`);

      await c.close();
    }
  }

  await browser.close();
  console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURES"}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
