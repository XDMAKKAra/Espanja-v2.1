# 08 / 12 — L-LESSONS-FR-LYHYT — Ranska lyhyt 90 oppituntia

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Edellyttää: 06_LESSON_PREP_DE_FR_1 shipped (ranska-rubriikki + curriculum-spec olemassa). Identtinen 07:n kanssa, vain `LANG=fr`.

---

## 1. Lähtötilanne

Sama kuin 07_LESSONS_DE_LYHYT, mutta ranskalle:
- `pedagogy/ranska-RUBRIC.md` olemassa
- `lib/curriculumData.js LANG_CURRICULA.fr` täytetty 8 kurssilla
- `data/courses/fr/curriculum-spec.md` olemassa

---

## 2. Scope

Aja `agent-prompts/templates/AGENT_PROMPT_LESSON_BATCHES_DE_FR.md` parametrilla `LANG=fr`. Pipeline identtinen 07:n kanssa.

Batch-jako: 7 batchia, ~12-15 lessonia per batch, 2-3 Sonnet-workeria per batch.

---

## 3. Acceptance criteria

- [ ] `data/courses/fr/kurssi_1..8/lesson_*.json` täytetty
- [ ] `npm run validate:lessons -- --lang=fr` PASS
- [ ] `npm run validate:lessons -- --lang=de` PASS (back-compat)
- [ ] `npm run validate:lessons` (es-default) PASS
- [ ] Review-Sonnet P0/P1 fiksattu
- [ ] **Käyttäjän tarkistuspyyntö close-outissa:** "Pyydä ranskan yo-kirjoittaneelta kaverilta tarkistus K1-K2:lle ennen julkaisua"

---

## 4. Pois scopesta

- ❌ Ranska-spesifiset frontend-päivitykset
- ❌ Saksa (= 07)

---

## 5. Skill-set

Sama kuin 07_LESSONS_DE_LYHYT.

---

## Lopuksi
Tämä on **08 / 12** jonossa (`agent-prompts/02-queue/08_LESSONS_FR_LYHYT.md`). Edellyttää 06 shipped.
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
