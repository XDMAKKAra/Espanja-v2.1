# L-V358 — Kielisivut kompakteiksi infosivuiksi (es/de/fr)

**Päivä:** 2026-06-02
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`, `webapp-testing`, `superpowers:verification-before-completion`
**Lähtökohta:** `public/landing/espanja.html`, `saksa.html`, `ranska.html`. L-V356 toi ne WordDive-brändiin mutta jaetulla editorial-stackilla → ne ovat yhä **hero-kopioita** index.html:stä, vain kieli vaihdettu. Reitit `/espanjan-abikurssi` jne. (vercel.json) ovat jo olemassa.

---

## Ongelma

Kielisivut ovat tällä hetkellä käytännössä index.html:n hero pienin tekstivariaatioin. Niissä ei ole konkreettista tietoa juuri sen kielen kurssista — abikurssille laskeutuva opiskelija ei saa syytä jäädä. SEO-mielessä ne kilpailevat omasta pääsivustamme kanssa ilman erottuvaa sisältöä.

## Tavoite

Tee kustakin kielisivusta **kompakti, itsenäinen infosivu** — EI pitkää landing-skrollia monella isolla komponentilla. Sama runko joka kielelle, vain sisältö kielikohtainen. Tavoitepituus: mahtuu muutamaan ruutuun, ei loputon scroll.

## Pakolliset osiot (tässä järjestyksessä, kompaktisti)

1. **Hero (tiivis)** — kielikohtainen H1 ("Espanjan abikurssi YO-koetta varten" jne., säilytä L-V356:n SEO-otsikot/meta/JSON-LD) + 1 lause mitä sivu tarjoaa + yksi CTA ("Aloita" → esivalitsee tämän kielen onboardingiin, käytä olemassa olevaa `js/landing-lang-cta.js` + `puheo:lang`-localStorage-mekaniikkaa). Ei toista hero-koristelua koko index-hero-mitassa.
2. **Konkreettinen kurssitieto** — mitä TÄMÄN kielen abikurssi sisältää: montako kurssia/tasoa (data: `LANG_CURRICULA`, YTL-arvosanat I/A/B/C/M/E/L EI CEFR), mitä taitoja (sanasto, kielioppi, luetunymmärtäminen, kirjoitelma), miten arviointi toimii (pistehaarukka + perustelu, L-V354-malli — EI "sama tarkkuus" -väitettä). Faktat datasta, ei keksittyjä lukuja.
3. **Demo / näyte apista** — yksi visuaali joka näyttää appin oikeasti. Ota oikea screenshot appista Playwrightilla (esim. tehtäväruutu tai kartoituksen palaute) ja upota; ÄLÄ käytä lorem/placeholderia. Jos sopivaa screenshotia ei saa renderöityä, käytä yhtä olemassa olevaa app-kuvitusta — mutta ensisijaisesti oikea kuva.
4. **Miksi valita meidät** — lyhyt, kielikohtaisesti relevantti. EI 3-4 identtistä korttia rivissä (AI-slop). 2-3 konkreettista erottuvaa pointtia proosana tai eri muotoisina elementteinä. Ei "nopea, helppo, tehokas" -tyhjyyttä.
5. **Kirjoitelma-esimerkki** — yksi kompakti näyte: lyhyt opiskelijan kirjoitelma tällä kielellä + appin antama pistehaarukka + perustelu (L-V354-malli). Pidä tiiviinä, ei koko arviointinäkymää.

Voit jättää pois index-heron muut osiot (katalogi, proof, FAQ kokonaisuudessaan) — kielisivu ei ole koko landing.

## Constraintit

- **EI pitkää skrollia / montaa isoa komponenttia.** Jos sivu alkaa näyttää koko landingilta, olet epäonnistunut.
- Sama rakenne kaikilla kolmella kielellä; vain sisältö (kurssitiedot, esimerkki, kuva) kielikohtainen.
- Säilytä L-V356:n SEO: canonical, OG/Twitter, JSON-LD (Course + SoftwareApplication + Organization), abikurssi-keyword-painotus, ristilinkit muihin kieliin.
- Brändi: cream/brick, Fredoka+Mulish, tasaiset värit. EI italic-Fraunces, EI gradient-text, EI identtistä korttiruudukkoa, EI mono-UPPERCASE-eyebrowtä, EI em-dashia, EI keksittyjä %-lukuja tai lukio-nimiä.
- Kaikki näkyvä suomi-teksti `humanizer`-skillin läpi ennen committia.
- Vanhat `/X-yo-koe`-URLit pysyvät elossa (ei 301), kuten L-V356:ssa.

## Acceptance criteria

- Kukin sivu (es/de/fr) sisältää 5 osiota yllä; mitattu sivukorkeus selvästi lyhyempi kuin index.html (kompakti, ei koko landing).
- Demo-osio näyttää oikean app-kuvan, ei placeholderia.
- "Miksi valita meidät" EI ole 3-4 identtisen kortin ruudukko.
- CTA esivalitsee oikean kielen (`puheo:lang`) ja vie onboardingiin.
- 390px: ei vaakavieritystä; desktop OK.
- SEO-elementit (canonical/OG/JSON-LD) säilyvät, validoituvat.
- Ristilinkit muihin kahteen kieleen toimivat.

## Verify (writer tekee)

- Playwright 3 sivua × desktop + 390px: 5 osiota löytyy, ei vaakavieritystä, demo-kuva latautuu, CTA-kieli periytyy, ei konsolivirheitä, sivupituus < index.html.
- `npm run build`; bumppaa `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.
- vitest läpi (1329+).
- Pushaa mainiin.

## Avoinna writerille

- Dated `e2e-landing-pituus`/`mobile-audit`-specit voivat nojata vanhaan kielisivu-pituuteen → re-baseline jos punaista (L-V356 merkitsi tämän riskin jo).

## Skaala

Keskikokoinen-iso: 3 sivua, jaettu runko. Älä koske index.html:ään (paitsi ristilinkit jos puuttuvat) — tämä on vain kielisivut.
