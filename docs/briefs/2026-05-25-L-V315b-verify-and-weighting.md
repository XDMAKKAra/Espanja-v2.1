# BRIEF: L-V315b — Prod-verify reasoner + exercise-pool weighting

**Päivä:** 2026-05-25
**Edellinen:** L-V313/L-V314/L-V315 shipped (commits `fc9acbb`, `78995e4`, `7139b4e`, prod auto-promote käynnissä)
**Lähtötiedot:** Writerin oma raportti: "Production end-to-end of the reasoner (real OpenAI call + UI render) hasn't been verified — only the deterministic unit-test path and the fallback path."
**Reason:** Reasoner-lupaus käyttäjälle on "AI päättelee + räätälöi sisältö heikkojen aiheiden mukaan". Ilman pool-weightingia räätälöinti on rikki demossa lukio-edustajalle. Verify-before-completion -periaate: yksikkötestit eivät korvaa prod-LLM-callia.

---

## Kaksi tehtävää, järjestys pakollinen

### Tehtävä 1 — Prod-verify L-V315 (ensin, ennen weightingia)

**Tavoite:** Vahvista että reasoner-LLM-call toimii prod-Vercelissä eikä putoa fallback-pathiin.

1. **Odota Vercel-auto-promote** valmiiksi commitille `7139b4e`. Tarkista `/api/health` tai `npm run vercel:status` (jos käytössä) että prod tarjoilee uusinta buildia.

2. **Aja onboarding-flow Playwrightilla** prodia vasten Marcelin esimerkillä:
   - Avaa `https://espanja-v2-1.vercel.app/onboarding` (tai sopiva entry-point)
   - Step 1–4: kieli=es, K3+K4+K6+K7 valittu, kotiusage=yes, biography-input "ortografia heikko, subjunktiivi vaikea"
   - Part B mini-YO: jos spec mahdollistaa, syötä subjunktiivi-osio väärin
   - Etene Step 5:een

3. **Capture verifikaatio-evidenssi:**
   - **Screenshot** Step 5 -näytöstä (`docs/briefs/L-V315b-prod-step5.png`)
   - **JSON-output** reasonerista — joko (a) `console.log(JSON.stringify(...))` -hookki testissä, (b) network-tab response `/api/personalization/reason` (tai mikä endpoint onkin), (c) server-log (Vercel logs `vercel logs --since 5m`)
   - **Vahvistus että käytetty malli on todellinen LLM**: response sisältää `model: "gpt-4o-mini"` tai vastaava metatieto. Jos JSON näyttää deterministic-fallbackin (sama output joka kerta, ei AI-laadukasta suomi-tekstiä, transparencyReasons puuttuu tai geneerisiä), reasoner-call EI mennyt LLM:ään.

4. **Acceptance:**
   - `transparencyReasons` sisältää viittauksen "subjunktiivi" + "ortografia" (Marcelin syöttödata heijastuu outputtiin)
   - `strengths` sisältää viittauksen suulliseen kommunikaatioon (homeUsage=yes mappautuu)
   - `plan.week1` ≠ `plan.week2` (ei copy-paste-fallback)
   - Suomi-teksti läpäisee humanizer-säännöt (ei em-dashia, ei "räätälöity & kalibroitu & monipuolinen")

5. **Jos failaa:**
   - LLM-call timeout / 500 → fix viive tai retry-strategia `lib/personalization.js`:ssä
   - Output-JSON ei parse → tiukenna prompt-template + JSON-mode -flagi
   - Fallback-path triggerautuu → diagnose miksi (env-var puuttuu? API-key väärin?), korjaa, re-deploy, re-verify
   - **Älä mene Tehtävä 2:een ennen kuin reasoner toimii prodissa**

6. **Commit (vain jos fixiä tarvittiin):**
   - `fix(personalization): <root cause> (L-V315b-PROD-FIX, v308)`
   - Jos prod toimi ilman fixiä, vain ledger-rivi "verified, no fix needed" + screenshot-evidenssi

---

### Tehtävä 2 — Exercise-pool weighting (toiseksi, blokkaa demo-lupaus)

**Tavoite:** Adaptive-generator ottaa `courseWeights` + `skillProfile`-aiheet huomioon kun se sampleaa seuraavaa tehtävää. Heikkojen aiheiden frequency ≥ 2x vahvojen yli 20 generoinnin.

**Mitä rakennetaan:**

1. **Lue olemassa oleva exercise-generation -reitti** ennen koodin kirjoittamista — todennäköisesti `routes/exercises.js` `/generate` / `/adaptive-exercise` / `/checkpoint/start`. Älä prescribe nimiä, lue git-history ja `lib/adaptive.js` (jos olemassa).

2. **Painotuslogiikka:**
   - Hae käyttäjän `skill_profile` + `course_weights` Supabasesta (L-V315:ssa tallennettu)
   - Jos `skill_profile` puuttuu (user ei tehnyt diagnostiikkaa) → ei painotusta, sample-uniformly (current behavior säilyy)
   - Jos profile löytyy: painota topic-sampling siten että `level ≤ 2` -aiheet saavat 3x sample-probin, `level ≥ 4` saavat 0.3x. Normalisointi kokonaisuudeksi (kaikki painot summautuvat 1.0:aan)
   - Käytä `courseWeights`-objektia kurssi-tason painotukseen jos topic-mappingia ei ole

3. **Toteutus:**
   - Yksi puhdas helper-funktio `lib/personalization.js`:ään: `selectWeightedTopic(skillProfile, courseWeights, availableTopics) → topicKey`
   - Reitti kutsuu sitä ennen `generateExercise`-callia
   - **Älä riko** non-personalized -käyttöä (admin-testaus, anonyymi sample): jos `userId` puuttuu tai profilea ei ole, palaa current random-sampleen

4. **Verify-spec:**
   - Uusi vitest-tiedosto `tests/personalization-weighting.test.js`:
     - Mock profile jossa `subjunctive.level = 1`, `pronouns.level = 5`, 18 muuta topicia level 3
     - Aja `selectWeightedTopic` 1000 kertaa, laske frequency per topic
     - Assert: `freq[subjunctive] / freq[pronouns] >= 8` (3 / 0.3 = 10, salli noise)
     - Assert: kaikkia aiheita sampleta vähintään kerran (ei dead pools)
   - Lisäksi integration-test: aja 20 oikeaa `/api/adaptive-exercise`-kutsua Marcelin diagnostic-userilla → log topic frequency → ratio heikko : vahva ≥ 2:1

5. **Commit:**
   - `feat(personalization): exercise-pool weighting (L-V315b-WEIGHTING-1, v308 tai v309)`
   - SW-bump jos backend-only ei tarvita
   - IMPROVEMENTS.md-rivi: 20-generation frequency-mittaus + ratio-luku Marcelin profiilille

---

## Yleisohjeet

- **Skill-stack:** TESTING + EXERCISE/LESSON + SUPABASE per CLAUDE.md-taulukko. Lataa Skill-toolilla.
- **Älä lykkää enää alaspäin.** Jos `selectWeightedTopic`-toteutus paljastaa että `lib/curriculumData.js`-topic-rakenne ei mappaudu yksi-yhteen `skill_profile`-avaimiin, kirjoita mapping-helperi tähän looppiin — älä deferraa "L-V315c":hen.
- **Push:** Yksi commit per tehtävä, push mainiin per tehtävä (Vercel auto-promote toimii).
- **Älä koske L-V313/L-V314/L-V315-koodiin** ellei prod-verify paljasta regressioonia.

---

## Out-of-scope (kirjoitan erilliseen briefiin jos tarvitaan)

- `GET /api/personalization/why` transparency endpoint — nice-to-have, ei estä demoa
- Per-topic Part A `scoresByTopic` mapping — jos prod-verify paljastaa että reasoner ei pysty mappaamaan Part A -tuloksia topic-tasolle, lisää tämä L-V315c:hen
- Reasoner-välimuisti / frontend-cache — premature optimization
- Reasoner UI -refactor Step 5:lle — vain backend tässä loopissa

---

## Acceptance koko L-V315b:lle

1. Prod-Vercel: onboarding-flow Marcelin esimerkillä rendaa LLM-pohjaisen Step 5:n ilman fallback-pathia (screenshot + JSON evidence committattu)
2. 20 generation-kutsua: heikko : vahva frequency ratio ≥ 2:1
3. Bug-scan 38/38, mobile-audit 26/26 yhä vihreä
4. IMPROVEMENTS.md sisältää L-V315b-rivin frequency-mittauksella
