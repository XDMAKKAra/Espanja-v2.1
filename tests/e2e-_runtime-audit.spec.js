// Throwaway runtime audit — production click-through.
// Logs in as testpro, walks every visible screen/button, records console errors,
// failed network responses, blank screens, and timeouts.
//
// Run:  BASE_URL=https://espanja-v2-1.vercel.app npx playwright test tests/e2e-_runtime-audit.spec.js --project=desktop
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('audit-screens', 'runtime-audit');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

const findings = []; // {sev, where, what, evidence, shot}
const consoleErrors = [];
const netFailures = [];

function rec(sev, where, what, evidence, shot) {
  findings.push({ sev, where, what, evidence: evidence || '', shot: shot || '' });
}

function safe(name) { return name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 80); }

test.beforeAll(() => { fs.mkdirSync(OUT_DIR, { recursive: true }); });

test('production runtime audit', async ({ page }) => {
  test.setTimeout(15 * 60_000);

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      consoleErrors.push(t);
      // eslint-disable-next-line no-console
      console.log('[CONSOLE ERROR]', t.slice(0, 300));
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push('[pageerror] ' + err.message);
    console.log('[PAGEERROR]', err.message);
  });
  page.on('response', async (res) => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes('favicon')) {
      netFailures.push(`${status} ${url}`);
      console.log('[NET]', status, url);
    }
  });

  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });

  // ---------- Landing (logged out) ----------
  const LANDING = process.env.BASE_URL || 'https://espanja-v2-1.vercel.app';
  console.log('→ Landing');
  await page.goto(LANDING + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  let shot = path.join(OUT_DIR, '01-landing.png');
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
  // Probe landing CTAs without leaving the page – capture link hrefs.
  const landingLinks = await page.locator('a, button').evaluateAll((els) =>
    els.map((e) => ({
      tag: e.tagName, text: (e.innerText || e.textContent || '').trim().slice(0, 60),
      href: e.getAttribute('href') || '', visible: e.offsetParent !== null,
    })).filter((x) => x.visible && x.text)
  );
  console.log('Landing CTAs:', JSON.stringify(landingLinks.slice(0, 30), null, 0));

  // ---------- App / login ----------
  console.log('→ /app.html');
  await page.goto(LANDING + '/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  shot = path.join(OUT_DIR, '02-auth-screen.png');
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});

  const emailField = page.locator('#auth-email');
  if (!(await emailField.isVisible().catch(() => false))) {
    rec('P0', 'app.html', 'Auth screen #auth-email not visible on load', '', shot);
    console.log('Aborting: cannot find login form');
    return;
  }
  await emailField.fill(EMAIL);
  await page.locator('#auth-password').fill(PASS);
  const loginBtn = page.locator('button:has-text("Kirjaudu sisään")').first();
  await loginBtn.click();
  // Wait for dashboard markers
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  shot = path.join(OUT_DIR, '03-dashboard.png');
  await page.screenshot({ path: shot, fullPage: true }).catch(() => {});

  // Did login actually progress past the auth form?
  if (await page.locator('#auth-email').isVisible().catch(() => false)) {
    rec('P0', 'login', 'Login click did not transition away from auth form', consoleErrors.slice(-1).join(' | '), shot);
    console.log('Login appears stuck. Continuing to record evidence.');
  }

  // Helper: find any visible screen container (.screen.active or h1)
  async function snapshot(label) {
    const file = path.join(OUT_DIR, `${safe(label)}.png`);
    await page.screenshot({ path: file, fullPage: true }).catch(() => {});
    return file;
  }

  async function activeScreen() {
    return await page.evaluate(() => {
      const s = document.querySelector('.screen.active, [data-screen].active, .view.active');
      if (s) return s.id || s.getAttribute('data-screen') || s.className;
      const h = document.querySelector('main h1, .screen h1');
      return h ? '(h1) ' + (h.innerText || '').slice(0, 60) : '(unknown)';
    });
  }

  console.log('Active after login:', await activeScreen());

  // ---------- Enumerate sidebar / nav items ----------
  const navSel = 'aside a, aside button, nav a, nav button, .sidebar a, .sidebar button, [data-nav] button, .bottom-nav a, .bottom-nav button';
  const navItems = await page.locator(navSel).evaluateAll((els) =>
    els.map((e, i) => ({
      i, tag: e.tagName,
      text: (e.innerText || e.textContent || '').trim().slice(0, 40),
      data: e.getAttribute('data-screen') || e.getAttribute('data-target') || e.getAttribute('href') || '',
      visible: !!(e.offsetParent),
    })).filter((x) => x.visible && (x.text || x.data))
  );
  console.log('Nav items:', JSON.stringify(navItems, null, 0));

  // ---------- Click each nav target ----------
  for (const item of navItems) {
    const label = item.text || item.data || `nav-${item.i}`;
    try {
      const handle = page.locator(navSel).nth(item.i);
      if (!(await handle.isVisible().catch(() => false))) continue;
      console.log(`→ Click nav: ${label}`);
      const before = consoleErrors.length;
      const beforeNet = netFailures.length;
      await Promise.race([
        handle.click({ timeout: 4000 }),
        page.waitForTimeout(6000),
      ]).catch((e) => rec('P1', `nav:${label}`, 'Click threw', String(e).slice(0, 200)));
      await page.waitForTimeout(2000);

      const screen = await activeScreen();
      const shotPath = await snapshot(`nav-${label}`);

      // Blank check: is main empty?
      const isBlank = await page.evaluate(() => {
        const main = document.querySelector('main, .screen.active, .app-main');
        if (!main) return true;
        const txt = (main.innerText || '').trim();
        return txt.length < 20;
      });
      if (isBlank) rec('P0', `nav:${label}`, 'Screen rendered blank', `active=${screen}`, shotPath);

      // Infinite loader: spinner still visible after 2s
      const spinning = await page.evaluate(() => {
        const s = document.querySelector('.spinner, .loading, .skeleton, [data-loading="true"]');
        return s && s.offsetParent !== null;
      });
      if (spinning) {
        // give it another 4s, then re-check
        await page.waitForTimeout(4000);
        const stillSpinning = await page.evaluate(() => {
          const s = document.querySelector('.spinner, .loading, .skeleton, [data-loading="true"]');
          return s && s.offsetParent !== null;
        });
        if (stillSpinning) rec('P0', `nav:${label}`, 'Loader stuck >6s', `active=${screen}`, shotPath);
      }

      const newErr = consoleErrors.slice(before);
      const newNet = netFailures.slice(beforeNet);
      if (newErr.length) rec('P1', `nav:${label}`, 'Console error after click', newErr[0].slice(0, 200), shotPath);
      if (newNet.length) rec('P1', `nav:${label}`, 'Network failure after click', newNet[0].slice(0, 200), shotPath);
    } catch (e) {
      rec('P1', `nav:${label}`, 'Unhandled exception', String(e).slice(0, 200));
    }
  }

  // ---------- Try mode tiles on dashboard ----------
  // Go back to home / aloitus first
  const homeBtn = page.locator('[data-screen="home"], a[href="#home"], button:has-text("Aloitus")').first();
  if (await homeBtn.isVisible().catch(() => false)) {
    await homeBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
  }

  const tileSel = '.mode-card, .dash-card, [data-mode], .home-card, .tile, article a, article button';
  const tiles = await page.locator(tileSel).evaluateAll((els) =>
    els.map((e, i) => ({
      i, text: (e.innerText || '').trim().slice(0, 40),
      mode: e.getAttribute('data-mode') || '',
      visible: !!e.offsetParent,
    })).filter((x) => x.visible && x.text)
  );
  console.log('Mode tiles:', JSON.stringify(tiles.slice(0, 20), null, 0));

  const seen = new Set();
  for (const t of tiles.slice(0, 12)) {
    if (seen.has(t.text)) continue;
    seen.add(t.text);
    const label = t.text || t.mode || `tile-${t.i}`;
    try {
      const handle = page.locator(tileSel).nth(t.i);
      if (!(await handle.isVisible().catch(() => false))) continue;
      console.log(`→ Click tile: ${label}`);
      const before = consoleErrors.length;
      const beforeNet = netFailures.length;
      await handle.click({ timeout: 4000 }).catch((e) => rec('P1', `tile:${label}`, 'Click threw', String(e).slice(0, 200)));
      await page.waitForTimeout(3500);
      const shotPath = await snapshot(`tile-${label}`);
      const screen = await activeScreen();
      const isBlank = await page.evaluate(() => {
        const main = document.querySelector('main, .screen.active');
        return !main || (main.innerText || '').trim().length < 20;
      });
      if (isBlank) rec('P0', `tile:${label}`, 'Mode screen blank', `active=${screen}`, shotPath);
      const stuck = await page.evaluate(() => {
        const s = document.querySelector('.spinner, .loading, .skeleton');
        return s && s.offsetParent !== null;
      });
      if (stuck) {
        await page.waitForTimeout(5000);
        const still = await page.evaluate(() => {
          const s = document.querySelector('.spinner, .loading, .skeleton');
          return s && s.offsetParent !== null;
        });
        if (still) rec('P0', `tile:${label}`, 'Loader stuck >8s on mode screen', `active=${screen}`, shotPath);
      }
      const ne = consoleErrors.slice(before);
      const nn = netFailures.slice(beforeNet);
      if (ne.length) rec('P1', `tile:${label}`, 'Console error after tile click', ne[0].slice(0, 200), shotPath);
      if (nn.length) rec('P1', `tile:${label}`, 'Network failure after tile click', nn[0].slice(0, 200), shotPath);

      // Go back home for the next tile
      const back = page.locator('[data-screen="home"], a[href="#home"], button:has-text("Aloitus")').first();
      if (await back.isVisible().catch(() => false)) {
        await back.click().catch(() => {});
        await page.waitForTimeout(1200);
      } else {
        await page.goBack().catch(() => {});
        await page.waitForTimeout(1200);
      }
    } catch (e) {
      rec('P1', `tile:${label}`, 'Unhandled exception', String(e).slice(0, 200));
    }
  }

  // ---------- Settings / Asetukset ----------
  console.log('→ Settings');
  const settingsTriggers = [
    'button:has-text("Asetukset")',
    '[data-screen="settings"]',
    'a[href="#settings"]',
    '[aria-label*="Asetuk" i]',
  ];
  let opened = false;
  for (const sel of settingsTriggers) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click().catch(() => {});
      await page.waitForTimeout(1500);
      opened = true;
      break;
    }
  }
  if (!opened) rec('P1', 'settings', 'No visible Asetukset trigger found', '', await snapshot('settings-no-trigger'));
  else {
    const shotPath = await snapshot('settings');
    const visibleSettings = await page.evaluate(() => {
      const s = document.querySelector('#screen-settings, .settings-modal, [data-screen="settings"].active, dialog[open]');
      return !!s && s.offsetParent !== null;
    });
    if (!visibleSettings) rec('P0', 'settings', 'Asetukset trigger clicked but no panel rendered', '', shotPath);
  }

  // ---------- Logout ----------
  console.log('→ Logout');
  const logoutSel = 'button:has-text("Kirjaudu ulos"), button:has-text("Logout"), [data-action="logout"]';
  const logout = page.locator(logoutSel).first();
  if (await logout.isVisible().catch(() => false)) {
    await logout.click().catch(() => {});
    await page.waitForTimeout(2500);
    const shotPath = await snapshot('after-logout');
    const back = await page.locator('#auth-email').isVisible().catch(() => false);
    if (!back) rec('P1', 'logout', 'Logout did not return to auth form', `url=${page.url()}`, shotPath);
  } else {
    rec('P1', 'logout', 'No logout button visible', '');
  }

  // ---------- Report ----------
  const summary = {
    consoleErrors: consoleErrors.slice(0, 50),
    netFailures: netFailures.slice(0, 50),
    findings,
  };
  const reportPath = path.join(OUT_DIR, 'REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
  console.log('\n=== RUNTIME AUDIT SUMMARY ===');
  console.log('Console errors:', consoleErrors.length);
  console.log('Network failures:', netFailures.length);
  console.log('Findings:', findings.length);
  for (const f of findings) {
    console.log(`[${f.sev}] ${f.where}: ${f.what} | ${f.evidence}`);
  }
  console.log('Full report:', reportPath);
});
