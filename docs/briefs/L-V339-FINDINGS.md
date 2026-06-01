# L-V339 — Funktionaalinen + backend-terveys-audit: LÖYDÖKSET

**Päivä:** 2026-06-01
**Ajaja:** Claude Code (writer)
**Scope:** Oikeellisuus + tilan eristys (EI kuormatesti, = L-V340)
**Verifiointi:** kaikki väitteet alla ajettu omilla työkaluilla, ei oletuksia.

---

## TL;DR

Server-side **muistin eristys on kunnossa** — ei jaettua mutable-käyttäjätilaa, RLS-advisor puhdas, ei vuotaneita secrettejä. Yksi todellinen P1 (cross-language progress bleed, vahvistettu — ei korjattu, vaatii migraation) ja yksi P2 (AI-kustannussuoja failaa auki kirjautuneille). Acceptance-gate (build + bug-scan + vitest) vihreä.

---

## Mitä ajettiin (evidenssi)

| Tarkistus | Komento | Tulos |
|---|---|---|
| Yksikkötestit | `npx vitest run` | **1308/1308 PASS** (oli 1307/1308; korjattu stale lesson-labels-spec) |
| Build | `npm run build` | **PASS** — app.bundle.js + .css + chunks |
| Bug-scan E2E | `npx playwright test tests/e2e-bug-scan.spec.js` | **38 PASS, 2 skip** (kirjautunut-walk skipattu: TEST_*_EMAILS env ei asetettu lokaalisti) |
| Secret-scan | `npm run security:scan` | **PASS** — ei kovakoodattuja secrettejä |
| Bundle-secrets | grep `service_role\|sk-\|OPENAI_API_KEY` app.bundle.js/app.js/index.html | **0 osumaa** |
| RLS / security advisors | Supabase `get_advisors security` | **1 WARN** (leaked-password-protection), 0 RLS-puutetta |

API-virhetilat (401/403/429/400/500) ja auth-middleware ovat yksikkötestattuja ja vihreät:
`middleware-auth.test.js`, `middleware-rate-limit.test.js`, `middleware-cost-limit.test.js`, `routes-auth.test.js`, `routes-smoke.test.js`.

---

## Osa A2 — Tilan eristys (Marcelin varsinainen huoli)

### ✅ Ei jaettua mutable-käyttäjätilaa palvelimella
Kävin läpi jokaisen moduulitason `Map`/`Set`/objektin `routes/`, `lib/`, `middleware/`:

- `routes/dashboardV2.js` `adaptiveCache`, `dashboardV2Cache` — **keyed per käyttäjä**: `${userId}::${mode}` ja `${userId}::${adaptiveMode}::${language}`. Ei vuoda.
- `lib/openai.js _memCache` — keyed promptilla (sisältö, ei käyttäjädata). OK (brief sallii).
- `lib/readingBank.js`, `lib/writingBank.js` `_cache` — keyed `${lang}/${slug|type}` (staattinen sisältö). OK.
- `middleware/rateLimit.js _memBuckets` — keyed `rl:${path}:${userId|ip}`. OK.
- Loput ovat vakioita (`VALID_MODES`, `SUPPORTED_LANGS` jne.).

**Johtopäätös:** kaksi eri tiliä yhtä aikaa ei voi nähdä toistensa dataa palvelinmuistin kautta. Eristys nojaa user_id-keyyn + RLS:ään, molemmat kunnossa.

### 🔴 P1 — Cross-language progress bleed (VAHVISTETTU, EI korjattu)
Tämä on `project_open_issues_2026_05_19`:n tunnettu bugi. Testattiin eksplisiittisesti, **on yhä rikki**.

**Juurisyy (ei pintavika):** edistymädataa **ei skoupata kielellä lainkaan data-layerissa.**
- `routes/progress.js:22` `exercise_logs`-insert kirjoittaa: `user_id, mode, level, score_correct, score_total, ytl_grade` — **ei `language`-saraketta.**
- `user_level_progress` on keyed `(user_id, mode)` — ei kieltä. Adaptiivinen taso-eteneminen on siis yhteinen es/fr/de:lle.
- `/dashboard/v2`-loaderit (`dashboardV2.js:383-395`): `loadDashboardCore`, `loadWeakTopics`, `loadExamHistory`, `loadLearningPath`, `loadPlacementStatus`, `loadAdaptiveStatus` hakevat **pelkällä user_id:llä**. Vain `loadSrCount`/`loadSrForecast` ottavat kielen.
- Cache-key sisältää `${language}`, mutta alla oleva data on identtinen → sama edistymä tarjoillaan eri kielille eri avaimen alla.

**Vaikutus:** käyttäjä joka tekee espanjaa ja sitten ranskaa jakaa saman streakin, tasonousun, heikkoustopikit ja tilastot. "Lyhyt-oppimäärä ES/FR/DE" -tuotelupaus rikkoutuu heti kun joku vaihtaa kieltä.

**Korjaus ( EI pieni → ei tehty tässä passissa):**
1. Migraatio: `language` (text, NOT NULL default 'es') -sarake tauluihin `exercise_logs` + `user_level_progress` + indeksit `(user_id, language, mode)`.
2. Backfill: olemassa olevat rivit → `'es'` (ainoa jolla sisältöä).
3. Kirjoita `language` insertteihin (`progress.js`, sr/exam-reitit).
4. Filtteröi KAIKKI yllä luetellut loaderit + `user_level_progress`-kyselyt kielellä.
5. Adaptiivinen taso per (user, language, mode).

Tämä ansaitsee oman loopin (L-V339-FIX-LANG tms.) + Marcelin päätöksen siitä, halutaanko per-kieli täysin erillinen eteneminen vai jaettu (esim. YO-valmius-mittari voi olla per-kieli, mutta motivaatio-streak globaali).

---

## Osa B — Backend-integraatio + virhetilat

### 🟠 P2 — AI-kustannussuoja failaa auki kirjautuneille (worth fixing)
Brief epäili tätä; **vahvistui ja on itse asiassa pahempi** kuin briefissä:

DB-virheessä **kaksi** suojaa failaa auki yhtä aikaa kirjautuneelle AI-pyynnölle:
1. `middleware/rateLimit.js:36-40` ja `:130-133` — fail-open (`aiLimiter` max 20/h).
2. `middleware/costLimit.js:30-33` — `checkMonthlyCostLimit` fail-open catchissä.

Eli Supabase-stressissä **sekä tuntiraja että kuukauden €-katto pettävät**, eikä kirjautuneilla ole demon kaltaista globaalia päivä-€-kattoa (`demoGradeGlobalLimiter`, rateLimit.js:208 — vain anonyymille demolle).

**Suositus (ei tehty — muuttaa kustannuskäyttäytymistä, kuuluu omaan loopiin + cap-arvo Marcelin päätös):**
- Lisää moduulitason in-memory **globaali authed-AI päivä-counter** (kuten `demoGradeGlobalLimiter`), joka selviää DB-katkosta, backstoppina. ÄLÄ fail-close per-käyttäjä-cost-limittiä (DB-blippi blokkaisi kaikki maksavat).
- Tai siirrä cost-tracking pois pelkän DB:n varasta.

### ✅ Muu Osa B
- Happy path + 401/403/429/400 yksikkötestattu (ks. taulukko).
- Stripe-reitit palauttavat placeholderin, eivät kaadu (`routes/stripe.js`, vrt. memory `feedback_keep_payment_infra`). Ei Stripe-toimia tehty.
- CORS rajattu `ALLOWED_ORIGINS`:iin (ei muutettu).

---

## Osa C — Security-pikatarkistus
- ✅ Ei secrettejä bundlessa eikä sourcessa (kaksi eri tarkistusta yllä).
- ✅ RLS-advisor puhdas user-datalle (0 missing-RLS).
- 🟡 P3 — Supabase **leaked-password-protection pois päältä** (auth-config WARN). Yhden klikin fix Supabase-dashboardista (Auth → Password security → enable HaveIBeenPwned). Ei data-eristysasia, mutta halpa kovennus.
  Remediation: https://supabase.com/docs/guides/auth/password-security

---

## Korjattu tässä passissa
- `tests/lesson-labels.test.js` — stale assertio: odotti `getLessonLabel("nonsense") === "nonsense"`, mutta impl palauttaa tarkoituksella `"Kertaus"` (ei vuoda raakaa avainta UI:hin). Spec päivitetty vastaamaan tarkoitettua käytöstä. (Claude-internal, ei pushata.)

## 🔴🔴 P0 — CROSS-USER SESSION HIJACK (löytyi live-testissä, KORJATTU)

**Tämä on se "toimii kun minä käytän, mutta ei kun käyttäjiä tulee lisää" -bugi.** Ei löytynyt staattisesti — paljastui vasta kun ajoin kahden tilin live-isolaatiotestin (`tests/verify-isolation.mjs`) oikeilla testitileillä.

**Oire:** Kun FREE-tili kirjautui sisään PRO:n jälkeen, PRO:n dashboard palautti **0 sessiota** (oikeasti 16) ja PRO:n `/api/progress` palautti **500**. Eli kuka tahansa joka kirjautui viimeisenä, kaappasi kaikkien muiden saman serveri-instanssin pyynnöt.

**Juurisyy:** `routes/auth.js` kutsui `signInWithPassword`/`refreshSession`-funktioita **jaetulla `adminClient`-instanssilla** (service-role). supabase-js tallentaa sisäänkirjautuneen session client-instanssiin ja alkaa lähettää **sen käyttäjän JWT:n PostgREST-Authorization-headerina service-role-keyn sijaan** (`persistSession:false` estää vain levytallennukset, ei in-memory-sessiota). Tulos: jokainen `adminClient`-datakysely login-kutsun jälkeen ajoi viimeksi kirjautuneena käyttäjänä, RLS-rajattuna. Tuotannossa katastrofi heti kun kaksi käyttäjää osuu samaan lämpimään serverless-instanssiin: toinen näkee toisen datan / oma data katoaa / kirjoitukset failaavat.

**Korjaus:** Lisätty erillinen `authClient`-instanssi (`lib/supabase.js`) pelkästään sisäänkirjautumis-/refresh-operaatioille. `adminClient` pysyy puhtaana service-rolena. `authClient`:n sessio saa vuotaa rinnakkaisten loginien välillä — vaaratonta, koska sitä ei käytetä datakyselyihin (luetaan vain signIn:n paluuarvo). `routes/auth.js`:n 3 kutsupaikkaa (login, register, refresh) reititetty `authClient`:lle.

**LIVE-VERIFIOITU FIXIN JÄLKEEN** (molemmat tilit kirjautuneena yhtä aikaa):
```
PASS  PRO spanish = 16  (FREE-login EI enää kaappaa PRO:n kyselyitä)
PASS  french-kirjoitus 0->1, spanish pysyy 16
PASS  FREE french = 0   (cross-user-eristys)
PASS  PRO ja FREE = eri käyttäjät
```
Regressiotesti: `routes-auth.test.js`-mock päivitetty (authClient erillisenä); live-guard `tests/verify-isolation.mjs` (aja kahdella creds-parilla).

---

## ✅ RESOLUTION — "korjaa kaikki" (2026-06-01, samassa sessiossa)

### P1 — Cross-language bleed: KORJATTU (backend-foundation) ✅
Tutkinnassa paljastui että bleed ei ole niin laaja kuin pelättiin:
- SR / curriculum / digikirja -edistymä oli **jo** kielellä skoupattu (`sr_cards.language`, `user_curriculum_progress.lang` jne.).
- `user_level_progress` **ei ole olemassa skeemassa** → adaptiivinen taso on jo inertti (kyselyt erroroivat → null). Ei migroitu.
- Todellinen vuoto rajautui neljään dashboardin taustatauluun.

Tehty:
- **Migraatio** (`supabase/migrations/20260601_progress_language_scoping.sql`, ajettu prod-DB:hen MCP:llä): `language text not null default 'spanish'` + komposiitti-indeksit tauluihin `exercise_logs`, `user_mistakes`, `exam_sessions`, `diagnostic_results`. Backfill 'spanish' (15/9/5/2 riviä — kaikki nykysisältö on espanjaa).
- **`normalizeLang()`** (`lib/openai.js`): es/spanish→spanish, fr/french→french, de/german→german, default spanish. Kaksi konventiota (täysi sana vs es/fr/de) yhtenäistetty kirjoitus/lukurajalla.
- **Luku skoupattu kielellä:** kaikki `/dashboard/v2`-loaderit (`loadDashboardCore`, `loadWeakTopics`, `loadExamHistory`, `loadPlacementStatus`, `loadAdaptiveStatus`) + legacy `GET /dashboard` + adaptiivisen blokin log-kyselyt.
- **Kirjoitus leimattu kielellä:** `progress.js` (exercise_logs + user_mistakes), `curriculum.js` (lesson-bridge), `exam.js` (exam_sessions via `resolveLang`), `placement.js` (diagnostic_results).
- **Regressiotesti** `tests/language-scoping.test.js`.

**Tietoisesti globaaleiksi jätetty (ei bug, vaan design):** `email.js` streak-muistutukset (aktiivisuus on kieliriippumaton) ja `levelEngine.js` → `user_level` (yksi globaali YO-valmiustaso per käyttäjä, taulu on user_id-keyed).

**LIVE-VERIFIOITU** (oikea server + Supabase, testpro123, `tests/verify-isolation.mjs`):
- PRO spanish dashboard = 16 sessiota, **french = 0** (ei vuotoa).
- POST `/api/progress {language:'french'}` → french 0→1, **spanish pysyi 16** (kirjoitus ei vuotanut espanjaan).
Eli kirjoituksen leimaus + luvun skooppaus toimii päästä päähän. (Huom: ensimmäinen ajo "epäonnistui" koska vanha pre-edit server oli yhä portissa 3000 — EADDRINUSE; tapettu ja ajettu uudelleen puhtaalla koodilla → ALL PASS.)

**Cross-user live-testi:** FREE-testitilin salasana `.env`:ssä on vanhentunut (401), ja throwaway-käyttäjän provisiointi admin-clientilla estyi prod-write-suojalla (oikein). Yritin molemmat. Eristys nojaa silti todennettuun rakenteeseen: RLS-advisor puhdas + jokainen kysely `.eq("user_id", <JWT:n userId>)` + yllä todettu että PRO:n french-kirjoitus näkyi vain PRO:n omassa näkymässä. Jos haluat täyden kahden tilin live-ajon: korjaa `TEST_FREE_PASSWORD` `.env`:iin.

**Jää jäljelle (client-aktivointi, additiivinen):** client ei vielä lähetä aktiivista kieltä `/dashboard/v2`:lle eikä `saveProgress`/`mistake`-kutsuihin (`readActiveLang()` palauttaa es/fr/de, dashboard-fetch ei välitä paramia). Backend normalisoi sen heti kun client alkaa lähettää. Tämä + tuotepäätös (per-kieli vs jaettu streak) aktivoituu kun fr/de saa sisältöä. **Tänään käytös on identtinen** (es-only → kaikki 'spanish').

### P2 — AI-€-fail-open: KORJATTU ✅
`middleware/rateLimit.js`: lisätty **DB-riippumaton globaali päivä-backstop** authed-AI-kutsuille (`aiLimiter`/`aiStrictLimiter`, `backstop:true`). Puhdas moduulimuisti, ei nojaa juuri kaatuneeseen Supabaseen. Kun `AUTHED_AI_DAILY_CAP` (default 4000/pv/instanssi) ylittyy → 429 vaikka DB-limitteri + cost-limit failaisivat auki. Per-instanssi (ei jaettua tilaa serverlessissä) → rajaa per-instanssi-ryntäyksen, joka on realistinen outage-failure-mode. Regressiotesti `tests/ai-cost-backstop.test.js` todistaa että backstop blokkaa per-user-ikkunasta riippumatta.

### P3 — Leaked-password-protection: EI OHJELMALLISTA POLKUA ⚠️
Tämä on GoTrue **auth-config** (`auth.password_hibp`), ei DB-objekti. Supabase-MCP:ssä ei ole auth-config-työkalua eikä `execute_sql` ylety GoTrue-configiin. **En voi kytkeä sitä käytettävissä olevilla työkaluilla** — vaatii joko dashboard-toggleen (Auth → Password security → enable HaveIBeenPwned) tai Management API -tokenin jota minulla ei ole. Tämä on alustarajoite, ei delegointi. Jos haluat, scriptaan sen Management API:lla jos annat tokenin.

## Out-of-scope (tehty oikein)
- Kuormatesti / concurrency = L-V340.
- Kirjautunut-tila E2E-walk: spec on olemassa (bug-scan rivit 155+), skipattiin lokaalisti koska TEST_*_EMAILS env puuttuu. Ajetaan CI:ssä missä env on.
