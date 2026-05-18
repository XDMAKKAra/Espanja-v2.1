// Redesign audit walkthrough: capture screenshots of landing + key app screens
// for a manual review. Not a regression test; uses test:false-by-default and
// can be skipped from default runs by name.
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function bypassGate(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
}

test('landing — hero, pricing, FAQ, full page', async ({ page }) => {
  await bypassGate(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await shot(page, '01-landing-top');

  // scroll to bottom in steps for full-page sections
  const sections = await page.locator('section, .section, [class*="section"]').all();
  for (let i = 0; i < Math.min(sections.length, 12); i++) {
    try {
      await sections[i].scrollIntoViewIfNeeded({ timeout: 1500 });
      await page.waitForTimeout(250);
      await shot(page, `02-landing-section-${String(i).padStart(2,'0')}`);
    } catch {}
  }
});

test('pricing page', async ({ page }) => {
  await bypassGate(page);
  await page.goto('/pricing.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await shot(page, '10-pricing-full');
});

test('app — login + key screens', async ({ page }) => {
  test.setTimeout(120_000);
  await bypassGate(page);
  await page.goto('/app.html');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await shot(page, '20-app-auth');

  // login
  await page.fill('input[type="email"]', EMAIL).catch(()=>{});
  await page.fill('input[type="password"]', PASS).catch(()=>{});
  const loginBtn = page.locator('button:has-text("Kirjaudu"), button[type="submit"]').first();
  await loginBtn.click().catch(()=>{});
  await page.waitForTimeout(2500);
  await shot(page, '21-after-login');

  // Walk through screens that should be reachable after login
  const targets = [
    { id: 'screen-path',         name: '30-oppimispolku' },
    { id: 'screen-dashboard',    name: '31-dashboard' },
    { id: 'screen-mode-vocab',   name: '32-mode-vocab' },
    { id: 'screen-mode-grammar', name: '33-mode-grammar' },
    { id: 'screen-mode-reading', name: '34-mode-reading' },
    { id: 'screen-mode-writing', name: '35-mode-writing' },
    { id: 'screen-full-exam',    name: '36-full-exam' },
    { id: 'screen-profile',      name: '37-profile' },
    { id: 'screen-settings',     name: '38-settings' },
  ];

  for (const t of targets) {
    // Try clicking a nav link first, then fall back to forcing show via JS
    await page.evaluate(({ id }) => {
      document.querySelectorAll('.screen').forEach(el => {
        el.hidden = true; el.setAttribute('aria-hidden','true');
        el.style.display = '';
      });
      const el = document.getElementById(id);
      if (el) {
        el.hidden = false;
        el.removeAttribute('aria-hidden');
        el.style.display = 'block';
        el.scrollIntoView();
      }
    }, t);
    await page.waitForTimeout(700);
    await shot(page, t.name);
  }
});
