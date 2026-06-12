# L-V403 — Onboarding: kaikki CTA:t kartoitukseen ennen rekisteröitymistä

**Skill-stack:** FRONTEND-M (frontend-design, ui-ux-pro-max) + TESTING-M (webapp-testing)
**Push:** kyllä (käyttäjälle näkyvä reittimuutos)

## Ongelma

Kun käyttäjä klikkaa landingilta "Aloita ilmaiseksi", hän joutuu suoraan kirjautumis-/rekisteröitymisruutuun (`/app.html#rekisteroidy`). Pitäisi ensin päästä kartoitukseen (tasokartoitus + yhteenveto), ja rekisteröinti tulee vasta kun käyttäjä on nähnyt mitä saa.

Hyvä uutinen: V4-kartoitus (`#/aloitus`) on **jo rakennettu anonyymiksi**. Sen oma vaiheistus on: intro (kielivalinta) → tasokoe (A kielioppi / B luetun ymmärtäminen / C kirjoitelma) → biografia → yhteenveto → **tili (rekisteröinti)** → valinta (kurssi/treeni/ilmainen). Rekisteröitymisportti on jo oikeassa kohdassa: vasta yhteenvedon jälkeen. Tämä on siis pääosin reititysmuutos, ei uuden flow'n rakentamista.

## Tavoite

Jokainen "aloita"-tyyppinen CTA vie kartoitukseen (`#/aloitus`), EI suoraan rekisteröitymiseen. Päätös: **kaikki CTA:t kartoitukseen**, myös hinnoittelukortin "Aloita nyt" (49 €) — ostopäätös tehdään kartoituksen jälkeen valinta-vaiheessa.

## Mitä muutetaan

1. **index.html** — kaikki 5 "Aloita ilmaiseksi" -CTA:ta (`#nav-signup` rivi ~127, `#nav-menu-signup` ~155, hero-CTA ~211, alakortti-CTA ~610, footer-CTA ~662) sekä hinnoittelukortin "Aloita nyt" (offer-card ~279) → osoittavat `#/aloitus`-kartoitukseen `#rekisteroidy`:n sijaan.
   - "Kirjaudu" (`#kirjaudu`, ~126) pysyy ennallaan — se on paluukäyttäjille.
2. **Per-kielisivut** (`public/landing/espanja.html`, `ranska.html`, `saksa.html`) — niiden "Aloita ilmaiseksi" / "Aloita nyt" -CTA:t samoin kartoitukseen. Ne asettavat jo `puheo:lang`-arvon (`js/landing-lang-cta.js`); varmista että kartoituksen intro kunnioittaa esivalittua kieltä (joko esivalitsee kielen tai ohittaa kielivalinnan kun `puheo:lang` on asetettu).
3. **Hero-tarjouskortin ES/FR/DE-välilehdet** — kun käyttäjä valitsee välilehden ja klikkaa "Aloita nyt", valitun kielen pitää kulkea kartoitukseen (`puheo:lang`). Varmista että välilehden valinta päivittää sen.
4. **Reititys-edge:** `js/main.js` (~189) ajaa `showOnboardingV4()` vain jos käyttäjä EI ole kirjautunut. Jos kirjautunut käyttäjä osuu `#/aloitus`-linkkiin, hän ei näe V4:ää vaan tippuu normaaliin appiin (koti). Tämä on hyväksyttävää, mutta varmista ettei tule rikkinäistä tyhjää ruutua — kirjautunut → koti tai kesken jäänyt onboarding jos `onboarding_completed=false`.

## Mitä EI muuteta

- V4-kartoituksen sisäinen vaiheistus on jo oikea — älä rakenna uutta. Pelkkä sisääntulo korjataan.
- Rekisteröitymisportin sijainti (yhteenvedon jälkeen) pysyy.
- Legacy `placement.js` ei kuulu tähän.

## Acceptance criteria

- Uloskirjautuneena: klikkaus mistä tahansa landing/per-kielisivun "Aloita ilmaiseksi" tai "Aloita nyt" -napista vie kartoituksen intro-/tasokoeruutuun, EI `#screen-auth`-rekisteröitymiseen.
- Per-kielisivulta (esim. saksa) tultaessa kartoitus avautuu saksa esivalittuna (ei pakota valitsemaan kieltä uudestaan).
- Hero-tarjouskortin välilehti (Ranska) + "Aloita nyt" → kartoitus ranska esivalittuna.
- Kartoituksen läpi pääsee anonyyminä yhteenvetoon asti ilman kirjautumista; rekisteröinti pyydetään vasta yhteenvedon jälkeen.
- 0 console-erroria koko polulla (uloskirjautunut + kirjautunut).
- Playwright-spec joka kattaa: landing-CTA → kartoitus-intro näkyy → tasokoe alkaa, uloskirjautuneena (addInitScript asettaa `puheo_gate_ok_v1=1`).

## Verify

- `node --check` muutetuille js-tiedostoille.
- Playwright: uusi spec yllä olevalle polulle + olemassa olevat onboarding-smoket vihreänä.
- `npm run build` jos `js/`-lähde muuttuu; bumpaa `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.
- Manuaalinen reittitarkistus kaikille 6 CTA:lle index.html:ssä + 3 per-kielisivulle.
