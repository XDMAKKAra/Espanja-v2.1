# BRIEF: App-shell top-bar viewport-top fix (L-V287-SHELL-TOP-1)

**Päivä:** 2026-05-23
**Loop:** L-V287-SHELL-TOP-1
**Prioriteetti:** P0
**Koko:** pieni (1 commit, <60 r muutoksia)
**Skill-stack:** `frontend-design`, `design-taste-frontend`, `impeccable`, `webapp-testing`

---

## Ongelma

App-shellissä (`app.html` + sidebar) vasemman puolen sidebar **ei ulotu viewportin yläreunaan asti**. Selaimen URL-palkin ja Puheo-logon välissä on ruma valkoinen aukko, joka jättää sidebarin "leijumaan" alaspäin (ks. käyttäjän screenshot 2026-05-23 `/app.html#/aloitus`).

Visuaalisesti tämä lukee: "tämä app on rikki" tai "tässä on jotain puolitiessä jätettyä". Kaikilla nykyaikaisilla web-appeilla (Notion, Linear, Vercel) sidebar alkaa pikselistä 0.

## Hyvä lopputulos

- Sidebar `top: 0` koko viewportilla, ei valkoista vyötä yläosassa
- Brand-väri (brick `#A0341F` per `feedback_design_direction_eduix_old_spain`) ulottuu yläreunaan asti
- Desktop (≥1024 px) ja tablet (768–1023 px) molemmat fiksattu
- Ei riko mobiili-off-canvas-flowta (`<1024 px` hamburger-menu pysyy nykyisellään)
- Ei jätä gappia myöskään muille screeneille (Asetukset, Profiili, Oppimispolku, opetussivu)

## Mitä testata

Käytä Playwrightia visuaalisesti:

```js
// tests/e2e-shell-topbar.spec.js
import { test, expect } from '@playwright/test';

const SCREENS = ['/aloitus', '/asetukset', '/oppimispolku', '/profiili'];

for (const path of SCREENS) {
  test(`sidebar reaches viewport top on ${path} (desktop)`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const sidebar = page.locator('.app-sidebar, #app-sidebar').first();
    const box = await sidebar.boundingBox();
    expect(box.y).toBeLessThanOrEqual(1); // pixel 0 tai 1
  });
}
```

Aja `npx playwright test e2e-shell-topbar.spec.js --headed` ja screenshottaa molemmat tilat ennen+jälkeen.

## EI scope

- Sidebar-restrukturointi (se on L-V288:n työ)
- Off-canvas-mobiili-flow
- Sidebar-sisältö (linkit, käyttäjäkortti)
- Topbar-mobiilin värimuutokset
- Logo-typografia ("Puheo")

## Tiedostot joita todennäköisesti muutat

- `app.html` (shell-runko, mahdollinen `<header>` jolla `padding-top` tai `margin-top` joka jättää aukon)
- `css/components/sidebar.css` tai vastaava (positio + top-offset)
- Mahdollisesti `css/app.css` `body` resetit
- `sw.js` CACHE_VERSION bump v286 → v287 + STATIC_ASSETS päivitys jos CSS-tiedosto muuttuu

## Verify-protokolla

1. `npm run build` ajettu, `app.bundle.css` päivittyy
2. `node --check` läpi jokaiselle muokatulle JS-tiedostolle
3. `npm test` läpi (vitest)
4. Yllä oleva Playwright-spec PASS 4/4
5. Manuaalinen screenshot ennen+jälkeen desktop 1440px + tablet 800px
6. Mobiili (375 px) ei regresoidu — hamburger-flow toimii

## Commit-viesti

```
fix(shell): sidebar reaches viewport top on all screens (L-V287-SHELL-TOP-1, v287)
```

## SW

CACHE_VERSION: v286 → v287
STATIC_ASSETS: lisää muokatut CSS-tiedostot jos `sw.js`:n listassa ei niitä jo ole

## Pending caller

Kun valmis, kuittaa IMPROVEMENTS.md:hen yksi rivi formaatissa muiden v283+ -loopien tapaan, JA pyydä käyttäjää tekemään hard-refresh (Ctrl+Shift+R) tai SW-unregister jos lokaali näyttää vielä rikkinäiseltä.
