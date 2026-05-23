# BRIEF: /aloitus redesign — anti-slop, näytä siltä että ihminen rakensi (L-V289-ALOITUS-REDESIGN-1)

**Päivä:** 2026-05-23
**Loop:** L-V289-ALOITUS-REDESIGN-1
**Prioriteetti:** P0
**Koko:** keskisuuri (1–2 commit, screen-redesign)
**Skill-stack:** `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`, `webapp-testing`
**Riippuvuus:** L-V291 (typografia-vaihto) PITÄÄ olla mainissa ennen tätä — Aloitus-redesign käyttää General Sans + Manrope, ei Fraunces

---

## Ongelma — käyttäjä on sanonut tämän jo 5 kertaa

Nykyinen `/aloitus` (käyttäjän screenshot 2026-05-23) on **tylsä ja näyttää AI:n tekemältä**. Konkreettiset slop-elementit jotka anti-AI-slop-säännöt (`feedback_ai_slop_check_every_frontend`, `impeccable`-skill, `design-taste-frontend`-skill) kieltävät:

| Slop-elementti | Miksi rikkoo | Mitä tilalle |
|---|---|---|
| "Hei!" Fraunces italic yksin tyhjässä tilassa | Fraunces on poistettu kokonaan (L-V291) — JA orpo tervehdys ei tee mitään | Joko poista kokonaan, tai integroi: "Hei Marcel, tänään jatkat oppitunnista X" yhdellä rivillä General Sans semibold:lla, ei oma palsta, ei italic |
| "Lauantai 23. toukokuu" -chip | Koristeellinen pill joka ei tee mitään | Jos päivämäärä tarvitaan, sentence-case inline-metana, ei pill |
| "Jatka tästä" mono-uppercase eyebrow ruskealla | `feedback_common_frustrations`: mono UPPERCASE eyebrow ilman semanttista syytä kielletty | Sentence-case otsikkona tai poistettu kokonaan |
| Iso korttirakenne "Jatka oppimispolulla" + "Jatka →"-CTA | Hero-metric template (impeccable absolute ban): iso laatikko + iso otsikko + nappi | Korvaa toisella affordanssilla — esim. inline-tekstillä joka linkitää suoraan ("Jatka oppituntiin: -ar-verbit preesensissä"), ei laatikolla |
| "Aloita putki tänään / Päivän tavoite / 0 / 30 min" + tyhjä progress bar | Placeholder-tunnelmaa, nolla-tila kommunikoi "appi ei muista mitään" | Joko todellinen progress (jos käyttäjä on opiskellut tänään), tai poistettu jos 0 min |
| 4 identical card grid (Sanasto / Kielioppi / Luetun ymm / Kirjoitus) | `impeccable` absolute ban: "identical card grids" | Asymmetrinen grouping, lista-pohjainen näkymä, TAI eri kokoisia tiles joissa actual content (esim. "Sanasto: 12 sanaa eilen, jatka kohdasta...") |
| "Kurssipolku" mono lower-case eyebrow | OK lower-case mutta sana ei sano mitään | Joko poista tai vaihda kuvaavaksi: "Tämän viikon kurssit" |
| "Koeharjoitus →" floating link yksin alalaidassa | Orpo, ei kuulu mihinkään hierarkiaan | Joko sticky bottom-CTA jolla on syynsä olla siellä, tai integroitu cards-osioon |

## Hyvä lopputulos

Käyttäjä joka tulee `/aloitus`-screenille saa **1–2 sekunnissa** vastauksen kysymykseen *"Mitä minun pitäisi tehdä nyt?"*. Ei moncopy-grid, ei placeholder-mittareita, ei eyebrow-spam.

### Suunnitteluperiaatteet

1. **Yksi selkeä next-action.** Iso CTA tai inline-call-to-action joka kertoo eksplisiittisesti mikä on **seuraava oppitunti / harjoitus** ja vie sinne yhdellä klikillä.
2. **Konteksti, ei pelkkä CTA.** Käyttäjä näkee mitä viime kerralla teki ("eilen: 12 uutta sanaa, käytit 18 min") tai missä kurssirakenteessa menee.
3. **Ei identical card grid.** Jos kurssi-jako näytetään, käytä lista-näkymää, asymmetristä groupingia, TAI eri-kokoisia tiles joissa on actual sisältöä (ei vain "5 harjoitusta").
4. **Vaihtoehtoiset polut secondary.** Koeharjoitus, asetukset, profiili — ne ovat saatavilla mutta eivät kilpaile pää-CTA:n kanssa.
5. **Ei placeholder-mittareita.** Jos käyttäjä ei ole tehnyt mitään tänään, älä näytä tyhjää "0 / 30 min" -palkkia. Näytä sen sijaan kannustava tai motivoiva näkymä, TAI yksinkertaisesti piilota se.
6. **Typografia:** General Sans (display, h1/h2 semibold tai bold) + Manrope (body + UI), per L-V291. EI Fraunces. EI italic. Hierarkia weight + size, ei fontti-vaihdolla.
7. **Brand-väri brick #A0341F** käytössä per `feedback_design_direction_eduix_old_spain`, mutta varovasti (Restrained-strategia per `impeccable`: ≤10 % accent).

## Suunta-vaihtoehto (writer voi muokata jos parempi idea)

**Vasen 60 % "Jatka tästä":**
- Iso (mutta ei kortti) inline-otsikko: "Jatka kurssia Sanasto, oppitunto 4: -ar-verbit preesensissä"
- Subteksti yhdellä rivillä: missä menee + paljonko jäljellä ("oppitunti 4 / 8, 12 min jäljellä")
- Yksi accent-CTA: "Avaa oppitunti" (brick brand-värillä)

**Oikea 40 % "Mitä muuta":**
- Lista-muotoinen näkymä 3 secondary-toiminnasta:
  - "Sanaston nopeustesti — 5 min" (jos käyttäjä on tehnyt sanastoharjoituksia)
  - "Kirjoitustehtävä viikon teemasta — 12 min"
  - "Koeharjoitus — täysi YO-koerunko"
- Lista, ei korttigrid. Käytä `border-bottom: 1px solid` separaattoreita per `impeccable` ja `design-taste-frontend` (no cards unless elevation needed).

Tämä on **vain ehdotus**. Writer-terminal saa valita oman composition:n kunhan se täyttää periaatteet yllä ja välttää slop-elementit.

## EI scope

- App-shell top-bar (L-V287 hoitaa)
- Opetussivun double-sidebar (L-V288 hoitaa)
- Anti-slop sweep muille screeneille (L-V290 hoitaa)
- Kurssien todellinen sisältö, lesson-data
- Pricing / Pro-gate
- Onboarding-flow

## Vältä nämä — match-and-refuse-lista

| Älä käytä | Miksi |
|---|---|
| Em-dash `—` suomi-tekstissä | `humanizer` + memory `feedback_humanizer_required` |
| "Elevate", "Seamless", "Unleash", "Next-Gen", "kalibroitu", "intuitiivinen" | AI-brand-sanat |
| "Ladataan…" italicilla | Skeleton sen sijaan |
| Pure `#000` tai `#fff` | Käytä tinted neutraalia (warm-black/warm-white per `impeccable`) |
| Side-stripe border kortin reunalla | `impeccable` absolute ban |
| Gradient text | `impeccable` absolute ban |
| Glassmorphism decoration | `impeccable` absolute ban |
| Fraunces (mikä tahansa) | L-V291 poisti sen koko reposta — käytä General Sans |
| Italic-otsikko mihin tahansa | Ei italic-personality-slottia uudessa direktiivissä |
| Mono UPPERCASE eyebrows ilman syytä | `feedback_common_frustrations` |
| 3–4 identtistä korttia rivissä | `impeccable` + `design-taste-frontend` absolute ban |
| Fake testimoniaalit | `feedback_no_fabricated_provable_claims` |
| "Coming soon" / "Lorem ipsum" | `feedback_common_frustrations` |
| "Hyvä pointti", "Erinomaista", sycophantic copy | Humanizer-säännöt |

## Testit

```js
// tests/e2e-aloitus-anti-slop.spec.js
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('puheo_gate_ok_v1', '1'));
});

test('aloitus has a single primary CTA', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/aloitus');
  const primaryCtas = page.locator('[data-cta-primary], .cta-primary, .btn-primary');
  await expect(primaryCtas).toHaveCount(1);
});

test('aloitus has no identical card grid (>=3 same-class cards)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/aloitus');
  // Etsi mahdolliset card-grid-rakenteet
  const cardGrids = await page.locator('.card-grid, [data-card-grid]').all();
  for (const grid of cardGrids) {
    const cards = await grid.locator('> *').count();
    expect(cards).toBeLessThanOrEqual(2); // älä salli 3+ identtistä korttia rivissä
  }
});

test('aloitus has no mono-uppercase eyebrows without semantic role', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/aloitus');
  const allText = await page.locator('main').allTextContents();
  const flat = allText.join(' ');
  // Etsi UPPERCASE-jonoja jotka eivät ole akronyymejä
  const suspect = flat.match(/\b[A-ZÄÖÅ]{6,}\b/g) || [];
  const allowed = ['EDELLINEN', 'SEURAAVA', 'YO', 'CEFR']; // sallitut akronyymit
  const violations = suspect.filter(s => !allowed.includes(s));
  expect(violations).toEqual([]);
});

test('aloitus has no em-dash in user-facing copy', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/app.html#/aloitus');
  const allText = (await page.locator('main').allTextContents()).join(' ');
  expect(allText).not.toContain('—');
});
```

## Tiedostot joita todennäköisesti muutat

- `js/screens/dashboard.js` tai `js/screens/aloitus.js` (riippuen nimeämisestä)
- `app.html` (jos screen-rakenne on inline)
- `css/screens/aloitus.css` tai vastaava
- Mahdollisesti `js/main.js` jos routing-koodi viittaa screenin nimeen
- `sw.js` CACHE_VERSION bump

## Verify-protokolla

1. `npm run build`
2. `node --check`
3. `npm test`
4. Playwright-spec yllä PASS 4/4
5. Manuaalinen screenshot ennen+jälkeen
6. Itse-check anti-slop-listasta yllä — käy kohta kohdalta läpi

## Commit-viesti

```
feat(aloitus): redesign with single CTA, drop identical card grid (L-V289-ALOITUS-REDESIGN-1, v289)
```

## SW

CACHE_VERSION: v288 → v289
STATIC_ASSETS: päivitä

## Pending caller

Tämä on käyttäjän kuumin valitus (5 kertaa raportoitu). Älä jätä keskeneräiseksi. Jos jokin osa scope:sta on liian iso yhdelle commitille, JAA kahteen committiin (esim. "redesign-skeleton" + "redesign-content") mutta älä mergetä mainiin keskeneräisenä.
