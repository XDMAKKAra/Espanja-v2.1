# BRIEF: L-V318 — Wordmark proper (path-pohjainen, ei `<text>`-elementtiä)

**Päivä:** 2026-05-26
**Edellinen:** L-V317-BRAND-MARK-1 (commit `61fff5b`, shipped 2026-05-25). Toteutus rikkoi 3 hard-constraintia, käyttäjä huomasi 2026-05-26: "ku joku oi sottanu jonku fonti ja kirjottanu puheo ja laittanu jonku pisteen päi vittuu"
**Tausta:** L-V317-brief (`docs/briefs/2026-05-25-L-V317-wordmark-favicon-system.md`) lukitsi 6 constraintia councilin 5/5-konvergenssin pohjalta. Writer toteutti niistä 3 väärin. Tämä brief korjaa toteutuksen, ei strategiaa — strategia on vahvistettu (lue L-V317 ennen toimintaa).
**Vault-decision-record:** `Vault obisidian/Marcel/Puheo/decisions/2026-05-25-logo-wordmark.md` (sisältää koko päätöshistorian + rikkomus-analyysin)

---

## Mitä L-V317 rikkoi (älä toista)

Avaa `public/brand/logo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 156 64" role="img" aria-label="Puheo">
  <title>Puheo</title>
  <text x="2" y="48"
        font-family="Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-weight="600"
        font-size="48"
        letter-spacing="-0.96"
        fill="#A0341F">puheo</text>
  <rect x="140" y="40" width="8" height="8" rx="1" fill="#A0341F"/>
</svg>
```

**3 rikottua constraintia:**

1. **Fontti:** Brief vaati `General Sans` (V302 typography-stack). Toteutus käytti `Inter, system-ui, Segoe UI`. → Inter ei lataudu SVG-renderöintihetkellä, Windows fallbackaa Segoe UI:hin, mac San Franciscoon → wordmark näyttää eri joka koneella.
2. **Renderöinti:** Brief vaati `<text>`-elementin **kääntämistä outline-pathiksi** ennen shipiä jotta logo renderöityy oikein vaikka fontti ei ole ladattu (Slack-preview, sähköposti-asiakas, social-card). Toteutus jätti `<text>`-elementin runtime-renderöinniksi.
3. **Ornamental gesture:** Brief vaati pisteen integrointia o-kirjaimen geometriaan (concept A: "dot of 'o' replaced with a 4-px brick-red square offset 1px to upper-right"). Toteutus laittoi `<rect x="140" y="40">` hardcoded-koordinaateilla — `x=140` ei seuraa o:n todellista oikeaa reunaa eri fonteilla → piste lipuu paikalleen vain Segoe UI Semibold 48px:ssä Windowsissa.

**Lisäksi:** L-V317-vaihe 5 (slop-gate: 16px-favicon-vertailu Vercel/Linear/Stripe/Otava/Wilma rinnalla) ohitettiin. Tämä on pakollinen tässä loopissa.

---

## Strategia: B-toteutus suositeltu, A-toteutus fallback

### B-strategia (suositus): käytä oikeaa fonttia, käännä outline-pathiksi externally

Tämä on toistettavissa, tarkka, ja eliminoi "freehand bezier"-arvailun.

**Toolit:**

```bash
# Vaihtoehto 1: Python + fontTools (todennäköisesti jo asennettu)
pip install fonttools
# Lataa General Sans (free, https://www.fontshare.com/fonts/general-sans) tai Inter Display
# Aja convert-script joka extractoi glyfit "p", "u", "h", "e", "o" → SVG path d:t

# Vaihtoehto 2: nodejs npm-paketti
npx text-to-svg-cli "puheo" --font ./fonts/GeneralSans-Semibold.otf --fontSize 48
```

**Yksinkertaisin reitti:** käytä [https://danmarshall.github.io/google-font-to-svg-path/](https://danmarshall.github.io/google-font-to-svg-path/) online-toolia. Lataa fontti, kirjoita "puheo", kopioi `path d="..."` -attribute. Sitten muokkaa SVG manuaalisesti lisäämään ornamental gesture (o-pisteen square joka korvaa o-kirjaimen sisäpisteen geometrian).

**Lopullinen SVG-rakenne (B-strategia):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 [todellinen-width-mitatusta-fontista] 64" role="img" aria-label="Puheo">
  <title>Puheo</title>
  <!-- "p", "u", "h", "e" -kirjaimet outline-path:eina -->
  <path d="M... " fill="#A0341F"/>
  <!-- "o"-kirjaimen ulkokehä (ei sisäaukkoa) outline-pathina -->
  <path d="M... " fill="#A0341F"/>
  <!-- Ornamental gesture: 4 px square o-kirjaimen geometrisessä keskuksessa, offset 1px upper-right -->
  <rect x="[o:n-keskipiste-x - 2 + 1]" y="[o:n-keskipiste-y - 2 - 1]" width="4" height="4" rx="0.5" fill="#A0341F"/>
</svg>
```

**Tärkeää:**
- ViewBox-leveys lasketaan **fontin todellisesta wordmark-leveydestä** (mittaa convert-toolin output)
- O-kirjaimen sisäaukko (counter) **poistetaan** — sen tilalle tulee neliö. Tämä on koko gesture-pointti.
- Neliön sijainti **lasketaan o-glyfin path-koordinaateista**, ei silmämäärin. Käytä Bbox-laskelmaa: `(o.x + o.width / 2 - 2 + 1, o.y + o.height / 2 - 2 - 1, 4, 4)`.

### A-strategia (fallback): hand-coded Bezier path

Vain jos B-toolit eivät ole saatavilla **ja** brand-budgetti ei salli Fiverr-designeria. Tämä vaatii että writer kirjoittaa Bezier-curves jokaiselle p-u-h-e-o-kirjaimelle käsin viitaten General Sans -näytteeseen. **Älä yritä jos et ole tehnyt tätä ennen** — se kestää 3-5x kauemmin kuin B ja lopputulos on usein huonompi.

### C-strategia (lopullinen fallback): Fiverr-designer 150-300 €

Vain jos B ja A epäonnistuvat 4 tunnin sisällä. Marcelin pitää eksplisiittisesti hyväksyä Fiverr-tilaus ennen tilausta.

---

## Hard constraints (L-V317:stä periytyvät, älä riko)

1. **WORDMARK-ONLY.** Ei symbol-markia. Ei aurinkoa, kirjaa, lintua, puhekuplaa, laurelia.
2. **HAND-CODED / GENERATED OUTLINE-PATH SVG.** Ei `<text>`-elementtiä. Ei runtime-fonttiriippuvuutta. Logo renderöityy identtisesti joka selaimella JA paikoissa joissa fontti EI lataudu (Slack-preview, sähköposti-asiakas, social-card, screenshot-thumbnail).
3. **General Sans Medium (500) tai Semibold (600).** Free-fontti, jo V302-typography-stackissa. Lataa Fontsharesta jos paikallista ei ole.
4. **Lowercase `puheo`.**
5. **Yksi ornamental gesture:** o-pisteen tilalla 4 px brick-red square, offset 1px upper-right o-glyfin geometrisestä keskuksesta. **Lasketaan glyf-koordinaateista, ei silmämäärin.**
6. **Värit:**
   ```css
   --brand-brick: #A0341F;   /* primary, multi-lang-defended */
   --brand-cream: #F5EDE0;
   --brand-ink: #2A1F1A;
   --brand-brick-dark: #8B3329;
   ```
   Käytä `var(--brand-brick)` jos CSS-konteksti, muuten suora hex.
7. **SVG alle 4 KB minifoituna.** Path-pohjaiset wordmarkit ovat tyypillisesti 1.5–3 KB.
8. **Ei `<filter>`, ei `<defs>` gradienteilla, ei glow-efektejä.** (Anti-AI-slop.)
9. **Slop-gate ennen committia** (L-V317 §5): avaa 16px-favicon Vercel/Linear/Stripe/Otava/Wilma -rinnalla. Jos näyttää AI-startup-templateltä → degradoi pelkkään path-wordmarkkiin ilman ornamental gesturea, älä iteroi yli 2 kierrosta.

---

## Tiedostot

Korvaa kaikki kolme:

- `public/brand/logo.svg` — brick on cream (primary)
- `public/brand/logo-mono.svg` — yksiväri ink on cream (printti, single-color)
- `public/brand/logo-dark.svg` — cream on ink (dark-mode)
- `public/brand/favicon-master.svg` — vain pieni "p"-kirjain + ornamental gesture (jos toimii 16px:ssä) TAI yksinkertaistettu vain "p" ilman gesturea

**Favicon-renderöinti:** Aja olemassa oleva `scripts/generate-favicons.mjs` (commit `61fff5b` lisäsi sen). Skripti generoi 16/32/48/180/192/512 PNG:t favicon-master.svg:stä. **Bumppaa SW v310 → v311** + päivitä STATIC_ASSETS jos uusia tiedostoja.

---

## Acceptance criteria

1. **`grep "<text" public/brand/*.svg` palauttaa 0 osumaa.** Tämä on automaattinen gate — jos `<text>` löytyy, brief on rikottu.
2. **`grep "font-family" public/brand/*.svg` palauttaa 0 osumaa.** Sama gate.
3. Wordmark renderöityy identtisesti Chrome/Firefox/Safari:ssa (uudet screenshotit `screenshots/brand/`-kansioon).
4. Wordmark renderöityy identtisesti **ilman lataannutta fonttia** — testaa avaamalla SVG suoraan selaimessa (file:// ilman fontti-cachea).
5. Favicon 16px:ssä erottuu Vercel-tabin vieressä (vertaa screenshotilla, commit `docs/briefs/L-V318-favicon-comparison.png`).
6. Bug-scan 38/38 PASS + brand-spec PASS.
7. SW v310 → v311 + STATIC_ASSETS päivitetty kaikilla uusilla SVG/PNG-tiedostoilla.
8. Vault-päätöstiedosto päivitetty: `Vault obisidian/Marcel/Puheo/decisions/2026-05-25-logo-wordmark.md` `status: open` → `status: decided`, `updated: 2026-05-26`, lisää §"L-V318 toteutus" -osio jossa kuvataan käytetty fontti (General Sans vs muu), toolchain (online-converter vs Python fontTools), ja path-d:n alkupätkä.
9. **Slop-gate-screenshot committed:** `docs/briefs/L-V318-slop-gate-comparison.png` joka näyttää favicon 16px:nä rinnakkain Vercel/Linear/Stripe/Otava-faviconien kanssa.

---

## Verify-komennot (aja kaikki ennen committia)

```bash
# 1. Hard-gate: ei runtime-fontti-riippuvuutta
grep -l "<text\|font-family" public/brand/*.svg && echo "FAIL: runtime font dependency" || echo "PASS: outline-only"

# 2. Tiedostokoot
ls -la public/brand/*.svg
# Expected: kaikki < 4 KB

# 3. Bug-scan
npm run test:bug-scan
# Expected: 38/38 PASS

# 4. Brand-spec
npx playwright test tests/e2e-brand.spec.js
# Expected: 8/8 PASS

# 5. Build + SW-bump
npm run build
grep "CACHE_VERSION = 'v311'" sw.js
# Expected: v311 löytyy
```

---

## Out-of-scope (ei tähän looppiin)

- **Language-mutating wordmark** (diakriittinen per kieli) → L-V319 jos pilot menee hyvin
- **Countdown-favicon** (YO-päiviin) → L-V319
- **Marketing-collateral** (social-cards) → eri loop
- **Logotyypin redesign** jos lopputulos ei miellytä → palaa L-V317-päätöstiedostoon ja harkitse Fiverr (C-strategia). Älä iteroi yli 2 kierrosta tällä loopilla.
- **App-shell-header-logo** sijoittelumuutokset → eri scope
- **Wordmark animoituna** (hover, intro) → V2

---

## Skill-stack (lataa Skill-toolilla ENNEN koodi-muutoksia)

FRONTEND-M (yksi komponentti, ei landing-redesign):
- `frontend-design`
- `design-taste-frontend`
- `ui-ux-pro-max`

TESTING-S (olemassa olevan brand-spec laajennus):
- `webapp-testing`

Bonus:
- `emil-design-eng` — käytä validoimaan ornamental gesture (1 yksi puolustettava detail)
- `superpowers:verification-before-completion` — gate ennen committia
- `obsidian-second-brain` — päätöstiedoston päivitys vault:iin (acceptance §8)

---

## Päätös-rekap (L-V317:stä periytyvät, ei muutosta)

- Paletti: brick (#A0341F) + cream Old-Spain
- Tyyppi: lowercase "puheo" wordmark, ei symbolia
- Typografia: General Sans Medium tai Semibold, **käännetty outline-pathiksi**
- Ornamental gesture: o-pisteen tilalla 4 px brick-red square, offset 1px upper-right, laskettu glyf-koordinaateista
- Slop-gate: pakollinen, screenshot commit-aineiston mukaan
- Budget: 0 € extra (B-strategia), 150-300 € jos Fiverr-fallback aktivoituu (C-strategia, vain Marcelin luvalla)

**Writerin pitää shippata 4 tunnin sisällä joko (a) hyvä B-strategian lopputulos, (b) degradoitu wordmark-only ilman ornamental gesturea, tai (c) raportoida käyttäjälle että B/A epäonnistuivat ja Fiverr-päätös tarvitaan. Ei loputon iteraatiosykli.**
