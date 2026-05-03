# Agent Prompt — L-PLAN-6
# Tavoitepohjainen vaikeustaso: tavoite (A/B/C/M/E/L) → tehtävämäärä + vaikeus

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. Standardilohko on pakollinen jokaiseen UPDATEen.**
2. `AGENT_STATE.md` — koko tiedosto, varmista että L-PLAN-5 on shipattu
3. `CURRICULUM_SPEC.md` §1 (filosofia), §2 (tavoitearvosana → priorisointi), §4 (etenemissäännöt), §6 (placement)
4. `IMPROVEMENTS.md` viimeiset 60 riviä — L-PLAN-5-blokki + deferred-itemit
5. `lib/levelEngine.js` ja `lib/learningPath.js` — nykyinen taso-engine ja oppimispolku

Skillit jotka aktivoidaan TÄSSÄ loopissa (lisäksi STANDARDS-listattu pohja — kaikki KÄYTÖSSÄ):
- `puheo-screen-template`, `puheo-finnish-voice`, `puheo-ai-prompt`, `ui-ux-pro-max` — KAIKKI loopit
- **Education-skillit (KAIKKI relevantti):**
  - `education/cognitive-load-analyser` — varmista että L-tavoitteen 1.5× ei aiheuta cognitive overloadia
  - `education/spaced-practice-scheduler` — A-tavoitteen "lisää toistoa" toteutuu spaced retrieval -syklin tihennyksenä
  - `education/self-efficacy-builder-sequence` — A-tavoitteen tutori-äänen kannustavuus, älä shame
  - `education/differentiation-adapter` — KOKO LOOPIN PERUSTA — eri tavoitetasoille adaptoitumisesta
  - `education/learning-target-authoring-guide` — tavoitearvosana → konkreettinen taito
  - `education/flow-state-condition-designer` — eri tavoitetasoille eri haaste-tarkkuus
  - `education/intelligent-tutoring-dialogue-designer` — tutori-äänen tone-adjustment per tavoite
  - `education/individual-spacing-algorithm-explainer` — selitä oppilaalle miksi A-tavoite on hidas tahti
  - `education/competency-unpacker` — tavoite L:n "syvempi automatisointi" tarkennettuna
- **Design plugin -skillit (KAIKKI):**
  - `design:ux-copy` — KAIKKI copy
  - `design:accessibility-review` — JOKAISEN UPDATEn jälkeen
  - `design:design-critique` — Playwright-screenshotit lopussa
  - `design:taste-frontend` jos saatavilla — KAIKKEEN frontend-uudistukseen

21st.dev sourcing pakollinen:
- Tavoite-picker: `21st.dev/s/segmented-control` + `/s/radio-group` + `/s/pill-picker`
- Syvennä-callout: `21st.dev/s/callout` + `/s/banner`
- Toast-onnistuminen: `21st.dev/s/toast` + `/s/sonner`

Verify L-PLAN-5 is shipped: grep IMPROVEMENTS.md for `[2026-04-29 L-PLAN-5]`. If missing, STOP.

---

## Konteksti

Käyttäjän briefin (2026-04-29) lopullinen, sopiva spec:

> "Tavoite L tekee enemmän tehtäviä per oppitunti juuri sekä myös silleen vaikeampia."
> "Onboarding flow ensimmäisellä kerralla se pitäisi olla se. Ja jos oppilas haluaakin muuttaa sitä sen pitää adaptoida se niin että se vaihtaa oppimispolun sellaiseksi, se säästää tekemät tehtävät mutta muuttaa niin että tavoite on nyt parempi."
> "Tavoitetaso ohjaa sisältöä."

CURRICULUM_SPEC §2 määrittelee:

| Tavoite | Painotus | Nopeus | Vaikein hallittava |
|---------|----------|--------|--------------------|
| I/A | Sanasto + preesens + preteriti | Hidas, paljon toistoa | Pret. vs imperf. |
| B | + imperfekti + konditionaali | Normaali | Aikamuotojen sekoittaminen |
| C | + futuuri + perus-subjunktiivi | Normaali | Ojalá, es importante que |
| M | + subjunktiivi syvemmin + pluskvamp. | Nopea | Subjunktiivi imperfekti |
| E | Kaikki rakenteet | Nopea | Kaikki subjunktiivimuodot |
| L | Kuten E, täydellinen kontrolli | Erittäin nopea | Ei lisäsisältöä — syvempi automatisointi |

**Filosofia (§1):** "Jokainen oppilas oppii KAIKEN — arvosanatavoite määrää VAUHDIN ja PAINOTUKSEN, ei sisällön kattavuutta."

Eli L-tavoitteinen ei "ohita kursseja" vaan tekee jokaisesta oppitunnista syvemmin. A-tavoitteinen ei "jätä subjunktiivia pois" vaan tekee kurssit hitaammin ja kertaa enemmän.

### Mitä konkreettisesti muuttuu tavoitteen mukaan

1. **Tehtävämäärä per oppitunti** — `exercise_count`-multiplier per tavoite:
   - I: 0.7× (vähemmän tehtäviä, lisää toistoa myöhemmin)
   - A: 0.85×
   - B: 1.0× (oletus)
   - C: 1.0×
   - M: 1.15×
   - E: 1.3×
   - L: 1.5×

2. **Vaikeustaso (level) per tehtävä** — OpenAI-promptiin lisätään tavoitteesta riippuva tason hinta:
   - Tehtävän baseline-taso = `lesson.level` (kurssin level: A/B/C/M/E)
   - Jos `target_grade > lesson.level`: nosta tasoa promptin mukaan ("käytä B-tason sanastoa A-tason aiheessa", "muotoile aukot vaativammin")
   - Jos `target_grade === lesson.level`: pidä baseline
   - Jos `target_grade < lesson.level`: helpota (laajempi vihjekehys, simpler distractors)

3. **Lisäharjoitukset L-tavoitteelle** — L-tavoitteella jokaisen oppitunnin lopussa on automaattinen "Syvennä" -callout joka tarjoaa 4 lisätehtävää samasta aiheesta vaikeammilla ehdoilla.

4. **Kertaustesti-pisteraja** — eri tavoitteilla eri pass-threshold:
   - I/A: 70% (lievempi)
   - B/C: 80% (oletus, CURRICULUM_SPEC default)
   - M: 85%
   - E/L: 90%

5. **AI-tutori-äänen vivahde** — tavoite L-tavoitteiselle on suora ja vaativa, A-tavoitteiselle kannustava ja kärsivällinen. Sama Suomi, eri sävy.

### Mitä on jo paikallaan (ÄLÄ koodaa uudestaan)

L-PLAN-1 placement-flow tallentaa `target_grade` -kentän `user_profile`-tauluun (osana 9 lisättyä saraketta). L-PLAN-1 OB-3 -screen näyttää suositellun lähtöpisteen sen mukaan. Mutta:
- `target_grade` ei tällä hetkellä vaikuta exercise-generationiin tai kurssien etenemiseen
- Tavoitteen muutos käyttäjän jälkeen (asetuksissa) ei adaptoi mitään

### Mitä puuttuu vielä (TÄMÄ LOOP)

1. **Target-grade -multiplier exercise-generationiin** — backend lukee `user_profile.target_grade` ja säätää exercise_count + level
2. **"Muuta tavoitetta" -näkymä asetuksissa** — käyttäjä voi muuttaa target_gradea, suoritetut oppitunnit säilyvät, tuleva polku adaptoituu
3. **Lesson-CTA -nappi näyttää tavoite-spesifisen tehtävämäärän** — "Aloita harjoittelu (10 tehtävää, ~15 min)" vaihtuu "12 tehtävää, ~18 min" jos target_grade = M
4. **L-tavoitteen "Syvennä"-callout** post-lesson-results-screenillä
5. **Tavoite-spesifinen kertaustesti-threshold**
6. **Tutori-äänen tone-adjustment** AI-promptissa target_graden mukaan
7. **Onboarding OB-1 ohjaa tarkemmin** kun käyttäjä valitsee L-tavoitteen ("Tavoite L tarkoittaa että harjoittelet enemmän ja vaativammilla tehtävillä — varmistaaksesi täydellisen hallinnan.")

---

## Skills + design plugins käyttöön

- `puheo-screen-template`
- `puheo-finnish-voice` — tone-adjustment per target_grade
- `puheo-ai-prompt` — kaikki OpenAI-kutsut
- `ui-ux-pro-max`
- `education/cognitive-load-analyser` — varmista että L-tavoitteen 1.5× ei aiheuta cognitive overloadia (kysy: onko 12 tehtävää vielä OK yhdessä sessiossa?)
- `education/self-efficacy-builder-sequence` — A-tavoitteen tutori-äänen kannustavuus, älä shame
- `education/spaced-practice-scheduler` — A-tavoitteen "lisää toistoa" toteutuu spaced retrieval -syklin tihennyksenä, ei vain enemmän tehtäviä yhteen sessioon

Design plugins:
- `design:ux-copy` — "Muuta tavoitetta" -näkymän copyt + Syvennä-callout
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen
- `design:design-critique` — Playwright-screenshotit asetukset-näkymä + lesson-CTA + post-results-Syvennä @ 1440 + 375

21st.dev sourcing — "Muuta tavoitetta" -näkymälle:
1. Visit 21st.dev/s/segmented-control + 21st.dev/s/radio-group via Playwright
2. Screenshot 2 kandidaattia → `references/app/target-grade/21stdev/`
3. Pick most restrained dark option
4. Port + cite URL

---

## UPDATE 1 — Backend: target_grade vaikuttaa exercise_count + level

### Tiedostot
- `lib/lessonContext.js` — laajenna lesson-kontekstia `targetGrade`-kentällä
- `routes/exercises.js` (`/api/generate`, `/api/grammar-drill`, `/api/reading-task`) — käytä targetGradea exercise_count + level overrideen

### Logiikka

```js
// lib/lessonContext.js — laajennettu
async function buildLessonContext({ kurssiKey, lessonIndex, userId }) {
  const lesson = await fetchLesson(kurssiKey, lessonIndex);
  const profile = await fetchUserProfile(userId);
  const targetGrade = profile?.target_grade ?? 'B';

  const multipliers = { I: 0.7, A: 0.85, B: 1.0, C: 1.0, M: 1.15, E: 1.3, L: 1.5 };
  const multiplier = multipliers[targetGrade] ?? 1.0;
  const exerciseCount = Math.round(lesson.exercise_count * multiplier);

  // Level adjustment
  const levelOrder = ['I', 'A', 'B', 'C', 'M', 'E', 'L'];
  const targetIdx = levelOrder.indexOf(targetGrade);
  const lessonIdx = levelOrder.indexOf(lesson.kurssi_level);
  let levelDirective = '';
  if (targetIdx > lessonIdx) {
    levelDirective = `Oppilaan tavoite on ${targetGrade}, kurssin taso on ${lesson.kurssi_level}. Käytä rikkaampaa sanastoa ja monimutkaisempia rakenteita kuin baseline. Distraktorit ovat lähekkäin oikeaa vastausta — ei selvästi väärää vaihtoehtoa.`;
  } else if (targetIdx < lessonIdx) {
    levelDirective = `Oppilaan tavoite on ${targetGrade}, kurssin taso on ${lesson.kurssi_level}. Pidä rakenne yksinkertaisempana, anna selkeät vihjeet, distraktorit voivat olla helpompia.`;
  }

  return {
    ...lesson,
    targetGrade,
    exerciseCount,
    levelDirective,
    // Field "stayOnFocus" already exists from L-PLAN-3
  };
}
```

OpenAI-promptin laajennus:

```
[normaali stay-on-focus + sequence-instructions L-PLAN-3:sta]

VAIKEUSTASO:
${levelDirective}
```

### Verifiointi

`scripts/agent-test/lplan6-target-multiplier.mjs`:
1. Mock-loginaa user jolla `target_grade = "L"`
2. Hae lesson 1 Kurssi 1 (oletus exercise_count 8)
3. POST `/api/generate` { lesson: { kurssiKey: 'kurssi_1', lessonIndex: 0 } }
4. Verifioi että response sisältää 12 tehtävää (8 × 1.5 = 12)
5. Vaihda target_grade = "A", uudestaan → 7 tehtävää (8 × 0.85 = 6.8 → 7)
6. Verifioi että L-tavoite-promptissa on "rikkaampaa sanastoa" -instruction (logaa request-body)

---

## UPDATE 2 — Lesson-screen CTA näyttää tavoite-spesifisen määrän

`#screen-lesson` (L-PLAN-5:ssa rakennettu) näyttää tällä hetkellä:
```
Aloita harjoittelu (8 tehtävää, ~12 min) →
```

Tämä luku on hardcoded `lesson.exercise_count`. Pitää tulla backendiltä `lessonContext.exerciseCount`.

### Korjaus

`js/screens/curriculum.js` `loadLesson()` -funktio:

```js
const lesson = await fetch(`/api/curriculum/${kurssiKey}/lesson/${lessonIndex}`);
// Response laajennettu: { lesson, teachingPage, lessonContext: { exerciseCount, targetGrade } }

const exerciseCount = lesson.lessonContext?.exerciseCount ?? lesson.lesson.exercise_count;
const estimatedMinutes = Math.round(exerciseCount * 90 / 60); // 90 sec per exercise
const ctaLabel = `Aloita harjoittelu (${exerciseCount} tehtävää, ~${estimatedMinutes} min) →`;
```

Backend `GET /api/curriculum/:kurssiKey/lesson/:lessonIndex` palauttaa nyt myös `lessonContext`-objektin (uusi kenttä responsessa, ei muuta vanhaa contractia).

### Verifiointi

User jolla target_grade = "L" avaa Numerot ja ikä → CTA näyttää "Aloita harjoittelu (12 tehtävää, ~18 min) →".
User jolla target_grade = "A" → "Aloita harjoittelu (7 tehtävää, ~10 min) →".

---

## UPDATE 3 — "Muuta tavoitetta" asetukset-näkymässä

### Tiedostot
- `app.html` — `#screen-asetukset` tai vastaava (grep)
- `js/screens/settings.js`
- `css/components/settings.css`
- `routes/auth.js` tai `routes/progress.js` — endpoint joka päivittää `user_profile.target_grade`

### UI

Settings-screenissä uusi sektio (jos olemassa olevia chip-row-rakenteita on, käytä samaa patternia):

```
┌────────────────────────────────────────────────┐
│ Tavoitearvosana                                │
│                                                 │
│ Tavoitteesi YO-kokeessa määrittää harjoituksen │
│ määrää ja vaikeutta. Voit muuttaa sitä koska   │
│ tahansa — suoritetut oppitunnit säilyvät.       │
│                                                 │
│ [I] [A] [B] [C] [M] [E] [L]                    │
│  ○   ○   ●   ○   ○   ○   ○                     │
│                                                 │
│ Nykyinen tavoite: B (normaali tahti, baseline) │
│                                                 │
│ [Tallenna muutos]                               │
└────────────────────────────────────────────────┘
```

Pill-picker (sourced from 21st.dev per rule above) — segmented control 7 vaihtoehdolla.

### Adaptaatiologiikka

Kun käyttäjä klikkaa "Tallenna muutos":

1. POST `/api/profile/update` { target_grade: "M" }
2. Backend päivittää `user_profile.target_grade`
3. Backend ÄLÄ MUUTA mitään suoritetussa data:ssa (`user_curriculum_progress` säilyy)
4. Frontend näyttää success-toastin: "Tavoite päivitetty: M. Seuraavat oppitunnit ovat hieman vaativampia."
5. Optional: jos käyttäjä on keskellä lesson:ia, älä invalidoi sitä — uusi tavoite vaikuttaa vasta seuraavasta lessonista

### Validation

`target_grade` rajoitettu arvoihin `['I', 'A', 'B', 'C', 'M', 'E', 'L']`. Jos käyttäjä yrittää asettaa muuta → 400.

### A11y

Pill-picker: `role="radiogroup"`, jokaisella pillillä `role="radio"` + `aria-checked`. ArrowLeft/ArrowRight navigoi. Space valitsee.

---

## UPDATE 4 — L-tavoitteen "Syvennä"-callout post-results-screenillä

CURRICULUM_SPEC §2: L-tavoite = "syvempi automatisointi", ei lisäsisältö.

### Spec

`#screen-lesson-results` (L-PLAN-3 rakennettu) näyttää results-cardin + tutorMessagen + CTA:n. Lisää: jos `user_profile.target_grade === 'L'` JA `score / total >= 0.85`, näytä Syvennä-callout ennen "Jatka oppimispolkua →" -nappia.

### UI

```html
<div class="lesson-results__deepen" role="region" aria-label="L-tason syventävät harjoitukset">
  <h3 class="lesson-results__deepen-title">
    Syvennä taitoasi
  </h3>
  <p class="lesson-results__deepen-body">
    L-tavoitteena halutaan täydellinen hallinta. 4 lisätehtävää samasta aiheesta vaativammilla ehdoilla — tee ne nyt kun aihe on tuore.
  </p>
  <button class="btn btn--accent" id="btn-deepen-yes">
    Tee 4 lisätehtävää (~6 min)
  </button>
  <button class="btn btn--ghost btn--sm" id="btn-deepen-skip">
    Ohita tällä kertaa
  </button>
</div>
```

### Logiikka

`btn-deepen-yes`:
1. POST `/api/generate` `{ lesson: { kurssiKey, lessonIndex }, mode: 'deepen' }`
2. Backend generoi 4 vaikeutetua tehtävää saman fokuksen ympärille
3. Frontend renderöi exercise-mode mutta merkitsee "syvennys" badge top-bar:iin
4. Suorituksen jälkeen palaa results-screeniin (uusi mini-card "Syvennys: 4/4 oikein")

Backend `/api/generate` `mode: 'deepen'`:
- exercise_count = 4
- Lisää OpenAI-promptiin: "Nämä ovat L-tason lisätehtäviä. Käytä monimutkaisempia konjunktioita, distraktorit ovat lähekkäin oikeaa vastausta, vältä yksinkertaisia esimerkkejä."

### CSS

`--accent-glow` light-radial behind callout-card. Border `var(--accent)` 1px.

---

## UPDATE 5 — Tavoite-spesifinen kertaustesti-threshold

`routes/curriculum.js` `/complete`-endpoint:

```js
const passThresholds = { I: 0.7, A: 0.7, B: 0.8, C: 0.8, M: 0.85, E: 0.9, L: 0.9 };
const targetGrade = userProfile?.target_grade ?? 'B';
const threshold = passThresholds[targetGrade] ?? 0.8;

const isKertaustesti = lesson.type === 'test';
const passed = isKertaustesti && (scoreCorrect / scoreTotal) >= threshold;

if (passed) {
  // Mark kurssi complete, unlock next
}
```

Frontend (`js/screens/lessonResults.js`) renderöi pass-threshold-tiedon:
- Jos test ja >= threshold: "Kurssi suoritettu ✓"
- Jos test ja < threshold: "Kurssi vaatii vielä harjoittelua. Tavoitteellasi (M) tarvitaan vähintään 85 % läpipääsyyn."

Tutor-message AI-promptissa: kerro thresholdin syy lyhyesti.

---

## UPDATE 6 — Tutori-äänen tone-adjustment

AI-promptit (kaikki `lib/openai.js` -kutsut) ottavat huomioon `target_grade`-kentän tonen säätöön.

### Promptin laajennus

```
TYYLI:
- Tavoite ${targetGrade}: ${toneDescriptors[targetGrade]}
- Aina sinä-muoto, suomeksi, max 2 lausetta
- Ei "Hyvää työtä!" -geneerisyyksiä
```

`toneDescriptors`:
- I: "Erittäin kannustava, kärsivällinen, juhli pieniä voittoja, älä koskaan moittele virheistä."
- A: "Lämmin, kärsivällinen, nimeä konkreettinen onnistuminen, vihjaa seuraavaan askeleeseen pehmeästi."
- B: "Suora ja lämmin, nimeä mitä meni hyvin ja mitä parannetaan, ehdota seuraava askel."
- C: "Suora, nimeä rakenne joka oli vahva, mainitse yksi spesifi parannuskohde."
- M: "Suora ja vaativa mutta lämmin, oletuksena että oppilas haluaa parantua, käytä ammattikielen termiä jos relevantti."
- E: "Vaativa, suora, oletuksena täydellinen hallinta tavoitteena, älä keventele virheitä."
- L: "Erittäin vaativa, oleta täydellinen kontrolli, nosta esille hienoja vivahde-eroja, vaadi lisätyötä jos jokin oli horjuva."

### Verifiointi

`scripts/agent-test/lplan6-tone.mjs`:
- Pyydä tutorMessage A-tavoitteelliselle 5/8 oikein → vastauksessa lämmin tone, "ihan hyvä alku"
- Pyydä tutorMessage L-tavoitteelliselle 7/8 oikein → vastauksessa vaativampi tone, "yksi virhe pluskvamperfektissä — palataan siihen"

---

## UPDATE 7 — Onboarding OB-1: tavoitteen valinta + selitys

`#screen-ob1-profile` (L-PLAN-1 rakennettu) sisältää tavoite-pickerin. Lisää sen alle dynaaminen kuvaus joka muuttuu valinnan mukaan:

```
Tavoite L
Tahti: erittäin nopea • 1.5× tehtäviä per oppitunti • Syventäviä lisätehtäviä
Sopii sinulle jos: haluat täydellisen hallinnan ja tähtäät korkeimpaan arvosanaan.
```

Kuvauksen sisältö per tavoite:

- **I**: Tahti: hidas • 0.7× tehtäviä • Paljon toistoa • Sopii alkajalle.
- **A**: Tahti: hidas-normaali • 0.85× tehtäviä • Selkeitä esimerkkejä • Sopii kielen alkutaipaleelle.
- **B**: Tahti: normaali • Baseline tehtävämäärä • Sopii useimmille.
- **C**: Tahti: normaali • Baseline tehtävämäärä • Hieman haastavammat tehtävät.
- **M**: Tahti: nopea • 1.15× tehtäviä • Vaativammat distraktorit • Sopii hyvin osaavalle.
- **E**: Tahti: nopea • 1.3× tehtäviä • Vivahde-erot tärkeitä.
- **L**: Tahti: erittäin nopea • 1.5× tehtäviä • Syventäviä lisätehtäviä • Sopii kielitaidon huipulle tähtäävälle.

### Apply
- `puheo-finnish-voice`
- `education/self-efficacy-builder-sequence` — frame as "tavoite mahdollistaa" ei "tavoite vaatii"

---

## UPDATE 8 — E2E-testi target-grade-vaihto

`scripts/agent-test/lplan6-target-grade-flow.mjs`:

1. Mock-login user1: target_grade = "B"
2. Avaa Oppimispolku → Kurssi 1 → Oppitunti 1 (Sanasto: perhe)
3. Verifioi CTA: "Aloita harjoittelu (8 tehtävää, ~12 min) →"
4. Suorita oppitunti 8/8 oikein
5. Navigoi Asetukset → muuta tavoite "L"
6. Toast näkyy: "Tavoite päivitetty: L."
7. Palaa Oppimispolku → Oppitunti 1 on edelleen merkitty suoritetuksi (säilyy)
8. Avaa Oppitunti 2 → CTA: "Aloita harjoittelu (12 tehtävää, ~18 min) →" (1.5× multiplier)
9. Suorita oppitunti 12/12 oikein
10. Lesson-results-screen näkyy
11. Verifioi: "Syvennä taitoasi" -callout näkyy (target_grade L + score >= 85%)
12. Klikkaa "Tee 4 lisätehtävää" → exercise-screen with deepen-badge
13. Suorita 4 tehtävää
14. Palaa results-screeniin

Tallenna screenshotit: `loop-lplan6-{settings,lesson-cta-L,deepen-callout,deepen-exercises}.png`.

---

## UPDATE 9 — axe + design-critique

Aja axe-core kaikilla tämän loopin screeneillä:
- Asetukset-screen tavoite-pillerillä
- `#screen-ob1-profile` dynaamisen kuvauksen kanssa
- `#screen-lesson` CTA:n kanssa
- `#screen-lesson-results` Syvennä-calloutin kanssa
- Exercise-screen deepen-badgella

Viewportit: 1440 + 375. 0 violations. Korjaa.

`design:design-critique` Playwright-screenshoteilla. Apply feedback.

---

## ORDER

1. UPDATE 1 (backend multiplier + level directive) — pure backend
2. UPDATE 2 (CTA-label) — frontend, low risk
3. UPDATE 5 (kertaustesti-threshold) — backend, low risk
4. UPDATE 6 (tone-adjustment) — backend, prompt-only
5. UPDATE 7 (OB-1 dynaaminen kuvaus) — frontend, additive
6. UPDATE 3 (Asetukset → muuta tavoitetta) — biggest UI piece
7. UPDATE 4 (Syvennä-callout) — frontend
8. UPDATE 8 (e2e-testi)
9. UPDATE 9 (axe + critique)
10. IMPROVEMENTS.md -rivit, prefix `[2026-04-29 L-PLAN-6]`
11. Päivitä AGENT_STATE.md: `Last completed loop: L-PLAN-6`, `Next loop: L-PLAN-7 (kumulatiivinen kertaus). Read AGENT_PROMPT_LPLAN7.md before starting.`

---

## Ei tehdä tässä loopissa
- Kumulatiivista kertausta (L-PLAN-7)
- Streak-laajennusta
- Landing-page muutoksia
- Maksujärjestelmän muutoksia
- Oppituntinäkymän overhaulia (tehty L-PLAN-5:ssa)

---

## Valmis kun
- [ ] `target_grade` vaikuttaa exercise_count + level (backend)
- [ ] Lesson-CTA näyttää tavoite-spesifisen tehtävämäärän
- [ ] Asetukset-screenissä toimii "Muuta tavoitetta", suoritukset säilyvät
- [ ] L-tavoitteen Syvennä-callout näkyy post-results
- [ ] Kertaustesti-threshold riippuu target_gradesta
- [ ] AI-tutorin tone vaihtelee target_graden mukaan
- [ ] OB-1 näyttää dynaamisen kuvauksen tavoitteen mukaan
- [ ] E2E-testi ajaa läpi
- [ ] axe 0 violations
- [ ] AGENT_STATE.md + IMPROVEMENTS.md päivitetty
- [ ] SW bumped jos STATIC_ASSETS muuttui
