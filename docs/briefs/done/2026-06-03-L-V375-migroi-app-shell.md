# L-V375 — Migroi app-shell systeemiin (oppimispolku, kurssisivut, app.html-näkymät) — RISKEIN, VIIMEISENÄ

**Päivä:** 2026-06-03
**Prioriteetti:** P2 — yhtenäisyys, KORKEIN regressioriski (toiminnallinen SPA).
**Rooli:** writer (Claude Code)
**Skill-stack:** FRONTEND-L + TESTING-L → `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `superpowers:verification-before-completion`
**Riippuvuus:** **V371–V374 ensin.** Aja vasta kun staattiset sivut ovat varmasti kunnossa.

## Orkestraatio (token-budjetti)
Koordinaattori-malli, mutta tämä on korkein riski → enemmän Opusta, vähemmän aggressiivista delegointia logiikkaa lähellä. Subagentit palauttavat tiiviit tulokset + node --check -status.
**Malli per tehtävä:** triviaali → Haiku, standardi → Sonnet, vaikea/riskialtis → Opus.
**Tämä vaihe:** **Opus koko ajan** (toiminnallisuuden rikkomisriski). Tyyli-only-luokkavaihdot voivat olla Sonnet, mutta mikä tahansa joka koskee app.html-rakennetta/näkymänvaihtoa → Opus. Regressio-testaus erillisellä **webapp-testing-subagentilla** per päänäkymä (Sonnet riittää testiajoon).

---

## Tavoite
Tuo kirjautunut app-puoli (app.html SPA + js/screens/*) samaan Tailwind-systeemiin. Tämä on migraation viimeinen ja **riskein** vaihe: app.html on toiminnallinen 2300+ rivin vanilla-SPA jossa click-handlerit, state ja näkymänvaihto. Visuaalinen muutos EI saa rikkoa toiminnallisuutta.

## Konteksti / varovaisuus
Marcel: oppitunnit näyttävät jo OK — **älä riko niitä.** Tavoite on johdonmukaisuus jaettujen komponenttien kanssa, ei oppituntien uudelleensuunnittelu. Käytä kevyttä kättä. Jos jokin näkymä toimii ja näyttää OK, älä koske sen logiikkaan, vaihda vain tyyliluokat tokeneihin.

## Näkymät
- App-shell: sivupalkki (Koti/Tehtävät/Profiili), logo, aktiivi-pill
- Koti-dashboard, Oppimispolku, Kurssisivut, Profiili, Asetukset
- Tehtävänäkymät (sanasto/kielioppi/luetun ymmärtäminen/kirjoittaminen/käännä lauseet)
- Kirjautuminen/rekisteröinti jos ne ovat app.html:n sisällä (V374:stä siirtynyt)

## Tehtävät
1. Vaihda app-shellin tyylit jaettuihin komponentteihin + tokeneihin (V372). Sama nappi/kortti/pilli-kieli kuin muualla.
2. **ÄLÄ koske click-handlereihin, state-logiikkaan tai näkymänvaihtoon.** Vain tyyliluokat.
3. Harkitse preflightin käyttöönottoa (V371 jätti sen pois) VAIN jos kaikki muu on migroitu ja testattu — muuten jätä pois.
4. Korjaa samalla aiemmin raportoidut app-visuaalibugit jos yhä auki (sidebar-active-state, tyhjä Koti-desktop) — mutta vain jos ne eivät ole jo korjattu V362/V364/V366:ssa.
5. `node --check` jokaiselle muutetulle js/screens/*.js (parse-virhe rikkoo kaikki handlerit).

## Acceptance
- App-puoli näyttää johdonmukaiselta muun sivuston kanssa, oppitunnit yhä OK.
- **Kaikki toiminnallisuus ennallaan:** Playwright-regressio kaikille päänäkymille + kriittisille poluille (kirjautuminen, oppitunnin suoritus, tehtävän teko, navigointi). Ei konsoli-virheitä.
- `npm run build` PASS, `node --check` kaikki muutetut, sw.js CACHE_VERSION bump.
- Ei vaakavieritystä 390px.
- Screenshot-vertailu kaikista päänäkymistä ennen/jälkeen.

## Ulkopuolella
Uudet featuret. Oppituntien sisältö/logiikka. Tämä on pelkkä tyyli-migraatio toiminnallisuus säilyttäen.
