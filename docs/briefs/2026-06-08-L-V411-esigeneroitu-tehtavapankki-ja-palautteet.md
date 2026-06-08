# L-V411 — Esigeneroitu adaptiivinen stack: tehtäväpankki + palaute-templatet (AI runtimesta build-aikaan)

> **AGENTTI-DIREKTIIVI:**
> - **Tämä EI ole impeccable-brief.** Backend + adaptiivinen pedagogiikka + pre-generointi-infra. Ydinperiaate koko briefille: **AI siirtyy runtimesta build-aikaan.** Kaikki mikä nyt toimisi runtime-AI:lla mutta voidaan esilaskea, esilasketaan kerran (build-skripti, saa käyttää AI:ta), tarkistetaan, committoidaan staattisena tiedostona, ja ajossa on pelkkä deterministinen lookup. **Ajossa nolla OpenAI-kutsua — yksi poikkeus: vapaiden kirjoitelmien (essee/tuotanto) arviointi pysyy AI:lla, koska niihin ei ole yhtä oikeaa vastausta.**
> - **Skill-stack (kutsu Skill-toolilla ENNEN koodia):**
>   - **BACKEND:** `supabase`, `supabase-postgres-best-practices`
>   - **EXERCISE-L core:** `practice-problem-sequence-designer`, `retrieval-practice-generator`, `spaced-practice-scheduler`, `variation-theory-task-designer`, `cognitive-load-analyser`
>   - **COPY:** `humanizer` — **PAKOLLINEN** Vaihe B:n palaute-templateille (käyttäjälle näkyvä suomi-teksti). Aja jokainen template humanizerin läpi ennen committia.
>   - Aloita vastaus rivillä `Skills invoked: <lista>`.
> - **Malli:** algoritmi- + sisältöreasoning → writerin oletusmalli (Opus-taso), EI sonnet+impeccable (tämä ei ole frontend-brief).
> - **Migraatiot:** jos taulu/näkymä tarvitaan, `mcp__claude_ai_Supabase__apply_migration`. RLS pakollinen, UPDATE vaatii SELECT-policyn. **Mutta lähtökohta: ei uusia tauluja** (johda sr_cards + user_mistakes + staattiset pankkitiedostot).

**Rooli:** WRITER. **Tyyppi:** BACKEND + EXERCISE-L + COPY. **Iso, vaiheistettu** — pilko useaan committiin/looppiin (kukin vaihe shippaa itsenäisesti, jokaisen jälkeen `node --check` + vitest + tarvittaessa `execute_sql`-todennus + IMPROVEMENTS.md-rivi).

---

## TAVOITE (yksi virke)

Tee adaptiivisesta kurssi-silmukasta **täysin AI-vapaa ajossa** esigeneroimalla (a) konsepti-indeksoidun tehtäväpankin olemassa olevista kursseista ja (b) palaute-templatet konsepti × sävy × suoritus -avaimilla, ja kytke ne resurface-valitsimeen niin että **väärin menneet konseptit palaavat oppilaalle enemmän myöhemmin** — ilman yhtäkään runtime-mallikutsua paitsi vapaiden kirjoitelmien arvioinnissa.

Marcelin sanoin: *"kaikki mikä toimii ai:lla minkä voi pre-generoida generoidaan ne"* + *"kaikki kirjotelma vastaukset arvioidaan ai:lla"*.

---

## NYKYTILA — mistä lähdetään (vastaa myös Marcelin kysymykseen "toimiiko nyt")

**Mitä L-V410 Vaihe 1 (CAPTURE) jo tekee (shipattu, commit 5ae8fb1):**
- `lib/adaptiveCapture.js`: pää-lessonRunnerin jokainen arvosteltu diskreetti vastaus (mc/typed/translate/gap_fill) kirjautuu `user_mistakes`-tauluun (väärät, `topics[]`-tagein) + `sr_cards`-tauluun (kaikki, SM-2). Gate: `checkFeatureAccess(userId, "mistake_tracking")` = vain mestari/kurssi-tier.
- Eli **data virtaa nyt sisään**: jos mokaat subjunktiiveja, ne ovat `user_mistakes`-taulussa konseptilla `subjunctive`.

**Mikä PUUTTUU (= tämän briefin ydin):**
- **Mikään ei lue dataa takaisin.** Oppimispolku näyttää yhä saman authored-sekvenssin riippumatta virheistä. "Näytä enemmän subjunktiiveja" -käytöstä EI ole. Silmukka on puoliksi rakennettu (kerää, muttei reagoi). → **Vaihe C rakentaa tämän.**
- **Tehtävien uudelleenkäyttö konseptin mukaan ei ole indeksoitu.** Tehtävät ovat olemassa (`data/courses/<lang>/kurssi_N/lesson_M.json`, 8 kurssia × ~10 lessonia × 3 kieltä), mutta niitä ei voi hakea "anna 5 subjunktiivi-itemiä". → **Vaihe A rakentaa pankin.**
- **Palaute on runtime-AI:lla.** `routes/curriculum.js` `/complete` kutsuu `callOpenAI`:ta joka completion-hetkellä generoidakseen tutori-viestin + metakognitiivisen huomion. Per completion: ~200-500ms latenssi + OpenAI-kulu + AI-slop-riski. → **Vaihe B korvaa tämän templateilla.**
- **`/focus-session` (`routes/exercises.js:1547`)** = ainoa olemassa oleva virheiden-resurfacing, mutta se AI-generoi tuoreita tehtäviä eikä sillä ole yhtään client-kutsujaa. → **Vaihe D korvaa AI-generoinnin pankki-haulla.**

**Kanoniset rakennuspalikat joita käytät (ÄLÄ keksi uusia):**
- **Konsepti-taksonomia:** `lib/mistakeTaxonomy.js` → `TOPIC_LABELS` (kanoniset avaimet: `ser_estar`, `subjunctive`, `preterite_imperfect`, `por_para`, `gustar_verbs`, `articles`, `gender_agreement`, … + sanasto-aiheet `daily_life`, `food`, `travel` jne.). `normalizeTopics()` validoi, `inferTopics()` on regex-pohjainen tagger (käytä build-aikana ensiarvauksena). **Tämä on koko adaptiivisen kerroksen "kieli" — pankki, mistakes ja resurface puhuvat samaa avainjoukkoa.**
- **Lesson-JSON-muoto:** `meta` (`course_key`, `lesson_index`, `lesson_type`, `level` = YTL-arvosana I/A/B/C/M/E/L, `title`, `yo_relevance`), `teaching`, `phases[]`. Phase: `phase_id`, `phase_type` (esim. `recognition_mc`, `recall_typed_es_to_fi`, `application_gap_fill`, `synthesis_translate`), `mastery_threshold` (per arvosana), `skip_for_targets`, `items[]`. Item: `item_type`, `stem`/`prompt`/`source`, `choices`, `correct_index`, `distractor_difficulty` (easy/medium/hard), `explanation`. **HUOM: per-item `concepts`-kenttää EI ole vielä — Vaihe A johtaa sen.**
- **SR-engine:** `lib/scheduler.js` (`sm2(card, quality)`, exam-cap 2026-09-28). `js/features/spacedRepetition.js` (`srGetDue`, `srDueCount`, `srReview`). `routes/sr.js`.
- **Weak-topics:** `routes/progress.js:213` `GET /weak-topics` (aggregoi `user_mistakes` top-konseptit). Käytä sellaisenaan resurface-valitsimessa.
- **Tier-gate:** `middleware/auth.js` FEATURES → `adaptive`/`mistake_tracking` = mestari-only. Pidä niin.

---

## ARKKITEHTUURI-PERIAATE

```
BUILD-AIKA (saa käyttää AI:ta, ajetaan kerran, output committoidaan):
  scripts/build-item-bank.mjs   → data/item-bank/<lang>.json   (konsepti → tehtävät)
  scripts/build-feedback.mjs    → data/feedback/<lang>.json     (konsepti × sävy × band → teksti)
        │
        ▼
RUNTIME (nolla AI-kutsua):
  lib/reviewQueue.js   ── lukee user_mistakes + sr_cards ──► valitsee pankista itemit
  lib/feedbackTemplates.js ── konsepti+band+sävy ──► palauttaa valmiin tekstin
        │
        ▼
  lessonRunner (kertausvaihe)  +  oppimispolku-etusivu (kertaussessio)

POIKKEUS (pysyy AI:lla ajossa):
  lib/writingGrading.js / routes/writing.js  ── vapaa kirjoitelma → AI-arviointi
```

Adaptiivisuus = kerros authored-kurssin PÄÄLLE, ei erillistä AI-silaa. Authored-sekvenssi säilyy; pankki + valitsin palauttavat heikot konseptit kertaukseen, SR kantaa väärin menneet yli sessioiden, ja palaute on esikirjoitettu konseptitasolla (pedagogisesti se mikä merkitsee — ei sanatason "kirjoitit tengo eikä tenga").

---

## Vaihe A — TEHTÄVÄPANKKI (build-time pre-gen, tee ENSIN)

**Tavoite:** indeksi joka vastaa kysymykseen "anna N tehtävää konseptista X vaikeudella Y kielellä L" O(1)-haulla, generoitu olemassa olevista kursseista.

**Output:** `data/item-bank/<lang>.json`, muoto:
```jsonc
{
  "subjunctive": [
    {
      "ref": { "kurssiKey": "es_kurssi_5", "lessonIndex": 3, "phaseId": "p4-...", "itemIndex": 2 },
      "item_type": "gap_fill",
      "difficulty": "hard",            // item.distractor_difficulty || phase-johdettu
      "level": "C",                    // lesson meta.level (YTL)
      "item": { /* koko item-payload, valmiina renderöitäväksi lessonRunnerissa */ }
    }
    // …
  ],
  "ser_estar": [ /* … */ ]
}
```

**Generointi (`scripts/build-item-bank.mjs`):**
1. Kävele `data/courses/<lang>/**/lesson_*.json`, jokainen item.
2. Johda item-konseptit prioriteettijärjestyksessä: (a) jos item kantaa jo `concepts[]` → `normalizeTopics`; (b) `inferTopics({ question: stem/prompt, explanation })` (regex, ilmainen); (c) lessonin konteksti (`meta.title` + `phase_type` → karkea mapping, esim. `recall_typed_*` + kielioppikurssi → kieliopin pääkonsepti); (d) **build-aikainen AI-tagger** VAIN itemeille jotka jäivät tageja vaille tai monitulkintaisiksi — output committoidaan, ajossa ei kutsuta. Halpa kertakustannus.
3. Indeksoi konseptin alle, kanna `difficulty` + `level` jotta Vaihe C voi kalibroida.
4. **Determinismi:** sama input → sama output (ei `Math.random` skriptissä, järjestä deterministisesti). Aja CI:ssä tai osana `npm run build`-ketjua? → ei pakollinen joka buildiin (kurssit muuttuvat harvoin); committoi tiedosto ja regeneroi käsin kun kurssidata muuttuu. Dokumentoi miten regeneroidaan.

**Acceptance A:** `data/item-bank/es.json` (+ de + fr) olemassa; jokainen `TOPIC_LABELS`-avain joka esiintyy kursseissa on indeksoitu ≥1 itemillä; skripti loggaa konseptit joilla on <3 itemiä (= ohut peitto, Vaihe D fallback-kandidaatit); `node --check` + pieni vitest joka lataa pankin ja varmistaa rakenteen + että haku `bank["subjunctive"]` palauttaa renderöitäviä itemejä.

---

## Vaihe B — PALAUTE-TEMPLATET (build-time pre-gen, korvaa runtime-AI)

**Tavoite:** korvaa `routes/curriculum.js` `/complete`-reitin `callOpenAI`-tutoriviesti deterministisellä template-lookupilla. Nolla runtime-AI:ta diskreeteille lessoneille.

**Output:** `data/feedback/<lang>.json` (tai jaettu kieliriippumaton + konseptilabelit `TOPIC_LABELS`-kielikäännöksinä), avaimet:
```
sävy-bucket (I/A | B/C | M/E/L)  ×  band (mastered | almost | struggling)  ×  konsepti (valinnainen)
```
Sävy-bucketit vastaavat olemassa olevaa `TONE_DESCRIPTORS`-logiikkaa (`lib/curriculumProgress.js`): I/A lämmin+ei häpeää, B/C suora+lämmin, M/E/L korkea rima. Band: suoritus suhteessa `mastery_threshold`-tasoon. Konseptikohtainen template (esim. `subjunctive` + B/C + struggling = "subjunktiivi horjuu vielä, muista että epävarmuus tai toive que:n jälkeen laukaisee sen; palataan tähän huomenna") voittaa, fallback geneeriseen band-templateen.

**Generointi (`scripts/build-feedback.mjs`):** AI saa luonnostella templatet build-aikana, MUTTA **jokainen aja `humanizer`-skillin läpi** (em-dash pois, ei "kalibroitu/intuitiivinen", ei sycophantic openereita, ei rule-of-three) ENNEN committia. Templatet ovat lyhyitä, muuttujapaikoilla `{konsepti_label}`, `{seuraava_aihe}`. Pidä määrä hallittavana: ~20 aktiivista konseptia × 3 sävyä × 3 bandia, + geneeriset fallbackit. **Ei keksittyjä väitteitä** (ei %-lukuja, ei lukio-nimiä).

**Runtime (`lib/feedbackTemplates.js`):** puhdas funktio `pickFeedback({ concept, toneBucket, band, lang })` → `{ tutorMessage, metacognitivePrompt }` fallback-ketjulla. `routes/curriculum.js` `/complete`: **poista `callOpenAI`-lohko diskreeteille lessoneille**, korvaa tällä lookupilla. (Tutori näkee jo oikeat virheet `effectiveWrong`:n kautta L-V410:stä → käytä top-konseptia template-valintaan.)

**Acceptance B:** `/complete` palauttaa template-pohjaisen `tutorMessage` + `metacognitivePrompt`, **0 OpenAI-kutsua** diskreetille lessonille (todenna: ei verkkokutsua / stubattu `callOpenAI` ei laukea); palaute on konseptikohtainen kun virheitä keskittyy yhteen konseptiin; kaikki templatet humanizer-pass; vitest `pickFeedback`-fallback-ketjusta.

---

## Vaihe C — RESURFACE-VALITSIN (deterministinen, kytkee silmukan)

**Tavoite:** "näytä enemmän subjunktiiveja" -käytös. Lukee mistakes + SR, valitsee pankista itemejä, pinnoittaa ne KAHDESSA paikassa.

**`lib/reviewQueue.js`** (puhdas, testattava): `buildReviewQueue({ userId, lang, db })` →
1. Heikot konseptit: olemassa oleva `/weak-topics`-aggregaatio (`user_mistakes` top-konseptit).
2. Erääntyneet SR-kortit: `srGetDue`.
3. Hae jokaiselle heikolle konseptille itemit pankista (Vaihe A), kalibroi vaikeus: heikko konsepti (matala `reviews_correct/reviews_total` `sr_cards`:ssa) → enemmän toistoa + helpompi `difficulty`; vahva → harvemmin, vaikeampi. (Variation-theory + cognitive-load -skillit ohjaavat sekvenssin.)
4. Palauta järjestetty jono renderöitäviä itemejä (sama muoto kuin lesson-phase `items[]`, jotta lessonRunner osaa renderöidä ilman muutoksia).

**Pinnoitus (kaksi pintaa, molemmat):**
- **(a) Kertausvaihe lessonin alkuun:** `lessonRunner.js` injektoi heikoista konsepteista koostetun "Kertaus"-vaiheen authored-vaiheiden ETEEN kun jonoa on. Käytä olemassa olevaa phase-renderöintiä (ei uutta item-tyyppiä).
- **(b) Erillinen kertaussessio oppimispolun etusivulla:** `srDueCount`-rinki "X korttia kertaukseen" → avaa kohdennetun kertaussession (sama `reviewQueue`). Minimaalinen UI olemassa olevilla konventioilla (ei redesign — kartoitus oli L-V408, lukko L-V409).

**Kalibrointi:** oikea vastaus kertauksessa → `srReview` korkealla bandilla (SR aikatauluttaa eteenpäin, `next_review` kasvaa); väärä → matala band (palaa pian). Tämä sulkee silmukan.

**Acceptance C:** mestari-tili joka on tehnyt monta subjunktiivi-virhettä näkee subjunktiivi-itemejä resurfattuna SEKÄ lessonin alun kertausvaiheessa ETTÄ etusivun kertaussessiossa; masteroitu konsepti ei toistu turhaan; oikea vastaus kertauksessa kasvattaa kortin `next_review`:ta (todenna `execute_sql`). Free/treeni ei näe kertauskerrosta (gate).

---

## Vaihe D — `/focus-session` AI-generoinnin korvaus

**Tavoite:** herätä `/focus-session` henkiin mutta pankki-haulla, ei AI-generoinnilla.

- Korvaa `routes/exercises.js:1547` AI-generointi `reviewQueue`/pankki-haulla: konsepti → authored-itemit pankista.
- **AI vain viimeisenä fallbackina** kun pankissa on liian vähän itemejä konseptille (Vaihe A:n <3-loki). Ja silloinkin ensisijaisesti: generoi lisää itemejä konseptille OFFLINE pankkiin, ei runtime. Dokumentoi tämä kynnys.

**Acceptance D:** `/focus-session` palauttaa pankki-itemejä heikolle konseptille ilman runtime-AI:ta (paitsi dokumentoitu ohut-peitto-fallback); client-kutsuja kytketty (etusivun kertaussessio voi käyttää tätä tai `reviewQueue`:ta suoraan).

---

## SCHEMA-OHJEET (supabase-postgres-best-practices)

- **Lähtökohta: ei uusia tauluja.** Johda kaikki: heikot konseptit `user_mistakes`-aggregaatiosta (idx `idx_user_mistakes_user_lang_created`), erääntyneet `sr_cards`:sta (idx `idx_sr_cards_due`), per-konsepti-mastery `sr_cards.reviews_total/reviews_correct`:sta + `user_mastery`:sta (migr 021). Tehtäväpankki + palautteet ovat STAATTISIA tiedostoja (ei DB).
- Jos konkreettinen kysely ei toteudu ilman näkymää/saraketta: lisää, mutta **RLS päälle** (`auth.uid() = user_id`, UPDATE vaatii SELECT-policyn), `language`-skooppaus, indeksi luku-patterniin. Aja `get_advisors` jälkeen.

---

## RAJAUS — mitä EI tehdä

- ❌ **Vapaiden kirjoitelmien arviointia EI esigeneroida** — essee/tuotanto-tehtävät (`item_type: writing`, `routes/writing.js`, `lib/writingGrading.js`) pysyvät AI-arvioinnissa. Tämä on ainoa runtime-AI joka jää. ÄLÄ koske siihen.
- ❌ Runtime-AI diskreeteille lessoneille tai palautteelle (Vaihe B poistaa sen).
- ❌ Free/treeni-tasolle adaptiivisuutta (mestari-gate, kurssin lisäarvo).
- ❌ Uusia tauluja ellei konkreettinen kysely vaadi.
- ❌ Per-item-konseptitagien massalisäys 8×90×3 lesson-JSONiin käsin — Vaihe A johtaa ne pankkiin skriptillä (saa lisätä `concepts[]` lessoneihin jos skripti tekee sen automaattisesti, mutta indeksi on totuus).
- ❌ Frontend-redesign. Vaihe C:n UI = minimaalinen (kertausvaihe + etusivun rinki) olemassa olevilla konventioilla.
- ❌ Stripe / maksulogiikka.

---

## VAIHEISTUS-SUOSITUS

Aja **A → B → C → D** omina looppeina (A ja B ovat riippumattomia, C tarvitsee A:n, D tarvitsee A+C:n). Älä big-bangaa. Jokaisen vaiheen jälkeen: `node --check`, vitest, tarvittaessa `execute_sql`-todennus mestari-tilillä, IMPROVEMENTS.md-rivi. A + B ovat matala riski (build-time, ei runtime-käytösmuutosta ennen kuin kytketään). C on käytösmuutos → todenna huolella kahdella mastery-profiililla.

**Linkit:** L-V410 Vaihe 1 CAPTURE (commit 5ae8fb1, `lib/adaptiveCapture.js`) on tämän datapohja. L-V410 Vaiheet 2-4 (resurface/adapt/calibrate) sulautuvat tähän briefiin: Vaihe C = L-V410 V2+V3 mutta pankki-pohjaisena ja AI-vapaana. L-V410 V4 (oston jälkeinen vapaaehtoinen taso-arvio) jää erilliseksi pikku-loopiksi tämän jälkeen.
