# 01 / 5 — L-BUG-HUNT-DASHBOARD-1

> **Ajetaan META_QA_LOOP-orkestraattorin kautta.** Tämä on ensimmäinen loop uudessa QA-pipelinessä — sen tarkoitus on (1) pestä pois nykyiset näkyvät tuotantobugit jotka käyttäjä on löytänyt itse, ja (2) validoida että uusi 4-vaiheinen pipeline toimii ennen kuin uusia featureita ajetaan sen läpi.

---

## 1. Lähtötilanne

Käyttäjä on raportoinut konkreettisia näkyviä bugeja, jotka shipatut loopit (ONBOARDING-REDESIGN-1, PRICING-REVAMP-1, DB-TABLE-FIX-1) ovat jättäneet jälkeensä. Tunnetut esimerkit screenshoteista (2026-05-07):

- **Dashboard mode-tilet renderöityvät `[object Object]`-tekstinä** (SANASTO / KIELIOPPI / LUKEMINEN / KIRJOITTAMINEN -kortit). Klassinen string-interpolaatio objektista. Todennäköinen syy: `modeStats[mode]` on objekti, joka on aiemmin destrukturoitu `s.bestGrade / s.avgPct` -kentiksi mutta jokin reitti palauttaa nyt eri shape:n (tai joku muu rendering-paikka käyttää suoraan `${stats}` -interpolaatiota).
- KPI-tilet (PUTKI / YHTEENSÄ / TÄLLÄ VIIKOLLA / YO-VALMIUS) näkyvät — mahdollinen overlay-päällekkäisyys settings-paneelin kanssa.

Nämä ovat **vain pintaraapaisu**. Tämän loopin tarkoitus on löytää **kaikki** vastaavat näkyvät bugit kerralla, ei vain nuo kaksi.

---

## 2. Scope (mitä TEHDÄÄN)

### Worker-vaihe 1 (Vaihe 1 / META_QA_LOOP)

**1 Sonnet-worker** (ei tarvita rinnakkaisuutta tähän scoping-vaiheeseen — yksi koherentti worker tekee paremmat päätökset):

**Tehtävä:** Käy läpi **kaikki** dashboard-rendering-polut ja korjaa `[object Object]`-/`undefined`-/`NaN%`-luokan bugit kaikista screeneistä.

**Worker-prompti (Vaiheessa 1 spawnattuna):**

> Olet bug-hunt-implementer. Sinun täytyy:
>
> 1. **Lue:** `js/screens/dashboard.js`, `js/screens/profile.js`, `js/screens/settings.js`, `app.js` (vain `MODE_META`-osa + ensimmäiset 800 riviä), `app.html` (vain dashboard + settings + profile -screenit).
> 2. **Etsi** kaikki paikat joissa `${var}` -interpolaatio voi renderöityä objektista tai `undefined`:sta. Erityisesti:
>    - `modeStats[mode]` -käyttö: jokainen kohta missä `s` tai `stats` on objekti, varmista että vain konkreettiset kentät (`s.bestGrade`, `s.avgPct`, `s.sessions`) interpoloidaan, ei koko objekti
>    - `MODE_META`-käyttö: `meta.icon` ja `meta.name`, ei pelkkä `${meta}`
>    - `localStorage`-paluuarvot: `JSON.parse` saattaa palauttaa objektin missä odotetaan stringiä
>    - `window._userProfile` -kentät: tarkista että interpoloidaan kenttiä, ei koko objektia
> 3. **Tarkista DOM-elementtien `textContent`-asetukset:** `el.textContent = someThing` jos someThing on objekti → renderöityy `[object Object]`
> 4. **Korjaa kaikki löydökset Edit-toolilla.** Älä committaa.
> 5. **Bumpaa `sw.js` `CACHE_VERSION`** jos muokkasit STATIC_ASSETS-listaan kuuluvaa tiedostoa
> 6. **Aja `node --check js/screens/<file>.js`** jokaiselle muokatulle JS-tiedostolle — älä claimaa valmiiksi jos parse-error
> 7. Raportoi: lista löydetyistä paikoista (file:line + bug-tyyppi + fix), muokatut tiedostot

### Worker-vaihe 2 (Vaihe 2 / META_QA_LOOP — verifiers)

**A. Code-reviewer** ajaa standardin diff-skannin (META_QA_LOOP §1 Vaihe 2A).

**B. Live-tester** (Playwright, **pakollinen**) ajaa täyden happy-path-skannin:
- Onboarding (jos kesken) → Dashboard → Sanasto → Kielioppi → Lukeminen → Kirjoittaminen → Koe → Tulokset → Profiili → Asetukset → Pricing
- FAIL jos `[object Object]` / `undefined` / `NaN%` / `null` näkyy DOM:ssa **missään screenissä**
- FAIL jos console.error > 0
- FAIL jos network 4xx/5xx
- Output: per-screen verdict + screenshot + fail-snippet

**C. A11y-checker:** axe-core jokainen screen, dark+light mode.

### Vaihe 3 (Fix — Opus)

Aggregoi löydökset, korjaa loput Edit:llä, re-runaa live-testerin kunnes 0 P0.

---

## 3. Acceptance criteria (KAIKKI täyttyy ennen close-outia)

- [ ] Dashboard mode-tilet renderöivät tekstit (ei `[object Object]`)
- [ ] Mikään screen ei sisällä DOM:ssa: `[object Object]` / `undefined` / `NaN%` / pelkkä `null`
- [ ] Console.error count = 0 happy-pathilla
- [ ] Network ei palauta 4xx/5xx omilla reiteillä
- [ ] axe-core: 0 critical, 0 serious violations
- [ ] `node --check` clean kaikilla muokatuilla `.js`-tiedostoilla
- [ ] SW `CACHE_VERSION` bumpattu jos STATIC_ASSETS muuttui
- [ ] AGENT_STATE.md + IMPROVEMENTS.md päivitetty

---

## 4. Pois scopesta (EI tehdä tässä loopissa)

- Uusia featureita
- Refaktorointia jolla ei ole bug-hunt-perustetta
- pricing-2 / lang-landings -työtä
- Visual redesignia muusta kuin a11y-fixistä

---

## 5. Skill-set

- `superpowers:systematic-debugging` (worker)
- `webapp-testing` (live-tester verifier)
- `design:accessibility-review` (a11y verifier)
- `puheo-screen-template` (jos templaten poikkeamaa korjataan)

---

## Lopuksi
Tämä on **01 / 5** jonossa (`agent-prompts/02-queue/01_BUG_HUNT_DASHBOARD_1.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
