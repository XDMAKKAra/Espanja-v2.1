# BRIEF: L-V331 — AI-slop sweep (Luku-eyebrowt, Roman-numeraalit, rule-of-three, italic-overuse)

**Päivä:** 2026-05-27
**Triggeri:** Marcel huomasi 2026-05-27 illalla että landing-sivulla on AI-slop-pattern joka sektiossa: "Luku I/II/III/IV/V · X"-eyebrowt, catalog-korttien Roman-numeraalit, "Kolme tasoa. Yksi tilaus." rule-of-three, italic-accent ylikäyttö. Competitor-research (WordDive, Studeo, Eduix, Abitreenit, Mafy) vahvisti: kukaan kilpailijoista ei käytä mitään näistä patterneista. Puheo on niistä syyllinen yksin.
**Status:** Slop-sweep, monta pientä HTML/CSS-muutosta yhdessä loop:issa. ~45-75 min writer-työ.
**Edellytys:** Ei riippuvuuksia. Voi shipata rinnan V329:n ja V330:n kanssa (eri tiedostoja muokataan).

---

## Mitä korjataan

### 1. "Luku I/II/III/IV/V · X" -eyebrowt poistetaan kaikista sektioista

Etsi index.html:stä kaikki kohdat joissa on `Luku [I-V]+ · `-tekstiä. Tyypillisesti `<aside>` tai `<span>` jossa `position: absolute` + `top: 0`, näkyvät korner-eyebrowna sivun reunalla per sektio.

Esimerkit Marcelin screenshotista:
- "Luku II · Kurssipolku"
- "Luku III · Arviointi"
- "Luku V · Hinnoittelu"

Etsi DOM-rakenne (luultavasti `.section-eyebrow`, `.section-chapter`, `.luku-marker` tai vastaava luokka) ja **poista sekä HTML-elementit että CSS-luokka kokonaan.** Älä yritä uudelleenmuotoilla — koko book-metaphor pitää pois.

Tarkista myös onko vastaava marker `public/landing/espanja.html`, `saksa.html`, `ranska.html` -sivuilla → poista myös sieltä.

### 2. Catalog-korttien Roman-numeraalit (I. II. III. ... VIII.) poistetaan

Catalog-section (`<section id="kurssit">`) renderöi 8 kurssia per kieli. Jokaisella kortilla on iso brick-värinen Roman-numeraali (I. II. III. ... VIII.) ennen kurssin nimeä.

Etsi rendering-koodi joka generoi nämä (`js/landing-catalog.js`, `js/landing-catalog-lang.js`, tai inline HTML). Poista Roman-numeraalin renderöinti.

Säilytä:
- Kurssin nimi (esim. "Saludos y presentaciones")
- "Lukukausi 1 · A-taso" -sub (kertoo curriculum-sijainnin)
- Kurssin ikonin (visuaalinen markeri)
- Kuvauksen ("Tervehdykset, perhe, päiväytmi...")

Korttien järjestys on jo curriculum-järjestys. Lukukausi-sub sisältää tason. Roman-numeraali on duplikoiva.

### 3. Pricing-headline "Kolme tasoa. Yksi tilaus." rewrite (rule-of-three pois)

`<section id="hinnoittelu">` h2 nykyisin: `Kolme tasoa. Yksi tilaus.`

Rule-of-three pricing-headline on klassinen SaaS-template-pattern. Vaihtoehtoja:
- "Hinnoittelu." (suora, kuten Stripe/Linear)
- "Aloita ilmaiseksi. Päivitä kun haluat." (action-painotteinen)
- "Maksa kun olet valmis." (commitment-friendly)
- "Vapaa-luku tai täysi teos." (kirja-metafora — VAROITUS: voi olla yhtä lailla slop, mieti)

Suositus: **"Hinnoittelu."** — yksinkertainen, ei myy. Sub-line voi pitää nykyisen tekstin "Aloita Freellä. Vaihda tasoa milloin vain, yksi tilaus kattaa kaikki kolme kieltä."

Kirjoita 3 omaa varianttia + suositus, **älä committaa ennen Marcelin valintaa.**

### 4. Italic-accent audit + reduktio

Plus Jakarta Sans italic on käytössä useissa kohdissa:
- Heron `ylppäreihin` (`hero__title-accent`)
- Proof-section `rubriikki` (`section-title em`)
- Catalog-section `A → E`
- Pricing-section `Yksi`
- Ehkä muita

**Sääntö:** max **YKSI** italic-accent per sektio. Italic on kuin ylimääräinen lihavointi — joka käytöllä sen vaikutus pienenee.

Etsi kaikki `<em>` ja `.section-title em`, `*-accent` -luokat heronin ja muiden sektioiden h2:ssa. Jätä ITALIC vain "key word":lle joka oikeasti ansaitsee korostuksen. Muista poista joko italic CSS:stä tai itse `<em>`-tagi HTML:stä.

Per-sektio päätös:
- Hero: pidä `ylppäreihin` italic (tämä on uniikein hetki, sallittu)
- Proof: poista `rubriikki` italic → muuta normaaliksi
- Catalog: poista `A → E` italic → muuta normaaliksi
- Pricing: poista `Yksi` italic (kun rule-of-three headline myös poistuu, tämä on luonnollista)

### 5. (Optional) Lisää 1-2 Humaaans-spotti uudelle sektiolle

Nykyiset Humaaans-assetit:
- `/img/illustrations/student-reading.svg` (hero, käytössä)
- `/img/illustrations/student-walking.svg` (CTA, käytössä?)
- `/img/illustrations/quill-inkwell.svg` (käytössä?)
- `/img/illustrations/ornament-rosette.svg` (käytössä?)

Jos joku näistä on käyttämättä, sijoita 1-2 niistä sopiviin spotteihin (Grade-flow-sektion top, Pricing-sektion margin). **Älä lisää uusia stock-photo-assetteja.** Vain olemassa olevia Humaaans-figuureja.

Jos jälkeenpäin halutaan lisää: erillinen brief Humaaans-set:in laajennukselle.

---

## Mitä writer tekee

### Step 1: Etsi kaikki "Luku X · Y" -kohdat

```bash
grep -rn "Luku [IVX]\+ ·" --include="*.html" --include="*.css" .
```

Lista kaikki tulokset. Poista sekä HTML-elementit (`<aside class="..."`, `<span class="..."`) että näiden CSS-luokat.

### Step 2: Etsi Roman-numeraali-renderöinti

```bash
grep -rn "[IVX]\+\." --include="*.js" --include="*.html" js/landing-catalog* index.html
```

Etsi koodi joka renderöi catalog-korttien numerot. Poista.

### Step 3: Pricing-headline-variantit

Marcel valitsee. Kirjoita 3-4 ehdokasta briefin lopussa.

```
### Päätös 2026-05-27 (L-V331 pricing-headline)
Variantti X valittu, koska <yhden virkkeen perustelu>.
```

### Step 4: Italic-accent audit

```bash
grep -rn "<em>\|hero__title-accent\|section-title em" index.html public/landing/*.html
```

Lista löydökset. Päätä per kohta: pidä italic vai poista.

### Step 5: Humaaans (jos toteutetaan)

Tarkista mitkä SVG:t ovat käytössä missä. Jos jokin on käyttämättä, sijoita sopivaan kohtaan.

### Step 6: humanizer-pass kaikille uusille teksteille

Pricing-headline ja mahdolliset muutkin copy-muutokset pakollisen humanizer-tarkistuksen läpi: em-dash, AI-brand-sanat, rule-of-three (irooinen tässä), sycophantic openers.

### Step 7: Verify

```bash
npm run build
npx playwright test tests/e2e-brand.spec.js     # 16/16 PASS
npx playwright test tests/e2e-bug-scan.spec.js   # 38/38 PASS
node scripts/landing-fullpage-audit.mjs         # mittaa muutoksen
```

Visual:
- Mobile + desktop screenshotit sektioista ennen + jälkeen
- Tarkista että ei jäänyt yhtään "Luku X · Y" eyebrowja eikä Roman-numeraaleja catalog-korttiin
- Tarkista että italic-accentit ovat enää max 1 per sektio

### Step 8: SW + IMPROVEMENTS

Bumppaa `sw.js` CACHE_VERSION (esim. v328 → v329 jos V329+V330 ehtivät edelle). Yksi rivi IMPROVEMENTS.md:hen.

---

## Acceptance criteria

1. `grep -rn "Luku [IVX]\+ ·" --include="*.html"` palauttaa 0 osumaa
2. Catalog-kortit eivät renderöi Roman-numeraaleja (visuaalinen tarkistus)
3. Pricing-headline ei ole rule-of-three -muotoinen
4. Italic-accent: max 1 per sektio
5. Mikään competitor-tason AI-slop-pattern (book-eyebrow, Roman-numeraali, rule-of-three) ei näy landingilla
6. `npm run test:bug-scan` 38/38 PASS
7. `tests/e2e-brand.spec.js` 16/16 PASS
8. Marcel hyväksyy pricing-headline-variantin ennen final commitia

---

## Out-of-scope

- **Pricing → oma sivu** — eri loop jos Marcel päättää menee sitä reittiä (competitor-research suosittelee pricing pysyy landingilla)
- **Live writing demo hero:ssa** — L-V332, oma design-spec ensin
- **Humaaans-set:in laajennus uusilla figuureilla** — eri loop, vaatii brand-asset-päätöksen
- **Section-järjestys** — V329-V330 hoitavat sen
- **Catalog-korttien sisältö** — vain Roman-numeraali pois, ei muuta korttien sisällölle
- **Stock-photo-lisäykset** — kategorinen ei (validoitu competitor-research:llä, WordDive käyttää illustrations, ei photos)

---

## Skill-stack writerille

FRONTEND-M (useita pieniä muutoksia samaan loop:iin: eyebrow-poistot, catalog-rendering, headline-CSS, italic-audit):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`

TESTING-S (regression):
- `webapp-testing`
- `superpowers:verification-before-completion`

COPY (pricing-headline + mahdolliset muut teksti-muutokset):
- `humanizer`

Total: 6 skilliä.

---

## Päätös-rekap

Marcel pyysi competitor-tarkastusta. 5 kilpailijaa (WordDive, Studeo, Eduix, Abitreenit, Mafy) → kukaan ei käytä Luku-eyebrowja, Roman-numeraaleja eikä rule-of-three pricing-headlinea. Puheo on patternin omistaja yksin. Sweep on selkeä win.

Lead-magnet (Mafy-tyyli) ei sovi Puheo:lle koska meidän tuote ON jo trial-pohjainen — `Aloita ilmaiseksi`-CTA on parempi lead-magnet kuin pdf-opas. Tämä ei ole tämän loopin osa.

Live writing demo on iso uusi feature, eriytetään L-V332:ksi.

Realistinen scope: 45-75 min sweep.
