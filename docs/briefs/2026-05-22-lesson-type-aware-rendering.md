# BRIEF: Lesson-type-aware rendering v281

**Päivä:** 2026-05-22
**Versio:** v281
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v280 (dashboard-redesign) suositeltava ensin — ei tiukkaa riippuvuutta
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + TESTING (webapp-testing, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Tavoite

1. **Sidebar KORTIT-osio renderöityy vain vocab-pohjaisille lessoneille** — ei kirjoitus/lukutehtävä/kertaustesti-lessoneille
2. **Kirjoitustehtävä-näyttö rakennetaan oikeaksi** (`/api/writing-task`-backend on jo olemassa, frontend on placeholder "Tämä tehtävätyyppi avautuu pian")
3. **Lukutehtävä- ja kertaustesti-näytöt verifioidaan**, korjataan jos stub-tilassa

---

## Konteksti

Audit (2026-05-22): kolme rinnakkaista agenttia kävi läpi 269 lessonia (ES 90 + FR 90 + DE 89). **Data on kunnossa** — kaikki lessonit deklaroivat oikean `meta.lesson_type` -arvon. Bugi on puhtaasti frontend:

- Sidebar renderöi KORTIT-osion lesson-tyypistä riippumatta
- `js/lib/sidebarItems.js:21-27` `MODE_LESSON_TYPES` matchaa modeKey → tyyppi, mutta KORTIT-osion conditional puuttuu
- Käyttäjän screenshot näytti "KORTIT · Kääntökortit · Kirjoita itsestäsi" writing-lessonissa — väärä

Lisäksi käyttäjä raportoi: kirjoitustehtävä-näyttö näyttää placeholder-tekstin "Tämä tehtävätyyppi avautuu pian" — frontend-näyttöä ei koskaan rakennettu vaikka backend `routes/writing.js` on valmiina.

---

## Fix 1 — KORTIT-osio conditional

**Tiedostot:** `js/lib/sidebarItems.js` ja/tai `js/components/sidebarShell.js` (riippuen siitä missä kortit lasketaan)

**Tutkimusvaihe:**
1. Grep `KORTIT|kortit|Kääntökortit` koko frontend-koodista — etsi missä KORTIT-otsikko renderöityy sidebariin
2. Tarkista miten kortit johdetaan lessonista — onko se phase-filteri (`phase_type === "recall_typed_*"`) vai jokin metadata-kenttä

**Korjaus:**
```js
// Pseudokoodi — sovita oikeaan paikkaan
function lessonHasFlashcards(lesson) {
  if (!lesson?.meta?.lesson_type) return false;
  // Tyypit joissa flashcardit ovat tarkoituksenmukaisia
  const TYPES_WITH_CARDS = new Set(["vocab", "mixed"]);
  if (TYPES_WITH_CARDS.has(lesson.meta.lesson_type)) return true;
  // grammar-lessonit voivat sisältää "synthesis_translate" -phaseja
  // mutta nämä eivät ole flashcardeja — vain vocab/mixed
  return false;
}
```

**Erikoistapaus — grammar + writing scaffolding:** DE/ES auditit löysivät että writing-lessonit (esim. `kurssi_4/lesson_11`) sisältävät tarkoituksellisesti `recall_typed_*` -warmup-phaseja ennen `writing_long`-päätehtävää. **Älä luule näitä flashcardiksi UI:ssa** — ne ovat pedagogista scaffoldingia. Lue PURE `meta.lesson_type`, älä päättele phase-sisällöstä.

**Lisäksi:** jos sidebar näyttää OPETUS-osion teaching-materiaalille, säilytä se kaikille lesson-tyypeille (writing-lessoneilla on yhä opetussivu). Vain KORTIT-osio piiloon.

---

## Fix 2 — Kirjoitustehtävä-näyttö

**Tiedostot:**
- Uusi tai laajennettava: `js/screens/writingTask.js` (saattaa olla jo olemassa stub-versiona)
- `app.html` — etsi `#screen-writing` tai vastaava div ja korjaa jos puuttuu
- `js/main.js` — routing kun `meta.lesson_type === "writing"`

**Backend** `routes/writing.js` palauttaa AI-arvioidun palautteen YTL-rubriikilla. Käytä sitä:
- POST `/api/writing-task` body `{ language, level, prompt_id }` → palauttaa generoidun promptin (jos olemassa, oletettavasti)
- POST `/api/grade-writing` body `{ language, prompt, userText, wordCountTarget }` → palauttaa arvion

**Lue ensin `routes/writing.js`** oikeat endpoint-nimet ja request-shape — älä keksi niitä.

**Käyttäjäpolku:**
1. Lesson avautuu, näyttö lukee `lesson.phases[0]` joka on `writing_long`-tyyppinen
2. Phase sisältää: prompt-tekstin (suomeksi), sana-tavoitteen (esim. "50-80 sanaa"), YTL-relevanssia kuvaava teksti
3. Käyttäjä näkee:
   - Otsikko (lesson.meta.title) — Fraunces, EI italic
   - Kapea info-rivi: "50–80 sanaa · arvioidaan YTL-rubriikilla"
   - **Iso textarea** kohdistettuna leveydeltään noin 65-75ch (luettava rivipituus)
   - Reaaliaikainen sanalaskuri allainen ("0 / 80 sanaa") — väri vihertyy targetin sisällä
   - Submit-nappi brick-värillä, aktivoituu kun sanat ≥ minimi
4. Submit → loader → tuloskortti:
   - YTL-arvio (4/8/12/16/20 jne. — rubriikin mukaan)
   - 3-5 konkreettista parannusehdotusta listana
   - "Kirjoita uudestaan" + "Seuraava lesson" -napit

**Mobile (375px):** textarea täysleveä, sanalaskuri kiinnittyy alaosaan, submit-nappi koko-leveys.

**Empty/error state:** jos `/api/writing-task` palauttaa virheen → näytä "Kirjoitustehtävä ei nyt vastaa, yritä hetken päästä" + retry-nappi. EI placeholderia "avautuu pian".

---

## Fix 3 — Lukutehtävä-näyttö (verifiointi)

**Toiminta-vaihe:**
1. Avaa testpro-tilillä reading-lesson (esim. `data/courses/es/kurssi_1/` lukutehtävä — agentti raportoi 9 reading-lessonia per kieli)
2. Tarkista: näkyykö placeholder vai aito sisältö?
3. Jos placeholder → toteuta vastaava korjaus kuin Fix 2:lla, mutta käyttäen `routes/exercises.js` `/api/reading-task`-endpointtia
4. Lukutehtävän phase sisältää tekstin + 4 kysymystä. Renderöi:
   - Teksti yläosaan luettavalla rivipituudella
   - 4 kysymystä alle joko paneelina tai pinottuna
   - Submit kysymys-by-kysymys tai yhtenä
   - Tuloskortti samanlainen kuin writing-näytössä

Jos lukutehtävä toimii jo: skippaa tämä, dokumentoi PR-bodyssa "lukutehtävä verifioitu OK".

---

## Fix 4 — Kertaustesti-näyttö (verifiointi)

ES + DE + FR audit -agentit löysivät että `lesson_type: "test"`-lessoneilla on tyypillisesti yksi `recognition_mc`-phase ~30 itemillä. Tarkista että:
- Test-lesson avautuu monivalinta-tehtävä-näytössä (mode `recognition_mc`)
- Items renderöityvät peräkkäin
- Tuloskortti näyttää course-laajuisen yhteenvedon (esim. "Kurssi 1: 24/30 oikein, vahvuus: perhesanat, kehitettävää: kansallisuudet")

Jos toimii: dokumentoi "test-lessonit verifioitu". Jos ei: kuvaa mitä puuttuu, korjaa.

---

## Verifiointi

1. **Playwright happy-path** `tests/e2e/lesson-type-rendering.spec.js`:
   - Kirjaudu testpro123
   - Avaa kunkin lesson-tyypin lesson per kieli (es vocab, es writing, es reading, es test — sama fr ja de)
   - Tarkista että KORTIT-osio näkyy VAIN vocab- (ja mixed-) lessoneille
   - Tarkista että writing-näyttö renderöi textarean, EI placeholderia "avautuu pian"
   - Tarkista että reading-näyttö renderöi tekstin + kysymykset
   - Tarkista että test-näyttö renderöi monivalinnan
2. **Mobile (375px)** screenshot kustakin lesson-tyypistä
3. **AI-slop-checklist:**
   - [ ] EI italic-Fraunces pikku-UI:ssa
   - [ ] EI mono-UPPERCASE-eyebrowia ilman semanttista syytä
   - [ ] EI em-dashia suomi-tekstissä
   - [ ] EI "Ladataan…" italicilla — skeleton
   - [ ] EI "avautuu pian" placeholderia missään
4. **`npm run build`** ja **`npm test`** PASS
5. **Bumppaa `sw.js` CACHE_VERSION**

---

## Commit + PR

- **3-4 commitia:**
  - `feat(sidebar): hide KORTIT for non-vocab lesson types (v281)`
  - `feat(writing): real writing-task screen with AI grading`
  - `feat(reading): real reading-task screen` (jos tarvitsee korjausta)
  - `feat(test): kertaustesti rendering` (jos tarvitsee korjausta)
- Otsikko: `feat: lesson-type-aware rendering v281`
- IMPROVEMENTS.md: `v281 — feat: lesson-type-aware sidebar (KORTIT vain vocab-lessoneille) + oikea kirjoitustehtävä-näyttö (/api/writing-task)`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ päättele lesson-tyyppiä phase-sisällöstä — käytä PURE `meta.lesson_type`
- ÄLÄ poista grammar/writing-lessonien warmup-phaseja — ne ovat scaffoldingia
- ÄLÄ koske `data/courses/*` -tiedostoihin — kolme agenttia juuri auditoi ne, data on kunnossa
- ÄLÄ vaihda `meta.lesson_type` -arvoja — taksonomia (`vocab/grammar/reading/writing/test/mixed`) on oikein
- ÄLÄ keksi prompteja kirjoitustehtäville — käytä backendin `/api/writing-task`-vastausta
- ÄLÄ käytä em-dashia suomi-microcopyssa
- ÄLÄ käytä italic-Fraunces pikku-UI:ssa
- ÄLÄ jätä "avautuu pian" -placeholderia mihinkään

## Onnistuminen

- [ ] Sidebar KORTIT näkyy vain vocab + mixed -lessoneille
- [ ] Writing-näyttö: textarea + sanalaskuri + AI-grading
- [ ] Reading-näyttö verifioitu (tai korjattu)
- [ ] Test-näyttö verifioitu (tai korjattu)
- [ ] Playwright spec PASS kaikille lesson-tyypeille per kieli
- [ ] Mobile-screenshotit
- [ ] AI-slop-checklist
- [ ] `npm run build` + `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu
- [ ] PR avattu, EI mergattu
