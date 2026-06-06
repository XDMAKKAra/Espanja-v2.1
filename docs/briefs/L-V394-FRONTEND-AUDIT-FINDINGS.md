# L-V394 — Frontend-koodisiivous AUDIT (findings)

Päivä: 2026-06-06. Menetelmä: graphify + grep/glob + build-introspektio + Playwright-smoke, neljä rinnakkaista subagenttia (5 kategoriaa). **Marcel laajensi scopea ajon aikana: "korjaa kaikki mikä on rikki, kysy kiistanalaisista".** Siksi V0-bugit on jo korjattu + verifioitu tässä loopissa; loput odottavat päätöstä.

## Tiivistelmä

| Kategoria | V0 | V1 | V2 | Tila |
|---|---|---|---|---|
| 1. Kuolleet tiedostot | – | 2 | 5 | listattu, deletoinnit odottavat lupaa |
| 2. Haamut (refs olemattomaan) | 1 | 1 | ~10 | **V0 korjattu** (digikirja); DOM-id-roskat odottavat |
| 3. Kilpailevat systeemit | 1 | 3 | 2 | **V0 korjattu** (blank screen); L-cleanup odottaa päätöstä |
| 4. app.js-monoliitti | – | 1 | – | **premissi oli väärä — app.js on KOKONAAN kuollut** |
| 5. CSS-cascade | – | 2 | 3 | yksi "löydös" oli false positive (kuollut app.js harhautti) |

**Vakavuus:** V0 = aktiivinen bugi / rikki käyttäjälle näkyvä toiminto. V1 = haamu/kilpaileva systeemi joka aiheuttaa bugeja tai hidastaa kehitystä. V2 = vaaraton siivous.

**Iso meta-löydös:** juuritason `app.js` (2528 riviä, jota CLAUDE.md kuvaa "Frontend logic 2300+ lines") on **kuollut koodi** — oikea sovellus on `js/main.js` + `js/screens/*`. Tämä kuollut tiedosto harhautti aktiivisesti yhtä CSS-auditin löydöstä (alla #5.2). Se on vahvin yksittäinen argumentti siivoukselle.

---

## ✅ KORJATTU TÄSSÄ LOOPISSA (V0 + verifioitu)

### V0-A — `/api/digikirja/*` ei mountattu Vercel-entryssä → 404 tuotannossa
- **Tiedostot:** `api/app.js` (Vercel-serverless-entry, vahvistettu `vercel.json` `functions` + rewrite `/api/(.*)→/api/app`). `server.js:238` mounttasi `digikirjaRoutes`, mutta `api/app.js` ei → digikirjan itsearvio + oppituntiprogress 404asi tuotannossa.
- **Korjaus:** lisätty import + `app.use("/api/digikirja", digikirjaRoutes)` `api/app.js`:ään. Reitti on serverless-turvallinen (Supabase + requireAuth, ei fs-kirjoituksia, taulut migraatioissa 038/039).
- **Verifiointi:** mount nyt molemmissa entryissä (`grep` vahvisti `server.js:238` + `api/app.js:109`); build + 1336 vitest-testiä vihreinä.

### V0-B — `loadCurriculum()` renderöi tapettuun `#screen-path`:iin → tyhjä ruutu oppitunnin jälkeen
- **Juurisyy:** `css/app-old-spain.css:2876` "KILL SCREEN-PATH" -sääntö piilottaa `#screen-path` pysyvästi (`display:none !important`). Silti `js/screens/curriculum.js:529 loadCurriculum()` tekee `show("screen-path")`. Live-kutsujat (`lessonResults.js` `jumpToKertaustesti`-fallback + `goBackToCurriculum` + virhe-CTA "Jatka oppimispolkua →"; `features/teachingPanel.js:249` "Lopeta oppitunti") tiputtivat käyttäjän tyhjälle pinnalle. Tappokommentti jopa nimeää tämän failuren.
- **Korjaus:** kutsujat ohjattu live-`#/oppimispolku`-reittiin (sama hash kuin sivupalkin Tehtävät-linkki; `main.js:385` hashchange-router renderöi `oppimispolkuIndex`/`courseDetail`). `goBackToCurriculum`-fast-track käyttää nyt `curriculum.openLesson()`:ia (live `#screen-lesson`) sen sijaan että teki `loadCurriculum()`:n.
- **Verifiointi:** uusi `tests/e2e-v394-path-nav.spec.js`, 3/3 vihreää: (1) `#screen-path` pysyy piilotettuna vaikka pakotetaan `.active`, (2) `#/oppimispolku` renderöi näkyvän `#op-root .lp-list` + `#screen-oppimispolku-index.active`, (3) `#/oppimispolku/es/kurssi_1` renderöi `#cd-root .lesson-list`.

---

## Kategoria 1 — Kuolleet tiedostot (odottaa lupaa poistaa)

| Tiedosto | Oire | Vakavuus | Koko |
|---|---|---|---|
| `js/demo.js` + `js/demo-exercises.js` | ei importteja; korvattu `js/landing-writing-demo.js`:llä; vain stale-doc + sw.js-viite | V2 | S |
| `js/features/achievements.js` | `renderAchievementsInto` 0 kutsujaa; ei bundleen | V2 | S |
| `js/features/topicWeights.js` | ei importtaajia; ei bundleen | V2 | S |
| `js/ui/modal.js` | `openModal` vain `tests/modal.test.js`:n käytössä; `verbReference.js` määrittää oman | V2 | S |
| `lib/adaptive.js` | kuolleet pure-funktiot; ainoa importtaaja `tests/adaptive.test.js` (L-V392-note) | V1 | S |
| `db.js` | 0 importtia; dokumentoitu legacy (Supabase = oikea DB), **CLAUDE.md viittaa siihen** | V2 | S |

Korjaus per rivi: poista tiedosto (+ sw.js STATIC_ASSETS-rivi + CACHE_VERSION-bump demo/achievements-tapauksissa, + vastaava test).

---

## Kategoria 2 — Haamut

- **V0 digikirja** — korjattu (yllä V0-A).
- **V1/V2 kuolleet DOM-id-luennat** (kaikki null-guardattuja → ei kaadu, dead no-op):
  - `learningPath.js:58-60,88-92` `path-level-badge*`, `path-nodes`, `path-progress-*`, `path-mixed-review*` — id:t poistettu app.html:stä; `renderPath` bail-out `:96`. **V1** (osa kuollutta path-renderiä, ks. #3.1).
  - `learningPath.js:28` `btn-mixed-review` — `startMixedReview` ei koskaan kytketty. **V1**.
  - `dashboard.js:694-722` `dash-countdown-value`, `dash-exam-countdown`, `dash-goal-*`, `dash-today-minutes` — päivätavoite/countdown-blokki täysin guardattu kuollut. **V2**.
  - `main.js:841` `btn-logout`, `main.js:604` `sr-top-btn`, `quickReview.js:112/122` `btn-show-quickreview`, onboardingV4 `ob-v4-test-passage` — poissa, guardattu. **V2.** (Varmista `btn-logout` — logout siirtyi profiilivalikkoon?)
- **Ei orpoja endpoint-kutsuja:** `/api/adaptive-*` ovat yhä olemassa (`routes/exercises.js:1382/1409/1490`) — briefin oletus oli väärä, eivät haamuja.
- **Ei phantom-table-viitteitä frontissa:** `user_level_progress` esiintyy vain backendissä — frontend puhdas.

---

## Kategoria 3 — Kilpailevat systeemit

### 3.1 — V1: oppimispolun kolme renderöijää (learningPath.js path-osa kuollut, curriculum.js zombie, oppimispolkuIndex/courseDetail kanoniset)
**Ratkaisu ristiriitaan (V388-muisti vs V392-brief): learningPath.js on OSITTAIN kuollut.**
- **Kanoniset/näkyvät:** `oppimispolkuIndex.js` (`#/oppimispolku`) + `courseDetail.js` (`#/oppimispolku/{lang}/{key}`). Nämä käyttäjä näkee.
- **`learningPath.js` path-renderöinti = KUOLLUT** (`loadPath`/`renderPath`/`renderLevelBadge`/`startMixedReview`, rivit ~28–199): kirjoittaa tapettuun `#screen-path`/`#path-nodes`:iin; ei ulkoista kutsujaa.
- **`learningPath.js` mastery-koodi = ELÄÄ mutta UNREACHABLE:** `submitMasteryResult` kytketty (`main.js:208 window._learningPathRef`, kutsuu `vocab.js:1104`), `screen-mastery-intro/result` + `/api/mastery-test/*` ovat oikeita screenejä — MUTTA ainoa sisäänkäynti (`openTopicIntro` kuolleista path-nodeista) on saavuttamaton. Eli mastery-kone on kytketty, mutta sen ainoa liipaisin on kuollutta koodia.
- **`curriculum.js loadCurriculum()` = ZOMBIE:** eli live-kutsujia, mutta renderöi tapettuun screen-pathiin (oli V0-B:n syy; kutsujat nyt ohjattu pois, mutta itse zombie-moduuli jää).
- **Korjaus (size L, PÄÄTÖS VAADITAAN):** riippuu tuotepäätöksestä — kytketäänkö mastery-testi live-screeneihin (oppimispolkuIndex/courseDetail) vai poistetaanko end-to-end. Sen jälkeen: poista learningPath.js path-render + curriculum.js zombie + kuolleet DOM-id:t (#2).

### 3.2 — V1: hardkoodattu taso "B" ohittaa `/api/user-level`
- `curriculum.js:883/921` (zombie-poluissa), `lessonResults.js:261-263` (live: vapaaharjoittelun jatko vocab="B"), `onboarding.js:219`, `learningPath.js:187` (kuollut). Tarkoitettu yksi lähde on `/api/user-level` (`main.js:512-518`). Hardkoodit voivat näyttää/käyttää eri tasoa riipuen mikä screen kirjoitti viimeksi. **V1**, koko M. (Nyanssi: lessonResults:261 voi olla tahallinen default vapaaharjoittelulle — vaatii tarkistuksen ennen muutosta.)

### 3.3 — V2: kieli `state.language` vs `puheo:lang`
Split on todellinen mutta mitigoitu: `setLanguage()` (`state.js:73-81`) synkkaa molemmat tahallaan. Suorat `puheo:lang`-lukijat (`onboardingV4.js:98`, `landing-lang-cta.js:30`) ovat pre-login-rajalla. `onboardingV4.js:150-152` tekee redundantin triple-writen (`state.language=` + `localStorage` + `setLanguage`). **Korjaus:** romauta triple-write yhdeksi `setLanguage(lang)`-kutsuksi. Koko S.

**"3 kilpailevaa state-systeemiä" — paikannettu:** (1) keskusobjekti `js/state.js`, (2) localStorage-avaimet (auth, `puheo:lang`, `puheo_settings`, `puheo:nickname`, draftit), (3) `window._*`-globaalit + DOM-attribuutit (`.screen.active`, `[data-mode]`, `[hidden]` vs class-`display`). Konkreettiset duplikaatit: `level` (≥5 kirjoittajaa, ks. 3.2) ja `nickname` (3-tier, dokumentoitu tahalliseksi, V2).

---

## Kategoria 4 — app.js-monoliitti → **premissi väärä: app.js on kuollut**

Juuritason `app.js` (2528 riviä) **ei ole keskeneräinen irrotus — se on irrotuksen *before*-tila.** `app.html:3101` lataa `/app.bundle.js`, jonka esbuild-entry on `js/main.js` (`scripts/build-bundle.mjs:45`). Root `app.js`:
- ei importtia, ei `<script>`-tagia, ei build-configissa — 0 viittausta.
- viimeksi committattu 2026-05-06; `js/main.js` muokattu tänään.
- jokainen sen funktio on jo superseded `js/screens/*`:ssa (vocab/writing/grammar/reading/exam/dashboard) + `js/main.js` (router, init, auth, shortcuts).

**Ei irrotettavaa — oikea siivous on POISTO.** **V1**, koko L (mekaaninen). `app.html` sen sijaan on OK (0 inline `<style>`/`<script>`, ~62 screen-divia = oikea SPA-pattern). Älä koske.

---

## Kategoria 5 — CSS-cascade

- **5.1 — V2 (kunnossa, älä riko): `--success`/`--error`-remap on JO korjattu.** `app-old-spain.css:134-139` asettaa nyt puhtaan vihreän (`#3C7A4E`) + punaisen (`#B23B2E`) — L-V388 korjasi oliivin/terrakotan. MC-väribugi ei enää ole. Kirjattu ettei tuleva edit re-introdusoi remappia.
- **5.2 — FALSE POSITIVE (kuollut app.js harhautti):** CSS-agentti väitti vocab/grammar-MC:n `.correct`/`.wrong` bare-luokkien tyylittyvän vain `app-old-spain.css`:ssä. **Mutta** ne bare-luokat lisää kuollut `app.js`. Live-koodi (`vocab.js:963/965`, `grammar.js:168-174`, `reading.js:157-163`) käyttää `.is-correct`/`.is-wrong` joka tyylittyy `exercise.css:239-265`:ssä. Ei korjattavaa. (Ainoa live-bare on `vocab.js:625/633` text-inputilla + `reading.js T/F .tf-btn.correct` jota `exercise.css:83/88` tyylittää.) **Tämä on suora todiste siitä että kuollut app.js aiheuttaa väärät audit-löydökset.**
- **5.3 — V1: sidebar `display: !important`-sota (3 tiedostoa).** `app-shell.css:39,69` vs `off-canvas-nav.css:48,163-173` taistelevat `.app-sidebar`-näkyvyydestä `!important`-säännöillä (kommentit myöntävät sodan). Toimii nyt, mutta neljäs tila vaatii taas `!important`:in. **Korjaus:** yksi `data-`-attribuutti/state-luokka yhden tiedoston omistamana. Koko M.
- **5.4 — V2: `!important`-sota `.dash-recent-item:hover`** (`dashboard.css:311` vs `app-old-spain.css:447`). app-old-spain voittaa; dashboardin `!important` on kuollutta painoa. Pudota se. Koko S.
- **5.5 — V2: `--success` 3. määrittely** `library-shelf.css:27` (sama arvo, scoped kopio). Vaaraton; driftaa jos kanoninen retunataan. Koko S.

`!important`-hotspotit app-bundlessa: app-old-spain 12, off-canvas-nav 10, digikirja 9 (auditoimatta), app-shell 4, dashboard 3.

---

## Verifioitu kunnossa (ei auditoida uudestaan)

- `js/screens/adaptive.js` poistettu siististi, ei orpoja importteja.
- `/api/adaptive-*` endpointit elävät; kutsut validit.
- `user_level_progress` ei frontissa lainkaan.
- Auth-tokenit yksi omistaja (`api.js:44-80`); routing-aktiivisuus yksi lähde (`syncActiveNav`, L-V378).
- Kielisynkka `state.language ⇄ puheo:lang` ylläpidetty; `oppimispolkuIndex.js`:n vanha lang-bugi korjattu.
- `app.html` oikein rakennettu (ei inline style/script).
- MC-värit (`.is-correct/.is-wrong` → `exercise.css`) toimivat app-old-spainista riippumatta.
- Kaikki landing-/feature-`<script>`-ladatut tiedostot elävät (vain ei app-bundlessa).

---

## Ehdotettu prioriteetti (V0 jo tehty)

1. **Päätös: app.js poisto** (V1, L mutta mekaaninen) — suurin selkeyshyöty, harhauttaa auditteja. Doc-viite (CLAUDE.md) päivitettävä samalla.
2. **Päätös: mastery-testin kohtalo** (3.1) — kytke live-screeneihin TAI poista end-to-end. Avaa learningPath.js + curriculum.js + kuolleiden DOM-id:iden siivouksen (V1, L).
3. **Kuolleiden tiedostojen erä** (kat. 1, V1/V2, kukin S) — nopea, vähäriskinen.
4. **Sidebar `!important`-konsolidointi** (5.3, V1, M) ja **taso-"B"-hardkoodi** (3.2, V1, M) — omat loopit.
5. **V2-rippeet:** kieli-triple-write (3.3), dash-recent !important (5.4), library-shelf-dup (5.5), kuolleet DOM-id-luennat (kat. 2).
