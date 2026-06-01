# BRIEF: L-V338 — Yhdistämistehtävä (match) rakennetaan, EI poisteta

**Päivä:** 2026-06-01
**Status:** Ship-brief. Marcel 2026-06-01: "halusin et se generoi ne eikä poista." Matching-tehtävätyyppi pitää saada toimimaan, ei piiloon.
**Skill-stack:** EXERCISE-M + FRONTEND-M → `practice-problem-sequence-designer`, `retrieval-practice-generator`, `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`, `humanizer`, `superpowers:verification-before-completion`

---

## Tausta: palaset ovat olemassa, vain kytkentä puuttuu

Yhdistämistehtävä ("match", esim. "Yhdistä: pronomini ja muoto") näyttää tällä hetkellä joko "Tämä tehtävätyyppi avautuu pian" -placeholderin (lesson-step-flow, kuva 16) tai vaihe piilotetaan kokonaan (digikirja-lukija). Syy EI ole puuttuva renderöijä, vaan kytkennän puute:

- **`js/renderers/yhdistaminen.js`** — matching-renderöijä on JO olemassa (seed-based, server-graded).
- **`gradeMatchingPair(userSpanish, userFinnish, correctSpanish, correctFinnish)`** — `js/features/answerGrading.js:44`, grading-helper olemassa.
- **`js/screens/digikirja.js`** — lukija-flow renderöi inline-switchillä (rivi ~584) vain `mc`, `typed`, `translate`, `gap_fill`. `match` puuttuu → vaihe piilotetaan (rivit ~255-282 selittävät tämän). Answer-capture-switch ~691 ei myöskään tunne `match`:ia.

## Tavoite

Match/yhdistämistehtävä **renderöityy ja arvioituu** kummassakin flow:ssa, ei "avautuu pian", ei piilotusta. Käyttäjä saa aidon yhdistämistehtävän es/fr/de.

## Mitä writer tekee (intent, ei pikseleitä)

1. **Lukija-flow (digikirja.js):** lisää `case "match":` renderöinti-switchiin + answer-capture-switchiin, mallina olemassa olevat case:t (`mc`/`gap_fill`). Hyödynnä `js/renderers/yhdistaminen.js`:ää tai adaptoi sen logiikka inline-flowhun, kumpi on siistimpi. Poista match-vaiheen piilotus (digikirja.js ~255-282) ja `SUPPORTED_ITEM_TYPES`-rajaus match:in osalta.
2. **Lesson-step-flow (kuva 16):** poista "Tämä tehtävätyyppi avautuu pian" -placeholder match-vaiheelta ja kytke sama renderöijä. Etsi mistä lesson-runner näyttää tuon placeholderin ja korvaa renderöinnillä.
3. **Grading:** käytä `gradeMatchingPair`-helperia / olemassa olevaa server-grading-reittiä jota yhdistaminen.js jo käyttää. Älä keksi uutta grading-logiikkaa jos olemassa oleva toimii.
4. **Data:** varmista että match-vaiheilla on sisältö (parit) lessoneissa. Jos seed-based renderöijä generoi parit olemassa olevasta sanastosta, varmista että se saa datan. Jos jokin lesson-JSON:ssa on tyhjä match-phase, raportoi, älä täytä placeholderilla.

## Acceptance criteria
1. Match/yhdistämistehtävä renderöityy oikeana yhdistämis-UI:na (ei "avautuu pian", ei piilotettu) sekä lukijassa että lesson-step-flowssa
2. Vastaus arvioituu (oikein/väärin) `gradeMatchingPair` / server-grading kautta
3. Toimii es/fr/de (tai niillä kielillä joilla match-vaiheita on)
4. Mikään match-vaihe ei enää näytä coming-soon-tekstiä
5. Näkyvä suomi-microcopy humanizer-pass (ohjeteksti, palaute)
6. `npm run test:bug-scan` + brand-e2e PASS, uusi/päivitetty Playwright-spec kattaa match-flow:n (renderöityy + arvioituu)
7. `npm run build`, `sw.js` CACHE_VERSION bump
8. Mobile <440px: yhdistäminen toimii kosketuksella, ei vaakavieritystä

## Tutki samalla (raportoi, älä korjaa tässä)
Onko muita renderöijiä (`aukkotehtava`, `correction`, `lauseenMuodostus`) jotka ovat olemassa mutta EI kytketty johonkin flowhun? Jos löytyy stranded-renderöijiä, listaa ne IMPROVEMENTS.md:hen seuraavaa briefiä varten. Älä laajenna tämän briefin scopea.

## Out-of-scope
- Uudet tehtävätyypit joita ei vielä ole renderöijää
- Match-tehtävien pedagoginen uudelleensuunnittelu (vain kytkentä + toimivuus)
- L-V335:n chrome-fixit, L-V336 slop-sweep