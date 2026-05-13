# TODO — `validate:lessons` ei tue `--lang=` parametria

**Status:** BLOCKER ennen `07_LESSONS_DE_LYHYT` ja `08_LESSONS_FR_LYHYT` -looppien ajoa.

**Havaittu:** 2026-05-13 META_QA_LOOP Worker C tarkistuksessa.

---

## Ongelma

`AGENT_PROMPT_LESSON_BATCHES_DE_FR.md`-template viittaa komentoon:

```bash
npm run validate:lessons -- --lang=${LANG}
```

…mutta nykyinen `scripts/validate-lessons.mjs` EI lue `--lang=`-parametria. Se iteroi automaattisesti KAIKKI `data/courses/<lang>/kurssi_N/`-alikansiot (es, de, fr — kaikki samalla kertaa). Komento toimii teknisesti — `--lang=de` jää huomiotta argumenttina ja kaikki kielet validoidaan silti — mutta:

1. **Worker- ja review-raportit harhauttavat**: orchestrator näkee 200+ tiedoston validointitulokset (espanja + saksa + ranska sekaisin) ja luulee että ${LANG_NAME}-batch on rikki vaikka espanjan tiedostossa olisi schema-drift.
2. **Exit code -kohinaa**: espanja-tiedoston schema-virhe johtaa exit 1:een vaikka uudet ${LANG_NAME}-tiedostot olisivat OK → orchestrator jää smyrnaan jossa se "ei saa korjattua kahdessa yrityksessä" (template-sääntö "Pysähdy vain jos").
3. **Performance**: 200+ tiedoston scan jokaisen batchin jälkeen on hidasta verrattuna ~15–18 tiedoston batchiin.

---

## Korjaus ENNEN 07/08-looppien ajoa

Päivitä `scripts/validate-lessons.mjs` lisäämällä `--lang=<code>`-parametrituki:

**Spec:**
- Argumentti-parsinta: `process.argv` etsii `--lang=de` tai `--lang=fr` tai `--lang=es`. Jos puuttuu → validoi kaikki (nykyinen käytös, taaksepäin yhteensopiva).
- Jos `--lang=de` annettu → `findLessonFiles()` rajoittaa `langEntry.name === "de"`-kansioon.
- Validoinnin alussa konsoliin: `Validating lessons for lang: de (12 files)` tai vastaava.
- Jos `--lang=xx` ja kansio puuttuu → exit 1 + virheilmoitus `data/courses/de/ does not exist — run L-COURSE-1 for de first`.

**Hyväksymiskriteeri:**
```
npm run validate:lessons              # validates all langs (current behavior)
npm run validate:lessons -- --lang=es # validates only data/courses/es/**
npm run validate:lessons -- --lang=de # validates only data/courses/de/**
npm run validate:lessons -- --lang=fr # validates only data/courses/fr/**
npm run validate:lessons -- --lang=xx # exits 1, "data/courses/xx/ not found"
```

---

## Mitä TÄMÄ tiedosto EI tee

- ÄLÄ muokkaa `scripts/validate-lessons.mjs`-tiedostoa tämän TODO:n perusteella ilman erillistä infra-looppia. Worker C:n tehtävä oli vain dokumentoida.
- Korjaus tehdään `L-LANG-INFRA-2` (tai vastaava) -loopissa ennen 07/08-loopien orchestraattoreita.
- Jos 07/08-loopit pakko ajaa ennen tätä → orchestrator joutuu suodattamaan validate-outputin manuaalisesti polun prefixillä `data/courses/${LANG}/`. Hidasta mutta toimii.

---

## Liittyvät tiedostot

- `scripts/validate-lessons.mjs` — muokattava
- `package.json` — `"validate:lessons": "node scripts/validate-lessons.mjs"` — ei muutosta, parametri menee skriptille `--`-erottimen kautta
- `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` — käyttää `--lang=${LANG}`-parametria, riippuu tästä korjauksesta
