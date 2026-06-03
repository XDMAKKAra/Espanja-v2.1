// L-V381 — landing block-rhythm + spark. The duplicate grade-flow section is
// gone, replaced by a compact .trust band; the scroll-reveal engine (already
// in landing.css) is now wired via [data-reveal]; the demo stays the centre.
// Brand tokens unchanged. Screenshots at 1440 + 390.
import { test, expect } from '@playwright/test';

test.describe('L-V381 landing spark', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
    });
  });

  test('grade-flow removed, trust band present, demo still leads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // Old duplicate section gone, new compact band in.
    await expect(page.locator('.grade-flow')).toHaveCount(0);
    await expect(page.locator('.trust')).toHaveCount(1);
    await expect(page.locator('.trust__stats .trust__stat')).toHaveCount(4);

    // The dropped flat-SVG illustrations are gone.
    await expect(page.locator('.cta-walker')).toHaveCount(0);
    await expect(page.locator('.grade-flow__aside')).toHaveCount(0);

    // Demo remains the centrepiece and still leads the proof section.
    await expect(page.locator('#kokeile [data-demo-input]')).toBeVisible();
    const order = await page.evaluate(() => {
      const k = document.querySelector('#kokeile');
      const n = document.querySelector('#nayte');
      return (k.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'demo-first' : 'proof-first';
    });
    expect(order).toBe('demo-first');
  });

  test('scroll-reveal engine activates the new data-reveal blocks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    // The demo head carries data-reveal; scroll it into view and confirm the
    // IntersectionObserver adds .is-revealed (i.e. it becomes opaque, not stuck
    // at the dimmed start state).
    const head = page.locator('#kokeile .kokeile__head');
    await expect(head).toHaveAttribute('data-reveal', '');
    await head.scrollIntoViewIfNeeded();
    await expect(head).toHaveClass(/is-revealed/, { timeout: 4000 });
    // The reveal is a 600ms opacity/transform transition; poll until it has
    // settled rather than reading mid-flight.
    await expect.poll(
      () => head.evaluate((el) => Number(getComputedStyle(el).opacity)),
      { timeout: 4000 }
    ).toBeGreaterThan(0.95);
  });

  test('demo grades a short answer end to end', async ({ page }) => {
    // Stub the grade endpoint so the test never spends an OpenAI call and is
    // deterministic; we are verifying the front-end wiring, not the model.
    await page.route('**/api/writing/demo-grade', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          score: 12,
          errors: [{ excerpt: 'fui', corrected: 'fui a', explanation_fi: 'Pikku korjaus.' }],
        }),
      }));

    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});

    const input = page.locator('#kokeile [data-demo-input]');
    await input.scrollIntoViewIfNeeded();
    await input.fill('Ayer fui a la playa con mi familia y comimos paella muy rica todo el dia bajo el sol.');
    const submit = page.locator('#kokeile [data-demo-submit]');
    await expect(submit).toBeEnabled();
    await submit.click();

    const result = page.locator('#kokeile [data-demo-result]');
    await expect(result).toBeVisible();
    await expect(result.locator('.kokeile__score')).toContainText(/viesti/i);
  });

  test('no horizontal scroll at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('screenshots 1440 + 390', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    // Reveal everything for a complete full-page shot.
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-revealed')));
    await page.screenshot({ path: 'screenshots/v381-landing-desktop.png', fullPage: true });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    await page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-revealed')));
    await page.screenshot({ path: 'screenshots/v381-landing-mobile.png', fullPage: true });
  });
});
