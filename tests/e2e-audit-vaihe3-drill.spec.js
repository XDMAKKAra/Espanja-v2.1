// Vaihe 3 — drill-view redesign audit. Logs in, navigates to the vocab
// drill screen, injects synthetic options + visible kbd-hint state so the
// two-column layout + drop-cap + chapter ornament can be captured.
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

test('vaihe 3 drill view', async ({ page }) => {
  test.setTimeout(120_000);

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  await page.goto('/app.html', { waitUntil: 'domcontentloaded' });

  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.locator('button:has-text("Kirjaudu sisään")').first().click(),
    ]);
    await page.waitForTimeout(2000);
  }

  // Force the exercise screen to be visible with a populated prompt and
  // option set so we can capture the redesigned chrome without waiting on
  // /api/generate (which charges AI tokens + needs a Pro tier).
  await page.evaluate(() => {
    document.querySelectorAll('.screen.active').forEach(el => el.classList.remove('active'));
    const ex = document.getElementById('screen-exercise');
    if (ex) ex.classList.add('active');
    const q = document.getElementById('question-text');
    if (q) { q.textContent = '¿Qué significa "casa" en suomeksi?'; q.classList.remove('loading-shimmer'); }
    const grid = document.getElementById('options-grid');
    if (grid) {
      grid.innerHTML = `
        <button class="ex-option"><span class="ex-option__l">a</span><span class="ex-option__t">kissa</span></button>
        <button class="ex-option"><span class="ex-option__l">b</span><span class="ex-option__t">talo</span></button>
        <button class="ex-option"><span class="ex-option__l">c</span><span class="ex-option__t">auto</span></button>
        <button class="ex-option"><span class="ex-option__l">d</span><span class="ex-option__t">koira</span></button>
      `;
    }
    const sk = document.getElementById('exercise-skeleton-slot');
    if (sk) sk.classList.add('hidden');
    const qb = document.getElementById('exercise-question-block');
    if (qb) qb.classList.remove('hidden');
    document.getElementById('options-grid').classList.remove('hidden');
    const kbd = document.getElementById('vocab-kbd-hint');
    if (kbd) kbd.style.display = '';
  });
  await page.waitForTimeout(800);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: path.join(OUT_DIR, 'vaihe3-drill-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(OUT_DIR, 'vaihe3-drill-mobile.png'), fullPage: true });
});
