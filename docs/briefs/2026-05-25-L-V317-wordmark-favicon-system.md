# BRIEF: L-V317 — Wordmark + favicon-systeemi + kurssi_1 copy fix

**Päivä:** 2026-05-25
**Edellinen:** L-V316 (wire /next-topic + humanisoi lessonit) writerillä työn alla
**Tausta:** Council (5 advisoria + chairman synth) ajettu päätöksenteon tueksi. Konvergenssi 5/5: wordmark-only, ei AI-image-gen markia, hand-coded SVG via Claude. Brand-attribuutit Marcel valitsi: **älykäs/moderni + lämmin/kannustava**.
**Paletti-päätös:** Old-Spain säilyy. Brick-red on perusteltavissa multi-langina (ES rojo / DE rot / FR rouge — kaikki kolme kulttuuria sisältävät punaista). Espanja-hero accent kestää DE/FR-kontekstissa.

---

## Hard constraints (poikkeavasta saavutuksesta huolimatta lukitut)

1. **WORDMARK-ONLY.** Ei symbol-markia. Ei maskottia. Ei laurelia, aurinkoa, kirjaa, lintua, puhekuplaa. Symbol on automaattinen disqualifier Suomen lukio-institutional-segmentille 2026 — kaikki ovat oppineet tunnistamaan Midjourney-tyypin AI-marks ja diskonttaamaan lähteen.
2. **HAND-CODED SVG via Claude.** ÄLÄ käytä brandkit-skilliä logon generointiin. Brandkit on OK *vain* app-iconin background-tekstuurille (paperigrain) jos sellaista tarvitaan — ei itse markin tai wordmarkin tuottamiseen.
3. **Käytä olemassa olevaa typografiaa.** General Sans on jo stackissa V302:n typography-swapin jälkeen — käytä sitä, ei uusia fontteja. Jos General Sans ei toimi wordmark-tarkoitukseen, fallback Inter Display (myös free).
4. **Lowercase wordmark:** `puheo`. Lämpimämpi (warm/encouraging attribute) ja erottuu suomalaisesta institutional-titlecase-konventiosta (Otava, Wilma, Abitti).
5. **Yksi ornamental gesture, ei kolme.** Yksi pieni custom-detail jonka voi puolustaa yhdellä virkkeellä. Esim. "h":n bowl pyöristetty hieman tavallista lämpimämmäksi", "o:n piste warm-brick-värinen pieni accent". Älä yhdistele.
6. **Ei AI-image-gen-markia.** Slop-gate ennen committia: avaa favicon 16px-tabissa selaimessa Vercel + Linear + Stripe + Otava + Wilma vieressä. Jos näyttää startup-template-AI-tehdyltä, ei shippaa.

---

## Värit (Old-Spain, multi-lang-defended)

```css
/* Käytä jo olemassa olevia design-tokeneita jos `--brand-brick` / `--bg-cream` löytyvät — älä luo duplikaattia.
   Jos eivät ole, lisää ne `css/tokens.css`:ään tai vastaavaan. */

--brand-brick: #B5443B;   /* primary accent, multi-lang defensible (rojo/rot/rouge) */
--brand-cream: #F5EDE0;   /* warm-white background, NOT pure #fff */
--brand-ink: #2A1F1A;     /* warm-black text, NOT pure #000 */
--brand-brick-dark: #8B3329;  /* dark-mode variant, säilyttää lämmön */
```

Jos token-arvot eroavat hieman olemassa olevista, **käytä olemassa olevia.** Älä keksi uutta paletti-juuria.

---

## Vaihe 1 — Concept-lock (~15 min)

Ennen SVG-koodin kirjoittamista, kirjoita yksi-virkkeen description ornamental gesturesta. Esimerkkejä:

- A: "puheo lowercase, dot of 'o' replaced with a 4-px brick-red square offset 1px to upper-right"
- B: "puheo lowercase, descender of 'p' shortened by 8% to feel anchored"
- C: "puheo lowercase, 'h' bowl raised 2px to suggest forward motion / progress"

**Pickaa yksi.** Älä yritä kolmea. Jos et osaa kirjoittaa gestureä yhteen virkkeeseen → kill it. Logo pitää pystyä puolustamaan yhdellä lauseella.

Suositus jos epäröit: **A** ("o"-piste brick-square). Yksinkertaisin, näkyy faviconissa, sallii kahden eri värin käytön wordmarkissa minimaalisesti.

---

## Vaihe 2 — Wordmark-SVG (~45 min)

Kirjoita hand-coded SVG, ei rasterointia, ei generaattorin output-paste.

**Tiedostot:**

- `public/brand/logo.svg` — brick on cream, primary
- `public/brand/logo-mono.svg` — yksiväri (ink on cream) — printti, single-color contexts
- `public/brand/logo-dark.svg` — cream on ink, dark-mode

**Tekniset vaatimukset:**

- `<svg viewBox="0 0 240 80">` -tyyppinen, ei kiinteää width/height
- Käytä `<text>`-elementtejä jos General Sans on web-fontti — embeddaa fontti `<style>`-blockissa **vain** jos se on välttämätöntä (yleensä outline-paths on parempi). Käännä teksti outline-pathiksi ennen ship'iä jotta logo renderöityy oikein vaikka fontti ei ole ladattu (esim. Slack-preview, sähköposti, social-card).
- Pidä SVG **alle 4 KB** minifoituna. Jos isompi, olet ylikoristellut.
- Käytä `aria-label="Puheo"` accessibility-syistä
- Ei `<filter>`, ei `<defs>` joka sisältää gradienttejä (anti-AI-slop, ei glow-efektiä)
- Jos ornamental gesture on toinen väri, käytä `fill="var(--brand-brick)"` inline-style ei attribuutti, jotta dark-mode-variantti toimii CSS-tasolla

**Mockup-vertailu:**
- Avaa General Sans:n eri painot (Regular / Medium / Semibold) — valitse yksi joka tasapainottaa älykäs/moderni (lighter weights) vs lämmin/kannustava (medium fills better)
- Suositus: Medium tai Semibold lowercase
- Letter-spacing: tightned (-1% to -2%) jotta wordmark istuu kompaktimmin

---

## Vaihe 3 — Favicon-pipeline (~45 min)

**Master:**
- `public/brand/favicon-master.svg` — 512×512, mark-only (yksittäinen kirjain tai logo-symbol-osa). Jos wordmark ei toimi 16px:ssä, isoloi yksi kirjain (esim. lowercase "p" omalla ornamental gesturella) → master
- Renderöi master myös PNG:nä 512×512 (tarvitaan generator-toolille)

**Generaattori:**
- Käytä `realfavicongenerator.net` (free, online, ei lataa mitään assetteja kolmansiin kantoihin pysyvästi)
- Lataa 512×512 PNG → spits out 16/32/180-apple-touch/192/512-pwa + manifest.json + html-snippet
- ÄLÄ käytä favicon-generator-CLI-paketteja joita ei ole stackissa (zero new dep)

**Output:**
- Drop kaikki kuvat `/public/favicon/`:iin (luo kansio jos ei ole)
- `manifest.json` käytä jo olemassa olevaa jos sellainen on → patchi viittauksia, älä korvaa kokonaisuudessaan (rikkoo PWA-asennusta)
- Päivitä `<link rel="icon">`-tagit:
  - `index.html`
  - `app.html`
  - `public/landing/espanja.html`, `saksa.html`, `ranska.html`
  - `onboarding.html` / `diagnose.html` jos olemassa

---

## Vaihe 4 — `kurssi_1` → "Kurssi 1" copy-fix (~15 min)

Grep koko codebase:
```bash
grep -rn "kurssi_[0-9]" js/ app.html public/ data/ lib/ --include="*.js" --include="*.html" --include="*.json"
```

**Varovasti:** osa näistä on **data-key-arvoja** (esim. `course_id: "kurssi_1"` databasessa) — niitä EI muuteta. Muutos koskee vain **käyttäjälle näkyvää UI-tekstiä**.

Skannauksen jälkeen:
- Jos `<span>kurssi_1</span>` tai vastaava UI-renderoitava merkkijono → korvaa "Kurssi 1"
- Jos `course.id === "kurssi_1"` -tyyppinen logic-vertailu → ÄLÄ KOSKE
- Jos data-rakenteissa `{ id: "kurssi_1", title: "..." }` → muuta `title`-kenttä jos se näkyy UI:ssa "kurssi_1" muodossa, jätä `id` rauhaan

Lisäksi: tarkista että app-shell-headerin alaotsikko (Marcelin screenshot näytti "Espanja · kurssi_1") näyttää nyt "Espanja · Kurssi 1" tai parempi muotoilu ("Kurssi 1 · Mi mundo" jos lesson-rakenne tukee).

---

## Vaihe 5 — Slop-gate ennen committia

Tee tämä **ennen `git add`:tä:**

1. Avaa `index.html` selaimessa (lokaali tai prod-preview)
2. Renderöi favicon 16px-tabissa
3. Avaa rinnalle vieressä uusia tabbeja:
   - vercel.com
   - linear.app
   - stripe.com
   - otava.fi
   - wilma.fi (jos saatavilla)
4. Vertaa visuaalisesti. Kysymys: **näyttääkö Puheo-favicon AI-tehdyltä startup-templateltä, vai oikealta tuotteelta jossa on intent?**
5. Jos slop → korjaa tai degrade pelkkään wordmark-tekstiin (yksi kirjain) ilman ornamental gesturea. Älä iteroi enempää kuin 2 kertaa.

---

## Vaihe 6 — Verify + commit (~15 min)

1. `npm run build` — bundlattu CSS/JS päivittyy
2. SW-bump: `sw.js` `CACHE_VERSION` v309 → v310 + STATIC_ASSETS lisäys (kaikki uudet `/public/brand/*`, `/public/favicon/*`, päivitetyt HTML:t)
3. Bug-scan 38/38 PASS
4. Mobile-audit 26/26 PASS (favicon-muutos ei saa rikkoa)
5. **Playwright-spec uusi tai laajennus:** `tests/e2e-brand.spec.js` (luo jos ei ole)
   - Assertaa että `<link rel="icon">` resolvoituu 200:lla, ei 404
   - Assertaa että `og:image` / Twitter-card viittaa uuteen brand-imageen (jos koskettu)
   - Assertaa että `#brand-mark` / vastaava app-shell-elementti renderöi `puheo`-tekstin (lowercase)
6. Commit: `feat(brand): new wordmark + favicon system + kurssi_X copy fix (L-V317-BRAND-MARK-1, v310)`
7. `git push origin main` → Vercel auto-promote
8. IMPROVEMENTS.md-rivi: ennen/jälkeen-screenshot (commit ne myös `docs/briefs/L-V317-brand-before-after.png`)

---

## Out-of-scope (älä laita tähän looppiin)

- **Language-mutating wordmark** (diakriittinen muutos per kieli, Expansionistin idea) — ship V2:na L-V318:ssa jos lukio-pilot menee hyvin
- **Countdown-favicon** (YO-päiviin) — sama V2-luokitus
- **Marketing-collateral** (social-cards, hero-banners) — eri loop kun pilot-content lähetetään
- **Logotype-redesign jos Marcel ei tykkää lopputuloksesta** — palaa sceptic-questioniin "should we hire designer for 150-300 € Fiverr". Älä iteroi yli 2 kierrosta tällä loopilla.

---

## Acceptance L-V317:lle

1. Wordmark renderöityy `app.html`-headerissa, `index.html`-hub-sivulla, `public/landing/*` kaikissa kolmessa kielessä — lowercase "puheo", brick-on-cream
2. Favicon näkyy 16px-tabissa kaikilla 3 modernilla selaimella (Chrome/Firefox/Safari) — ei näytä AI-tehdyltä rinnakkaisvertailussa
3. `kurssi_1` UI-näkymästä korvattu "Kurssi 1" -tyyliseen muotoiluun, data-key-arvoja ei kosketu
4. Bug-scan 38/38 + audit 26/26 + uusi brand-spec PASS
5. SW v310 bumpattu + STATIC_ASSETS päivitetty
6. IMPROVEMENTS.md-rivi sisältää ennen/jälkeen-screenshotin
7. PWA-asennus toimii edelleen (manifest.json validi)

---

## Skill-stack (lataa Skill-toolilla ENNEN koodi-muutoksia)

FRONTEND: `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`

TESTING: `webapp-testing`, `superpowers:test-driven-development`, `superpowers:verification-before-completion`

Mukana suositus: `frontend-design` ja `emil-design-eng` ovat tärkeimmät tälle loopille — käytä niitä ohjaamaan SVG-typografian päätökset (letter-spacing, weight, ornamental gesture). `impeccable` validoi lopputuloksen.

---

## Päätös rekap (vahvistettu Marcelin kanssa councilin jälkeen)

- Paletti: brick + cream Old-Spain, multi-lang-perusteltu (ES rojo / DE rot / FR rouge)
- Tyyppi: lowercase "puheo" wordmark, ei symbol-markia
- Typografia: General Sans (jo stackissa) Medium tai Semibold
- Ornamental gesture: yksi, valitse Vaihe 1:ssä
- Slop-gate: 16px-favicon-vertailu Vercel/Linear/Stripe/Otava/Wilma rinnalla
- Budget: 0 € extra. Hand-SVG + free favicongenerator. Brandkit-skilliä vain app-icon-texture-tarpeeseen jos sellainen ilmenee.

Marcel ei ole tekemässä logoa itse. Writer-terminaalin pitää shipata 4 tunnin sisällä joko hyvä lopputulos tai degradoitu wordmark-only-versio (ilman ornamental gesturea) — ei loputon iteraatiosykli.
