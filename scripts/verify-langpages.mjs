#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * L-V405 verification — per-language abikurssi info pages (es/de/fr).
 * Checks per page (desktop 1280 + mobile 390):
 *  - sections present (#hero, #koe, #kurssit, #esimerkki, .lp-why, #kenelle, #ukk)
 *  - 8 course rows in the ladder
 *  - >= 4 FAQ items
 *  - no two-tone hero <em>, no eyebrow pill in hero, no stale demo screenshot
 *  - no horizontal scroll
 *  - CTA click sets localStorage puheo:lang
 *  - no console errors
 */
import { chromium } from "@playwright/test";

const BASE = process.env.CAPTURE_BASE_URL || "http://localhost:3000";
const PAGES = [
  { file: "/public/landing/espanja.html", lang: "es" },
  { file: "/public/landing/saksa.html",   lang: "de" },
  { file: "/public/landing/ranska.html",  lang: "fr" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  let failures = 0;
  const fail = (m) => { console.error("  ✗ " + m); failures++; };
  const ok = (m) => console.log("  ✓ " + m);

  const gate = async (p) => p.addInitScript(() => { try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {} });

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
      for (const sel of ["#hero", "#koe", "#kurssit", "#esimerkki", ".lp-why", "#kenelle", "#ukk"]) {
        const n = await page.locator(sel).count();
        if (n) ok(`${vp.name}: ${sel} present`); else fail(`${vp.name}: ${sel} MISSING`);
      }
      // ladder rows = 8
      const rows = await page.locator(".lp-ladder__row").count();
      rows === 8 ? ok(`${vp.name}: 8 course rows`) : fail(`${vp.name}: ${rows} course rows (want 8)`);

      // FAQ items >= 4
      const faq = await page.locator(".lp-faq__item").count();
      faq >= 4 ? ok(`${vp.name}: ${faq} FAQ items`) : fail(`${vp.name}: ${faq} FAQ items (want >= 4)`);

      // anti-slop: hero must have no two-tone <em> and no eyebrow pill
      const heroEm = await page.locator("#hero .lp-hero__title em").count();
      heroEm === 0 ? ok(`${vp.name}: no two-tone hero <em>`) : fail(`${vp.name}: hero <em> present (two-tone)`);
      const heroEyebrow = await page.locator("#hero .lp-eyebrow").count();
      heroEyebrow === 0 ? ok(`${vp.name}: no eyebrow pill in hero`) : fail(`${vp.name}: eyebrow in hero`);
      // anti-slop: stale oppimispolku screenshot must be gone
      const staleImg = await page.locator('img[src*="oppimispolku-"]').count();
      staleImg === 0 ? ok(`${vp.name}: no stale demo screenshot`) : fail(`${vp.name}: stale oppimispolku screenshot present`);

      // horizontal scroll
      const scrollX = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      scrollX <= 1 ? ok(`${vp.name}: no h-scroll (${scrollX})`) : fail(`${vp.name}: h-scroll ${scrollX}px`);

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
