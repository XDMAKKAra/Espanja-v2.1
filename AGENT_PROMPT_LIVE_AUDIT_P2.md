# Agent Prompt — L-LIVE-AUDIT-P2
# Suorituskyky: CSS+JS-bundlaus, /api/dashboard/v2 batch-endpoint, profile-cache, vocab pre-gen, adaptive/status-optimointi, Google Fonts → self-host

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **suorituskyky-loop**, ei feature-loop. Iso scope: bundlaus, API-yhdistäminen, OpenAI-strategiaa. Käyttäjä on sanonut "monet sivut aukeaa hitaasti, tehtävät aukeaa hitaasti". Lähde-mittarit `AUDIT_LIVE_DASHBOARD.md`:ssä.

---

## Edellytys

- L-LIVE-AUDIT-P0 + L-LIVE-AUDIT-P1 shipattu kokonaisuudessaan. Verify: `grep '\[L-LIVE-AUDIT-P0\]\|\[L-LIVE-AUDIT-P1\]' IMPROVEMENTS.md` näyttää 5+8 riviä.
- Jos joko puuttuu, STOP.
- L-PLAN-7 + L-PLAN-8 + L-SECURITY-2 shipattu (=koko nykyinen aikaomakatkis on käytössä).

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, sourcing-säännöt. PAKOLLINEN.**
2. `AUDIT_LIVE_DASHBOARD.md` — koko tiedosto. Mittausdata + endpoint-kestot löytyvät täältä, ne ovat tämän loopin lähtötilanne.
3. `AGENT_STATE.md` — varmista L-LIVE-AUDIT-P0 + P1 shipattu.
4. `app.html` — `<head>`-osio + `<script>`-tagit, koko shellin lataus-flow
5. `package.json` — onko esbuild / vite / muu bundler jo käytössä? `scripts`-block kokonaan.
6. `vercel.json` — build-asetukset, headers, rewrites
7. `routes/dashboard.js` (tai missä `/api/dashboard`-endpoint on) — sen sisäiset SQL-kyselyt
8. `routes/exercises.js` — `/api/adaptive/status`-endpoint + vocab generate -logiikka
9. `lib/openai.js` — OpenAI-wrapper, mahdollinen olemassa oleva cache
10. `js/api.js` — frontend fetch-wrapperi, mahdollinen client-side cache
11. `js/main.js` — kuinka screenit ladataan + alustetaan
12. IMPROVEMENTS.md viimeiset 80 riviä

---

## Konteksti

Live-audit (`AUDIT_LIVE_DASHBOARD.md`) mittasi:

| Mittari | Nykyinen | Tavoite |
|---|---|---|
| Cold load `/app.html` | 1339 ms (DOM ready) + 3.7 s (kaikki API:t valmiina) | <2 s |
| CSS-pyynnöt | 18 erillistä | 1 bundle |
| JS-pyynnöt | 28 erillistä | 1 bundle (tai dynaaminen lazy) |
| Sanastoharjoituksen Q1 lataus | 4164 ms | <1500 ms |
| SR-arviointi → palaute | 3125 ms | <1500 ms |
| `adaptive/status` API | 1094 ms | <300 ms |
| `/api/profile` API | 902 ms | <200 ms (cache) |
| `/api/dashboard` API | 875 ms | <500 ms |

**Käyttäjän vahvistettu lopputavoite:**
> "Sivunavaus tuntuu välittömältä. Tehtäväsivu avautuu max. 1.5s klikkauksesta. Pro-maksava käyttäjä ei odota viiveitä joita ei tapahdu Duolingossa tai Babbelissa."

**Tämä on iso loop.** ÄLÄ yritä tehdä kaikkia 7 UPDATEa samassa istunnossa. Tee yksi UPDATE → deployaa → mittaa tuotannosta Lighthousella → vasta sitten seuraava. Suosittelen järjestystä:

1. UPDATE 1 (CSS-bundle) + UPDATE 2 (JS-bundle) yhdessä — sama build-step
2. Mittaa
3. UPDATE 4 (profile-cache) — pieni, helppo
4. UPDATE 3 (`/api/dashboard/v2`) — keskisuuri, pohjia muutoksia
5. Mittaa
6. UPDATE 5 (vocab pre-gen) + UPDATE 6 (adaptive/status-optimointi) — voit tehdä samassa istunnossa
7. Mittaa
8. UPDATE 7 (fontit lokaaliksi) viimeisenä

---

## Skills + design plugins käyttöön

**Aktivoi nämä, lue niiden SKILL.md ennen kunkin UPDATEn aloittamista** (STANDARDS-pohjan päälle):

- `puheo-screen-template` — performance-osio (jos olemassa) — varmista että UPDATE 5 (vocab pre-gen) ei riko empty/loading/error-state-pattern
- `puheo-ai-prompt` — UPDATE 5 + UPDATE 6 — kaikki OpenAI-kutsut, cost guards, JSON schema
- `ui-ux-pro-max` — performance-rules: lazy loading, defer / async, font-display: swap

Education-skillit:
- `education/cognitive-load-analyser` — UPDATE 5 — pre-gen ei saa ladata niin paljon että muistia / API-kustannuksia tuhlautuu yhden istunnon aikana
- `education/spaced-practice-scheduler` — UPDATE 5 — varmista että pre-genatut kysymykset noudattavat SR-rytmiä, ei tule satunnaisia easy-kysymyksiä peräkkäin

Design plugins:
- `design:accessibility-review` — KAIKKI UPDATEt joissa lisäät loading/skeleton-tilaa — varmista screen-reader-announcement
- `design:design-critique` — UPDATE 1+2 jälkeen — onko visuaalinen jitter pienentynyt cold loadissa? Playwright video-recording, ei pelkkä screenshot

**Ei 21st.dev-sourcingia tähän looppiin** — kaikki on infraa, ei uusia komponentteja. Poikkeus: jos UPDATE 5:n pre-gen-loading-tila tarvitsee uutta skeletonia, sourcaa siihen.

---

## UPDATE 1 — Bundlaa CSS yhdeksi tiedostoksi

**Nykytila:** `style.css` + `css/components/*.css` (17 erillistä) ladataan jokaisella cold loadilla. 18 HTTP-pyyntöä.

**Korjaus:** Lisää build-step joka yhdistää CSS:t.

Yksinkertaisin lähestymistapa: pelkkä `cat`-skripti `package.json`:in `build:css`-komentoon. Jos esbuild on jo käytössä, käytä sitä:

```json
{
  "scripts": {
    "build:css": "cat style.css css/components/*.css > public/app.bundle.css"
  }
}
```

**TAI** (parempi): käytä esbuildia, joka osaa minify + sourcemapit:

```json
{
  "scripts": {
    "build:css": "esbuild style.css --bundle --minify --outfile=public/app.bundle.css --loader:.css=css"
  }
}
```

Vercel ajaa `npm run build` deployin yhteydessä — yhdistä `build:css` siihen.

`app.html`:ssa: korvaa kaikki erilliset `<link>`-tagit yhdellä:

```html
<link rel="stylesheet" href="/app.bundle.css">
```

**HUOM cascade:** CSS-järjestys voi vaikuttaa cascadeen. `style.css` määrittelee perustasot, komponentit overrideavat. Säilytä järjestys (style.css ENSIN, sitten components alphabetisesti). Testaa että ulkoasu ei muutu.

**Älä:** poista alkuperäisiä CSS-tiedostoja repo:sta. Pidä lähde-tiedostot, vain bundle on `public/`-kansiossa.

**Verify:**
- DevTools → Network → vain yksi CSS-pyyntö (`/app.bundle.css`)
- Visuaaliset regressiot: aja `design:design-critique` dashboardille + harjoitussivulle ennen ja jälkeen
- Lighthouse: cold load -aika lyhenee 200-400ms

---

## UPDATE 2 — Bundlaa JS yhdeksi tiedostoksi

**Nykytila:** 28 erillistä JS-tiedostoa (`js/main.js`, `js/screens/*.js`, `js/features/*.js`, jne.) ladataan kaikki etukäteen.

**Korjaus, kaksi vaihtoehtoa:**

### A. Pelkkä bundlaaminen (suositeltu ensimmäinen askel)

Jos koodi on ESM (`import`/`export`), käytä esbuildia:

```bash
npm install --save-dev esbuild
```

```json
{
  "scripts": {
    "build:js": "esbuild js/main.js --bundle --minify --outfile=public/app.bundle.js --format=esm --target=es2020 --sourcemap"
  }
}
```

`app.html`:ssa korvaa `<script>`-tagit yhdellä:
```html
<script type="module" src="/app.bundle.js"></script>
```

**Tarkista:** sw-registerin (`js/sw-register.js`) ja prepaint-skriptin (`js/app-prepaint.js`) lataus-järjestys. Jotkin saattaa olla pakko ladata erikseen ennen bundlea.

### B. Lazy-loadattu — vain jos A jälkeen cold load on yhä yli 2s

Sama esbuild, jaettu:
- `app.core.js` — main + nav + auth + dashboard (kriittinen polku, `~50%` koodista)
- `app.exercises.js` — vocab + grammar + reading + writing + exam + verbSprint (lazy)

Lazy-loadaus dynaamisilla importeilla:
```js
async function openVocab() {
  const { renderVocab } = await import('./screens/vocab.js');
  renderVocab();
}
```

esbuild osaa code-splittauksen `--splitting`-flagilla.

**Päätös:** Tee A. Mittaa. Siirry B:hen vain jos tarpeen.

**Verify:**
- DevTools → Network → 1-2 JS-pyyntöä (ei 28)
- Lighthouse "Reduce unused JavaScript" -kohta paranee
- `js/sw-register.js` toimii (PWA-asentuu)
- Cold load -aika lyhenee 500-1000ms

---

## UPDATE 3 — `/api/dashboard/v2` joka batchaa kaikki dashboard-pyynnöt

**Nykytila:** Dashboardilla 11 API-kutsua peräkkäin. Hidastavin (`adaptive/status` 1094ms) lukitsee koko sivun. Lista `AUDIT_LIVE_DASHBOARD.md`:n network-osiossa.

**Korjaus:** Luo uusi endpoint `GET /api/dashboard/v2` joka palauttaa kaiken kerralla:

```ts
{
  profile: { ... },              // korvaa /api/profile
  dashboard: { ... },            // korvaa /api/dashboard
  weakTopics: [ ... ],           // korvaa /api/weak-topics?days=7
  srCount: 28,                   // korvaa /api/sr/count?language=spanish
  srForecast: [ ... ],           // korvaa /api/sr/forecast?days=30
  examHistory: [ ... ],          // korvaa /api/exam/history
  learningPath: { ... },         // korvaa /api/learning-path
  placement: { status: 'done' }, // korvaa /api/placement/status
  adaptiveStatus: { ... }        // korvaa /api/adaptive/status?mode=vocab
}
```

Backend (`routes/dashboard.js` tai uusi `routes/dashboardV2.js`):
- Aja kaikki SQL-kyselyt **rinnakkain** `Promise.all()`:lla
- Yhdistä tulokset yhdeksi vastaukseksi
- Palauta yhdellä JSON-rungolla

Frontend (`js/screens/dashboard.js`):
- Korvaa 9 erillistä fetch-kutsua yhdellä `fetch('/api/dashboard/v2')`
- Lue tarvittavat field:t vastauksesta

**Älä poista vanhoja endpointteja heti** — ne saattavat olla käytössä muualla (esim. `/api/profile` Asetukset-sivulla, `/api/exam/history` koeharjoitus-sivulla). Lisää `/v2`, migrate dashboard, tarkista regressioita, sitten harkitse vanhojen poistoa erillisessä loopissa.

**Vaikutus:** 9 sarjapyyntöä → 1 pyyntö. Aika riippuu hitaimmasta SQL-kyselystä, mutta voi puolittaa cold loadin.

**Verify:**
- Cold load → DevTools → 1 dashboard-API-pyyntö 9:n sijaan
- Dashboard renderöityy ilman regressioita
- E2E: `tests/e2e/dashboard-load.spec.js` — kaikki sectionit näkyvät kuten ennen
- Lighthouse cold load -aika

---

## UPDATE 4 — Cache `/api/profile` muistissa

**Nykytila:** `/api/profile` palauttaa 902ms ja sitä kutsutaan jokaisella sivulla.

**Korjaus, frontend-side:**

`js/api.js`:

```js
let profileCache = null;
let profileCacheTime = 0;
const PROFILE_CACHE_MS = 5 * 60 * 1000; // 5 min

export async function getProfile(force = false) {
  const now = Date.now();
  if (!force && profileCache && now - profileCacheTime < PROFILE_CACHE_MS) {
    return profileCache;
  }
  const r = await fetch('/api/profile');
  if (!r.ok) throw new Error(`Profile fetch failed: ${r.status}`);
  profileCache = await r.json();
  profileCacheTime = now;
  return profileCache;
}

export function invalidateProfile() {
  profileCache = null;
  profileCacheTime = 0;
}
```

Asetukset-sivulla profiilipäivityksen jälkeen: kutsu `invalidateProfile()` ja sitten `getProfile(true)`.

**Älä cachea backend-puolella** — Vercel hoitaa sen omasta puolestaan.

**Verify:**
- Navigoi sivuilla → DevTools → `/api/profile` lähtee vain kerran
- Asetukset → tallenna profiili → seuraavalla sivulla profiili on ajantasalla (cache invalidated)

---

## UPDATE 5 — Sanastoharjoituksen pre-generointi taustalla

**Nykytila:** Klikkaus "Aloita sanastoharjoittelu" → 4.2s ennen Q1:n näkymistä. OpenAI-vastausaika dominoi.

**Korjaus, kaksiosainen:**

### A. Pre-generate seuraava batch kun käyttäjä on Q8/12

`js/screens/vocab.js`:

```js
async function onQuestionRendered(currentIndex, totalQuestions) {
  if (currentIndex === Math.floor(totalQuestions * 0.66)) {
    preloadNextBatch();
  }
}

let nextBatchPromise = null;

async function preloadNextBatch() {
  if (nextBatchPromise) return;
  nextBatchPromise = fetch('/api/vocab/generate', {
    method: 'POST',
    body: JSON.stringify({ topic: currentTopic, level: currentLevel })
  }).then(r => r.json()).catch(err => {
    nextBatchPromise = null;  // retry mahdollinen
    throw err;
  });
}

async function startNewBatch() {
  if (nextBatchPromise) {
    const batch = await nextBatchPromise;
    nextBatchPromise = null;
    return batch;
  }
  return fetch('/api/vocab/generate', ...).then(r => r.json());
}
```

Run `puheo-ai-prompt`-skill — varmista että pre-gen-pyyntö käyttää samaa system messagea, JSON-schemaa, cost-guardia kuin normaali pyyntö.

Run `education/spaced-practice-scheduler` — pre-genatut kysymykset eivät saa rikkoa SR-järjestystä; backend pitää huolta että seuraava batch ottaa huomioon nykyisen istunnon edistymisen.

**Vaikutus:** Käyttäjä klikkaa "Aloita uusi" → kysymys näkyy lähes välittömästi (jos pre-load valmis), tai 1-2s (jos vielä käynnissä).

### B. LRU cache hot topics backendissa

`lib/openai.js` tai `routes/exercises.js`:

```js
import { LRUCache } from 'lru-cache';
const vocabCache = new LRUCache({ max: 100, ttl: 24 * 60 * 60 * 1000 });

export async function generateVocabBatch(topic, level) {
  const key = `${topic}::${level}`;
  if (vocabCache.has(key)) {
    const cached = vocabCache.get(key);
    return shuffle(cached).slice(0, 12);  // sekoita ettei aina sama 12
  }
  const fresh = await openai.generateVocab(topic, level);
  vocabCache.set(key, fresh);
  return fresh;
}
```

Vercelillä in-memory LRU toimii vain saman serverless-instanssin sisällä → cache-hit-rate rajallinen mutta nollasta poikkeava. Pitkän aikavälin: Upstash Redis tai Vercel KV. Mutta in-memory on hyvä ensiaskel.

**Vaikutus:** 4.2s → ~500ms cache-hit-tilanteessa.

**Verify:**
- Avaa "Aloita sanastoharjoittelu" useita kertoja peräkkäin → toinen+ avaukset selvästi nopeampia
- Pre-gen lokit: console.log kun pre-load alkaa, kun se valmistuu, kun se käytetään
- Kustannukset: tarkista OpenAI dashboardista että pyyntömäärä ei räjähdä — pre-gen ei saa generoida useita batch:eja yhden istunnon aikana
- E2E: `tests/e2e/vocab-pre-gen.spec.js`

---

## UPDATE 6 — Optimoi `/api/adaptive/status` (1094ms hitain)

**Nykytila:** Yksittäinen hitain API-kutsu. 1.1s.

**Korjaus:**

```bash
grep -A 30 "adaptive/status" routes/exercises.js
```

Tarkista mitä endpoint tekee. Tyypillisiä syitä:
1. **N+1-query** — yksi pää-kysely + N alikyselyä per rivi
2. **Indeksiä puuttuu** — tarkista `EXPLAIN ANALYZE` Supabasen SQL-editorissa
3. **Liian iso `SELECT *`** — palauttaa kentät joita ei tarvita
4. **OpenAI-pyyntö kesken** — adaptive/status ei pitäisi kutsua OpenAI:ta

**Mahdolliset fixit:**

### Indeksit
```sql
-- Aja Supabase SQL-editorissa, ei automaattisesti
CREATE INDEX IF NOT EXISTS idx_user_progress_user_mode ON user_progress(user_id, mode);
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON attempts(user_id, created_at DESC);
-- Tarkista todelliset taulu-/sarakenimet skeemasta
```

Kirjoita SQL ACTION REQUIRED IMPROVEMENTS.md:hen, **älä aja itse**.

### LRU cache 30s
Sama `LRUCache`-pohja kuin UPDATE 5, mutta 30s TTL — adaptive status ei muutu joka sekunti, mutta sen on oltava ajantasalla minuutin sisällä:

```js
const adaptiveCache = new LRUCache({ max: 1000, ttl: 30 * 1000 });
```

### Yksinkertaista SQL
Jos endpoint laskee `last_5_sessions`, `accuracy`, `streak`, jne. — tee yksi aggregaatio-SQL eikä useita peräkkäisiä.

**Verify:**
- Mittaa endpointin aika ennen ja jälkeen DevToolsista
- Tavoite: 1094ms → <300ms
- Cold load Lighthouse-mittaus

---

## UPDATE 7 — Self-host Inter + DM Mono (Google Fonts pois)

**Nykytila:** `<link href="https://fonts.googleapis.com/css2?family=Inter...DM+Mono...">` — kaksi external-pyyntöä Google Fonts CDN:lle. Lisäksi CSP-näkökulmasta `fonts.googleapis.com` + `fonts.gstatic.com` ovat sallittuja `style-src` ja `font-src` -direktiiveissä.

**Korjaus:**
1. Lataa fontit `.woff2`-muodossa (Inter 400/500/600/700/800 + DM Mono 400/500). Helpoin tapa: [google-webfonts-helper](https://gwfh.mranftl.com/fonts) → "Best Support"
2. Sijoita `public/fonts/`-kansioon
3. Lisää `@font-face`-määrittelyt `style.css`:n alkuun:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/inter-v13-latin-regular.woff2') format('woff2');
}
/* toista 500/600/700/800 + DM Mono 400/500 */
```

`font-display: swap` tärkeä — älä blokkaa renderiä fontin latauksen ajaksi.

4. Poista Google Fonts -link `app.html`:stä ja `index.html`:stä
5. Päivitä `vercel.json` CSP — poista `fonts.googleapis.com` ja `fonts.gstatic.com` `style-src` ja `font-src`-direktiiveistä (mukaisesti `L-SECURITY-2`-loop)
6. Lisää `Cache-Control: public, max-age=31536000, immutable` -headerit `/fonts/*`-tiedostoille `vercel.json`:iin

**Vaikutus:** ~150-300ms säästö cold loadissa + yksi DNS-lookup pois + CSP-tiukennus.

**Verify:**
- DevTools → Network → fontit ladataan `/fonts/`-pathista, ei googleapis.comista
- Visuaaliset regressiot: fontit renderöityvät identtisesti (tarkista `design:design-critique`)
- CSP: `securityheaders.com`-skanni → CSP edelleen A+ enforced
- Lighthouse → "Eliminate render-blocking resources" -kohta paranee

---

## Verifiointi loop:in lopussa

1. **Mittaa kaikki taulukon arvot uudestaan** ja vertaa lähtötilaan:
   - Lighthouse cold load `/app.html` (kotikoneelta, ei Vercel-sandboxista)
   - Sanastoharjoituksen Q1 lataus (manuaalisesti, ajastimella)
   - SR-arvio → palaute (manuaalisesti)
   - DevTools Network → CSS/JS-pyyntöjen määrä, kokonaisaika
   - API-endpoint-kestot (`/api/dashboard`, `/api/adaptive/status`, jne.)

2. **axe-core sweep** kaikilla muutetuilla screeneillä @ 1440 + 375 → 0 violations.

3. **Playwright video** cold loadista — vertaa lähtötilaa nykyiseen. Tämä on parempi mittaus kuin pelkkä numero koska peittää myös visual jitter, FOUC, layout shift.

4. **E2E-testit:**
   - `tests/e2e/dashboard-load.spec.js`
   - `tests/e2e/vocab-flow.spec.js`
   - `tests/e2e/exam-flow.spec.js`
   - `tests/e2e/pwa-install.spec.js` — varmista että SW + bundlaus toimivat yhdessä

5. **Manuaalitesti tuotannossa** kun shipattu Vercelille:
   - Avaa `/app.html` cold (Incognito) → mittaa aika kunnes interaktiivinen
   - Sanastoharjoittelun avausaika
   - Tehtävänjälkeisen feedback-ajan tuntuma

6. **IMPROVEMENTS.md** — yksi rivi per UPDATE, prefix `[2026-05-03 L-LIVE-AUDIT-P2]`. Lisää **mittausvertailu**-osio: ennen/jälkeen taulukko jokaiselle UPDATElle.

7. **AGENT_STATE.md** — `Last completed loop: L-LIVE-AUDIT-P2`.

8. **SW-bumppi pakollinen** — tämä loop muuttaa STATIC_ASSETS-rakennetta merkittävästi (uudet bundle-tiedostot, uudet font-tiedostot).

9. **package.json `version`-bumppi** jos käytäntö repon — major version, koska bundlaus muuttaa deploy-rakennetta.

---

## Mitä EI saa tehdä tässä loopissa

- ÄLÄ yritä tehdä kaikkia 7 UPDATEa samassa istunnossa — käyttäjän suosittelu järjestys yllä
- ÄLÄ poista vanhoja endpointteja UPDATE 3:n jälkeen — ne ovat käytössä muualla; siivous erillinen loop
- ÄLÄ aja Supabase-migraatioita itse (UPDATE 6 indeksit) — ACTION REQUIRED IMPROVEMENTS.md:hen
- ÄLÄ keksi uusia CSP-sääntöjä — käytä L-SECURITY-2:n pohjaa
- ÄLÄ lisää uutta toiminnallisuutta — vain perf-fixit
- ÄLÄ refaktoroi koko frontend-arkkitehtuuria (Vue/React/Svelte) — vanilla JS pysyy, vain bundlaus
- ÄLÄ koske landing-pageen
- ÄLÄ rikko PWA-asentumista (sw-register, manifest)
- ÄLÄ poista source-CSS/JS-tiedostoja repo:sta — vain bundlaa ne

---

## Commit-konventio

Yksi commit per UPDATE, mahdollisesti useampia jos UPDATE on iso:
- `perf(build): bundle CSS into single app.bundle.css [L-LIVE-AUDIT-P2 UPDATE 1]`
- `perf(build): bundle JS modules into app.bundle.js with esbuild [L-LIVE-AUDIT-P2 UPDATE 2]`
- `perf(api): add /api/dashboard/v2 endpoint that batches all dashboard queries [L-LIVE-AUDIT-P2 UPDATE 3]`
- `perf(api): cache /api/profile in client memory for 5 minutes [L-LIVE-AUDIT-P2 UPDATE 4]`
- `perf(vocab): preload next question batch when user is 2/3 through current set [L-LIVE-AUDIT-P2 UPDATE 5a]`
- `perf(vocab): add LRU cache for hot topic batches [L-LIVE-AUDIT-P2 UPDATE 5b]`
- `perf(adaptive): cache /api/adaptive/status for 30s + index user_progress [L-LIVE-AUDIT-P2 UPDATE 6]`
- `perf(fonts): self-host Inter and DM Mono, drop Google Fonts CDN [L-LIVE-AUDIT-P2 UPDATE 7]`

Push → Vercel deploy → mittaus tuotannossa → IMPROVEMENTS.md (mittauspareineen) + AGENT_STATE.md.

**Mittaus tuotannossa on pakollinen ennen merkitsemistä valmiiksi.** Tämä loop on numerokeskeinen — ilman before/after-vertailua loopia ei ole tehty.
