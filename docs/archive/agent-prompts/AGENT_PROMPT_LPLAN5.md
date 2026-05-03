# Agent Prompt — L-PLAN-5
# Oppituntinäkymä joka oikeasti opettaa: teaching content + topic-locked exercises

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. Standardilohko on pakollinen jokaiseen UPDATEen.**
2. `AGENT_STATE.md` — koko tiedosto, varmista että L-PLAN-4 on shipattu
3. `CURRICULUM_SPEC.md` §3 (oppituntirakenne per kurssi), §5 (opetussivut), §7 (tutoriääni)
4. `IMPROVEMENTS.md` viimeiset 60 riviä — erityisesti L-PLAN-4-blokki ja deferred-itemit

Skillit jotka aktivoidaan TÄSSÄ loopissa (lisäksi STANDARDS-listattu pohja — kaikki KÄYTÖSSÄ):
- `puheo-screen-template`, `puheo-finnish-voice`, `puheo-ai-prompt`, `ui-ux-pro-max` — KAIKKI loopit
- **Education-skillit (KAIKKI relevantti — LUE ennen UPDATEjen alkua):**
  - `education/explicit-instruction-sequence-builder` — opetussivun "I do → We do → You do" -progressio
  - `education/worked-example-fading-designer` — kurssi-tason fading: oppitunti 1 = full worked example, oppitunti N (ennen kertaustestiä) = vain hint
  - `education/practice-problem-sequence-designer` — recognition→production
  - `education/adaptive-hint-sequence-designer` — vihje 1 = sääntö, vihje 2 = worked example, vihje 3 = step-by-step
  - `education/cognitive-load-analyser` — älä ylikuormita opetussivua, max ~4 distinct elementtiä
  - `education/learning-target-authoring-guide` — jokaisen teaching pagen "what you will be able to do" -lause
  - `education/competency-unpacker` — vocab/grammar-aiheen pilkkominen alaosiin teaching pagessa
  - `education/retrieval-practice-generator` — exerciset ovat retrieval-pohjaisia, ei recognition-only
  - `education/formative-assessment-loop-designer` — välitön palaute jokaisen tehtävän jälkeen
- **Design plugin -skillit (KAIKKI):**
  - `design:ux-copy` — KAIKKI copy: opetussivu, badge, modaali, hint, dialog
  - `design:accessibility-review` — JOKAISEN UPDATEn jälkeen
  - `design:design-critique` — Playwright-screenshotit lopussa
  - `design:design-system` — varmista että uudet komponentit mappaa olemassa oleviin tokeneihin
  - `design:taste-frontend` jos saatavilla — KAIKKEEN frontend-uudistukseen

21st.dev sourcing pakollinen tähän looppiin:
- Lesson-sivun layout: `21st.dev/s/article` + `/s/lesson` + `/s/markdown`
- Side-panel: `21st.dev/s/side-panel` + `/s/sheet`
- Confirm-dialog: `21st.dev/s/dialog` + `/s/alert-dialog`
- Badge: `21st.dev/s/badge`

Verify L-PLAN-4 is shipped: grep IMPROVEMENTS.md for `[2026-04-29 L-PLAN-4]`. If missing, STOP.

Verify Supabase-migraatio on ajettu: `curl http://localhost:3000/api/curriculum/kurssi_1` palauttaa 10 oppituntia tietokannasta (ei JS-mirrorista). Jos ei, käyttäjän pitää ajaa migraatio ennen tätä looppia.

---

## Konteksti

Käyttäjän valitus 2026-04-29 (suora käännös):
> "Tämä kurssi homma, tämä on nyt aivan väärin tehty esimerkiksi jos avaan numerot ja ikä, siinä ei ole mitään opetuslappua niikun halusin että on mistä voi kerrata ne yms, jos painaa aloita harjottelu se heittää minut tuonne puheoppi kohtaan missä voi tehdä tehtäviä kaikista eri asioista. Sen piti olla niin että kun avaan esim oppitunti 6 se oikeesti tekee sinulle oppitunnin, opettaa sinulle asiat, sitten teet paljon eri tehtäviä liittyen siihen."

### Mitä tämä tarkoittaa konkreettisesti

Käyttäjä avaa `Oppimispolku → Kurssi 1 → Oppitunti 6 (Numerot ja ikä)` ja näkee:
- Vain oppitunnin nimi + lyhyt teaching_snippet (yhden lauseen vihje)
- "Aloita harjoittelu →" -nappi
- Klikkaus heittää käyttäjän vanhaan Sanasto / Puheoppi -screeniin missä tehtävät EIVÄT ole topic-locked

Tämän pitäisi näkyä:
- Täysi opetussivu (Markdown, 1 kpl + Muodostus-taulukko + Esimerkki + YO-vinkki) joka oikeasti opettaa aiheen
- Mahdollisuus kerrata sisältöä myöhemmin (oppitunti pysyy luettavissa)
- "Aloita harjoittelu →" → lesson-spesifinen tehtäväsekvenssi joka pysyy AINOASTAAN aiheessa "numerot ja ikä", recognition→production-järjestyksessä

### Mikä on jo paikallaan (ÄLÄ koodaa uudestaan)

L-PLAN-2: Backend `GET /api/curriculum/:kurssiKey/lesson/:lessonIndex` lazy-generoi opetussivun OpenAI:lla ja cachettaa `teaching_pages`-tauluun. Schema (CURRICULUM_SPEC §5):
- `# [Otsikko]`
- 1 kpl, max 80 sanaa selkokielinen suomi
- `## Muodostus` (taulukko tai listaus, vain kielioppiaiheille)
- `## Esimerkki` (1–2 lausetta espanjaksi + suomennos)
- `## YO-vinkki 💡` (1–2 lausetta YO-kokeesta)

L-PLAN-2: `#screen-lesson` näyttää teaching pagen Markdown-rendererillä + "Aloita harjoittelu →" -napin.

L-PLAN-3: `lib/lessonContext.js` + frontend `js/lib/lessonContext.js` injektoi lesson-kontekstin (`{ kurssiKey, lessonIndex }`) `/api/generate`, `/api/grammar-drill`, `/api/reading-task` -kutsuihin → backend overrideaa level + topic + count + lisää "stay on focus" -instruction OpenAI-promptiin.

L-PLAN-3: post-session results-card + `lessonResults.js`.

### Mitä puuttuu vielä (TÄMÄ LOOP)

1. **Oppitunti ei oikeasti renderöi opetussivua** vocab-tyyppisille oppitunneille — vain grammar/mixed saa AI-generoidun teaching pagen. Vocab-oppitunnit (esim. "Numerot ja ikä", "Koulu ja värit") näyttävät vain `teaching_snippet`-rivin.
2. **Topic-lock ei ole bullet-proof** — vaikka `lessonContext` injektoidaan, vanhat free-practice -screenit voivat ohittaa sen tietyissä polkuissa (esim. kun käyttäjä navigoi Sanastoon main-navista keskellä lessonia).
3. **Tehtävämäärä per oppitunti ei vastaa speciä** — CURRICULUM_SPEC määrittelee `exercise_count`-kentän per lesson (oletus 8) mutta frontend voi rendata eri määrän. Pitää sidota.
4. **Recognition→production-järjestys** — backend `lessonContext` lisää suomenkielisen instruction OpenAI-promptiin, mutta järjestystä ei eksplisiittisesti enforcata. Jos AI palauttaa 8 production-tyyppistä → väärin.
5. **Re-read teaching page** — käyttäjä ei voi palata teaching pageen tehtäviä tehdessään. Pitäisi olla "📖 Opetussivu" -nappi joka avaa side-panelin tai modaalin.

Tämä loop tekee oppituntinäkymästä **oikeasti pedagogisen yksikön**.

---

## Skills + design plugins käyttöön

- `puheo-screen-template`
- `puheo-finnish-voice`
- `puheo-ai-prompt` — KAIKKI OpenAI-kutsut tässä loopissa noudattavat skill-pohjan promptia
- `ui-ux-pro-max`
- `education/explicit-instruction-sequence-builder` — opetussivun "I do → we do → you do" -progressio
- `education/worked-example-fading-designer` — kurssi-tason fading: oppitunti 1 = full worked example, oppitunti N (ennen kertaustestiä) = vain hint
- `education/practice-problem-sequence-designer` — recognition→production
- `education/adaptive-hint-sequence-designer` — vihje 1 = sääntö, vihje 2 = worked example, vihje 3 = step-by-step

Design plugin skills:
- `design:ux-copy` — kaikki teaching-page -copy + nappi-labelit
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen
- `design:design-critique` — Playwright-screenshotit lesson-screen + exercise-screen-with-context @ 1440 + 375

21st.dev sourcing — opetussivun layoutille:
1. Visit 21st.dev/s/article + 21st.dev/s/lesson + 21st.dev/s/markdown via Playwright
2. Screenshot 2 kandidaattia → `references/app/lesson-page/21stdev/`
3. Pick most restrained dark option
4. Port React+Tailwind → vanilla CSS
5. Cite exact 21st.dev component URL in IMPROVEMENTS.md

---

## UPDATE 1 — Vocab-tyyppisten oppituntien teaching page

Backend `GET /api/curriculum/:kurssiKey/lesson/:lessonIndex` generoi teaching pagen vain `lesson.type` in `['grammar', 'mixed']`. Vocab-oppitunnit eivät saa.

### Korjaus `routes/curriculum.js`:

Laajenna teaching page -generointi käsittämään `vocab`-tyyppiset oppitunnit. Vocab-oppitunneille käytä eri prompt-pohjaa:

```js
const vocabTeachingPrompt = `Kirjoita opetussivu sanastoaiheesta: [lesson.focus].

RAKENNE TARKASTI:
# [Otsikko — sanastoaihe]

[1 kappale (max 80 sanaa) selkokielistä suomea — kerro mistä sanastosta on kyse, miksi se on tärkeä, ja miten YO-koe testaa sitä.]

## Tärkeimmät sanat

| Suomeksi | Espanjaksi | Esimerkki |
|----------|-----------|-----------|
| ... | ... | ... |

(Listaa 8–12 ydinsanaa tästä aiheesta. Esimerkki on yksinkertainen lause espanjaksi.)

## Muista nämä

[2–3 lausetta yleisimmistä sudenkuopista. Esim. "Numero 'siete' on s-alkuinen, ei f-alkuinen kuten suomalainen 'seitsemän'."]

## YO-vinkki 💡

[1–2 lausetta YO-kokeen näkökulmasta. Mitä testataan, mitä kannattaa hallita.]

ÄLÄ käytä bullet pointteja muualla kuin ohjeissa. Käytä sinä-muotoa. Älä mainitse "tasoa" tai "placementLevel"-arvoa.`;
```

`max_tokens: 500, temperature: 0.3`. Cache `teaching_pages`-tauluun key `${kurssiKey}_lesson_${sortOrder}`.

Hardcoded fallback jos AI failaa tai palauttaa <50 chars: lyhyt template per `lesson.focus` joka nimeää aiheen suomeksi.

### Reading + writing -tyyppiset oppitunnit

`reading`-tyyppinen oppitunti: ÄLÄ generoi teaching pagea — itse luetun ymmärtäminen -teksti on opetussisältö. Mutta lisää lyhyt intro-snippet ennen tekstiä: "Tämä teksti on [B/C/M]-tasoa. Lue rauhassa, älä yritä ymmärtää joka sanaa."

`writing`-tyyppinen: opetussivu = kirjoitusohje. Generoi prompt:
```
# [Tehtävän otsikko, esim. "Kirjoita itsestäsi"]

Mitä kirjoitat: [lesson.focus]
Pituus: [N–M sanaa]
Aikamuoto(ja): [aiheen mukaan]

## Vinkki rakenteeseen

[3 bullet-pointtia: aloitus, keskikohta, lopetus]

## Mistä saat pisteitä

- Viestinnällisyys: [kuvaus]
- Kielen rakenteet: [kuvaus]
- Sanasto: [kuvaus]
- Kokonaisuus: [kuvaus]

## Esimerkkilause

> [yksi malli-lause espanjaksi + suomennos]
```

`max_tokens: 350, temperature: 0.3`.

### Cache-invalidaatio

Jos opetussivu on cachetettu mutta `teaching_snippet`-kenttä on muuttunut DB:ssä (kurssin päivitys), regeneroi. Yksinkertainen check: jos `teaching_pages.generated_at < curriculum_lessons.updated_at`. Älä koske jos `updated_at`-saraketta ei ole — lisää se silloin migration patchina.

---

## UPDATE 2 — `#screen-lesson` rebuild: oikea opetussivu

### Tiedostot
- `app.html` — `#screen-lesson` markkup
- `js/screens/curriculum.js` — `loadLesson()` -funktio
- `css/components/curriculum.css` — lesson-screen tyylit

### Layout (Desktop 1440px)

```
┌─────────────────────────────────────────────────────────┐
│ ← Oppimispolku                                          │ ← back-link
│                                                          │
│ KURSSI 1 · OPPITUNTI 6                                  │ ← eyebrow muted
│ Numerot ja ikä                                          │ ← H1 display 40px
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ [Markdown-renderöity teaching page]                │  │
│ │                                                     │  │
│ │ # Numerot ja ikä                                    │  │
│ │ Numerot 1–100 ovat YO-kokeen perusta...            │  │
│ │                                                     │  │
│ │ ## Tärkeimmät sanat                                 │  │
│ │ [taulukko]                                          │  │
│ │                                                     │  │
│ │ ## Muista nämä                                      │  │
│ │ ...                                                 │  │
│ │                                                     │  │
│ │ ## YO-vinkki 💡                                     │  │
│ │ ...                                                 │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Aloita harjoittelu (8 tehtävää, ~12 min) →         │  │ ← primary CTA
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Voit aina palata tähän opetussivuun harjoituksen aikana. │ ← muted hint
└─────────────────────────────────────────────────────────┘
```

### Layout (Mobile 375px)

Sama mutta full-width, max-width 100%, padding 20px.

### Markdown-renderer

Reuse existing in-house Markdown renderer L-PLAN-2:sta (curriculum.js). Tuettavat elementit:
- `# H1`, `## H2`, `### H3`
- `**bold**`, `*italic*`, `code`
- `> blockquote` (käytetään esimerkeille)
- `| table |` (Muodostus + Tärkeimmät sanat)
- `- bullet list` (vain `## Vinkki rakenteeseen`-osiossa writingissä)

Sanitoi HTML-input ennen renderöintiä (escape `<`, `>`, `&`). Älä salli scriptejä.

### Apply
- `puheo-screen-template` card-layout
- Card max-width 720px desktop, full-width mobile
- Background `var(--surface)`, padding 32px desktop / 20px mobile
- Border-radius 16px
- H1 font 40px Geist 700
- Body font 17px Geist 400, line-height 1.7
- Accent links + accent --accent in YO-vinkki callout

### CTA-nappi

`Aloita harjoittelu →` — laajempi label joka näyttää tehtävämäärän:
```
Aloita harjoittelu (8 tehtävää, ~12 min) →
```

Aikataulu lasketaan: `exercise_count * 90 sec / 60 = minuutit`. Pyöristä lähimpään minuuttiin.

Klikkaus:
1. Tallenna `sessionStorage.currentLesson = { kurssiKey, lessonIndex, type, focus }`
2. Navigoi oikeaan exercise-screeniin `lesson.type`-kentän mukaan:
   - `vocab` → `#screen-vocab`
   - `grammar` → `#screen-grammar` (tai mikä Puheoppi-screen on)
   - `reading` → `#screen-reading`
   - `writing` → `#screen-writing`
   - `mixed` → `#screen-grammar` (fallback)
   - `test` → `#screen-test` (kertaustesti, ei oppitunti)

### Verifiointi

Avaa `#screen-lesson?kurssi=kurssi_1&index=5` (Numerot ja ikä). Pitäisi näkyä:
- "KURSSI 1 · OPPITUNTI 6" eyebrow
- "Numerot ja ikä" H1
- Markdown-card teaching page
- "Aloita harjoittelu (8 tehtävää, ~12 min) →" CTA

axe 0 violations @ 1440 + 375.

---

## UPDATE 3 — Topic-lock bullet-proofing

`lessonContext` injektoidaan jo, mutta vanhat free-practice -screenit voivat ohittaa sen jos käyttäjä navigoi pois Oppimispolusta keskellä lessonia.

### Korjaus 1: Frontend-screenien sessionStorage-check

`js/screens/vocab.js`, `js/screens/grammar.js`, `js/screens/reading.js`, `js/screens/writing.js`:

Top-of-screen-bootissa:
```js
const lessonContext = getLessonContext(); // sessionStorage.currentLesson
if (lessonContext) {
  // Renderöi lesson-mode UI:
  // - "Oppitunti N: [focus]" badge top-left
  // - "📖 Opetussivu" -nappi top-right (avaa modaali/side-panel)
  // - "← Lopeta oppitunti" -nappi (clearLessonContext + navigoi takaisin Oppimispolkuun)
} else {
  // Renderöi normaali free-practice UI
}
```

### Korjaus 2: Pois-navigointi ilman lopetusta

Jos käyttäjä navigoi pois exercise-screeniltä main-nav-kautta (esim. klikkaa "Sanasto" main-navista) WHILE `lessonContext` on aktiivinen:
- Näytä confirm-dialogi: "Sinulla on käynnissä oppitunti '[focus]'. Haluatko lopettaa harjoittelun nyt?"
- Vaihtoehdot: "Jatka oppituntia" (sulje dialogi, pysy screeneillä) | "Lopeta" (clearLessonContext + navigoi)

ÄLÄ käytä natiivia `confirm()` — käytä Puheo-stylattua modaalia. Jos modal-primitive ei ole vielä olemassa, lisää minimal `js/features/confirmDialog.js` joka renderöi accessible role="dialog" + focus-trap.

### Korjaus 3: Backend-validaatio

`/api/generate`, `/api/grammar-drill`, `/api/reading-task` palautavat `topic_key` jokaiselle generoidulle tehtävälle. Lisää backend-validaatio: jos `lesson.focus` on annettu mutta yksikään palautetuista tehtävistä ei matchaa lessonin focus-kenttää (string-similarity < 0.5), regeneroi kerran uusilla constraint-ohjeilla. Jos toinen yritys epäonnistuu, palauta 500 + log.

### Korjaus 4: Recognition→production-järjestys

`lib/lessonContext.js` lisää tällä hetkellä Finnish "stay on focus" -instructionin OpenAI-promptiin. Laajenna se enforcaamaan järjestystä:

```
Tehtäväjärjestys (TÄRKEÄ): aloita helpoimmista tunnistustehtävistä, etene tuotantotehtäviin.
- Tehtävät 1–3: monivalinta tai aukko (recognition)
- Tehtävät 4–6: täydennys jossa oppilas valitsee oikean muodon useammasta vaihtoehdosta (guided production)
- Tehtävät 7–8: oppilas tuottaa muodon ilman valintoja (full production)

Kertaa ydinsanasto: tehtävässä 8 esiintyvät avainsanat (vähintään 3) ovat samoja kuin tehtävässä 1.
```

### Verifiointi

`scripts/agent-test/lplan5-topic-lock.mjs`:
1. Mock-loginaa Pro-user
2. Navigoi `#screen-lesson?kurssi=kurssi_1&index=1` (-ar verbit preesensissä)
3. Klikkaa "Aloita harjoittelu" → odota että ensimmäinen tehtävä lataa
4. Verifioi että tehtävän topic_key contains `present_regular_ar` tai vastaava (string-match)
5. Klikkaa main-navista "Sanasto" → confirm-dialogi näkyy
6. Vahvista "Jatka oppituntia" → pysy exercise-screenillä
7. Klikkaa main-navista uudestaan → "Lopeta" → siirtyy Sanasto-screenille, `sessionStorage.currentLesson` on tyhjä

---

## UPDATE 4 — "📖 Opetussivu"-nappi exercise-screenissä

Käyttäjä haluaa pystyä kertaamaan teaching pagen tehtäviä tehdessään.

### UI

Top-right corner of exercise-screen, top bar:
- Lucide-ikoni `BookOpen` 20px + label "Opetussivu" (mobiilissa vain ikoni)
- Hover: `--accent-soft` background
- Click: avaa side-panel (desktop) tai modaali (mobile)

### Side-panel (Desktop ≥880px)

- Slide-in oikealta, 480px leveä, 100vh korkea
- Sisältö: sama Markdown-renderöity teaching page kuin `#screen-lesson`
- Top: "← Sulje" -nappi + lesson title
- Background: `var(--surface-elevated)`, border-left `var(--border)`
- Animation: `transform: translateX(100%) → translateX(0)` 240ms ease-out
- `prefers-reduced-motion`: ei animaatiota
- Click outside / Escape sulkee
- Focus-trap kun avoinna

### Modaali (Mobile <880px)

- Full-screen overlay
- Slide-up animaatio
- Top: "← Sulje" -nappi
- Sisältö sama kuin desktop

### Tiedostot
- `js/features/teachingPanel.js` (NEW)
- `css/components/teaching-panel.css` (NEW)

Lisää SW STATIC_ASSETS-listaan.

### A11y

`role="dialog"`, `aria-modal="true"`, `aria-labelledby` lesson-title-elementtiin. Focus moves to close-button on open. Focus returns to source-button on close.

---

## UPDATE 5 — exercise_count-laskelma + tehtäväketjun pituus

Backend `lessonContext`:n `exercise_count` (default 8) pitää määrittää frontendin renderöimien tehtävien määrää. Tällä hetkellä frontend voi näyttää 5 tai 10 satunnaisesti.

### Korjaus

`lib/lessonContext.js` (backend): lue `curriculum_lessons.exercise_count` ja overrideaa `count`-parametri OpenAI-kutsussa.

`js/screens/vocab.js` (+grammar, reading): kun `lessonContext` aktiivinen, render exactly `lessonContext.exerciseCount` exercises. Älä lisää bonus-tehtäviä.

Laskenta: vocab → 8, grammar → 8, mixed → 10, reading → 1 teksti + 5 kysymystä, writing → 1 tehtävä + AI-grading, kertaustesti → 15 sekalaista.

### Verifiointi

`scripts/agent-test/lplan5-exercise-count.mjs`:
- Avaa lesson 1 (Sanasto: perhe + kansallisuudet) → exactly 8 tehtävää
- Avaa lesson 5 (Yhdistelmä: ser vs estar) → exactly 10 tehtävää
- Avaa lesson 10 (Kertaustesti) → exactly 15 tehtävää

---

## UPDATE 6 — E2E-testi: oppilas tekee koko Oppitunti 6:n loppuun

`scripts/agent-test/lplan5-lesson6-e2e.mjs`:

1. Mock-login
2. Navigoi `Oppimispolku → Kurssi 1 → Oppitunti 6 (Numerot ja ikä)`
3. `#screen-lesson` aukeaa
4. Verifioi:
   - Eyebrow "KURSSI 1 · OPPITUNTI 6"
   - H1 "Numerot ja ikä"
   - Markdown-card sisältää otsikon "Tärkeimmät sanat" + taulukon
   - CTA "Aloita harjoittelu (8 tehtävää, ~12 min) →"
5. Klikkaa CTA → exercise-screen aukeaa
6. Verifioi top-bar: badge "Oppitunti 6: numerot ja ikä" + "📖 Opetussivu" -nappi
7. Klikkaa "📖 Opetussivu" → side-panel aukeaa, sama Markdown näkyy
8. Sulje side-panel
9. Vastaa 8 tehtävään (mock-vastaukset, kaikki oikein)
10. Lesson-results-screen näkyy → tutorMessage renderöityy
11. Klikkaa "Jatka oppimispolkua →" → palaa `#screen-path`-screenille
12. Verifioi: Oppitunti 6 on merkitty suoritetuksi (check-icon)

Tallenna screenshotit: `loop-lplan5-{lesson6,exercise-with-panel,results}.png`.

---

## UPDATE 7 — axe + design-critique

Aja axe-core kaikilla tämän loopin screeneillä:
- `#screen-lesson` (uusi layout)
- exercise-screenit kun `lessonContext` aktiivinen (badge + opetussivu-nappi)
- Teaching-panel auki (desktop + mobile)
- Confirm-dialog auki

Viewportit: 1440 + 375. Tavoite: 0 violations. Korjaa.

Aja `design:design-critique` Playwright-screenshoteilla. Apply feedback.

---

## ORDER

1. UPDATE 1 (vocab/reading/writing teaching page generation backend)
2. UPDATE 2 (`#screen-lesson` rebuild)
3. UPDATE 5 (exercise_count enforcement) — pure backend+frontend, low risk
4. UPDATE 4 (📖 Opetussivu nappi) — additive, low risk
5. UPDATE 3 (topic-lock bullet-proofing) — touches multiple screens, do once others stable
6. UPDATE 6 (e2e-testi)
7. UPDATE 7 (axe + critique)
8. IMPROVEMENTS.md -rivit, prefix `[2026-04-29 L-PLAN-5]`
9. Päivitä AGENT_STATE.md: `Last completed loop: L-PLAN-5`, `Next loop: L-PLAN-6 (tavoitepohjainen vaikeustaso). Read AGENT_PROMPT_LPLAN6.md before starting.`

---

## Ei tehdä tässä loopissa
- Tavoitepohjaista vaikeutta (L-PLAN-6)
- Kumulatiivista kertausta (L-PLAN-7)
- Landing-page muutoksia
- Maksujärjestelmän muutoksia
- Streak-systeemin laajentamista
- Uusia kurssimateriaaleja (sisältö generoidaan AI:lla per existing CURRICULUM_SPEC §5)

---

## Valmis kun
- [ ] Vocab/reading/writing -oppitunneilla on AI-generoitu opetussivu, cachettu
- [ ] `#screen-lesson` näyttää eyebrowin + H1:n + Markdown-cardin + CTA:n with exercise count + duration
- [ ] Exercise-screen näyttää "Oppitunti N" -badgen + "📖 Opetussivu" -napin kun `lessonContext` aktiivinen
- [ ] Teaching-panel avautuu side-panelina desktopilla, modaalina mobiilissa
- [ ] Tehtävämäärä per oppitunti vastaa `curriculum_lessons.exercise_count`-arvoa
- [ ] Topic-lock bullet-proof: navigaatio confirm-dialogin takana
- [ ] E2E-testi Oppitunti 6:lle ajaa läpi
- [ ] axe 0 violations
- [ ] AGENT_STATE.md + IMPROVEMENTS.md päivitetty
- [ ] SW bumped (v99→v100) jos STATIC_ASSETS muuttui
