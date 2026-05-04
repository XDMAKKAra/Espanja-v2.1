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

## Vaihe-rakenne — education-skillit määräävät TYYPIT, tämä prompti määrittää MÄÄRÄT

`lesson_type` (vocab / grammar / reading / writing / mixed / test) on **lähtökohta**, ei resepti. Education-skillit kertovat **vaiheiden tyypit ja järjestyksen**. Tämä prompti määrittää **kuinka monta vaihetta ja tehtävää** target_grade-skaalauksen mukaan.

**Tärkeä päivitys (Batch 1 -palaute):** Batch 1:n testaus paljasti että vaiheita ja tehtäviä oli aivan liian vähän L-tason oppilaille — vain ~21 tehtävää per oppitunti, kun L-tavoite vaatii ~90-120. Skaalaus on nyt **pakollinen**.

### Vaiheiden määrä per oppitunti, per target_grade

| Lesson type | I | A | B | C | M | E | L |
|---|---|---|---|---|---|---|---|
| vocab    | 3 | 4 | 5 | 6 | 7 | 8 | **9-10** |
| grammar  | 3 | 4 | 5 | 6 | 7 | 8 | **9-10** |
| reading  | 1 | 1 | 1 | 1 | 2 | 2 | 2 |
| writing  | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| mixed    | 4 | 5 | 6 | 7 | 8 | 9 | **10-11** |
| test     | 1 | 1 | 1 | 1 | 1 | 1 | 1 (kysymys-määrä skaalautuu, ei vaihe) |

JSON-tiedostossa on **L-tason maksimimäärä vaiheita** (esim. 9-10 vocab-oppituntiin), ja `skip_for_targets`-arvot määräävät että I tekee 3, A tekee 4 jne. Esimerkki vocab-oppitunnin vaihejärjestyksestä:

- Vaihe 1 (recognition_mc): `skip_for_targets: []` — kaikki tekevät
- Vaihe 2 (recognition_match): `skip_for_targets: ["I"]`
- Vaihe 3 (recall_typed_es_to_fi): `skip_for_targets: ["I"]`
- Vaihe 4 (recall_typed_fi_to_es): `skip_for_targets: ["I", "A"]`
- Vaihe 5 (application_gap_fill helppo): `skip_for_targets: ["I", "A"]`
- Vaihe 6 (application_gap_fill vaativampi): `skip_for_targets: ["I", "A", "B"]`
- Vaihe 7 (application_sentence_build): `skip_for_targets: ["I", "A", "B", "C"]`
- Vaihe 8 (synthesis_translate): `skip_for_targets: ["I", "A", "B", "C"]`
- Vaihe 9 (synthesis_short_writing): `skip_for_targets: ["I", "A", "B", "C", "M"]`
- Vaihe 10 (cumulative review): `skip_for_targets: ["I", "A", "B"]` — vain C+ tasoilla

### Tehtävien määrä per vaihe, per target_grade

JSON-tiedostossa joka vaihe sisältää **L-tason enimmäismäärän** tehtäviä `items[]`-array:ssa. Frontend skaalaa per käyttäjä — adaptiivinen järjestelmä karsii listan target_graden mukaan runtime:ssa.

| Vaihe-tyyppi | I | A | B | C | M | E | L (JSON:in items-määrä) |
|---|---|---|---|---|---|---|---|
| recognition_mc | 6 | 7 | 8 | 9 | 10 | 12 | **12-15** |
| recognition_match | 6 | 7 | 8 | 9 | 10 | 12 | **12-15** |
| recall_typed_es_to_fi | - | 5 | 6 | 7 | 8 | 9 | **10-12** |
| recall_typed_fi_to_es | - | - | 6 | 7 | 8 | 9 | **10-12** |
| application_gap_fill | 4 | 5 | 6 | 7 | 8 | 9 | **10-12** |
| application_sentence_build | - | - | - | 4 | 5 | 6 | **8** |
| synthesis_translate | - | - | - | - | 3 | 5 | **6-8** |
| synthesis_short_writing | - | - | - | - | - | 2 | **3-4** |
| reading_mc (kysymyksiä) | 3 | 4 | 5 | 5 | 5 | 6 | 6-7 |
| writing_long | 1 | 1 | 1 | 1 | 1 | 1 | 1 |

### L-tason vocab-oppitunnin yhteenveto

- 9-10 vaihetta
- ~10-12 tehtävää keskimäärin per vaihe
- = **90-120 tehtäväyksikköä** per oppitunti L-tasolle
- Batch 1:n nykytila ~21 per oppitunti = **5x liian vähän**

Verrokki: yhtä YO-koevalmennus-oppitunti (Otavan, Edukustannus, OnLearning) sisältää L-tasolle 60-100 tehtävää per oppitunti. Tämä prompti tähtää siihen tasoon.

### Kognitiivinen kuorma vs. tehtävämäärä

`cognitive-load-analyser` -skilli rajoittaa että yhdessä vaiheessa esitetään **käyttöliittymässä kerralla** max 4-7 elementtiä (esim. monivalintakortti yhdellä kerralla). Tämä on **UI-rajoitus**, ei tehtävämäärä-rajoitus. 12 monivalintaa vaiheessa ovat 12 erillistä kysymystä jotka tulevat yksi kerrallaan — käyttäjän kognitiivinen kuorma ei kasva tehtävämäärästä, vaan yhdellä hetkellä näkyvistä elementeistä.

### Yleisperiaate

**I-tavoite tunnistaa, L-tavoite tuottaa ja syntetisoi.** I tekee 3 vaihetta × 4-6 tehtävää = ~15-18 tehtävää oppituntiin. L tekee 9-10 vaihetta × 10-12 tehtävää = 90-120 tehtävää. Tämä ero heijastaa YO-pisterajojen (I 25%, L 95%) eroa.

**Test-oppitunnit (per kurssin loppu):** kertaava sekoitus aiempien oppituntien sisällöstä. Lue ensin saman kurssin muut oppitunnit ja kerää sieltä sanasto + rakenteet. **Test-oppitunnin kysymys-määrä target_graden mukaan**: I=10, A=12, B=15, C=18, M=22, E=26, **L=30-35**.

## Distractor-laatu

`error-analysis-protocol` + `puheo-ai-prompt` määräävät säännöt. `distractor_difficulty`-kenttä ("easy" / "medium" / "hard") schemassa skaalautuu target_grade-kontekstiin.

## Sanasto-listan koko — skaalautuu target_grade-keskiarvon mukaan

**Tärkeä päivitys:** sanasto-listan koko ei ole sama kaikille käyttäjille. L-tavoite-oppilas tarvitsee paljon enemmän sanoja kuin I-tavoite, koska YO-pisterajat vaativat sitä.

Generoi `vocab[]`-listaan **L-tason oppilaan vaatima täysi sanasto**. Frontend ei näytä kaikille sama listaa — adaptiivinen järjestelmä karsii sen target_grade-mukaan. Mutta JSON-tiedostossa on **ylälaita**.

Per `lesson_type`:

| Tyyppi | Sanasto-listan koko (täysi) | Pe rusteltu |
|---|---|---|
| vocab | **25-35** sanaa | YO-koe testaa laajaa sanavarastoa lyhyestä espanjasta |
| grammar | **12-18** sanaa | Sanasto on tukea rakenteelle, ei pääaihe |
| reading | **8-15** uutta avainsanaa | Tekstistä otetut keskeisimmät, ei kaikkia uudet |
| writing | **15-25** sanaa | Ehdotus mitä oppilas voi käyttää tehtävässä |
| mixed | **18-25** sanaa | Yhdistetty fokus |

Frontend skaalaa lessonStaten kautta target_graden mukaan miten paljon sanoja oppilas tehtävissä näkee:

- **L (laudatur):** koko `vocab[]`-lista käytössä tehtävissä + side-panelissa
- **E (eximia):** ~80% sanoista
- **M (magna):** ~70%
- **B/C (cum laude):** ~55%
- **A (approbatur):** ~40%
- **I (improbatur):** ~30%, vain ydinsanat

**Side-panelin Sanasto-tabi näyttää AINA koko `vocab[]`-listan**, riippumatta target_gradesta — käyttäjä saa apua kaikilla tasoilla. Skaalaaminen koskee vain mitä tehtävissä testataan.

Esimerkki Kurssi 1 Oppitunti 1 (vocab, "Perhe ja kansallisuudet"):

**Perhe — laaja (L-tasolle):**
- madre/padre, hermano/hermana, abuelo/abuela, hijo/hija, primo/prima
- tío/tía, sobrino/sobrina, nieto/nieta
- suegro/suegra, cuñado/cuñada, padrastro/madrastra
- gemelo/gemela
- pareja, novio/novia
- familia, familia política

**Kansallisuudet — laaja (L-tasolle):**
- finlandés/finlandesa, español/española, francés/francesa, alemán/alemana
- inglés/inglesa, italiano/italiana, portugués/portuguesa
- ruso/rusa, sueco/sueca, noruego/noruega, danés/danesa
- holandés/holandesa, polaco/polaca
- japonés/japonesa, chino/china
- mexicano/mexicana, argentino/argentina, brasileño/brasileña
- estadounidense, latinoamericano/latinoamericana, europeo/europea, asiático/asiática, africano/africana

Yhteensä noin 30-35 sana-paria → tämä on **L-tason vaatima** sanasto.

`cognitive-load-analyser` voi tarkentaa jakoa vaiheisiin (esim. älä testaa kaikkia 35 sanaa yhdessä vaiheessa — jaa ne 8-10:n erin).

Jokaiseen sanaan:
- `es` ja `fi` pakollisia
- `example_es` + `example_fi` lähes aina (paitsi numerot tms.)
- `gender` substantiiveille ("m" / "f")
- Kun sana on adjektiivi joka taipuu (suku/luku), listaa molemmat muodot esim. `finlandés/finlandesa` → kaksi erillistä sana-entryä tai yksi entry jossa `es: "finlandés/finlandesa"` ja `fi: "suomalainen"`

## Side-panelin Sanasto-tabi

`side_panel.tabs[]`-objektin `vocab`-tabi `content_md`-kenttä pitää koko sanaston, ryhmiteltynä loogisesti (esim. "Perhe", "Kansallisuudet", "Lähisukulaiset", "Etäsukulaiset"). Käyttäjä näkee koko listan auki, riippumatta target_gradesta.

Esimerkki muotoilu:

```markdown
## Perhe — ydin

- **madre / padre** — äiti / isä
- **hermano / hermana** — veli / sisko
- ...

## Perhe — laajempi suku

- **tío / tía** — setä, eno / täti
- **suegro / suegra** — appi / anoppi
- ...

## Kansallisuudet — yleiset

- **finlandés / finlandesa** — suomalainen
- ...

## Kansallisuudet — laajemmin

- **estadounidense** — yhdysvaltalainen (sama maskuliinissa ja feminiinissä)
- ...
```

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
