# BRIEF: L-V325 — Favicon-glyfin luettavuus 16/32 px:ssä

**Päivä:** 2026-05-27
**Triggeri:** Marcel huomasi 2026-05-27 että selaintabin favicon näyttää solidilta brick-neliöltä — sisällä oleva cream "p" katoaa 16 px -koossa eikä lue lyhytkin glance:lla.
**Status:** Pieni fokusoitu brand-fix. ~30-45 min writer-työ.
**Edeltävä konteksti:** L-V317 (favicon-system), L-V318 (wordmark-proper), L-V318b (wordmark+sigili lockup lukittu council 5/5:llä — sigili = brick-neliö + cream "p", ei muuteta brand-systeemiä, vain glyfin geometriaa).

---

## Aito ongelma

`public/brand/favicon-master.svg`:

```svg
<svg viewBox="0 0 56 56">
  <rect width="56" height="56" rx="8" fill="#A0341F"/>
  <text x="28" y="42" font-family="Inter, …" font-weight="700"
        font-size="42" letter-spacing="-1.0" fill="#F5EDE0"
        text-anchor="middle">p</text>
</svg>
```

42 px Inter-700 "p" 56 px viewBox:ssa → glyfi vie ~55% pintaa. Kun selain skaalaa tämän 16 px favicon:ksi, "p":n bowl on ~3 px ja descender ~2 px. Tab-stripissä Vercel/Linear/Stripe/Otava-kontekstissa lukee solidi brick-blob, ei "p". Sigili ei tee tehtäväänsä (= olla tunnistettava brand-mark).

Vertailutestaus L-V318:n `docs/briefs/L-V318-slop-gate-comparison.png` tuotti screenshot:n joka olisi pitänyt paljastaa tämä — käyttäjä-feedback antoi sen vasta nyt.

**Ei muuteta brand-systeemiä.** L-V318b-päätös pitää: wordmark = horisontaali, sigili = neliö. Tämä loop optimoi vain sigilin **luettavuuden 16/32/48 px:ssä**.

---

## Mitä writer tekee

### Step 1: Mittaa nykytila

Käytä olemassa olevaa `scripts/slop-gate-screenshot.mjs`-skriptiä tai vastaavaa Playwright-pohjaista renderöintiä:

```bash
node scripts/render-wordmark-preview.mjs   # tarkista mitä olemassa olevat skriptit tekevät
# tai aja oma kevyt skripti joka:
# - lataa public/favicon/favicon-{16,32,48}.png
# - asettaa 5 vierekkäin: Puheo + 4 referenssifavicon (Vercel/Linear/Stripe/Otava) 100% zoomilla
# - tallenna screenshots/brand/favicon-legibility-before.png
```

Jos vastaava preview-skripti puuttuu, kirjoita yksi tämän loopin osana (`scripts/screenshot-favicon-strip.mjs`).

### Step 2: Generoi 3 fix-varianttia (älä päätä etukäteen, vertaa silmin)

Kaikki variantit muokkaavat `public/brand/favicon-master.svg`:tä. Älä muuta brick-väriä `#A0341F` eikä cream-väriä `#F5EDE0` (brand-token-lock).

**Variantti A — Isompi glyfi:**
- `font-size="52"` (oli 42) + säädä `y` jotta keskittyy
- `letter-spacing="-2.0"` tiukempi
- Riski: descender leikkautuu reunaan jos liian iso

**Variantti B — Outline-path Inter-700:stä:**
- Käytä `scripts/generate-wordmark.py`:n logiikkaa (fontTools + `fonts/inter-latin-700-normal.woff2`), extractoi pelkkä "p"-glyfin path, sijoita keskelle 56 px viewBox:ia, skaalaa ~75% korkeuteen
- Etu: kontrolloitu geometria, ei riipu selaimen Inter-rendering:istä
- Riski: fontTools-bugi joka L-V318c→V318e:ssä paljasti — pakota `fill-rule="evenodd"`, testaa että counter (bowl) renderöityy ilman täplää

**Variantti C — Käännetty polariteetti:**
- Cream tausta `#F5EDE0`, brick "p" `#A0341F`
- Hypoteesi: cream-on-brick crushaa subpixel:eissä; brick-on-cream luetaan paremmin koska silmä erottaa tumma-vaalealla helpommin pienikokoiset stroke:t
- Riski: erottuu vähemmän tab-stripissä koska useimmilla saiteilla on tumma favicon vaalean tabin päällä

Tee kaikki 3 + nykytila yhteen `screenshots/brand/favicon-legibility-compare.png` -strippiin 16/32/48 px sarakkeilla. Catch-pisteet rinnakkain referenssifavicon:eihin.

### Step 3: Marcel valitsee variantin

Kirjoita strippi `screenshots/brand/favicon-legibility-compare.png`:hin ja kommentti briefin loppuun:

```
### Päätös 2026-05-27
Variantti X valittu, koska <yhden virkkeen perustelu>.
```

**Älä committaa muutoksia ennen Marcelin OK:ta.** Tämä on brand-päätös, ei tekninen fix.

### Step 4: Toteuta valittu variantti

1. Päivitä `public/brand/favicon-master.svg` (yksi `<rect>` + yksi `<text>` tai `<path>`)
2. Aja `node scripts/generate-favicons.mjs` — tämä regeneroi:
   - `public/favicon/{favicon-16,32,48,apple-touch-icon,icon-192,icon-512}.png`
   - Root-level `favicon-32.png`, `icon-192.png`, `icon-512.png` (jos skripti tekee sen — tarkista)
3. Älä koske `public/brand/{logo,logo-mono,logo-dark}.svg`-wordmark:eihin (eri asset, eri kategoria)
4. Bumppaa `sw.js` CACHE_VERSION (esim. v319 → v320) ja varmista että favicon-PNG:t ovat `STATIC_ASSETS`-listalla (luultavasti ovat L-V317:stä)

### Step 5: Verify

```bash
npx playwright test tests/e2e-brand.spec.js   # 8/8 PASS — favicon-linkit resolvoituvat
npm run test:bug-scan                          # 38/38 PASS — ei regressioita
```

Lisäksi: renderöi `screenshots/brand/favicon-legibility-after.png` samalla skriptillä kuin Step 1, varmista että "p" lukee 16 px:ssä.

### Step 6: Päivitä IMPROVEMENTS.md

Yksi rivi briefiin (ledger-formaatissa, ks. aiemmat L-V31x-rivit referenssinä):

```
- **[2026-05-27 L-V325-FAVICON-LEGIBILITY] Favicon-glyfin luettavuus 16 px:ssä.** <variantti + syy>. <verify-tulos>. SW v319 → v320. Skills: …
```

---

## Acceptance criteria

1. `screenshots/brand/favicon-legibility-after.png`: "p" lukee selvästi 16 px tab-strip-kontekstissa (Marcel hyväksyy silmämääräisesti)
2. `tests/e2e-brand.spec.js` 8/8 PASS
3. `npm run test:bug-scan` 38/38 PASS
4. `public/brand/favicon-master.svg` säilyy alle 4 KB
5. Brand-väripaletti muuttumaton (#A0341F + #F5EDE0; ei uusia värejä)
6. SW CACHE_VERSION bumpattu, favicon-PNG:t cache-listalla

---

## Out-of-scope

- **Wordmark:n muuttaminen** — L-V318b lockup pitää (wordmark = horisontaali, ei muuteta tässä loopissa)
- **Logo-muunnokset** (`logo.svg`, `logo-mono.svg`, `logo-dark.svg`) — eri assetti, eri käyttö
- **OG-image / social-card** — eri loop jos halutaan
- **Animated favicon** — ei
- **Multi-variant favicon** (esim. dark-mode media-query) — yhden masterin pitää toimia kaikkialla

---

## Skill-stack writerille

FRONTEND-S (SVG-geometrian muokkaus = yhden file:n attribuuttimuutos):
- `frontend-design`

TESTING-S (regression + screenshot-vertailu):
- `webapp-testing`
- `superpowers:verification-before-completion`

Jos variantti B (Python+fontTools outline-extraction) valitaan, lisää:
- `superpowers:systematic-debugging` (V318e:n opit fontTools-bugeista — kirjoittajan pitää muistaa että fill-rule="evenodd" + counter-renderöinti-validointi)

Total: 3-4 skilliä.

---

## Päätös-rekap

L-V317:ssä ja L-V318:ssa shipattiin oikea brand-systeemi (wordmark + sigili) mutta sigilin glyfi-koko 56 px viewBox:ssa ei kestä 16 px favicon-pakkaamista. Yhden SVG-attribuutin (`font-size` tai outline-path-vaihto) + 5 PNG-regenin korjaus. Ei brand-redesign, ei wordmark-koskettelu.

Realistinen scope: 30-45 min kun varianttivertailu on tehty.

---

### Päätös 2026-05-27

**Variantti A valittu.** Sama embedded-Inter + `<text>`-mekanismi kuin nykyinen master, vain font-size 42 → 52 + letter-spacing -2.0. Pienin riski (ei pipeline-vaihtoa), paras 16 px legibility. C hylättiin koska polariteetti-flip menettää brick-neliön brand-identiteetin sigilinä; B hylättiin koska fontTools-counter-bugien historia (L-V318e) ja A saavutti saman luettavuuden ilman uutta pipelinea.

Master ja PNG:t shipattu, SW v320 → v321, e2e+bug-scan PASS. Ledger-rivi IMPROVEMENTS.md:ssä.
