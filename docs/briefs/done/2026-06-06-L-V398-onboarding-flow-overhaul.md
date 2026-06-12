# L-V398 — Onboarding/kartoitus-flow remontti (konversio-kriittinen)

**Rooli:** WRITER. Iso FRONTEND-L + yksi P0-logiikkabugi. Marcel dogfoodasi koko kartoitus-flow'n ja löysi 6 ongelmaa. **Tämä flow on appimme tärkein konversiopiste** ("jos se suoritetaan hyvin, asiakkaat ostavat") — laatu ratkaisee.

**Skill-stack (kutsu ENNEN ensimmäistä Write/Edit/Bash):** `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend` (FRONTEND-L), `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. Käyttäjälle näkyvä suomi-microcopy → `humanizer`.

**Suhde L-V397:ään:** V397:n "Bugi 2" (re-trigger) on nyt VAHVISTETTU todelliseksi (ks. P0 alla) — tämä brief omistaa sen korjauksen. V397:n grading-pronomini-korjaus pysyy erillään.

---

## P0 — Kartoitus re-triggeröityy refreshillä vaikka se on suoritettu (RIKKI)

**Oire (Marcel, testdata):** suoritti kartoituksen → "Jatka ilmaiseksi" → heitti aloitusruutuun (OK) → **refresh → "räätälöidään polkusi" -ruutu aukesi uudelleen.** Pääsi pois vain klikkaamalla sivupalkista "Oppimispolku".

**Vaikutus:** käyttäjä joka on JO tehnyt kartoituksen jää loukkuun siihen joka latauksella. Tämä on sekä funktionaalinen rikki ETTÄ konversiotappaja (turhauttaa juuri ostohetkellä). **P0.**

**Korjaus:** kartoituksen laukeamisehto pitää nojata **persistoituun "kartoitus suoritettu" -merkkiin** (`user_onboarding_diagnostic` / `diagnostic_results` -rivi tai profiililippu), EI tyhjään tasoon / puuttuvaan dataan / client-tilaan joka nollaantuu refreshissä. Etsi `js/screens/onboarding.js` `checkOnboarding` + server-gate.

**Verifioi Playwrightilla:** uusi käyttäjä → kartoitus loppuun → "Jatka ilmaiseksi" → **refresh → EI kartoitusta, jää aloitusruutuun**; logout + relogin → sama. Vanha käyttäjä (tili ennen featurea) saa kartoituksen kerran, suorituksen jälkeen ei enää.

---

## Visuaaliset / UX-korjaukset (FRONTEND-L)

### 1. Luetun ymmärtäminen — näyttää puhelinversiolta työpöydällä (Image: reading screen)
**Oire:** desktopilla sisältö renderöityy kapeana mobiilipalstana, spacing rikki, "just ja just alas", ei käytä leveyttä. Näyttää siltä että mobiili-max-width on voimassa myös desktopilla.
**Korjaus:** kunnon desktop-layout — sopiva luku-leveys (ei koko 1900px mutta ei myöskään puhelinpalsta), tasapainoinen pystyspacing tekstilohkon ja kysymyskortin välillä, ei leikkaudu. Tarkista responsiivinen breakpoint: desktop ≠ mobiilirunko.

### 2. "Valitse käymäsi kurssit" + "En muista" -lista → POISTA KOKONAAN (Image: course checklist)
**Oire:** 8 kurssiriviä joissa jokaisessa "En muista" -nappi. Marcel: "maailman turhin asia, kaikki klikkaa En muista." Lisäksi redundantti — itsearvio tehdään jo "Pari kysymystä taustastasi" -vaiheessa.
**Korjaus:** poista koko tämä vaihe flow'sta. Älä korvaa millään — lyhyempi flow = parempi läpäisy. Päivitä vaihenumerointi (Vaihe X/Y) vastaamaan.

### 3. "Pari kysymystä taustastasi" — AI-slop fieldset-tyyli (Image: background radios)
**Oire:** radio-ryhmät `fieldset`+`legend`-reunoilla = geneerinen AI-slop-look. Otsikko leikkaa reunaviivan läpi.
**Korjaus:** uudelleentyylittele design-systeemiin: ei fieldset-border-legend-look. Käytä projektin korttipohjaa, selkeät kysymys-otsikot, segmented/pill-valinnat lämpimällä paletilla (vrt. tasokoe-pillit). Ei mono-uppercasea, ei kylmää harmaata.

### 4. "Polkusi on valmis" -tulosruutu — ei mahdu ruutuun, Jatka fold-rajan alla (Image: results)
**Oire (100% zoom, ei skrollia):** "Vaihe 5/5" ylhäällä just ja just, "Jatka" puoliksi näkyvissä. **Tämä on se ruutu joka myy** — sen pitää mahtua viewporttiin niin että Jatka näkyy ilman skrollia.
**Korjaus:** tiivistä pystysuunnassa — pienennä otsikon + korttien marginaaleja, harkitse vahvuudet/kehityskohteet rinnakkain (jo ovat 2 saraketta) + 3 viikon polku kompaktimmin. Tavoite: koko ruutu + Jatka-nappi näkyvissä 1080p-desktopilla ilman skrollia. Mobiilissa skrolli sallittu mutta Jatka selkeästi tavoitettavissa.

### 5. Tuotevalinta/pricing — "ruma luettelo" → kunnon pricing-osio (Image: pricing cards)
**Oire:** Kurssi 49€ / Treeni 9€ / Jatka ilmaisena näyttää listalta, ei myyvältä valikolta.
**Korjaus:** rakenna kunnon pricing-osio: selkeä hierarkia (Kurssi korostettu = suositeltu, Treeni toissijainen, Jatka ilmaisena hillitty exit), tasapainoinen korttispacing, feature-listat luettavina. Pidä kanoninen feature-sisältö (pricing.html). Ei identtistä korttiruudukkoa — eriytetty paino kuten nyt, mutta viimeistelty. Tämä on suora ostopäätös-ruutu, panosta.

### 6. "Maksaminen aukeaa pian" — pidä, mutta KOKO APPI Stripe-valmiina (Image: pending box)
**Oire/vaatimus:** graceful pending -tila on OK pitää. **MUTTA:** koko maksupolun pitää pysyä täysin valmiina niin että **Stripe kytketään vain päälle eikä muuta tarvitse tehdä.** Älä revi maksu-infraa pois. `beginCheckout` kutsuu oikeaa `/api/stripe/checkout-session`-endpointtia; kun Stripe livenä ja vastaus sisältää url:n → ohjaa hosted-checkoutiin; nyt 503/ei-url → siisti "Maksaminen aukeaa pian" + "Jatka ilmaisena" -exit. Varmista että tämä kytkentä on ehjä, ei pelkkä placeholder-nappi. **Stripe-dashboard/live-toimia EI tehdä (ei lupaa).**

---

## Acceptance criteria
- [ ] **P0:** kartoitus ei re-triggeröidy refreshillä/reloginilla suorituksen jälkeen (Playwright-todiste). Ehto persistoituun merkkiin.
- [ ] Luetun ymmärtäminen: desktop-layout, ei mobiilipalstaa, spacing tasapainoinen, ei leikkaudu.
- [ ] "Valitse käymäsi kurssit" -vaihe poistettu, vaihenumerointi päivitetty.
- [ ] Taustakysymykset: ei fieldset-legend-AI-slopia, design-systeemin mukainen.
- [ ] "Polkusi on valmis" + Jatka mahtuvat 1080p-desktop-viewporttiin ilman skrollia.
- [ ] Pricing-osio viimeistelty myyväksi valikoksi, ei "ruma luettelo".
- [ ] Maksupolku Stripe-valmis (checkout-endpoint kytketty, graceful pending kun ei livenä); ei Stripe-dashboard-toimia.
- [ ] Koko flow klikattu läpi Playwrightilla: ei tyhjää ruutua, ei konsolivirhettä, Jatka aina tavoitettavissa.
- [ ] AI-slop-check: ei italic-Fraunces väärässä, ei mono-uppercasea, ei em-dashia, ei identtistä korttiruudukkoa, lämmin paletti.
- [ ] `npm run build` + `sw.js` CACHE_VERSION bump (frontti-muutos); `npm test` vihreä; `node --check`.
- [ ] IMPROVEMENTS.md +1 rivi.

## Push-rajat
- Käyttäjälle näkyvä konversio-flow → **push Verceliin** kun valmis + build + Playwright vihreä.
- Stripe: vain koodi-valmius, ei live-toimia.
- 3. strike samasta spacing-bugista → restrukturoi layout-rakenne (älä band-aid pikseleitä).
```
HUOM scope: tämä on iso. Jos aika/konteksti loppuu, priorisoi: P0 (re-trigger) → #4 tulosruutu → #5 pricing → #2 poisto → #1 reading → #3 taustakysymykset. Konversiohetki (4,5) ennen kosmetiikkaa (1,3).
```
