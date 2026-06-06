# L-V393 — Perf baseline (Vaihe 1, mitattu)

**Mittauspäivä:** 2026-06-06
**Tili:** testpro123@gmail.com (Pro, olemassa oleva data)
**Ympäristö:** localhost dev (`node --watch server.js`) → etä-Supabase. Chromium headless, service worker estetty (eristää JS-cachen HTTP/SW-cachesta).
**Harness:** `scripts/perf/measure-v393.py` + `scripts/perf/measure-login-warmup.py`. Raakadata: `docs/briefs/L-V393-PERF-RAW.json`.
**Metriikka:** aika kun `location.hash` asetetaan → kaikki `/api/`-kutsut asettuneet (network-quiesce). Per kutsu: TTFB + total. Jokainen screen avattu kahdesti peräkkäin → API-kutsujen määrä 2. avauksella paljastaa cache vs re-fetch.

---

## 🛑 Headline: briefin lukittu diagnoosi on osin väärä

Brief sanoo: *"navigaatio on pullonkaula, jokainen screen-avaus hakee datan uudelleen joka kerta, caching on THE lääke."* **Mittaus kumoaa tämän pääväitteen.** Koodissa on jo **viisi client-cachea** ja prefetch + stale-while-revalidate. Todelliset luvut:

1. **Navigaatio ei ole hidas.** Jokainen screen renderöi rungon 3–8 ms:ssä. 3/5 screenistä palauttaa **0 API-kutsua 2. avauksella** = cache toimii jo.
2. **Todellinen hitaus on LOGIN-ketju, ei navigaatio.** Lämmin login→aloitusruutu = **1,36 s**, kylmä (cold start) **2,2–3,5 s**. Tämä on ainoa monen sekunnin odotus, ja se osuu heti kirjautumisen jälkeen — juuri se minkä Marcel kokee hitautena.
3. **Vain 2 screeniä re-fetchaa joka avauksella:** profiili (3 kutsua) ja digikirja (2 kutsua). Nämä kannattaa cachettaa, mutta ne ovat halpoja korjauksia, eivät "THE ongelma".
4. **Muistivuotoa ei ole.** Heap pysyi 3,27–3,40 MB:ssä yli 24 navigaatiosyklin. Briefin toive #4 (muistivuoto) on perusteeton → pudota.
5. **CSS-bundle 420 KB** on suurin yksittäinen asset (isompi kuin kaikki JS yhteensä) = first-paint-paino.

---

## Screen-taulukko (mittaus)

| Screen | 1. avaus | 2. avaus | Re-fetch? | Pullonkaula | Lääke |
|---|---|---|---|---|---|
| **Aloitus (home)** | 0 kutsua, 4 ms | 0 kutsua, 4 ms | **EI** | Jo cachessa (SWR + 60 s muisti + localStorage-peili) | Ei tarvetta |
| **Tehtävät (oppimispolku-index)** | 1× `/api/curriculum` (369 ms), runko 5 ms | 0 kutsua, 4 ms | **EI (cache)** | 1. haku, sitten 60 s curriculumCache | Ei tarvetta |
| **Kurssidetalji** | 1× `/api/curriculum/kurssi_1` (275 ms), runko 4 ms | 0 kutsua, 8 ms | **EI (cache)** | Jakaa curriculumCachen indexin kanssa | Ei tarvetta |
| **Profiili** | 3× (`learning-path` 113 ms + `dashboard` 336 ms + `curriculum` 371 ms), runko 4 ms + spinner | 3× samat | **KYLLÄ** | Ohittaa olemassa olevat cachet (raaka `/api/profile`, `/api/curriculum`); näyttää full-screen-spinnerin ~370 ms | Reititä `getProfile()` (5 min) + `curriculumCache` + `getDashboardV2Section()` kautta; skeleton spinnerin tilalle |
| **Digikirja** | 2× (`progress` 117 ms + `itsearvio` 135 ms), runko 3 ms | 2× samat | **KYLLÄ** | Ei client-cachea progress/itsearviolle | Cachea progress + itsearvio per (kurssi, lesson) |

**Tärkeä nyanssi:** "runko-aika" (3–8 ms) = milloin screen tulee aktiiviseksi, ei milloin data on maalattu. Cachetuilla screeneillä runko == lopullinen. Hakevilla screeneillä (profiili, digikirja, login) oikea data-ready = runko + yllä oleva API-total, ja sen ajan näkyy **spinneri** (profiili) tai tyhjä progress. Nämä ovat skeleton-kohteet. Cachetut screenit eivät blokkaa maalaa fetchillä = SWR toimii jo niillä.

---

## Login-ketju (THE ongelma, mitattu erikseen)

Baseline-ajossa 1. login = 3470 ms koska se osui täysin kylmään palvelimeen. Erottelu kylmä vs lämmin (3 peräkkäistä loginia samaan sessioon):

| | login→aloitus wall | login POST total | login POST TTFB |
|---|---|---|---|
| Kylmä (1. pyyntö / cold start) | 2187 ms | 485 ms | 483 ms |
| Lämmin (vakaa) | 1359 ms | 163 ms | 162 ms |
| Lämmin (3.) | 1406 ms | 151 ms | 150 ms |

**Lämpimän loginin pullonkaula ei ole yksittäinen hidas kutsu** (login POST vain 150 ms vakaana). Se on **4 peräkkäistä awaittia** `auth.js`:ssä: `login` → `checkOnboarding` → `checkPlacement` → `loadDashboard(v2)`, plus `/api/config/public` (110 ms) + `/api/profile` (395 ms) + `/api/placement/status` (155 ms) sarjassa + render. Yhteensä ~1,36 s pelkkää peräkkäistä odotusta.

**Kylmä-lisä (~0,8–2 s) = palvelimen warmup.** Localhostissa se on ESM-moduulilataus + Supabase-clientin init 1. pyynnöllä. **Vercelissä sama = serverless cold start per idle-funktio** — tämä on todennäköisesti se satunnainen monen sekunnin piikki jonka Marcel näkee tuotannossa.

---

## Muisti & bundle

- **Muisti:** heap 3,27 MB → 3,36 MB yli 24 syklin (aloitus/oppimispolku/profiili churn), ei monotonista kasvua → **ei vuotoa**. Event-listener/timer-siivous riittävä. Pudota muistivuoto-työ.
- **Bundle:** `app.bundle.css` **420 KB** (suurin), `app.bundle.js` 112 KB, 55 chunkkia yht 402 KB. Suurin JS-chunk 97 KB (`app-chunk-5WA4I66H.js`), digikirja-chunk 57 KB. CSS:n 420 KB on first-paint-kohde (todennäköisesti Tailwind purge-jäämä + old-spain-cascade).

---

## Revisoitu Vaihe 2 -prioriteetti (mittaus edellä)

Briefin oma #0 ("screen-cache + instant-render = pääkorjaus") on **jo tehty** suurimmaksi osaksi. Uusi järjestys impaktin mukaan:

- **P0 — Login fast-path.** Rinnakkaista 4 peräkkäistä post-login-kutsua, tai taita `checkOnboarding` + `checkPlacement` lippuina dashboard-v2:n batchiin (joka jo niputtaa 8 sektiota). Maalaa aloitusruudun runko/skeleton heti kun token saapuu, hydratoi kun data tulee (optimistinen runko). Tavoite: runko näkyy <300 ms, data <800 ms lämpimänä. **Suurin yksittäinen voitto.**
- **P1 — Cold start (Vercel).** Suurin satunnaispiikki. Keep-warm tai per-funktio-initin keventäminen. Infra-luontoinen → voi olla oma loop; merkitään, ei pakko tähän.
- **P2 — Profiili + digikirja client-cache.** Reititä profiili olemassa olevien cachejen läpi (lopeta niiden ohitus), cachea digikirja progress/itsearvio. Pieni diff, poistaa ainoat aidot re-fetchit.
- **P3 — Skeletonit.** Login-odotus (nyt "Ladataan…" nappitekstinä) + profiili (full-screen spinner) + digikirja. Suurin osa screeneistä renderöi jo instant, joten skeleton näkyy vain aidolla kylmällä haulla.
- **P4 — CSS-bundle 420 KB.** Purge/cascade-tutkinta first-paintille.
- **PUDOTA:** muistivuoto-työ (ei vuotoa), iso "screen-cache-rebuild" (jo olemassa).

---

## Caveat (rehellisyys)

Tämä on localhost dev → etä-Supabase. Kaksi asiaa eroaa Vercel-tuotannossa ja **pahentaa juuri login-polkua**: (a) serverless cold start per kutsu/funktio, (b) login POST:n warmup. Per-screen-navigaatio on jo nopea molemmissa (cache + SWR). Jos halutaan tuotantoluvut, seuraava askel olisi mittaus Verceliä vasten (Vercel runtime logs + RUM), mutta diagnoosin suunta (login-ketju + cold start > navigaatio) on jo selvä.
