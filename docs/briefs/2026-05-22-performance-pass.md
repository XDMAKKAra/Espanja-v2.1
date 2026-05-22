# BRIEF: Performance-pass v282

**Päivä:** 2026-05-22
**Versio:** v282
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Edeltävät:** v280 dashboard-redesign + v281 lesson-rendering — molemmat mainissa
**Lähde:** Marcelin valitus: "ne eri jutut aukeaa esim oppimispolku kirjoitustehtävä yms. Siin kestä vitu kaua."
**Skill-stack:** FRONTEND (frontend-design, design-taste-frontend, ui-ux-pro-max, impeccable, emil-design-eng) + SUPABASE/BACKEND (supabase, supabase-postgres-best-practices) + TESTING (webapp-testing, superpowers:verification-before-completion). Kutsu Skill-toolia aidosti.

---

## Tavoite

Tehdä Aloitus → kortti-klikkaus → harjoitus-näyttö -polusta **tuntuva nopea**. Tällä hetkellä kestää 3-8s riippuen siitä mihin klikkaa. Tavoite: kortti-klikkauksesta seuraavaan näyttöön ≤ 1s warm cachella, ≤ 3s cold.

EI uudelleenkirjoitus — vain leikataan turhia sequential-fetchejä, lisätään pre-fetch hoverille, ja warm-cache jo nähdyille payloadeille.

---

## Konteksti — mittaa ENSIN

ÄLÄ ala optimoimaan ilman dataa. Mittaa baseline:

1. **DevTools Network -tab** Aloitus → Oppimispolku-kortti klikkaus → Course detail → Lesson:
   - Montako fetchiä, missä järjestyksessä (sequential vs parallel)
   - Mikä on pisin yksittäinen fetch
   - Kuinka kauan TTFB vs response-body
2. **Performance-tab profile** samasta polusta — missä main-threadissa kuluu aikaa
3. **Lighthouse-mobile** Aloituksesta: TTFB, LCP, TBT, CLS

Tallenna baseline `docs/briefs/v282-baseline/perf.md`:hen + screenshot Network-tabista.

Sitten katso missä isoimmat voitot ovat. Älä korjaa kuvitteellisia ongelmia.

---

## Todennäköiset pullonkaulat (testattava)

### 1. Sequential API-kutsut Aloituksen jälkeen

Kun käyttäjä klikkaa Oppimispolku-korttia:
- Frontend lataa `oppimispolkuIndex.js` -chunkin (~30-100ms ensimmäisellä kerralla)
- Sitten kutsu `/api/curriculum?lang=es` (~200-500ms cold)
- Käyttäjä klikkaa kurssia → `courseDetail.js` -chunk + `/api/curriculum/<key>` (~300-500ms)
- Käyttäjä klikkaa lessonia → `/api/curriculum/<key>/lesson/<n>` (~200-400ms)
- Yhteensä 3 sequential round-trippiä + 2-3 chunk-latausta

**Fix:**
- **Pre-fetch chunkit hoverilla** — kun käyttäjä hoveraa "Oppimispolku"-korttia, ala lataa `oppimispolkuIndex.js` taustalla
- **Pre-fetch API-payload hoverilla** — kun käyttäjä hoveraa kurssikorttia, fetch `/api/curriculum/<key>` taustalla
- **Promise.all** kaikissa paikoissa joissa peräkkäisiä riippumattomia fetchejä (etsi `await fetch...; await fetch...` -pattern)

### 2. `/api/dashboard/v2` lataa kaiken kerralla

Tämä on jo batched (`dashboardV2.js`-route palauttaa profile + dashboard + curriculum-stats yhdellä kutsulla). Hyvä. **ÄLÄ riko**.

Mutta: tarkista että se ei tee N+1 supabase-queryjä sisäisesti. Lue `routes/dashboardV2.js` ja varmista että käytetään batch-queryjä, ei loop-`from(...).select(...).single()` -patternia.

### 3. AI-kutsut (`/generate`, `/grammar-drill`, `/reading-task`)

Nämä kestävät 3-5s OpenAI:n päässä. **Et voi optimoida OpenAI:ta**. Mutta:

- **Pre-warm**: kun käyttäjä avaa kurssin (mutta ei vielä lessonia), pre-fetch _seuraavan_ lessonin payload taustalla. Käyttäjä klikkaa → vastaus on jo cachessa.
- **Bank-first**: tarkista että `routes/exercises.js` `tryBankExercise` -logiikka oikeasti yrittää banked-vastausta ensin (se kestää ~50ms vs AI:n 3000ms). Jos bank-osumat ovat <30% → suurempi banki tai parempi cache-key
- **Optimistic UI**: kun käyttäjä painaa "Aloita", näytä lesson-skeleton + ensimmäinen kysymys placeholderina ennen kuin AI palaa. Painostus poistuu.

### 4. Service Worker -pre-cache

`sw.js` jo cachettaa STATIC_ASSETS. Tarkista että:
- Kriittiset reitit cachetetaan (`/`, `/app.html`, `/index.html`, kriittiset CSS/JS)
- Cache-strategy on **stale-while-revalidate** kuville ja CSS:lle (heti vanha versio + päivitä taustalla)
- Cache-strategy on **network-first** HTML:lle (sisältö pitää olla tuore)

### 5. Bundle-koko

Jos `app.bundle.js` on > 500kb gzipattuna → optimoidaan. Tutki esbuild-configia. Tree-shake unused exports. Code-split sivutason chunkkeihin (jos ei jo).

---

## Toteutus (säädä baseline-mittauksen mukaan)

1. **Mittaa baseline** (osio yllä) → kirjaa numerot
2. **Implementoi 2-3 isointa voittoa** baseline-mittauksen perusteella, EI kaikki yllä luetellut
3. **Mittaa uudelleen** — vertaa baselineen
4. **Dokumentoi tulos** `docs/briefs/v282-results.md`:ssä: ennen/jälkeen-numerot per polku

**Älä optimoi kaikkea ohi 80/20-säännön.** Jos yksi muutos antaa 60% nopeusparannuksen, älä jatka kahteen muuhun joista kummastakin tulee 5%.

### Hover-prefetch -pattern

```js
// js/lib/prefetch.js — uusi util
const prefetched = new Set();
export function prefetchChunk(url) {
  if (prefetched.has(url)) return;
  prefetched.add(url);
  const link = document.createElement("link");
  link.rel = "modulepreload";
  link.href = url;
  document.head.appendChild(link);
}
export function prefetchData(url, headers = {}) {
  if (prefetched.has(url)) return;
  prefetched.add(url);
  fetch(url, { headers }).then(r => r.json()).then(data => {
    sessionStorage.setItem(`prefetch:${url}`, JSON.stringify({ ts: Date.now(), data }));
  }).catch(() => prefetched.delete(url));
}
```

Käyttöpaikkoja:
- Home.js: tracks-kortit hover → `prefetchChunk("/chunks/app-oppimispolkuIndex-*.js")` + `prefetchData("/api/curriculum?lang=es")`
- OppimispolkuIndex.js: kurssikortit hover → prefetch course detail

Fetch-wrapperi (jos olemassa `js/api.js`) tarkistaa sessionStoragen ensin:
```js
const cached = sessionStorage.getItem(`prefetch:${url}`);
if (cached) {
  const { ts, data } = JSON.parse(cached);
  if (Date.now() - ts < 30_000) {
    sessionStorage.removeItem(`prefetch:${url}`);
    return data;
  }
}
// ... fall through to real fetch
```

---

## Verifiointi

1. **Lighthouse-mobile** ennen + jälkeen — TTFB, LCP, TBT, SI
2. **Network-tab** screenshot ennen + jälkeen — määrä + sekvenssi
3. **Käytännön mittaus stoperilla**: kirjaudu testpro123, klikkaa Aloituksen Oppimispolku-kortti → aja stopperia kunnes course list näkyy. Toista 3 kertaa, ota mediaani. Sama ennen + jälkeen
4. **Playwright perf-spec** `tests/e2e/perf-budget.spec.js`:
   - Aloitus → Oppimispolku navigaatio < 2s (warm)
   - Lesson auki < 5s (cold AI)
5. **`npm run build`** + **`npm test`** PASS
6. **Bumppaa `sw.js` CACHE_VERSION** jos sw-strategia muuttuu

---

## Commit + PR

- **3-5 commitia:**
  - `perf(prefetch): hover-prefetch chunks + data (v282)`
  - `perf(api): parallelize sequential fetches`
  - `perf(sw): stale-while-revalidate for CSS/images` (jos teet)
  - `perf(ai): bank-first verification + pre-warm next lesson` (jos teet)
  - `docs(perf): baseline + after measurements`
- Otsikko: `perf: prefetch + parallelization v282`
- IMPROVEMENTS.md: `v282 — perf: hover-prefetch + Promise.all-batching → Aloitus→lesson <Xs (oli Ys)`

**Ei pushia ilman lupaa.**

---

## Don't

- ÄLÄ optimoi ilman baseline-mittausta — riski on tehdä 2h työtä joka ei vaikuta mihinkään
- ÄLÄ poista `tryBankExercise` -kierrätystä — se on jo cost-säästö (banked exercises ~50ms vs AI ~3000ms)
- ÄLÄ riko service-workerin offline-tukea
- ÄLÄ pre-fetchae KAIKKEA — pre-fetch only on hover-intent (>200ms hover-aika ennen lähtöä, tai kun nappi tulee focus-tilaan)
- ÄLÄ pre-fetchaa lesson-AI:ta automaattisesti — token-kulu räjähtää
- ÄLÄ syytä Verceliä — cold start on totta mutta optimoitavissa
- ÄLÄ tee Vercel-promotea — perf-muutokset voivat ottaa askeleen taaksepäin, varmista local-mittauksilla ensin

## Onnistuminen

- [ ] Baseline-mittaus tehty + dokumentoitu
- [ ] 2-3 isointa voittoa implementoitu
- [ ] After-mittaus, vähintään 40% nopeusparannus Aloitus→lesson-polulla
- [ ] Tulokset dokumentoitu `v282-results.md`
- [ ] Bank-first verifioitu toimivaksi (tai dokumentoitu osumaprosentti)
- [ ] Playwright perf-spec PASS
- [ ] `npm run build` + `npm test` PASS
- [ ] sw.js CACHE_VERSION bumpattu jos sw muuttui
- [ ] PR avattu, EI mergattu — Marcel tarkistaa numerot
