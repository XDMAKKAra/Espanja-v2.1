// L-V314 regression: mobile landing pituus must stay under 10500 px.
// Tightens the L-V308 trim (11931 px) with the kurssit horizontal-scroll
// strip; if a future change re-stacks the 8 cards vertically, this catches
// the ~1500 px regression before it ships.
//
// Aja: BASE_URL=http://localhost:3000 npx playwright test tests/e2e-landing-pituus
// Tai vasten prodia: AUDIT_BASE_URL=https://espanja-v2-1.vercel.app npx playwright test tests/e2e-landing-pituus

import { test, expect } from '@playwright/test';

const BASE = process.env.AUDIT_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';

// On Vercel the DE/FR landings live at /saksan-yo-koe and /ranskan-yo-koe;
// the local express server has no rewrite, so we hit the underlying file.
const isLocal = !process.env.AUDIT_BASE_URL && BASE.includes('localhost');
const PATHS = {
  espanja: '/',
  saksa: isLocal ? '/public/landing/saksa.html' : '/saksan-yo-koe',
  ranska: isLocal ? '/public/landing/ranska.html' : '/ranskan-yo-koe',
};

const MOBILE = { width: 393, height: 852 };
const MAX_PITUUS = 10500;

test.describe('Landing mobile pituus regression (L-V314)', () => {
  for (const [name, path] of Object.entries(PATHS)) {
    test(`${name} mobile scrollHeight < ${MAX_PITUUS} px`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await page.addInitScript(() => {
        try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
      });
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(800);

      const scrollHeight = await page.evaluate(() => Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ));

      const gridInfo = await page.evaluate(() => {
        const grid = document.querySelector('.courses__grid') || document.querySelector('.catalog__grid');
        if (!grid) return null;
        const cs = getComputedStyle(grid);
        return {
          display: cs.display,
          overflowX: cs.overflowX,
          scrollSnap: cs.scrollSnapType,
          scrollWidth: grid.scrollWidth,
          clientWidth: grid.clientWidth,
        };
      });

      console.log(`[${name} mobile] scrollHeight=${scrollHeight}px, grid=`, gridInfo);
      expect(scrollHeight).toBeLessThan(MAX_PITUUS);
      // Strip-rakenne: ensimmäisellä kortilla pitää olla vähemmän kuin
      // ~30% client-leveyttä jättääkseen vihjeen swipattavasta sisällöstä.
      // (gridWidth >> clientWidth tarkoittaa että kortit overflowaa oikealle.)
      expect(gridInfo).not.toBeNull();
      expect(gridInfo.scrollSnap).toBe('x mandatory');
      expect(gridInfo.scrollWidth).toBeGreaterThan(gridInfo.clientWidth);
    });
  }
});
