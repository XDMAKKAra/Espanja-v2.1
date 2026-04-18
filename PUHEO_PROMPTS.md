# Puheo — Parannusehdotuksia Claude Codea varten

Tämä tiedosto sisältää kaikki parannusehdotukset, jotka annoin aikaisemmin keskustelussa. Nimi on nyt päivitetty **Puheo**ksi. Kopioi yksi prompt kerrallaan Claude Codeen. Järjestys on mietitty — älä hyppää ohi.

---

## STATUS

- [x] #B1 Rate limit + OpenAI cache (**tehty**)
- [x] #B2 Exercise bank (**tehty**)
- [ ] #B3 app.js refactor (**työn alla**)
- [ ] #B4 Cleanup + deps + docs
- [ ] #B5 SM-2 spaced repetition (korvaa FIFO-jono)
- [ ] #B6 Adaptive difficulty (tarkennettu versio + mastery tests)
- [ ] #B7 YTL writing grading rubric
- [ ] #B8 Kuullun ymmärtäminen (listening comprehension)
- [ ] #B9 Täyskoe-simulaatio + ajastin
- [ ] #B10 Cost tracking per käyttäjä
- [ ] #B11 PWA offline + push-notifikaatiot
- [ ] #B12 Sentry + PostHog analytiikka

### Nettisivuparannukset (tee ensin nämä ennen markkinointia)

- [ ] #W1 Onboarding-kysely (sinun ideasi)
- [ ] #W2 Landing page rewrite (konversio-optimoitu)
- [ ] #W3 Diagnostic placement test (~10 min, ei vaadi kirjautumista)
- [ ] #W4 Interactive demo (kokeile-ilman-tiliä)
- [ ] #W5 FAQ-sivu
- [ ] #W6 "Miksi Puheo" / perustajan tarina
- [ ] #W7 Exam countdown + tavoiteseuranta
- [ ] #W8 Shareable results (canvas-kuvat somea varten)
- [ ] #W9 SEO + OG-kuvat + sitemap + GA4
- [ ] #W10 GDPR-cookie consent

---

# OSA A — BACKEND & FEATURE PROMPTS

## #B4 Cleanup + deps + docs

```
Puheon projektissa on paljon kuollutta koodia ja vanhentuneita dokumentteja.
Tehtävä:

1) Poista nämä tiedostot (ovat kuollutta koodia, Supabase on oikea tietokanta):
   - db.js
   - puheo.db (tai jos vielä kielio.db, poista se)
   - puheo.db-shm
   - puheo.db-wal
   Vahvista ensin grepillä että niitä ei importata missään.

2) Siivoa package.json:
   - Aja `npm outdated`, listaa tulokset
   - Päivitä minor/patch-versiot `npm update`
   - Päivitä major-versiot yksi kerrallaan, aja npm test välissä
   - Poista käyttämättömät dependencies (käytä `depcheck`)

3) Päivitä README.md:
   - Korvaa viittaukset Anthropic APIin → OpenAI API
   - Lisää oikeat npm-skriptit (dev, start, test)
   - Lisää .env.example-viittaus
   - Lisää linkki API.md:hen
   - Lisää "Architecture" -kuva tai -teksti
   - Mainitse Puheo-brändi

4) Päivitä API.md:
   - Tarkista että kaikki endpointit vastaavat routes/*.js -tiedostoja
   - Lisää puuttuvat endpointit
   - Poista endpointit jotka on poistettu

5) Lisää LICENSE-tiedosto (MIT tai oma EULA)

6) Lisää .editorconfig ja .prettierrc jos ei ole

Commit: "chore: cleanup dead code, update deps, refresh docs"
```

---

## #B5 SM-2 Spaced Repetition

```
Puheon sanastoharjoituksissa on nyt yksinkertainen FIFO-jono (srLoad/srSave/srAddWrong/srMarkCorrect/srPop).
Korvaa se SM-2-algoritmilla (SuperMemo-2, Ankin pohja).

Tehtävä:

1) Luo migration migrations/007_sm2_schema.sql:
   - Taulu vocab_items: user_id, word_es, word_fi, ease_factor (float, default 2.5),
     interval (int days, default 1), repetitions (int, default 0),
     due_date (timestamp), last_reviewed (timestamp), created_at
   - Indeksit: (user_id, due_date), (user_id, word_es) unique

2) Luo lib/sm2.js:
   - scheduleReview(quality) missä quality on 0-5
   - Palauttaa uuden {ease_factor, interval, repetitions, due_date}
   - Standardi SM-2-logiikka:
     - quality < 3: repetitions = 0, interval = 1
     - quality >= 3: jos repetitions == 0 → interval = 1
                     jos repetitions == 1 → interval = 6
                     muuten interval = interval * ease_factor
     - ease_factor = max(1.3, EF + 0.1 - (5-q)*(0.08 + (5-q)*0.02))

3) Päivitä routes/exercises.js:
   - GET /api/exercises/vocab → hae 20 sanaa joilla due_date <= now(), järjestä due_date asc
   - Jos ei ole erääntyneitä, luo uusia OpenAI-kutsulla (cap 5 uutta per päivä free, 15 Pro)
   - POST /api/exercises/vocab/review { word_id, quality } → kutsu scheduleReview, tallenna

4) Päivitä app.js:
   - Näytä käyttäjälle 4-tasoinen arviointi harjoituksen jälkeen:
     "En osannut" (0), "Vaikea" (2), "OK" (3), "Helppo" (5)
   - Poista vanha srLoad/srSave/srAddWrong/srMarkCorrect/srPop-koodi
   - Siirrä backend-logiikkaan

5) Lisää dashboardille:
   - "Erääntyneet sanat tänään: X"
   - "Mestaroidut sanat: Y" (repetitions >= 5)

6) Kirjoita testit lib/sm2.js:lle (min 10 casea)

Commit: "feat(vocab): replace FIFO queue with SM-2 spaced repetition"
```

---

## #B6 Adaptive difficulty + mastery tests (TARKENNETTU)

```
Puheossa tason vaihto (YTL-arvosana I/A/B/C/M/E/L) täytyy olla erittäin huolellinen prosessi.
E-tason ja B-tason välillä on valtava ero — nopeat tason muutokset turhauttavat käyttäjää.

SÄÄNNÖT:

PROMOOTIO (tason nosto) — epäsymmetriset kynnykset:

  Taso nyt → kohde | min keskiarvo % | min sessio % | min kysymyksiä | min sessioita | min päiviä
  I → A            | 80              | 75           | 40             | 3             | 2
  A → B            | 82              | 75           | 60             | 4             | 3
  B → C            | 85              | 78           | 80             | 5             | 4
  C → M            | 87              | 80           | 100            | 6             | 5
  M → E            | 90              | 82           | 120            | 7             | 7
  E → L            | 92              | 85           | 150            | 8             | 10

MASTERY TEST — pakollinen portti:
  - Kun kriteerit täyttyvät, tarjoa mastery test
  - 10 kysymystä: 6 nykyisen tason + 4 kohdetason
  - Läpäistäkseen: ≥70% kokonaisuus JA ≥60% kohdetason kysymyksistä
  - Jos epäonnistuu: 3 päivän cooldown ennen uutta yritystä
  - Jos läpäisee: taso nousee + onnittelubanneri

DEMOOTIO (tason lasku) — paljon tiukempi:
  - 8 peräkkäistä sessiota alle 45% keskiarvolla
  - Vähintään 14 päivää nykyisellä tasolla
  - Ei demoottia 14 päivän sisällä edellisestä demootiosta
  - HILJAINEN demootio — EI banneria, käyttäjälle ei kerrota
  - Lokita demootion syy adminille (debug)

TEHTÄVÄ:

1) Luo migration migrations/008_adaptive_level.sql:
   - user_levels: user_id, current_level (I/A/B/C/M/E/L),
     level_since (timestamp), last_demotion (timestamp),
     last_mastery_attempt (timestamp), mastery_passed (bool)
   - level_sessions: user_id, session_date, avg_score, question_count

2) lib/adaptive.js:
   - evaluatePromotion(userId) → { eligible: bool, reason: string }
   - evaluateDemotion(userId) → { should_demote: bool, reason: string }
   - generateMasteryTest(userId) → 10 kysymystä
   - recordMasteryResult(userId, score, levelBreakdown) → { passed, newLevel? }

3) routes/progress.js päivitys:
   - GET /api/progress/level-status → { current, eligibleForMastery, progress }
   - POST /api/progress/mastery-start → luo mastery-sessio
   - POST /api/progress/mastery-submit → tallenna tulos

4) app.js:
   - Dashboard: edistymispalkki mastery-testiä kohti
   - Mastery test modal: erillinen UI selkeästi erottuvalla bannerilla
   - ÄLÄ näytä demootion syytä käyttäjälle
   - Promootio → konfetti + onnittelu

5) Testit (min 20 casea adaptive.js:lle)

Commit: "feat(adaptive): rigorous level progression with mastery tests"
```

---

## #B7 YTL writing grading rubric

```
Puheon kirjoitustehtävien arviointi ei vastaa YTL:n oikeaa rubriikkia.
Tee arvostelusta autenttinen.

YO-kokeen lyhyt espanja kirjoitelma (kirje/sähköposti, 50-80 sanaa tai 80-120 sanaa):
- Sisältö (max 30p): aihe käsitelty, tehtävänanto täytetty
- Rakenne (max 20p): kappalejako, sidossanat, loogisuus
- Kieli (max 50p): kielioppi, sanasto, oikeinkirjoitus, tyylirekisteri

Tehtävä:

1) Päivitä lib/openai.js system prompt kirjoitelman arvioijalle:
   - Anna tarkka rubriikki ylhäällä
   - Pyydä pisteet eriteltyinä: { sisalto, rakenne, kieli, total }
   - Pyydä konkreettisia kommentteja (3 hyvää, 3 parannettavaa)
   - Pyydä korjattu versio ja erot näkyviin
   - Tyyli: kannustava mutta rehellinen

2) routes/writing.js:
   - Tallenna detaljoidut pisteet (ei pelkkää yhteispistettä)
   - Lisää sanamäärälaskin serverillä (älä luota frontendiin)
   - Vähennä pisteitä jos sanamäärä ulkona (±10%)

3) Migration migrations/009_writing_detail.sql:
   - writing_submissions: lisää sarakkeet sisalto_score, rakenne_score, kieli_score,
     corrected_version (text), feedback_good (jsonb), feedback_improve (jsonb)

4) app.js writing screen:
   - Näytä pisteet värikoodattuna taulukkona
   - Diff-näkymä: alkuperäinen vs korjattu (punainen/vihreä)
   - "Tallenna virheet sanastoon" -nappi (lähettää vocab-kantaan)

5) Lisää 10 esimerkkikirjoitelmaa (eri tasot) testausta varten

Commit: "feat(writing): authentic YTL rubric + detailed feedback"
```

---

## #B8 Kuullun ymmärtäminen

```
Puheosta puuttuu kuullun ymmärtäminen — se on 1/3 YO-kokeesta.
Käytä Web Speech API:n speechSynthesis → ei vaadi maksullista TTS-palvelua.

Tehtävä:

1) Luo routes/listening.js:
   - POST /api/listening/generate { level, topic }
   - OpenAI generoi espanjalaisen dialogin tai monologin (30-90s lukuaikaa)
   - 4 monivalintakysymystä
   - Palauttaa { script_es, questions, correct_answers }

2) app.html uusi näyttö #listening-screen:
   - Play-nappi → speechSynthesis.speak(new SpeechSynthesisUtterance(text, lang='es-ES'))
   - Nopeus-slider (0.7-1.2x)
   - Kuuntele uudelleen -nappi (max 3x free, rajoittamaton Pro)
   - Kysymykset näkyvät vasta ensimmäisen kuuntelun jälkeen (autenttinen)
   - Transkripti näkyy vasta vastausten jälkeen

3) Fallback jos speechSynthesis ei tue espanjaa:
   - Näytä varoitus, käytä ResponsiveVoice CDN:ää (ilmainen, non-commercial OK)
   - Tai linkki teksti-näkymään

4) lib/openai.js: uusi funktio generateListeningExercise(level, topic)

5) Migration migrations/010_listening.sql:
   - listening_exercises: user_id, script_es, questions (jsonb),
     user_answers (jsonb), score, completed_at

6) Dashboard: lisää "Kuullun ymmärtäminen" -kortti

Commit: "feat(listening): listening comprehension with Web Speech API"
```

---

## #B9 Täyskoe-simulaatio + ajastin

```
Puheoon täyskoesimulaatio — autenttinen YO-koetilanne.

YO-kokeen lyhyt espanja rakenne:
- Osa 1: Kuullun ymmärtäminen (~30 min, 20-25 p)
- Osa 2: Kirjallinen osio: sanasto, kielioppi, luetun ymmärtäminen (~2h)
- Osa 3: Kirjoitelma (~1h)
Yhteensä: 3h koe

Tehtävä:

1) Uusi näyttö #exam-screen:
   - Aloitusruutu: selitys + "Aloita koe" (lukitsee 3h timer)
   - Ajastin ylänurkassa (punainen kun <15min jäljellä)
   - Ei kesken-poistumista ilman varoitusta (beforeunload-event)
   - Osat peräkkäin, ei takaisin
   - Automaattinen tallennus 30s välein (localStorage)

2) routes/exam.js:
   - POST /api/exam/start → luo exam-sessio, palauttaa kaikki tehtävät kerralla
   - POST /api/exam/submit → arvostelee kaikki osat, palauttaa YTL-pisteet + arvosanaennuste
   - GET /api/exam/history → käyttäjän aiemmat koesimulaatiot

3) Arvosana-ennuste (L/E/M/C/B/A/I/hylätty):
   - Käytä viime vuosien YTL-pisterajoja
   - Tallenna data/ytl_cutoffs.json (päivitettävissä)

4) Migration migrations/011_full_exam.sql:
   - full_exam_sessions: user_id, started_at, completed_at, duration_seconds,
     section_scores (jsonb), total_score, predicted_grade, exercises_snapshot (jsonb)

5) Rajoitus:
   - Free: 1 täyskoe yhteensä
   - Pro: 1 täyskoe / viikko

6) Tuloskooste:
   - Pisteet per osa
   - Arvosana-ennuste
   - Heikot aihepiirit → suositukset
   - Share-nappi (#W8 canvas-kuva)

Commit: "feat(exam): full YTL simulation with timer and grade prediction"
```

---

## #B10 Cost tracking per käyttäjä

```
Puheon OpenAI-kulut voivat karata käsistä. Track per käyttäjä.

Tehtävä:

1) Migration migrations/012_cost_tracking.sql:
   - ai_usage: id, user_id, endpoint, model, prompt_tokens,
     completion_tokens, cost_usd, created_at
   - Indeksit: (user_id, created_at), (created_at)

2) lib/openai.js:
   - Wrappaa kaikki chat.completions.create -kutsut
   - Laske kustannus: gpt-4o-mini = $0.15/M input + $0.60/M output
   - Kirjoita ai_usage-tauluun jokaisen kutsun jälkeen
   - Lisää user_id kontekstiin (async local storage tai param)

3) Kovarajat (env-vars):
   - FREE_DAILY_COST_USD (default 0.05)
   - PRO_DAILY_COST_USD (default 0.50)
   - Jos ylittyy → 429 "Päivän raja saavutettu"

4) Admin-endpoint (suojattu ADMIN_EMAILS):
   - GET /api/admin/costs → top 20 käyttäjää viimeiset 30pv
   - GET /api/admin/costs/daily → päiväkohtainen summa

5) Dashboard Pro-käyttäjille:
   - Pieni "tämän viikon AI-käyttö: X / 100%"
   - Ei näytetä rahasummaa, vain prosentti

6) Viikkoraportti adminin sähköpostiin (cron-job.org tai Vercel cron)

Commit: "feat(billing): OpenAI cost tracking per user + daily caps"
```

---

## #B11 PWA offline + push-notifikaatiot

```
Puheo on jo PWA (manifest.json, sw.js). Laajenna offline-tilaan ja pusheihin.

Tehtävä:

1) sw.js päivitys:
   - Bump cache-versio (puheo-v2)
   - Cache first strategia staattisille (CSS/JS/kuvat)
   - Network first strategia /api/* -endpointeille
   - Fallback-sivu /offline.html jos verkko pois

2) Luo public/offline.html:
   - Selitys "Olet offline"
   - Näytä cached-harjoitukset jos saatavilla (IndexedDB)

3) lib/offlineQueue.js (frontend):
   - Queue harjoitusvastaukset IndexedDB:hen jos offline
   - Syncaa online-tilassa Background Syncillä

4) Push-notifikaatiot:
   - VAPID-avaimet (generoi web-push-kirjastolla)
   - .env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT=mailto:support@puheo.fi
   - routes/push.js:
     - POST /api/push/subscribe → tallenna subscription
     - POST /api/push/unsubscribe
   - Migration migrations/013_push_subs.sql

5) Push-triggerit:
   - Streak-reminder klo 18 jos ei tehty tänään
   - Viikkoraportti sunnuntaina
   - Mastery-test saatavilla
   - Käyttäjä voi disabloida asetuksissa

6) Käyttäjän asetusnäyttö:
   - Push on/off per tyyppi
   - Quiet hours (ei pusheja klo X-Y)

Commit: "feat(pwa): offline mode + push notifications"
```

---

## #B12 Sentry + PostHog

```
Puheolle tarvitaan virheseuranta ja analytiikka. Molemmissa ilmaistaso riittää alkuun.

Tehtävä:

1) Sentry (free tier 5k events/kk):
   - npm i @sentry/node @sentry/browser
   - server.js: Sentry.init ennen Express-appia
   - app.js: Sentry.init CDN:stä tai buildattu
   - .env: SENTRY_DSN, SENTRY_DSN_FRONTEND
   - Ignore: AbortError, network errors, 429-vastaukset
   - Release-tagi = git commit SHA

2) PostHog (free tier 1M events/kk):
   - Self-host tai cloud (EU region — suomalaisille käyttäjille)
   - .env: POSTHOG_KEY, POSTHOG_HOST
   - Frontend: posthog-js snippet
   - Identify user kun kirjautuu (email + user_id)

3) Trackattavat eventit:
   - signup_started, signup_completed
   - onboarding_question_answered (step, answer)
   - first_exercise_completed
   - exercise_completed (type, score, level)
   - mastery_test_started, mastery_test_completed (passed)
   - writing_submitted
   - full_exam_started, full_exam_completed
   - pro_upgrade_clicked, pro_upgrade_completed
   - churn_reason (unsubscribe-kyselystä)

4) Feature flags (PostHog):
   - enable_full_exam
   - enable_listening_v2
   - pricing_variant_a / variant_b

5) Dashboard-kyselyt valmiiksi:
   - Aktivaatio-funnel: signup → first_exercise → 3 sessiota
   - Retention: D1, D7, D30
   - Free → Pro conversion

6) GDPR:
   - PostHog: set_config({ persistence: 'memory' }) kunnes cookie-consent annettu
   - Sentry: beforeSend → poista PII (email, nimi)

Commit: "feat(observability): Sentry + PostHog"
```

---

# OSA B — NETTISIVUPARANNUKSET

## #W1 Onboarding-kysely (sinun idea)

```
Puheoon onboarding-kysely rekisteröitymisen jälkeen — AI tarvitsee taustatiedot
personoidakseen harjoituksia.

Tehtävä:

1) Uusi näyttö #onboarding-screen (näkyy vain kerran, flagattuna DB:hen):

   Kysymykset (progressbar 1/7, 2/7...):

   1. "Milloin kirjoitat espanjan YO-kokeen?"
      - Syksy 2026 / Kevät 2027 / Syksy 2027 / Myöhemmin / En ole varma

   2. "Miten kauan olet opiskellut espanjaa?"
      - Alle 1v / 1-2v / 2-3v / Yli 3v / Aloitan nyt

   3. "Mikä on nykyinen arvosanasi espanjassa (kurssikokeissa)?"
      - Alle 6 / 6-7 / 7-8 / 8-9 / 9-10 / En tiedä

   4. "Mikä arvosana tavoitteesi YO-kokeessa?"
      - L / E / M / C / B / A / Läpi riittää

   5. "Mikä on sinulle vaikeinta?"
      (monivalinta max 3)
      - Sanasto / Kielioppi / Kirjoittaminen / Kuuntelu / Luetun ymmärtäminen / Ääntäminen

   6. "Kuinka paljon haluat harjoitella per päivä?"
      - 5 min / 10 min / 20 min / 30 min / Yli 30 min

   7. "Mistä kuulit Puheosta?"
      - Kaveri / Opettaja / Google / TikTok / Instagram / Muu

2) Tallenna migrations/014_onboarding.sql:
   - user_profile: user_id, exam_date, years_studying, current_grade,
     target_grade, weak_areas (text[]), daily_goal_minutes, referral_source,
     completed_at

3) lib/personalization.js:
   - Anna OpenAI:lle user_profile kontekstiksi exercise-genereissä
   - Prioritisoi weak_areas -aiheita (70% harjoituksista)
   - Säädä vaikeus current_grade + target_grade pohjalta

4) Dashboard:
   - "Kokeeseen X päivää" (lasketaan exam_date:sta)
   - "Tämän päivän tavoite: X / Y min"
   - Streak-counter

5) UI:
   - Progressbar
   - Jokainen kysymys omalla sivullaan (ei overwhelm)
   - Skip-nappi alhaalla ("Täytän myöhemmin")
   - Viimeinen sivu: "Valmista! Aloitetaan." + konfetti

6) Analytiikka: trackaa jokainen vastaus PostHogiin

Commit: "feat(onboarding): 7-question personalization quiz"
```

---

## #W2 Landing page rewrite (konversio-optimoitu)

```
Puheon index.html on tällä hetkellä yleinen. Kirjoita se uudelleen konversio-optimoiduksi.

TÄRKEÄ KONTEKSTI:
- Puheolla on kolme hinnoittelutasoa: Free, Pro (9,99€/kk), ja KESÄPAKETTI (29€ kertamaksu).
- Kesäpaketti = KESÄ-SYYSKUU täysi Pro-pääsy yhdellä maksulla (4kk = 7,25€/kk).
- Säästö vs. kuukausimaksu: 39,96€ → 29€ = **SÄÄSTÄT 10,96€ (~27%)**.
- Kohdistettu syksyn 2026 YO-kokelaille (espanjan kirjoitukset syyskuussa 2026).
- Kesäpaketti on PÄÄTUOTE kesä-syyskuun markkinoinnissa — nosta se näkyvimmin.

Rakenne (ylhäältä alas):

0) URGENCY BAR (sticky top, sulkeminen X:llä)
   - Vain näkyvissä kesä-syyskuussa (ajasta JS:llä)
   - "⏳ Syksyn YO-kirjoituksiin X päivää — Kesäpaketti 29€ (kesä-syyskuu, säästät 10,96€)"
   - Klikattavissa → scroll pricing-osioon

1) HERO
   - Yläotsikko: "Paranna espanjan YO-arvosanaasi tekoälyllä"
   - Alaotsikko: "Personoidut harjoitukset, autenttinen YTL-rubriikki, alkaen 9,99€/kk"
   - Kaksi CTA:ta vierekkäin:
     - Primary: "Aloita ilmaiseksi" (ei vaadi maksukorttia)
     - Secondary: "Katso kesäpaketti 29€ →" (scroll pricing)
   - Social proof rivi: "Käytössä X lukiolaisella" (päivity dynaamisesti DB:stä)
   - Hero-kuva: screenshot app:ista (vasen) + käyttäjä kirjoittamassa (oikea)

2) PROBLEM
   - "Espanja YO on vaikea koe. Kurssikirjat eivät riitä."
   - 3 bullet: harjoitus aikaisemmista kokeista puuttuu / kielioppi jumissa /
     kirjoitelmaan ei saa palautetta

3) SOLUTION (3-kolumninen)
   - Ikoni + otsikko + 1 lause
   - Personoitu AI-opettaja
   - YTL-rubriikin mukainen arviointi
   - Spaced repetition — muistat sanat ikuisesti

4) HOW IT WORKS (4 askelta)
   - 1. Vastaa 7 kysymykseen itsestäsi
   - 2. AI luo sinun tasoosi sopivat harjoitukset
   - 3. Kirjoita kirjoitelma → saat tarkan palautteen
   - 4. Simuloi täyskoe kellonvalvonnassa

5) SCREENSHOTS (carousel)
   - Dashboard
   - Sanastoharjoitus
   - Kirjoitelman palaute
   - Täyskoe

6) TESTIMONIALS
   - Jos ei vielä käyttäjiä: "Beta-testaajien palaute tulossa pian"
   - Kun saat 3+ käyttäjää, lisää siteeraus + kuva + nimi + lukio

7) PRICING (kolme korttia rinnakkain)

   KORTTI 1 — Free
   - Otsikko: "Free"
   - Hinta: "0€"
   - Tagline: "Riittää kokeilemiseen"
   - Sisältö:
     - 5 harjoitusta / päivä
     - 1 täyskoe yhteensä
     - Perussanasto
   - CTA: "Aloita Free"

   KORTTI 2 — Pro (keskimmäinen, "suosituin" -banneri jos kesäkausi EI aktiivinen)
   - Otsikko: "Pro"
   - Hinta: "9,99€ / kk"
   - Tagline: "Vakavalle YO-kokeeseen valmistautujalle"
   - Sisältö:
     - Rajaton harjoitusmäärä
     - Rajattomat täyskoesimulaatiot
     - Kirjoitelmien AI-palaute
     - Adaptiivinen vaikeustaso + mastery testit
     - Peruta milloin tahansa
   - CTA: "Hanki Pro"

   KORTTI 3 — KESÄPAKETTI (KESÄ-SYYSKUUSSA KESKIMMÄINEN + "suosituin" -banneri)
   - Otsikko: "Kesäpaketti 2026"
   - Hinta: "29€" (iso pehmeällä korostusvärillä)
   - Vertailuteksti: <s>39,96€</s> → 29€ · **"Säästä 10,96€"**
   - Alahinta-teksti: "Vain 7,25€ / kk — kertamaksu"
   - Tagline: "Valmistaudu syksyn YO-kirjoituksiin ilman seurantaa"
   - Sisältö (kesäpaketti = Pro + extraa):
     - Kaikki Pro:ssa mukana
     - 4kk täysi pääsy: 1.6. – 30.9.2026 (kattaa syyskuun kirjoitukset)
     - Ei automaattista uusimista — 0 peruutushuolta
     - BONUS: Viikkosuunnitelma kohti syksyn YO-kirjoituksia
     - BONUS: Prioriteettituki (vastaan 12h sisällä)
     - BONUS: 1 henkilökohtainen kirjoitelmapalaute minulta (ei vain AI)
   - CTA: "Osta kesäpaketti 29€"
   - Alateksti: "Kertamaksu — ei kuukausilaskutusta · Pääsy päättyy 30.9.2026"

   HUOM: Jos kuukausi on kesä-syyskuu, nosta Kesäpaketti-kortti keskelle
   ja siirrä Pro oikealle. Muulloin Kesäpaketti on piilotettu tai oikeassa laidassa.

   Ehdollinen rendaus JS:llä:
     const month = new Date().getMonth(); // 0-11 (0=tammi, 5=kesä, 8=syys)
     const summerSeason = month >= 5 && month <= 8; // kesäkuu-syyskuu

8) FAQ (7-10 kysymystä, linkki #W5:een)
   - Lisää näkyvä kysymys: "Mitä kesäpaketti sisältää ja milloin se on saatavilla?"
   - Lisää: "Mitä tapahtuu syyskuun jälkeen jos ostan kesäpaketin?"
     Vastaus: "Pääsy päättyy automaattisesti 30.9.2026 — voit tilata Pro 9,99€/kk jatkaaksesi. Kirjoitukset ovat jo syyskuussa, joten tarve yleensä loppuu."
   - Lisää: "Paljonko säästän kesäpaketilla vs. kuukausitilauksella?"
     Vastaus: "4kk Prota kuukausimaksuna = 39,96€. Kesäpaketti = 29€. Säästät 10,96€."

9) FOOTER
   - Privacy / Terms / Refund / Yhteystiedot
   - "Suomessa tehty ❤️"
   - Y-tunnus 3516174-4

Teknisesti:
- Single HTML (index.html) + landing.css
- Kaikki tekstit suomeksi
- Open Graph -tagit (#W9)
- Fontit Google Fonts (Inter + yksi serif)
- Nopea lataus: critical CSS inline, muu async
- Kesäpaketti on oma LemonSqueezy-tuote (eri checkout-linkki kuin Pro)
  - Lisää .env: LEMONSQUEEZY_SUMMER_PACKAGE_URL
  - Lisää routes/stripe.js:ään webhook-käsittely kertamaksulle
  - DB: user_profile.summer_package_expires_at (timestamp, 2026-09-30 23:59)
  - middleware/auth.js isPro: true jos summer_package_expires_at > now() TAI aktiivinen tilaus
  - Ostohetki: saatavilla 1.6. – 31.8.2026 (syyskuussa ei enää myydä — liian lyhyt jäljellä)

Commit: "feat(landing): conversion-optimized rewrite with 29€ summer package"
```

---

## #W3 Diagnostic placement test

```
Ennen rekisteröitymistä: diagnostinen testi joka arvioi YTL-tason.

Tehtävä:

1) Uusi sivu /diagnose.html (ei vaadi kirjautumista)

2) 15 kysymystä, adaptiivinen:
   - Aloita B-tasolta
   - 3 kysymystä per tasosykli
   - Jos 3/3 oikein → nosta taso
   - Jos 0-1/3 oikein → laske taso
   - Jos 2/3 → jatka samalla
   - Lopeta kun pysytty samalla tasolla 2 sykliä TAI 15 kysymystä täynnä

3) Sisältö:
   - Sanasto (5 kysymystä)
   - Kielioppi (5 kysymystä)
   - Lyhyet luetun kohteet (5 kysymystä)

4) Kysymyspankki:
   - data/diagnose_questions.json
   - ~60 kysymystä (10 per taso I-L)
   - Voi käyttää olemassa olevia YO-koearkistoja

5) Lopputulos:
   - "Arvioimamme YTL-arvosana: X"
   - Selitys: "Olet vahva sanastossa, harjoittele kielioppia"
   - CTA: "Luo tili jatkaaksesi tästä tasosta →"
   - Tallenna tulos localStorageen, siirretään user_profile:een rekisteröitymisessä

6) Shareable:
   - Canvas-kuva "Espanja-tasoni: B" (sosiaalinen painostus toimii)

Commit: "feat(diagnose): free diagnostic placement test"
```

---

## #W4 Interactive demo

```
Nettisivulle "Kokeile ilman tiliä" -demo — madaltaa kynnystä rekisteröityä.

Tehtävä:

1) Uusi sivu /demo.html

2) 3 esikonfiguroitua harjoitusta:
   - Sanasto (10 sanaa)
   - Kielioppi (5 kysymystä, aiheena esim. ser vs estar)
   - Lyhyt kirjoitelma (50 sanaa)

3) Ei backend-kutsua — kaikki staattista dataa:
   - data/demo_exercises.json

4) Kirjoitelman "arviointi":
   - Simuloitu AI-palaute (valmis esimerkki)
   - Näytetään 2s delayllä ("AI arvioi...")

5) Demon lopussa:
   - "Hienoa! Oikeassa Puheossa saat personoituja harjoituksia sinun tasolle."
   - CTA: "Luo ilmainen tili →"
   - Linkki #W3 diagnose.html:ään

6) Upota myös landing.html:ään iframe:na TAI modaali "Kokeile"-napilta

Commit: "feat(demo): interactive demo without account"
```

---

## #W5 FAQ-sivu

```
Luo /faq.html Puheon usein kysyttyihin kysymyksiin.

Sisältö (kategoriat):

TUOTE
- Mikä Puheo on?
- Miten Puheo eroaa Duolingosta / ChatGPT:stä?
- Mille YTL-tasolle (I-L) tämä sopii?
- Mihin syllabukseen tämä sopii? (Lyhyt/Pitkä espanja)

KÄYTTÖ
- Kuinka kauan päivässä pitäisi harjoitella?
- Mitä jos en tiedä tasoani?
- Voinko käyttää puhelimella?
- Onko offline-tila? (kun #B11 valmis)

HINTA
- Mitä Free sisältää?
- Mitä Pro sisältää?
- Voinko perua milloin tahansa?
- Onko opiskelija-alennusta? (9,99€/kk on jo lukiolaisille hinnoiteltu)
- Onko rahojen palautus?

TEKNINEN
- Tietoni turvassa? (GDPR, Suomessa tehty)
- Missä data sijaitsee? (EU, Supabase Frankfurt)
- Voinko poistaa tilini?

OPETTAJILLE
- Voinko käyttää tätä luokkahuoneessa?
- Onko opettajille Pro-alennusta? (tulossa)

Teknisesti:
- Yksi HTML-sivu, details/summary -elementit
- Haku-input ylhäällä (filter JS:llä)
- Structured data (FAQ schema) SEO:a varten
- Linkki jokaiselle kysymykselle (#anchor)

Commit: "feat(faq): comprehensive FAQ page with schema"
```

---

## #W6 "Miksi Puheo" — perustajan tarina

```
Lisää /about.html — autenttinen perustajan tarina luo luottamusta.

Sisältö:

1) HERO
   - "Tein Puheon koska YO-kokeeseen valmistautuminen oli liian vaikeaa"
   - Kuvasi

2) TARINA (3-4 kappaletta, ensimmäisessä persoonassa)
   - Miksi tämä ongelma on sinulle tärkeä
   - Oma kokemus espanjasta / YO-kokeesta
   - Mitä yritit ja mikä ei toiminut (Duolingo, Anki, kurssikirjat)
   - Miksi AI on ratkaisu

3) MITÄ USKON
   - "Tekoäly voi olla henkilökohtainen opettaja jokaiselle"
   - "Opiskelun pitää olla edullista"
   - "Suomalaisten YO-kokelaiden ansaitsevat parempia työkaluja"

4) TIIMI
   - Vain sinä (ole rehellinen — solo founder)
   - Y-tunnus 3516174-4

5) YHTEYSTIEDOT
   - support@puheo.fi
   - Vastaan itse 24h sisällä

6) Pieni korostus sivun lopussa: "Anna palautetta, muutan tuotetta sinun palautteesi perusteella"

Teknisesti:
- Sama layout kuin muilla sivuilla
- Kuva pyöreällä rajauksella
- Ei lainkaan buzzwordeja
- Puhutteleva sinä-muoto

Commit: "feat(about): founder story page"
```

---

## #W7 Exam countdown + tavoiteseuranta

```
Dashboardille countdown + tavoiteseuranta — luo urgenssia.

Tehtävä:

1) Dashboard-widget (ylhäällä):
   - "Kokeeseen X päivää" (lasketaan onboardingin exam_date:sta)
   - Väri: vihreä (>90pv), keltainen (30-90pv), punainen (<30pv)
   - Klikattavissa: avaa kalenterinäkymän

2) Kalenterinäkymä:
   - Kuukausi-grid, jokainen päivä merkitty:
     - Vihreä = tavoite täytetty
     - Oranssi = osittain
     - Harmaa = ei harjoiteltu
     - Punainen = tänään
   - Hover → näyttää sen päivän statsit

3) Viikkotavoite:
   - "Tällä viikolla: X / Y min"
   - Progressbar
   - Streak-counter (peräkkäiset päivät)

4) Saavutukset (gamification):
   - 7 päivän streak → badge
   - 30 päivän streak → badge
   - 100 harjoitusta → badge
   - 10 kirjoitelmaa → badge
   - Ensimmäinen mastery test läpäisty → badge

5) Migration migrations/015_achievements.sql:
   - user_achievements: user_id, badge_code, earned_at

6) Notifikaatio kun achievement → konfetti + push (#B11)

Commit: "feat(dashboard): exam countdown + streak + achievements"
```

---

## #W8 Shareable results

```
Kun käyttäjä suorittaa mastery testin / täyskokeen → jaa tulos somessa.

Tehtävä:

1) lib/shareCanvas.js (frontend):
   - createResultImage({ type, score, level, date, userName? })
   - Piirtää canvakselle:
     - Puheo logo + värit
     - Tulos isona ("Arvioni: E")
     - Taustalla subtle graafinen elementti
     - Footer: "puheo.fi"
   - Palauttaa Blob / dataURL

2) Share-nappi tulosnäytössä:
   - "Jaa tulos" → avaa modaalin
   - Esikatselu kuvasta
   - Napit: "Lataa kuva" / "Kopioi linkki" / "Jaa Instagramiin" / "Jaa TikTokiin"
   - Web Share API jos tuettu, muuten fallback

3) Jaettava linkki:
   - puheo.fi/r/{short_id}
   - routes/share.js: redirect landing-sivulle jossa "Ystäväsi sai E:n Puheossa"
   - Tallenna referraalit migrations/016_referrals.sql

4) Gamification:
   - Jos jaettu linkki johtaa rekisteröitymiseen → molemmat saavat 1 ilmaisen Pro-viikon

5) Privacy:
   - Käyttäjän nimi piilossa jos ei halua jakaa
   - Kuvassa vain tulos + Puheo-brändi

Commit: "feat(share): canvas-based shareable result images"
```

---

## #W9 SEO + OG + sitemap + GA4

```
Puheo on näkymätön Googlessa. Kuntoon perustasolla (ei maksullisia työkaluja).

Tehtävä:

1) Meta-tagit jokaiselle HTML-sivulle:
   - <title> per sivu (max 60 merkkiä)
   - <meta name="description"> (max 160 merkkiä)
   - Open Graph: og:title, og:description, og:image, og:url, og:type
   - Twitter Card: summary_large_image
   - <link rel="canonical">

2) Luo OG-kuvat (1200x630):
   - Pääsivu: "Puheo — Espanja YO tekoälyllä"
   - Pricing: "9,99€/kk" korostettuna
   - Blog-artikkelit (tulevaisuudessa)
   - Käytä SVG + export PNG, ei ulkopuolisia

3) public/sitemap.xml:
   - Kaikki staattiset sivut
   - Generoi deploy-skriptissä dynaamisesti

4) public/robots.txt:
   - Sallii kaikki paitsi /api/ ja /app
   - Sitemap: https://puheo.fi/sitemap.xml

5) Structured data (JSON-LD):
   - Organization (pääsivu)
   - SoftwareApplication (pääsivu)
   - FAQPage (faq.html)
   - Product + Offer (pricing.html)

6) Google Analytics 4:
   - Mitattava vain cookie-consentin jälkeen (#W10)
   - Event-nimet vastaavat PostHogia (#B12)

7) Google Search Console:
   - Varmista omistajuus HTML-tagilla
   - Lähetä sitemap
   - (Manuaalinen askel MIGRATION.md:ssä)

8) Nopeus:
   - Critical CSS inline
   - Kuvat <picture>-elementeissä (webp + jpg)
   - Lazy load all images
   - Preconnect fonts

9) Suomi-kohdistus:
   - <html lang="fi">
   - hreflang="fi" linkeissä
   - .fi-domain signaloi suomi

Target: Lighthouse >90 kaikissa

Commit: "feat(seo): meta tags, OG images, sitemap, GA4"
```

---

## #W10 GDPR cookie consent

```
Puheolla on suomalaisia käyttäjiä → GDPR pakollinen.

Tehtävä:

1) lib/cookieConsent.js (frontend, vanilla JS, <5KB):
   - Banner alhaalla kun ei consent-cookieta
   - 3 nappia:
     - "Hyväksy kaikki"
     - "Vain välttämättömät"
     - "Hallinnoi"
   - "Hallinnoi" → modaali jossa toggles per kategoria:
     - Välttämättömät (pakollinen, on)
     - Analytiikka (GA4, PostHog) — pois oletuksena
     - Markkinointi (ei nyt, tulevaisuudessa)
   - Tallennus cookie: puheo_consent={essential:true,analytics:false,marketing:false}
   - 13kk voimassa

2) Piilota kaikki analytiikka-initit jos consent.analytics === false:
   - app.js
   - index.html
   - Kaikki HTML-sivut

3) Asetussivu /settings jossa käyttäjä voi muuttaa suostumuksen

4) Cookie policy:
   - /privacy.html päivitys: lista kaikista cookieista
     - puheo_session (välttämätön, 24h)
     - puheo_consent (välttämätön, 13kk)
     - _ga, _ga_X (analytiikka, 2v)
     - ph_* (PostHog, 1v)

5) "Poista tilini" -toiminto /settings:
   - POST /api/auth/delete-account
   - Soft delete: deactivated_at timestamp
   - 30 päivän grace period
   - Hard delete cron-jobilla

6) Tietojen lataus (GDPR data portability):
   - GET /api/auth/export-data → JSON kaikesta käyttäjän datasta
   - Email-link dataan, voimassa 24h

7) Testaa että sivu toimii JOS käyttäjä valitsee "Vain välttämättömät"

Commit: "feat(gdpr): cookie consent + data export + account deletion"
```

---

# SUOSITELTU JÄRJESTYS

Tee näin, älä hypi yli:

**Faasi 1 — Koodin siisteys (1-2 päivää)**
1. #B3 app.js refactor (jo työn alla)
2. #B4 Cleanup + deps + docs

**Faasi 2 — Nettisivu kuntoon ennen markkinointia (1 viikko)**
3. #W1 Onboarding (sinun idea)
4. #W10 GDPR cookie consent (pakollinen ennen launchia)
5. #W9 SEO + GA4
6. #W2 Landing rewrite
7. #W5 FAQ
8. #W6 About
9. #W3 Diagnose
10. #W4 Demo

**Faasi 3 — Tuotteen syvyys (2-3 viikkoa)**
11. #B6 Adaptive difficulty + mastery tests
12. #B5 SM-2 spaced repetition
13. #B7 YTL writing rubric
14. #B8 Kuullun ymmärtäminen
15. #B9 Täyskoe
16. #W7 Countdown + achievements
17. #W8 Shareable results

**Faasi 4 — Operatiivinen valmius (1 viikko)**
18. #B10 Cost tracking
19. #B12 Sentry + PostHog
20. #B11 PWA + push

**Faasi 5 — Markkinointi alkaa**
- Opettajasähköpostit
- Social media
- TikTok-sisältö

---

Jos haluat, voin laajentaa jotakin yksittäistä promptia tarkemmaksi tai muuttaa järjestystä. Sano vain mikä.
