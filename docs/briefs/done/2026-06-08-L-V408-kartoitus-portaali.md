# L-V408 — Kartoitus-portaali: fullscreen oma portaali + flow uusiksi + taso-arvio pois

> **AGENTTI-DIREKTIIVI (Marcelin eksplisiittinen rajaus, ohittaa auto-skill-stackin):**
> - **Malli: Sonnet.** Aja tämä Sonnet-agentilla.
> - **Skill: VAIN `impeccable`.** Älä lataa muita skillejä (et frontend-design, et ui-ux-pro-max, et humanizer, et webapp-testing). Aloita vastaus rivillä `Skills invoked: impeccable`.
> - Tämä on puhdas frontend-tehtävä (JS + CSS + HTML). Ei backend-muutoksia. Jos törmäät backend-tarpeeseen → pysähdy ja raportoi, älä koske `routes/`- tai `supabase/`-tiedostoihin.
> - Käytä impeccablen ali-komentoja vapaasti: `impeccable shape` ennen koodia, `impeccable craft` toteutukseen, `impeccable audit`/`critique`/`polish` verifiointiin, `impeccable live` selainvariaatioihin.

**Rooli:** WRITER. **Tyyppi:** FRONTEND-L (koko screen-flow -redesign).

---

## TAVOITE (yksi virke)

Tee kartoituksesta ("onboarding V4") oma fullscreen-portaali josta ei pääse pois kesken, joka näyttää paljon hienommalta ja brändinmukaiselta, ja järjestä flow uusiksi: **ensin taustakysymykset → tier-valinta → kirjautuminen.** Poista taso-arvio kokonaan tästä flowsta.

Marcelin sanoin: *"oma portaali mist ei pääse pois ja paljon paljon siistimpi... ton jutun pitää täyttää koko ruutu ja myös sopia meiän brandiin ja pitää olla paljon paljon hienompi."*

---

## JUURISYY (miksi se näyttää rikkinäiseltä nyt)

Kartoitus renderöityy **app-shellin sisällä**: sivupalkki, `app-topbar`-logo ja avatar ympäröivät sitä, eikä mikään piilota chromea V4-ruuduilta. Siksi:
- "värit on rikki logon vieressä" = `app-topbar`-brändi + shell-tausta vuotavat kartoituksen päälle.
- "hampurilainen vasemmalla ylhäällä" = `#menu-toggle` shellistä.

**Korjaus ei ole väri-CSS vaan rakenne:** kartoitus pitää irrottaa omaksi fullscreen-pinnaksi joka peittää koko shellin chromen.

---

## NYKYTILA — tarkka tiedostokartta (lue nämä ensin)

**Kontrolleri:** `js/screens/onboardingV4.js` — koko V4-tilakone, kaikki vaiheet, tilijärjestely, tier-valinta.
**Markup:** `app.html` rivit ~410–620 — kaikki `#screen-ob-v4-*`-divit.
**CSS:** `css/components/onboarding-v4.css` — kaikki `.ob4*`-tyylit.
**Reititys:** `js/main.js` — `initOnboardingV4` (~rivi 180), `window._onboardingV4.show` (181), hash `#/aloitus` (189–190). `js/screens/onboarding.js` → `checkOnboarding()` (27) → `showOnboardingV4()` (43) reitittää tuoreet tilit V4:ään.
**Shell-chrome (piilotettava):** `app.html` `#app-shell` (86), `app-topbar` + `#menu-toggle` (89–94), `app-sidebar` (103–160), `#sidebar-user` avatar (151), `#mobile-nav` (163–174). V4-ruudut asuvat `<main class="app-main"><div class="app-main-inner">`:n (176–177) sisällä.
**Shell-CSS:** `css/components/app-shell.css`, `sidebar-shell.css`, `off-canvas-nav.css`.
**Vihje piilotusmekanismiin:** `js/main.js` `updateSidebarState` (70–78) togglaa jo `sidebar.style.display`:n auth-ruudulle. Käytä samaa ideaa, mutta laajenna kattamaan koko chrome (topbar + sidebar + mobile-nav).

**Nykyinen vaihejärjestys (`STAGE_ORDER`, onboardingV4.js:31–40):**
`intro` → `test` (taso-arvio) → `biography` → `summary` → `account` → `choice`.
(`courses` ja `textbook` -vaiheet ovat jo kuolleita/saavuttamattomia L-V398:n jäljiltä — älä elvytä niitä.)

**Screen-id:t:** `screen-ob-v4-intro` (413–432), `-test`, `-biography`, `-summary`, `-account` (526–556), `-choice` (558–620).

**Taustakysymykset (jo olemassa, `#ob-v4-bio-form`):** kolme radio-kysymystä:
- `home_usage` — "Puhutko kieltä kotona?" (Kyllä / Vähän / En)
- `lived_abroad` — "Oletko asunut maassa jossa kieltä puhutaan?" (Yli vuoden / 1–12 kk / Lyhyitä lomamatkoja / En)
- `frequency` — "Kuinka usein olet käyttänyt kieltä viimeisen vuoden aikana?" (Päivittäin / Viikoittain / Kuukausittain / Hyvin harvoin)

**Tier-valinta (jo olemassa, `#screen-ob-v4-choice`, `wireChoice` 736):** Kurssi 49 € / Treeni 9 €/kk / "Jatka ilmaisena". `beginCheckout()` (757–764) → Stripe stub (503 → graceful "Maksaminen aukeaa pian" -tila `#ob-v4-choice-status`). **Jätä Stripe-polku ennalleen** — se on tietoisesti stubattu.

**Tili-gate (jo olemassa, `#screen-ob-v4-account`, `submitAccount` 642):** nimi + email + salasana, `POST /api/auth/register`, sitten `setAuth` + `flushDiagnosticToAccount` + `markOnboardingComplete`. "Jatka ilman tiliä" = `#ob-v4-acct-skip`.

**Kielivalinta:** nykyään intro-ruudulla (`#ob-v4-lang`, `data-lang` es/de/fr). Sovellus tarvitsee kielen → säilytä kielivalinta jossain ennen taustakysymyksiä.

---

## UUSI FLOW (toteuta tämä)

```
1. Tervetulo-ruutu   (uusi headline + subteksti, kielivalinta es/de/fr, yksi CTA)
2. Taustakysymykset  (3 olemassa olevaa radio-kysymystä, visuaalisesti viimeistelty)
3. Tier-valinta      (ilmainen / treeni / kurssi — logiikka ennallaan)
4. Kirjautuminen     (tili-gate ennallaan; "ilmainen" voi mennä suoraan appiin ilman tiliä jos niin halutaan)
→ appiin
```

**Poistettavat vaiheet tästä flowsta:**
- **`test` (taso-arvio):** poista `intro`-ruudun "Aloita taso-arvio"/"Ohita kokonaan" -napit ja `test`-vaihe `STAGE_ORDER`:n elävältä polulta. **ÄLÄ poista** `js/features/miniYO.js`-engineä äläkä `routes/onboarding.js`-backendiä — ne jäävät käyttöön myöhempää (oston jälkeistä) taso-arviota varten. Vain irrota taso-arvio onboarding-flow'sta. Jätä `wireTest`/`renderTest`/`showCurrentQuestion`/`advanceTestPart`/`showWritingPart` koodiin, mutta varmista ettei niihin enää reititetä onboardingista.
- **`summary`:** nykyinen yhteenveto ("3 viikon suunnitelma") nojaa taso-arvion dataan, joka nyt poistuu. **Päätä itse** impeccablen `shape`-vaiheessa: joko poista `summary` elävältä polulta (biography → choice suoraan), tai korvaa kevyellä taustavastauksiin perustuvalla siltaruudulla jos se nostaa konversiota. ÄLÄ jätä taso-arvio-riippuvaista yhteenvetoa pystyyn. Älä lupaile tasoa jota ei mitattu.

**Vaihenumerointi:** päivitä "Vaihe x/4" -merkinnät vastaamaan uutta lyhyempää flowta (esim. 1/3, 2/3, 3/3).

---

## PORTAALI-VAATIMUKSET

1. **Fullscreen, oma pinta.** Kartoitus peittää koko ruudun. Piilota `app-topbar` (sis. `#menu-toggle`), `app-sidebar` ja `#mobile-nav` koko kartoituksen ajan. Mekanismi vapaa (esim. body/shell-luokka `kartoitus-active` joka piilottaa chromen + nostaa V4-pinnan `position: fixed; inset: 0`). Poista luokka kun kartoitus päättyy.
2. **Ei pääse pois kesken.** Ei nav-chromea, ei hampurilaista, ei avataria flow'n aikana. Ainoa pysyvä chrome = puheo-brändi (tiililogo, oikein väritettynä `css/tokens.css`:n `--brick`/`--brick-ink`:stä). Navigointi tapahtuu vain flow'n omilla napeilla (eteenpäin / takaisin edelliseen vaiheeseen).
3. **Reuna-tapaukset:**
   - Kirjautunut, onboardingin jo suorittanut käyttäjä `#/aloitus`-linkissä → **älä loukkuun jätä**: reititä `home`-näkymään (älä näytä tyhjää shelliä äläkä tuplachromea).
   - Selaimen takaisin-nappi kesken flow'n ei saa jättää käyttäjää puolikkaaseen shelliin.
   - Kun käyttäjä valitsee "ilmainen" tai suorittaa tilin → poista `kartoitus-active`, shell-chrome palaa, käyttäjä laskeutuu appiin.

---

## VISUAALI & BRÄNDI

- **Brändilähteet:** `css/tokens.css` (värit/tokenit, mm. `--brick #9B2D2A`, `--paper`, `--ed-bg`) + `docs/brand/design-system-worddive-2026-06.md`. Kohtele näitä DESIGN-kontekstina. (Voit ajaa `impeccable document` generoidaksesi DESIGN.md:n olemassa olevasta koodista, jos se auttaa, mutta lähde on tokens.css + brändidoc.)
- **Brändi-henki:** WordDive — lämpimät tasaiset värit (cream/brick/keltainen/vihreä), Fredoka + Mulish, EI gradientteja, EI italic-Fraunces, EI pure `#000`/`#fff` (lämmin musta/valkea).
- **Register:** product (UI joka palvelee tuotetta), mutta tämä on aktivointihetki → saa olla rohkeampi ja viimeistellympi kuin tavallinen app-ruutu.
- **Anti-slop (impeccablen lait + Marcelin kiellot):** ei identtisiä kortteja rivissä, ei side-stripe-borderia, ei gradient-textiä, ei glassmorphismia koristeena, ei mono-UPPERCASE-chipiä ilman syytä, ei "Ladataan…"-italicia. Jos lopputulos näyttää "AI teki sen" → uusiksi.

---

## COPY (uusi teksti — impeccablen copy-lait pätevät)

Korvaa nykyinen tervetulo-otsikko **"Räätälöidään sinun polkusi"** ja sen taso-arvio-subteksti. Uuden tekstin pitää sopia siihen että seuraavaksi tulee taustakysymykset (EI taso-arvio).

- **Ei em-dashia** (`—`), ei `--`. Pilkku/kaksoispiste/sulkeet.
- Ei AI-brändisanoja ("räätälöidään", "saumaton", "monipuolinen", "intuitiivinen").
- Jokainen sana ansaitsee paikkansa, ei otsikon toistoa subtekstissä.
- **Älä lupaa tasoa jota ei mitata** (taso-arvio poistui). Subteksti voi luvata että pari kysymystä auttaa aloittamaan sopivalla tavalla.

Suuntaa antavia (valitse/hio impeccablen `shape`-vaiheessa, älä lukitu sanatarkasti):
- Otsikko: *"Aloitetaan. Valitse kielesi."* / *"Tervetuloa. Mistä kielestä on kyse?"*
- Subteksti: *"Pari kysymystä taustastasi, niin osaamme aloittaa oikealta kohdalta. Vie alle minuutin."*

Taustakysymysten ja tier-valinnan tekstit ovat jo kunnossa — vain visuaalinen viimeistely.

---

## HYVÄKSYMISKRITEERIT

- [ ] `#/aloitus` (uloskirjautuneena) näyttää fullscreen-kartoituksen **ilman** sivupalkkia, hampurilaista, app-topbaria tai avataria.
- [ ] Flow-järjestys: tervetulo (kielivalinta) → taustakysymykset → tier-valinta → kirjautuminen. **Ei taso-arviota missään kohtaa.**
- [ ] Tervetulo-otsikko ei ole enää "Räätälöidään sinun polkusi"; ei em-dashia; ei AI-brändisanoja.
- [ ] Mobiilissa (390px) ei vaakavieritystä; pinta täyttää viewportin; tekstit eivät leikkaudu.
- [ ] Desktopissa (1280px) layout täyttää ruudun tasapainoisesti (ei orpoa keskityhjää, ei roikkuvaa lohkoa).
- [ ] Kielivalinta välittyy oikein appiin (es/de/fr) kuten ennenkin.
- [ ] Tier-valinta + Stripe-stub toimivat ennallaan (graceful 503-tila näkyy).
- [ ] Kirjautunut suorittanut käyttäjä `#/aloitus`-linkissä → reitittyy `home`-näkymään, ei tyhjää/tuplachromea.
- [ ] `npm run build` ajettu; `node --check` läpäisee muokatuille js-tiedostoille.
- [ ] `sw.js` `CACHE_VERSION` bumpattu (nykyinen v406 → seuraava) jos STATIC_ASSETS-tiedostot muuttuvat.

---

## VERIFIOINTI (impeccablen työkaluilla)

- `impeccable audit` muokatulle pinnalle (a11y / responsiivisuus / perf).
- Screenshotit 390px + 1280px (ennen/jälkeen): todista fullscreen, ei chromea, ei vaakavieritystä, tasapaino.
- Aja sovellus paikallisesti (`npm run dev`) ja kävele flow läpi: tervetulo → bio → tier → tili. Todenna OMILLA silmillä/työkaluilla, älä jätä Marcelin testattavaksi.
- 0 uncaught console-erroria flow'n läpi.

---

## RAJAUS — mitä EI tehdä tässä briefissä

- ❌ Taso-arvio-enginen (`miniYO.js`) tai backendin poisto. Vain irrotus onboarding-flow'sta.
- ❌ Oston jälkeinen taso-arvio. → menee adaptiivisen algon backend-briefiin (myöhemmin).
- ❌ Oppimispolun kurssilukko. → oma brief L-V409.
- ❌ Päivitä-sivu / alennukset. → odottaa Stripe-liveä.
- ❌ Mikään `routes/`- tai `supabase/`-muutos.
