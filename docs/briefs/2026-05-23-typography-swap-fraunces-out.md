# BRIEF: Typografia-vaihto — Fraunces pois, Quizlet+WordDive-vibe sisään (L-V291-TYPOGRAPHY-SWAP-1)

**Päivä:** 2026-05-23
**Loop:** L-V291-TYPOGRAPHY-SWAP-1
**Prioriteetti:** P0 (ajetaan ENNEN L-V289 Aloitus-redesignia ja L-V290 microcopy-sweepia — molemmat riippuvat tästä)
**Koko:** keskisuuri-iso (1 commit, koskettaa kaikkia screeneitä + landingeja)
**Skill-stack:** `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`

---

## Päätös ja perustelu

Käyttäjä valitsi 2026-05-23 typografia-suunnan vaihdolle vaihtoehto **#2**:
> Pidä Old-Spain palette (brick + cream warm-tones, accent #A0341F), mutta vaihda fontit Quizlet+WordDive-tyylisiksi. Drop Fraunces kokonaan.

Referenssit:
- **Quizlet** — geometric friendly sans (GT America -vibe), bold otsikoissa
- **WordDive** — pyöreä humanist sans (Avenir-vibe), lämmin tunnelma
- Molemmat: korkea x-height, ystävällinen mutta professional, hyvin luettava

**Tämä korvaa aiemman `feedback_design_direction_eduix_old_spain`-direktiivin kohdat 2 ja 3 (Fraunces display + italic personality slot).** Palette pysyy ennallaan, layout-säännöt pysyvät ennallaan, vain typografia muuttuu.

## Fonttivalinta

| Käyttö | Fontti | Lähde | Painot |
|---|---|---|---|
| **Display (h1, h2 hero, brand "Puheo")** | General Sans | Fontshare (OFL, ilmainen) | 500 (medium), 600 (semibold), 700 (bold) |
| **Body, UI, kaikki muu** | Manrope | Google Fonts (jo käytössä) | 400 (regular), 500 (medium), 700 (bold) |
| **Italic** | — | EI käytössä | EI tarvita |

**Miksi General Sans:**
- Closest free alternative GT Americalle (Quizletin paid-fontti)
- Geometric mutta ystävällinen
- Pari painoa hierarkiaan
- Fontshare CDN tai self-host

**Miksi Manrope säilyy bodyssa:**
- Jo asennettu, suorituskykytestattu
- Korkea x-height = luettava body-tekstissä
- Yhteensopiva General Sans -ankkurin kanssa (molemmat humanist-geometric)

**Vaihtoehto jos General Sans -lataus tuottaa ongelmia:**
Käytä **Plus Jakarta Sans** (Google Fonts, OFL) display-fonttina. Sama humanist-geometric character, helpompi loadata. Älä muuta muuten brief:iä — vain font-family-stringi.

## Mitä tehdään konkreettisesti

### 1. Asenna General Sans

Via Fontshare CDN:
```html
<link rel="preconnect" href="https://api.fontshare.com" />
<link href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600,700&display=swap" rel="stylesheet" />
```

Tai self-host: lataa `general-sans-medium.woff2` / `-semibold.woff2` / `-bold.woff2` `public/fonts/`-kansioon ja `@font-face`-deklarat `css/fonts.css`:ään.

### 2. Päivitä CSS-muuttujat

Etsi missä Fraunces on määritelty (todennäköisesti `css/app.css`, `css/landing.css`, `css/components/typography.css` tms.):

```css
/* OLD */
:root {
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Manrope', -apple-system, sans-serif;
}

/* NEW */
:root {
  --font-display: 'General Sans', 'Manrope', -apple-system, sans-serif;
  --font-body: 'Manrope', -apple-system, sans-serif;
}
```

### 3. Poista Fraunces-import koko repostakaista

```bash
grep -rEn "Fraunces|fraunces" --include='*.html' --include='*.css' --include='*.js'
```

Korjaa jokainen match:
- HTML `<link href="...fonts.googleapis.com/css2?family=Fraunces..."`> → poista
- CSS `font-family: 'Fraunces'` → `font-family: var(--font-display)` (joka nyt on General Sans)
- CSS `font-style: italic` Fraunces-kontekstissa → poista italic (uusi suunta: ei italic-personality-slottia)
- JS string-template literals jotka viittaavat Fraunces:iin (epätodennäköistä mutta tarkista)

### 4. Päivitä typografia-hierarkia

Old hierarchy (Fraunces serif + italic):
- h1: Fraunces 56px italic — "Hei!" tai hero-otsikko
- h2: Fraunces 32px italic — sectioiden otsikot
- body: Manrope 16px

New hierarchy (General Sans + Manrope):
- h1: General Sans 56px **600 semibold** — hero-otsikko, EI italic
- h2: General Sans 32px **500 medium** — sectioiden otsikot
- h3: General Sans 24px **500 medium** — alaosiot
- body: Manrope 16px 400 regular
- ui-meta (chip, eyebrow jos tarvitaan): Manrope 14px **500 medium**, sentence-case

Hierarkia kantaa weight-vaihtelulla ja kokoeroilla, ei fontti-vaihdolla. Tämä on yhtenäisempi ja modernimpi.

### 5. Käy läpi screen-screen

Tarkista että fontti-vaihto näyttää oikealta:

- `index.html` (lang-hub)
- `public/landing/espanja.html`
- `public/landing/saksa.html`
- `public/landing/ranska.html`
- `app.html` ja kaikki js/screens/*.js
- `/diagnose.html`
- Email-templatet jos käyttävät HTML-fontteja (`email.js`)

## Hyvä lopputulos

- **Fraunces poistettu kokonaan repo:sta** (grep tyhjä)
- **General Sans loadattu ja toimii** kaikissa hero-otsikoissa
- **Manrope säilyy** kaikessa bodyssa + UI:ssa
- Old-Spain warm palette (brick #A0341F, cream tausta) säilyy ennallaan
- Layout-säännöt (library-shelf rows, hairline rules, ei card-in-card) säilyvät ennallaan
- Italic-personality-slot poistettu kokonaan — ei italic-otsikoita missään
- Visuaalinen tunne: ystävällinen + professional + selkeä, ei editorial-vintage
- Latausnopeus säilyy hyvänä: General Sans `display=swap` + preload kriittisille painoille (500, 600)

## Mitä EI muuteta

- **Old-Spain palette** (brick #A0341F, cream taustat, olive #6B7B3F "done"-väri) säilyy
- **Layout-primitiivit** (.op-row library-shelf, hairline rules) säilyvät
- **Anti-AI-slop säännöt** muuten säilyvät (ei card-in-card, ei gradient blocks, ei cover graphics)
- **Sisältö** (suomi-tekstit, espanja-esimerkit, kurssi-rakenne) säilyy
- **Brand-nimi "Puheo"** säilyy, vain fontti vaihtuu

## EI scope

- Värimuutokset
- Layout-restrukturointi
- Microcopy-päivitykset (L-V290 hoitaa)
- Aloitus-screen redesign (L-V289 hoitaa, käyttää tätä typografiaa)
- App-shell topbar (L-V287 hoitaa)
- Opetussivu double-sidebar (L-V288 hoitaa)

## Riippuvuudet

- **L-V287 (top-bar fix) ja L-V288 (opetussivu restructure) voivat mennä rinnan**, eivät riipu tästä
- **L-V289 (Aloitus redesign) ja L-V290 (microcopy sweep) RIIPPUVAT TÄSTÄ** — älä aloita niitä ennen kuin tämä on mainissa
- Jos L-V289/V290 on jo aloitettu writer-terminaalissa rinnan, pysäytä ne ja odota tämän mergea

## Testit

```js
// tests/e2e-typography.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
  await page.setViewportSize({ width: 1440, height: 900 });
});

const SCREENS = [
  '/',
  '/espanja-yo-koe',
  '/app.html#/aloitus',
  '/app.html#/oppimispolku',
  '/app.html#/asetukset',
];

for (const path of SCREENS) {
  test(`${path}: no Fraunces font family in use`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`);
    const fraunces = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      let count = 0;
      all.forEach(el => {
        const ff = window.getComputedStyle(el).fontFamily.toLowerCase();
        if (ff.includes('fraunces')) count++;
      });
      return count;
    });
    expect(fraunces).toBe(0);
  });

  test(`${path}: no italic font-style in user-facing chrome`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`);
    const italics = await page.evaluate(() => {
      const all = document.querySelectorAll('h1, h2, h3, p, span, a, button, label');
      let count = 0;
      all.forEach(el => {
        const style = window.getComputedStyle(el).fontStyle;
        if (style === 'italic') count++;
      });
      return count;
    });
    expect(italics).toBe(0);
  });

  test(`${path}: h1 uses display font (General Sans or fallback)`, async ({ page }) => {
    await page.goto(`http://localhost:3000${path}`);
    const h1 = page.locator('h1').first();
    if (await h1.count() === 0) return; // screen ilman h1, ohita
    const ff = await h1.evaluate(el => window.getComputedStyle(el).fontFamily);
    expect(ff.toLowerCase()).toMatch(/general sans|plus jakarta sans|manrope/);
  });
}
```

Aja `npx playwright test e2e-typography.spec.js` — odotus: PASS 15/15 (5 screen × 3 testiä).

## Tiedostot joita todennäköisesti muutat

- `app.html` `<head>` font-linkit
- `public/landing/espanja.html`, `saksa.html`, `ranska.html` `<head>`
- `index.html` `<head>`
- `css/app.css` tai `css/tokens.css` font-family-muuttujat
- `css/landing.css`, `css/landing-de.css`, `css/landing-fr.css`
- `css/components/typography.css` (jos olemassa)
- `css/components/sidebar.css`, `css/screens/*.css` jos sisältää inline-Fraunces-viittauksia
- Mahdolliset `js/features/*.js` jos JS-template-stringit viittaavat Fraunces:iin (epätodennäköistä)
- `email.js` jos email-templatet käyttävät Fraunces-fonttia
- `sw.js` CACHE_VERSION bump

## Verify-protokolla

1. Grep `Fraunces|fraunces` koko repo:sta — odotus: 0 osumaa (paitsi historiallisissa docs:eissa/IMPROVEMENTS.md:ssä)
2. Grep `font-style:\s*italic` — odotus: vain `prefers-reduced-motion` -lähikontekstissa tai print-CSS:ssä, ei UI:ssa
3. `npm run build` läpi
4. `node --check` läpi
5. `npm test` läpi
6. Playwright-spec yllä PASS 15/15
7. Manuaalinen screenshot ennen+jälkeen kolmesta screenistä (landing, aloitus, opetussivu)
8. Latausnopeus: DevTools → Network → tarkista että General Sans -woff2:t latautuvat ja että total page-weight ei kasvanut yli 50 KB

## Commit-viesti

```
refactor(typography): drop Fraunces app-wide, General Sans + Manrope (L-V291-TYPOGRAPHY-SWAP-1, v291)
```

## SW

CACHE_VERSION: nykyinen (v286 main:ssa) → seuraava vapaa. Jos L-V287/V288 mergetty välissä, mene niistä eteenpäin.
STATIC_ASSETS: lisää General Sans -woff2-tiedostot jos self-hosted

## Pending caller

1. Päivitä `memory/feedback_design_direction_eduix_old_spain.md` — kohdat 2 ja 3 viittaavat Fraunces:iin, kirjoita ne uusiksi General Sans + Manrope -direktiivillä. EI italic-personality-slottia.
2. Lisää muistio: `memory/feedback_typography_general_sans_manrope.md` jossa kerrotaan päätös + perustelu lyhyesti
3. IMPROVEMENTS.md-rivi tähän looppiin
