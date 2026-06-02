// L-V314 regression: mobile landing pituus guard. The kurssit cards stay in a
// horizontal-scroll strip; if a future change re-stacks the 8 cards vertically,
// the ~1500 px jump must be caught before it ships.
//
// L-V359 re-baseline: index.html grew to ~12100 px through approved loops
// (L-V332 grade-flow demo, L-V356 catalog, L-V357 menu) without any strip
// re-stack — the 10500 ceiling was stale, not a regression. Raised to 13000 so
// the real guard (strip re-stack → ~13500) still trips while legitimate content
// passes. The strip-structure assertions below are the primary intent.
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
const MAX_PITUUS = 13000;

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

      console.log(`[${name} mobile] scrollHeight=${scrollHeight}px`);
      expect(scrollHeight).toBeLessThan(MAX_PITUUS);

      if (name === 'espanja') {
        // index.html keeps the horizontal kurssit strip (L-V314 regression guard).
        const gridInfo = await page.evaluate(() => {
          const grid = document.querySelector('.courses__grid') || document.querySelector('.catalog__grid');
          if (!grid) return null;
          const cs = getComputedStyle(grid);
          return { scrollSnap: cs.scrollSnapType, scrollWidth: grid.scrollWidth, clientWidth: grid.clientWidth };
        });
        expect(gridInfo).not.toBeNull();
        expect(gridInfo.scrollSnap).toBe('x mandatory');
        expect(gridInfo.scrollWidth).toBeGreaterThan(gridInfo.clientWidth);
      } else {
        // L-V358 — de/fr are compact info pages: 8-step course ladder, no strip.
        const rows = await page.locator('.lp-ladder__row').count();
        expect(rows).toBe(8);
      }
    });
  }
});
