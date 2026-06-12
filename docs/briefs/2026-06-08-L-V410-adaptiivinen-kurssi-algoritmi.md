# L-V410 — Adaptiivinen kurssi (WordDive-tyylinen): kytke + paranna olemassa oleva stack

> **AGENTTI-DIREKTIIVI:**
> - **Tämä EI ole impeccable-brief.** Backend + adaptiivinen pedagogiikka. Skill-stack: **SUPABASE/BACKEND** (`supabase`, `supabase-postgres-best-practices`) + **EXERCISE-L** core (`practice-problem-sequence-designer`, `retrieval-practice-generator`, `spaced-practice-scheduler`, `variation-theory-task-designer`). Aloita rivillä `Skills invoked: <lista>`.
> - **Malli:** algoritmireasoning-painotteinen → aja writerin oletusmallilla (Opus-tason), EI sonnet+impeccable. (Sonnet+impeccable -rajaus koski vain frontend-briefejä L-V408/409.)
> - **Migraatiot:** käytä `mcp__claude_ai_Supabase__apply_migration`, ÄLÄ jätä SQL:ää Marcelille. Iteroi schema `execute_sql`:llä, committaa migraationa kun valmis.
> - **RLS pakollinen** jokaiselle uudelle taululle. UPDATE vaatii SELECT-policyn.

**Rooli:** WRITER. **Tyyppi:** BACKEND + EXERCISE-L. **Iso, vaiheistettu** — saa ja kannattaa pilkkoa useaan committiin/looppiin (kukin vaihe shippaa itsenäisesti).

---

## TAVOITE (yksi virke)

Rakenna kurssilaiselle WordDive-tyylinen adaptiivinen silmukka: **järjestelmä huomaa mikä menee usein väärin, palauttaa ne uudelleen harjoiteltavaksi (spaced repetition), ja säätää vaikeutta** — kytkemällä olemassa olevat primitiivit pää-kurssivirtaan ja täyttämällä puuttuva valitsin.

Marcelin sanoin: *"saadaan adaptiivineb kurssi että se huomaa mikä menee usein väärin yms saman tyyppine ku worddivel on."*

---

## NYKYTILA — mikä on rakennettu, kytketty, kuollut, puuttuu

**RAKENNETTU JA KYTKETTY (elävä):**
- `exercise_logs` (sessiotason loki) → `lib/levelEngine.js` (30 pv rolling accuracy) → `user_level` (taso I→A→B→C→M→E→L) + dashboard.
- SM-2 SR-engine päästä päähän: `lib/scheduler.js` (`sm2(card, quality)`, exam-cap 2026-09-28, osittaispisteet `bandToQuality`), `routes/sr.js` (`/api/sr/review|due|count|forecast`), client `js/features/spacedRepetition.js`. **Mutta kytketty VAIN legacy `js/screens/vocab.js`:n kertaussessioon.**
- `user_mistakes`-kirjoitus: VAIN `vocab.js:182` + `sentenceBuild.js:242` → `POST /api/mistake` → `routes/progress.js:178`. Luetaan vain dashboardin weak-topics-widgetiin.

**RAKENNETTU MUTTA KUOLLUT (0 client-kutsujaa):**
- `POST /adaptive-exercise` (`routes/exercises.js:1327`), `GET /adaptive-state` (1300), `/checkpoint/*`, **`POST /focus-session` (1547)**. `/focus-session` on ainoa olemassa oleva virheiden-resurfacing: lukee `user_mistakes` (5 viimeisintä/topic, 14 pv) ja injektoi promptiin "epäonnistuit näissä, generoi samanlaisia". Tavoittamaton.
- `/adaptive-exercise` valitsee: `getUserLevel` → `composeSession` (topic-slot) → scaffold → `pickExerciseType` → `callOpenAI` tuoreena. **EI lue `user_mistakes` eikä `sr_cards`.** Ei item-bank-reuseä, ei resurfacingia → tämä ei ole WordDive-silmukka.
- levelEngine checkpoint/level-up + `mastery_test_attempts`: tavoittamaton.

**PUUTTUU KOKONAAN:**
- **Valitsin joka lukee `user_mistakes`/`sr_cards` ja valitsee seuraavan itemin pää-lessonRunnerissa** (= WordDive-silmukan ydin).
- Per-yritys / per-konsepti **accuracy**-loki (vain väärät vastaukset `user_mistakes`:ssa; `exercise_logs` on sessiotasoa; `sr_cards` 024-migraatiossa on `reviews_total`/`reviews_correct` per sana).
- **Per-item konsepti/skill-tagit** staattisessa kurssidatassa (`data/courses/`). `topics[]`-taksonomia on olemassa server-side (`lib/mistakeTaxonomy.js`, `normalizeTopics`/`inferTopics`).

**PÄÄ-RUNNER:** `js/screens/lessonRunner.js` ajaa staattiset `data/courses/<lang>/kurssi_N/lesson_M.json` -lessonit (authored `phases[]` + per-taso `mastery_threshold` + `skip_for_targets`). Adaptiivisuus = vain in-session failed-item-carryover + phase-skip tason mukaan. **Ei lue `user_mistakes`/`sr_cards`.**

**Tier-gate:** `adaptive`-feature on `mestari`-tason (= kurssi) takana (`middleware/auth.js` FEATURES ~124–130). Free/treeni saavat staattiset lessonit ilman adaptiivista kerrosta. **Adaptiivinen = kurssin maksullinen lisäarvo** — pidä se niin.

---

## ARKKITEHTUURI (suunta — writer hioo pedagogiset yksityiskohdat EXERCISE-skilleillä)

**Periaate:** adaptiivisuus kerroksena authored-kurssin PÄÄLLE, ei erillistä AI-silaa. Authored lesson-sekvenssi säilyy; adaptiivinen kerros (a) palauttaa heikot konseptit + erääntyneet SR-kortit kertaukseen, (b) kantaa väärin menneet yli sessioiden, (c) kalibroi vaikeuden tasolla + konsepti-masteryllä. Kuollut `/adaptive-exercise`-AI-generointi jää täydentäväksi (generoi kohdennettua lisäharjoitusta heikkoon konseptiin), EI pääpoluksi.

### Vaihe 1 — CAPTURE (kytke datavirta, tee ENSIN)
Ilman dataa ei adaptiivisuutta. Kytke pää-runnerin (`lessonRunner.js` + `grammar.js`/`reading.js`-arvostelu) jokainen arvosteltu vastaus kirjoittamaan:
- **Väärin** → `POST /api/mistake` (`user_mistakes`) `topics[]`:lla. Per-item-tagin puuttuessa johda topic karkeasti: lesson `meta.grammar_focus[]` + `phase_type` → `inferTopics`. + `srReview` matalalla bandilla (`sr_cards`).
- **Oikein** → `srReview` korkealla bandilla (SR aikatauluttaa eteenpäin). Per-konsepti-accuracy: hyödynnä `sr_cards.reviews_total`/`reviews_correct` + `user_mastery` (migraatio 021), ÄLÄ lisää uutta taulua ellei konkreettinen kysely sitä vaadi.
- Gate: vain `mestari`/kurssi-tier kirjoittaa adaptiiviseen kerrokseen (free/treeni = nykyinen staattinen käytös). Tarkista `checkFeatureAccess(userId, "mistake_tracking")`.

**Acceptance V1:** kurssi-tilin pää-lessonin väärät vastaukset näkyvät `user_mistakes`-taulussa oikealla `language` + järkevillä `topics[]`; oikeat/väärät päivittävät `sr_cards`-kortit. Todenna `execute_sql`-kyselyllä tilin ajon jälkeen.

### Vaihe 2 — RESURFACE (kertaus-silmukka)
Rakenna kurssilaiselle kertausjono:
- `srGetDue` (tänään erääntyvät SR-kortit) + weak-topics (`user_mistakes` top-konseptit, hyödynnä olemassa olevaa `/weak-topics`-logiikkaa `routes/progress.js:213`).
- Pinnoita ne joko (a) lessonin alkuun "Kertaus"-vaiheena tai (b) omana adaptiivisena kertaussessiona kurssin etusivulla (`srDueCount`-rinki "X korttia kertaukseen").
- Resurfattu item: ensisijaisesti authored-item samasta konseptista; täydennä `/focus-session`-tyylisellä AI-generoinnilla kun authored-itemiä ei ole (herätä `/focus-session` henkiin client-kutsujalla).

**Acceptance V2:** kurssi-tili joka on tehnyt virheitä näkee kertausjonon joka sisältää aiemmin väärin menneet konseptit + erääntyneet SR-kortit; oikea vastaus kertauksessa siirtää SR-kortin eteenpäin (`next_review` kasvaa).

### Vaihe 3 — ADAPT (vaikeus)
- `levelEngine` `current_level` + per-konsepti-mastery → valitse item-vaikeus (`distractor_difficulty` easy/medium/hard) ja ohita masteroidut vaiheet (laajenna olemassa olevaa `mastery_threshold`/`skip_for_targets`-logiikkaa datavetoiseksi).
- Heikko konsepti → enemmän toistoa + helpompi distractor; vahva → harvemmin, vaikeampi.

**Acceptance V3:** sama lesson tarjoaa eri itemejä/vaikeutta kahdelle eri mastery-profiilin tilille; masteroitu konsepti ei toistu turhaan.

### Vaihe 4 — CALIBRATE (oston jälkeinen vapaaehtoinen taso-arvio)
> Tämä on L-V408:sta tänne siirretty pala: taso-arvio poistettiin onboardingista, se kuuluu kurssin ostaneelle.
- Kurssi-tilin (mestari) ensimmäisellä kurssi-/oppimispolkukäynnillä tarjoa **vapaaehtoinen** "Tee taso-arvio" -kortti (oppilas voi ohittaa). Käytä olemassa olevaa engineä `js/features/miniYO.js` + backend `routes/onboarding.js` (`user_onboarding_diagnostic`, `inferred_skill_profile`).
- Tulos seedaa adaptiivisen aloitustilan: aloitustaso + tunnetut heikot konseptit → resurfacing alkaa fiksusti, ei kylmänä.
- Reuna: tämä on tavoitettavissa vain mestari-tilillä (testaa `TEST_PRO_EMAILS`). Stripe ei ole live → oikeat ostajat tulevat myöhemmin, mutta gate + entry rakennetaan nyt.

**Acceptance V4:** mestari-tili näkee vapaaehtoisen taso-arvio-kortin, voi tehdä tai ohittaa; tehtynä `inferred_skill_profile` tallentuu ja näkyy adaptiivisen aloitustason/heikkojen-konseptien seedinä.

---

## SCHEMA-OHJEET (supabase-postgres-best-practices)

- **Vältä uusia tauluja.** Johda per-konsepti-accuracy ensisijaisesti `sr_cards` (`reviews_total`/`reviews_correct`) + `user_mastery` (021) + `user_mistakes`-aggregaatiosta. Lisää taulu/näkymä VAIN jos konkreettinen kysely ei muuten toteudu.
- Jos lisäät taulun: **RLS päälle** (`auth.uid() = user_id` SELECT/INSERT/UPDATE/DELETE tarpeen mukaan; UPDATE vaatii SELECT-policyn), `language`-sarake (skooppaus, vrt. 20260601-migraatio), ja **indeksi luku-patterniin** (esim. `(user_id, language, next_review)` SR:lle on jo `idx_sr_cards_due`; weak-topics käyttää `idx_user_mistakes_user_lang_created`).
- Aja `get_advisors` migraation jälkeen, korjaa security/perf-varoitukset.

---

## RAJAUS — mitä EI tehdä

- ❌ Free/treeni-tasolle adaptiivisuutta. Se on kurssin (mestari) lisäarvo + päivityskannustin.
- ❌ Per-item-konseptitagien massalisäys 8×90×3 lesson-JSONiin (Vaihe 1 johtaa topicit runtime-tasolla `grammar_focus`+`phase_type`+`inferTopics`:lla). Hieno per-item-tagging on oma myöhempi loop jos tarve osoittautuu.
- ❌ Stripe / maksulogiikka.
- ❌ Frontend-redesign (kartoitus = L-V408, kurssilukko = L-V409). Tämän briefin frontend = minimaalinen (kertaus-entry, SR-rinki, taso-arvio-kortti) olemassa olevilla UI-konventioilla.
- ❌ `/adaptive-exercise`-AI-silan nostaminen pääpoluksi. Se jää täydentäväksi generaattoriksi.

---

## VAIHEISTUS-SUOSITUS

Aja **Vaihe 1 ensin ja erikseen** (datavirta = flywheel, matala riski). Vaiheet 2–4 omina looppeina. Älä yritä koko nelivaihetta yhtenä big-bangina. Jokaisen vaiheen jälkeen: `node --check`, vitest, `execute_sql`-todennus, ja IMPROVEMENTS.md-rivi.
