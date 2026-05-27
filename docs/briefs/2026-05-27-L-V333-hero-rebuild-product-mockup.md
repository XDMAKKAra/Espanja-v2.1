# BRIEF: L-V333 — Hero + landing rebuild (product mockup, full-width desktop)

**Päivä:** 2026-05-27 ilta
**Triggeri:** Marcel huomasi 2026-05-27 vertailemalla Puheoa WordDiven, Studeon, 10monkeysin, ja muihin kielenoppimissivuihin. Diagnoosi: meidän landing **näyttää mobiilipohjalta laajaruudulla** koska content on puristettu 980px kontaineriin keskelle 1920px-screeniä. Reunoille jää 800px tyhjää. Kilpailijat täyttävät leveyden tuote-mockupeilla (puhelin/laptop kehyksessä screenshot tuotteesta) ja content kelluu sen keskellä.
**Status:** **FRONTEND-L rebuild.** Hero-arkkitehtuurin muutos + content-max-width kasvatus + sections kelluvuus desktop:illa. ~6-12h writer-työ jaettuna Phase 1-3:een.
**Suhde aiempiin loop:eihin:** V331 (slop sweep) säilyy pätevänä, ei muuteta. V329:n "hero polish" -fix:t (Jatka harjoittelua -nappi, Kielet-label-fontti, hero__teaser-poisto, secondary-CTA, sub-rivinvaihto) ovat **edelleen päteviä mutta osa tehdään uudelleen** koska hero-rakenne muuttuu. V330:n catalog-cut pysyy itsenäisenä. V332:n live-writing-demo voi integroitua hero-mockupin sisään.

---

## Mitä ongelma on, dataan perustuen

Vertailu 1920px desktop-resoluutiossa:

| Sivu | Content fills | Visual element on hero |
|---|---|---|
| **Puheo (nykyinen)** | ~980px (51%) | Humaaans student-reading.svg ainoana visuaalina |
| **WordDive** | ~100% | Kaksi puhelin-mockupia (vasen + oikea), kummassakin tuote-näkymä |
| **Studeo** | ~100% | MacBook-mockup full-bleed, screenshot tehtävä-näkymästä |
| **10monkeys** | ~100% | Iso phone mockup käden päällä, screenshot kurssi-näkymästä |
| **Mafy** | ~100% | Stock photo opiskelijoista |
| **Eduix** (B2B) | ~70% | Abstrakti graafi, ei product (B2B-pattern, ei meitä koskeva) |

**Yhteinen kaava B2C-kielenoppimissivuilla:** product mockup oikeassa device-frame:ssä on hero:n primary visual. Illustraatio yksinään (kuten meillä) on edge-case, ja se feel-juuri sellaiselta kuin Marcel kuvasi: **landing näyttää pohjalta puhelin-näytölle skaalatulta**.

Toinen löydös: kilpailijoiden tuote-mockupit toimivat KUVITUKSEN korvaajana, eivät lisäyksenä. Humaaans-figuurit Puheo:n brand-systeemissä eivät katoa, mutta ne siirtyvät **toissijaiseen rooliin** (esim. tausta-ornamentti tai pikku-spotti per sektio), ei hero-päähuomion.

---

## Mitä tehdään, Phase 1-3

### Phase 1 — Content-max-width kasvatus + hero-arkkitehtuuri (≤2h)

**1A. Token-päivitys:** `css/landing-editorial-tokens.css`:n `--ed-content-max` (todennäköisesti 1100-1200px) **kasvatetaan 1440px:hen**. Tämä koskee KAIKKIIN `.landing`-pohjaisiin sektioihin joissa `max-width: var(--ed-content-max)`. Käyttäjä joka avaa 1920px:llä saa content joka oikeasti hengittää reunat (240px per puoli, ei 470px).

**1B. Hero `__inner` grid muutos:** nykyinen 7fr/5fr:
- 1024-1439px viewport: säilyy nykyisellään (vasen visual + oikea copy)
- 1440px+ viewport: muutetaan **kolme-saraukkeiseksi**: vasen visual (phone mockup #1) | keskellä copy + CTAs | oikea visual (phone mockup #2 TAI Humaaans-figuuri). Tämä matchaa WordDive-patternin. Grid `minmax(0, 1fr) minmax(420px, 560px) minmax(0, 1fr)`.
- Mobile <1024px: yhden sarakkeen stack (V326:n päätös pysyy, kuvitus piiloon mobile:ssa).

**1C. Hero-padding ja section-rytmi:**
- Hero-section vertical padding: 1440px+ kasvatetaan 80px → 120px (ylälaitaan), antaa hengen.
- Sections väleille (`section + section`): margin-top kasvatetaan jotta scroll-rytmi on rauhallinen, ei "kortit takertuvat toisiinsa".
- Tämä pätee KAIKKIIN sektioihin (Hero, Proof, Grade-flow, Catalog, Pricing, FAQ, CTA).

**Verify Phase 1:** screenshot 1920px desktop, 1440px desktop, 1024px laptop, 390px mobile. Vertaa että contentin %-täytöllä on rauhallinen reuna-tyhjyys (~10-15%) eikä massiivinen (~40%).

### Phase 2 — Product screenshot mockups (≤4h)

**2A. Generoi product-screenshotit:**

Käytä Playwright:ä ottamaan screenshotit OMASTA `/app.html`-sovelluksesta. Käyttäjän pitää olla kirjautunut (testpro123 tms TEST_LOGIN_EMAIL). Screenshot kaksi näkymää:

- **Screenshot 1:** Lesson-runner kesken kirjoitustehtävää. Käyttäjä on tehnyt 1-2 lausetta espanjaa, cursor näkyvissä. URL esim. `/app.html#/oppimispolku/kurssi_1/lesson_3` → writing-exercise.
- **Screenshot 2:** Lesson-tulos-näyttö YTL-arvioinnilla. Kun käyttäjä on submittannut kirjoituksen, näkyy YTL-rubriikki pisteet + 1-3 virhe-mainintaa.

Screenshots:t talletetaan: `public/img/product/lesson-writing.png` + `public/img/product/lesson-grade.png`. Käytä tarpeen mukaan `@2x`-versiot retinalle.

Kirjoita Playwright-skripti `scripts/capture-product-screenshots.mjs` jota voi ajaa kun haluat päivittää screenshotit. Skripti login:aa, navigoi kahteen näkymään, tallentaa screenshotit ja kropp:aa kortin osaan jonka haluat.

**2B. Phone-mockup-frame:**

Käytä joko (a) olemassaolevaa SVG-frame:ä (mac-style, valokuva) tai (b) luo CSS-pohjainen iPhone-frame jonka sisällä screenshot näkyy. WordDive käyttää SVG-frame:ä jossa kättä näkyy + puhelin → hyvin "physical".

Luo `<div class="hero-phone">` -komponentti:
```html
<div class="hero-phone hero-phone--left">
  <img class="hero-phone__screen" src="/img/product/lesson-writing.png" alt="Puheo: kirjoitustehtävä espanjaksi" />
</div>
```
+ CSS joka renderöi phone-frame:n border-radius + shadow + status-bar -mockup:n.

Vältä iPhone-trademark-asioita (älä piirrä Apple-logoa, älä yritä matchata tarkasti iPhone-X-rakennetta). Geneerinen "moderni puhelin"-frame riittää.

**2C. Sijoita mockupit hero:hon:**

Replace `<img class="hero__illustration" src="/img/illustrations/student-reading.svg">` rakenne. Uusi hero-rakenne 1440px+:

```html
<div class="hero__inner">
  <div class="hero__visual hero__visual--left">
    <div class="hero-phone hero-phone--left">
      <img src="/img/product/lesson-writing.png" alt="..." />
    </div>
  </div>
  <div class="hero__copy">
    <!-- H1, sub, lang pills, CTAs, trust -->
  </div>
  <div class="hero__visual hero__visual--right">
    <div class="hero-phone hero-phone--right">
      <img src="/img/product/lesson-grade.png" alt="..." />
    </div>
  </div>
</div>
```

1024-1439px viewport: vain `hero__visual--left` näkyvissä (3-sarakkeisesta tulee 2-sarakkeinen). `hero__visual--right { display: none; }` tällä breakpoint:illa.

Mobile <1024px: kaikki visual piilossa (V326:n päätös pysyy).

**2D. Humaaans-illustraation kohtalo:**

Vaihtoehdot:
- (a) Säilytä `student-reading.svg` taustaelementtinä (esim. `position: absolute`, `opacity: 0.3`, suurena tausta-Pattern:nä koko heron taakse). Brand säilyy mutta ei dominoi.
- (b) Siirrä Humaaans-figuuri toiseen sektioon (esim. Grade-flow-sektion top tai CTA-sektion vieressä). Hero saa puhdas product-mockup-fokus.
- (c) Poista kokonaan, korvataan tuotteen yliesityksellä.

Suositus: **(b).** Säilytä Humaaans brand-systeemi mutta siirrä se sekundääriseksi. Student-reading.svg sopii Grade-flow:n yläosaan jossa puhutaan kirjoittamisesta + oppimisesta — kontekstuaalinen, ei dekoraatio.

**Verify Phase 2:** 
- Screenshot vertailu: nykyinen hero vs uusi hero 1920px:ssä. Uuden pitäisi näyttää ammattimaiselta, tuotteen näyttävältä, ei "joku piirsi Humaaans-figuurin".
- Mobile-versio toimii edelleen (kuvitukset/mockupit kaikki piilossa, copy ottaa fold:n).

### Phase 3 — Section-tasolla samat periaatteet (≤6h)

Sama "fill the page" -ajatus pätee KAIKKIIN sektioihin:

- **Proof-sektio:** nykyisin yksi sample-essay-kortti keskellä, ~600px leveä. Uusi: kasvata kortti 920-1100px (laajempi keskelle), tai jaa kahteen sarakkeeseen 1440px+ (sample espanjasta + sample saksasta side-by-side).
- **Grade-flow:** nykyisin 3 korttia rivissä, mahtuvat 1100px:hen. 1440px+:ssa anna kortille enemmän tilaa horizontal scroll vältyy. Tai säilytä 3 korttia mutta lisää padding-x.
- **Catalog:** V330:n cut hoitaa korkeuden. Width-puolella: tarkista että card-grid 4-sarakkeinen 1440px+:ssa (nyt todennäköisesti 3-sarakkeinen).
- **Pricing:** 3 tier-korttia, nyt todennäköisesti ~340px per kortti, 1100px max. 1440px+:ssa kasvata kortteja, tai lisää ylimääräinen tila card-välien marginiin.
- **FAQ:** accordion-pattern, säilytä mutta laajenna content-max-width:in mukaan.
- **CTA:** loppu-sektion CTA voisi saada **toisen product-mockupin** (esim. dashboard / progress-näkymä) Humaaans-figuurin sijaan. Tai säilytä Humaaans tässä jos on poistettu hero:sta.

**Verify Phase 3:** scroll koko sivun 1920px-screeniä. Joka sektio fill 70-100% leveyttä. Ei mitään pinta-alaa joka näyttää "iPad keskellä".

---

## Mitä writer tekee, järjestyksessä

### Step 1: Lue tämä brief + tutki nykyrakennetta

```bash
grep -n "max-width\|--ed-content-max" css/landing-editorial-tokens.css css/landing-editorial.css | head -30
grep -n "hero__inner\|hero__visual\|hero__copy" css/landing-editorial.css | head -10
```

Ymmärrä nykyrakenne ennen muutoksia.

### Step 2: Phase 1 — content-max-width + hero grid

Tehdään tokenin päivitys (1100 → 1440) ja hero-grid kolme-sarakkeiseksi 1440px+:lla. Screenshot ennen+jälkeen 1920px-leveydellä. Marcel hyväksyy ennen Phase 2:ta.

### Step 3: Phase 2 — Capture screenshots + phone-mockup + hero-rakenne

1. Kirjoita `scripts/capture-product-screenshots.mjs` Playwright-skripti
2. Aja se → tuottaa kaksi screenshot:ia
3. Luo `.hero-phone`-komponentti HTML + CSS
4. Päivitä `index.html` heron rakenne (kolme sarake, kaksi phone-mockupia + copy)
5. Päätä Humaaans-figuurin siirto (suositus: Grade-flow-sektion top)
6. Screenshot ennen+jälkeen. Marcel hyväksyy ennen Phase 3:ta.

### Step 4: Phase 3 — Section-tasolla samat periaatteet

Käy läpi Proof, Grade-flow, Catalog, Pricing, FAQ, CTA. Päivitä joka sektion max-width + grid + spacing kasvattamaan 1440px+:lle. Joka sektion jälkeen ota screenshot 1920px:llä.

### Step 5: Verify-suite

```bash
npm run build
npx playwright test tests/e2e-brand.spec.js     # 16/16 PASS
npx playwright test tests/e2e-bug-scan.spec.js   # 38/38 PASS
node scripts/landing-fullpage-audit.mjs         # mittaa korkeudet
```

Plus:
- Screenshot 1920×1080
- Screenshot 1440×900
- Screenshot 1024×768 (laptop pieni)
- Screenshot 390×844 (iPhone 13)
- Screenshot 320×568 (iPhone SE — worst-case mobile)

Kaikki näkymät pitäisi näyttää tarkoitukselliselta. Mobile-versio identtinen V326:n jäljiltä.

### Step 6: SW + IMPROVEMENTS

Bumppaa CACHE_VERSION reilusti (v329-v333 välissä, kerralla "+3" tai vastaava jos useat ship:t kerralla). STATIC_ASSETS-listalle uudet phone-mockup-PNG:t + capture-skripti EI tarvitse cache:a.

---

## Acceptance criteria

1. **Desktop 1920×1080:** hero käyttää vähintään 75% viewport-leveyttä, ei näytä "mobiili keskellä iso ruutu"
2. Hero näyttää **vähintään yhden product-mockupin** (puhelin tai laptop), 1440px+:ssa kaksi mockupia
3. Phone-mockup näyttää oikean screenshotin Puheo:n omasta /app.html:stä (ei stock-imagee, ei Humaaans)
4. Humaaans-illustraatio joko siirretty sekundäärisektioon tai poistettu hero:sta
5. KAIKKI sektiot (Proof, Grade-flow, Catalog, Pricing, FAQ, CTA) skaalautuvat täyttämään desktop-viewport rauhallisesti
6. Mobile-versio (V326-jäljiltä) säilyy puhtaana — kuvitukset/mockupit kaikki piilossa <720px
7. `npm run test:bug-scan` 38/38 PASS
8. Brand-e2e 16/16 PASS
9. `scripts/capture-product-screenshots.mjs` toimii repeatably (Marcel voi ajaa sen kun haluaa uudelleen)
10. Phone-mockup-PNG:t ovat alle 250KB / kpl pakattuna

---

## Out-of-scope

- **Stock-photo-lisäykset** — kategorinen ei, validoitu competitor-research:llä (WordDive käyttää product-mockupia, ei valokuvia)
- **App-näkymien rebuild** — vain SCREENSHOT olemassaolevasta /app.html:stä, ei muokata varsinaista appia. Jos screenshot näyttää huonolta, se kertoo että /app.html on huono → eri loop
- **Brand-värien muutos** — paletti pysyy (#A0341F + #F5EDE0)
- **Wordmark / favicon** — eivät kosketuksessa
- **Pricing → oma sivu** — eri loop jos Marcel päättää, competitor-research suosittelee landing:lle pysymistä
- **Live writing demo (V332)** — integroidaan myöhemmin, voi olla osa phone-mockup:n alapuolella
- **Section-content rewriteen** — vain layout-tason muutoksia, ei kirjoita uudelleen tekstejä

---

## Skill-stack writerille

FRONTEND-L (koko hero rebuild + section-skaalaus):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`
- `impeccable`
- `emil-design-eng`

TESTING-M (Playwright screenshot-capture skripti + regression):
- `webapp-testing`
- `superpowers:test-driven-development`
- `superpowers:verification-before-completion`

PLANNING:
- `superpowers:writing-plans` (Phase 1-3 -implementation plan)

Optional jos uusia tekstejä:
- `humanizer`

Total: 8-9 skilliä.

---

## Päätös-rekap

Kilpailijoiden data (WordDive, Studeo, 10monkeys) on yksiselitteistä: B2C-kielenoppimissivut näyttävät tuotteen, ei kuvitusta. Puheo:n nykyinen hero on visuaalinen anomalia kielenoppimismaisemassa.

Tämä on iso muutos. Ei viikon ship, vaan 2-3 päivän iteraatio. Marcel pyysi /effort max — vastaa siihen pitkällä spec:llä + faasitettu toteutus.

Realistinen scope: 6-12h jaettuna Phase 1-3:een, kullakin checkpoint ja Marcel:n hyväksyntä ennen jatkamista.

Tämä brief ei ole tämä ilta. Tämä on **viikon investointi joka tekee Puheon näyttää oikealta tuotteelta eikä proto-typolta**.
