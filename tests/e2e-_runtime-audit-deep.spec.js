// Deeper runtime audit — drill into mode screens, lessons, settings actions.
// Builds on _runtime-audit.spec.js findings.
import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT = path.resolve('audit-screens', 'runtime-audit-deep');
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

const findings = [];
const consoleErrs = [];
const netFails = [];
function rec(sev, where, what, ev, shot) { findings.push({ sev, where, what, ev: ev || '', shot: shot || '' }); }
function safe(s) { return s.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 80); }

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

test('deep runtime audit', async ({ page }) => {
  test.setTimeout(15 * 60_000);

  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text(); consoleErrs.push(t);
      console.log('[CONSOLE ERROR]', t.slice(0, 250));
    }
  });
  page.on('pageerror', (e) => { consoleErrs.push('[pageerror] ' + e.message); console.log('[PAGEERROR]', e.message); });
  page.on('response', (r) => {
    const s = r.status(); const u = r.url();
    if (s >= 400 && !u.includes('favicon')) {
      netFails.push(`${s} ${u}`);
      console.log('[NET]', s, u);
    }
  });

  await page.addInitScript(() => { try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {} });

  const BASE = process.env.BASE_URL || 'https://espanja-v2-1.vercel.app';

  // ---- Login ----
  await page.goto(BASE + '/app.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.locator('#auth-email').fill(EMAIL);
  await page.locator('#auth-password').fill(PASS);
  await page.locator('button:has-text("Kirjaudu sisään")').first().click();
  await page.waitForTimeout(5500);

  async function shoot(name) {
    const p = path.join(OUT, `${safe(name)}.png`);
    await page.screenshot({ path: p, fullPage: true }).catch(() => {});
    return p;
  }

  // ---- Dismiss any blocking "keskeneräinen Yo-koe" modal so we can interact ----
  const modalClose = page.locator('button[aria-label="Sulje"], button:has-text("×"), .modal-close').first();
  if (await modalClose.isVisible().catch(() => false)) await modalClose.click().catch(() => {});

  await shoot('00-home');

  // Check if sidebar exists on home
  const sidebarOnHome = await page.evaluate(() => {
    const s = document.querySelector('aside, .sidebar, nav[role="navigation"]');
    return s ? { exists: true, visible: s.offsetParent !== null, w: s.getBoundingClientRect().width } : { exists: false };
  });
  console.log('Sidebar on home:', JSON.stringify(sidebarOnHome));
  if (!sidebarOnHome.exists || !sidebarOnHome.visible) {
    rec('P1', 'home', 'Sidebar/nav not present on dashboard', JSON.stringify(sidebarOnHome), await shoot('home-no-sidebar'));
  }

  // ---- Drill: Oppimispolku → Kurssi 1 → first lesson ----
  console.log('=== Oppimispolku flow ===');
  await page.locator('[data-mode="path"], a:has-text("Oppimispolku"), button:has-text("Oppimispolku")').first().click().catch(() => {});
  await page.waitForTimeout(3000);
  await shoot('01-path');
  // List courses
  const courseTexts = await page.locator('.course, [data-course], li, article, button').evaluateAll((els) =>
    els.map((e) => (e.innerText || '').trim().slice(0, 80)).filter((t) => /Kurssi \d/i.test(t)).slice(0, 12)
  );
  console.log('Course rows:', courseTexts);
  // Click Kurssi 1
  const kurssi1 = page.locator('text=/Kurssi 1\\s*—/').first();
  if (await kurssi1.isVisible().catch(() => false)) {
    const before = consoleErrs.length; const beforeNet = netFails.length;
    await kurssi1.click();
    await page.waitForTimeout(4000);
    const shot = await shoot('02-kurssi1');
    const blank = await page.evaluate(() => (document.querySelector('main')?.innerText || '').trim().length < 30);
    if (blank) rec('P0', 'kurssi1', 'Course detail blank', '', shot);
    const newErr = consoleErrs.slice(before); const newNet = netFails.slice(beforeNet);
    if (newErr.length) rec('P1', 'kurssi1', 'Console errors on open', newErr[0].slice(0, 200), shot);
    if (newNet.length) rec('P1', 'kurssi1', 'Network failures on open', newNet[0].slice(0, 200), shot);

    // Try to click first lesson / oppitunti
    const lesson = page.locator('a:has-text("Oppitunti"), button:has-text("Oppitunti"), [data-lesson], .lesson-card').first();
    if (await lesson.isVisible().catch(() => false)) {
      const lbefore = consoleErrs.length; const lbeforeNet = netFails.length;
      await lesson.click().catch(() => {});
      await page.waitForTimeout(6000);
      const shot2 = await shoot('03-kurssi1-lesson');
      const stuck = await page.evaluate(() => {
        const s = document.querySelector('.spinner, .loading');
        return s && s.offsetParent !== null;
      });
      if (stuck) rec('P0', 'lesson', 'Lesson stuck on loader >6s', '', shot2);
      const blank2 = await page.evaluate(() => (document.querySelector('main')?.innerText || '').trim().length < 30);
      if (blank2) rec('P0', 'lesson', 'Lesson screen blank', '', shot2);
      const ne = consoleErrs.slice(lbefore); const nn = netFails.slice(lbeforeNet);
      if (ne.length) rec('P1', 'lesson', 'Console errors loading lesson', ne[0].slice(0, 200), shot2);
      if (nn.length) rec('P1', 'lesson', 'Network failure loading lesson', nn[0].slice(0, 200), shot2);
    } else {
      rec('P1', 'kurssi1', 'No lesson clickable element found inside Kurssi 1', '', shot);
    }

    // Lukittu check: are kurssit 2-8 actually locked for a Pro user?
    const lockedCount = await page.evaluate(() => Array.from(document.querySelectorAll('*'))
      .filter((e) => /Lukittu/i.test(e.innerText || '')).length);
    if (lockedCount >= 6) rec('P1', 'kurssit-locked', `Pro account sees ${lockedCount} "Lukittu" markers on Oppimispolku — expected 0 for Pro`, '', shot);
  } else {
    rec('P0', 'path', 'Kurssi 1 row not visible on Oppimispolku', '', await shoot('path-no-courses'));
  }

  // ---- Home ----
  await page.locator('a:has-text("Aloitus"), button:has-text("Aloitus")').first().click().catch(() => {});
  await page.waitForTimeout(2000);

  // ---- Writing: click Aloita ----
  console.log('=== Writing flow ===');
  await page.locator('[data-mode="writing"], a:has-text("Kirjoitustehtävä"), button:has-text("Kirjoitustehtävä")').first().click().catch(() => {});
  await page.waitForTimeout(3500);
  await shoot('10-writing');
  const writeStart = page.locator('button:has-text("Aloita"), a:has-text("Aloita")').first();
  if (await writeStart.isVisible().catch(() => false)) {
    const b = consoleErrs.length; const bn = netFails.length;
    await writeStart.click().catch(() => {});
    await page.waitForTimeout(7000);
    const shot = await shoot('11-writing-task');
    const stuck = await page.evaluate(() => {
      const s = document.querySelector('.spinner, .loading');
      return s && s.offsetParent !== null;
    });
    if (stuck) rec('P0', 'writing', 'Writing task stuck on loader >7s', '', shot);
    const blank = await page.evaluate(() => (document.querySelector('main')?.innerText || '').trim().length < 30);
    if (blank) rec('P0', 'writing', 'Writing task screen blank', '', shot);
    const e = consoleErrs.slice(b); const n = netFails.slice(bn);
    if (e.length) rec('P1', 'writing', 'Console errors after Aloita', e[0].slice(0, 200), shot);
    if (n.length) rec('P1', 'writing', 'Network failure after Aloita', n[0].slice(0, 200), shot);
  } else {
    rec('P1', 'writing', 'No "Aloita" button on writing screen', '', await shoot('writing-no-start'));
  }

  // ---- Reading: click first topic + Aloita ----
  await page.locator('a:has-text("Aloitus"), button:has-text("Aloitus")').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  console.log('=== Reading flow ===');
  await page.locator('[data-mode="reading"], a:has-text("Luetun ymmärtäminen"), button:has-text("Luetun ymmärtäminen")').first().click().catch(() => {});
  await page.waitForTimeout(3000);
  await shoot('20-reading');
  const readStart = page.locator('button:has-text("Aloita"), a:has-text("Aloita")').first();
  if (await readStart.isVisible().catch(() => false)) {
    const b = consoleErrs.length; const bn = netFails.length;
    await readStart.click().catch(() => {});
    await page.waitForTimeout(8000);
    const shot = await shoot('21-reading-task');
    const stuck = await page.evaluate(() => {
      const s = document.querySelector('.spinner, .loading');
      return s && s.offsetParent !== null;
    });
    if (stuck) rec('P0', 'reading', 'Reading task stuck on loader >8s', '', shot);
    const blank = await page.evaluate(() => (document.querySelector('main')?.innerText || '').trim().length < 30);
    if (blank) rec('P0', 'reading', 'Reading task screen blank', '', shot);
    const e = consoleErrs.slice(b); const n = netFails.slice(bn);
    if (e.length) rec('P1', 'reading', 'Console errors after Aloita', e[0].slice(0, 200), shot);
    if (n.length) rec('P1', 'reading', 'Network failure after Aloita', n[0].slice(0, 200), shot);
  } else {
    rec('P1', 'reading', 'No "Aloita" button on reading screen', '', await shoot('reading-no-start'));
  }

  // ---- Koeharjoitus: "Aloita uusi koe" inside the modal ----
  await page.locator('a:has-text("Aloitus"), button:has-text("Aloitus")').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  console.log('=== Exam flow ===');
  await page.locator('[data-mode="exam"], a:has-text("Koeharjoitus"), button:has-text("Koeharjoitus")').first().click().catch(() => {});
  await page.waitForTimeout(5000);
  await shoot('30-exam');
  // The screenshot from prior run showed loader stuck. Try clicking "Aloita uusi koe" or "Jatka kesken olevaa".
  const examNew = page.locator('button:has-text("Aloita uusi koe")').first();
  if (await examNew.isVisible().catch(() => false)) {
    const b = consoleErrs.length; const bn = netFails.length;
    await examNew.click();
    await page.waitForTimeout(8000);
    const shot = await shoot('31-exam-new');
    const stuck = await page.evaluate(() => {
      const s = document.querySelector('.spinner, .loading');
      return s && s.offsetParent !== null;
    });
    if (stuck) rec('P0', 'exam', '"Aloita uusi koe" still loading >8s', '', shot);
    const e = consoleErrs.slice(b); const n = netFails.slice(bn);
    if (e.length) rec('P1', 'exam', 'Console error after Aloita uusi', e[0].slice(0, 200), shot);
    if (n.length) rec('P1', 'exam', 'Network failure after Aloita uusi', n[0].slice(0, 200), shot);
  } else {
    // Loader page never resolved — record as P0
    const stuck = await page.evaluate(() => /Tarkistetaan aktiivista/i.test(document.body.innerText || ''));
    if (stuck) rec('P0', 'exam', 'Koeharjoitus screen stuck on "Tarkistetaan aktiivista koetta..." with no usable CTA', '', await shoot('exam-stuck'));
  }

  // ---- Settings → Tallenna kutsumanimi ----
  await page.locator('a:has-text("Aloitus"), button:has-text("Aloitus")').first().click().catch(() => {});
  await page.waitForTimeout(1500);
  console.log('=== Settings flow ===');
  await page.locator('button:has-text("Asetukset"), a:has-text("Asetukset"), [data-screen="settings"]').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await shoot('40-settings');
  // Modal still showing on settings?
  const modalStuckOnSettings = await page.evaluate(() => /keskeneräinen Yo-koe/i.test(document.body.innerText || ''));
  if (modalStuckOnSettings) rec('P1', 'settings', 'Yo-koe modal blocks Settings screen — not dismissed on navigation', '', await shoot('settings-modal-bleed'));

  // Try to save nickname
  const nick = page.locator('input').first();
  if (await nick.isVisible().catch(() => false)) {
    await nick.fill('Audit-Nick');
    const b = consoleErrs.length; const bn = netFails.length;
    const saveBtn = page.locator('button:has-text("Tallenna")').first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click().catch(() => {});
      await page.waitForTimeout(2500);
      const shot = await shoot('41-settings-saved');
      const e = consoleErrs.slice(b); const n = netFails.slice(bn);
      if (e.length) rec('P1', 'settings-save', 'Console error on nickname save', e[0].slice(0, 200), shot);
      if (n.length) rec('P1', 'settings-save', 'Network failure on nickname save', n[0].slice(0, 200), shot);
    } else {
      rec('P2', 'settings', 'No Tallenna button found for nickname', '');
    }
  }

  // "Hallinnoi tilausta" → should open Stripe portal or 503 placeholder
  const manageSub = page.locator('a:has-text("Hallinnoi tilausta"), button:has-text("Hallinnoi tilausta")').first();
  if (await manageSub.isVisible().catch(() => false)) {
    const b = consoleErrs.length; const bn = netFails.length;
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      manageSub.click().catch(() => {}),
    ]);
    await page.waitForTimeout(2500);
    const shot = await shoot('42-settings-manage');
    const e = consoleErrs.slice(b); const n = netFails.slice(bn);
    if (e.length) rec('P1', 'settings-manage-sub', 'Console error', e[0].slice(0, 200), shot);
    if (n.length) rec('P1', 'settings-manage-sub', 'Network failure on Hallinnoi tilausta', n[0].slice(0, 200), shot);
    if (popup) {
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      console.log('Manage-sub popup URL:', popup.url());
      await popup.close();
    }
  }

  // ---- Logout ----
  console.log('=== Logout ===');
  await page.locator('button:has-text("Kirjaudu ulos"), a:has-text("Kirjaudu ulos")').first().click().catch(() => {});
  await page.waitForTimeout(3000);
  await shoot('50-after-logout');
  const back = await page.locator('#auth-email').isVisible().catch(() => false);
  if (!back) rec('P1', 'logout', 'Logout did not return to auth form', `url=${page.url()}`);

  // ---- Report ----
  const summary = { consoleErrors: consoleErrs.slice(0, 80), netFailures: netFails.slice(0, 80), findings };
  fs.writeFileSync(path.join(OUT, 'REPORT.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== DEEP AUDIT SUMMARY ===');
  console.log('Console errors:', consoleErrs.length);
  console.log('Network failures:', netFails.length);
  for (const f of findings) console.log(`[${f.sev}] ${f.where}: ${f.what} | ${f.ev}`);
});
