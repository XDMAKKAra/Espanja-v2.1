// App-only audit: login then capture each main screen via real navigation.
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('app screens after login', async ({ page }) => {
  test.setTimeout(180_000);

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.locator('#auth-email').fill(EMAIL);
  await page.locator('#auth-password').fill(PASS);

  await Promise.all([
    page.waitForLoadState('networkidle').catch(()=>{}),
    page.locator('button:has-text("Kirjaudu sisään")').first().click(),
  ]);
  await page.waitForTimeout(4000);

  const shot = async (name) => {
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  };

  await shot('30-after-login');

  // Force-show each screen. App initializes most screen content at module
  // load; non-rendered modes will look thin but the shell + hero is what we
  // need for the redesign call.
  const screens = [
    'screen-path', 'screen-dashboard',
    'screen-mode-vocab', 'screen-mode-grammar',
    'screen-mode-reading', 'screen-mode-writing',
    'screen-full-exam', 'screen-profile', 'screen-settings',
  ];

  for (let i = 0; i < screens.length; i++) {
    const id = screens[i];
    await page.evaluate((sid) => {
      document.querySelectorAll('.screen').forEach(el => {
        el.hidden = true;
        el.setAttribute('aria-hidden', 'true');
      });
      const el = document.getElementById(sid);
      if (el) {
        el.hidden = false;
        el.removeAttribute('aria-hidden');
        el.scrollIntoView({ block: 'start' });
      }
      window.scrollTo(0, 0);
    }, id);
    await page.waitForTimeout(600);
    await shot(`${String(31+i).padStart(2,'0')}-${id}`);
  }
});
