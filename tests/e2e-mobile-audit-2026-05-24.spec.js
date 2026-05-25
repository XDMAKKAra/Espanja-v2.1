// L-V300-FULL-AUDIT-1 — täys-audit: 8 polkua × 2 viewporttia produktiossa.
// Tämä spec EI ole regression-spec — se on dokumentointi-ajo. Kerää
// screenshotit, console-virheet, failed network ja paint-metriikat
// docs/briefs/MOBILE-AUDIT-2026-05-24.md -raporttia varten.
//
// Aja: BASE_URL=https://espanja-v2-1.vercel.app npx playwright test e2e-mobile-audit-2026-05-24
// (yksi-projekti — viewport overrideataan per test sisäisesti)

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PROD = process.env.AUDIT_BASE_URL || 'https://espanja-v2-1.vercel.app';
const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

const OUT_MOB  = path.resolve('screenshots/mobile-audit');
const OUT_DESK = path.resolve('screenshots/desktop-audit');
const EVIDENCE = path.resolve('docs/briefs/MOBILE-AUDIT-2026-05-24-evidence.json');

const MOBILE  = { width: 393, height: 852 };  // iPhone 14
const DESKTOP = { width: 1440, height: 900 };

const evidence = {};

function record(viewName, viewport, payload) {
  const vp = viewport.width === MOBILE.width ? 'mobile' : 'desktop';
  evidence[viewName] = evidence[viewName] || {};
  evidence[viewName][vp] = { ...payload };
}

async function attachListeners(page) {
  const consoleErrors = [];
  const consoleWarnings = [];
  const failedNetwork = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'warning') consoleWarnings.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('response', (resp) => {
    const status = resp.status();
    if (status >= 400) failedNetwork.push({ url: resp.url(), status });
  });
  return { consoleErrors, consoleWarnings, failedNetwork };
}

async function paintMetrics(page) {
  try {
    return await page.evaluate(() => {
      const lcpList = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpList.length ? lcpList[lcpList.length - 1].startTime : null;
      const lsEntries = performance.getEntriesByType('layout-shift') || [];
      const cls = lsEntries.reduce((sum, e) => sum + (e.hadRecentInput ? 0 : e.value), 0);
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        lcp_ms: lcp ? Math.round(lcp) : null,
        cls: Math.round(cls * 1000) / 1000,
        dom_ms: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
        load_ms: nav ? Math.round(nav.loadEventEnd) : null,
      };
    });
  } catch (e) {
    return { error: e.message };
  }
}

async function shot(page, viewport, viewName, suffix = 'full') {
  const vp = viewport.width === MOBILE.width ? 'mobile' : 'desktop';
  const dir = vp === 'mobile' ? OUT_MOB : OUT_DESK;
  const slug = viewName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const file = path.join(dir, `${slug}-${vp}-${suffix}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

test.describe('L-V300 Full audit', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_MOB, { recursive: true });
    fs.mkdirSync(OUT_DESK, { recursive: true });
    fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true });
  });

  test.afterAll(() => {
    // Merge with existing file so multi-project runs accumulate
    let existing = {};
    try { existing = JSON.parse(fs.readFileSync(EVIDENCE, 'utf8')); } catch {}
    const merged = { ...existing };
    for (const [k, v] of Object.entries(evidence)) {
      merged[k] = { ...(existing[k] || {}), ...v };
    }
    fs.writeFileSync(EVIDENCE, JSON.stringify(merged, null, 2));
    console.log(`Evidence written: ${EVIDENCE}`);
  });

  // ──────────────────────────────────────────────
  // Path 1: / (espanja root)
  // ──────────────────────────────────────────────
  for (const viewport of [MOBILE, DESKTOP]) {
    test(`P1 landing ES root @ ${viewport.width}`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
      });
      const listeners = await attachListeners(page);
      const resp = await page.goto(`${PROD}/`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(e => null);
      await page.waitForTimeout(800);
      const file = await shot(page, viewport, 'p1-landing-es');
      const m = await paintMetrics(page);
      record('P1 landing ES /', viewport, {
        screenshot: file,
        url: page.url(),
        http_status: resp ? resp.status() : null,
        ...listeners,
        metrics: m,
      });
    });
  }

  // ──────────────────────────────────────────────
  // Path 2-3: /saksan-yo-koe and /ranskan-yo-koe + waitlist
  // ──────────────────────────────────────────────
  for (const [name, slug] of [['saksa', 'saksan-yo-koe'], ['ranska', 'ranskan-yo-koe']]) {
    for (const viewport of [MOBILE, DESKTOP]) {
      test(`P2-3 landing ${name} @ ${viewport.width}`, async ({ page }) => {
        test.setTimeout(60_000);
        await page.setViewportSize(viewport);
        await page.addInitScript(() => {
          try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
        });
        const listeners = await attachListeners(page);
        const resp = await page.goto(`${PROD}/${slug}`, { waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null);
        await page.waitForTimeout(800);
        const fileMain = await shot(page, viewport, `p2-${name}-landing`);

        // Try clicking waitlist CTA if present
        let waitlistShot = null;
        let waitlistError = null;
        try {
          const waitlistBtn = page.locator('button:has-text("liity"), button:has-text("Liity"), a:has-text("Liity"), button:has-text("ilmoittaud"), button:has-text("waitlist")').first();
          if (await waitlistBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await waitlistBtn.click();
            await page.waitForTimeout(800);
            // Fill email if a form appeared
            const emailInput = page.locator('input[type="email"], input[name="email"]').first();
            if (await emailInput.isVisible({ timeout: 1500 }).catch(() => false)) {
              await emailInput.fill('audit+test@example.com');
              waitlistShot = await shot(page, viewport, `p2-${name}-waitlist-filled`);
            } else {
              waitlistShot = await shot(page, viewport, `p2-${name}-waitlist-opened`);
            }
          }
        } catch (e) { waitlistError = e.message; }

        const m = await paintMetrics(page);
        record(`P2-3 landing ${name}`, viewport, {
          screenshot: fileMain,
          waitlist_screenshot: waitlistShot,
          waitlist_error: waitlistError,
          url: page.url(),
          http_status: resp ? resp.status() : null,
          ...listeners,
          metrics: m,
        });
      });
    }
  }

  // ──────────────────────────────────────────────
  // Path 4: short-URL redirects
  // ──────────────────────────────────────────────
  test('P4 short-URL redirects', async ({ page }) => {
    test.setTimeout(60_000);
    const results = [];
    for (const src of ['/saksa', '/saksan', '/ranska', '/ranskan', '/espanja']) {
      const resp = await page.goto(`${PROD}${src}`, { waitUntil: 'load', timeout: 20_000 }).catch(e => ({ error: e.message }));
      const allReq = resp && typeof resp.request === 'function' ? resp.request() : null;
      const chain = [];
      let r = allReq;
      while (r) {
        chain.push(r.url());
        r = r.redirectedFrom();
      }
      results.push({
        source: src,
        finalUrl: page.url(),
        finalStatus: resp && typeof resp.status === 'function' ? resp.status() : null,
        redirectChain: chain.reverse(),
        error: resp && resp.error ? resp.error : null,
      });
    }
    evidence['P4 short-URL redirects'] = { results };
    console.log('REDIRECTS', JSON.stringify(results, null, 2));
  });

  // ──────────────────────────────────────────────
  // Path 5: /onboarding (mobile only — multi-step)
  // ──────────────────────────────────────────────
  test('P5 onboarding flow mobile', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize(MOBILE);
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
      try { localStorage.setItem('puheo:lang', 'es'); } catch {}
    });
    const listeners = await attachListeners(page);
    const steps = [];

    async function snap(label) {
      const file = await shot(page, MOBILE, `p5-onboarding-${label}`);
      steps.push({ label, screenshot: file, url: page.url() });
    }

    try {
      await page.goto(`${PROD}/app.html#/aloitus-v4`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1200);
      await snap('01-intro');

      // Start diagnostic
      const startBtn = page.locator('#ob-v4-intro-start');
      if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startBtn.click();
        await page.waitForTimeout(1200);
        await snap('02-test-q1');

        // Answer 3 Part A questions (pick first option always — capture how the UI handles correct/incorrect)
        for (let i = 1; i <= 3; i++) {
          const opt = page.locator('.ob4-q__option').first();
          if (await opt.isVisible({ timeout: 3000 }).catch(() => false)) {
            await opt.click();
            await page.waitForTimeout(400);
            const submit = page.locator('.ob4-q__submit');
            if (await submit.isEnabled({ timeout: 1500 }).catch(() => false)) {
              await submit.click();
              await page.waitForTimeout(800);
              await snap(`03-feedback-q${i}`);
              const next = page.locator('.ob4-q__next');
              if (await next.isVisible({ timeout: 1500 }).catch(() => false)) {
                await next.click();
                await page.waitForTimeout(600);
              }
            }
          }
        }

        // Skip rest of Part A and Part B + Part C
        for (let i = 0; i < 3; i++) {
          const skipPart = page.locator('#ob-v4-test-skip-part');
          if (await skipPart.isVisible({ timeout: 2000 }).catch(() => false)) {
            await skipPart.click();
            await page.waitForTimeout(800);
            await snap(`04-after-skip-${i}`);
          } else { break; }
        }
      } else {
        await snap('02-intro-no-start-btn');
      }

      // Step 2: courses + grades
      await page.waitForTimeout(800);
      await snap('05-courses-step');
      const k3 = page.locator('[data-course-id="K3"], [data-course="K3"], label:has-text("K3"), button:has-text("K3")').first();
      const k7 = page.locator('[data-course-id="K7"], [data-course="K7"], label:has-text("K7"), button:has-text("K7")').first();
      if (await k3.isVisible({ timeout: 2000 }).catch(() => false)) {
        await k3.click().catch(() => {});
        await page.waitForTimeout(200);
      }
      if (await k7.isVisible({ timeout: 2000 }).catch(() => false)) {
        await k7.click().catch(() => {});
        await page.waitForTimeout(200);
      }
      await snap('06-courses-selected');

      const nextBtn = page.locator('button:has-text("Seuraava"), button:has-text("Jatka")').first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(800);
        await snap('07-grades-step');
        // try selecting grade 8 then 9 if visible
        const g8 = page.locator('button:has-text("8"), label:has-text("8")').first();
        if (await g8.isVisible({ timeout: 2000 }).catch(() => false)) { await g8.click().catch(() => {}); }
        await page.waitForTimeout(400);
        await snap('08-grade-picked');
      }

      // Continue forward through remaining steps blindly (click Seuraava/Jatka until summary or app)
      for (let i = 0; i < 8; i++) {
        const continueBtn = page.locator('button:has-text("Seuraava"), button:has-text("Jatka"), button:has-text("Aloita"), button:has-text("aloita")').first();
        if (await continueBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await continueBtn.click().catch(() => {});
          await page.waitForTimeout(900);
          await snap(`09-step-${i}`);
        } else { break; }
      }
    } catch (e) {
      steps.push({ error: e.message });
    }

    record('P5 onboarding flow', MOBILE, { steps, ...listeners });
  });

  // ──────────────────────────────────────────────
  // Path 6: /app dashboard (logged in as testpro)
  // ──────────────────────────────────────────────
  for (const viewport of [MOBILE, DESKTOP]) {
    test(`P6 /app dashboard @ ${viewport.width}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
      });
      const listeners = await attachListeners(page);

      await page.goto(`${PROD}/app.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);

      // Login if auth form is visible. L-V312 spec-fix: target the submit
      // button explicitly ('Kirjaudu sisään'), not the tab button ('Kirjaudu'),
      // and wait for screen-home.active instead of an arbitrary timeout.
      const emailField = page.locator('#auth-email, input[name="email"][type="email"]').first();
      let loggedIn = false;
      if (await emailField.isVisible({ timeout: 4000 }).catch(() => false)) {
        await emailField.fill(EMAIL);
        await page.locator('#auth-password, input[type="password"]').first().fill(PASS);
        const submitBtn = page.locator('button[type="submit"]:has-text("Kirjaudu sisään"), button:has-text("Kirjaudu sisään")').first();
        await submitBtn.click().catch(() => {});
        await page.waitForSelector('#screen-home.active, .screen.active', { timeout: 15000 }).catch(() => {});
        loggedIn = true;
      }
      const homeShot = await shot(page, viewport, 'p6-app-home');

      // Try opening settings + profile (memory P0 — did they ever open?)
      const settingsLink = page.locator('a:has-text("Asetukset"), button:has-text("Asetukset"), [href*="asetukset"], [data-route*="asetukset"]').first();
      let settingsShot = null, settingsBlocked = null;
      try {
        if (await settingsLink.isVisible({ timeout: 2500 }).catch(() => false)) {
          await settingsLink.click();
          await page.waitForTimeout(1200);
          settingsShot = await shot(page, viewport, 'p6-settings');
        } else { settingsBlocked = 'no settings link visible'; }
      } catch (e) { settingsBlocked = e.message; }

      // Profile
      const profileLink = page.locator('a:has-text("Profiili"), button:has-text("Profiili"), [href*="profiili"], [data-route*="profiili"]').first();
      let profileShot = null, profileBlocked = null;
      try {
        if (await profileLink.isVisible({ timeout: 2500 }).catch(() => false)) {
          await profileLink.click();
          await page.waitForTimeout(1200);
          profileShot = await shot(page, viewport, 'p6-profile');
        } else { profileBlocked = 'no profile link visible'; }
      } catch (e) { profileBlocked = e.message; }

      // Tehtävät TOC
      const tehtavatLink = page.locator('a:has-text("Tehtävät"), button:has-text("Tehtävät"), [href*="tehtava"], [data-route*="tehtava"]').first();
      let tehtavatShot = null;
      try {
        if (await tehtavatLink.isVisible({ timeout: 2500 }).catch(() => false)) {
          await tehtavatLink.click();
          await page.waitForTimeout(1200);
          tehtavatShot = await shot(page, viewport, 'p6-tehtavat');
        }
      } catch (e) {}

      const m = await paintMetrics(page);
      record('P6 /app dashboard', viewport, {
        screenshot_home: homeShot,
        screenshot_settings: settingsShot,
        settings_blocked: settingsBlocked,
        screenshot_profile: profileShot,
        profile_blocked: profileBlocked,
        screenshot_tehtavat: tehtavatShot,
        loggedIn,
        url: page.url(),
        ...listeners,
        metrics: m,
      });
    });
  }

  // ──────────────────────────────────────────────
  // Path 7: K1 lesson → exercise
  // ──────────────────────────────────────────────
  test('P7 K1 lesson smoke mobile', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize(MOBILE);
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
    });
    const listeners = await attachListeners(page);

    await page.goto(`${PROD}/app.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(1500);

    // login if needed (L-V312 spec-fix: target submit, wait for home)
    const emailField = page.locator('#auth-email, input[name="email"][type="email"]').first();
    if (await emailField.isVisible({ timeout: 4000 }).catch(() => false)) {
      await emailField.fill(EMAIL);
      await page.locator('#auth-password, input[type="password"]').first().fill(PASS);
      const submitBtn = page.locator('button[type="submit"]:has-text("Kirjaudu sisään"), button:has-text("Kirjaudu sisään")').first();
      await submitBtn.click().catch(() => {});
      await page.waitForSelector('#screen-home.active, .screen.active', { timeout: 15000 }).catch(() => {});
    }

    // Go to learning path / curriculum
    await page.goto(`${PROD}/app.html#/oppimispolku`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const pathShot = await shot(page, MOBILE, 'p7-oppimispolku');

    // Find K1 link
    let lessonShot = null;
    let exerciseShot = null;
    try {
      const k1 = page.locator('a:has-text("K1"), button:has-text("K1"), [data-course-id="K1"], [data-course="K1"]').first();
      if (await k1.isVisible({ timeout: 3000 }).catch(() => false)) {
        await k1.click();
        await page.waitForTimeout(1500);
        lessonShot = await shot(page, MOBILE, 'p7-k1-detail');

        // Try first lesson link
        const lesson1 = page.locator('a:has-text("oppitunti"), a:has-text("Lesson 1"), a:has-text("Oppitunti 1"), button:has-text("Aloita")').first();
        if (await lesson1.isVisible({ timeout: 3000 }).catch(() => false)) {
          await lesson1.click();
          await page.waitForTimeout(2500);
          exerciseShot = await shot(page, MOBILE, 'p7-lesson-first-exercise');
        }
      }
    } catch (e) {}

    const m = await paintMetrics(page);
    record('P7 K1 lesson smoke', MOBILE, {
      screenshot_path: pathShot,
      screenshot_k1: lessonShot,
      screenshot_exercise: exerciseShot,
      url: page.url(),
      ...listeners,
      metrics: m,
    });
  });

  // ──────────────────────────────────────────────
  // Path 8: Settings → tier / paywall
  // ──────────────────────────────────────────────
  for (const viewport of [MOBILE, DESKTOP]) {
    test(`P8 settings + tier @ ${viewport.width}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.setViewportSize(viewport);
      await page.addInitScript(() => {
        try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
      });
      const listeners = await attachListeners(page);

      await page.goto(`${PROD}/app.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await page.waitForTimeout(1500);
      const emailField = page.locator('#auth-email, input[name="email"][type="email"]').first();
      if (await emailField.isVisible({ timeout: 4000 }).catch(() => false)) {
        await emailField.fill(EMAIL);
        await page.locator('#auth-password, input[type="password"]').first().fill(PASS);
        // L-V312 spec-fix: target the SUBMIT button, not the tab.
        const submitBtn = page.locator('button[type="submit"]:has-text("Kirjaudu sisään"), button:has-text("Kirjaudu sisään")').first();
        await submitBtn.click().catch(() => {});
        await page.waitForSelector('#screen-home.active, .screen.active', { timeout: 15000 }).catch(() => {});
      }

      await page.goto(`${PROD}/app.html#/asetukset`, { waitUntil: 'domcontentloaded', timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const settingsShot = await shot(page, viewport, 'p8-settings-direct');

      // Look for "Tilaus" / tier badge
      const tilaus = page.locator('text=/Tilaus|tilaus|Pro|Free|Premium/i').first();
      let tierVisible = false;
      try { tierVisible = await tilaus.isVisible({ timeout: 2000 }); } catch {}

      record(`P8 settings + tier`, viewport, {
        screenshot: settingsShot,
        tierVisible,
        url: page.url(),
        ...listeners,
        metrics: await paintMetrics(page),
      });
    });
  }
});
