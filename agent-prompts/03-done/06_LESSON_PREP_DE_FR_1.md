# 06 / 12 — L-LESSON-PREP-DE-FR-1 — Tutkimus + curriculum-spec saksalle ja ranskalle

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Tämä on **research-loop, ei sisältö-loop**. Output: dokumentaatio + skeletteti joiden pohjalta 07/08-loopit voivat ajaa canonical lesson-generation-pipelinen DE/FR:lle. **Sisällön kirjoitus + tarkistus tehdään käsin** käyttäjän + hänen kavereidensa toimesta — agent ei generoi sisältöä tässä loopissa.

---

## 1. Lähtötilanne

Espanjalle on tehty täysi prep:
- `pedagogy/RUBRIC.md` — yo-arvosanaperusteet (I/A/B/C/M/E/L)
- `lib/curriculumData.js`-kohdassa `LANG_CURRICULA.es` — 8 kurssia A-tasosta E-tasoon, vocab-teemat, kielioppi-fokuset
- 90 valmista lessonia `data/courses/es/`
- `AGENT_PROMPT_LESSON_BATCHES_AUTONOMOUS.md` (templates-kansiossa) — canonical lesson-generation-pipeline (16 skilliä, adaptiivinen vaikeus, frontend-rendering-tarkistus)

Saksa + ranska: `data/courses/{de,fr}/` ovat tyhjiä paikkoja, `LANG_CURRICULA.{de,fr}` ovat tyhjiä taulukoita. Lessonien generointi vaatii:
1. **Yo-rubriikki per kieli** — saksan + ranskan lyhyt-oppimäärän YTL-rubriikki
2. **Kielioppi-progressio A→E** — mitä kielioppirakenteita yo-koe lyhyellä oppimäärällä testaa, ja missä järjestyksessä lukio-opetus etenee
3. **Vocab-teemat per kurssi** — kurssirakenne lukio-opetuksesta (LOPS) saksa/ranska lyhyt
4. **Esimerkki-yo-koe-tehtäviä per kieli** — vanhoja YTL:n julkaistuja kokeita (jotta lessonit kohdistuvat oikeaan tehtävätyyppiin)
5. **Kulttuurikonteksti per kieli** — saksan/ranskan-spesifiset aiheet, jotka ovat YO-relevantteja

---

## 2. Scope

### Worker A — Saksan yo-koe-research (Sonnet, web-search-vetoinen)

Tehtävä: tuota `pedagogy/saksa-RUBRIC.md` + päivitä `lib/curriculumData.js` `LANG_CURRICULA.de`-kentän 8 kurssin spec-rakenne.

1. **Lähteet (web-search):**
   - `ylioppilastutkinto.fi` → "Lyhyt oppimäärä, saksa" → arvosteluperusteet, koepaperi-arkisto
   - `oph.fi` (LOPS 2021 saksa lyhyt) — kurssirakenne, opetuksen sisällöt
   - Vanhat YTL-saksa-koepaperit (julkiset PDF:t)
2. **Output `pedagogy/saksa-RUBRIC.md`:** yo-arvosanaperusteet, tehtävätyypit (luetun ymmärtäminen, kuullun ymmärtäminen — kuullun jätetään pois Puheo-mvp:stä, kirjoitelma, sanasto-rakenne), pisteytys
3. **Output `lib/curriculumData.js LANG_CURRICULA.de`:** 8 kurssia (kurssi_1..kurssi_8), per-kurssi: title (suomeksi), description (suomeksi), level (A→E), vocab_theme (englanniksi), grammar_focus (kielioppirakenteiden array), lesson_count (10–12 = sama mitta kuin espanja), sort_order
4. **`data/courses/de/curriculum-spec.md`:** human-readable spec joka käyttäjän kaverit voivat lukea ymmärtääkseen mitä lesson-sisältöön pitää tulla. Linkitä YTL-koepaperit + LOPS-dokumentit
5. **EI lessonia generoida tässä loopissa** — vain kurssirakenne + pedagoginen pohja

### Worker B — Ranskan yo-koe-research (Sonnet, samat säännöt)

Tehtävä: tuota `pedagogy/ranska-RUBRIC.md` + päivitä `LANG_CURRICULA.fr`. Sama rakenne kuin Worker A:lla, mutta ranskan lähteistä ja sisällöstä.

### Worker C — Canonical lesson-pipeline DE/FR-versio (Sonnet, lyhyt)

Tehtävä: tuota `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` joka on canonical-pipeline-template DE/FR-lessonien generointiin.

1. Lue `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_AUTONOMOUS.md` (espanja-pohja)
2. Tee siitä DE/FR-variantti:
   - Korvaa "espanja"/"Spanish" → parametri `${LANG}` (es/de/fr)
   - Lähdeviittaukset → `pedagogy/${LANG}-RUBRIC.md` + `data/courses/${LANG}/curriculum-spec.md`
   - Path: `data/courses/${LANG}/kurssi_X/lesson_Y.json`
   - Validate-skripti: `npm run validate:lessons -- --lang=de` (varmista että INFRA-1:n validate-skripti tukee tätä parametria; jos ei, lisää tuki)
3. Output: template, ei aja vielä mitään — käyttäjä ajaa myöhemmin 07/08-loopeissa

---

## 3. Acceptance criteria

- [ ] `pedagogy/saksa-RUBRIC.md` + `pedagogy/ranska-RUBRIC.md` luotu, sisältää YTL-rubriikit + tehtävätyypit + pisteytys
- [ ] `lib/curriculumData.js LANG_CURRICULA.de` + `.fr` täytetty 8 kurssin spec:llä A→E-progressiolla
- [ ] `data/courses/{de,fr}/curriculum-spec.md` luotu human-readable-muodossa kavereille
- [ ] `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` luotu canonical-pohjana
- [ ] Lähdelinkit (YTL, OPH, LOPS) dokumentoitu jokaisessa MD-tiedostossa attribuution kanssa
- [ ] EI keksittyjä faktoja — jos tieto ei löydy lähteistä, jätä `[TBD: kysy kaverilta joka kirjoitti yo-saksan/ranskan]`
- [ ] `npm run test:bug-scan` PASS (tämä loop ei kosketa frontendiä, joten gate triviaali)

---

## 4. Pois scopesta

- ❌ Lessonien generointi (= 07_LESSONS_DE_LYHYT, 08_LESSONS_FR_LYHYT)
- ❌ Sisällön kirjoittaminen (kaverit + käyttäjä tekevät)
- ❌ Frontend-muutokset
- ❌ Saksan/ranskan kuullun ymmärtämisen sisältö (Whisper/TTS = myöhempi vaihe per ROADMAP)

---

## 5. Skill-set

- `superpowers:brainstorming` — strukturoitu research
- `pedagogy/curriculum-knowledge-architecture-designer` jos olemassa
- `pedagogy/competency-framework-translator` (LOPS → curriculum-spec)
- `puheo-finnish-voice` (kurssikuvaukset)
- WebSearch + WebFetch toolit (research-vaihe)
- `webapp-testing` ei tarvita

---

## Lopuksi
Tämä on **06 / 12** jonossa (`agent-prompts/02-queue/06_LESSON_PREP_DE_FR_1.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
