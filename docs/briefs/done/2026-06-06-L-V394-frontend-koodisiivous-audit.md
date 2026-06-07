# L-V394 — Frontend-koodisiivous AUDIT (read-only, ei korjauksia)

**Rooli:** WRITER. Tämä on **pelkkä audit** — sama kaava kuin L-V392 backend-auditissa, mutta frontille. **EI yhtään koodimuutosta.** Output = yksi priorisoitu löydöstiedosto. Lue koko brief ennen kuin aloitat.

**Skill-stack (kutsu ENNEN ensimmäistä Write/Bash):** `webapp-testing` (TESTING-L = koko audit), `superpowers:systematic-debugging` (juurisyy-jäljitys). Lukeminen (Read/Grep/Glob/graphify) on sallittu ennen skillejä.

---

## Miksi nyt, ja mitä tämä EI ole

L-V392 backend-audit paljasti kuolleen "haamutaulun" (`user_level_progress`) jota 5 tiedostoa viittasi vaikka taulua ei ole, + kaksi kilpailevaa tasokoe-järjestelmää joista toinen oli kuollut. Sama mätä on todennäköisesti frontendissä, koska se on koko koodikannan heikoin alue: kuollut koodi kasautuu, samalle vastuulle on monta systeemiä, ja siivous jää koska uusia ominaisuuksia kasataan päälle.

**Tämän auditin ainoa tehtävä: kartoittaa mitä siellä OIKEASTI on, mustaa valkoisella.** Et korjaa mitään. Et kirjoita uusiksi. Et tee framework-migraatiota. Tuotos on lista, jonka jokainen rivi on oma tuleva pieni loop. Marcel päättää listan nähtyään mitkä 2-3 pahinta korjataan nyt ja mikä jää kesän matalaan sesonkiin.

**Periaate:** halpa kartoitus > kallis arvaus. Älä korjaa, älä siivoa, älä "samalla kun olen täällä". Vain kartoita ja luokittele.

---

## Mitä kartoittaa (viisi kategoriaa)

### 1. Kuolleet tiedostot
Frontend-JS-tiedostot (`js/**/*.js`) joita ei importata mistään / joihin ei viitata. Esim. juuri poistettu `js/screens/adaptive.js` oli tällainen. Tarkista myös `lib/`-puolelta: `lib/adaptive.js` jäi L-V392:ssa kuolleeksi (pure-funktioita, ei kutsujia) — vahvista ja listaa.

### 2. Haamut (refs olemattomaan)
Koodi joka viittaa tauluun / funktioon / endpointiin / DOM-id:hen jota ei ole olemassa. Backend-puolella tämä oli `user_level_progress`. Frontendissä etsi:
- `apiFetch`/`fetch`-kutsut endpointteihin joita ei ole `routes/`:ssa (esim. /api/adaptive/* on nyt poistettu — onko frontissa vielä kutsuja?).
- `$("joku-id")` / `querySelector` DOM-id:hin joita ei ole `app.html`:ssä.
- importit funktioihin/moduuleihin joita ei ole.

### 3. Kilpailevat systeemit (sama vastuu kahdessa paikassa)
Tämä on arvokkain kategoria. Kohdat joissa kahdella systeemillä on sama vastuu → bugit, sekaannus, "korjasin mutta ei näy". Tunnetut epäilyt (vahvista + etsi lisää):
- **Oppimispolku:** `js/screens/oppimispolkuIndex.js` + `courseDetail.js` (elävät) vs `js/screens/learningPath.js` (V388-muistion mukaan kuollut). Kumpi on kanoninen? Onko learningPath.js oikeasti kuollut vai elääkö osa?
- **Tasokoe / mastery:** L-V392 poisti legacy-tasokoen. Varmista ettei jäänyt orpoja viittauksia, ja että kanoninen `learningPath.js`-mastery (screen-mastery-intro/result + /api/mastery-test/*) on ainoa jäljellä.
- **State-hallinta yleisesti:** montako "totuuden lähdettä" sovelluksen tilalle on? (`state.js`, localStorage-avaimet, DOM-attribuutit, per-screen-muuttujat). Listaa päällekkäisyydet. V388-muisti mainitsi "3 kilpailevaa state-systeemiä" — paikanna ne.

### 4. app.js / app.html -monoliitti
`app.js` (2300+ riviä) ja `app.html` (2500+ riviä) ovat isoja. Älä ehdota uudelleenkirjoitusta. Sen sijaan listaa: mitkä näytöt/logiikat ovat vielä inline `app.js`:ssä jotka kuuluisivat omaan `js/screens/`-tiedostoonsa (irrotus on jo aloitettu, kartoita mitä jäljellä). Anna konkreettinen irrotuslista, ei "refaktoroi kaikki".

### 5. CSS-kerroskonfliktit
Useita päällekkäisiä tyylikerroksia jotka taistelevat. Tunnettu: `css/app-old-spain.css` remappaa muuttujia (esim. `--success`→oliivi, `--error`→terrakotta, V388-muistion MC-väribugin juurisyy). Listaa kohdat joissa CSS-cascade tuottaa yllätyksiä: muuttujien uudelleenmäärittelyt, `!important`-sodat, samaa elementtiä stylaavat kilpailevat selektorit eri tiedostoissa.

---

## Työtapa

1. **Käytä graphify-tietograafia ensin** cross-module-kyselyihin (`graphify query "..."`, `graphify explain "..."`, `graphify-out/wiki/index.md`). Se on tehty juuri tähän: "mikä viittaa mihin", "mitä on kytketty / mikä on orpo". Säästää kymmeniä file-lukuja. Ks. `graphify-out/GRAPH_REPORT.md` god-nodeille + kuolleille saarille.
2. **Grep/Glob** importtien ja viittausten jäljitykseen.
3. **Build-introspektio:** `npm run build` tuottaa bundlen + chunkit. Kuollut koodi joka ei päädy bundleen on vihje. Vertaa `js/`-lähteitä siihen mitä bundlaantuu.
4. **Runtime-orpo-tarkistus (kevyt Playwright):** lataa app gate-bypassilla, kerää console-virheet, ja tarkista että jokainen `screen-*`-div app.html:ssä on jonkin koodipolun saavutettavissa (orvot screenit = kuolleet). Sama smoke-kaava kuin L-V392:ssa.
5. **Max 3 tutkimuskierrosta per epäselvä kohta**, sitten merkitse "epävarma, vaatii lisätutkintaa" äläkä jää luuppiin.

---

## Output

Yksi tiedosto: **`docs/briefs/L-V394-FRONTEND-AUDIT-FINDINGS.md`**. Rakenne kuten L-V392-AUDIT-FINDINGS:
- Tiivistelmä-taulukko: montako löydöstä per kategoria + vakavuus.
- Vakavuusasteikko tekniselle velalle (ei security-P0, vaan):
  - **V0** = aktiivinen bugi tai rikki käyttäjälle näkyvä toiminto (korjaa heti, oma loop).
  - **V1** = kilpaileva systeemi / haamu joka aiheuttaa bugeja tai hidastaa kehitystä merkittävästi (korjaa kevään aikana jos ehtii, muuten kesä).
  - **V2** = siivous joka ei aiheuta bugeja, hidastaa vain vähän (kesän matala sesonki).
- Jokainen löydös: tiedosto(t) + rivit, oire, vakavuus, **ehdotettu yhden-loopin korjaus** (yksi virke), ja arvioitu koko (S/M/L).
- **Erillinen "Verifioitu kunnossa" -lohko** (mitä tarkistettiin eikä ollut ongelmaa) — luottamus + ettei sama tarkisteta uudestaan.
- Loppuun **ehdotettu prioriteettijärjestys**: mitkä 2-3 V1:tä kannattaa tehdä ensin (eniten bugeja / eniten kehitystä hidastavat), mikä jää kesään.

**Pysähdy tähän. Näytä Marcelille. ÄLÄ korjaa mitään.** Marcel priorisoi listan ja käynnistää korjaukset omina looppeinaan.

---

## Acceptance criteria
- [ ] `docs/briefs/L-V394-FRONTEND-AUDIT-FINDINGS.md` olemassa, viisi kategoriaa katettu.
- [ ] Jokainen löydös: tiedosto+rivit, oire, V0/V1/V2, yhden-loopin korjausehdotus, kokoarvio.
- [ ] Kuolleet tiedostot listattu konkreettisilla poluilla (ei "joitakin tiedostoja").
- [ ] Kilpailevat state-systeemit nimetty (V388:n "3 systeemiä" paikannettu tai kumottu).
- [ ] app.js-irrotuslista konkreettinen (mitkä näytöt, mihin tiedostoon).
- [ ] "Verifioitu kunnossa" -lohko + ehdotettu prioriteettijärjestys (2-3 ensin, loput kesään).
- [ ] **0 koodimuutosta.** Vain findings-tiedosto. (Saa ajaa `npm run build` + Playwright-smoke lukemista varten, mutta ei muuta lähteitä.)

## Push-rajat
- Audit = Claude-internal. **Ei Vercel-pushia, ei koodicommittia** (findings-tiedoston voi committaa lokaalisti, ei pushata).
- Ei migraatioita, ei Stripe-toimia.

## Skopen ulkopuolella (älä tee)
- ÄLÄ korjaa löydöksiä (oma loop per korjaus).
- ÄLÄ ehdota tai aloita framework-migraatiota (React tms.).
- ÄLÄ uudelleenkirjoita app.js:ää / app.html:ää.
- ÄLÄ koske backendiin (L-V392 hoiti sen).
- ÄLÄ tee design-/visuaalimuutoksia — tämä on rakenteen kartoitus, ei ulkonäkö.
