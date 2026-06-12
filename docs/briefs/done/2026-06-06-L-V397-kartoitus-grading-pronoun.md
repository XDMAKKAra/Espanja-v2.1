# L-V397 — Kartoitus: hyväksy subjektipronomini gradingissa + varmista ettei jo tehnyt käyttäjä joudu uusimaan

**Rooli:** WRITER. Kaksi korjausta kartoitus-flow'hun (Marcel löysi dogfoodatessa).

**Skill-stack (kutsu ENNEN ensimmäistä Write/Edit/Bash):** `webapp-testing`, `superpowers:systematic-debugging`, `superpowers:verification-before-completion`. Grading-logiikka on backendissä → lisää `supabase` jos kosket DB-tilaan. Jos muutat suomi-microcopya → `humanizer`.

---

## Bugi 1 (P1) — grammar-grading hylkää validin subjektipronominin

**Oire (screenshot, kartoitus kysymys 9/15):**
- Tehtävä: "Täydennä oikealla muodolla: tausta keskeytyy. (caminar, yo)" → "____ por la calle cuando vi a Pedro." Verbi: caminar.
- Käyttäjä vastasi **"yo caminaba"** → merkattiin **"Ei vielä oikein"**, oikea vastaus "caminaba".

**Miksi väärin:** "yo caminaba" on täysin oikein espanjaa — subjektipronomini on valinnainen mutta ei koskaan virhe, ja tehtävänanto antaa itse "(caminar, **yo**)". YO-koeessa molemmat hyväksyttäisiin. Grader vertaa paljaaseen "caminaba"-merkkijonoon ja hylkää pronominin. Tämä on liian tiukka ja turhauttaa juuri sitä käyttäjää (Marcel) joka dogfoodaa 2 kk.

**Korjaus (intent, ei tarkka toteutus):** pedagoginen yksikkö on **verbimuoto** (imperfekti vs preteriti), EI pronomini. Normalisoi vastaus ennen vertailua: hyväksy vastaus jos se = odotettu verbimuoto TAI = "[tehtävän antama subjektipronomini] + odotettu". Käytännössä: strippaa johtava valinnainen subjektipronomini (yo/tú/él/ella/usted/nosotros/nosotras/vosotros/vosotras/ellos/ellas/ustedes) ennen trim+lowercase-vertailua. Säilytä olemassa oleva diakriitti-normalisointi jos on.

**Varo liikaa stripaamista:** jos jokin tehtävä testaa NIMENOMAAN pronomini+verbi-yhdistelmää (harvinaista tässä drillissä), älä riko sitä. Tässä drillissä pronomini annetaan tehtävänannossa → echo on aina ok. Pidä strippaus konservatiivisena (vain johtava pronomini + välilyönti).

**Missä:** grammar-drill-grading. Etsi `routes/exercises.js` (grammar grade) / `lib/`-grading. Sama normalisointi kannattaa kattaa vocab/grammar-täydennystehtävät joissa subjektipronomini voi esiintyä.

**Verifioi:** "yo caminaba", "caminaba", "Yo caminaba", " caminaba " → kaikki PASS. Väärä aikamuoto "caminé" / "yo caminé" → yhä FAIL (ei saa löysätä oikeellisuutta, vain pronomini). Lisää vitest näille.

---

## Bugi 2 (varmistus, P1 jos toteutuu) — joutuuko jo kartoituksen tehnyt käyttäjä uusimaan?

**Konteksti:** Marcelin tili on tehty ENNEN kartoitus-featurea, joten hänelle kartoitus tulee nyt = odotettua, ei bugi. **Mutta varmista ettei logiikka pakota uudelleen käyttäjää joka on JO suorittanut kartoituksen.**

**Tarkista:** `js/screens/onboarding.js` `checkOnboarding` (ja vastaava server-gate) — millä ehdolla kartoitus laukeaa? Pitää nojata persistoituun "kartoitus tehty" -merkkiin (`user_onboarding_diagnostic` / `diagnostic_results` -rivi tai profiilin lippu), EI esim. tyhjään tasoon tai puuttuvaan dataan joka voi nollaantua.

**Verifioi Playwrightilla:**
1. Uusi käyttäjä → tee kartoitus loppuun → **reload + logout + relogin → kartoitus EI tule uudelleen** (vie suoraan dashboardiin/kotiin).
2. Käyttäjä joka on tehnyt kartoituksen → ei missään tilanteessa pakoteta takaisin kartoitukseen (paitsi jos itse valitsee "tee uud-elleen").

Jos havaitset että jo tehnyt käyttäjä pakotetaan uusimaan → se on P1-bugi, korjaa ehto persistoituun merkkiin.

---

## Acceptance criteria
- [ ] "yo caminaba" (ja muut validit pronomini+verbi) hyväksytään; väärä aikamuoto yhä hylätään. Vitest kattaa molemmat.
- [ ] Normalisointi kattaa grammar/vocab-täydennystehtävät, ei pelkkää yhtä kysymystä.
- [ ] Playwright: kartoituksen tehnyt käyttäjä ei joudu uusimaan (reload/logout/relogin → ei kartoitusta).
- [ ] Bugi 2: jos re-trigger-bugi löytyy → korjattu persistoituun merkkiin; jos ei → kirjattu "verifioitu, ei bugia".
- [ ] `npm test` vihreä, muokatut js `node --check`. Build + sw CACHE_VERSION jos frontti-bundle muuttui.
- [ ] IMPROVEMENTS.md +1 rivi.

## Push-rajat
- Grading-korjaus näkyy käyttäjälle (vastaus hyväksytään) → **push OK** kun vitest + build vihreä.
- Älä löysää oikeellisuutta laajemmin kuin pronomini — väärä aikamuoto/verbi pysyy vääränä.
