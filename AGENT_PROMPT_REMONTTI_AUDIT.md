# REMONTTI — Step 1: oikea käyttäjä-audit

> **Tämä ei ole META_QA_LOOP-item. Ei worker A/B/C/D. Yksi agentti, yksi tehtävä: kävele appi läpi oikeana käyttäjänä Playwrightilla, kirjaa kaikki mitä on rikki, hämmentävää tai rumaa. ÄLÄ KORJAA MITÄÄN. Vain etsi.** MUISTA KYJEA AGEBT STANDARS
>
> Käyttäjä on turhautunut. Testit passaavat ja silti appi on täynnä bugeja, koska testit etsivät merkkijonoja (`[object Object]`, `NaN%`), eivät kysy "lupasiko näyttö X:n ja toteutuiko se". Tämä audit-vaihe korjaa juuri sen aukon.

---

## Mitä teet

Ajat Playwrightilla **käyttäjäpolut** (ei pelkkiä page-load-skannauksia). Jokainen polku on:
1. Reset-state (storage clean + gate ohitus `puheo_gate_ok_v1=1` via `addInitScript`)
2. Suoritetaan polku alusta loppuun kuten oikea käyttäjä
3. **Verrataan: mitä näyttö lupasi vs mitä tapahtui**
4. Otetaan screenshot joka avainvaiheessa (mobile 390×844 + desktop 1440×900)
5. Kirjataan jokainen poikkeama, hämmennys tai rikki menevä asia REMONTTI_AUDIT.md:hen

---

## Polut joita pakollisesti testataan

Lista ei ole tyhjentävä — jos huomaat matkalla jotain muuta rikki, kirjaa se myös.

### Polku A — Onboarding + tasotesti + kurssi-routing
**Käyttäjän kertoma bugi:** "Tasotesti sanoi 'aloita kurssi 3', mutta heitti kurssi 1:een. Onboarding tuntuu turhalta. 8-tehtävän monivalinta ei oikeasti määritä tasoa."

Testaa **kolme rinnakkaista skenaariota:**
- **Aloittelija:** vastaa 8/8 tehtävää väärin → mihin kurssiin landed? Vastaako näytön suositus?
- **Keskitaso:** vastaa ~5/8 oikein (sekoita helpot oikein, vaikeat väärin) → suositus vs landing?
- **Edistynyt:** vastaa 8/8 oikein → suositus vs landing?

Jokaisessa: lue tasotestin lopussa näytön teksti ("Suosittelemme kurssia X" tms.), pura siitä numero, navigoi seuraavalle näytölle, lue mihin kurssiin oikeasti päädyit. **Match tai mismatch — kirjaa kumpi.**

Bonus: Onko 8 kysymystä riittävä signaali? Onko vaikeustasoissa eroa? Erottelevatko ne aloittelijaa edistyneestä? (Jos kaikki kysymykset ovat samaa tasoa, kirjaa pedagoginen bugi.)

### Polku B — Sanasto-tehtäväkortin maskautuminen
**Käyttäjän kertoma bugi:** "Tehtävissä ei näy kokonaan tekstiä vaan se maskiutuu yläbaarin päälle."

- Navigoi: kirjautuminen → Oppimispolku → ensimmäinen sanasto-tehtävä
- Scrollaa hitaasti ylhäältä alas
- Ota screenshot 3 kohdassa: alku, keskellä scrolla, lopussa
- Mobile (390×844) **JA** desktop (1440×900)
- Tarkista: peittääkö top-bar / sidebar / mikään sticky-elementti tehtäväkortin tekstin missä tahansa scroll-positiossa?
- Tarkista myös: Puheoppi, Verbisprintti, Luetun ymmärtäminen, Kirjoittaminen — sama tarkistus

### Polku C — Pricing-sivu
**Käyttäjän kertoma bugi:** "Pricement section näyttää tyhmältä."

- Avaa pricing-sivu mobiililla ja desktopilla
- Screenshot kummallakin
- Kirjaa konkreettisesti: mikä on tyhmää? (Esim. korttien korkeus eri, hinnat valuvat, CTA ei kontrasti, "suosituin"-merkki keskeneräinen, paddingit epätasaiset, paywall-CTA ei riimittele Settings-tieriin)
- ÄLÄ keksi mielipiteitä — kirjaa vain konkreettiset visuaaliset ongelmat (mittasuhde, kontrasti, alignment, overflow, responsive-katkos)

### Polku D — Re-routing-luupit
**Käyttäjän kertoma bugi:** "Turhia re-routing-juttuja."

- Kirjaudu, klikkaa jokaista nav-itemiä järjestyksessä, palaa edelliseen
- Painele selaimen back-painiketta — palautuuko järkevästi vai hyppääkö johonkin oudoon näyttöön?
- Kokeile syvälinkkejä (esim. menee suoraan `/app#vocab` ilman aiempia askelia) — toimiiko vai re-routaako onboardingiin vaikka ei pitäisi?
- Logout → kirjaudu sisään → mihin landed?
- Kirjaa jokainen "tämä ei käyttäydy odotetusti" -tapaus

### Polku E — Asetukset + tier-vaihto + Customer Portal CTA
- Free-käyttäjä: näkyykö paywall oikein? Mihin "Päivitä Pro" -CTA vie?
- Pro-test-tili (`TEST_PRO_EMAILS`): näkyykö Customer Portal -linkki? Toimiiko se?
- Kielen vaihto Settings:ssä → vaihtuuko UI/sisältö oikeasti, vai jäikö johonkin tilaan jumiin?

### Polku F — Landing-sivut (kaikki 3: es/fr/de)
- Avaa `/espanja-yo-koe`, `/saksan-yo-koe`, `/ranskan-yo-koe`
- Mobile + desktop screenshot
- Kirjaa: hero-CTA toimiiko, layout-katkokset, fontin koko, kontrasti, sisäiset linkit, footer
- **Tarkista erityisesti countdown-sijoitus** — ks. esi-syötetty löydös F-01 alla, vahvista että vika toistuu kaikilla 3 kielellä ja molemmilla viewporteilla

### Polku G — Yleinen "klikkaa kaikki" -kierros
- Joka näytössä: klikkaa joka näkyvää painiketta, linkkiä, ikonia, badge:a
- Tarkista console: errorit, warningit, 404:t verkossa
- Tarkista: jääkö joku painike "loading"-tilaan, näkyykö skeleton-loaderi ikuisesti, jäätyykö joku modaali

---

## Mitä KIRJAAT

Luo `REMONTTI_AUDIT.md` repo-juureen. Rakenne:

```markdown
# Remontti-audit — käyttäjäpolku-pohjainen bug-lista

**Päivämäärä:** 2026-05-13
**Tekijä:** audit-agentti
**Testimoodi:** Playwright headed, Chromium + WebKit, mobile + desktop

## Yhteenveto
- P0 (rikki, estää käytön): N kpl
- P1 (hämmentää, väärä signaali): N kpl
- P2 (ruma, häiritsee): N kpl
- Yhteensä: N kpl
- Top-3 vakavinta löydös: ...

## Polku A — Onboarding + tasotesti
### A-01 [P0] Tasotestin suositus ≠ landing-kurssi (aloittelija-skenaario)
**Polku:** Onboarding → 8 monivalintaa, kaikki väärin → ruutu sanoi "Suosittelemme kurssia 1" → klikkaa "Aloita" → landed kurssille 3
**Lupasi:** kurssi 1
**Toteutui:** kurssi 3
**Screenshot:** screenshots/audit/A-01-recommendation.png + A-01-landing.png
**Toistettavuus:** 3/3 ajossa
**Arvio:** routing-bugi onboardingin signup-flowissa, todennäköisesti hardcoded fallback

### A-02 [P1] ...
```

**Jokainen löydös sisältää:**
- ID (A-01, B-01 jne.)
- Priority-arvio (P0/P1/P2) — *agentin parhaan kyvyn mukaan*; käyttäjä reviewaa ja muuttaa myöhemmin
- Polku jolla bugi tuli esiin (askel askeleelta)
- "Lupasi:" vs "Toteutui:"
- Screenshot-polut
- Toistettavuus (montako kertaa toistettiin, montako toistui)
- Lyhyt arvio mistä bugi voi johtua (1 lause, ei pakollinen)

**Älä ehdota fixiä. Tämä on löytö-vaihe, ei korjausvaihe.** Poikkeus: alla olevat **esi-syötetyt löydökset** käyttäjältä — ne sisällytetään auditin alkuun ja vahvistetaan / toistetaan testaamalla, mutta korjataan vasta fix-vaiheessa.

---

## Esi-syötetyt löydökset (käyttäjän jo havaitsemat — vahvista ja sisällytä)

### F-01 [P1] Countdown vie ensimmäisen fold:in, hero painuu alas
**Konteksti:** Loop 13 (L-HERO-COUNTDOWN-AND-OFFCANVAS-1) toteutti YO-countdownin omaksi 720px-leveäksi sectioniksi `<section class="hero">` -elementin yläpuolelle. Toteutus on visuaalisesti hieno mutta sijoitus on väärä:
- Countdown näkyy *ennen* heroa → kävijä näkee numerot ennen kuin tietää mikä Puheo on
- Heron CTA "Aloita ilmaiseksi" ja countdownin CTA "Aloita ilmaiseksi" ovat duplikaatit kahdessa peräkkäisessä näkymässä
- Hero ("Tehoa espanjan, saksan ja ranskan YO-kokeisiin") on scroll:n takana fold:in alapuolella

**Lupasi:** hero on landing-sivun päätähti (value-prop ensin)
**Toteutui:** countdown on päätähti, hero on toissijainen

**Vahvista auditissa:**
- Toistuuko kaikilla 3 landingilla (es/fr/de)?
- Mobile + desktop screenshot kummastakin, näytä että hero on scroll:n alapuolella
- Mittaa: kuinka monta pikseliä scrollata ennen kuin hero-H1 tulee näkyviin?

**Päätetty korjaussuunta (älä vielä tee — kuuluu fix-vaiheeseen):** Vaihtoehto B — countdown muuttuu *mikro-elementiksi* heron sisälle, eyebrow-rivin paikalle tai sen viereen. Esim. "PUHEO · YO-KOE 137 PÄIVÄÄ JÄLJELLÄ" yhtenä rivinä, pieni teksti, ei omaa sectionsia, ei omia CTA:ita. Hero pysyy päätähtenä. 720px-card poistuu.

---

## Tekninen toteutus

Luo `tests/remontti-audit.spec.js` (rinnalle `tests/e2e-bug-scan.spec.js`:n kanssa, ei korvaa sitä).

- Käytä `test.describe.parallel` tai sarja, sinun kutsusi — riippuu state-isolaation tarpeesta
- Screenshotit: `tests/screenshots/audit/<polku>-<vaihe>.png`
- Käytä `addInitScript`:ää asettamaan `puheo_gate_ok_v1=1` ennen `goto`:a (memory `feedback_playwright_gate.md`)
- Aja sekä Chromium että WebKit (`npx playwright install webkit` jo ajettu memoryn mukaan)
- **Älä faulttaa testiä jos bugi löytyy** — kirjaa se sen sijaan markdowniin. Tämän vaiheen tarkoitus ei ole CI-gate, vaan inventointi.
- Lopussa: agentti lukee oman spec-ajonsa tulokset + screenshotit + console-logit ja koostaa `REMONTTI_AUDIT.md`:n

---

## Mitä EI tehdä

- **Älä korjaa yhtäkään bugia.** Jos kiusaa, kirjaa se REMONTTI_AUDIT.md:hen "huomio: korjaisin näin →" -lisämerkinnällä. Älä koske toteutustiedostoihin.
- Älä uudelleenkirjoita `e2e-bug-scan.spec.js`:tä — tämä on uusi spec.
- Älä commitoi mitään.
- Älä deployaa.
- Älä tee skill-set-rituaaleja — `webapp-testing` skill on hyvä referenssinä, mutta älä copy-pastea sen kaikkia checklistejä audit-mdhen.
- Älä päivitä BUGS.md:tä, IMPROVEMENTS.md:tä tai AGENT_STATE.md:tä — tämä on irrallinen audit, käyttäjä päättää myöhemmin mitkä siirretään BUGS.md:hen.

---

## Lopuksi

Kun audit on valmis:
1. `REMONTTI_AUDIT.md` repo-juuressa
2. `tests/remontti-audit.spec.js` luotu
3. `tests/screenshots/audit/` täynnä screenshotteja
4. Lopussa kerro käyttäjälle: "N löydöstä, top-3: ..., katso REMONTTI_AUDIT.md"

Käyttäjä ja planner käyvät audit-listan läpi YHDESSÄ ennen seuraavaa vaihetta (fix-vaihe). Älä aloita fixaamista vaikka kuinka kiusaisi.
