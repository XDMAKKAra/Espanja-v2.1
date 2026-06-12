# L-V413 — Appi-puolen redesign: Fable-promptit

Ajotapa: kopioi **yksi lohko kerrallaan** uuteen Fable-chattiin (Fable 5). Fable muokkaa OIKEAA koodia suoraan (ei demoa). Jokainen lohko on itsenäinen.

**Fable ajaa itsenäisesti — EI subagentteja (ei Task/Agent-toolia). Tee työ itse pääloopissa.**

**Sivupalkki on käyttäjän piilotettavissa** kirjoitus- ja koesimulaatio-näytöissä (FAB-toggle alavasemmalla → `.app-shell[data-sidebar-collapsed="true"]`, `.app-main` venyy `grid-column: 1 / -1`). Redesignisi pitää reflowata SIISTISTI molemmissa tiloissa (sivupalkki näkyvissä JA piilossa). Sisältö ei saa warpata kun sivupalkki avataan/piilotetaan — testaa molemmat tilat ennen kuin sanot valmis.

## Yhteinen konteksti (Fable lukee tämän osana jokaista lohkoa)

Puheo = espanjan/ranskan/saksan YO-valmennusappi suomalaisille lukiolaisille. Vanilla JS + CSS, ei frameworkkia. App = `app.html` (SPA, screen-switching) + `js/screens/*.js` (per-screen-logiikka) → bundlataan `npm run build`:llä `/app.bundle.js`:ään. Per-screen CSS `css/components/*.css`.

**Design-kieli (warm paper, EI muuta):** paletti cream `#F6EEDC`, paper `#FCF7EB`, ink `#33271F`, ink-soft `#6E5B4D`, brick `#9B2D2A`, gold `#F2B43A`, green `#3F7D4E`. Fontit Fredoka (otsikot) + Mulish/Inter (leipä). Pyöristykset 12–16px, pehmeät lämpimät varjot. Kanoninen "hyvä" look: `css/landing-v2-nav.css`, `css/components/onboarding-v4.css`, ja juuri shipattu onboarding-feedback-ruutu.

**KIELLETTY (automaattinen hylkäys):** em-dash (—) suomessa, italic-Fraunces, 3–4 identtistä korttia rivissä, mono-UPPERCASE-eyebrowt ilman syytä, gradient-text, glassmorphism, pure `#000`/`#fff`, "Ladataan…"-italic, tyhjä `—` mittarissa, geneerinen AI-paletti. Suomi-teksti AINA humanizer-sääntöjen läpi (ei "kalibroitu/intuitiivinen/saumaton", ei sycophantic-aloituksia, ei keksittyjä %-lukuja). Lue `CLAUDE.md` täydet säännöt.

**Työtapa:** aja `npm run dev` (portti 3000) ja katso nykytila selaimella/Playwrightilla ENNEN muutosta. Muutoksen jälkeen `npm run build`, verifioi Playwrightilla (gate-bypass: `localStorage puheo_gate_ok_v1=1`), ÄLÄ sano valmis ennen kuin näit sen toimivan. Testitili `testpro123@gmail.com`.

---

## LOHKO 1 — Register-sivu (uusiks)

Tiedostot: `js/screens/auth.js` + `app.html`:n auth-screen-markup + auth-CSS.

Nyt uusi käyttäjä päätyy kirjautumis-näkymään (login), vaikka hänellä ei ole tiliä. Tee **erillinen, siisti rekisteröitymissivu** (luo tili): nimi/sähköposti/salasana, selkeä "Luo tili" -CTA, ja pienempi sekundäärilinkki "Onko sinulla jo tili? Kirjaudu sisään" joka vie login-näkymään. Login-näkymässä vastaava "Eikö tiliä? Luo tili" toiseen suuntaan.

Pidä: olemassa oleva auth-backend-logiikka (register/login-API-kutsut, validointi, virheviestit) ENNALLAAN — muokkaa vain UI/markup/CSS ja näkymien välinen reititys. Älä riko Supabase-auth-flowa.

Acceptance: uusi käyttäjä näkee register-sivun (ei login), voi vaihtaa login↔register yhdellä klikillä, warm-paper-design, mobiilissa <440px ei vaakavieritystä, humanizer-pass kaikki teksti.

---

## LOHKO 2 — Digikirja-oppitunnin lukija (redesign, sama layout)

Tiedosto: `js/screens/digikirja.js` (digikirja-reader, chunk `app-digikirja`) + sen CSS.

Ruutu: oppitunnin teoriasivu (esim. "-ar-verbit preesensissä"), vasemmalla sisällys-sidemenu (Opetus + Harjoitukset 1..N + flashcards), oikealla teoriasisältö + esimerkkitaulukko, ylhäällä punainen topbar + "X / N valmis" -pilleri.

Tehtävä: **pidä sama layout ja rakenne**, tee siitä paljon hienompi ja siistimpi. Parempi typografinen hierarkia, ilmavampi spacing, taulukon (persoona/muoto) tyylittely warm-paperiin, sidemenu-itemien selkeämpi aktiiv/valmis-tila, topbarin viimeistely. EI uutta sisältöä, EI layout-mullistusta.

Pidä: sidemenu-rakenne (1 teoria + N phases + flashcards), navigointilogiikka, progress-laskenta ENNALLAAN.

Acceptance: sama informaatioarkkitehtuuri, selvästi viimeistellympi visuaali, mobiilissa sidemenu toimii, ei AI-slopia.

---

## LOHKO 3 — Kirjoittamisen tehtävävalitsin (redesign + siivous)

Tiedosto: `js/screens/writing.js` (chunk `app-writing`) + CSS.

Ruutu: "Aloita Sekaisin-aiheella…" + Tehtävätyyppi (Lyhyt/Laajempi tehtävä, pisteet + merkkimäärä) + Aihe-lista (Sekalaiset/Ympäristö/Ihmissuhteet/Matkailu/Kulttuuri/Työ). Vasemmalla sivupalkki jossa kurssi/oppitunti-lista.

Kaksi asiaa:
1. **Redesign**: tehtävätyyppi- ja aihe-valinnat siistimmiksi, selkeämpi valittu-tila, ilmavampi. Pidä sama valintalogiikka.
2. **Siivoa vasen sivupalkki**: siellä on sekavia/turhia itemejä (kurssi-oppituntilista kirjoitusnäkymässä). Marcel: "en tiiä mitä noi jutut tuol vasuris on, ota ne vittuu." Selvitä mitkä sivupalkin elementit eivät kuulu kirjoitusnäkymään ja poista/piilota ne — kirjoitusmoodissa sivupalkin pitää näyttää vain relevantti, ei koko kurssirunko.

Acceptance: valitsin näyttää siistiltä, vasemmalta poistettu epärelevantti, valintalogiikka ehjä, humanizer-pass.

---

## LOHKO 4 — Koesimulaatio (redesign)

Tiedosto: `js/screens/fullExam.js` (chunk `app-fullExam`) + CSS.

Koko YO-koesimulaatio: osiot, ajastin, tehtävänäkymät, palautus/arviointi. Redesign warm-paperiin: selkeä koetilan tunnelma (rauhallinen, keskittynyt), hyvä osio/edistymis-indikaatio, luettavat tehtäväkortit, viimeistelty palautus- ja tulosnäkymä.

Pidä: koelogiikka (osiot, pisteytys, ajastin, tallennus) ENNALLAAN — vain visuaali.

Acceptance: koe toimii alusta loppuun, näyttää viimeistellyltä eikä raa'alta, mobiilissa käytettävä, ei AI-slopia.

---

## Jo tehty (Claude Code, shipattu 2026-06-12) — älä tee uudestaan

- ✅ **Sivupalkin piilotus** kirjoitustehtävässä JA koesimulaatiossa: FAB-toggle, `sidebarShell.js` + `app-shell.css`. Fable: säilytä + tyylittele, varmista reflow (ks. yllä).
- ✅ **Onboardingin pricing** = pikselikopio landingista (choice-step valmis).
- ✅ Nav keskitetty, onboarding-race-bugi, onboarding-feedback-flow.
