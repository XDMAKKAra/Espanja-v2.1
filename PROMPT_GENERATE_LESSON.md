# Prompt — Generoi Puheo-oppitunteja batchina

> Tämä on batch-prompti. Käyttäjä ei reviewa yksittäisiä oppitunteja — Claude Code generoi monta kerralla, käyttäjä testaa appissa.
>
> **Workflow:**
> 1. **Batch 1:** Kurssi 1 oppitunnit 1-5 (5 oppituntia, kaksi vocab + kaksi grammar + yksi mixed)
> 2. **Käyttäjä testaa appissa** Vercel-tuotannossa, kerää havainnot
> 3. **Batch 2:** loput Kurssi 1 + koko Kurssi 2 (~17 oppituntia)
> 4. **Käyttäjä testaa**
> 5. **Batch 3:** kaikki loput (~66 oppituntia)
>
> Käyttäjä antaa palautteen kun batch on käyty läpi appissa, ja **vain silloin** tehdään seuraava batch. Jos batchin laatu ei riitä, käyttäjä antaa konkreettiset korjaukset → Claude Code säätää säännöt → seuraava batch.

---

## Käyttäjän työnkulku per batch

1. Avaa Claude Code repo:n juuressa
2. Liimaa alla oleva prompti, täytä `[BATCH_NIMI]` ja oppituntien lista
3. Claude Code lukee koko kontekstin, generoi kaikki batchin oppitunnit
4. Claude Code raportoi batchin valmistuessa
5. Käyttäjä committaa, deployaa Vercelille `USE_PREGENERATED_LESSONS=true`-flagilla
6. Käyttäjä menee oppimispolulle, käy oppitunnit läpi
7. Käyttäjä raportoi havaintoja Claudelle (uudessa istunnossa) → seuraava batch

---

## ITSE PROMPTI — kopioi alla oleva ja täytä

```
Generoi Puheo-oppitunti-batch: [BATCH_NIMI]

Oppitunnit tässä batchissa:
- kurssi_1 / lesson_1
- kurssi_1 / lesson_2
- kurssi_1 / lesson_3
- kurssi_1 / lesson_4
- kurssi_1 / lesson_5
[muokkaa listaa per batch]

## Tehtävä

Tuota täydelliset `data/courses/kurssi_X/lesson_Y.json`-tiedostot kaikille yllä luetelluille oppitunneille. Jokainen tiedosto noudattaa `schemas/lesson.json`-skeemaa. Sisältö on YO-koe-valmennuskurssi-sisältöä, EI yleistä kielenoppimista.

Tämä on batch-generointi — käyttäjä ei reviewaa yksittäisiä tiedostoja. Hän testaa kokonaisuuden appissa Vercel-tuotannossa kun batch on valmis. Sinun on siis kannettava enemmän vastuuta laadusta — ei "kysy käyttäjältä jos epävarma", vaan tee paras mahdollinen päätös skillien ohjeiden mukaan.

## Lue ensin — PAKOLLINEN

**Yleisperiaate:** Tämä prompti EI kerro tarkkoja pedagogisia reseptejä. Education-skillit kertovat pedagogian, tämä prompti kertoo rakenteen ja brand-säännöt.

### Pakolliset

1. `schemas/lesson.json` — kanoninen skema
2. `lib/curriculumData.js` — etsi BATCHIN jokainen oppitunti, lue niiden riviä:
   - `lesson_type` (vocab / grammar / reading / writing / mixed / test)
   - `title` ja `description` — aihe rajaa sanaston
   - Kurssin `level` (I/A/B/C/M/E/L = YO-arvosana, EI CEFR)
   - Kurssin `vocab_theme` ja `grammar_focus`
3. `.claude/skills/puheo-ai-prompt/SKILL.md` — generoinnin yleiset säännöt
4. `.claude/skills/puheo-finnish-voice/SKILL.md` — KAIKKI suomenkielinen copy
5. `lib/lessonContext.js` — `TARGET_GRADE_MULTIPLIERS`, `TARGET_GRADE_PASS_THRESHOLDS`, `passThresholdFor()`. Käytä näitä mastery_threshold-arvojen pohjana, älä keksi uusia.

### Education-skillit — määräävät pedagogian (pakollinen lukea ennen generointia)

6. `.claude/skills/education/practice-problem-sequence-designer/SKILL.md` — vaihe-progressio
7. `.claude/skills/education/retrieval-practice-generator/SKILL.md` — recognition vs recall
8. `.claude/skills/education/spaced-practice-scheduler/SKILL.md` — sisäinen SR vaiheiden välillä
9. `.claude/skills/education/cognitive-load-analyser/SKILL.md` — tehtävämäärä per vaihe
10. `.claude/skills/education/criterion-referenced-rubric-generator/SKILL.md` — mastery-kynnykset target_grade-funktiona
11. `.claude/skills/education/error-analysis-protocol/SKILL.md` — explanation-kentät tehtävissä
12. `.claude/skills/education/formative-assessment-loop-designer/SKILL.md` — palaute-malli
13. `.claude/skills/education/self-efficacy-builder-sequence/SKILL.md` — sävy ei shame
14. `.claude/skills/education/adaptive-hint-sequence-designer/SKILL.md` — side-panelin sisältö
15. `.claude/skills/education/explicit-instruction-sequence-builder/SKILL.md` — opetussivu

**Jos joku skilli on ristiriidassa tämän promptin tekstin kanssa, noudata skilliä.**

### Aiemmin generoidut oppitunnit

16. Tarkista `data/courses/`-kansio. Jos batch ei ole ensimmäinen, lue aiemmin generoidut oppitunnit:
    - Vältä duplikaatti-sanoja (sama sanasto eri oppitunneissa)
    - Säilytä yhtenäinen tyyli (opetussivun pituus, distractor-laatu, vaihe-määrä)
    - Hyödynnä cross-pollination — myöhempi oppitunti voi käyttää aiemman sanaa distractorina

## Brand-säännöt — pakolliset, eivät neuvoteltavissa

### YO-arvosanat, EI CEFR
- `meta.level` = "I" / "A" / "B" / "C" / "M" / "E" / "L"
- ÄLÄ KÄYTÄ A1, A2, B1, B2 -merkintöjä missään
- A-tason kurssi = approbatur-tavoitteinen, ei "A1-A2"

### Mastery on signaali, EI gate
- Joka vaiheen `mastery_threshold` on per target_grade
- `criterion-referenced-rubric-generator` -skilli antaa arvot. YO-pisterajat referenssinä: L ≈ 95%, E ≈ 85%, M ≈ 75%, C ≈ 63%, B ≈ 52%, A ≈ 38%, I ≈ 25%.
- Käyttäjä voi aina ohittaa vaiheen — ei estoa generointi-tasolla

### YO-koe-fokus pakollinen
- Jokaisessa oppitunnissa `meta.yo_relevance` -kenttä, 1-2 lauseen kuvaus: missä tämä näkyy YO-kokeessa
- Side-panelin `tips`-tabi (jos käytössä) on aina YO-koe-spesifinen
- Sanat valitaan **YO-koe-relevanssin** mukaan, ei "kielen yleisarki"

### Sanat aiheessa
- Jos `lesson_type === "vocab"` ja `title` on "Perhe ja kansallisuudet", sanat ovat perhettä ja kansallisuuksia
- Älä lisää satunnaisia sanoja jotka eivät kuulu aiheeseen — tämä on käyttäjän #1 valitus aiemmasta runtime OpenAI -toteutuksesta

### Skema noudatettava
- Kaikki kentät validoituvat `schemas/lesson.json` -vasten
- Validate `npm run validate:lessons` ennen kuin raportoit valmiiksi

### Suomi-copy
- `puheo-finnish-voice` -skilli määrää sävyn
- Älä käytä englanninkielisiä termejä suomenkielisessä tekstissä
- Älä shame, älä superlativisoi, ole konkreettinen

## Vaihe-rakenne — education-skillit määräävät

`lesson_type` (vocab / grammar / reading / writing / mixed / test) on **lähtökohta**, ei resepti. Education-skillit kertovat:
- Kuinka monta vaihetta per lesson_type
- Vaiheiden järjestys (recognition → recall → application → synthesis)
- Kuinka monta tehtävää per vaihe
- `skip_for_targets`-päätös — mitkä target_grade-tasot ohittavat mitkä vaiheet
- Mastery-kynnyksen suhde target_gradeen ja YO-pisterajoihin

**Yleisperiaate:** I-tavoite tunnistaa, L-tavoite tuottaa ja syntetisoi.

**Test-oppitunnit (per kurssin loppu):** kertaava sekoitus aiempien oppituntien sisällöstä. Lue ensin saman kurssin muut oppitunnit ja kerää sieltä sanasto + rakenteet.

## Distractor-laatu

`error-analysis-protocol` + `puheo-ai-prompt` määräävät säännöt. `distractor_difficulty`-kenttä ("easy" / "medium" / "hard") schemassa skaalautuu target_grade-kontekstiin.

## Sanasto-listan koko

Yleisohje: vocab 10-15, grammar 6-10, reading 5-8 (uudet avainsanat), writing 5-10, mixed 8-12. `cognitive-load-analyser`-skilli voi tarkentaa.

Jokaiseen sanaan: `es`, `fi`, `example_es` + `example_fi` (paitsi numerot tms.), `gender` substantiiveille.

## Side-panel-tabit

`adaptive-hint-sequence-designer` -skilli määrää sisällön. Schemassa enum: `vocab` / `grammar` / `examples` / `tips`. Test-oppitunnissa ei tyypillisesti side-paneliä. `tips`-tabi aina YO-koe-spesifinen.

## Opetussisältö (`teaching.intro_md`)

`explicit-instruction-sequence-builder` (I do → We do → You do) määrää rakenteen. Suomeksi, max ~300 sanaa. Markdown sallittu.

Älä mainitse CEFR-tasoja, älä käytä englanninkielisiä termejä suomenkielisessä tekstissä, älä kirjoita oppikirjamaista esseetä.

## estimated_minutes_median

Realistinen mediaani oppilaan ajasta. Ohjeet:
- vocab: 8-12 min
- grammar: 10-15 min
- reading: 8-12 min
- writing: 15-25 min
- mixed: 12-18 min
- test: 15-25 min

Tämä on **mediaani** — frontend laskee aikaennusteen dynaamisesti per käyttäjä.

## Tee tämä järjestyksessä

1. **Lue kaikki yllä luetellut tiedostot.** Skemat ja skillit ovat asiantuntijaohjeita — niitä noudatetaan.
2. **Lue koko batchin oppitunnit `lib/curriculumData.js`:stä yhdessä erässä.** Suunnittele cross-pollination — mitä sanoja voi tulla seuraavissa oppitunneissa distractoriksi, miten tyyli säilyy.
3. **Tarkista `data/courses/`-kansio** — jos aiemmat batchit ovat olemassa, lue ne säilyttääksesi yhtenäisyyden.
4. **Generoi oppitunti kerrallaan**, mutta ÄLÄ raportoi käyttäjälle välivaiheessa — generoi koko batch ennen raportointia.
5. **Aja `npm run validate:lessons`** kun batch on valmis. Korjaa schema-virheet itse, älä raportoi rikkinäistä batchia.
6. **Raportoi käyttäjälle batchin lopuksi:**
   - Lista generoidut tiedostot (polku + lesson_type + lyhyt aihe)
   - Tilastot: vaihe-määrät, tehtävä-määrät, sanasto-määrät yhteensä
   - Yhtenäisyys-huomiot: miten cross-pollination toimi (esim. "K1L2 distraktorina käytetään K1L1:n sanoja")
   - Mahdolliset epävarmuudet: kohdat joissa skillit jäivät tulkinnanvaraisiksi, päätös josta käyttäjän kannattaa olla tietoinen
   - Älä committaa itse — käyttäjä commitaa kun on tarkistanut yhtenäisyysraportin

## Mitä EI saa tehdä

- ÄLÄ generoi oppituntia joka ei ole batchin listalla
- ÄLÄ keksi mastery-kynnyksiä — käytä `criterion-referenced-rubric-generator` -skilliä
- ÄLÄ käytä CEFR-tasoja
- ÄLÄ generoi placeholder-arvoja — täytä JOKAINEN kenttä oikealla sisällöllä
- ÄLÄ committaa — käyttäjä tekee sen
- ÄLÄ kysy käyttäjältä välivaiheessa — generoi koko batch ja raportoi lopuksi
- ÄLÄ ohita validointia — `npm run validate:lessons` exit 0 ennen raporttia
```

---

## Käyttäjän muistilista per batch

Kun Claude Code on raportoinut batchin valmistuneen:

- [ ] Lue Claude Coden raportti (yhtenäisyys-huomiot, epävarmuudet)
- [ ] Aja `npm run validate:lessons` itse — varmista exit 0
- [ ] Aukaise yksi tai kaksi tiedostoa silmäilläksesi (et reviewaa kaikkia)
- [ ] Committaa Git:iin yhdellä commitilla per batch
- [ ] Pushaa Verceliin
- [ ] Aseta `USE_PREGENERATED_LESSONS=true` Vercel-dashboardissa
- [ ] Avaa testitili Pro-tunnuksilla, käy batchin oppitunnit läpi appissa
- [ ] Kirjaa havainnot (mikä toimi, mikä ei)
- [ ] **Vasta sitten** seuraava batch — älä aja kahta peräkkäin ilman testausta

## Batch-jako — suositus

### Batch 1 (5 oppituntia, ~30 min Claude Coden työtä)
Kurssi 1 oppitunnit 1-5:
- L1 vocab: Perhe ja kansallisuudet
- L2 grammar: -ar-verbit preesensissä
- L3 grammar: -er- ja -ir-verbit preesensissä
- L4 vocab: Koulu ja värit
- L5 mixed: Ser vs estar — perusteet

Tämä batch testaa kaikki kolme yleisintä lesson_type:ä (vocab, grammar, mixed) ja paljastaa jos jokin meneekin pieleen.

### Batch 2 (~17 oppituntia)
Kurssi 1 oppitunnit 6-10 + Kurssi 2 oppitunnit 1-12

### Batch 3 (~66 oppituntia)
Kurssit 3-8 kokonaan

## Mitä jos batch on huono?

Jos batch 1:n testaaminen paljastaa systemaattisia ongelmia (esim. "kaikki vocab-oppitunnit ovat liian lyhyitä", tai "distractorit eivät ole semanttisesti läheisiä"):

1. Älä committaa batch 1:tä Git:iin
2. Kerro Claude Codelle (uudessa istunnossa) konkreettiset puutteet
3. Anna Claudelle mahdollisuus säätää tämän promptin sääntöjä
4. Generoi batch 1 uudestaan
5. Testaa
6. Vasta kun batch 1 on hyvä → batch 2

Tämä prompti on **elävä dokumentti** — paranee sen mukaan kun batchit testataan ja huomataan tilanteita joita skillit eivät kata.

## Kun kaikki on generoitu

- Kaikki `data/courses/`-tiedostot ovat täytetty (ei placeholdereita)
- `npm run validate:lessons` exit 0
- Vercelillä `USE_PREGENERATED_LESSONS=true`
- Käyttäjä on käynyt Kurssi 1 + Kurssi 2 ainakin osittain Pro-tilillä
- Seuraava loop: L-COURSE-3 (frontend-loppurefaktori, side-panelin laajennus, runtime OpenAI poistuu kurssipuolelta kokonaan)
