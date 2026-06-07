# L-V340 — Kuormatestiraportti (lokaali, per-instanssi)

**Päivä:** 2026-06-01
**Ajettu:** `node scripts/load-test.mjs` (autocannon 8.0.0), lokaali `server.js`, `NODE_ENV=production`, `LOAD_TEST=1`.
**Kohde:** `http://127.0.0.1:3010` — pelkkä lokaali Node-prosessi. EI tuotantoa, EI Vercel-previewta.
**Per-step:** 10 s / concurrency-taso. Ramppi: **10 → 50 → 100 → 200** yhtäaikaista yhteyttä.

> **Brief-ristiriita huomattu:** acceptance-kohta #1 sanoi `100→250→500→1000`, mutta briefin runko + Marcelin selvennys (realistinen huippu ~10–50, 200 = 4–20× reservi) sanoi `10→50→100→200`. Ajettiin runko-version mukaan. 500/1000 mittaisi vain lokaalin Node-prosessin kattoa, mikä on Vercel-autoskaalauksen takia akateeminen.

---

## Turvallisuus — mitään ei osunut ulos

Kaikki Supabase-clientit (`adminClient` / `authClient` / `createUserClient`) korvataan muistinvaraisella fakella kun `LOAD_TEST=1` (`lib/load-test-stubs.js`). Tämä on yksi chokepoint: mikään reitti ei voi osua tuotanto-Supabaseen riippumatta siitä mihin endpointtiin liikenne menee.

- **0 prod-Supabase-kirjoitusta / -lukua** koko ajossa (clientit ovat fake).
- **Bulk-ramppi (A–E):** `callOpenAI` stubattu deterministiseksi, **0 verkkokutsua OpenAI:hin**.
- **Oikea AI-burst (F):** 30 oikeaa `/grade-writing`-kutsua gpt-4o-miniin. **Yhteiskustannus €0.01787** (≈ €0.0006/kutsu), kova budjettikatto €0.10 ei lähellekään täyttynyt. Jokainen kutsu logattu kumulatiivisella summalla; laskuri abortoi ennen €0.10:tä jos olisi lähestynyt.

Acceptance #2 ✅: OpenAI-kustannus €0.018 ≤ €0.10, 0 prod-kirjoitusta.

---

## Reittiprofiilit

- **cheap** = `GET /health` — ei DB:tä, ei authia. Puhdas sovellus-/event-loop-kapasiteetti.
- **ai** = `POST /api/grade-writing` — koko autentikoitu AI-middleware-ketju (`requireAuth → aiStrictLimiter → checkMonthlyCostLimit → checkFeatureAccess → callOpenAI`). AI stubattu: mittaa reitin + middlewaren, ei OpenAI-nopeutta.

---

## Tulokset

### A — rate limiterit PÄÄLLÄ, terve (stub) DB

| Profiili | conn | req/s | p50 | p90 | p99 | virhe-% |
|---|---:|---:|---:|---:|---:|---:|
| cheap | 10  | 9 724 | 1 ms | 1 ms | 1 ms | 0 % |
| cheap | 50  | 9 653 | 5 ms | 6 ms | 7 ms | 0 % |
| cheap | 100 | 9 870 | 10 ms | 11 ms | 12 ms | 0 % |
| cheap | 200 | 9 555 | 21 ms | 23 ms | 24 ms | 0 % |
| ai    | 10  | 6 304 | 1 ms | 1 ms | 2 ms | 0 % |
| ai    | 50  | 6 679 | 7 ms | 8 ms | 9 ms | 0 % |
| ai    | 100 | 6 196 | 16 ms | 18 ms | 19 ms | 0 % |
| ai    | 200 | 6 214 | 31 ms | 37 ms | 40 ms | 0 % |

### B — rate limiterit LÖYSÄTTY (`LOAD_TEST_RL_OFF=1`)

| Profiili | conn | req/s | p50 | p90 | p99 | virhe-% |
|---|---:|---:|---:|---:|---:|---:|
| cheap | 10  | 9 733 | 1 ms | 1 ms | 1 ms | 0 % |
| cheap | 50  | 9 904 | 5 ms | 6 ms | 6 ms | 0 % |
| cheap | 100 | 9 794 | 10 ms | 11 ms | 12 ms | 0 % |
| cheap | 200 | 9 702 | 20 ms | 23 ms | 24 ms | 0 % |
| ai    | 10  | 6 532 | 1 ms | 1 ms | 2 ms | 0 % |
| ai    | 50  | 6 547 | 7 ms | 8 ms | 9 ms | 0 % |
| ai    | 100 | 6 495 | 15 ms | 18 ms | 20 ms | 0 % |
| ai    | 200 | 6 456 | 30 ms | 33 ms | 36 ms | 0 % |

**A vs B:** käytännössä identtiset. Kun rate-limit-DB on nopea, limitterin *logiikka* ei ole pullonkaula — ero on mittausvirheen sisällä. Tämä muuttuu täysin kun DB on hidas (ks. D).

### C — fail-open: rate-limit-DB virheilee kuorman alla (limiterit päällä)

| Profiili | conn | req/s | p50 | p99 | 2xx | non2xx | virhe-% |
|---|---:|---:|---:|---:|---:|---:|---:|
| ai | 50  | 5 115 | 9 ms | 13 ms | 51 153 | 0 | 0 % |
| ai | 200 | 4 958 | 40 ms | 44 ms | 49 573 | 0 | 0 % |

`rateLimit.js:37` failaa auki: kun `rate_limit_buckets`-luku palauttaa virheen, **100 % pyynnöistä päästetään läpi**. Throughput hieman matalampi vain koska jokainen pyyntö logittaa `console.error("Rate limit DB error")`. Kustannussuojaa ei jää limitteriltä tässä tilassa.

### D — hidas DB: +50 ms per rate-limit-round-trip (limiterit päällä)

| Profiili | conn | req/s | p50 | p99 | virhe-% |
|---|---:|---:|---:|---:|---:|
| ai | 50  | **45**  | 1 006 ms | 1 067 ms | 0 % |
| ai | 200 | **180** | 1 073 ms | 1 171 ms | 0 % |

**Tämä on ensimmäinen ja ainoa todellinen pullonkaula.** Kun DB-round-tripit ovat hitaita, ai-reitin throughput romahtaa ~6 400 → 45–180 req/s (≈ 35–140×) ja p50 nousee yli sekunnin. Authentikoitu AI-reitti tekee useita peräkkäisiä DB-round-trippejä per pyyntö (`getUser` + `isPro`/`getUserById` + `user_profile` + `free_usage` + cost-check + rate-limit select/upsert), ja jokainen +50 ms latenssi summautuu.

### E — in-memory-backstop (`AUTHED_AI_DAILY_CAP=500`)

| Profiili | conn | req/s | 2xx | non2xx (429) | virhe-% |
|---|---:|---:|---:|---:|---:|
| ai | 100 | 8 192 | **500** | 81 420 | 99.39 % |

Backstop osui tarkalleen 500:aan ja floodasi loput 429:llä. **Tämä in-memory-laskuri (`rateLimit.js:122`) on ainoa portti joka oikeasti rajaa keskittyneen burstin.**

### F — OIKEA OpenAI-burst, budjettikatto

| Profiili | conn | kutsut | req/s | p50 | p99 | 2xx | virhe | €-yhteensä |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| ai (real) | 10 | 30 | 0.67 | 11 984 ms | 17 506 ms | 30 | 0 | **€0.01787** |

Oikea OpenAI-reitti, vastauksen parsinta, JSON-repair, usage-laskenta ja kustannusseuranta toimivat tuotanto-OpenAI:ta vasten. p50 ~12 s on gpt-4o-minin oma latenssi 10 rinnakkaisella pyynnöllä — ei sovelluksen pullonkaula. 0 virhettä.

---

## Löydökset

1. **Kova löydös — Supabase-rate-limiter ei laske keskittynyttä burstia.** Skenaariossa A ai-profiili ajoi **62 137 pyyntöä yhdeltä käyttäjältä** (`aiStrictLimiter` max=10/h), ja **0 estettiin**. Syy: `rateLimit.js:54` upsertaa `{count:1}` `onConflict:"key,window_start"` → konfliktissa `count` *ylikirjoittuu* arvoon 1, ei inkrementoidu. Sama minuutti-bucket pysyy aina 1:ssä, joten saman minuutin sisällä tuleva burst ei koskaan saavuta `max`-rajaa. `increment_rate_limit`-RPC:tä jota `rateLimit.js:52` kutsuu **ei ole olemassa** (ei migraatioissa) ja se kutsutaan ilman argumentteja → kuollut koodi. **Supabase-rate-limit on käytännössä tehoton burst-suojana tuotannossa.**

2. **Fail-open + tehoton counting = kirjautuneella AI:lla ei ole DB-pohjaista €-kattoa.** C-skenaario vahvistaa fail-openin (100 % läpi DB-virheessä). Yhdessä löydöksen #1 kanssa: kun Supabase on hidas/alhaalla *tai* burst tulee saman minuutin sisällä, ainoa este on in-memory `AUTHED_AI_DAILY_CAP` (E-skenaario).

3. **Ensimmäinen kapasiteettipullonkaula = DB-round-trip-latenssi, ei CPU/event-loop.** A/B/E pyörivät 6 000–9 900 req/s siististi 200 conn:iin asti p99 < 40 ms. Vasta kun DB hidastuu (D), throughput romahtaa ~150×. Sovelluksen oma katto on kaukana realistisesta huipusta; Supabase-latenssi on se mikä rajoittaa ensin.

---

## Suositus

- **Realistinen huippu (~10–50 yhtäaikaista) menee reilusti läpi.** Ai-reitti pyörii 50 conn:lla 6 500+ req/s, p99 9 ms; cheap-reitti 9 900 req/s, p99 6 ms. Ei lähelläkään rasitusta.
- **Reserviä 200 conn:iin asti riittää:** p99 pysyy ai-reitillä alle 40 ms ja cheap-reitillä alle 24 ms, virhe-% 0. Eli ~4–20× realistinen huippu menee siististi.
- **Mikä rajoittaa ensin:** Supabase-DB-latenssi/contention, ei Node-prosessi. Jos Supabase hidastuu 50 ms/kysely, ai-reitti putoaa ~50–180 req/s:aan. Optimoinnin painopiste = vähennä per-pyyntö DB-round-trippien määrää AI-reitillä (esim. cachee isPro/tier, yhdistä user_profile-luvut) ja varmista että Supabase ei ole pullonkaula huipussa.
- **Toimenpide-ehdotus (ei tämän briefin scope):** korjaa rate-limit-counting (`increment_rate_limit`-RPC oikealla `ON CONFLICT DO UPDATE SET count = count + 1` -semantiikalla tai atominen `rpc`), jotta kustannussuoja ei nojaa pelkkään in-memory-backstopiin.

---

## ⚠️ Caveat — mittakaava

Tämä on **per-instanssi / sovellustaso** -mittaus yhdellä lokaalilla Node-prosessilla. Se **EI** mittaa Vercel-serverless-autoskaalausta. Tuotannossa Vercel ajaa useita lambda-instansseja rinnakkain, joten:
- in-memory-backstop (`AUTHED_AI_DAILY_CAP`) ja in-memory-rate-limit ovat **per-instanssi** — globaali katto on `instanssien_määrä × cap`, ei `cap`.
- todellinen tuotantokapasiteetti riippuu Vercel-konffista ja Supabase-yhteyspoolista, ei tästä luvusta.
- DB on jaettu kaikkien instanssien kesken → D-skenaarion latenssipullonkaula on tuotannossa *pahempi*, ei lievempi, kun monta instanssia hakkaa samaa Supabasea.

Vercel-autoskaalauksen mittaus vaatisi koordinoidun maksullisen testin tuotanto-/preview-ympäristöä vasten (out-of-scope, riski + kustannus).

---

## Toisto

```bash
npm run loadtest          # täysi ajo (~6-7 min, sis. €0.018 oikea AI-burst)
npm run loadtest:quick    # nopea savutesti (tasot 10,100; 5s; ei vaadi OpenAI-avainta)
```

Tulokset: `scripts/load-test-results.json`. Palvelinlogi: `scripts/load-test-server.log`.
Kytkimet: `DURATION`, `PORT`, `STEP_COOLDOWN_MS`, `SCENARIO_COOLDOWN_MS`, `LOAD_TEST_AI_BUDGET_EUR`, `DISABLE_REQUEST_MEMO`.

---

# Korjaukset (2026-06-01, samana päivänä)

Kaikki kolme löydöstä korjattu ja todennettu. 1312/1312 vitest-testiä menee läpi muutosten jälkeen.

## #1 — Rate-limit-counting korjattu (atomic increment RPC)

- **Migraatio** `supabase/migrations/20260601_rate_limit_atomic_increment.sql`, ajettu prodiin MCP:llä (`increment_rate_limit(text, bigint)`, `SET search_path=''`, EXECUTE vain `service_role`).
- `middleware/rateLimit.js` `supabaseRateLimit` kirjoitettu uusiksi: yksi atominen RPC-round-trip joka inkrementoi minuutti-bucketin ja palauttaa sliding-window-summan. Vanha read+upsert (joka ylikirjoitti `count`→1) poistettu.
- **Todennus DB:ssä:** 12 peräkkäistä kutsua palauttaa 1,2,…,12 (ennen olisi pysynyt ~1). Kuormatestissä A-skenaarion ai-profiili: **2xx=0, non2xx=100 %** — per-käyttäjä-limitteri (max=10/h) estää nyt burstin. Ennen korjausta sama ajo päästi 62 137/62 137 läpi.
- Advisor `function_search_path_mutable` korjattu (`SET search_path=''`).

## #3 — DB-round-tripit vähennetty (per-request memoisointi)

- `lib/requestContext.js`: AsyncLocalStorage-pohjainen per-pyyntö-memo. `isPro()` ja `getUserTier()` (`middleware/auth.js`) memoisoitu → isPro laskettiin ennen 2× per AI-pyyntö, nyt 1×; jaettu `user_profile`-luku deduplikoituu.
- Kytketty molempiin entry-pointteihin (`server.js`, `api/index.js`) middlewareksi ennen reittejä. **Nollastaleness:** memo elää vain yhden pyynnön ajan, joten Pro-päivitys näkyy heti seuraavalla pyynnöllä. Inertti testeissä (testien oma app ei aja middlewarea).
- **Todennus (memo on/off A/B, conn=1, +50 ms/round-trip DB):** p50 **864 ms → 657 ms** = **207 ms** säästö ≈ **~4 DB-round-trippiä vähemmän per pyyntö** (~24 % nopeampi hitaalla DB:llä). Tämä lieventää suoraan #-löydöksen pullonkaulaa.

## #2 — Fail-open: tietoinen valinta, backstop kattaa

- Fail-open säilytetään: Supabase-blippi ei saa lukita käyttäjiä ulos (auth-reittien fail-closed lukitsisi kaikki). 
- Kustannuspuoli on jo katettu: `AUTHED_AI_DAILY_CAP`-backstop (`rateLimit.js`) ajetaan **ennen** DB-kyselyä, joten se rajaa AI-kulun per-instanssi myös DB:n ollessa alhaalla (C-skenaario: fail-open päästää läpi, mutta backstop bittaa kun cap täyttyy — E-skenaario). Korjauksen #1 myötä terve polku laskee nyt oikein. Ei koodimuutosta tässä, by design.

## Caveat korjausten todennukseen

A/B-skenaarioiden raaka-kapasiteettiluvut tämän re-runin osalta ovat osin pilalla Windowsin ephemeral-port-exhaustionista (peräkkäiset täydet ajot samassa sessiossa täyttivät TIME_WAIT-poolin). Yllä olevat kapasiteettitaulukot ovat ENSIMMÄISESTÄ puhtaasta ajosta (ennen korjauksia) — palvelinkapasiteetti ei muutu korjauksista (cheap-reitti ei koske limitteriin; ai-reitti on memon ansiosta hieman nopeampi). Korjausten todennus nojaa: (a) DB-tason RPC-testiin, (b) A-skenaarion 100 % block -tulokseen, (c) matalan churnin memo-A/B-benchmarkkiin — ei port-herkkiin kapasiteettilukuihin.

> **Windows-huom:** stepit on tahdistettu cooldownilla (`STEP_COOLDOWN_MS`/`SCENARIO_COOLDOWN_MS`), koska peräkkäiset autocannon-ajot ilman taukoa tyhjentävät Windowsin ephemeral-port-poolin (TIME_WAIT ~120 s) → seuraava step näyttää connection-erroreita vaikka palvelin on terve.
