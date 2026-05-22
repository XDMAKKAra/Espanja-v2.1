# BRIEF: Playwright-runtime-audit v283

**Päivä:** 2026-05-22
**Versio:** v283
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v270–v282 (kaikki ajetut muutokset) mainissa
**Skill-stack:** TESTING (webapp-testing, superpowers:test-driven-development, superpowers:verification-before-completion, superpowers:systematic-debugging) + FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng). Kutsu Skill-toolia aidosti.

---

## Tavoite

Aja **kattava Playwright-runtime-audit** koko Puheo-sovelluksesta. Klikkaa jokainen reachable-nappi/kortti, kerää konsoli-virheet, network-failuurit, jumiin jääneet loaderit, visuaaliset bugit. Raportoi prioritetisoitu P0/P1/P2-lista.

Tämä **EI ole korjaus-brief** — vain laajamittainen havainnointi v270–v282-muutosten jälkeen. Korjausbriefit syntyvät tämän auditin tulosten pohjalta.

---

## Konteksti

Aiemmin tässä sessiossa (2026-05-22) dispatchattiin Playwright-runtime-audit-agentti joka kirjoitti `tests/e2e-_runtime-audit.spec.js` + `tests/e2e-_runtime-audit-deep.spec.js`, mutta ei palauttanut raporttia ennen loppumistaan. Ne specit ovat git-statuksessa untracked. Tämä brief jatkaa siitä kunnolliseksi auditiksi.

---

## Toteutus

### Vaihe 1: Aja olemassa olevat scratch-specit (jos ne toimivat)

```bash
ls tests/e2e-_runtime-audit*.spec.js
```

Jos ne ovat olemassa: yritä ajaa ne ja katso mitä ne raportoivat:
```bash
npx playwright test tests/e2e-_runtime-audit.spec.js --reporter=list
```

Jos ne toimivat ja kattavat tarpeellisen: skip Vaihe 2, hyppää Vaihe 3:een.
Jos ne ovat puutteellisia tai rikki: poista ne ja jatka Vaiheeseen 2.

### Vaihe 2: Kirjoita uusi audit-spec

**Tiedosto:** `tests/e2e-runtime-audit-v283.spec.js`

Spec rakenne:
```js
import { test, expect } from "@playwright/test";

const BASE = process.env.PUHEO_TEST_URL || "https://espanja-v2-1.vercel.app";
const EMAIL = "testpro123@gmail.com";
const PASSWORD = "Testpro123";

// Memory: feedback_playwright_gate.md — bypass pre-launch prompt
test.use({
  storageState: undefined,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try { localStorage.setItem("puheo_gate_ok_v1", "1"); } catch {}
  });
  // Console + network error capture
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log(`[console-error] ${msg.text()}`);
    }
  });
  page.on("response", res => {
    if (res.status() >= 400) {
      console.log(`[net-error] ${res.status()} ${res.url()}`);
    }
  });
});

async function login(page) {
  await page.goto(`${BASE}/app.html`);
  // Tämän logiikan tarkka muoto riippuu sovelluksesta — sovita
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button:has-text("Kirjaudu")');
  await page.waitForSelector('.app-sidebar', { timeout: 5000 });
}

test("Aloitus-näytön elementit", async ({ page }) => {
  await login(page);
  // Screenshot baseline
  await page.screenshot({ path: "/tmp/puheo-v283/01-aloitus.png", fullPage: true });
  // Kaikki interaktiiviset elementit
  const buttons = await page.locator('button, a[href], [role="button"]').all();
  console.log(`[info] ${buttons.length} interaktiivista elementtia`);
});

test("Klikkaa jokainen Aloituksen kortti", async ({ page }) => {
  // Hae kaikkien korttien selektorit (data-action tai luokka-pohjaiset)
  const cardSelectors = [
    '[data-action="continue"]',
    '[data-track="sanasto"]',
    '[data-track="kielioppi"]',
    '[data-track="luetun"]',
    '[data-track="kirjoitus"]',
    '[data-action="exam"]',
  ];
  for (const sel of cardSelectors) {
    await login(page);
    const el = page.locator(sel).first();
    if (!await el.isVisible()) {
      console.log(`[skip] ${sel} ei nakyvissa`);
      continue;
    }
    const start = Date.now();
    await el.click();
    // Odota uusi näyttö max 8s — kerää loader-tilat
    try {
      await page.waitForLoadState("networkidle", { timeout: 8000 });
      const elapsed = Date.now() - start;
      console.log(`[ok] ${sel} -> ${elapsed}ms -> ${page.url()}`);
      const slug = sel.replace(/[^a-z0-9]/gi, "_");
      await page.screenshot({ path: `/tmp/puheo-v283/card-${slug}.png`, fullPage: true });
    } catch (e) {
      console.log(`[stuck] ${sel} -> ei vastaa 8s sisalla`);
    }
  }
});

test("Sidebar-navigaatio (kun mode-state aktiivinen)", async ({ page }) => {
  await login(page);
  // Avaa yksi mode (Sanasto)
  await page.click('[data-track="sanasto"]');
  await page.waitForLoadState("networkidle");
  // Klikkaa kaikkia sidebar-mode-items
  const sidebarItems = await page.locator('.sidebar-item--lesson').all();
  console.log(`[info] sidebar-mode-items: ${sidebarItems.length}`);
  // Klikkaa ensimmainen ja toinen
  for (let i = 0; i < Math.min(2, sidebarItems.length); i++) {
    await sidebarItems[i].click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/tmp/puheo-v283/sidebar-${i}.png`, fullPage: true });
  }
});

test("Kirjoitustehtava avaus (v281 verifiointi)", async ({ page }) => {
  await login(page);
  // Navigoi suoraan kirjoitustehtava-lessoniin
  await page.goto(`${BASE}/app.html#/oppimispolku/es/kurssi_1`);
  await page.waitForLoadState("networkidle");
  // Etsi writing-lesson (lesson_9 espanjaksi)
  const writingLesson = page.locator('text=/Kirjoita itsest/i').first();
  if (await writingLesson.isVisible()) {
    await writingLesson.click();
    await page.waitForTimeout(3000);
    const placeholder = await page.locator('text="avautuu pian"').count();
    if (placeholder > 0) {
      console.log("[BUG] kirjoitustehtava nayttaa 'avautuu pian' placeholderia");
    }
    await page.screenshot({ path: "/tmp/puheo-v283/writing-task.png", fullPage: true });
  }
});

test("Asetukset-modaali", async ({ page }) => {
  await login(page);
  await page.click('[data-action="settings"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "/tmp/puheo-v283/settings.png", fullPage: true });
  // Sulje, varmista ettei jumitu
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  // Sidebarin pitaisi olla yha paikallaan
  await expect(page.locator('.app-sidebar')).toBeVisible();
});

test("Mobile (375px) screenshot per scrno", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("puheo_gate_ok_v1", "1"));
  await login(page);
  await page.screenshot({ path: "/tmp/puheo-v283/mobile-aloitus.png", fullPage: true });
  await ctx.close();
});
```

Sovita kirjautumis-logiikka oikeisiin selektoreihin (login-näyttö voi olla erilainen). **Lue ensin** mahdollinen `tests/helpers/login.js` tai vastaava jos olemassa.

### Vaihe 3: Aja audit

```bash
mkdir -p /tmp/puheo-v283
npx playwright test tests/e2e-runtime-audit-v283.spec.js --reporter=list 2>&1 | tee /tmp/puheo-v283/audit.log
```

Jos browser-binari puuttuu: `npx playwright install chromium` (memory: `feedback_playwright_works_in_harness.md` — toimii harnessissa).

### Vaihe 4: Raportti

**Tiedosto:** `docs/briefs/v283-runtime-audit-report.md`

Sisältö:
- **Yhteenveto**: testien lukumäärä, kuinka monta passed/failed
- **P0-bugit** (käyttäjä blokattu):
  - Kuvaus + reprodukointi-vaiheet + console/network-evidence + screenshot-polku
- **P1-bugit** (rikki mutta workaround):
  - Sama formaatti
- **P2-bugit** (vain visuaalinen / pieni):
  - Sama formaatti
- **Performance-havainnot**: mitkä polut kestivät > 3s (linkki v282-mittauksiin)
- **AI-slop-merkit** screenshoteista: italic Fraunces, em-dash, "Ladataan…", placeholder-tekstit
- **Suositukset**: 3-5 isointa asiaa joiden korjaaminen seuraavaksi
- **Liitteenä:** `/tmp/puheo-v283/*.png` (screenshot-polut listattuna)

### Vaihe 5: Siivous

Kun raportti on tallennettu:
- Säilytä `tests/e2e-runtime-audit-v283.spec.js` regression-spec:nä
- Poista `tests/e2e-_runtime-audit*.spec.js` (vanhat scratch-tiedostot)
- ÄLÄ poista screenshot-tiedostoja `/tmp/puheo-v283/`:sta — voivat olla hyödyllisiä myöhemmin

---

## Sääntöjä

- **Käytä prod-URLia** `https://espanja-v2-1.vercel.app` (Marcelin Vercel) JA tarvittaessa locallia
- **Älä riko prod-dataa** — testpro123-tili on tarkoitettu tähän
- **Älä commit `/tmp/puheo-v283/`:n sisältöä reposioon** (ei tarvita gitiin)
- **Älä toteuta korjauksia** — pelkkä havainnointi
- **Älä syytä cachea** — clean incognito + bumppaa CACHE_VERSION jos tarvitsee
- **Skill-stack pakollinen** — kutsu Skill-toolia aidosti, älä keksi listoja
- **Memory-asiat:**
  - `feedback_playwright_gate.md` — bypass gate-prompt addInitScriptilla
  - `feedback_playwright_works_in_harness.md` — Playwright toimii, älä skipata
  - `feedback_log_every_complaint.md` — jos käyttäjä raportoi bugin auditin aikana, kirjoita memoryyn

---

## Commit + PR

- **2 commitia:**
  - `test(e2e): runtime audit spec v283`
  - `docs: v283 runtime audit report`
- PR-otsikko: `test: runtime audit v283`
- IMPROVEMENTS.md: `v283 — test: kattava Playwright-runtime-audit, N P0:ta + M P1:tä raportoitu`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ korjaa bugeja tässä briefissä — vain raportoi
- ÄLÄ poista screenshotteja tutkimusvaiheessa
- ÄLÄ riko testpro123-käyttäjän dataa (älä esim. poista profiilia)
- ÄLÄ commit Playwright-binäärejä reposioon
- ÄLÄ tee Vercel-promotea
- ÄLÄ skippaa Playwrightia "harness blocks" -syyllä — toimii memory `feedback_playwright_works_in_harness.md` mukaan

## Onnistuminen

- [ ] Audit-spec ajettu loppuun asti
- [ ] Vähintään 6 testiä eri näytöistä (Aloitus / mode / lesson / settings / mobile / kirjoitus)
- [ ] Screenshot per testi
- [ ] Console + network errors loggattu
- [ ] P0/P1/P2 -raportti kirjoitettu `v283-runtime-audit-report.md`:hin
- [ ] Suositukset 3-5 isointa korjausta seuraavaksi
- [ ] Vanhat scratch-specit siivottu
- [ ] PR avattu, EI mergattu
