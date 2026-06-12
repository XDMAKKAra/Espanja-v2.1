# L-V373 — Landing redesign: tuote-screenshotit kuvitusten tilalle

**Päivä:** 2026-06-03
**Prioriteetti:** P1 — tärkein näkyvä muutos, konversiopinta.
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + TESTING-M + COPY → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `humanizer`
**Riippuvuus:** **V371 + V372 ensin** (tokenit + komponentit).

## Orkestraatio (token-budjetti)
Koordinaattori-malli: pidä main-loop kevyenä, delegoi. Subagentit palauttavat tiiviit tulokset (esim. "kaapattu 3 shottia polkuun X", ei base64-kuvia).
**Malli per tehtävä:** triviaali → Haiku, standardi → Sonnet, vaikea/maku → Opus.
**Tämä vaihe:** sommittelu + kehyskäsittely + maku → **Opus** (koordinaattori). Screenshot-kaappaus Playwrightilla on mekaanista → erillinen **Sonnet**- tai **Haiku**-subagentti. Croppaus/optimointi → Haiku.

---

## 🛑 PYHÄ RAJA — älä koske app-puoleen
Muutat VAIN `index.html` + landing-CSS:ää. ÄLÄ muokkaa `app.html`, `app.js`, `js/**`. Screenshotit KAAPATAAN app-puolelta (vain luku, Playwright), mutta app-koodia ei muuteta. Jos muutos koskettaisi app-puolta → STOP ja kysy.

## Tavoite
Rakenna landing (index.html) uudelleen Tailwind-systeemillä niin että **tuote-screenshotit korvaavat itse-piirretyt flat-SVG-kuvitukset**. Evidenssi (kilpailija-audit 2026-06-03): amatööri-flat-SVG = halpa signaali; oikea app-screenshot hillityssä kehyksessä = premium (Notion/Linear/Babbel/Busuu, ja Khan Academy vaihtoi tietoisesti pois flat-vektorista). WordDive (lähin verrokki) tekee screenshot-vetoisen heron + kevyen tukikuvan.

## Konteksti
Marcel: kaikki näyttää halvalta paitsi itse oppitunnit. Päätös: näytä sitä oikeaa app-UI:ta jota appissa jo on. Tämä on VÄHEMMÄN työtä kuin kuvitus-treadmill ja näyttää paremmalta.

## Tehtävät
1. **Otsikko:** vaihda hero-otsikoksi (Stitchistä, Marcel hyväksyi): "Varmuutta ylioppilaskokeeseen. Stressitöntä kertausta." Yksi väri koko otsikossa, ei väriä kesken lauseen. Humanizer-clean.
2. **Kaappaa tuote-screenshotit** Playwrightilla (deviceScaleFactor 2, puhtaat näkymät, testitili .env:stä, gate-bypass `puheo_gate_ok_v1='1'`):
   - AI-arviointinäkymä rubriikilla + pistehaarukalla (paras myyntikuva)
   - Oppitunti/tehtävänäkymä
   - Oppimispolku (kurssilista)
   - Croppaa pois henkilökohtainen data (testitilin nimi yms).
   Tallenna esim. `public/shots/` (tarkista mihin landing-assetit menevät).
3. **Korvaa kuvitukset screenshoteilla** hillityssä kehyksessä (Linear/Notion-tyyli): pyöristys, pehmeä cream-tintattu varjo, EI raskaita 3D-bezeleitä, EI gradient-glowta. Hero = 1 vahva screenshot. Feature-osio = tuotekuvat (1-2 riittää, ei pakoteta neljää).
4. **Auktoriteetti tekstillä, ei kuvalla:** YO-countdown-pilli (hero-eyebrow:nä, ei iso standalone-kortti — ks. olemassa oleva `.yo-countdown`-konventio) + YTL-rubriikki-maininta. Ei keksittyjä %-lukuja/testimoniaaleja.
5. **Käytä V372-komponentteja** (btn, card, pill, nav, footer) — ei bespoke-CSS:ää.
6. Poista kuolleet SVG-viittaukset (hero-grade.svg, feature-*.svg) jos jäävät käyttämättä.

## Acceptance
- Ei flat-SVG-maskottikuvitusta hero/feature-osioissa; tilalla oikeat tuote-screenshotit kehyksissä.
- Uusi otsikko paikallaan, yksivärinen.
- Ei AI-slopia (gradient-text, identtiset kortit, em-dash, mono-UPPERCASE, hard-shadow).
- Screenshotit skaalautuvat (max-width:100%), ei vaakavieritystä 390px, renderöi 1440px.
- `npm run build` PASS, sw.js CACHE_VERSION bumpattu (uudet kuvat + muuttunut HTML/CSS STATIC_ASSETS:issa).
- Ota lopuksi Playwright-screenshot valmiista landingista (390px + 1440px) → `screenshots/`, Marcel haluaa nähdä.
- ÄLÄ pushaa/committaa, jätä working treehen (Marcel katsoo localhost:3000).

## Ulkopuolella
Muut sivut (V374 staattiset, V375 app). Tämä on vain landing.
