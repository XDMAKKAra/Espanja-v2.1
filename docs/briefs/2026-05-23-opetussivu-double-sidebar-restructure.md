# BRIEF: Opetussivu double-sidebar restructure (L-V288-LESSON-SHELL-1)

**Päivä:** 2026-05-23
**Loop:** L-V288-LESSON-SHELL-1
**Prioriteetti:** P0
**Koko:** iso (this is THREE-STRIKES, ei band-aid)
**Skill-stack:** `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`, `webapp-testing`, `superpowers:systematic-debugging`

---

## Ongelma — kolmas raportointi, lopeta band-aid

Käyttäjän screenshot 2026-05-23 `/app.html` opetussivulla (-ar-verbit preesensissä): vasemmalla puolella **kaksi päällekkäistä sidebaria**. Näkyvissä:
- Ulompi shell-sidebar (Puheo-logo + "Aloitus"-linkki + "Asetukset"-bottom-link)
- Lessonin oma TOC-sidebar (kurssi-1 + sanasto-otsikko + drill-lista)

Nämä rendaantuvat sisäkkäin → tekstit overlapaavat ("Puhe" + "neo"), nav-itemit truncatut keskeltä ("oppituntien"), käyttöliittymä on käytännössä lukukelvoton tällä screenillä.

**Tämä on dokumentoitu auki olevaksi:** `memory/project_digikirja_layout_open.md` ("P0: double-sidebar, content too narrow, title cropped, top PrevNext irrallaan"). PR-sarja #118–#128 yritti korjata Otava-rebuildillä mutta jäi rikki.

**Kolmas valitus = restrukturoi rakenne, älä paikkaa** (`feedback_three_strikes_redesign`). Tämän loopin tehtävä on **päättää opetussivun shell-arkkitehtuuri kerralla**, ei lisätä toista CSS-overrideä.

## Pakollinen ensimmäinen vaihe — debug-istunto

ÄLÄ ALOITA KOODISTA. Ensin:

1. Lue `js/screens/lessonPage.js` (tai missä opetussivu rendataan) + `app.html` shell-rakenne + `css/components/sidebar.css` + `css/screens/lesson*.css`
2. Selvitä **konkreettisesti** miten double-sidebar syntyy:
   - (a) Renderöikö opetussivu OMAN sidebarinsa shell-sidebar:n SISÄÄN?
   - (b) Renderöikö shell-sidebar koska se ei tiedä että opetussivu on aktiivinen?
   - (c) CSS-grid/flex feili jossa lesson-content sallii global sidebarin näkyä alta?
3. Kirjoita lyhyt diagnoosi `docs/briefs/2026-05-23-opetussivu-FINDINGS.md`:hen ennen kuin teet päätöstä

## Kaksi suuntaa — valitse perustellusti

### Suunta A: Opetussivu omistaa oman full-width shellin

Opetussivulla EI ole global sidebaria lainkaan. Lessonin oma TOC vasemmalla + content keskellä + (mahdollinen) "Edellinen / Seuraava" -nav alhaalla.

- **Hyöty:** lessonissa on yleensä paljon TOC-itemejä (10+ sivua), niille tarvitaan tila. Global sidebar on opetuskontekstissa kohinaa.
- **Riski:** käyttäjä menettää nopeasti pääsyn Aloitukseen / Asetuksiin. Vaatii että lessonin yläreunaan tulee selkeä "← Takaisin Aloitukseen" tai logo-linkki.

### Suunta B: Opetussivu syrjäyttää global sidebar-itemien renderoinnin

Global shell pysyy ennallaan mutta opetussivulla shell-sidebar **piilottaa nav-itemit** ja näyttää tilalla lessonin TOC:n. Puheo-logo + käyttäjä-bottom säilyvät shell-sidebarissa.

- **Hyöty:** käyttäjä pysyy samassa shell-paradigmassa, ei kontekstihyppyä
- **Riski:** monimutkainen state-koordinointi shell:n ja screen:n välillä, helppo regressioitua

**Suosittelen suuntaa A** sillä three-strikes = rakenneongelma, ja sisäkkäin renderöiminen on ollut juuri ongelma kahdesti aiemmin. Mutta tee oma päätös FINDINGS-diagnoosin perusteella ja perustele se IMPROVEMENTS.md-rivillä.

## Hyvä lopputulos (kummallakin suunnalla)

- **EI päällekkäin renderöityjä sidebareita** missään viewport-koossa
- TOC-sidebar (lessonin sivut: "tutustuminen", "monivalinta perustaso", "monivalinta vaativa", "käännä lauseet", "kirjoita lyhyt teksti") **on luettavissa kokonaisuudessaan, ei truncattu** keskeltä
- Lesson-content on **luettavalla leveydellä** (max-width 65–75ch body-tekstille per `impeccable`)
- Otsikko (esim. "-ar-verbit preesensissä") **ei ole cropattu**
- Top-bar (kuva 2:ssa punainen palkki + "1 / 10 va...") on **kokonaisuudessaan luettavissa**, "valmis" -teksti ei jää näkyviin vain puoliksi
- Edellinen-nappi sivun alaosassa **ei ole orpo** — joko sticky alareunaan tai inline-osana TOC:ia
- Mobiili (<1024 px) sulautuu off-canvas-flowhun

## Sisältö EI muutu tässä loopissa

- "-ar-verbit preesensissä" -lessonin teksti, taulukot, käyttöesimerkit jäävät ennalleen
- Espanjankieliset esimerkit (yo hablo / tú hablas) jäävät ennalleen
- Suomenkieliset selitykset jäävät ennalleen

Vain SHELL + LAYOUT.

## EI scope

- Lesson-sisällön content-päivitys (toinen brief jos tarvitaan)
- "MUISTA NÄMÄ" / "OBS!" -mono-uppercase typografia (L-V290:n työ)
- "KURSSI_1 · OPPITUNTI 2" mono-eyebrow (L-V290:n työ)
- Käännös-tehtävien grading-logiikka
- Adaptive-difficulty
- Global app-shell topbar (L-V287:n työ)

## Testit

```js
// tests/e2e-lesson-shell.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
});

test('lesson page has exactly one sidebar', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/lesson/kurssi_1/ar-verbit-preesens');
  const sidebars = page.locator('[role="navigation"], .sidebar, aside');
  // odotetaan 1 (lesson-TOC TAI shell-sidebar, ei molempia)
  await expect(sidebars).toHaveCount(1);
});

test('lesson title is not cropped', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/lesson/kurssi_1/ar-verbit-preesens');
  const title = page.locator('h1').first();
  const text = await title.textContent();
  expect(text).toContain('preesensissä'); // koko sana, ei "...sis..."
  const box = await title.boundingBox();
  // tarkista että tekstielementti mahtuu container:iin
  const overflowed = await title.evaluate(el => el.scrollWidth > el.clientWidth + 1);
  expect(overflowed).toBe(false);
});

test('TOC items are fully visible (not truncated mid-word)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/lesson/kurssi_1/ar-verbit-preesens');
  const tocItems = page.locator('[data-toc-item], .lesson-toc li');
  const count = await tocItems.count();
  for (let i = 0; i < count; i++) {
    const item = tocItems.nth(i);
    const overflowed = await item.evaluate(el => el.scrollWidth > el.clientWidth + 1);
    expect(overflowed).toBe(false);
  }
});
```

## Tiedostot joita todennäköisesti muutat

- `app.html` shell-rakenne (mahdollisesti lisätään `data-screen="lesson"` body-luokka)
- `js/screens/lessonPage.js` (tai vastaava) — TOC-render-logiikka
- `css/screens/lesson*.css` — layout
- `css/components/sidebar.css` — conditional hide jos suunta B
- `sw.js` CACHE_VERSION bump

## Verify-protokolla

1. FINDINGS-tiedosto kirjoitettu ENNEN koodimuutoksia
2. Suunta-päätös perusteltu kommentoituna IMPROVEMENTS.md-rivillä
3. `npm run build` läpi
4. `node --check` läpi
5. `npm test` läpi
6. Playwright-spec yllä PASS 3/3
7. Manuaalinen testi neljälle eri lessonille (jos saatavilla) — varmista ettei korjaus toimi vain yhdellä lessonilla

## Commit-viesti

```
refactor(lesson): single-sidebar shell, fix double-render regression (L-V288-LESSON-SHELL-1, v288)
```

## SW

CACHE_VERSION: v287 → v288 (oletus että L-V287 mergetty ensin)
STATIC_ASSETS: päivitä muokatut tiedostot

## Pending caller

Päivitä `memory/project_digikirja_layout_open.md` → resolvoitu tai uudet auki olevat asiat. Älä jätä memory:a kertomaan "P0 auki" jos korjasit sen.
