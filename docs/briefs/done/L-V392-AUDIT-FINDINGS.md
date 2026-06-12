# L-V392 — AUDIT FINDINGS (Vaihe 1, ei korjauksia)

**Ajettu:** 2026-06-05 · projekti `teovmfkoebnghqmbtycj` (Postgres 17.6) · **WRITER (Claude Code)**
**Menetelmä:** Supabase-advisorit + 34 taulun RLS-policy-dump (`pg_policies`) + `information_schema` skeematarkistus + koodikatselmus (middleware/auth.js, lib/supabase.js, routes/{auth,progress,dashboardV2,placement,gdpr,curriculum,digikirja,email}.js, lib/levelEngine.js viittaukset) + migraatiohistoria.
**Status:** STATIC-audit valmis. **Live-todennus (2-käyttäjäeristys + selkäranka-Playwright) EI vielä ajettu** — ne ovat porttina ennen FIX-vaiheen sulkemista (kohta "Avoimet todennukset" alla).

---

## Tiivistelmä

| Vakavuus | Määrä | Lyhyesti |
|---|---|---|
| **P0** | **0** | Static-katselmuksessa EI löytynyt data-vuotoa, data-katoa eikä käytön estävää bugia. (Live-todennus vielä auki — voi nostaa tämän.) |
| **P1** | **4** | Keskeneräinen adaptiivinen migraatio (4 polkua phantom-tauluun), GDPR-taululistan drift, RLS-safety-net kytkemättä, RLS initplan -skaalabugi. |
| **P2** | **5** | Leaked-password-protection, translation_accepted cross-read, indeksoimattomat FK:t, käyttämättömät indeksit, auth-rate-limit-katto. |

**Tärkein viesti:** Pelätty proaktiivinen P0-rypäs ei toteutunut. Eristys on rakenteellisesti kunnossa (jokainen reitti suodattaa `.eq("user_id", req.user.userId)`, GDPR toimii vain `req.user.userId`:llä, RLS-policyt owner-scopattu). Suurin todellinen ongelma on **puoliksi tehty adaptiivisen moottorin migraatio** (plan 08), joka jättää neljä mountattua koodipolkua hakkaamaan taulua jota ei ole.

---

## P1 — korjattava tässä ikkunassa (tai eksplisiittisesti deferrattava)

### P1-1 — Keskeneräinen adaptiivinen migraatio: 4 polkua kirjoittaa olemattomaan tauluun `user_level_progress`
**Oire:** `information_schema` vahvistaa: **`user_level_progress`-taulua EI ole tuotannossa** (migraatio `011_adaptive_levels.sql` loi sen, mutta sitä ei ole applyttu / se on pudotettu). Silti viisi koodikohtaa viittaa siihen:
- `routes/progress.js:43,51,101,355` — adaptiivinen inkrementointi POST /progress:ssä (try/catch nielee virheen) + GET /user-level.
- `routes/adaptive.js:26,46,288,302,332` — koko `/api/adaptive/*` mastery-test-promote/demote.
- `routes/placement.js:164,231` — tason persistointi placement/choose-level:ssä (virhe logataan, ei palauteta).
- `routes/dashboardV2.js:313,327` — `loadAdaptiveStatus` upsertaa phantomiin joka dashboard-latauksella.
- `routes/gdpr.js:22` — poistolistalla (no-op).

**Juurisyy:** Koodissa on **kaksi kilpailevaa adaptiivista järjestelmää**:
- **VANHA (kuollut):** `user_level_progress` (per-mode malli, sarakkeet `current_level/mode/questions_at_level/level_started_at/adaptive_enabled`). Taulua ei ole.
- **UUSI (kanoninen, elää):** `user_level` (mig `018`) + `user_mastery` (mig `021`), eri sarakkeet (`level_since, rolling_accuracy_30d, rolling_sessions_30d, checkpoint_passed`). Käyttäjät: `lib/levelEngine.js`, `lib/learningPath.js`, `lib/sessionComposer.js`. **`lib/adaptive.js:3` sanoo suoraan: "LEGACY — canonical engine is lib/levelEngine.js (see plans/08-adaptive-engine-unification.md)".**

**Vaikutus (todellinen, ei teoreettinen):**
- `/api/adaptive/status` on tuotannon **hitain endpoint (1094 ms**, `AUDIT_LIVE_DASHBOARD.md`) — osin koska se tekee epäonnistuvia round-trippejä phantomiin.
- Jokainen vocab/grammar/reading-submit ajaa 1–4 epäonnistuvaa DB-kutsua (`catch {}` syö ne).
- Legacy mastery-test promote/demote (`routes/adaptive.js`) ei toimi lainkaan.
- **EI data-katoa:** placement-taso persistoituu `diagnostic_results`-tauluun (toimii), ja GET /user-level palautuu siihen fallbackilla #2 → perusvaikeustaso toimii. Kanoninen `user_level`/levelEngine kirjoittaa oikein.

**Toistoaskeleet:** `select * from information_schema.tables where table_name='user_level_progress'` → 0 riviä. Aja placement-submit → palvelinlokiin "Placement level_progress upsert error".

**Korjaussuositus (FIX-vaihe):** Vie plan 08 loppuun. Joko (a) poista legacy-polut (`routes/adaptive.js` unmount + progress.js/dashboardV2/placement.js user_level_progress-lohkot pois, ohjaa levelEngineen), tai (b) uudelleenkirjoita ne `user_level`+levelEngine-API:n päälle. **ÄLÄ** luo `user_level_progress`-taulua uudestaan — se palauttaisi kuolleen rinnakkaisjärjestelmän. Suositus: (a), koska levelEngine on jo kanoninen.

---

### P1-2 — GDPR-poisto/-export ohittaa oikeat taulut (Art. 17 / Art. 20 vajaa)
**Oire:** `routes/gdpr.js` `USER_TABLES` (rivit 18–40) on driftannut skeemasta:
- **Ohittaa user_id-omisteiset taulut:** `user_level`, `user_session_state`, `hint_events`, `ai_usage` → näiden rivit jäävät tilille poiston jälkeen (vajaa erasure) eikä niitä viedä exportiin.
- **Sisältää phantomin:** `user_level_progress` (no-op) ja `mastery_test_attempts` (varmista olemassaolo — ei ollut 34 taulun policy-listalla).

**Vaikutus:** Käyttäjän "poista tilini" jättää residuaalidataa neljään tauluun. Vähäinen live-impakti nyt (~2 käyttäjää), mutta laillinen velvoite → P1.

**Korjaussuositus:** Generoi `USER_TABLES` ohjelmallisesti (kysele `information_schema.columns` missä `column_name='user_id'`), tai päivitä lista käsin + lisää vitest joka vertaa listaa skeemaan ettei drift toistu.

---

### P1-3 — RLS-safety-net (`req.supabase` / `createUserClient`) rakennettu mutta ei kytketty
**Oire:** `middleware/auth.js:34` asettaa `req.supabase = createUserClient(jwt)` (RLS-scoped client, L-V339:n defense-in-depth). **Yksikään reitti ei käytä `req.supabase`:a** — kaikki käyttävät `supabase` (= `adminClient`, joka OHITTAA RLS:n) eksplisiittisellä `.eq("user_id", ...)`-suotimella.

**Vaikutus:** Eristys lepää 100 % manuaalisten `.eq("user_id")`-suotimien varassa. Yksi unohtunut suodin = cross-user-vuoto **ilman RLS-verkkoa**. RLS-policyt suojaavat vain ulkoisen Data-API:n kautta tulevia kutsuja, eivät palvelimen omia. Tämä on systeeminen riski, ei akuutti bugi (suotimet ovat paikallaan kaikissa katselmoiduissa reiteissä).

**Korjaussuositus:** Joko (a) ohjaa user-datan luku/kirjoitus `req.supabase`:n läpi (RLS verkoksi), tai (b) hyväksy admin+manuaalisuodin -malli ja dokumentoi RLS puhtaaksi ulkoisen API:n backstopiksi + lisää lint/test joka vaatii `.eq("user_id")`:n jokaiseen user-omisteisen taulun kyselyyn. Halvempi: (b) + grep-testi.

---

### P1-4 — RLS initplan re-evaluointi rivikohtaisesti (skaalabugi, scope=skaala)
**Oire:** Advisorin `auth_rls_initplan` (WARN ×4): `free_usage` (policyt `_owner_select/_owner_upsert/_owner_update`) ja `translation_accepted` (`_user_insert`) käyttävät paljasta `auth.uid()`:ta `(select auth.uid())`:n sijaan → re-evaluoituu per rivi.
**Vahvistus policy-dumpista:** `free_usage_owner_*` qual/with_check = `(auth.uid() = user_id)` (ei select-wrapattu). Muut taulut on jo korjattu `(( SELECT auth.uid()))`-muotoon (mig `034`).
**Vaikutus:** Suboptimaalinen skaala — pieni nyt, mutta scope sanoo skaala mukaan.
**Korjaus:** Migraatio joka pudottaa+luo nämä 4 policya `(select auth.uid())`-muodolla. → https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

---

## P2 — dokumentoidaan talvelle (`L-V392-P2-DEFERRED.md`)

- **P2-1 — Leaked-password-protection DISABLED** (advisor SECURITY/WARN). HaveIBeenPwned-tarkistus pois. Ei SQL:ää → vaatii Supabase-dashboard-toimen (Auth → Policies). **ACTION-REQUIRED Marcelille** (alla).
- **P2-2 — `translation_accepted` SELECT-policy `qual=true`** kaikille authenticatedille → jokainen käyttäjä lukee kaikki rivit ml. contributor `user_id`. Todennäköisesti tarkoituksellista (jaettu käännösmuisti), mutta varmista ettei contributor-UUID:n paljastus haittaa. Matala.
- **P2-3 — Indeksoimattomat FK:t** (advisor INFO): `translation_accepted.user_id`, `user_curriculum_progress.kurssi_key`. Lisää kattavat indeksit.
- **P2-4 — ~18 käyttämätöntä indeksiä** (advisor INFO). ÄLÄ pudota sokkona — osa tukee tulevaa käyttöä; arvioi per indeksi.
- **P2-5 — Auth-rate-limit-katon validointi:** `middleware/rateLimit.js` (authLimiter/registerLimiter) olemassa; vahvista että login-brute-force + register-spam todella estyvät (L-V340-muistio: Supabase-rate-limit ei laske burstia). Ei verifioitu tässä auditissa.

---

## ✅ Verifioitu kunnossa (luottamus, ei korjattavaa)

- **Kaikilla 34 public-taululla RLS päällä** + vähintään yksi policy. Ei RLS-disabled-tauluja, ei policy-tonta taulua.
- **`signInWithPassword` vain `authClient`illa** (routes/auth.js:51,84,99) — L-V339 session-hijack-fix paikallaan, ei regressoitunut.
- **`adminClient`/`authClient` erilliset instanssit** (lib/supabase.js) — service-role-session-kaappaus estetty, dokumentoitu.
- **UPDATE-vaatii-SELECT-ansa EI laukea:** jokaisella UPDATE-policylla on vastaava SELECT-policy; `with_check=null` UPDATE:ssa periytyy `USING`-qualista (Postgres-default) → ei voi vaihtaa `user_id`:tä toiselle.
- **`user_metadata` EI auktorisoinnissa:** rekisteröinti tallentaa nimen/puhelimen user_metadataan mutta kommentti + koodi vahvistaa ettei sitä lueta RLS/auth-päätöksissä; Pro/tier luetaan `user_profile`-taulusta `adminClient`illa.
- **Selkäranka-kirjoitukset persistoituvat user_id + language -leimalla:** `exercise_logs`, `user_mistakes`, `user_curriculum_progress`, `user_lesson_progress`, `diagnostic_results`, `user_self_assessments` — kaikki suodattavat `.eq("user_id")` + kieliskooppaus (`normalizeLang`). Ei havaittua cross-language-vuotoa staattisesti.
- **GDPR-reitit toimivat vain `req.user.userId`:llä** — ei caller-annettua kohde-id:tä → ei voi osua toisen dataan.

---

## 🔓 Avoimet todennukset (aja ennen FIX-vaiheen sulkemista)

Nämä EIVÄT ole vielä ajettu — ne ovat acceptance-kriteereissä ja voivat nostaa P0:n:
1. **`tests/verify-isolation.mjs`** live-serveriä vasten (2 testitiliä, `.env`-tunnukset) → todista cross-user + cross-language -eristys.
2. **Selkäranka-Playwright:** uusi käyttäjä → kartoitus → kurssi → tehtävät → reload + logout + relogin → kaikki data paikallaan. (Brief, kohta "SELKÄRANKA-TESTI".)

Voin ajaa molemmat heti kun annat luvan FIX-vaiheelle (vaatii dev-serverin pystyyn).

---

## 📋 ACTION-REQUIRED (Marcel, vaatii dashboard-toimen — ei SQL/MCP)

- **Leaked-password-protection päälle:** Supabase Dashboard → Authentication → Policies (tai Auth settings) → ota käyttöön "Leaked password protection" (HaveIBeenPwned). En voi tehdä tätä MCP:llä; se ei ole SQL-migraatio.

---

## Ehdotettu FIX-järjestys (kun greenlight)

1. Aja avoimet todennukset (1+2) → vahvista ettei piilo-P0:aa.
2. **P1-1** plan 08 loppuun (legacy user_level_progress -polut pois) — suurin todellinen hyöty (perf + log-noise + dead feature).
3. **P1-2** GDPR-taululista + drift-test.
4. **P1-4** RLS initplan -migraatio (MCP `apply_migration`).
5. **P1-3** RLS-safety-net päätös (a/b) + grep-test.
6. P2:t → `L-V392-P2-DEFERRED.md` + ACTION-REQUIRED Marcelille.
7. `get_advisors` uudelleen, `npm test`, `node --check`.

**Pysähdyn tähän briefin mukaan — odotan uudelleenpriorisointia / greenlightia ennen korjauksia.**
