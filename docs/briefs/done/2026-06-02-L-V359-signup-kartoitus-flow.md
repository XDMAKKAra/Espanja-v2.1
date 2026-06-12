# L-V359 — Signup → kartoitus → tulokset → tuotevalinta -flow

**Päivä:** 2026-06-02
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + COPY + BACKEND → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `humanizer`, `supabase`, `supabase-postgres-best-practices`, `webapp-testing`, `superpowers:verification-before-completion`
**Järjestys:** kolmas (L-V357 valikko + L-V358 kielisivut ensin).
**Olemassa oleva:** `js/screens/onboardingV4.js` (kartoitus), `routes/auth.js` (rekisteröinti toimii), `routes/stripe.js` (placeholder, palauttaa 503/410), `js/landing-lang-cta.js` + `puheo:lang` (kielen esivalinta).

## Mihin onboardingiin: V4, ja promotoi se defaultiksi (PÄÄTETTY)

Live-default `#/aloitus` → **V3** (ei diagnostic-first). **V4** elää osoitteessa `#/aloitus-v4` ja on jo **diagnostic-first preview** (L-V293-1a) — eli kartoitus-ensin, juuri tämän briefin rakenne. Rakenna flow **V4:ään** (älä V3:een — siellä ei ole diagnostic-first-rakennetta).

**Promotointi-ehto:** flippaa `#/aloitus` → V4 **vasta kun koko flow on rakennettu ja e2e-verifioitu V4:ssä**. Älä vaihda live-defaultia kesken rakentamisen (live-käyttäjät tippuisivat puolivalmiille previewille). Saman PR:n sisällä OK — kaikki shippaa yhdessä. V3 jää fallbackiksi (esim. `#/aloitus-v3`). `js/main.js`:n hash-reititys (`#/aloitus` / `#/aloitus-v4`) päivitetään vastaavasti.

---

## Iso periaate (käyttäjän päätös)

**Rakenna koko flow loppuun niin että ainoa puuttuva pala on Stripe-API.** Maksuendpoint (`routes/stripe.js`) palauttaa nyt 503 — se on OK. Tuotevalinta-näkymä, checkout-kutsu ja onnistumis-/paluupolut rakennetaan valmiiksi; kun Stripe viedään liveen, sama putki alkaa vain toimia. Stripe-dashboard/live-toimia EI tehdä tässä briefissä (vaatii erillisen luvan).

## Flow (kirjautumaton käyttäjä painaa "Aloita ilmaiseksi") — JÄRJESTYS PÄIVITETTY 2026-06-03

**Tärkein muutos:** rekisteröinti EI ole ekana. Aiempi versio näytti login/register-ruudun heti → utelias kävijä (joka haluaa vain nähdä millainen appi on) törmää kirjautumisseinään ja bounceaa. Kartoitus tehdään ensin anonyymisti, tili vasta sen jälkeen.

```
Aloita ilmaiseksi
  → 1. Kielivalinta (es / de / fr)        [esivalittu jos puheo:lang asetettu]
  → 2. Kartoitus (ILMAINEN, ANONYYMI)     [onboardingV4.js — ei vaadi tiliä]
  → 3. Tulokset                            [YO-valmius + vahvuudet/puutteet]
  → 4. Luo tili  TAI  jatka ilman tiliä
       ├─ Luo tili → rekisteröinti (nimi, puhelinnumero, sähköposti, salasana)
       │             → kartoituksen tulokset TALLENTUVAT DB:hen tilille
       └─ Jatka ilman tiliä → tulokset jäävät vain tähän sessioon
  → 5. Kurssivalinta + maksu: Kurssi · Treeni · Jatka ilmaisena
       ├─ Kurssi (49 €)   → checkout (Stripe-API puuttuu → graceful "tulossa pian")
       ├─ Treeni (9 €/kk) → checkout (sama)
       └─ Jatka ilmaisena → /app.html, free tier auki
```

**Anonyymi kartoitus:** kartoitus pyörii ilman tiliä, tulokset pidetään muistissa/localStoragessa. Tili luodaan vasta tulosten jälkeen, jolloin tulokset persistoidaan DB:hen (kytke `routes/auth.js`-rekisteröintiin: luonnin yhteydessä tallenna sessiossa olevat kartoitustulokset). "Jatka ilman tiliä" säilyttää tulokset vain sessiossa.

## Kohta kohdalta

### 1. Napin teksti: "Aloita" → "Aloita ilmaiseksi"
L-V357 toimitti valikon "Aloita"-napilla. Vaihda kirjautumattoman aloitusnapin teksti **"Aloita ilmaiseksi"** (kartoitus on ilmainen, "ilmaiseksi" madaltaa kynnystä). Muuta kaikissa paikoissa joissa sama CTA esiintyy (mobiilivalikko, landingin hero-CTA, kielisivujen CTA) jotta teksti on yhtenäinen. Tarkista ettei rivity rumasti 390px:ssä.

### 2. Kielivalinta
Käytä olemassa olevaa `puheo:lang`-mekaniikkaa. Jos kieli on jo esivalittu (tultu kielisivulta), näytä se valittuna mutta salli vaihto. Kolme kieltä: espanja, saksa, ranska.

### 3. Kartoitus = ilmainen, anonyymi, ENNEN tiliä
Kartoitus (`onboardingV4.js`) pyörii ilman tiliä eikä sen takana ole paywallia eikä kirjautumisseinää. Tämä on koukku: utelias kävijä pääsee heti kokeilemaan ja näkee YO-valmiutensa + puutteet ennen kuin häneltä pyydetään mitään. Tulokset pidetään sessiossa/localStoragessa kunnes (jos) tili luodaan.

### 4. Luo tili (kartoituksen JÄLKEEN) — kunnon register
Vasta tulosten jälkeen tarjotaan tilin luontia. **Kunnollinen register-näkymä**, kentät: **nimi, puhelinnumero, sähköposti, salasana** (käyttäjän pyyntö — nykyinen versio kysyi vain sposti+salasana). Reuse `routes/auth.js`; jos skeemaan pitää lisätä nimi/puhelin, tee migraatio `mcp__claude_ai_Supabase__apply_migration`:lla (ÄLÄ SQL-editori käyttäjälle). Validointi + suomenkieliset virheviestit (humanizer). Tilin luonnin yhteydessä **tallenna sessiossa olevat kartoitustulokset DB:hen**. Tarjoa myös "Jatka ilman tiliä" -ulospääsy (tulokset jäävät sessioon).

> Pieni huomio (toteuta silti): puhelinnumero on epätavallinen opiskelusovelluksen rekisteröinnissä ja lisää kitkaa juuri kun sitä yritetään vähentää. Harkitse merkitsemistä valinnaiseksi. Mutta käyttäjä pyysi sitä → ota mukaan.

### 5. Tulokset
Kartoituksen jälkeen näytä tulosnäkymä: YO-valmius-arvio + 2-3 konkreettista vahvuutta/puutetta. Arviointi L-V354-mallissa (pistehaarukka + perustelu jos kirjoitelma mukana, EI "sama tarkkuus" -väitettä, EI tarkkaa yksittäislukua). Tulosnäkymä motivoi siirtymään valintaan.

### 6. Tuotevalinta (kurssi / treeni / jatka ilmaisena)
Kolme selkeää vaihtoehtoa, EI 3 identtistä korttia rivissä (AI-slop). Erottele tuotteet:
- **Kurssi — 49 €** (kertamaksu): koko abikurssi, kaikki tasot.
- **Treeni — 9 €/kk** (tilaus): jatkuva harjoittelu.
- **Jatka ilmaisena**: free tier (ks. alla), pienempi/sekundäärinen mutta selkeästi saavutettavissa — ei piilotettu.

Hinnat ja tuotteiden tarkka sisältö: vahvista `LANG_CURRICULA`-datasta / nykyisestä hinnoittelusta; jos sisältöerottelu epäselvä, kysy ennen kuin keksit. ÄLÄ keksi ominaisuuslistoja.

### 7. Checkout (Stripe-API puuttuu)
Kurssi/treeni → checkout kutsuu `/api/stripe/checkout-session`. Se palauttaa nyt 503. **Älä anna sen kaatua tai näyttää raakaa virhettä** — näytä siisti suomenkielinen "Maksu tulossa pian" -tila (humanizer) ja tarjoa "Jatka ilmaisena toistaiseksi" -ulospääsy. Kun Stripe livenä, sama kutsu ohjaa Stripe-checkoutiin.

### 8. Free tier
Free tier = **1 testikoe + 1 kirjoitustehtävä ilmaiseksi** (vahvista tarkka kiintiö koodista/middlewaresta ennen toteutusta — `middleware/auth.js` softProGate/isPro). "Jatka ilmaisena" vie `/app.html`:ään free-oikeuksin. Paywall (upgrade-kehotus) ilmestyy appissa vasta kun free-kiintiö on käytetty, EI flow'n sisällä. Tarkista miten nykyinen gate laskee kiintiön ja kytke tuotevalinta siihen (älä riko olemassa olevaa Pro/Free-logiikkaa).

## Brändi- ja copy-vartijat

- Cream/brick, Fredoka+Mulish, tasaiset värit. EI turkoosia, EI gradient-textiä, EI identtistä korttiruudukkoa, EI mono-UPPERCASE-eyebrowtä, EI italic-Fraunces, EI emojia.
- EI em-dashia, EI keksittyjä %-lukuja/lukio-nimiä, EI "coming soon" -litteraalina (käytä suomeksi "tulossa pian").
- Kaikki näkyvä suomi-teksti (otsikot, napit, virheviestit, hinnat, tuotekuvaukset) `humanizer`-skillin läpi ennen committia.
- Tuoteportaat eivät saa olla 3 samanlaista korttia — erottele visuaalisesti hierarkialla.

## Acceptance criteria

- "Aloita ilmaiseksi" vie kirjautumattoman: kieli → tiedot → kartoitus → tulokset → valinta, mobiilissa (390px) ja desktopilla ilman vaakavieritystä.
- Kielivalinta kunnioittaa `puheo:lang`-esivalintaa, sallii vaihdon.
- Rekisteröinti käyttää olemassa olevaa `routes/auth.js`:ää; virheviestit suomeksi.
- Kartoitus ei ole paywallin takana.
- Tulosnäkymä näyttää YO-valmiuden + perustelun L-V354-mallissa.
- Tuotevalinta: 3 vaihtoehtoa (kurssi 49 € / treeni 9 €/kk / jatka ilmaisena), ei identtistä korttiruudukkoa.
- Kurssi/treeni → checkout: 503-tilassa näkyy siisti "tulossa pian" + ulospääsy, ei kaatumista. (Kun Stripe livenä → ohjaa checkoutiin.)
- "Jatka ilmaisena" → `/app.html` free-oikeuksin; paywall ilmestyy vasta kiintiön loputtua, ei flow'ssa.
- Olemassa oleva Pro/Free-middleware ei regressoidu.

## Verify (writer tekee, ei käyttäjä)

- Playwright e2e: koko flow kirjautumattomasta "Aloita ilmaiseksi" → kartoitus → tulokset → kukin kolmesta haarasta. Mockaa kartoituksen läpäisy. Varmista 503-checkout näyttää siistin tilan. 390px + desktop.
- Tarkista free-tier-kiintiö toimii (1 koe + 1 kirjoitelma) ja paywall laukeaa vasta sen jälkeen.
- `npm run build`; bumppaa `sw.js` CACHE_VERSION; `node --check` muutetuille screen-moduuleille.
- vitest läpi.
- Pushaa mainiin (näkyvä muutos). Stripe-dashboard-toimia EI tehdä.

## Avoinna / kysy ennen kuin keksit

- Tuotteiden (kurssi vs treeni) tarkka sisältöerottelu ja lopulliset hinnat — vahvista koodista/hinnoittelusta tai kysy. Älä keksi ominaisuuslistoja.
- Free-tier-kiintiön tarkka määritelmä — lue `middleware/auth.js`; jos epäselvä, kysy.

## Skaala

Iso: uusi monivaiheinen flow + tuotevalinta + checkout-wiring + free-tier-kytkentä. Tämä on suurin kolmesta briefistä. Pidä jokainen vaihe omana fokusoituna näkymänä.
