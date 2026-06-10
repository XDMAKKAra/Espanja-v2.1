# L-V412: Landing v2 demoista tuotantoon (etusivu + 3 abikurssisivua + /nayte)

**Päivä:** 2026-06-10
**Skill-stack:** FRONTEND (impeccable, saa lisätä ui-ux-pro-max) + TESTING (webapp-testing) + COPY (humanizer vain jos copyä muutetaan)
**Päätös lukittu:** etusivun suunta = Kurssi-oston painotus (49 € kertaostos näkyvissä heti, osto-CTA toistuu). Marcel hyväksyi designit 2026-06-10.

## Hyväksytyt designit (docs/audits/, ÄLÄ suunnittele uusiksi, toteuta nämä)

| Demo-tiedosto | Tuotantokohde | Huomio |
|---|---|---|
| `landing-fable-demo-tiktok.html` | `index.html` (etusivu) | Kielivalitsin hero-interaktiona, osto-CTA above fold mobiilissa, desktop 2-palstainen hero |
| `landing-fable-demo-google.html` | `/espanjan-abikurssi` | SEO-sivu, hakusana H1:ssä ja titlessä |
| `landing-fable-demo-google-fr.html` | `/ranskan-abikurssi` | sama runko, ranskan sisältö |
| `landing-fable-demo-google-de.html` | `/saksan-abikurssi` | sama runko, saksan sisältö |
| `landing-fable-demo-nayte.html` | `/nayte` | kielivälilehdet + rubriikkiselitys + rehellisyysblokki |

`landing-fable-demo.html` (A) ja `landing-fable-demo-kurssi.html` (B) ovat hylättyjä välivaiheita, älä käytä.

## Toteutusohjeet

1. **Fontit:** demot käyttävät Google Fonts CDN:ää koska self-contained. Tuotanto on self-hosted-linjalla (L-V344): Fredoka ja Mulish ovat jo `/fonts`-kansiossa. **Caveat on uusi** (käsinkirjoitettu essee-fontti): lataa latin 500/600 woff2 self-hostatuksi ja lisää `/css/fonts.css`:ään. Älä jätä CDN-linkkiä tuotantoon.
2. **Säilytä infra etusivulla:** `pre-launch-gate.js` (sync script head:ssa), manifest, faviconit, theme-color, OG/Twitter-meta, JSON-LD (SoftwareApplication + Organization). Päivitä title/description uuteen copyyn. `robots: index,follow` + canonical.
3. **Abikurssisivut:** tarkista miten nykyiset `/espanjan-abikurssi` ym. servataan (L-V356 toteutus) ja korvaa sisältö samassa mekanismissa. Canonical per sivu, hakusana-title demon head-kommentin mukaan.
4. **JS:** demojen inline-kielivaihto (`setLang`) on ~25 riviä vanilla JS:ää. Siirrä `js/`-tiedostoon tuotantokonvention mukaan (vrt. `landing-hero-lang.js`) tai perustele inline. Etusivun valitsin vaihtaa: h1-sanan, paperiartefaktin, kurssinimet.
5. **CSS:** uusi design korvaa etusivun nykyiset landing-CSS-kerrokset (landing-editorial, landing-spark). Poista kuollut CSS, älä kasaa uutta kerrosta vanhojen päälle.
6. **Nav-päätös on tietoinen:** etusivun nav on riisuttu (brand + Osta-nappi) konversiosyistä. Säilytä riisuttuna. Kurssisivuilla on ankkurilinkit (Sisältö/Arviointi/Hinta/UKK). Mobiilihampurilaista ei tarvita näillä sivuilla. Footerissa on täydet linkit.
7. **/nayte:** nykyisellä landingilla on interaktiivinen demo-grade-widget (POST `/api/writing/demo-grade`, 1 arvio/laite/päivä, honeypot). Suositus: säilytä se uuden näytesivun loppuun "Kokeile itse" -osiona ennen CTA-bändiä. Staattinen näyte ja rubriikkiselitys tulevat demosta.
8. **Copy on lukittu ja humanizer-ajettu tämän session aikana.** Pistehaarukka-kieli ("ei luvattua yksittäispistettä") on tietoinen valinta (L-V354), älä pehmennä tai kovenna. Hinnat: Kurssi 49 € kertaostos, Treeni 9 €/kk. Treeni-ankkurointi (108 €/lukuvuosi vs 49 €) säilyy.
9. **Linkit:** CTA:t osoittavat `/app.html#rekisteroidy?tier=kurssi` ja `/app.html#/aloitus`. Varmista että toimivat signup-flown (L-V408/409) kanssa.
10. **Demo-tagit pois:** poista `demo`-merkit nav-brandista ja footerin "design-demo"-rivi.

## QA (pakollinen ennen pushia)

- Playwright: ei vaakavieritystä 360 / 390 / 1440 px millään viidestä sivusta (demoissa todennettu, säilytettävä).
- Etusivun mobiili (390×664): osto-CTA:n alareuna above fold (demossa 625 px).
- Kielivaihto toimii klikkaamalla kaikilla sivuilla joilla valitsin on.
- Gate-ohitus testeissä: `puheo_gate_ok_v1=1` addInitScriptillä.
- `npm run build` ennen committia, stage myös bundle-tiedostot.
- `sw.js CACHE_VERSION` bump jos STATIC_ASSETS muuttuu.
- Push Verceliin: nämä ovat user-facing → push OK kun QA vihreä.

## Acceptance criteria

- Viisi sivua tuotannossa demojen designilla, pikseliero demoon vain infra-syistä (fontit, gate, meta).
- Ei vaakavieritystä <400 px, osto-CTA above fold etusivun mobiilissa.
- Lighthouse/perf ei huonone merkittävästi nykyisestä (fontit self-hosted, ei uusia ulkoisia riippuvuuksia).
- Kaikki vanhat URL:t toimivat (/, /nayte, /espanjan-abikurssi, /ranskan-abikurssi, /saksan-abikurssi).
