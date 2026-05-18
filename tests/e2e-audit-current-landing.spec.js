// One-off audit: capture current landing state at three zooms for review.
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('audit-screens');
test.beforeAll(() => { if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true }); });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
});

test('landing — above the fold (desktop 1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'audit-hero-1440.png') });
});

test('landing — stat row + catalog (desktop 1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#kurssit');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'audit-stat-catalog-1440.png') });
});

test('landing — proof / writing emphasis (desktop 1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#nayte');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, 'audit-proof-1440.png') });
});

test('landing — full page (desktop 1440)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'audit-full-1440.png'), fullPage: true });
});

test('landing — mobile above fold (390)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'audit-hero-390.png') });
});
