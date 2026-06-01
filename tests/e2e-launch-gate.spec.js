// L-V342 — Funktionaalinen launch-gate.
//
// Tarkistaa launch-spesifiset asiat joita V335-340 ei kata:
//  1. Uuden käyttäjän kielikohtainen polku renderöityy es + de + fr
//     (diagnostiikka = oikean kielen Osa A: lause + optiot + arvio).
//  2. Per-kieli landing-sivut latautuvat oikealla sisällöllä.
//  3. Legal-sivut (privacy/terms/refund) tavoitettavissa, ei 404.
//  4. 404-sivu palautuu tuntemattomalle polulle (ei stack trace / valkoinen ruutu).
//  5. App: rekisteröinnin suostumus + asetusten Lakitiedot linkittävät legaliin.
//
// Sähköpostivahvistus on tämän briefin out-of-scope (tehdään myöhemmin).

import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3000";

// Kullakin kielellä Osa A:n Q1 on uniikki — todistaa että de/fr ei putoa ES-fallbackiin.
// landing = suoraan tarjottu tiedosto (toimii sekä lokaalisti että Vercelissä).
// Vercel mappaa lisäksi pretty-URLit /espanja-yo-koe → tämä tiedosto (vercel.json rewrites).
const LANGS = {
  es: { suffix: "profesora de matemáticas", correct: "es", landing: "/public/landing/espanja.html", landingNeedle: /espanja/i },
  de: { suffix: "Mann arbeitet als Lehrer", correct: "Der", landing: "/public/landing/saksa.html", landingNeedle: /saksa/i },
  fr: { suffix: "film tous les soirs", correct: "le", landing: "/public/landing/ranska.html", landingNeedle: /ranska/i },
};

for (const [lang, cfg] of Object.entries(LANGS)) {
  test(`[${lang}] diagnostiikka renderöityy oikealla kielellä ja arvioi vastauksen`, async ({ page }) => {
    await page.addInitScript(
      (l) => {
        try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
        try { localStorage.setItem("puheo:lang", l); } catch {}
      },
      lang
    );

    await page.goto(`${BASE}/app.html#/aloitus-v4`);
    await page.locator("#ob-v4-intro-start").click();

    // Osa A, kysymys 1 — oikean kielen sisältö (ei ES-fallback de/fr:ssä).
    await expect(page.locator("#screen-ob-v4-test")).toHaveClass(/active/);
    await expect(page.locator("#ob-v4-test-progress")).toContainText(/1 \/ 15/);
    await expect(page.locator(".ob4-q__sentence")).toContainText(cfg.suffix);

    // Vastaa oikein → arvio (feedback) renderöityy.
    const correctOption = page.locator(".ob4-q__option", { hasText: new RegExp(`^${cfg.correct}$`) }).first();
    await correctOption.click();
    await page.locator(".ob4-q__submit").click();
    await expect(page.locator(".ob4-q__feedback")).toBeVisible();
    await expect(page.locator(".ob4-q__feedback")).toHaveClass(/is-correct/);
  });

  test(`[${lang}] landing-sivu latautuu`, async ({ page }) => {
    // Ohita pre-launch-gate (muuten gate korvaa DOM:in + tyhjentää titlen).
    await page.addInitScript(() => {
      try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
    });
    const resp = await page.goto(`${BASE}${cfg.landing}`, { waitUntil: "domcontentloaded" });
    expect(resp.status()).toBeLessThan(400);
    // Assertoi näkyvä h1 (engine-robusti; webkit-emulaatio voi raportoida titlen tyhjäksi).
    await expect(page.locator("h1").first()).toContainText(cfg.landingNeedle);
  });
}

test("legal-sivut tavoitettavissa (privacy/terms/refund), ei 404", async ({ page }) => {
  for (const path of ["/privacy.html", "/terms.html", "/refund.html"]) {
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    expect(resp.status(), `${path} pitäisi palauttaa 200`).toBe(200);
    const body = await page.locator("body").innerText();
    expect(body.length, `${path} ei saa olla tyhjä`).toBeGreaterThan(50);
  }
});

test("landing-footer linkittää kaikki kolme legal-sivua", async ({ page }) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('.landing-footer a[href="/privacy.html"]')).toHaveCount(1);
  await expect(page.locator('.landing-footer a[href="/terms.html"]')).toHaveCount(1);
  await expect(page.locator('.landing-footer a[href="/refund.html"]')).toHaveCount(1);
});

test("404-sivu palautuu tuntemattomalle polulle", async ({ page }) => {
  const resp = await page.goto(`${BASE}/tata-sivua-ei-ole-xyz-123`, { waitUntil: "domcontentloaded" });
  expect(resp.status()).toBe(404);
  await expect(page.locator(".nf__title")).toContainText(/Sivua ei löytynyt/i);
  await expect(page.locator('.nf__btn[href="/"]')).toBeVisible();
});

test("API 404 palauttaa JSON-virheen, ei stack tracea", async ({ request }) => {
  const resp = await request.get(`${BASE}/api/tata-reittia-ei-ole`);
  expect(resp.status()).toBe(404);
  const json = await resp.json();
  expect(json.error).toBeTruthy();
});

test("rekisteröinti näyttää suostumuksen legal-linkeillä", async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
  await page.goto(`${BASE}/app.html#rekisteroidy`);
  const legal = page.locator("#auth-legal");
  await expect(legal).toBeVisible();
  await expect(legal.locator('a[href="/terms.html"]')).toHaveCount(1);
  await expect(legal.locator('a[href="/privacy.html"]')).toHaveCount(1);
});

test("asetusten Lakitiedot-osio linkittää legaliin", async ({ page }) => {
  await page.goto(`${BASE}/app.html`, { waitUntil: "domcontentloaded" });
  // Markup on staattisesti app.html:ssä, ei vaadi kirjautumista renderöityäkseen DOM:iin.
  await expect(page.locator('#screen-settings a[href="/privacy.html"]')).toHaveCount(1);
  await expect(page.locator('#screen-settings a[href="/terms.html"]')).toHaveCount(1);
  await expect(page.locator('#screen-settings a[href="/refund.html"]')).toHaveCount(1);
});
