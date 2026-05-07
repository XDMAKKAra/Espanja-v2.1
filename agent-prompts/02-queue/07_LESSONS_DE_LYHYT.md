# 07 / 12 — L-LESSONS-DE-LYHYT — Saksa lyhyt 90 oppituntia

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Edellyttää: 06_LESSON_PREP_DE_FR_1 shipped (saksa-rubriikki + curriculum-spec olemassa).
>
> Tämä on **iso content-generointi-loop** — käyttää canonical-pipeline-templatea `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` (luotu prep-loopissa). Generoi 90 saksa-lyhyt-oppituntia 8 kurssissa, validoi, review-tarkistaa.

---

## 1. Lähtötilanne

`pedagogy/saksa-RUBRIC.md`, `lib/curriculumData.js LANG_CURRICULA.de`, `data/courses/de/curriculum-spec.md` ovat olemassa (06:n jäljiltä). `data/courses/de/kurssi_1..8/`-hakemistot ovat tyhjiä.

Espanjalle generoitiin 90 oppituntia 7 batchissä (L-LESSON-BATCH-1..7). Sama pipeline saksalle: 7-8 batchia, 2-3 Sonnet-workeria rinnakkain per batch, review-Sonnet per batch, P0/P1/P2-fixit Edit-toolilla.

---

## 2. Scope

Aja `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` parametrilla `LANG=de`. Pipeline:

1. **Vaihe 1** (rinnakkain, 2-3 Sonnet-workeria per batch): generoi lessonit JSON-skeemaan
2. **Vaihe 2** (review-Sonnet): canonical-prompti (16 skilliä, frontend-rendering-tarkistus, adaptiivinen vaikeus) → P0/P1/P2-lista
3. **Vaihe 3** (Opus = sinä): fixit Edit-toolilla
4. **Vaihe 4**: `npm run validate:lessons -- --lang=de` PASS 90/90, sitten sama npm-skripti ilman lang-paramia (default es) myös PASS jotta back-compat ei rikkoutunut

Batch-jako (mukaillen espanjan L-LESSON-BATCH-1..7 -kokemusta):
- Batch 1: K1 L1-10 + K2 L1-5 (15 lessonia)
- Batch 2: K2 L6-10 + K3 L1-11 (16 lessonia)
- Batch 3: K4 L1-12 (12 lessonia)
- Batch 4: K5 L1-11 (11 lessonia)
- Batch 5: K6 L1-12 (12 lessonia)
- Batch 6: K7 L1-12 (12 lessonia)
- Batch 7: K8 L1-12 (12 lessonia)

Total: ~90 (riippuu lopullisesta lesson_count-jaosta saksa-curriculum-spec:ssä — 06 määrittää)

---

## 3. Acceptance criteria

- [ ] `data/courses/de/kurssi_1..8/lesson_*.json` täytetty curriculum-spec:n mukaisesti
- [ ] `npm run validate:lessons -- --lang=de` PASS (kaikki tiedostot validia JSON skeemaa)
- [ ] `npm run validate:lessons` (es-default) PASS — back-compat ei rikkoutunut
- [ ] Review-Sonnet löysi P0/P1-virheet ja ne fiksattu (P2 voidaan jättää)
- [ ] **Käyttäjän tarkistuspyyntö close-outissa:** "Pyydä saksan yo-kirjoittaneelta kaverilta tarkistus K1-K2:lle ennen K3:n julkaisua tuotantoon"
- [ ] AI-prompt-käytäntö: ei keksittyjä saksankielisiä idiomeja jos ne ovat epävarmoja, käytä yleiskielisiä rakenteita
- [ ] Kustannus-cap: jos worker stallaa > 10 min → tappaa, splittää scope, retry (ei loputtomia retryjä)

---

## 4. Pois scopesta

- ❌ Saksa-spesifiset frontend-päivitykset (= myöhempi loop)
- ❌ Käyttäjien tarkistuksen automaatio — käyttäjä koordinoi kavereidensa kanssa
- ❌ Saksan-AI-promptien pitkä hiominen — riittää että INFRA-1:ssa rakennettu kielineutraalius toimii
- ❌ Ranska (= 08)

---

## 5. Skill-set

Per `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` -templaten skill-set (16 pedagogia-skilliä + frontend-tarkistus). Lisäksi `puheo-ai-prompt`-skill saksan-prompt-säätöjä varten.

---

## Lopuksi
Tämä on **07 / 12** jonossa (`agent-prompts/02-queue/07_LESSONS_DE_LYHYT.md`). Edellyttää 06 shipped.
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
