# BRIEF: L-V336 — App-wide AI-slop sweep (sama työ kuin landingilla, nyt appiin)

**Päivä:** 2026-06-01
**Status:** Ship-brief, isompi design-loop.
**Trigger:** Marcel 2026-06-01: koko kirjautunut app näyttää AI-slopilta vaikka landing siivottiin V331/V334:ssä. Sama mono-UPPERCASE-label-fontti, em-dash-eyebrowt, kuolleet tyhjät tilat. Aja L-V335 (functional fix) ensin → puhdas pohja.
**Skill-stack:** FRONTEND-L + COPY → `frontend-design`, `ui-ux-pro-max`, `webapp-testing`, `humanizer`, `superpowers:verification-before-completion`

---

## Juuriongelma: mono-label-fontti koko app-shellissä

Sama monospace-UPPERCASE-letterspaced label-tyyli näkyy joka app-näkymässä (landingilta se poistettiin, appiin jäi). Hypoteesi: yksi CSS-token (esim. `--ed-mono` tai vastaava) käytetään label-fonttina kymmenessä paikassa. Etsi se ja korvaa label-käyttö **sans + paino/koko-hierarkialla** (sama ratkaisu kuin V329/V331 teki landingin eyebrow'lle ja grade-step-chipille).

Paikat joissa mono-label näkyy (kuvalista Marcelin auditista):
- Eyebrowt em-dash-koristein: "—— Näyte arvioinnista ——", "—— Kurssipolku ——" (poista myös flanking-viivat)
- Kategoria-labelit kurssinäkymässä: Sanasto / Kielioppi / Yhdistelmä (kuva 8)
- Reader-nav: "Seuraava →", "Edellinen", "1 / 10 valmis" -pilleri (kuvat 10, 11)
- Tehtävä-labelit: "Käännös, suomesta espanjaksi", "Yhdistämistehtävä", "Tehtävä 1 / 6", "~14 min", "Avautuu vuorollaan", "Suoritettu", "Arvioidaan YTL-rubriikilla" (kuvat 8, 12, 13, 14)

Älä poista label-informaatiota, vaihda vain fontti/casing. Esim. "KÄÄNNÖS, SUOMESTA ESPANJAKSI" mono → "Käännös suomesta espanjaksi" sans, pienempi paino, ei letter-spacing-överiä. CLAUDE.md-sääntö: ei mono-UPPERCASE-eyebrow'ta ilman semanttista syytä.

Bonus: kirjoitusnäytteen espanja renderöityy monospacella (kuva 1, punainen boksi product-mockupissa). Korjaa proosa luettavaan sansiin. Tämä korjaa myös landing-heron `img/product/lesson-writing.png`:n → re-capture `scripts/capture-product-screenshots.mjs`:llä L-V335/336:n jälkeen.

---

## Empty-state + layout-elävöitys

### Oppimispolku + kurssilista (kuvat 7, 8) — tylsä, litteä, harmaa
Numerolista ilman elämää. Älä yli-koristele (ei gradientteja, ei glassmorphismia, ei identtisiä kortteja). Tee siitä luettava ja rytmikäs: nykyinen kurssi visuaalisesti erottuva (jo on brick-reuna), lukitut kurssit hillityt, edistymä selkeä. Intent: näyttää kirjalta/sisällysluettelolta, ei excel-riviltä. Vapaat kädet kompositioon, mutta pidä Old-Spain-paletti (cream/brick) ja General Sans + Manrope.

### Käännöstehtävä (kuva 13) — valtava tyhjä tila + yksinäinen punainen viiva
Sisältö (yksi käännöslause + vastauskenttä + Tarkista) jättää alapuolelle satoja pikseleitä tyhjää ja irrallisen punaisen vaakaviivan. Korjaa: tehtäväkortti keskitetään pystysuunnassa tai annetaan footer/progress joka täyttää tilan luontevasti. Ei kelluvaa orpoa viivaa.

### Kirjoitustehtävä (kuva 14) — punainen reuna tyhjässä textareassa lukee virheenä
Tyhjä vastaus-textarea on renderöity brick-punaisella reunalla, mikä näyttää validointivirheeltä vaikka mitään ei ole väärin. Vaihda neutraaliin reunaan; brick-reuna vain aktiiviseen focus-tilaan tai aitoon virheeseen. Tarkista myös sidebarin leikkautuminen samassa näkymässä.

---

## Acceptance criteria
1. Mono-UPPERCASE-letterspaced label-fonttia ei käytetä app-shellissä (reader, lesson, oppimispolku, tehtävät) — labelit sans + paino/koko-hierarkia
2. Em-dash-flanking-viivat eyebrow'sta poistettu kaikkialta appista
3. Kirjoitusnäytteen / tehtävien proosa ei renderöidy monospacella
4. Oppimispolku + kurssilista näyttää sisällysluettelolta, ei litteältä harmaalta listalta (Marcel-hyväksyntä screenshotista)
5. Käännöstehtävässä ei orpoa tyhjää tilaa + irrallista punaista viivaa
6. Kirjoitustehtävän tyhjä textarea ei näytä virhetilalta (neutraali reuna default)
7. `img/product/lesson-{writing,grade}.png` re-capturoitu jos app-fontit muuttuivat (landing-hero näyttää korjatun)
8. Kaikki näkyvä suomi-teksti humanizer-pass
9. `npm run test:bug-scan` + brand-e2e PASS, `npm run build`, `sw.js` CACHE_VERSION bump
10. Mobile <440px: ei vaakavieritystä missään näkymässä

## Out-of-scope
- Toiminnalliset bugit (= L-V335, aja ensin)
- Pricing-kortit (= L-V337)
- Uudet tehtävätyypit / sisältö
