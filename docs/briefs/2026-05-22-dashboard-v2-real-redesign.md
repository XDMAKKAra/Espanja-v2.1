# BRIEF: Dashboard v280 — Mafy/Nova-tyylinen oikea redesign

**Päivä:** 2026-05-22
**Versio:** v280
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v276 brand-värin palautus + v277/v278 sidebar — molemmat hyvä olla mainissa
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Tavoite

Korvata `js/screens/home.js`:n nykyinen viiden osion korttikasa **oikealla redesignilla** Mafynetin + Otavan Novan tyyliin. Lopputulos: kun käyttäjä avaa Aloituksen, näytön ensi-tunne EI ole "viisi tasaista palstaa" vaan **iso visuaalinen hero + ei-symmetrinen layout + personalisoitu sisältö**.

EI pyyhe. EI italic-Fraunces-clean-up. **Rakenteen ja tunnelman muutos.**

---

## Miksi nykyinen ei riitä

`js/screens/home.js` v271-jälkeen on:
1. Greeting + päiväpilleri
2. Tabs (kielet)
3. "Jatka tästä?" -kortti (flat-teksti)
4. "Päivän tavoite" -palkki
5. 4 micro-track-tilea (Sanasto/Kielioppi/Luetun/Kirjoitus)
6. Footer (Koeharjoitus)

**6 osiota, kaikki tekstilaatikkoja, ei yhtään kuvaa, ei mitään liikettä.** Käyttäjä sanoo: *"flat ja tylsä."* — oikein.

Mafy/Nova erottuu koska niissä on:
- **Yksi kuvallinen hero** joka vie yli puolet yläosasta (Nova: keltainen mainos-kortti vinjettikuvan kanssa)
- **Jatka-kortti jossa kurssin teema-kuva** (Nova: Särmä 8 ja Fokus 7 -materiaalit pieni-kuvineen)
- **Asymmetrinen ruudukko** (Mafynetti: 2/3 + 1/3 jako, ei 4 tasakokoista)
- **Pikatoiminnot omana lohkonaan** (Nova: "Liity ryhmään" / "Lunasta digimateriaali" omat napit)
- **Sivukortti suositusta/vinkistä** (Nova: "Käyttövinkit" iso keltainen mainos)

---

## Visuaalinen suunta

**Palette** (v276:n päälle):
- App-tausta: warm-near-white `oklch(98% 0.005 60)` (NOT pure #fff — liian steriili, NOT beige cream — liian vintage)
- Hero-kortti: lämmin cream `oklch(95% 0.025 70)` taustana (Old-Spain-aksentti)
- Brick `#A0341F` aksenteissa (CTA, badge, link)
- Yksi lämmin lisäsävy promo-kortille: terracotta `oklch(72% 0.12 40)` tausta + cream teksti
- Tumma teksti: `oklch(18% 0.012 30)` (warm-black, ei #000)

**Typografia:**
- Fraunces VAIN h1-tason hero-otsikoissa, **ei italicia missään pikku-UI:ssa**
- Manrope kaikessa muualla
- EI mono-uppercase eyebrows ("KURSSI 3 · LECCIÓN 4" on OK koska kertoo sijainnin; "TÄNÄÄN" ilman syytä EI)

**Layout (intent, ei pikselikoot):**
- Asymmetrinen: vasen palsta isompi, oikea kapea sivurail
- Sivurail vain leveillä viewporteilla; mobiili → 1-sarakkeinen pino
- Vaihtelevia kortinkokoja, EI 4 samansuuruista mikrotilea
- Kuva tai illustraatio jokaisessa pääkortissa

**Kuvat / illustraatiot — LUPA HAKEA NETISTÄ:**
- **Saa hakea netistä** Unsplash / Pexels / Wikimedia Commons -lähteistä — Marcel on antanut luvan
- **EI fotoclichéitä:** ei "vaaleatukkainen-tyttö-läppärin-kanssa", ei "kahvikuppi-puisella-pöydällä", ei "stockfoto-thumbs-up", ei laser-portrait-bokeh-meta-värit
- **Hyvät queryt** (käytä WebSearch / WebFetch jos saatavilla):
  - Espanja: `"andalusian courtyard"`, `"sevilla rooftop"`, `"barcelona modernist tile"`, `"madrid plaza mayor sunset"`, `"toledo old town"`, `"valencia city of arts"`, `"alhambra geometry"`
  - Ranska: `"paris haussmann balcony"`, `"montmartre stairs"`, `"provence lavender field"`, `"normandy coastline"`, `"lyon traboule"`
  - Saksa: `"berlin spree river"`, `"bavarian alps morning"`, `"hamburg speicherstadt"`, `"munich english garden"`, `"black forest trail"`
  - Per-kurssi teema-sanat: K1 (tervehdykset) → aukio, K2 (arki) → markkina/kahvila, K3 (matkailu) → juna-asema, K4 (ennen ja nyt) → vanha + uusi rinnakkain, K5 (ympäristö) → maisema, K6 (työ) → kahvilan terassi pöytä, K7 (terveys) → tori-hedelmät, K8 (kulttuuri) → museo/galleria
- **Tekijänoikeudet:** käytä **Unsplash-licenseä** (`https://unsplash.com/license`) tai **Pexels-licenseä** tai **Wikimedia Commons CC0 / CC BY -kuvia**. Tallenna lähde-URL + license-tieto `public/illustrations/credits.md`:hen jokaisesta kuvasta
- **Optimointi:** kuvat **WebP-formaattiin** + max 1600px leveys + `<img srcset>` retina-tarkkuuksille. `loading="lazy"` paitsi hero. Älä tuo 5MB-jpegejä reposta
- **Vaihtoehto:** SVG-illustraatiot kurssien teemoista jos jaksat tai löydät avoin-lähteen settejä (esim. unDraw, Storyset CC-BY). Käytä rajoitettua paletettia: brick + cream + warm-black + 1 lisäsävy max
- **Hero-kuva:** mieluummin **arkkitehtuuri / maisema kuin ihmiset**. Jos ihmisiä, etänä / takaa-päin / siluettina (ei tunnistettavia kasvoja, vältä mallikuva-vibe)
- **Saving location:** `public/illustrations/home/<kieli>/k<n>.webp` (esim. `public/illustrations/home/es/k1.webp`) — selkeä rakenne tulevaa varten

---

## Layout-rakenne (intent, ei pikselit)

Worker valitsee tarkat mitat. Pakolliset elementit:

### Yläosa — Hero ("Aloitusote")
- **Iso primary-kortti** joka kattaa noin 60-70% leveydestä desktopilla
- Sisältää:
  - Eyebrow joka kertoo SIJAINNIN curriculumissa (esim. "Espanja · Kurssi 3 · Lecciñn 4")
  - Iso otsikko (Fraunces, EI italic), esim. "Tänään puhutaan ympäristöstä"
  - 1-2 lauseen subteksti joka kertoo MITÄ tehdään ("12 uutta sanaa + lyhyt teksti")
  - **Iso brick CTA-nappi** "Jatka oppituntia →" tai "Aloita →"
  - Tausta: cream tai kuva/SVG kurssin teemasta
- Sivuilla / yläosassa: pieni greeting "Hei, [nickname]." Manropella, ei iso Fraunces — hero-otsikko tekee hierarkian
- **Empty-state** (käyttäjä juuri rekisteröitynyt): "Aloita ensimmäinen kurssi" + sama iso CTA

### Oikea sivurail (vain desktop, piiloon mobiilissa)
- **Yläkortti "Päivän tavoite"** (vertikaalinen)
  - Streak-luku ISO, sen alla "pv putki" Manrope-pienenä
  - Minuutti-tavoite progress-renkaana (SVG circle) tai pylväänä — **ei flat progress-bar**
  - Jos streak = 0: kortti vaihtuu "Aloita putki tänään" -tyyppiseen ystävälliseen tilaan
- **Alakortti "Vinkki päivään"** (mainos-luonteinen)
  - Lämmin terracotta-tausta tai patternia
  - Otsikko + 1-2 lauseen vinkki ("Käytä subjunktiivia kun ojalá tai querer que tulee eteen")
  - Pieni brick-link "Lue lisää →" → vie johonkin lukukortti-näkymään tai opetussivulle
  - Sisältö voi rotatoitua viikkokohtaisesti (placeholder lista 7 vinkkiä, valitse päivän index)

### Keskirivi — Kurssipolku-snapshot
- **EI 4 samankokoista mikrotileä**
- Vaihtoehto 1: 1 iso aktiivisen kurssin "kortti" jossa kurssin teema-kuva + 3 micro-tileä muiden modejen pikakuvina (asymmetric 2/3 + 1/3)
- Vaihtoehto 2: horisontaalinen scroll-rivi (vapaalla mobile-tuella) joka näyttää kaikki 4 modea hieman erikokoisina
- Aktiivisen kurssin micro-progress näkyy isona, muut "sleeping" -tilassa pienempinä

### Alaosa — Pikatoiminnot
- 2-3 tekstuaalista action-linkkiä rivissä ("Vaihda kieltä" · "Asetukset" · "Koeharjoitus")
- Pieniä, ei korttejakaan — pelkät tekstilinkit brick-värillä
- Korvaa nykyisen Koeharjoitus-footerin

---

## Tekninen toteutus

### Tiedostot
- **Muokkaa:** `js/screens/home.js` — täyttä uudelleenkirjoitus on OK
- **Uusi:** `css/components/home.css` (jos ei vielä ole) tai lisää `home.css` -lohkot v280-merkillä
- **Uusi:** `public/illustrations/home/` -hakemisto SVG:ille (jos käytät niitä)
- **EI koske:** `app.html`-shelliä (jätä `<section id="screen-home"><div id="home-root"></div></section>` ennalleen)
- **EI koske:** sidebaria (v277 sopii sellaisenaan)

### Data
- Lue jo olemassa olevaa `/api/dashboard/v2` -payloadia — sieltä saat `dashboard.streak`, `dashboard.modeStats`, `dashboard.chartData`, `profile`
- Jos tarvitset päivän vinkin / suosituksen ja sitä ei ole API:ssa, käytä HARD-CODED 7 vinkki-listaa frontissa, valitse `new Date().getDay() % 7` -indeksillä (yksinkertaisin tapa, ei lisää backendiä tähän)
- Hero-otsikko / sub: jos `lastLesson`-tieto on sessionStorage["currentLesson"]:ssa tai localStorage["puheo:last-lesson"]:ssa, käytä sitä; muuten empty-state
- **Älä lisää uutta API-reittiä tähän briefiin** — pyrkimys minimoida backend-muutoksia

### Animaatio (Emil-skill)
- Hero-kortti fade-in + slight translate-Y 16px → 0 (200ms ease-out)
- Streak-numeron count-up animaatio kun arvo asetetaan ensimmäistä kertaa (esim. 0 → 7 lerpaten 600ms)
- Progress-renkaan stroke-dasharray animoituu 0 → todelliseen arvoon (400ms ease-out)
- EI gradient-glowja, EI scale-bounceja, EI hover-lift-shadowia
- `@media (prefers-reduced-motion)` → animaatiot opacity-only

### Responsive
- **Desktop ≥ 1024px:** asymmetric 2-col (main 65% + rail 35%)
- **Tablet 768-1023px:** sivurail siirtyy pinon loppuun (alle kurssipolun)
- **Mobile <768px:** yksi sarake, kortit täysleveinä, sivurail ennen kurssipolkua
- **EI horisontaalista scrollia mobiilissa** (paitsi tarkoituksellisesti kurssipolku-snapshotissa jos valitset sen rakenteen)

### Performance (käyttäjä huomautti hitaudesta)
- Hero-kortti renderöityy heti skeleton-rakenteen kanssa, älä odota `/api/dashboard/v2` -palautusta paint-eventiin
- Tarvittavat kuvat: `<img loading="eager" fetchpriority="high">` herolle, muut `loading="lazy"`
- Jos lisäät SVG-illustraatioita: inline-SVG hero-kortille (ei `<img>`-haku), muut voivat olla img-tagilla
- Preload kriittinen font: Fraunces 600 weight via `<link rel="preload">` (jos ei jo olemassa)

---

## Verifiointi

1. **Baseline-screenshot:** nykyinen `home.js`, kirjautuneena testpro123, desktop 1440px + mobile 375px
2. **After-screenshot:** uusi versio, sama viewport-pari
3. **Visuaalinen muutos pitää olla iso ja ilmeinen** — jos ennen/jälkeen näyttää 80% samalta, et ole onnistunut
4. **AI-slop-checklist (kovennettu):**
   - [ ] EI italic-Fraunces missään muualla kuin h1-hero-otsikossa (ja siinäkään tarkista että se ei näytä pakotetulta)
   - [ ] EI 4 samankokoista mikro-tile-grid -patternia
   - [ ] EI mono-UPPERCASE-eyebrowia jonka voi korvata normal-case-tekstillä
   - [ ] EI flat-tausta-kortti-stackia ilman vähintään 1 kuvallista elementtiä
   - [ ] EI em-dashia suomi-tekstissä
   - [ ] EI gradient-text:iä
   - [ ] EI glassmorphism-decoration
   - [ ] Asymmetrinen rakenne desktopilla (ei 12-col-symmetric)
   - [ ] Streak-progress on visuaalinen (rengas tai vastaava), ei pelkkä flat-palkki
   - [ ] Vinkki/suositus-kortti on värimaailmaltaan eri kuin pääkortti (lämmin aksentti)
5. **Tab-test:** focus näkyy kaikilla CTA/link-elementeillä brick-värillä (v276 tokens)
6. **Reduced-motion:** koko paint toimii ilman animaatioita
7. **`npm run build`** ja **`npm test`** PASS
8. **Bumppaa `sw.js` CACHE_VERSION** koska home.js + uudet CSS muuttuvat

---

## Käyttäjän suorat sanat (käytä validointiin)

> *"flat ja tylsä... täynnä ai sloppia... pitää olla paljon elävämpi"*

Jos uusi versio näyttää edelleen "flat ja tylsä" laatikoita peräkkäin, **älä committaa** — tee toinen iteraatio. Mafy/Nova on referenssi: avaa molemmat selaimessa ja katso että uusi Puheo-Aloitus tuntuu samaan luokkaan kuuluvalta, ei 80-luvun lomake-tyyliseltä.

---

## Commit + PR

- **3-5 commitia:**
  - `feat(home): hero card with image (v280)` — pääkortti + sen CSS
  - `feat(home): right rail goal + vinkki cards` — sivurail
  - `feat(home): asymmetric tracks snapshot` — kurssipolku-snapshot
  - `feat(home): quick-actions footer` — alaosa
  - `chore(home): animation polish + reduced-motion` — Emil-skillin pohjalta
- PR-otsikko: `feat(home): Mafy/Nova-style redesign v280`
- IMPROVEMENTS.md: `v280 — feat: dashboard oikea redesign — asymmetrinen layout + hero-kortti + sivurail + visuaalinen streak (käyttäjän complaint "flat ja tylsä" → korjaus)`

**Ei pushia ilman lupaa** — VISUAALISTI MERKITTÄVÄ muutos, Marcel haluaa katsoa screenshotin ennen Verceliä.

---

## Don't

- ÄLÄ pidä nykyistä viittä osiota peräkkäin ja yritä "tehdä niistä elävämpiä" — **rakenne pitää muuttua**
- ÄLÄ käytä Unsplash-clichéitä (ihmisiä läppärin kanssa, kahvi puinen pöytä)
- ÄLÄ rakenna 12-col symmetrista gridiä — käytä 2/3+1/3, 65/35, tai vastaavaa epätasapainoa
- ÄLÄ käytä gradient-textiä otsikoissa
- ÄLÄ käytä glassmorphism-decoration tai box-shadow-glowja
- ÄLÄ käytä italic-Fraunces mihinkään mikä ei ole iso hero-otsikko
- ÄLÄ kopioi Nova-violettia tai Mafy-sinistä — säilytä brick + cream + warm-black
- ÄLÄ unohda mobile-1-saraketta — testaa 375px ennen committia
- ÄLÄ syytä cachea — incognito + sw.js CACHE_VERSION bump
- ÄLÄ tee tätä rinnakkaisessa branchissa muiden kesken — vie auto/dashboard-v2-redesign-v280

## Onnistuminen

- [ ] Baseline + after screenshotit desktop + mobile
- [ ] Hero-kortti dominoi yläosaa (≥ 50% ylä-foldista)
- [ ] Vähintään 1 kuvallinen / illustroitu elementti
- [ ] Asymmetrinen rakenne desktopilla
- [ ] Streak visualisoitu (rengas tai vastaava), ei flat-bar
- [ ] Vinkki/suositus-sivukortti olemassa, eri värimaailma
- [ ] EI italic-Fraunces pikku-UI:ssa
- [ ] EI 4-mikrotile-grid
- [ ] Mobile-pino toimii 375px:llä
- [ ] Animaatiot Emil-skillin sääntöjen mukaan, reduced-motion-tuki
- [ ] `npm run build` + `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu
- [ ] PR avattu, EI mergattu, screenshot Marcelille
