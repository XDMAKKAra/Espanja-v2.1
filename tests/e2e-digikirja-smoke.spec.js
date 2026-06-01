// PR1+2 smoke: Otava Fokus 7 three-panel digikirja screen.
// PR1 verified the shell renders + SideMenu navigation + toggle persist.
// PR2 verifies real lesson JSON is fetched, teoria sivu renders the
// teaching markdown (BilingualTable + InfoBox + key points), and the
// SideMenu's sivu list is derived from the lesson's phases.
import { test, expect } from '@playwright/test';
import path from 'path';

const EMAIL = process.env.TEST_PRO_EMAIL || 'testpro123@gmail.com';
const PASS  = process.env.TEST_PRO_PASSWORD || 'Testpro123';

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

// PR8b — wipe the server-side digikirja progress for the demo lesson
// so progress-sensitive tests start from a known-empty state.
async function clearDigikirjaServerProgress(page, lang = 'es', kurssi = 'kurssi_2', lesson = 3) {
  await page.evaluate(async ({ lang, kurssi, lesson }) => {
    const t = localStorage.getItem('puheo_token');
    if (!t) return;
    const headers = { Authorization: `Bearer ${t}` };
    const q = `lang=${lang}&kurssi=${encodeURIComponent(kurssi)}&lesson=${lesson}`;
    await Promise.all([
      fetch(`/api/digikirja/progress?${q}`,  { method: 'DELETE', headers }).catch(() => {}),
      fetch(`/api/digikirja/itsearvio?${q}`, { method: 'DELETE', headers }).catch(() => {}),
    ]);
  }, { lang, kurssi, lesson });
}

const DEMO_HASH = '#/oppitunti/es/kurssi_2/3/teoria';

test('digikirja shell renders the real Ruoka ja ateriat lesson', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.evaluate((h) => { location.hash = h; }, DEMO_HASH);
  await page.waitForTimeout(1200);

  const active = await page.evaluate(() => document.querySelector('.screen.active')?.id);
  expect(active).toBe('screen-digikirja');

  // TopBar title comes from lesson_3.json meta.title.
  await expect(page.locator('.dk__topbar .dk__title')).toHaveText(/Ruoka ja ateriat/);

  // SideMenu is built from lesson data: 1 teoria + 10 phases + 1 flashcards
  // = 12 rows. Per-lesson Testit + Itsearviointi were removed 2026-05-20.
  const rowCount = await page.locator('.dk__sidemenu-list .dk__row').count();
  expect(rowCount).toBe(12);

  // First row is the teoria sivu, active by default.
  await expect(page.locator('.dk__row.is-active')).toHaveAttribute('data-sivu', 'teoria');

  // Teoria sivu renders the markdown: page title (italic em), at least one
  // BilingualTable (ateriat), and an Obs! InfoBox.
  await expect(page.locator('.dk__page-title em')).toContainText('Ruoka ja ateriat');
  await expect(page.locator('.dk__bilingual')).toHaveCount(1);
  await expect(page.locator('.dk__bilingual th').first()).toBeVisible();
  await expect(page.locator('.dk__obs')).toHaveCount(2);
  await expect(page.locator('.dk__obs-label').first()).toHaveText('Obs!');

  // Key points panel renders the teaching.key_points array.
  await expect(page.locator('.dk__key-points')).toBeVisible();

  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr2-teoria.png'),
    fullPage: true,
  });
});

test('Prev/Next walks teoria → phase-0 → phase-1', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.evaluate((h) => { location.hash = h; }, DEMO_HASH);
  await page.waitForTimeout(1200);

  await page.locator('.dk__prevnext--bottom .dk__prevnext-btn--next').click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => location.hash)).toContain('/3/phase-0');

  await page.locator('.dk__prevnext--bottom .dk__prevnext-btn--next').click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => location.hash)).toContain('/3/phase-1');
});

test('PR3 — rows carry a non-emoji marker + data-kind + scroll-to-active', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // The SideMenu defaults to collapsed; open it so the rows render and
  // scroll-to-active has something to scroll.
  await page.evaluate(() => { try { localStorage.setItem('puheo:dk:sidemenu', 'open'); } catch {} });

  // Land on a sivu deep in the SideMenu so scroll-to-active has work to do.
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3/phase-9'; });
  await page.waitForTimeout(1200);
  await expect(page.locator('#dk-root[data-sidemenu="open"]')).toBeVisible();

  // Every row carries a styled bullet marker (not an emoji) and a data-kind.
  const totalRows = await page.locator('.dk__sidemenu-list .dk__row').count();
  const rowsWithMarker = await page.locator('.dk__sidemenu-list .dk__row .dk__row-bullet').count();
  expect(rowsWithMarker).toBe(totalRows);

  // Representative rows (teoria / exercise phase / deep phase / flashcards)
  // are visible, carry a marker, and expose their kind via data-kind.
  for (const sivu of ['teoria', 'phase-0', 'phase-9', 'kortit-1']) {
    const row = page.locator(`.dk__row[data-sivu="${sivu}"]`);
    await expect(row).toBeVisible();
    await expect(row.locator('.dk__row-bullet')).toBeAttached();
    await expect(row).toHaveAttribute('data-kind', /.+/);
  }

  // The active row must be scrolled into the visible portion of the
  // SideMenu list — i.e. its bounding box overlaps the list's box.
  const inView = await page.evaluate(() => {
    const active = document.querySelector('.dk__row.is-active');
    const list = document.getElementById('dk-sidemenu-list');
    if (!active || !list) return false;
    const aR = active.getBoundingClientRect();
    const lR = list.getBoundingClientRect();
    return aR.top >= lR.top && aR.bottom <= lR.bottom + 1;
  });
  expect(inView).toBe(true);

  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr3-glyphs.png'),
    fullPage: true,
  });
});

test('PR4 — ExerciseCard renders mc, scores correctly, advances', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // phase-0 = "Tunnista — ateriat ja juomat" (12 mc items).
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3/phase-0'; });
  await page.waitForTimeout(1200);

  await expect(page.locator('.dk__exercise')).toBeVisible();
  await expect(page.locator('.dk__exercise-eyebrow')).toContainText('Tehtävä 1 / 12');

  // First item: "el desayuno" → "aamiainen" (index 1).
  await expect(page.locator('.dk__exercise-stem')).toContainText('el desayuno');
  await page.locator('.dk__choice[data-choice="1"]').click();
  await page.waitForTimeout(150);
  await expect(page.locator('.dk__feedback-chip.is-correct')).toBeVisible();
  await expect(page.locator('.dk__exercise-score')).toContainText('1 / 1');

  // Advance to item 2.
  await page.locator('#dk-next-item').click();
  await page.waitForTimeout(120);
  await expect(page.locator('.dk__exercise-eyebrow')).toContainText('Tehtävä 2 / 12');

  // Pick the wrong choice (whichever is NOT correct_index in the JSON, choose 0).
  await page.locator('.dk__choice[data-choice="0"]').click();
  await page.waitForTimeout(150);
  // One of is-correct or is-wrong must be visible; score must now be 1/2 or 2/2.
  const score2 = await page.locator('.dk__exercise-score').textContent();
  expect(score2).toMatch(/\d+\s*\/\s*2/);
  await expect(page.locator('.dk__feedback-chip')).toBeVisible();
  await expect(page.locator('.dk__feedback-expected')).toBeVisible();

  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr4-exercise.png'),
    fullPage: true,
  });
});

test('PR4 — typed input accepts the correct translation', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // phase-3 = "Käännä suomeksi" (es_to_fi typed items).
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3/phase-3'; });
  await page.waitForTimeout(1200);

  // First item prompts "el desayuno" → accept includes "aamiainen".
  await expect(page.locator('.dk__exercise-stem')).toContainText('el desayuno');
  await page.locator('#dk-input').fill('aamiainen');
  await page.locator('#dk-check').click();
  await page.waitForTimeout(150);
  await expect(page.locator('.dk__feedback-chip.is-correct')).toBeVisible();
  await expect(page.locator('.dk__exercise-score')).toContainText('1 / 1');
});

test('PR5 — Flashcard flips, "Tiedän" advances + persists', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Clear any prior flashcard progress so the spec is deterministic.
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('puheo:dk:flashcards')) localStorage.removeItem(k);
    });
  });

  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3/kortit-1'; });
  await page.waitForTimeout(1200);

  await expect(page.locator('.dk__flashpack')).toBeVisible();
  await expect(page.locator('.dk__flashcard')).toBeVisible();
  await expect(page.locator('.dk__exercise-score')).toContainText('0 / 5');

  // Card 1 front: Spanish headword, "Tiedän" is hidden until flip.
  await expect(page.locator('.dk__flashcard-face--front .dk__flashcard-word')).toContainText('el desayuno');
  await expect(page.locator('#dk-flash-know')).toBeHidden();

  // Flip via the explicit Käännä button.
  await page.locator('#dk-flash-flip').click();
  await page.waitForTimeout(150);
  await expect(page.locator('.dk__flashcard.is-flipped')).toBeVisible();
  await expect(page.locator('#dk-flash-know')).toBeVisible();

  // "Tiedän" commits + advances to card 2.
  await page.locator('#dk-flash-know').click();
  await page.waitForTimeout(150);
  await expect(page.locator('.dk__exercise-score')).toContainText('1 / 5');
  await expect(page.locator('.dk__exercise-eyebrow')).toContainText('Kortti 2 / 5');

  // Persistence: the previous card's status is in localStorage.
  const persisted = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith('puheo:dk:flashcards'));
    return key ? JSON.parse(localStorage.getItem(key)) : null;
  });
  expect(persisted).toBeTruthy();
  expect(Object.values(persisted)).toContain('know');

  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr5-flashcard.png'),
    fullPage: true,
  });
});

// PR6 (Testi) and PR7 (Itsearviointi) specs removed 2026-06-01: the per-lesson
// Testit + Itsearviointi sivut were dropped from buildSivut on 2026-05-20, so
// no route renders them anymore. The renderers remain in digikirja.js as dead
// code for a possible future course-level screen; if that lands, re-add specs.

test('PR8 — legacy 4-segment lesson route redirects to digikirja /teoria', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Hit the legacy four-segment form (no /sivu).
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3'; });
  await page.waitForTimeout(1500);

  // We land on the digikirja screen at the teoria sivu.
  const active = await page.evaluate(() => document.querySelector('.screen.active')?.id);
  expect(active).toBe('screen-digikirja');
  expect(await page.evaluate(() => location.hash)).toContain('/3/teoria');
});

test('PR8 — progress chip + SideMenu is-done update on completion', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Wipe progress (both local cache + server row) plus any flashcard state so
  // the count starts at 0 and hydrate-from-server doesn't carry prior runs.
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('puheo:dk:progress') || k.startsWith('puheo:dk:flashcards')) {
        localStorage.removeItem(k);
      }
    });
  });
  await clearDigikirjaServerProgress(page);

  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3/teoria'; });
  await page.waitForTimeout(1200);

  // teoria flips the chip to 1/12 (lesson_3 has 12 sivut). The sidemenu
  // defaults to collapsed, so assert the row's done STATE (class), not
  // its visibility.
  await expect(page.locator('#dk-progress-chip')).toContainText('1 / 12 valmis');
  await expect(page.locator('.dk__row[data-sivu="teoria"]')).toHaveClass(/is-done/);

  // Complete the flashcard sivu (5 cards: flip + "Tiedän" each) — finishing
  // the pack marks the sivu done and bumps the chip to 2/12.
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_2/3/kortit-1'; });
  await page.waitForTimeout(1000);
  for (let c = 0; c < 5; c++) {
    await page.locator('#dk-flash-flip').click();
    await page.waitForTimeout(120);
    await page.locator('#dk-flash-know').click();
    await page.waitForTimeout(120);
  }

  await expect(page.locator('.dk__row[data-sivu="kortit-1"]')).toHaveClass(/is-done/);
  await expect(page.locator('#dk-progress-chip')).toContainText('2 / 12 valmis');

  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr8-progress.png'),
    fullPage: true,
  });
});

test('PR9 — wordbank chips fill gap_fill inputs + digikirja is full-bleed', async ({ page }) => {
  test.setTimeout(90_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Land on phase-5 (Lauseen täydennys, gap_fill) in kurssi_1 lesson_1.
  await page.evaluate(() => { location.hash = '#/oppitunti/es/kurssi_1/1/phase-5'; });
  await page.waitForTimeout(1300);

  await expect(page.locator('.dk__exercise')).toBeVisible();
  const chipCount = await page.locator('.dk__wordbank-chip').count();
  expect(chipCount).toBeGreaterThanOrEqual(2);

  // Click the first chip → that word lands in the first gap input.
  const firstChip = page.locator('.dk__wordbank-chip').first();
  const word = (await firstChip.textContent())?.trim();
  expect(word).toBeTruthy();
  await firstChip.click();
  await page.waitForTimeout(120);
  const inputValue = await page.locator('.dk__input--gap').first().inputValue();
  expect(inputValue).toBe(word);

  // Digikirja screen fills the viewport area to the right of the
  // sidebar — its bounding-box width must be substantially wider than
  // the legacy .app-main-inner cap (880px) and the height should
  // approach viewport height.
  const dkBox = await page.locator('#screen-digikirja .dk').boundingBox();
  expect(dkBox).toBeTruthy();
  expect(dkBox.width).toBeGreaterThan(1000);
  expect(dkBox.height).toBeGreaterThan(600);
  await page.screenshot({
    path: path.resolve('audit-screens', 'digikirja-pr9-fullbleed-and-bank.png'),
    fullPage: true,
  });
});

test('SideMenu toggle persists across navigation', async ({ page }) => {
  test.setTimeout(60_000);
  await login(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  // Clear sidemenu pref so the toggle test is deterministic regardless
  // of what earlier tests in this file did.
  await page.evaluate(() => { try { localStorage.removeItem('puheo:dk:sidemenu'); } catch {} });

  await page.evaluate((h) => { location.hash = h; }, DEMO_HASH);
  // Wait for the full shell, not just a fixed timer — hydrateFromServer
  // (PR8b) adds an async round-trip whose duration depends on Supabase
  // latency. Asserting on the visible toggle gives us a reliable signal.
  await expect(page.locator('#dk-toggle-sidemenu')).toBeVisible();
  // Default is COLLAPSED (panel hidden until the user opens it); only a saved
  // "open" choice is honoured. With the pref cleared above we start collapsed.
  await expect(page.locator('#dk-root[data-sidemenu="collapsed"]')).toBeVisible();

  await page.locator('#dk-toggle-sidemenu').click();
  await expect(page.locator('#dk-root[data-sidemenu="open"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('puheo:dk:sidemenu'))).toBe('open');
});
