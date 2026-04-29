# Agent Prompt — L-PLAN-7
# Kumulatiivinen kertaus: oppitunti N kertaa myös 1..N-1 + edelliset kurssit

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. Standardilohko on pakollinen jokaiseen UPDATEen.**
2. `AGENT_STATE.md` — koko tiedosto, varmista että L-PLAN-6 on shipattu
3. `CURRICULUM_SPEC.md` §3 (kurssirakenne) + §4 (etenemissäännöt — interleaving + spacing)
4. `IMPROVEMENTS.md` viimeiset 60 riviä — L-PLAN-6-blokki + deferred-itemit
5. `lib/learningPath.js` ja `lib/lessonContext.js` — nykyinen oppimispolku ja lesson-konteksti
6. `lib/seedBank.js` ja `lib/sessionComposer.js` — exercise-koonti, jos olemassa

Skillit jotka aktivoidaan TÄSSÄ loopissa (lisäksi STANDARDS-listattu pohja — kaikki KÄYTÖSSÄ):
- `puheo-screen-template`, `puheo-finnish-voice`, `puheo-ai-prompt`, `ui-ux-pro-max` — KAIKKI loopit
- **Education-skillit (KAIKKI relevantti — lue ENNEN UPDATEjen alkua):**
  - `education/spaced-practice-scheduler` — KOKO LOOPIN PERUSTA — spacing-aikataulu
  - `education/interleaving-unit-planner` — KOKO LOOPIN PERUSTA — eri aiheiden sekoitus
  - `education/retrieval-practice-generator` — kertaustehtävät ovat retrieval, ei recognition
  - `education/individual-spacing-algorithm-explainer` — per-oppilas SR (forgetting curve)
  - `education/cognitive-load-analyser` — älä yliylityö per session (max 4 distinct topicia per oppitunti)
  - `education/curriculum-knowledge-architecture-designer` — kertaus tarvitsee aiheen edeltäjien hallintaa
  - `education/developmental-progression-synthesis` — ei kerrata vaativampia rakenteita ennen perusta on
  - `education/error-analysis-protocol` — kertaa juuri niitä aiheita joissa virheitä
  - `education/formative-assessment-loop-designer` — kertauksen palaute kertoo "tämä tuli kurssilta 1"
  - `education/metacognitive-prompt-library` — reflektiolause kertauksen jälkeen
- **Design plugin -skillit (KAIKKI):**
  - `design:ux-copy` — kertaus-badgejen copy + "tästä aiheesta saat kertausta nyt" -viesti
  - `design:accessibility-review` — JOKAISEN UPDATEn jälkeen
  - `design:design-critique` — Playwright-screenshotit lopussa
  - `design:taste-frontend` jos saatavilla — KAIKKEEN frontend-uudistukseen

21st.dev sourcing pakollinen:
- Kertaus-badge tehtävässä: `21st.dev/s/badge` + `/s/chip`
- Kertaus-osio post-results: `21st.dev/s/section-card` + `/s/callout`
- Spacing-graafiikka (jos lisätään profiiliin): `21st.dev/s/timeline` + `/s/calendar-heatmap`

Verify L-PLAN-6 is shipped: grep IMPROVEMENTS.md for `[2026-04-29 L-PLAN-6]`. If missing, STOP.

---

## Konteksti

Käyttäjän briefin (2026-04-29 suora käännös):

> "Esim jos harjoittelen koulu ja värit niikun kohta 4. Se pitäisi olla niin että kun harjottelen kohtaa 5. Ser vs estar kertaan samalla mys koulu ja värit kohtaa. Eli kaikki kurssissa oleva asia pitää liittyä toisiin jotta oppilas pystyy kertaamaan ne hyvin."

Eli: kun oppilas tekee Kurssi 1 → Oppitunti 5 (Yhdistelmä: ser vs estar intro), tehtävien sisällössä esiintyy myös Oppitunti 4:n (Sanasto: koulu + värit) ydinsanasto. Ja Oppitunti 4:ää tehdessä, viimeisissä tehtävissä esiintyy -ar verbit Oppitunti 2:sta.

**Yleisempi periaate (CURRICULUM_SPEC §4 + interleaving-skill):**

1. **Sisäinen kertaus oppitunnissa**: oppitunti N:n viimeiset 2 tehtävää sisältävät sanastoa/rakenteita oppitunneista 1..N-1 samasta kurssista
2. **Kurssin sisäinen interleaving**: kertaustesti-oppitunti (last lesson per kurssi) testaa kaikki oppitunnit 1..N-1 tasaisesti (jo speccissä)
3. **Kurssien välinen kertaus (spaced)**: kun oppilas aloittaa Kurssi N:n, ensimmäisten 2 oppitunnin tehtävissä esiintyy 1–2 kertaus-tehtävää Kurssi N-1:stä
4. **SR-pohjainen henkilökohtainen kertaus**: jos oppilas teki tietyn topicin epävarmasti (<70%), se tulee takaisin spaced-aikataulun mukaan vielä myöhemmin — ei vain kerran kurssin lopussa

### Mitä on jo paikallaan

- **L-PLAN-3** (`lib/lessonContext.js`): exercise-promptiin injektoidaan "kertaa ydinsanoja viimeisessä tehtävässä" (recognition→production-järjestys + last item repeats core vocab)
- **L-PLAN-2** (CURRICULUM_SPEC §3): kertaustesti-oppitunti per kurssi testaa kaikki kurssin aiheet — backend `routes/exercises.js` käsittelee tätä `kertaustesti`-modena
- **`lib/sessionComposer.js`** + `lib/seedBank.js` — mahdolliset olemassa olevat seed-recyklöintirakenteet (lue, älä koodaa uudestaan)

### Mitä puuttuu vielä (TÄMÄ LOOP)

1. **Sisäinen kertaus oppitunnissa**: viimeisten 2 tehtävän hard-constraint topic-mixiin — backendin OpenAI-promptissa ja/tai composer-logikassa
2. **Kurssien välinen kertaus**: kun avataan Kurssi N (N>1), ensimmäisten 2 oppitunnin generoinnissa lisätään 1–2 kertaustehtävää Kurssi N-1:n grammar_focus-aiheista
3. **Kertaus-badge UI**: tehtävässä pieni "Kertaus: aihe X" -merkki kun kyseessä on aiempi-aihetehtävä
4. **SR-pohjainen henkilökohtainen kertaus**: lue `user_curriculum_progress` + virhe-historia, valitse heikoimmat aiheet, lisää 1 SR-tehtävä joka 3. oppitunti
5. **Post-results "Kertasit myös tätä" -osio**: results-screenissä lyhyt huomio: "Tässä oppitunnissa kertasit myös: -ar verbit (Oppitunti 2)"

---

## UPDATE 1 — Sisäinen kertaus oppitunnin sisällä

### Spec

Kun oppilas aloittaa Kurssi N:n Oppitunti M:n (M >= 3, eli ei kahdessa ensimmäisessä), exercise-generoinnin on otettava huomioon edeltävät M-1 oppituntia.

Tehtäväketjun rakenne (`exerciseCount` per `lessonContext`-objekti):

- Tehtävät 1..(N-2): keskittyvät täysin oppitunnin omaan focus-aiheeseen
- Tehtävät (N-1)..N (eli viimeiset 2): yksi tehtävä kertaa AINAKIN yhden aiemman oppitunnin aiheen samasta kurssista, valittuna seuraavalla logiikalla:
  - Ota viimeisin oppitunti josta oppilaalla on `score_correct/score_total < 0.85` → jos sellainen on, valitse sen focus
  - Muuten: ota satunnainen oppitunti 1..M-1 (deterministinen seed = `userId + kurssi + lesson` → samalla oppilaalla sama kertaus joka kerta)

### Backend `lib/lessonContext.js`

Laajenna kontekstia:

```js
async function buildLessonContext({ kurssiKey, lessonIndex, userId }) {
  // ... olemassa oleva logiikka ...

  // Sisäinen kertaus
  const reviewTopics = [];
  if (lessonIndex >= 2) {
    const previousLessons = await fetchLessons(kurssiKey, { upTo: lessonIndex - 1 });
    const userProgress = await fetchUserProgress(userId, kurssiKey);

    // Etsi heikoin aiempi oppitunti
    const weakest = userProgress
      .filter(p => p.lesson_index < lessonIndex && p.score_correct !== null)
      .sort((a, b) => (a.score_correct / a.score_total) - (b.score_correct / b.score_total))[0];

    if (weakest && (weakest.score_correct / weakest.score_total) < 0.85) {
      const lesson = previousLessons.find(l => l.sort_order === weakest.lesson_index);
      reviewTopics.push({ focus: lesson.focus, type: lesson.type, source: `kurssi_${kurssiKey}_lesson_${weakest.lesson_index}` });
    } else {
      // Deterministinen valinta
      const seed = hashString(`${userId}_${kurssiKey}_${lessonIndex}`);
      const idx = seed % previousLessons.length;
      reviewTopics.push({ focus: previousLessons[idx].focus, type: previousLessons[idx].type, source: `kurssi_${kurssiKey}_lesson_${idx}` });
    }
  }

  return {
    ...existing,
    reviewTopics,  // [{ focus, type, source }] tai []
  };
}
```

### OpenAI-promptin laajennus

`lib/lessonContext.js`:n `buildPromptInstruction(context)`:

```
${existing instruction}

KERTAUS:
Tehtävät 1..${exerciseCount - 2} keskittyvät TARKASTI aiheeseen "${focus}".
Tehtävät ${exerciseCount - 1} ja ${exerciseCount} kertaavat myös aihetta "${reviewTopics[0].focus}" (aiemmasta oppitunnista) — sisällytä SEN ydinsanasto/rakenne näihin kahteen viimeiseen tehtävään luonnollisesti, ei väkisin.

Merkitse JSON-vastauksessa jokaiselle tehtävälle:
- "topic_key": "${focus}" tai "${reviewTopics[0].focus}" sen mukaan, kumpaan se kuuluu
- "is_review": false tai true
```

### Verifiointi

`scripts/agent-test/lplan7-internal-review.mjs`:
- Mock-loginaa user joka on suorittanut Kurssi 1 oppitunnit 1–4 (mock data)
- Pyydä exercises Kurssi 1 oppitunti 5:lle (Yhdistelmä: ser vs estar)
- Verifioi: 8 tehtävästä 6 on `is_review: false` (focus = ser/estar) ja 2 on `is_review: true` (toinen aiempi oppitunti)
- Verifioi: viimeisen 2 tehtävän `topic_key` on `koulu_värit` (Oppitunti 4:n focus, koska se on viimeisin) — TAI heikoimman, jos mock-data antaa eri scoret

---

## UPDATE 2 — Kurssien välinen kertaus (spaced)

### Spec

Kun oppilas aloittaa Kurssi N:n (N >= 2):
- Oppitunti 1: tehtävistä 1 on Kurssi N-1:n grammar_focus[0] -aihetta
- Oppitunti 2: tehtävistä 1 on Kurssi N-1:n grammar_focus[1] -aihetta (jos olemassa, muuten 0)

### Backend laajennus

`lib/lessonContext.js`:

```js
if (kurssiKey !== 'kurssi_1' && lessonIndex < 2) {
  const prevKurssiKey = `kurssi_${parseInt(kurssiKey.split('_')[1]) - 1}`;
  const prevKurssi = await fetchKurssi(prevKurssiKey);
  const grammarFocus = prevKurssi.grammar_focus[lessonIndex] ?? prevKurssi.grammar_focus[0];
  reviewTopics.push({
    focus: grammarFocus,
    type: 'grammar',
    source: `${prevKurssiKey}_review`,
    crossKurssi: true,
  });
}
```

### Promptin laajennus kun `crossKurssi`

```
LISÄKERTAUS (edellinen kurssi):
Yksi tehtävistä (sijoita keskelle 4-6) kertaa aihetta "${reviewTopics[i].focus}" — tämä on edelliseltä kurssilta. Käytä saman tason vaikeutta kuin nykyinen taso, älä helpota.
```

### Verifiointi

`scripts/agent-test/lplan7-cross-kurssi-review.mjs`:
- Mock-user joka on suorittanut Kurssi 1 (kertaustesti 90%)
- Pyydä exercises Kurssi 2 oppitunti 1:lle
- Verifioi: yksi tehtävistä on `is_review: true`, `topic_key` matchaa Kurssi 1:n grammar_focus[0]:aan (`present_regular_ar`)

---

## UPDATE 3 — Kertaus-badge tehtävässä (frontend)

### UI

Exercise-screenissä (vocab/grammar) jokaisen tehtävän alussa, jos `exercise.is_review === true`:

```html
<div class="exercise-review-badge" role="note">
  <span class="exercise-review-badge__icon">↻</span>
  <span class="exercise-review-badge__text">
    Kertaus: ${exercise.review_source_label}
  </span>
</div>
```

`review_source_label` on suomennetut nimi:
- `kurssi_1_lesson_3` → "Kurssi 1, oppitunti 4: -er ja -ir verbit"
- `kurssi_1_review` → "Kurssi 1: yleiskertaus"

Frontend hakee labelin `lib/lessonLabels.js`:stä (lisää tämä helper joka mappaa source-keyt suomenkielisiksi labeleiksi).

### CSS

- Badge: `--accent-soft` background, `--accent` text, 6px padding, 12px font, border-radius 999px (pill)
- Sijainti: top-right of exercise card, 12px from edge
- Animation: `prefers-reduced-motion` -respect, fade-in 200ms

### Verifiointi

Visual: avaa lesson with `is_review: true` -tehtäviä → badge näkyy oikein. Mobile: badge ei rikko exercise-cardin layoutia.

---

## UPDATE 4 — SR-pohjainen henkilökohtainen kertaus

### Spec

Joka 3. oppitunti, lisätään 1 ekstratehtävä joka kohdistuu oppilaan vanhimpaan, edelleen heikkoon aiheeseen.

### Backend logiikka

```js
// lib/lessonContext.js
if (lessonIndex % 3 === 0 && lessonIndex > 0) {
  const allUserProgress = await fetchAllUserProgress(userId);  // Kaikki kurssit
  const weakOldest = allUserProgress
    .filter(p => (p.score_correct / p.score_total) < 0.7)
    .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))[0];

  if (weakOldest) {
    const lesson = await fetchLesson(weakOldest.kurssi_key, weakOldest.lesson_index);
    reviewTopics.push({
      focus: lesson.focus,
      type: lesson.type,
      source: `sr_personal`,
      isSR: true,
    });
    // Tämä lisätään `exerciseCount`-arvoon: +1 ekstratehtävä
  }
}
```

### Promptin laajennus kun `isSR`

```
HENKILÖKOHTAINEN KERTAUS:
Lisää viimeiseksi (tehtävä ${exerciseCount + 1}) kertaustehtävä aiheesta "${focus}". Tämä on aihe jossa oppilaalla oli aiemmin vaikeuksia. Tehtävä on selittävä — sisältää lyhyen vihjeen.
```

### Verifiointi

Mock-user jolla heikko Kurssi 1 oppitunti 2 (-ar verbit, 60%) → avaa Kurssi 2 oppitunti 3 → tehtävämäärä = expectedCount + 1, viimeinen tehtävä on -ar verbeistä.

---

## UPDATE 5 — Post-results "Kertasit myös tätä" -osio

### Spec

`#screen-lesson-results` (L-PLAN-3 + L-PLAN-6 rakennettu) näyttää results-cardin + tutorMessagen. Lisää: jos session sisälsi `is_review: true` -tehtäviä, lisää lyhyt huomio.

### UI

```html
<div class="lesson-results__review-summary" role="region" aria-label="Kertaus tässä sessiossa">
  <h3 class="lesson-results__review-summary-title">
    Kertasit myös tätä
  </h3>
  <ul class="lesson-results__review-summary-list">
    <li>
      <span class="lesson-results__review-summary-label">${reviewTopic1.label}</span>
      <span class="lesson-results__review-summary-score">${reviewScore1}/${reviewCount1}</span>
    </li>
    <!-- 2-3 itemiä max -->
  </ul>
</div>
```

### Logiikka

`POST /api/curriculum/.../complete` palauttaa nyt myös `reviewSummary`:

```js
const reviewSummary = wrongAnswers.concat(correctAnswers)
  .filter(a => a.is_review)
  .reduce((acc, a) => {
    if (!acc[a.topic_key]) acc[a.topic_key] = { correct: 0, total: 0, label: getLessonLabel(a.review_source) };
    acc[a.topic_key].total++;
    if (a.correct) acc[a.topic_key].correct++;
    return acc;
  }, {});

return { ...existing, reviewSummary };
```

`design:ux-copy` haastaa: jos kertasi 2/2 oikein → "Vahvistui: ${label}". Jos 1/2 → "Pieni muistutus tästä: ${label}". Jos 0/2 → "Tämä kaipaa vielä huomiota: ${label}". Käytä rekisteriä joka ei shamea.

---

## UPDATE 6 — `lib/lessonLabels.js` (helper)

Mappaa `kurssi_X_lesson_Y` ja `kurssi_X_review` -keyt suomenkielisiksi human-readable -labeleiksi.

```js
import { CURRICULUM } from './curriculumData.js';  // L-PLAN-2 mirror

export function getLessonLabel(sourceKey) {
  if (sourceKey.endsWith('_review')) {
    const kurssi = sourceKey.replace('_review', '');
    return `${CURRICULUM[kurssi].title} (yleiskertaus)`;
  }

  const match = sourceKey.match(/^(kurssi_\d+)_lesson_(\d+)$/);
  if (!match) return sourceKey;

  const [, kurssi, idx] = match;
  const lesson = CURRICULUM[kurssi]?.lessons?.[parseInt(idx)];
  if (!lesson) return sourceKey;

  return `${CURRICULUM[kurssi].title} · oppitunti ${parseInt(idx) + 1}: ${lesson.focus}`;
}
```

Käytä tätä:
- Backend `routes/curriculum.js` `/complete`-endpointissa (reviewSummary-labelit)
- Frontend `js/lib/lessonLabels.js` (mirror) badge-renderöinnissä

---

## UPDATE 7 — E2E-testi koko kertausketju

`scripts/agent-test/lplan7-cumulative-review.mjs`:

1. Mock-login user joka on suorittanut Kurssi 1 oppitunnit 1–4 (mixed scores: 1=85%, 2=60%, 3=90%, 4=80%)
2. Avaa Oppimispolku → Kurssi 1 → Oppitunti 5
3. Klikkaa "Aloita harjoittelu" → exercise-screen aukeaa
4. Verifioi tehtävien array:
   - Tehtävät 1..6: `topic_key` matchaa "ser_estar_intro" tai vastaava (focus)
   - Tehtävä 7: `is_review: true`, source = `kurssi_1_lesson_1` (heikoin: 60%) — eli -ar verbit
   - Tehtävä 8: `is_review: true`, source = `kurssi_1_lesson_3` (toinen, deterministinen seed)
   - Kahdella ensimmäisellä review-tehtävällä on badge "Kertaus: ..."
5. Vastaa kaikkiin
6. Lesson-results-screen näkyy
7. Verifioi: "Kertasit myös tätä" -osio näkyy, sisältää -ar verbit (1/1 tai 2/2 sen mukaan miten mock-vastasit)
8. Verifioi: tutorMessage mainitsee kertauksen ("Kertasit myös -ar verbejä — niissä menee nyt paremmin.")

Tallenna screenshotit: `loop-lplan7-{exercise-with-badge,results-with-review-summary}.png`.

---

## UPDATE 8 — axe + design-critique

Aja axe-core kaikilla tämän loopin screeneillä:
- Exercise-screen kertaus-badgella
- Lesson-results-screen "Kertasit myös tätä" -osion kanssa

Viewportit: 1440 + 375. 0 violations. Korjaa.

`design:design-critique` Playwright-screenshoteilla. Apply feedback.

---

## ORDER

1. UPDATE 6 (lessonLabels helper) — pure helper, low risk, used by others
2. UPDATE 1 (sisäinen kertaus) — backend logic
3. UPDATE 2 (cross-kurssi kertaus) — backend logic, pieni laajennus
4. UPDATE 4 (SR personal) — backend, additive
5. UPDATE 3 (kertaus-badge frontend) — UI, low risk
6. UPDATE 5 (post-results review summary) — UI + backend response shape
7. UPDATE 7 (e2e-testi)
8. UPDATE 8 (axe + critique)
9. IMPROVEMENTS.md -rivit, prefix `[2026-04-29 L-PLAN-7]`
10. Päivitä AGENT_STATE.md: `Last completed loop: L-PLAN-7`, `Next loop: TBD — pyydä käyttäjältä mitä seuraavaksi tehdään, tai jatka aiemmista deferred-itemeistä.`

---

## Ei tehdä tässä loopissa
- Uusia kurssimateriaaleja
- Landing-page muutoksia
- Maksujärjestelmän muutoksia
- Streak-laajennusta yli L-PLAN-4:n
- Onboarding-muutoksia (tehty L-PLAN-1 + L-PLAN-4 + L-PLAN-6)

---

## Valmis kun
- [ ] `lib/lessonLabels.js` toimii suomeksi
- [ ] Sisäinen kertaus: Kurssi N oppitunti M (M>=3) sisältää 2 viimeistä tehtävää aiemmasta oppitunnista
- [ ] Cross-kurssi kertaus: Kurssi N (N>=2) ensimmäiset 2 oppituntia sisältävät 1 kertaustehtävän edellisestä kurssista
- [ ] SR-personal: joka 3. oppitunti +1 lisätehtävä heikoimmasta vanhasta aiheesta
- [ ] Kertaus-badge näkyy frontendissä
- [ ] Post-results "Kertasit myös tätä" -osio näkyy
- [ ] E2E-testi ajaa läpi
- [ ] axe 0 violations
- [ ] AGENT_STATE.md + IMPROVEMENTS.md päivitetty
- [ ] SW bumped jos STATIC_ASSETS muuttui
