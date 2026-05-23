# BRIEF: Anti-AI-slop microcopy sweep — kaikki näyttää ihmisen tekemältä (L-V290-MICROCOPY-SWEEP-1)

**Päivä:** 2026-05-23
**Loop:** L-V290-MICROCOPY-SWEEP-1
**Prioriteetti:** P1 (suoritetaan L-V287/V288/V289/V291 jälkeen)
**Koko:** iso (jaettava 2–3 committiin)
**Skill-stack:** `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`
**Riippuvuus:** L-V291 (typografia-vaihto) PITÄÄ olla mainissa — tämä on Fraunces-verify-vaihe + microcopy

---

## Käyttäjän direktiivi (sanasta sanaan)

> "Pitää tehdä anti ai slop. Eli kaikki teksti pitää muuttaa niiku se ois ihmisen tekemää. Tämän sivuston pitää näyttää siltä että ihminen on luonut kaikki tehtävät ja koodannut sivuston, mutta vain tekoäly arvioi ne kirjoitustehtävät."

Tämä on **systemaattinen pass läpi koko UI:n**, ei yhden screenin korjaus. Käyttäjä on raportoinut anti-slop-asioita 5+ kertaa, eivätkä korjaukset ole pysyneet kasassa — useat slop-elementit elävät edelleen.

## Mitä haetaan: humanisoitu UI

App näyttää siltä että **suomalainen kehittäjä koodasi tämän käsin ja kirjoitti microcopyn itse**. Tekoäly arvioi vain kirjoitustehtävät, ei muuta. Eli:
- Ei generic "AI made it"-fontteja, mono-uppercase-eyebrowsia, em-dasheja, gradient-textiä
- Microcopy on suomeksi luonnollinen, sentence-case, ei brändihöttöä
- Visuaalinen tunne on inhimillinen, ei "SaaS-template"
- Treatment-laatikot (huomautukset, varoitukset, vinkit) käyttävät typografiaa eivätkä mono-caps-otsikoita

## Konkreettiset slop-elementit jotka käyttäjä on osoittanut

### Mono UPPERCASE eyebrows
- `KURSSI_1 · OPPITUNTI 2` opetussivulla → "Kurssi 1, oppitunti 2" (sentence case, ilman underscoreja)
- `MUISTA NÄMÄ` huomautuslaatikossa → "Muista nämä" tai "Tärkeintä" sentence case (ei mono, ei UPPERCASE)
- `OBS!` huomautuksessa → "Esimerkkejä" tai "Huomaa" (suomeksi, ei pohjoismainen lainasana)
- `EDELLINEN` / `SEURAAVA` nav-napeissa → "← Edellinen" / "Seuraava →" (sentence case, OK koska ovat navigaatio-napit)
- `PERSOONA` / `MUOTO` taulukon otsikkoissa → "Persoona" / "Muoto" (sentence case)
- `TÄNÄÄN`, `JATKA TÄSTÄ`, `KURSSIPOLKU` Aloitus-screenillä (L-V289 hoitaa nämä — älä duplikoi, mutta vahvista että pysyivät pois)

### Underscore-tekniset stringit käyttäjälle
- `KURSSI_1`, `kurssi_1`, `kurssi-1` → "Kurssi 1"
- `OPPITUNTI 2` → "Oppitunti 2"
- Mitkä tahansa muut internal IDt jotka vuotavat UI:hin

### Em-dash käyttäjälle näkyvässä suomi-tekstissä
- Grep koko `app.html`, `js/screens/*.js`, `js/features/*.js`, `css/*.css` sisältö-stringeistä ja `data/courses/**/*.json` käyttäjälle-näkyvistä kentistä (`title`, `description`, `hint`, `feedback`)
- Korvaa `—` pilkulla, kaksoispisteellä, tai sulkeilla kontekstin mukaan
- ÄLÄ koske: koodikommentteihin, git commit -viesteihin, sisäisiin docs/-tiedostoihin

### Fraunces-jäänteet (verify-vaihe L-V291:n jälkeen)
- L-V291 poisti Fraunces:n koko reposta — tämän loopin tehtävä on **varmistaa** ettei yksikään jäänyt
- Grep `Fraunces|fraunces` — odotus 0 osumaa (paitsi historiallisissa docs/IMPROVEMENTS.md)
- Grep `font-style:\s*italic` — odotus 0 osumaa UI-CSS:ssä (vain `prefers-reduced-motion` tai print-CSS sallittu)
- Jos löytyy jäänteitä, korvaa General Sans:lla (display) tai Manrope:lla (body), aina `font-style: normal`

### Treatment-laatikoiden visuaalinen kohina
- "OBS!" laatikko vaaleanpunaisella taustalla mono UPPERCASE -otsikolla on **kahdesti slop**: 1) mono caps, 2) pinkki pseudoglassmorphism-laatikko
- Käytä typografiaa erotuksena: bold-numerointi (1. 2. 3.) tai sisennys, ei taustavärillistä laatikkoa
- Jos laatikkoa tarvitaan, käytä subtle border-left:iä TAI hieman lämpimämpää taustaa (jätä side-stripe-ban kuitenkin voimaan — käytä full-borderia)

### "Ladataan…" placeholderit
- Etsi kaikki `text-content: 'Ladataan...'` / `'Ladataan…'` jotka näytetään ennen async-dataa
- Korvaa skeleton-elementeillä per `feedback_common_frustrations`
- Jos data on synchronous, poista loading-state kokonaan

### Tyhjät viiva-placeholderit `—`
- "YO-VALMIUS —" tyyppinen tyhjä mittari
- Jos data ei ole saatavilla, joko piilota koko elementti tai näytä kuvaava teksti ("Ei vielä tietoa")

## Mitä EI muuteta

- **Espanjankielisten esimerkkien sisältö** (yo hablo, tú hablas jne.) — nämä ovat oppimateriaalia
- **Suomenkieliset opetustekstit** lessoneissa (esim. "Kaikki -ar-verbit (hablar, estudiar, trabajar…) taivutetaan samalla kaavalla") — sisältö on jo OK, vain typografia/treatment muuttuu
- Kielioppi-säännöt, esimerkkilauseet
- Kirjoitustehtävien AI-arvioinnin promptit (sisäisiä)
- Tehtävien rakenteet, kurssirakenne
- Git commit -viestit, docs/-sisäiset dokumentit

## Jako kolmeen committiin

### Commit 1 (L-V290-MICROCOPY-SWEEP-1a): Mono UPPERCASE + underscore-pyyhintä
- Kaikki mono UPPERCASE eyebrows → sentence case (lukuun ottamatta nav-nappeja "EDELLINEN/SEURAAVA" jotka jätetään accepted-listalle)
- Kaikki `kurssi_N` / `KURSSI_N` / `OPPITUNTI N` underscore-strings → ihmisformaatti
- Kaikki taulukko-headerit (PERSOONA/MUOTO/SISÄLTÖ tyyppisesti) → sentence case
- CSS-puolella: poista `text-transform: uppercase` deklaraatiot eyebrow-luokista, vaihda `font-family: monospace` selvempään

### Commit 2 (L-V290-MICROCOPY-SWEEP-1b): Em-dash + placeholders + loading
- Grep `—` (em-dash unicode `—`) ja korvaa kaikki käyttäjälle-näkyvissä suomi-tekstissä
- "Ladataan…" → skeleton-komponentit
- Tyhjät `—` placeholderit → kontekstuaalinen teksti tai poisto
- "Coming soon" / "TBD" / "Lorem ipsum" jos löytyy → poistettu tai oikea sisältö

### Commit 3 (L-V290-MICROCOPY-SWEEP-1c): Treatment-laatikot + Fraunces-jäänteiden verify
- "OBS!" + "MUISTA NÄMÄ" + "Tärkeää" -laatikot uusiksi (typografia-driven General Sans / Manrope -weight-kontrastilla, ei taustaväri-pulju)
- Fraunces-jäänteet verify — grep koko reposta, odotus 0 osumaa
- Italic-jäänteet verify — grep `font-style:\s*italic`, odotus 0 osumaa UI:ssa
- Audit: pure black/white tarkistus → vaihto warm-tonal palettiin jos esiintyy
- Audit: gradient text → poistettu jos esiintyy
- Audit: glassmorphism-decoration → poistettu jos esiintyy

## Vältä nämä

| Älä | Miksi |
|---|---|
| Älä uudelleenkirjoita opetusmateriaalia | Sisältö on jo OK, vain typografia muuttuu |
| Älä lisää uusia treatment-laatikoita | Pyri vähentämään, ei lisäämään |
| Älä koske kirjoitustehtävien grading-koodiin | Vain microcopy + visuaalinen |
| Älä muuta nav-napeissa "Edellinen/Seuraava" toimintaa | Vain visuaalinen typografia |
| Älä lisää uusia akronyymejä joita sitten täytyy lisätä accepted-listalle | Sentence case = oletus |

## Testit

```js
// tests/e2e-anti-slop-sweep.spec.js
import { test, expect } from '@playwright/test';

const SCREENS = [
  '/aloitus',
  '/oppimispolku',
  '/asetukset',
  '/profiili',
  '/lesson/kurssi_1/ar-verbit-preesens',
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
  await page.setViewportSize({ width: 1440, height: 900 });
});

const ACCEPTED_UPPERCASE = ['EDELLINEN', 'SEURAAVA', 'YO', 'CEFR', 'YTL', 'CTA'];

for (const path of SCREENS) {
  test(`${path}: no mono-uppercase eyebrows`, async ({ page }) => {
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const text = (await page.locator('main').allTextContents()).join(' ');
    const suspect = text.match(/\b[A-ZÄÖÅ]{5,}\b/g) || [];
    const violations = suspect.filter(s => !ACCEPTED_UPPERCASE.includes(s));
    expect(violations).toEqual([]);
  });

  test(`${path}: no em-dash in user-facing copy`, async ({ page }) => {
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const text = (await page.locator('main').allTextContents()).join(' ');
    expect(text).not.toContain('—');
  });

  test(`${path}: no underscore tech IDs in user-facing copy`, async ({ page }) => {
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const text = (await page.locator('main').allTextContents()).join(' ');
    expect(text).not.toMatch(/kurssi_\d+/i);
  });

  test(`${path}: no Fraunces font (L-V291 verify)`, async ({ page }) => {
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const fraunces = await page.locator('main').evaluateAll(els => {
      let count = 0;
      els.forEach(root => {
        root.querySelectorAll('*').forEach(el => {
          const ff = window.getComputedStyle(el).fontFamily.toLowerCase();
          if (ff.includes('fraunces')) count++;
        });
      });
      return count;
    });
    expect(fraunces).toBe(0);
  });

  test(`${path}: no italic in UI chrome`, async ({ page }) => {
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const italics = await page.locator('main').evaluateAll(els => {
      let count = 0;
      els.forEach(root => {
        root.querySelectorAll('h1, h2, h3, p, span, a, button, label').forEach(el => {
          if (window.getComputedStyle(el).fontStyle === 'italic') count++;
        });
      });
      return count;
    });
    expect(italics).toBe(0);
  });

  test(`${path}: no "Ladataan…" italic placeholders`, async ({ page }) => {
    await page.goto(`http://localhost:3000/app.html#${path}`);
    const italicLoading = await page.locator('main >> text=/Ladataan/i').count();
    expect(italicLoading).toBe(0);
  });
}
```

## Tiedostot joita todennäköisesti muutat

Grep ensin koko repo:

```bash
# Mono-uppercase eyebrows
grep -rE 'text-transform:\s*uppercase' css/
grep -rE 'font-family:[^;]*monospace' css/

# Underscore-tech-IDt
grep -rE '\bkurssi_\d+\b' js/ app.html data/courses/

# Em-dash
grep -r '—' js/screens/ js/features/ app.html public/

# Loading text
grep -rE 'Ladataan' js/ app.html
```

Tiedostot todennäköisesti: `app.html`, `js/screens/*.js`, `js/features/*.js`, `css/components/*.css`, `css/screens/*.css`, mahdolliset `data/courses/**/*.json` `title`/`hint`-kentät.

## Verify-protokolla

1. Grep-tulokset ennen+jälkeen (kerro ennen-luvut commit-viestissä)
2. `npm run build`
3. `node --check`
4. `npm test`
5. Playwright-spec yllä PASS 5×5 = 25/25
6. Manuaalinen visual diff (screenshot ennen+jälkeen) Aloitus + opetussivu + asetukset

## Commit-viesti (per sub-commit)

```
chore(microcopy): mono-uppercase → sentence-case sweep (L-V290-MICROCOPY-SWEEP-1a, v290)
chore(microcopy): drop em-dash and loading placeholders (L-V290-MICROCOPY-SWEEP-1b, v291)
chore(microcopy): treatment boxes + italic Fraunces audit (L-V290-MICROCOPY-SWEEP-1c, v292)
```

## SW

CACHE_VERSION: v289 → v290 → v291 → v292 (yksi bump per sub-commit)

## Pending caller

Päivitä `memory/feedback_common_frustrations.md` jos jokin pattern ei ollut listattu mutta löytyi sweep:n aikana. Älä laajenna scope:a — pidä sweep tiukasti microcopy + visuaalinen typografia.
