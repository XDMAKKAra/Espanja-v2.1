// L-V338 — yhdistämistehtävä (match) in the digikirja reader.
// Verifies the match item renders as a real two-column matching UI (no
// "avautuu pian" placeholder, not hidden) and grades correctly via the
// local gradeMatchingPair path. Targets es/kurssi_2/lesson_3 phase-1
// ("Yhdistä: ruoat", 12 pairs) — the same lesson the smoke suite uses.
import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

const MATCH_HASH = '#/oppitunti/es/kurssi_2/3/phase-1';
const LESSON_URL = '/data/courses/es/kurssi_2/lesson_3.json';

async function login(page) {
  await page.addInitScript(() => {
    try { localStorage.setItem('puheo_gate_ok_v1', '1'); } catch {}
  });
  await page.goto('/app.html');
  await page.waitForLoadState('networkidle').catch(() => {});
  const emailField = page.locator('#auth-email');
  if (await emailField.isVisible().catch(() => false)) {
    await emailField.fill(EMAIL);
    await page.locator('#auth-password').fill(PASS);
    await page.locator('button:has-text("Kirjaudu sisään")').first().click();
    await page.waitForTimeout(2200);
  }
}

// Read the first match item's pairs straight from the served lesson JSON so
// the test can drive a deterministic, correct pairing.
async function matchPairs(page) {
  return page.evaluate(async (url) => {
    const j = await (await fetch(url)).json();
    const phase = (j.phases || []).find((p) => (p.items || [])[0]?.item_type === 'match');
    return phase ? phase.items[0].pairs : [];
  }, LESSON_URL);
}

test('match renders as a real matching UI, not a coming-soon placeholder', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const pairs = await matchPairs(page);
  expect(pairs.length).toBeGreaterThan(0);

  await page.evaluate((h) => { location.hash = h; }, MATCH_HASH);
  await page.waitForTimeout(1300);

  // The match grid is present; the placeholder copy is gone.
  await expect(page.locator('.dk__match')).toBeVisible();
  await expect(page.locator('.dk__placeholder')).toHaveCount(0);
  await expect(page.getByText('Tämä tehtävätyyppi avautuu pian')).toHaveCount(0);

  // Two columns, one cell per pair on each side.
  await expect(page.locator('.dk__match-cell[data-side="left"]')).toHaveCount(pairs.length);
  await expect(page.locator('.dk__match-cell[data-side="right"]')).toHaveCount(pairs.length);
});

test('correct pairing grades 12 / 12 with every row marked correct', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const pairs = await matchPairs(page);
  await page.evaluate((h) => { location.hash = h; }, MATCH_HASH);
  await page.waitForTimeout(1300);
  await expect(page.locator('.dk__match')).toBeVisible();

  // Left cell idx i is pairs[i]; attach its correct right value.
  for (let i = 0; i < pairs.length; i++) {
    const right = pairs[i].right;
    await page.locator(`.dk__match-cell[data-side="left"][data-idx="${i}"]`).click();
    await page.locator(`.dk__match-cell[data-side="right"][data-val="${right.replace(/"/g, '\\"')}"]`).first().click();
  }

  await page.locator('#dk-check').click();
  await page.waitForTimeout(200);

  await expect(page.locator('.dk__match-score')).toContainText(`${pairs.length} / ${pairs.length} oikein`);
  await expect(page.locator('.dk__match-result.is-correct')).toHaveCount(pairs.length);
  await expect(page.locator('.dk__feedback-chip.is-correct')).toBeVisible();
});

test('a wrong pairing is marked wrong and reveals the correct answer', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  const pairs = await matchPairs(page);
  await page.evaluate((h) => { location.hash = h; }, MATCH_HASH);
  await page.waitForTimeout(1300);
  await expect(page.locator('.dk__match')).toBeVisible();

  // Pair left 0 with the WRONG right (right of pair 1), the rest correctly.
  await page.locator('.dk__match-cell[data-side="left"][data-idx="0"]').click();
  await page.locator(`.dk__match-cell[data-side="right"][data-val="${pairs[1].right.replace(/"/g, '\\"')}"]`).first().click();
  for (let i = 1; i < pairs.length; i++) {
    await page.locator(`.dk__match-cell[data-side="left"][data-idx="${i}"]`).click();
    await page.locator(`.dk__match-cell[data-side="right"][data-val="${pairs[i].right.replace(/"/g, '\\"')}"]`).first().click();
  }

  await page.locator('#dk-check').click();
  await page.waitForTimeout(200);

  // Row 0 wrong (pair 1's right was taken, so pair 1 also ends up unmatched/wrong).
  await expect(page.locator('.dk__match-result.is-wrong').first()).toBeVisible();
  await expect(page.locator('.dk__match-result-fix').first()).toContainText(pairs[0].right);
  await expect(page.locator('.dk__feedback-chip.is-wrong')).toBeVisible();
});

test('mobile <440px: match grid does not cause horizontal scroll', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await matchPairs(page);
  await page.evaluate((h) => { location.hash = h; }, MATCH_HASH);
  await page.waitForTimeout(1300);
  await expect(page.locator('.dk__match')).toBeVisible();

  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
