# L-LESSON-BATCHES (${LANG_NAME}) — autonominen orchestrator/worker lesson-generointi (Batch 2 → Batch 7)

> **TEMPLATE — DO NOT RUN DIRECTLY.** Tämä on parametrisoitu canonical-pohja DE/FR-lesson-generointiin. Kopioi tämä tiedosto ja korvaa kaikki `${LANG}` / `${LANG_NAME}` / `${LANG_NAME_FI}` -placeholderit konkreettisilla arvoilla ennen orchestrator-istunnon käynnistämistä. `07_LESSONS_DE_LYHYT`- ja `08_LESSONS_FR_LYHYT`-loopit tekevät korvauksen automaattisesti.

---

## PARAMETER SUBSTITUTION (LUE ENSIN)

Tämä template käyttää kolmea parametria. Korvaa kaikki esiintymät ennen orchestratorin spawnaamista:

| Parametri | DE-arvo | FR-arvo | Käyttö |
|---|---|---|---|
| `${LANG}` | `de` | `fr` | tiedostopolut, slug, env-flagit |
| `${LANG_NAME}` | `German` | `French` | prompt-tekstien englanninkielinen kohdekieli |
| `${LANG_NAME_FI}` | `saksa` | `ranska` | suomenkieliset viittaukset, rubric-tiedostonimi, YO-aineen nimi |

**Esimerkki — jos LANG=de:**
- Kaikki `${LANG}` → `de`
- Kaikki `${LANG_NAME}` → `German`
- Kaikki `${LANG_NAME_FI}` → `saksa`
- Tiedostopolku `data/courses/${LANG}/kurssi_1/lesson_1.json` → `data/courses/de/kurssi_1/lesson_1.json`
- Rubric `pedagogy/${LANG_NAME_FI}-RUBRIC.md` → `pedagogy/saksa-RUBRIC.md`
- YO-aine `yo-koe ${LANG_NAME_FI} lyhyt` → `yo-koe saksa lyhyt`

**ÄLÄ käytä tätä template-tiedostoa suoraan.** Kopioi se ja korvaa parametrit. `07_LESSONS_DE_LYHYT` ja `08_LESSONS_FR_LYHYT` -loopit tekevät korvauksen automaattisesti.

---

> Liimaa parametri-korvattu versio Claude Coden tuoreeseen istuntoon repon juuressa. Agentti pyörii **autonomisesti**: generoi → review-subagentti → korjaa → seuraava batch. Älä pysähdy kysymään käyttäjältä mitään ennen kuin viimeinen batch on valmis.
>
> Käyttäjä on poissa. Hän palaa kun viimeinen batch on shipattu ja `npm run validate:lessons -- --lang=${LANG}` on exit 0 KAIKKIIN tiedostoihin. Tämä prompti on suunniteltu niin että käyttäjä voi `/clear` tarvittaessa kesken — `AGENT_STATE.md` säilyttää tilan.

---

## KRIITTINEN: Mallien jako (kustannussäästö)

Sinä (orchestrator) pyörit **Opuksella**. Kaikki worker- ja review-subagentit pyörivät **Sonnet 4.6:lla**. Tämä leikkaa kustannuksen 5x kun raskas generointi tapahtuu Sonnetilla.

**Pakollinen Task-tool-syntax:**

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",        ← PAKOLLINEN, älä unohda
  description: "...",
  prompt: "..."
})
```

ÄLÄ spawnaa subagentteja ilman `model: "sonnet"`-parametria. Jokainen Opus-subagent palaa rahaa.

**Spawnaa subagentit RINNAKKAIN — yksi worker per kurssi (ei per oppitunti).** Tämä on nopein malli: yksi Sonnet-worker kuhunkin kurssiin samanaikaisesti, kaikki Sonnetilla joten kustannus pysyy matalana.

Esimerkki Batch 5 (K5 + K6 alku):
```
// Spawnaa molemmat samanaikaisesti yhdessä viestissä:
Task({ model: "sonnet", description: "Generate ${LANG} K5 lessons 1-11", prompt: "..." })
Task({ model: "sonnet", description: "Generate ${LANG} K6 lessons 1-6", prompt: "..." })
```

**Worker-jako: yksi per kurssi, EI yksi per oppitunti.** Per-kurssi-worker (10-12 oppituntia) lukee skill-tiedostot kerran ja generoi yhden kurssin koko sisällön → cross-pollination kurssin sisällä toimii luonnollisesti. Per-oppitunti-worker olisi token-syöjä koska 11 erillistä agenttia lukisi samat skillit.

**Maksimi rinnakkaisuus: 2-3 worker-subagenttia samanaikaisesti.** Älä spawnaa enempää koska:
- Anthropic API rate limits Sonnet-suostumukseen
- Jos kaikki 8 kurssia rinnakkain → 1.6M tokenia samanaikaisesti, mahdolliset throttling-virheet
- Review-vaihe vaatii että generointi on valmis ennen tarkistusta

**Sinä (Opus) teet vain:** suunnittelu, worker-promptin kustomointi, review-tulosten luku, P0/P1-korjaukset Edit-toolilla, AGENT_STATE.md + IMPROVEMENTS.md päivitys, cross-batch-päätökset.

**Subagent (Sonnet) tekee:** raskas JSON-generointi, schema-validointi, copy-tarkistus, distractor-laadun arviointi.

---

## Resume-protokolla

Jos olet aloittamassa tuoreessa istunnossa (`/clear` jälkeen tai uusi sessio):

1. Lue `AGENT_STATE.md` — kerro missä viime istunto pysähtyi
2. Lue `IMPROVEMENTS.md`:n viimeiset 10 riviä — älä toista jo shipattua työtä
3. Lue `data/courses/${LANG}/`-kansion sisältö — onko batchit tehty vai ei
4. Jatka batchista jossa edellinen istunto pysähtyi
5. Älä lue uudestaan tiedostoja jotka edellinen istunto on jo lukenut (luetellut AGENT_STATE.md:n "Files I have memorized" -listassa)

---

## Tehtävä yhdellä lauseella

Generoi 85 ${LANG_NAME_FI}n oppituntia 6 batchissa kohteeseen `data/courses/${LANG}/`, jokaisen batchin jälkeen pakollinen review-subagent-tarkistus, korjaa kaikki review-löydökset ennen seuraavaan batchiin siirtymistä.

---

## Lähdedokumentit (PAKOLLISET)

Ennen ensimmäistä batchia worker JA review LUKEVAT:

1. `pedagogy/${LANG_NAME_FI}-RUBRIC.md` — ${LANG_NAME_FI}n YO-rubric, virhepatternit, pisteytys
2. `data/courses/${LANG}/curriculum-spec.md` — ${LANG_NAME_FI}n kurssirakenne K1–K8, sanasto-teemat, grammar_focus per kurssi
3. `schemas/lesson.json` — kanoninen JSON-skema (kielineutraali)
4. `PROMPT_GENERATE_LESSON.md` — generointi-spec (kielineutraali pohja, sovella `${LANG_NAME}`-kieleen)

Jos `pedagogy/${LANG_NAME_FI}-RUBRIC.md` tai `data/courses/${LANG}/curriculum-spec.md` puuttuu → pysähdy ja ilmoita käyttäjälle. Ilman näitä generointi ei ole YO-koe-validia.

---

## Batch-jako

| Batch | Sisältö | Oppituntia | Taso |
|---|---|---|---|
| 2 | K1 lesson 6–10, K2 lesson 1–10 | 15 | A |
| 3 | K3 lesson 1–11 | 11 | B |
| 4 | K4 lesson 1–12 | 12 | B |
| 5 | K5 lesson 1–11, K6 lesson 1–6 | 17 | C |
| 6 | K6 lesson 7–12, K7 lesson 1–12 | 18 | C/M |
| 7 | K8 lesson 1–12 | 12 | E |

**Yhteensä: 85 oppituntia.**

Kurssi 1 oppitunnit 1–5 voivat olla joko olemassa (Batch 1 hotfixin jäljiltä) tai puuttuvat. Jos puuttuvat → generoi ne ensin Batch 1:nä ennen Batch 2:ta. Tämä eroaa espanja-loopista, jossa K1L1–5 olivat valmiina.

K2–K8 lesson_1.json -tiedostot ovat **placeholdereita** (jos L-COURSE-1 ${LANG_NAME_FI}-haara on ajettu). Yliaja ne osana batchia 2/3/4/5/6/7 omiensa kurssien kanssa.

---

## Pakollinen workflow per batch

```
PER BATCH N:
  1. PLAN — lue lib/curriculumData.js JOS et ole vielä lukenut. Suunnittele cross-pollination batchin sisällä (mitä sanoja toistuu, mitä rakenteita rakentaa edelliselle). Lue data/courses/${LANG}/curriculum-spec.md kurssin teemat.
  2. GENERATE — spawnaa YKSI worker-subagent Sonnetilla joka generoi koko batchin (ei yksi-per-lesson):
     Task({
       subagent_type: "general-purpose",
       model: "sonnet",         ← PAKOLLINEN
       description: "Generate ${LANG} batch N (lessons)",
       prompt: "[koko worker-prompti, listaa batchin lessonit, kerro mitä skill-tiedostoja lukea, anna L-tason taulukot, vaadi npm run validate:lessons -- --lang=${LANG} lopuksi]"
     })
     Worker palauttaa raportin. Jos worker ei ehtinyt valmistuessa kontekstissa → spawnaa toinen Sonnet-worker jatkamaan, älä tee Opuksella.
     Worker generoi seuraavan jokaiselle lessonille:
     - schemas/lesson.json -mukainen
     - L-tason vaihemäärä (vocab 9-10, grammar 9-10, mixed 10-11, jne. — ks. PROMPT_GENERATE_LESSON.md taulukot)
     - Jokainen vaihe sisältää L-tason tehtävämäärän items[]-array:ssa (recognition_mc 12-15, recall 10-12, application 10-12, synthesis 6-8)
     - skip_for_targets-kentät joka vaiheessa skaalauksen mukaan
     - vocab[]-lista L-tason koko (vocab-oppitunti 25-35, grammar 12-18, mixed 18-25)
     - YO-relevance-kenttä jokaisessa (viittaa ${LANG_NAME_FI}n YO-koe-rakenteeseen)
     - Suomi-copy puheo-finnish-voice-skillin mukaan
     - distractor-laatu error-analysis-protocol-skillin mukaan, hyödynnä pedagogy/${LANG_NAME_FI}-RUBRIC.md:n virhepatterneja
  3. VALIDATE — npm run validate:lessons -- --lang=${LANG}. Jos exit != 0, korjaa schema-virheet itse, älä raportoi käyttäjälle.
  4. SELF-REVIEW (PAKOLLINEN) — spawn subagent Sonnetilla. Käytä **REVIEW-PROMPTI-CANONICAL** -lohkoa joka on alempana tässä tiedostossa. ÄLÄ kirjoita omaa review-prompttia — käytä canonical-versiota sellaisenaan ja täydennä vain "Tarkistettavat tiedostot" -lista.
  5. FIX — sinä (Opus) korjaat kaikki P0 ja P1 löydökset Edit-toolilla. P2:t voi jättää. ÄLÄ spawnaa Opus-subagenttia korjauksiin.
  6. RE-VALIDATE — npm run validate:lessons -- --lang=${LANG} uudelleen → exit 0
  7. CHECKPOINT — päivitä AGENT_STATE.md:
     - Last completed batch: ${LANG}-N
     - Next batch: ${LANG}-N+1
     - Files generated this batch: [polut data/courses/${LANG}/kurssi_X/lesson_Y.json]
     - Review findings count: P0=X, P1=Y, P2=Z, kaikki P0/P1 korjattu
     - Memorized files (älä lue uudestaan seuraavissa batcheissa): schemas/lesson.json, lib/curriculumData.js, PROMPT_GENERATE_LESSON.md, pedagogy/${LANG_NAME_FI}-RUBRIC.md, data/courses/${LANG}/curriculum-spec.md, .claude/skills/puheo-ai-prompt/SKILL.md, .claude/skills/puheo-finnish-voice/SKILL.md, education-skillit (luettelo)
  8. RECORD — IMPROVEMENTS.md +1 rivi formaatti: `- [YYYY-MM-DD L-LESSONS-${LANG_NAME_FI}-LYHYT-N] Generoitu N ${LANG_NAME_FI}n oppituntia (kurssit X). Review: P0=A, P1=B korjattu. Validate: exit 0.`
  9. NEXT — siirry välittömästi batchiin N+1. ÄLÄ PYSÄHDY KYSYMÄÄN KÄYTTÄJÄLTÄ MITÄÄN.
```

**Pysähdy vain jos:**
- npm run validate:lessons -- --lang=${LANG} palauttaa exit != 0 etkä saa korjattua kahdessa yrityksessä
- Review-subagent löytää saman P0:n kahdessa peräkkäisessä batchissa (systeeminen ongelma)
- Kontekstin loppu lähestyy (käytä /resume-protokollaa, ei pysähdytä)
- pedagogy/${LANG_NAME_FI}-RUBRIC.md TAI data/courses/${LANG}/curriculum-spec.md puuttuu

---

## Pakolliset luettavat tiedostot (lue KERRAN, sitten muista)

**Ennen Batch 2:n generointia:**

1. `PROMPT_GENERATE_LESSON.md` — koko prompti, tämä on pää-spec
2. `schemas/lesson.json` — kanoninen skema
3. `lib/curriculumData.js` — kurssien metadata, kaikkien batchien oppitunnit kerralla
4. `lib/lessonContext.js` — TARGET_GRADE_MULTIPLIERS, mastery-thresholdit
5. `pedagogy/${LANG_NAME_FI}-RUBRIC.md` — ${LANG_NAME_FI}n YO-rubric ja virhepatternit
6. `data/courses/${LANG}/curriculum-spec.md` — ${LANG_NAME_FI}n kurssirakenne
7. Olemassa olevat referenssi-lessonit `data/courses/${LANG}/kurssi_1/lesson_*.json` JOS niitä on (jos ei, käytä `data/courses/es/kurssi_1/lesson_1.json` rakenne-referenssinä, älä kopioi sisältöä)

**Skillit jotka WORKER-agentin (generointi) PITÄÄ lukea ennen generointia. EI valinnaisia.**

8. `.claude/skills/puheo-ai-prompt/SKILL.md`
9. `.claude/skills/puheo-finnish-voice/SKILL.md`
10. `.claude/skills/education/practice-problem-sequence-designer/SKILL.md`
11. `.claude/skills/education/retrieval-practice-generator/SKILL.md`
12. `.claude/skills/education/cognitive-load-analyser/SKILL.md`
13. `.claude/skills/education/criterion-referenced-rubric-generator/SKILL.md`
14. `.claude/skills/education/error-analysis-protocol/SKILL.md`
15. `.claude/skills/education/explicit-instruction-sequence-builder/SKILL.md`
16. `.claude/skills/education/spaced-practice-scheduler/SKILL.md`
17. `.claude/skills/education/adaptive-hint-sequence-designer/SKILL.md`
18. `.claude/skills/education/variation-theory-task-designer/SKILL.md`
19. `.claude/skills/education/formative-assessment-loop-designer/SKILL.md`
20. `.claude/skills/education/self-efficacy-builder-sequence/SKILL.md`

**Skillit jotka REVIEW-agentin PITÄÄ lukea (kaikki yllä olevat 8–20 PLUS näitä):**

21. `.claude/skills/ui-ux-pro-max/SKILL.md` — frontend-laadun arvio
22. `.claude/skills/frontend-design/SKILL.md` — visuaalinen monipuolisuus, UX-flow
23. `.claude/skills/design-taste-frontend/SKILL.md` (jos olemassa) — typografia, visuaalinen rytmi

**Review-agentti lukee myös frontend-koodin** varmistaakseen renderöinnin:
- `js/screens/lessonRunner.js`
- `js/lib/lessonAdapter.js`
- `css/components/lesson-runner.css`

**ÄLÄ lue (voit käyttää grep:iä jos pitää löytää viittaus):**
- `app.js` (2300+ riviä)
- `js/screens/*.js` (frontend ei vaikuta lesson-JSON:in sisältöön)
- `routes/*.js` (paitsi `routes/curriculum.js` jos tarvitsee tietää endpointeja)
- `node_modules/`

---

## Brand-säännöt (kopio PROMPT_GENERATE_LESSON.md:stä, älä unohda)

- **YO-arvosanat (I/A/B/C/M/E/L), EI CEFR.** meta.level on yksi kirjain.
- **Mastery on signaali, ei gate.** mastery_threshold per target_grade rubric-skillistä.
- **YO-koe-fokus pakollinen.** meta.yo_relevance-kenttä jokaisessa, viittaa ${LANG_NAME_FI}n YO-koe-rakenteeseen.
- **Sanat aiheessa.** Vocab-oppitunnin sanat matchaa title-aiheeseen, ei satunnaisia.
- **Suomi-copy** puheo-finnish-voice-skillistä. Ei englanninkielisiä eikä ${LANG_NAME}-termejä suomenkielisessä tekstissä paitsi kohdesanat. Ei shame, ei superlativisointia.
- **L-tason maksimisisältö JSON:issa**, frontend skaalaa runtime:ssa target_graden mukaan.
- **${LANG_NAME}-spesifit ortografiset säännöt** — katso pedagogy/${LANG_NAME_FI}-RUBRIC.md:n virhepatternit (esim. saksa: umlaut ä/ö/ü, ß, isot kirjaimet substantiiveissa, sija-päätteet; ranska: aksentit é/è/ê/à/ç, élision l'/d', liaison, sukupuoli-päätteet).

---

## L-tason määrät (toistettuna selkeyden vuoksi)

**Vaiheita per oppitunti L-tasolle:**
- vocab: 9-10
- grammar: 9-10
- reading: 2
- writing: 1
- mixed: 10-11
- test: 1 (kysymyksiä 30-35)

**Tehtäviä per vaihe L-tasolle (JSON:in items[]-array:ssa):**
- recognition_mc: 12-15
- recognition_match: 12-15
- recall_typed_${LANG}_to_fi: 10-12
- recall_typed_fi_to_${LANG}: 10-12
- application_gap_fill: 10-12
- application_sentence_build: 8
- synthesis_translate: 6-8
- synthesis_short_writing: 3-4

**HUOM:** Jos schemas/lesson.json käyttää geneerisiä typenimiä (esim. `recall_typed_target_to_fi`), käytä niitä. Jos schema on espanja-spesifinen (`recall_typed_es_to_fi`), worker säilyttää nimen mutta sisältö on ${LANG_NAME}. Tarkista schema ensin.

**Sanasto-listan koko L-tasolle:**
- vocab: 25-35 sanaa
- grammar: 12-18 sanaa
- reading: 8-15 uutta avainsanaa
- writing: 15-25 sanaa
- mixed: 18-25 sanaa

**L-tason vocab-oppitunti = 90-120 tehtäväyksikköä.** Tämä on pakottava minimi.

---

## skip_for_targets — esimerkki vocab-oppitunnista

```
Vaihe 1 (recognition_mc):              skip_for_targets: []
Vaihe 2 (recognition_match):           skip_for_targets: ["I"]
Vaihe 3 (recall_typed_${LANG}_to_fi):  skip_for_targets: ["I"]
Vaihe 4 (recall_typed_fi_to_${LANG}):  skip_for_targets: ["I", "A"]
Vaihe 5 (application_gap_fill helppo): skip_for_targets: ["I", "A"]
Vaihe 6 (application_gap_fill vaikea): skip_for_targets: ["I", "A", "B"]
Vaihe 7 (application_sentence_build):  skip_for_targets: ["I", "A", "B", "C"]
Vaihe 8 (synthesis_translate):         skip_for_targets: ["I", "A", "B", "C"]
Vaihe 9 (synthesis_short_writing):     skip_for_targets: ["I", "A", "B", "C", "M"]
Vaihe 10 (cumulative review):          skip_for_targets: ["I", "A", "B"]
```

I tekee 3 vaihetta. L tekee 10. Tämä heijastaa YO-pisterajojen eroa (I 25%, L 95%).

---

## Cross-pollination per kurssi

Kun generoit batchia, lue **saman kurssin aiemmin generoidut oppitunnit** ja:
- Älä toista sanoja jotka jo esiintyivät
- Käytä aiempien oppituntien sanoja distractoreina (sanan jonka oppilas tunsi viime tunnilla, tunnistaa nyt distractoriksi → vahvistaa muistia)
- Säilytä yhtenäinen tyyli (opetussivun pituus, distractor-tason vaikeus)
- Test-oppitunnit (kurssin loppu, jos lesson_count määrää) sekoittavat aiempien oppituntien sisältöä

Cross-pollination kurssien välillä:
- K2 voi käyttää K1:n sanoja distractoreina
- K3 K1+K2:n
- jne.

**Cross-language cross-pollination on KIELLETTY** — älä käytä espanjan sanoja distractoreina ${LANG_NAME_FI}n oppitunneilla. Jokainen kieli generoidaan eristyksissä.

---

## Kun KAIKKI 6 batchia on shipattu

Lopputarkistus:
1. `npm run validate:lessons -- --lang=${LANG}` exit 0
2. `find data/courses/${LANG} -name "lesson_*.json" | wc -l` → pitäisi palauttaa 90 (10 K1 + 10 K2 + 11 K3 + 12 K4 + 11 K5 + 12 K6 + 12 K7 + 12 K8 = 90)

3. AGENT_STATE.md "Last completed loop: L-LESSONS-${LANG_NAME_FI}-LYHYT-7. All 90 ${LANG_NAME_FI} lessons generated and validated."
4. IMPROVEMENTS.md: yhteenveto-rivi 7 batchin jälkeen
5. Käyttäjälle reply: max 200 sanaa, formaatti:
   - "Generoitu X ${LANG_NAME_FI}n oppituntia 6 batchissa, kaikki schema-validia."
   - "Review-subagent korjasi yhteensä Y P0-löydöstä ja Z P1-löydöstä matkan varrella."
   - "Top 3 systemaattista huomiota tästä prosessista: [3 riviä]"
   - "Seuraava askel käyttäjälle: USE_PREGENERATED_LESSONS_${LANG} (tai vastaava env-flag) Vercel-dashiin, testaa Pro-tilillä K1L1, K2L1, K5L1, K8L1 (eri tasoja)."

**Älä committaa.** Käyttäjä commitaa kun on tarkistanut AGENT_STATE.md:n.

---

## Mitä EI saa tehdä

- ÄLÄ committaa Git:iin (käyttäjä tekee sen)
- ÄLÄ aja `npm run dev` tai käynnistä palvelinta
- ÄLÄ koske Frontendin koodiin (js/, app.html, css/)
- ÄLÄ koske routes/-kansioon
- ÄLÄ koske data/courses/es/ -kansioon (espanja on eri loop)
- ÄLÄ aja Supabase-migraatioita
- ÄLÄ deploy:aa
- ÄLÄ käytä CEFR-merkintöjä missään
- ÄLÄ käytä espanjan sanoja distractoreina ${LANG_NAME_FI}n oppitunneilla
- ÄLÄ pysähdy kysymään käyttäjältä lupaa kesken loopin
- ÄLÄ kirjoita pitkää chat-vastausta — IMPROVEMENTS.md-rivi on yhteenveto

---

## Idea-vesi jos jumi

Jos jumiit jossain kohdin (esim. K7 kulttuuri-sanasto vaikea valita):
- Lue 2-3 referenssiä netistä mitä YO-koe testaa (etsi "yo-koe ${LANG_NAME_FI} lyhyt kulttuuri" tms.) — älä kopioi, vain inspiraatioksi
- Lue saman kurssin grammar_focus tarkemmin curriculum-spec.md:stä → johtanut sanasto sieltä
- Reading-oppituntien teksteissä voi käyttää uutisteemoja (ympäristö, teknologia, kulttuuri-tapahtumat ${LANG_NAME_FI}n kielialueelta — DACH-maat saksalle, Frankreone+frankofonia ranskalle)

Älä ÄLÄ käytä yli 5 minuuttia yhden vaikean päätöksen kanssa — tee paras valinta nyt, review-subagentti ottaa kantaa myöhemmin.

---

## Aloitus

Lue ensin `AGENT_STATE.md`. Jos se sanoo että tämä on tuore aloitus → mene kohtaan "Pakolliset luettavat tiedostot" yllä, lue koko luettelo 1–20 (kaikki worker-skillit pakolliset) PLUS `pedagogy/${LANG_NAME_FI}-RUBRIC.md` ja `data/courses/${LANG}/curriculum-spec.md`, aloita Batch 2 (tai Batch 1 jos K1L1–5 puuttuu).

Jos se sanoo että edellinen istunto pysähtyi keskellä Batchia X → resume sieltä.

Aloita NYT. Ei preamblea, ei kysymyksiä. Lue tiedostot ja aja loop.

---

## Adaptiivinen vaikeus — KRIITTINEN YO-koe-fokus

**L-taso ei tee vain enemmän tehtäviä, vaan myös vaikeampia.** Tämä on ehdoton vaatimus, koska tämä sovellus on YO-koe-harjoittelu ja kaikki kytkeytyy tavoitearvosanaan (I/A/B/C/M/E/L).

**Vaiheittainen vaikeuden nousu yhden oppitunnin sisällä:**

| Vaihe | Tehtävätyyppi | Vaikeustaso | Kohdetaso (skip_for_targets ulkopuolella) |
|---|---|---|---|
| 1 | recognition_mc | helppo, distractor selvästi väärä semanttinen kategoria | I, A, B, C, M, E, L |
| 2 | recognition_match | helppo–keskitaso | A, B, C, M, E, L |
| 3 | recall_typed ${LANG}→fi | keskitaso | A, B, C, M, E, L |
| 4 | recall_typed fi→${LANG} | keskitaso, distractor lähempi | B, C, M, E, L |
| 5 | application_gap_fill helppo | scaffold (infinitiivi/perusmuoto annettu, vain taivutus) | B, C, M, E, L |
| 6 | application_gap_fill vaikea | scaffold pois, useita laukaisijoita | C, M, E, L |
| 7 | application_sentence_build | sanoja sekaisin, monta oikeaa muotoa | C, M, E, L |
| 8 | synthesis_translate | pidempi lause, ei vihjettä | M, E, L |
| 9 | synthesis_short_writing | vapaa tuottaminen, ei sanavihjeitä | E, L |
| 10 | cumulative review / synthesis pitkä | sekoittaa oppitunnin + aiempien oppituntien sisällön | L (ja joskus E) |

**Distractor-tasoero per vaihe:**
- Vaiheet 1–3: distractor on **selvästi väärä** semanttinen kategoria
- Vaiheet 4–6: distractor on **läheinen** semanttinen kategoria
- Vaiheet 7–10: distractor on **lähes oikea** — oikea verbi mutta väärä aikamuoto, oikea sana mutta väärä taivutus, oikea substantiivi mutta väärä sija/sukupuoli
- Hyödynnä pedagogy/${LANG_NAME_FI}-RUBRIC.md:n virhepatterneja — ne ovat distractor-kullankaivoa

**Lauseiden pituus per vaihe:**
- Vaiheet 1–3: 4–6 sanaa
- Vaiheet 4–6: 6–9 sanaa
- Vaiheet 7–10: 10–18 sanaa, alalauseita, useita aikamuotoja samassa lauseessa

**mastery_threshold per target_grade (pakollinen skaalaus):**
- I: 0.55
- A: 0.60
- B: 0.65
- C: 0.70
- M: 0.80
- E: 0.85
- L: 0.95

**Sanaston harvinaisuus per vaihe:**
- Vaiheet 1–3: kurssin perussanasto (lesson_topic ydin)
- Vaiheet 4–6: kurssin laajennettu sanasto + aiempien oppituntien
- Vaiheet 7–10: oppikirjan ulkopuolista mutta YO-kokeessa esiintyvää (synonyymit, idiomit, kulttuurispesifit ilmaisut ${LANG_NAME_FI}n kielialueelta)

Worker EI saa generoida niin että L tekee samoja tehtäviä kuin M, vain enemmän. L:n vaiheet 8–10 ovat aidosti vaikeampia kuin M:n viimeisin vaihe.

---

## Frontend-renderöinti — review-vaatimus

Käyttäjä EI testaa kurssia manuaalisesti läpi. Review-agentin vastuu on varmistaa että lesson-JSON renderöityy oikein lessonRunnerissa **ennen kuin batch on shippable**. Jos JSON ei rendaudu, käyttäjä tippuu sovelluksesta — ei toistettavaa.

Review-agentin pakolliset frontend-tarkistukset:
1. **Lesson runner** lukee `phases[].items[]` ja `phases[].kind` — varmista että jokainen kind on tuettu typessä `js/lib/lessonAdapter.js`. Jos adapter on hardcoded vain espanjaan → flagaa P0 ja kirjaa BUGS.md:hen.
2. **side-panel** -sisältö (`teaching_panel` -kenttä jos schema:ssa) ei ole tyhjä eikä > 600 sanaa → cognitive overload
3. **typed-input** -tehtävien `expected_answer` ei sisällä monitulkintaisia muotoja jotka frontti hylkäisi (esim. piste lopussa, isoa kirjainta — muista että saksassa substantiivit OVAT isolla, joten typed-input-validointi pitää kunnioittaa)
4. **Mobile-näkymä** (lessonRunner.css media-queryt): pitkät ${LANG_NAME}-lauseet eivät katkea kesken sanan, painikkeet ≥44px korkeat, ei vaakasrollia. Saksan yhdyssanat (esim. *Krankenversicherungskarte*) ovat erityisriski.
5. **Vaiheiden visuaalinen rytmi:** ei viittä peräkkäistä saman tyypin tehtävää (käyttäjä turtuu) — vaihtelu on pakollinen
6. **Kirjoitustehtävien palaute** (synthesis_short_writing, writing): rubriikki-kentät ovat olemassa että AI-grading toimii ja viittaa pedagogy/${LANG_NAME_FI}-RUBRIC.md:n kriteereihin

---

## REVIEW-PROMPTI-CANONICAL (käytä sellaisenaan)

Kun spawnaat review-subagentin step 4:ssä, käytä tätä prompttia. Lisää vain "Tarkistettavat tiedostot" -lista batchin polkuihin. ÄLÄ kirjoita omaa versiota.

```
Olet review-agent Puheo-projektissa (YO-koe ${LANG_NAME_FI} lyhyt -harjoittelu suomenkielisille lukio­laisille).

Repon juuri: C:\Users\marce\OneDrive\Documents\espanja paska

**Tarkistettavat tiedostot:**
[ORCHESTRATOR LIITTÄÄ POLUT TÄHÄN — kaikki data/courses/${LANG}/kurssi_X/lesson_*.json -tiedostot tästä batchista]

**Pakolliset luettavat skillit ennen tarkistusta:**
1. .claude/skills/puheo-finnish-voice/SKILL.md
2. .claude/skills/puheo-ai-prompt/SKILL.md
3. .claude/skills/education/practice-problem-sequence-designer/SKILL.md
4. .claude/skills/education/retrieval-practice-generator/SKILL.md
5. .claude/skills/education/cognitive-load-analyser/SKILL.md
6. .claude/skills/education/criterion-referenced-rubric-generator/SKILL.md
7. .claude/skills/education/error-analysis-protocol/SKILL.md
8. .claude/skills/education/explicit-instruction-sequence-builder/SKILL.md
9. .claude/skills/education/spaced-practice-scheduler/SKILL.md
10. .claude/skills/education/adaptive-hint-sequence-designer/SKILL.md
11. .claude/skills/education/variation-theory-task-designer/SKILL.md
12. .claude/skills/ui-ux-pro-max/SKILL.md
13. .claude/skills/frontend-design/SKILL.md

**Pakolliset luettavat tiedostot:**
- schemas/lesson.json
- PROMPT_GENERATE_LESSON.md
- pedagogy/${LANG_NAME_FI}-RUBRIC.md
- data/courses/${LANG}/curriculum-spec.md
- AGENT_PROMPT_LESSON_BATCHES_DE_FR.md (tämä — parametri-korvattu versio — etsi "Adaptiivinen vaikeus" ja "Frontend-renderöinti" -lohkot)
- js/screens/lessonRunner.js
- js/lib/lessonAdapter.js
- css/components/lesson-runner.css

**Vaihe 0 ennen tarkistusta (PAKOLLINEN):**
- Aja `npm run validate:lessons -- --lang=${LANG}` ja varmista exit 0. Jos != 0 → raportoi P0-listana ja pysähdy ennen muita tarkistuksia.
- Avaa PROMPT_GENERATE_LESSON.md ja pedagogy/${LANG_NAME_FI}-RUBRIC.md L-tason taulukot näkyviin viittausta varten.

**Tarkistus-checklist (per tiedosto, MAX 5 löydöstä per tiedosto):**

A. Kielelliset virheet (P0)
- ${LANG_NAME}-oikeinkirjoitus (katso pedagogy/${LANG_NAME_FI}-RUBRIC.md:n virhepatternit):
  * Saksa: umlaut ä/ö/ü, ß vs ss, isot kirjaimet substantiiveissa, sijapäätteet (Nom/Akk/Dat/Gen), artikkelin sukupuoli (der/die/das), verbien konjugaatio per pronomini, separable verbs (aufstehen → ich stehe auf), trennbare/untrennbare etuliitteet
  * Ranska: aksentit é/è/ê/à/ç/ï/ô, élision (l'/d'/qu'), liaison, sukupuoli- ja monikkopäätteet, accord du participe passé, subjonctif vs indicatif, partitiivi du/de la/des
- Suomen kielioppi: sijapäätteet, omistuspäätteet, johdokset
- Käännösten oikeellisuus FI↔${LANG_NAME} kumpaankin suuntaan
- Distractorit ovat oikeita ${LANG_NAME}-sanoja, eivät keksittyjä

B. Tehtävämuotojen monipuolisuus (P1)
- Per oppitunti useita tyyppejä: recognition_mc, recognition_match, recall_typed_${LANG}_to_fi, recall_typed_fi_to_${LANG}, application_gap_fill, application_sentence_build, synthesis_translate, synthesis_short_writing
- Ei viittä peräkkäistä samaa typea
- Käännöstä molempiin suuntiin (${LANG}→fi JA fi→${LANG})
- Vapaata tuottamista (synthesis_short_writing) M+L tasolle

C. Sisällöllinen ei-genericisyys (P1)
- Distractorit semanttisesti läheisiä, ei satunnaisia
- Lauseet aiheessa, ei "Peter isst Brot" / "Pierre mange du pain" -tasoa
- YO-tyyppinen konteksti
- Ei sanaston identtistä toistoa kurssin sisällä
- ${LANG_NAME_FI}n kulttuuri-spesifit konteksit (DACH-maat / frankofonia) kun aihe sallii

D. Adaptiivinen vaikeus (P0 jos rikki — KRIITTINEN)
Vertaa AGENT_PROMPT_LESSON_BATCHES_DE_FR.md "Adaptiivinen vaikeus" -taulukkoon:
- Vaiheittainen vaikeus nousee oikein (1→10)
- L:n vaiheet 8–10 aidosti vaikeampia kuin M:n viimeisin
- B/C scaffold (perusmuoto annettu); L:n synthesis ei apua
- Distractor-taso vaiheittain: helpoissa selvästi väärä, vaikeissa lähes oikea (käytä pedagogy/${LANG_NAME_FI}-RUBRIC.md:n virhepatterneja)
- Lauseiden pituus skaalautuu (4–6 → 10–18 sanaa)
- mastery_threshold I 0.55 → L 0.95

E. Frontend-renderöinti (P0 jos rikki, P1 muuten)
Vertaa AGENT_PROMPT_LESSON_BATCHES_DE_FR.md "Frontend-renderöinti" -lohkoon:
- Kaikki phases[].kind tuettu lessonAdapter.js:ssä (jos hardcoded espanjaan → P0 + BUGS.md)
- side-panel ei tyhjä eikä > 600 sanaa
- typed-input expected_answer rendaa oikein (saksa: isot kirjaimet substantiiveissa OK)
- Pitkät lauseet eivät riko mobile-näkymää (saksan yhdyssanat erityisriski)
- Ei viittä peräkkäistä saman tyypin tehtävää
- writing/synthesis: rubriikki-kentät olemassa AI-gradinguun, viittaa pedagogy/${LANG_NAME_FI}-RUBRIC.md:hen

F. YO-koe-kytkös (P1)
- meta.yo_relevance oppitunti-spesifinen, ei copy-paste
- Kuvaa miten tämä auttaa nimenomaan korkeampia arvosanoja ${LANG_NAME_FI}n YO-kokeessa
- target_grades-lista oikein
- Rubric-viittaus pedagogy/${LANG_NAME_FI}-RUBRIC.md:hen kun olennaista

**Output-formaatti:**

Per tiedosto MAX 5 riviä:
### ${LANG}/kurssi_X/lesson_N.json
- P0 rivi 234: "der Frau gibt" → "der Frau gibt es" (kielioppivirhe, datiivi puuttuu)
- P1 rivi 102: 7/9 vaihetta recognition-tyyppisiä, lisää sentence_build vaiheeseen 6
- ...

Lopussa yhteenveto:
- Top 3 systeemistä ongelmaa (näkyy monessa tiedostossa)
- P0 yhteensä: N
- P1 yhteensä: N
- P2 yhteensä: N
- Kokonaisarvio: shippable / korjauksia vaaditaan / generoi uudestaan

ÄLÄ palauta koko tiedostoja takaisin. Vain rivinumerot ja täsmä-korjausehdotukset.

Käyttäjä EI testaa itse — review on viimeinen suoja. Löydä virheet nyt.

Aloita NYT.
```

---

## WORKER-PROMPTI-CANONICAL — yhteinen pohja generointiin

Kun spawnaat worker-subagentin, käytä tätä pohjaa:

```
Olet lesson-worker Puheo-projektissa (YO-koe ${LANG_NAME_FI} lyhyt, suomenkielinen UI).

Repon juuri: C:\Users\marce\OneDrive\Documents\espanja paska

**Tehtävä:** generoi [KURSSI X oppitunnit Y–Z] kohteeseen data/courses/${LANG}/kurssi_X/lesson_N.json.

**Lue ensin (PAKOLLISET):**
1. PROMPT_GENERATE_LESSON.md
2. schemas/lesson.json
3. lib/curriculumData.js (etsi "kurssi_X" -rivit)
4. pedagogy/${LANG_NAME_FI}-RUBRIC.md
5. data/courses/${LANG}/curriculum-spec.md (etsi "kurssi_X" -sektio)
6. AGENT_PROMPT_LESSON_BATCHES_DE_FR.md — parametri-korvattu versio — etsi "Adaptiivinen vaikeus" ja "Frontend-renderöinti" -lohkot
7. Olemassa olevat referenssit data/courses/${LANG}/kurssi_*/lesson_*.json jos niitä on (rakenne, ei sisältö)
8. .claude/skills/puheo-finnish-voice/SKILL.md
9. .claude/skills/puheo-ai-prompt/SKILL.md
10. .claude/skills/education/practice-problem-sequence-designer/SKILL.md
11. .claude/skills/education/retrieval-practice-generator/SKILL.md
12. .claude/skills/education/cognitive-load-analyser/SKILL.md
13. .claude/skills/education/criterion-referenced-rubric-generator/SKILL.md
14. .claude/skills/education/error-analysis-protocol/SKILL.md
15. .claude/skills/education/explicit-instruction-sequence-builder/SKILL.md
16. .claude/skills/education/spaced-practice-scheduler/SKILL.md
17. .claude/skills/education/adaptive-hint-sequence-designer/SKILL.md
18. .claude/skills/education/variation-theory-task-designer/SKILL.md

**Säännöt:**
- L-tason vaihemäärät: vocab/grammar 9–10, mixed 10–11, reading 2, writing 1, test 1
- Tehtäviä per vaihe: recognition_mc 12–15, recall 10–12, application 10–12, synthesis 6–8, test 30
- Sanasto: vocab 25–35, grammar 12–18, reading 8–15, writing 15–25, mixed 18–25
- skip_for_targets vaiheittain (ks. AGENT_PROMPT_LESSON_BATCHES_DE_FR.md "skip_for_targets — esimerkki vocab-oppitunnista")
- meta.level yksi kirjain (I/A/B/C/M/E/L), EI CEFR
- meta.yo_relevance oppitunti-spesifinen, viittaa ${LANG_NAME_FI}n YO-koe-rakenteeseen
- **Adaptiivinen vaikeus** (KRIITTINEN): L:n vaiheet 8–10 aidosti vaikeampia kuin M:n viimeisin — pidempiä lauseita (10–18 sanaa), lähes-oikeita distractoreita (oikea verbi väärä aikamuoto, oikea substantiivi väärä sija/sukupuoli), ei scaffoldia. Hyödynnä pedagogy/${LANG_NAME_FI}-RUBRIC.md:n virhepatterneja.
- mastery_threshold per target_grade: I 0.55, A 0.60, B 0.65, C 0.70, M 0.80, E 0.85, L 0.95
- Cross-pollination: käytä saman kurssin aiempien oppituntien sanoja distractoreina. ÄLÄ käytä espanjan sanoja.
- Sanat aiheessa, ei satunnaisia
- Suomi-copy luonnollista (ei käännöskoneellista)
- **Tehtävämuotojen monipuolisuus pakollinen:** käännös molempiin suuntiin (${LANG}→fi JA fi→${LANG}), gap_fill, sentence_build, synthesis. Ei viittä peräkkäistä saman tyypin tehtävää.
- **${LANG_NAME}-ortografia kunnioitettava:** saksa = umlautit + ß + isot substantiivit; ranska = aksentit + élision + liaison + accord. expected_answer-kenttä validoi tarkasti.

**Validoi lopuksi:** npm run validate:lessons -- --lang=${LANG} → exit 0. Korjaa schema-virheet itse.

**Raportti (max 30 riviä):** kirjoitetut polut, validate exit, vaiheet/oppitunti, sanaston koko, cross-pollination-huomiot, mahdolliset oletukset.

ÄLÄ committaa, ÄLÄ aja palvelinta, ÄLÄ pysähdy kysymään.

Aloita NYT.
```

---

## Lopuksi (kun KAIKKI 6 batchia ja review-kierrokset valmiit)

Ennen kuin raportoit käyttäjälle, tee nämä kolme:

### 1. Tarkista USE_PREGENERATED_LESSONS-flag ${LANG_NAME_FI}lle

Lue `routes/curriculum.js` ja varmista että ${LANG_NAME_FI}n reitti lukee oikeasti `data/courses/${LANG}/`-tiedostoja. Jos näet että fallback OpenAI-reittiin on yhä mahdollinen vaikka JSON-tiedosto on olemassa, TAI että reitti on hardcoded espanjaan → kirjaa `BUGS.md`:hen P0-merkinnällä:

```markdown
## P0 — ${LANG_NAME_FI}-reitti puuttuu / fallback OpenAI runtime triggered
- File: routes/curriculum.js
- Symptom: ${LANG_NAME_FI} K1L1 in production fails / falls back to OpenAI
  even though data/courses/${LANG}/kurssi_1/lesson_1.json was generated
- Root cause hypothesis: lang-param routing missing OR env flag not read OR JSON path mismatch
- Fix: investigate in next loop, ei tässä loopissa
```

ÄLÄ KORJAA itse — tämä on Ruflo-orchestratorin tehtävä myöhemmin. Vain dokumentoi.

### 2. Käyttäjälle ACTION REQUIRED -lista

Kirjoita raporttiin selkeä lista:

```
## Käyttäjän tehtävät ennen kuin tämä toimii tuotannossa

1. Vercel Dashboard → Settings → Environment Variables →
   USE_PREGENERATED_LESSONS = true (Production) — yhteinen kaikille kielille
   (tai kielikohtainen flag jos routes/curriculum.js niin vaatii)
2. Trigger redeploy: git commit -m "feat: ${LANG_NAME_FI} lessons batch 2-7 generated" --allow-empty
3. Testaa appissa: ${LANG_NAME_FI} K1L1 (A), K3L1 (B), K5L1 (C), K7L1 (M), K8L1 (E)
4. Jos joku näyttää "AI-pyyntö aikakatkaistiin" -virheen → flag ei vaikuta tai reitti ei tue ${LANG_NAME_FI}n,
   katso BUGS.md:n P0-merkintä
```

### 3. Audit-merkintä BUGS.md:hen

Lisää BUGS.md:hen nykyisistä havainnoista — älä korjaa niitä, vain kirjaa Rufloa varten.

### Lopullinen raportti käyttäjälle (max 200 sanaa)

```
Generoitu X ${LANG_NAME_FI}n oppituntia 6 batchissa, kaikki schema-validia.
Yhteensä X tiedostoa data/courses/${LANG}/ -kansiossa.

Worker-statistiikka: Y Sonnet-workeria, Z review-kierrosta.
P0=A, P1=B, P2=C löydökset. P0/P1 korjattu, P2 jätetty.

Tunnetut bugit (Rufloa varten): N kpl, kirjattu BUGS.md:hen.
Käyttäjän tehtävät: kirjattu ylle (USE_PREGENERATED_LESSONS + redeploy + testaa).

Seuraava askel: Ruflo-orchestrator alkuun kun käyttäjä on testannut
ja deployannut ${LANG_NAME_FI}n sisällön.
```

ÄLÄ committaa. ÄLÄ deployaa. Lopuksi käyttäjä commitaa ja deployaa itse.
