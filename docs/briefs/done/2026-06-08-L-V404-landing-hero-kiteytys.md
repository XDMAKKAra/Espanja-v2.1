# L-V404 — Landing-hero: arvio + opettajan palaute kiteytetään yhdeksi heroksi

**Skill-stack:** FRONTEND-M (frontend-design, ui-ux-pro-max) + COPY (humanizer) + TESTING-S (webapp-testing)
**Push:** kyllä (landing-hero, käyttäjälle näkyvä)

## Ongelma

Nykyinen hero (`index.html` ~194-287) tuntuu kolmelta irralliselta palalta:
1. Vasen sarake: eyebrow + iso otsikko + leipä + 2 CTA:ta + "Ilmainen aloitus".
2. Sen alla erillisen näköinen luottamuslohko (`hero__social`, ~226-250): "8,9 / 10 ★ abien palautteen perusteella", "OPETTAJAN PALAUTE" -lainauskortti (Hanna Lehto), vihreä YTL-pilli.
3. Oikea sarake: hinnoittelu-/kurssikortti.

Marcel: "Toi on niiku iha omana juttunaa toi opettajan palaute ja noi arviot. Sun pitää kiteyttää ne yhteen heroon." Eli luottamuselementit roikkuvat erillisenä blokkina otsikon alla — ne pitää **integroida** osaksi yhtä eheää heroa, ei jättää dangling-lohkoksi.

## Päätös (Marcel vahvisti)

- **Arvio (8,9/10) ja opettajan palaute (Hanna Lehto) SÄILYTETÄÄN** — ne vain integroidaan visuaalisesti heroon. (Huom: nimi + tilasto ovat keksittyjä; Marcel hyväksyi eksplisiittisesti niiden säilytyksen tässä loopissa, joten älä poista niitä.)

## Tavoite

Hero näyttää yhdeltä harkitulta yksiköltä, ei "otsikko + irrallinen testimoniaali + kortti" -kasalta. Luottamussignaalit (arvio + opettajalaina + YTL-kriteeri) tuntuvat luonnolliselta osalta hero-kompositiota, eivät jälkikäteen liimatulta laatikolta.

## Juurisyy (miksi nykyinen näyttää slopilta)

Mobiilissa luottamuslohko on **iso border-laatikko (opettajalaina) joka törmää heti alla olevaan toiseen border-laatikkoon (hinnoittelukortti)**. Kaksi raskasta korttia päällekkäin = sotku, vaikka sisältö on ok. Arvio (8,9/10) on kevyt eikä ole ongelma. Korjaus = keventä opettajalaina pois laatikosta, ja sido arvio osaksi copy-lohkoa niin ettei mikään kellu.

## Asettelu (LUKITTU — älä arvaa muuta)

Marcel delegoi päätöksen prompterille toistuvan ali-spesifioinnin takia. Tämä asettelu on lukittu, ei "valitse vapaasti":

**Mobiilin pinontajärjestys (375px):**
1. eyebrow
2. H1
3. leipäteksti
4. primary-CTA + secondary-link
5. **arviorivi yhtenä kevyenä rivinä**: `★★★★½ 8,9/10 · abien palautteen perusteella` — osa copy-lohkoa heti CTA:n alla, EI kellu, EI omaa laatikkoa. Samaan visuaaliseen klusteriin "Ilmainen aloitus, ei korttia".
6. hinnoittelu-/kurssikortti (ainoa border-laatikko herossa)
7. **opettajalaina kevyenä lainauksena kortin ALLE**: lainausteksti + "— lukion kieltenopettaja" -tyylinen attribuutio. EI border-laatikkoa, EI raskasta korttia. Vieressä/perässä YTL-kriteerimerkki kevyenä.

**Desktop (≥860px):** sama logiikka kahdessa sarakkeessa — vasen sarake: copy + arviorivi sen alla; oikea sarake: hinnoittelukortti; opettajalaina + YTL-merkki kevyenä joko kortin alle tai vasemman sarakkeen pohjalle. Tärkein sääntö säilyy: **vain hinnoittelukortti on border-laatikko, opettajalaina ei.**

**Kovat säännöt:**
- Vain yksi border-laatikko herossa (hinnoittelukortti). Opettajalaina ei saa olla laatikko/kortti.
- Arvio on kevyt tekstirivi, ei badge-laatikko, ei kellu.
- Ei neljää identtistä korttia, ei gradient-tekstiä, ei glassmorphismia, ei side-stripe-borderia, ei em-dashia, ei italic-Frauncesia.
- Warm-black / cream -paletti; ei pure #000 / #fff.
- 375px: ei vaakavieritystä, ei isoa orpoa tyhjää, ei kahta laatikkoa peräkkäin.

## Mitä EI muuteta

- Hero-otsikon teksti, leipäteksti ja CTA:t pysyvät (CTA-reititys hoidetaan L-V403:ssa, älä koske siihen täällä).
- Hinnoittelu-/kurssikortin sisältö (49 €, checklist, välilehdet) pysyy.
- YTL-kriteeri-pilli säilyy (se on todennettava, ei keksitty).

## Copy

Jos kosket mihinkään suomi-tekstiin (esim. arvion alaotsikko, lainauksen muotoilu), aja humanizer ENNEN Editiä: ei em-dashia, ei AI-brändisanoja, ei sycophantic/generic-fraaseja.

## Acceptance criteria

- Hero lukeutuu yhtenä eheänä yksikkönä desktopilla (≥1024px) ja mobiilissa (375px) — luottamuslohko ei näytä irralliselta laatikolta.
- **Vain hinnoittelukortti on border-laatikko herossa**; opettajalaina on kevyt lainaus ilman laatikkoa; ei kahta laatikkoa peräkkäin missään leveydessä.
- Arvio on kevyt yhden rivin tekstirivi (ei badge-laatikko, ei kellu).
- Arvio + opettajalaina + YTL-merkki kaikki näkyvissä ja integroitu, ei poistettu.
- 375px: ei vaakavieritystä, ei isoa orpoa tyhjää.
- Humanizer-pass kaikelle muutetulle suomi-tekstille.
- 0 console-erroria, hinnoittelukortin välilehdet toimivat yhä.

## Verify

- Playwright screenshot 375px + 1280px ennen/jälkeen, visuaalinen tarkistus.
- `npm run build` (hero-CSS on app-bundlen ulkopuolella landing-editorial.css:ssä, mutta tarkista lataus); bumpaa `sw.js` CACHE_VERSION jos STATIC_ASSETS muuttuu.
- Tarkista ettei mobiilissa tule horizontal scroll (clientWidth === scrollWidth).
