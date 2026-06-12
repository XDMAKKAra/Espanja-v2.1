# L-V396 — Zombie-koodin tappo: poista kilpailevat/kuolleet koodipolut

**Rooli:** WRITER. Tämä on siivous-loop, ei feature. Vähemmän kilpailevia koodipolkuja = vähemmän yllätysbugeja kun Marcel asuu appissa 2 kk kk:n päästä.

**Skill-stack (kutsu ENNEN ensimmäistä Write/Edit/Bash):** `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. Jos kosket DB-tauluun/migraatioon → lisää `supabase`, `supabase-postgres-best-practices`.

---

## Konteksti & miksi nyt

Useassa loopissa on kasaantunut kuollutta ja **kilpailevaa** koodia. Kilpailevat state-systeemit ovat **dokumentoitu juurisyy menneille tuotantobugeille** (L-V388 MC-väribugi = kolme kilpailevaa state-systeemiä + cascade). Marcel alkaa dogfoodata appia ~kk:n päästä 2 kuukautta — jokainen elossa roikkuva zombie on potentiaalinen yllätysbugi kesken opiskelun. Tämä loop poistaa ne **ennen** kuin hän luottaa appiin.

**Tämä on poisto-loop. Kovin riski on poistaa jotain joka onkin saavutettavissa.** Siksi: todista kuolleisuus ENNEN poistoa, ja aja täysi regressio JÄLKEEN.

---

## Tunnetut zombiet (muistista — verifioi kukin ennen poistoa)

1. **`learningPath.js` kuollut**, MUTTA tasokoe-frontend jakaa sen kanssa `screen-mastery`-markupin → poisto on deferrattu juuri tämän kytköksen takia (L-V392). **Pura kytkös ensin, sitten poista.**
2. **Mastery-testi unreachable** — ei sisäänkäyntiä/nav-linkkiä. Adaptiivinen on kanoninen `lib/levelEngine.js` + `user_level`/`user_mastery` kautta. Päätä: poista mastery-test-koodi (suositus, koska unreachable + ei-kanoninen) vai kytke. Älä jätä kolmatta tilaa.
3. **curriculum/learningPath-zombie** (L-V394 deferrasi) — selvitä mikä `curriculum`-polku on elossa (oppimispolkuIndex.js/courseDetail.js elävät, learningPath.js kuollut — vrt. L-V388 muisti) ja poista kuollut.
4. **`user_level_progress` phantom** — taulua EI ole, ÄLÄ luo uudelleen. V392 siivosi reittiviittaukset; **verifioi ettei yhtään elävää koodiviittausta ole jäljellä** (grep `user_level_progress` koko repossa → 0 osumaa paitsi kommentit/migraatiohistoria).

---

## Työtapa (pakollinen järjestys)

### Vaihe 0 — BASELINE: aja selkäranka vihreäksi ENNEN mitään poistoa
- **Aja V392:n selkäranka-Playwright vihreänä** (uusi käyttäjä → kartoitus → taso → kurssi → tehtävät → reload + logout + relogin → kaikki data paikallaan oikealla kielellä). **Jos se ei mene vihreäksi nyt, se on P0 — korjaa ensin, älä poista mitään rikkinäisen päälle.** Tämä on samalla regressioverkkosi.
- Aja `tests/verify-isolation.mjs` vihreäksi (cross-user/-language-eristys).
- Aja `npm test` (vitest) + olemassa olevat Playwright-smoke-spec:it → tallenna baseline-vihreä.

### Vaihe 1 — TODISTA kuolleisuus (per zombie, ei oletuksia)
Jokaiselle yllä olevalle: grep entry-pointit, route-mountit, nav-data-attribuutit, importit, `#screen-*`-hashit. Kirjaa `docs/briefs/L-V396-DEAD-CODE-PROOF.md`: mikä viittaa mihin, ja miksi kohde on saavuttamaton. **Jos jokin osoittautuu eläväksi → älä poista, kirjaa ja jätä.**

### Vaihe 2 — PURA kytkökset, sitten POISTA
- Tasokoe ⇄ learningPath `screen-mastery`-markup: eriytä tasokokeen tarvitsema markup omakseen (kopioi tarvittava, älä jaa kuolleen kanssa), sitten poista `learningPath.js` + sen kuollut markup/CSS.
- Mastery-test: poista (tai kytke, jos päätit niin) — yksi tila, ei kahta.
- curriculum-zombie: poista kuollut haara.
- Poista per zombie omana committina (helppo perua jos regressio).

### Vaihe 3 — REGRESSIO: todista ettei mikään rikkoutunut
- Aja Vaihe 0:n koko vihreä-setti UUDELLEEN (selkäranka + isolation + vitest + smoket). Kaikki yhä vihreä = poisto turvallinen.
- Klikkaa Playwrightilla läpi: koti, tehtävät (vocab/grammar/reading), oppimispolku, kurssidetalji, profiili, digikirja, tasokoe (jos jätit sen elossa) → ei tyhjää ruutua, ei JS-konsolivirhettä, ei kuollutta nappia.

---

## Acceptance criteria
- [ ] `L-V396-DEAD-CODE-PROOF.md`: jokainen poistettu kohde todistettu saavuttamattomaksi ennen poistoa.
- [ ] Selkäranka-Playwright vihreä SEKÄ ennen että jälkeen (baseline + regressio). Jos ei ollut vihreä alussa → korjattu P0:na, kirjattu.
- [ ] `learningPath.js` poistettu + tasokoe toimii omalla markupillaan (ei jaettua kuollutta).
- [ ] Mastery-testi: yksi tila (poistettu tai kytketty), ei kolmatta zombie-tilaa.
- [ ] `grep user_level_progress` → 0 elävää koodiviittausta (vain kommentit/migraatiohistoria sallittu).
- [ ] `verify-isolation.mjs` + `npm test` + smoke-spec:it vihreät jälkeenpäin.
- [ ] Full-app Playwright-klikkaus: ei tyhjää ruutua / konsolivirhettä / kuollutta nappia.
- [ ] `node --check` muokatuille js-tiedostoille; `npm run build` jos frontti-bundlea kosketettu (+ `sw.js` CACHE_VERSION bump jos STATIC_ASSETS muuttui).
- [ ] IMPROVEMENTS.md +1 rivi; deferratut (jos jokin osoittautui eläväksi) kirjattu.

## TULOS (2026-06-06) — kaikki 4 zombieta jo kuolleita, ei poistoja

Täysi todistus: `docs/briefs/L-V396-DEAD-CODE-PROOF.md`. Tiivistys:
- **Vaihe 0 (Marcelin P0):** selkäranka `verify-backbone.mjs` **15/15 ALL PASS** (ei rikki), isolation ALL PASS, vitest **1286/1286**.
- **Vaihe 1:** grep todisti kaikki 4 zombieta jo poistetuiksi/puhtaiksi (L-V392 P1-1 + L-V394c/d/e). 0 elävää koodiviittausta — jäljellä vain kommentit + migraatiohistoria. Tasokoe itsenäinen (`#screen-placement-test/-results`, ei jaa kuollutta `screen-mastery`-markupia).
- **Vaihe 2:** ei poistettavaa.
- **Vaihe 3:** uusi `tests/verify-clickthrough.mjs` (kirjautunut PRO, 12 reittiä) = **0 JS-virhettä, 0 tyhjää ruutua**, yksikään reitti ei päädy tapettuun `#screen-path`:iin.
- **Ei koodimuutosta → ei pushia** (verify-skriptit = tests/* = Claude-internal).

## Push-rajat
- Poisto voi muuttaa käyttäjälle näkyvää (kuolleet napit/ruudut katoavat) → **push OK** kun regressio vihreä + build ajettu.
- Ei uusia featureita. Jos löydät bugin elävässä polussa, kirjaa erikseen, älä korjaa tässä (paitsi Vaihe 0:n selkäranka-P0).
- 3. strike samasta zombiesta → restrukturoi rakenne, älä band-aidaa.
