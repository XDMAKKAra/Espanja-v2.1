# 03 / 6 — L-LANG-INFRA-1

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Tämän loopin tarkoitus on tehdä **koko järjestelmä multi-language-valmiiksi koodissa**, mutta **pitää sisältö tällä hetkellä espanja-only**. Kun saksa/ranska -sisältö myöhemmin kirjoitetaan käsin, se on pelkkä data-drop oikeisiin kansioihin — ei koodimuutoksia.

---

## 1. Lähtötilanne ja motivaatio

ROADMAP.md järjestys 4 (L-LANG-INFRA-1) on sisällöltään sama kuin tämä brief. Käyttäjä haluaa että per-language-tuki rakennetaan **ennen** kuin sisältö on valmiina, jottei DE/FR-launch viivästy "ai vittu nyt pitää refaktoroida 50 tiedostoa" -syklillä.

Nykyinen koodi olettaa espanja kaikkialla:
- `data/courses/kurssi_*/lesson_*.json` — espanja-sisältö juuri tämän polun alla
- `lib/curriculumData.js` — `CURRICULUM_KURSSIT` on yksi taulukko, espanja
- `lib/lessonLoader.js` (jos olemassa, muuten `routes/lessons.js`) — lukee suoraan `data/courses/`
- `lib/openai.js` — promptit hardcoded "espanja" / "spanglish" / "Spanish"
- `routes/exercises.js` + `routes/writing.js` + `routes/exam.js` — generoi/arvioi promptilla joka olettaa espanja
- `lib/curriculumData.js`-pohjainen kurssi-UI näyttää aina espanjan kurssit
- `js/state.js` ei tunne `target_language`-tilaa — appi olettaa espanja

`user_profile.target_language` on jo skeemassa (DB-TABLE-FIX-1 + ONBOARDING-REDESIGN-1) → frontend kysyy sen onboardingin vaiheessa 1, mutta arvo ei vaikuta mihinkään muuhun kuin onboarding-finish-redirectiin. Se on "tiedetään minkä kielen halusit, mutta latasimme silti espanjan".

**Tavoite:** per-language data + per-language reitit + per-language openai-promptit + frontend-state joka kunnioittaa `target_language`. Kun käyttäjä valitsee saksan, hän näkee `data/courses/de/`-kurssit (tyhjiä jos ei kirjoitettu), AI-arviointi käyttää saksa-kontekstia (vrt. espanja), ja URL-/SEO-rakenne tukee tulevia landing-sivuja (jotka tehdään seuraavassa loopissa, 04_LANG_LANDINGS_1).

---

## 2. Scope — Mitä TEHDÄÄN

### Worker A — Data-layer split (Sonnet)

**Tehtävä:** muuta `data/courses/`-rakenne per-language ja päivitä loaderit.

1. **Tiedostojen siirto:**
   ```
   data/courses/kurssi_1/  → data/courses/es/kurssi_1/
   data/courses/kurssi_2/  → data/courses/es/kurssi_2/
   ...
   data/courses/kurssi_8/  → data/courses/es/kurssi_8/
   data/courses/README.md  → data/courses/es/README.md
   ```
   Käytä `git mv` jotta history säilyy.

2. **Luo tyhjät DE+FR-skeemarungot** (vain hakemistot + README, ei sisältöä):
   ```
   data/courses/de/README.md   ("Saksan kurssit — tulossa, ei vielä sisältöä")
   data/courses/fr/README.md   ("Ranskan kurssit — tulossa, ei vielä sisältöä")
   ```

3. **`lib/curriculumData.js`**: muunna export `LANG_CURRICULA = { es: [...espanja-rakenne...], de: [], fr: [] }` -muotoon. Säilytä takaisinpäin yhteensopiva `CURRICULUM_KURSSIT`-export aliaksena `LANG_CURRICULA.es`:lle (back-compat call-site jotka eivät vielä ota lang-parametria).

4. **`lib/lessonLoader.js` (jos olemassa, muuten `routes/lessons.js` tai `routes/curriculum.js`):** lue tiedostot polusta `data/courses/${lang}/${kurssiKey}/${lessonKey}.json`. Default `lang = 'es'`. Jos `data/courses/${lang}/`-hakemistossa ei ole sisältöä → palauta strukturoitu vastaus `{ available: false, language: lang, message: "Sisältöä ei vielä julkaistu — liity wait-listille" }`, älä 404.

5. **`scripts/validate-lessons.mjs`:** päivitä lukemaan `data/courses/es/` (tai kaikki kielet jos useita on tulossa). Validate-skripti pitää ajaa: `npm run validate:lessons` → 90/90 PASS espanjalle, 0/0 PASS saksalle/ranskalle (tyhjät hakemistot).

6. **DB-fallback** (`routes/curriculum.js` käyttää `CURRICULUM_KURSSIT` jos taulu ei ole seedattu): tarkista että fallback toimii sekä `?lang=es` että `?lang=de|fr` -kyselyille.

### Worker B — OpenAI-promptien parametrisointi (Sonnet)

**Tehtävä:** poista hardcoded "espanja" / "Spanish" -viittaukset prompteista ja korvaa parametrilla.

1. **`lib/openai.js`** + kaikki promptit-rakentavat funktiot (`buildVocabPrompt`, `buildGrammarPrompt`, `buildReadingPrompt`, `buildWritingGradingPrompt`, `buildExamPrompt`, jne):
   - Lisää `lang`-parametri (default `'es'`)
   - Mappaa: `es → "espanja" / "Spanish"`, `de → "saksa" / "German"`, `fr → "ranska" / "French"`
   - Few-shot-esimerkit per kieli **vain espanjalle** tällä hetkellä — DE/FR few-shotit jätetään myöhemmälle (sisältö-loopit tekevät ne). Muuten promptit ovat kielineutraaleja.

2. **`routes/exercises.js`, `routes/writing.js`, `routes/exam.js`, `lib/writingGrading.js`:**
   - Hae käyttäjän `target_language` middleware:llä (`req.user.target_language`, default `'es'`)
   - Välitä se promptin rakentajalle
   - **Älä toistaiseksi salli DE/FR:ää AI-reiteille** — palauta `403 { error: 'language_not_supported_yet', language: lang }` jos `lang !== 'es'`. Tämä estää käyttäjää saamasta sekavia AI-vastauksia ennen kuin saksa/ranska-promptit on hiottu.

3. **Soft-launch-flag:** `process.env.AI_LANGUAGES_ENABLED = 'es'` (CSV). Jos ympäristömuuttuja sisältää kielen → reitti hyväksyy. Tämä antaa myöhemmin käyttäjälle helpon switch-flagin Vercelliin kun DE-promptit ovat valmiit.

4. **`puheo-ai-prompt`-skill:** lue se ennen muutoksia. Kaikki sen säännöt (YO-koe-rubriikit, JSON-output, anti-repetition) ovat kielineutraalit — älä riko niitä, vain parametrisoi kielitarrat.

### Worker C — Frontend SPA language-state (Sonnet)

**Tehtävä:** appi tunnistaa `target_language` ja kieltäytyy lataamasta espanja-dataa kun käyttäjä on valinnut DE/FR.

1. **`js/state.js`:** lisää `state.language` (default `'es'`). Hydratoi `user_profile.target_language`-arvosta, asetetaan onboardingin lopussa ja muutetaan asetuksissa (jos käyttäjä haluaa vaihtaa).

2. **`js/main.js`:**
   - Login-jälkeen lataa `user_profile.target_language` → `state.language = lang || 'es'`
   - Jos `lang === 'es'` → normaali flow (lataa kurssit, näytä dashboard)
   - Jos `lang !== 'es'` → näytä **Coming-Soon-screen** (uusi `#screen-coming-soon` `app.html`:ssä) jossa: "Saksan/Ranskan tehtävät tulossa pian. Liity wait-listille." + email-input → POST `/api/onboarding/waitlist`
   - Koko muu app-flow blokattu DE/FR-käyttäjältä toistaiseksi — paitsi Settings-screen jossa hän voi vaihtaa kielen takaisin tai päivittää profiilia

3. **`js/screens/dashboard.js, vocab.js, grammar.js, reading.js, writing.js, exam.js`:** kaikki API-kutsut lähettävät `?lang=${state.language}` query-parametrin. Backend käyttää tätä ennen `req.user.target_language`-fallbackia (helpompi testata).

4. **`js/screens/onboardingV3.js`:** tarkista että vaihe 1 (kielinvalinta) tallentaa `target_language`-kentän oikein ja routaa onnistuneen tallentajan jälkeen oikeaan flow:hyn (ES → onboarding-jatko, DE/FR → wait-list-screen).

5. **Settings:** lisää "Vaihda kieli" -osio (vaihtaa `target_language` ja kirjoittaa user_profile-tauluun). Varovaisuus: kielen vaihto resetoi adaptiivisuuden ja kurssipolun. Lisää vahvistus-modaali "Vaihtamalla menetät espanjan edistyksen — oletko varma?".

---

## 3. Acceptance criteria

- [ ] `data/courses/es/`-rakenne sisältää kaikki 90 lesson-tiedostoa, `git log -- data/courses/kurssi_1/lesson_1.json` palauttaa täyden historian
- [ ] `data/courses/de/` + `data/courses/fr/` ovat olemassa (vain README:t)
- [ ] `npm run validate:lessons` PASS 90/90 espanjalle
- [ ] `lib/curriculumData.js` exporttaa `LANG_CURRICULA.{es,de,fr}` + back-compat `CURRICULUM_KURSSIT`
- [ ] Backend AI-reitit: ES PASS, DE/FR palauttaa `403 language_not_supported_yet` (paitsi jos `AI_LANGUAGES_ENABLED` salli)
- [ ] Frontend ES-käyttäjä → ennallaan
- [ ] Frontend DE/FR-käyttäjä → ohjautuu Coming-Soon-screeniin
- [ ] Settings-kielenvaihto toimii ja kirjoittaa user_profile-tauluun
- [ ] `node --check` clean kaikilla muokatuilla `.js`-tiedostoilla
- [ ] `npm run test:bug-scan` PASS (META_QA_LOOP Vaihe 2B gate) — sekä env:ttä että envien kanssa
- [ ] axe-core: 0 critical, 0 serious uusilla screeneillä (Coming-Soon, Settings-kielenvaihto)
- [ ] SW `CACHE_VERSION` bumpattu jos STATIC_ASSETS muuttui

---

## 4. Pois scopesta

- ❌ Saksan tai ranskan **sisällön** kirjoitus (lessons, vocab, examples) — tämä loop koskee vain rakenteita
- ❌ SEO-landingit `/espanja`, `/saksa`, `/ranska` (= 04_LANG_LANDINGS_1)
- ❌ DE/FR-spesifiset few-shot-esimerkit OpenAI-prompteissa — myöhemmin kun sisältö olemassa
- ❌ Email-kampanjat per kieli — myöhemmin
- ❌ Vercel-konfiguraation per-domain-routaus

---

## 5. Skill-set

- `puheo-ai-prompt` (worker B — promptien parametrisointi)
- `puheo-screen-template` (worker C — Coming-Soon-screen)
- `puheo-finnish-voice` (Coming-Soon + Settings-copy)
- `supabase` (jos tarvitaan migraatio jollekin uudelle kentälle — todennäköisesti ei, kaikki on jo skeemassa)
- `frontend-design`, `design-taste-frontend` (Coming-Soon-screen visuaalit)
- `design:accessibility-review` (Coming-Soon + Settings)
- `webapp-testing` ei skillinä — käytä `npm run test:bug-scan`-skriptiä

---

## 6. Riskialttiit kohdat (worker, lue tarkkaan)

1. **Git mv vs plain mv:** käytä `git mv` jotta historia ei katkea. Älä `mv`-komentoa kun tiedostot ovat versioitu.
2. **Validate-lessons-skripti:** sen polku on hardcoded vanhaan rakenteeseen. Päivitä skripti, älä jätä rikki.
3. **Bundle-rebuild:** `app.bundle.js` voi olla cachattu vanhalla curriculumData-importilla. Bundle pitää regen — META_QA_LOOP Vaihe 4:ssa kerro käyttäjälle pyydä `npm run build`.
4. **Back-compat:** vanhat call-sitet jotka importoivat `CURRICULUM_KURSSIT` ilman lang-parametria — älä riko, alias-export es-kieleen.
5. **Onboarding-redirect:** käyttäjä joka valitsi saksan → ohjautui ennen `aloitus-v2`:lle joka oli espanja-keskeinen. Päivitä jotta DE/FR-onboarding suoraan Coming-Soon-screeniin onboardingin jälkeen.

---

## Lopuksi
Tämä on **03 / 6** jonossa (`agent-prompts/02-queue/03_LANG_INFRA_1.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
