# L-V399 — Cleanup Map (Vaihe 0, ei muutoksia)

> Evidenssipohjainen kartoitus refaktoria varten. Behavior-preserving. Tämä dokumentti EI muuta koodia.
> Lähde: 6 rinnakkaista Sonnet-subagenttia (CSS, JS-god-files, state/screen-switch, backend-routes, shared-utils, test-coverage) + recon. Kaikki väitteet file:line-tasolla.

---

## TL;DR — mihin järjestykseen suosittelen

| # | Alue | Friktio nyt | Riski refaktorissa | Suositus |
|---|---|---|---|---|
| 1 | **Token-systeemi (3 kilpailevaa `:root` + `body.app`-remap)** | Korkein — L-V388 MC-väribugin juurisyy | Keskisuuri (pikselidiffi suojaa) | **TEE** |
| 2 | **`!important`-sodat (CSS-cascade)** | Korkea — toistuva bugilähde | Keskisuuri | **TEE** (osin riippuu #1:stä) |
| 3 | **Jaetut vakiot dedup (SUPPORTED_LANGS ×7, GRADES ×12)** | Keskisuuri, helppo win | **Matala** (kattava testikate) | **TEE ENSIN — turvallisin** |
| 4 | **Backend RLS-client + error-shape yhtenäistys** | Keskisuuri (7 reittiä poikkeaa) | Matala–keski | **TEE** |
| 5 | **JS god-file -pilkonta** | Korkea ylläpidossa | **Korkea** (4 god-screeniä ilman unit-testiä) | **OSIN** — vain testikatetut |
| 6 | **`CONVENTIONS.md`** | Estää tulevat kilpailevat patternit | Nolla | **TEE** (halpa, iso pitkä-arvo) |

**Jos joudut valitsemaan (tiukka deadline):** #3 + #4 + #1 + #6. Ne ovat suurin hyöty/riski-suhde. #5 (god-file-split) on isoin riski koska 4 kohdetta on testikatteen ulkopuolella → vaatii characterization-testit ensin.

---

## 1. God-tiedostot (suurimmat, mitä tekevät)

### CSS
| Tiedosto | Rivit | Status | Vastuut |
|---|---|---|---|
| `style.css` | 6013 | LIVE (bundle, @importtaa 9 komponenttia) | Pää-token-`:root` (~137 var), kaikki ydinkomponentit, dark-mode |
| `css/landing-editorial.css` | 3655 | LIVE (landing) | Editorial-komponentti-overridet landing.css:n päälle |
| `css/app-old-spain.css` | 2925 | LIVE (bundle viimeisenä) | `body.app` token-remap (~30 `--ed-*` + ~25 legacy-bridge) — **semanttinen divergenssipiste** |
| `css/landing.css` | 2665 | LIVE (landing) | Landing-base (nav/hero/sektiot) |
| `css/components/digikirja.css` | 2059 | LIVE (bundle) | Digikirja-lukija (täysleveä layout vs app-shell) |
| `landing.css` (root) | 1332 | **ORPHANED** | Vanha mint-green-paletti, EI linkattu mistään → poistoehdokas |

### JS
| Tiedosto | Rivit | Luonteva split |
|---|---|---|
| `js/screens/digikirja.js` | 2456 | 4-way: (a) progress/persistence, (b) sidemenu-nav, (c) per-item grading-engine, (d) phase-handlerit (writing/reading/testi/flashcard) |
| `routes/exercises.js` | 1765 | 3-way: (a) vocab/grammar/reading-generointi, (b) adaptive+checkpoint-engine, (c) admin/reporting; SR-endpointit kuuluisivat `routes/sr.js`:ään |
| `js/screens/dashboard.js` | 1689 | Orkestraattori jää; motivation-strings + heatmap-renderer + grade-widget → `features/` |
| `js/screens/vocab.js` | 1416 | preload/batch erilleen renderöinnistä; 6 answer-handler-varianttia → jaettu `gradeItem` (osin jo `features/answerGrading.js`) |
| `js/screens/settings.js` | 1107 | field-editor-kit + level-bump-modal + account-section erikseen |
| `routes/curriculum.js` | 1103 | 2-way: `curriculumContent.js` (AI-teaching) + `curriculumProgress.js` |
| `js/screens/lessonRunner.js` | 1081 | 5 item-renderöijää → `js/renderers/lesson/`; phase-engine + finalize ydin |
| `js/main.js` | 996 | hash-router (~200r) extractattavissa; password-reset + mode-picker = legacy-residue → `screens/auth.js` |

---

## 2. Duplikoitu logiikka (single-source-of-truth -ehdokkaat)

| Duplikaatti | Esiintymät | Kanoninen koti |
|---|---|---|
| **`SUPPORTED_LANGS = ["es","de","fr"]`** | **7+ erillistä** def: `lib/lukioMapping.js:311`, `lib/curriculum.js:26,29`, `routes/curriculum.js:129`, `routes/digikirja.js:25` (eri järjestys fr/de!), `routes/personalization.js:17`, `js/features/miniYO.js:16`, `js/screens/onboardingV4.js:42`, `scripts/build-reading-bank.mjs:17` | Vie `PRODUCT_LANGS` `lib/openai.js`:stä (tai uusi `lib/constants.js`) |
| **`GRADES`/`GRADE_ORDER` (I/A/B/C/M/E/L)** | **12+ hardcode**: `lib/openai.js:473` (kanon), `lib/gradeThreshold.js:22`, `lib/levelEngine.js:10`, `lib/lessonContext.js:55`, `routes/profile.js:7`, `routes/onboarding.js:32`, `routes/placement.js:191` (puuttuu I!), `js/state.js:3`, `js/features/startingLevel.js:2`, `dashboard.js:721,1085`, `home.js:212`, `exam.js:209` | Server → `lib/openai.js`; client → `js/state.js` |
| **`pointsToYoGrade` / `pointsToGrade`** | `lib/grading.js:20` (kanon), `lib/writingGrading.js:38` (oma taulu), `js/features/answerGrading.js:152` (client-mirror) | `writingGrading.js` kutsuu `pointsToYoGrade(total,20)`; client-mirror dokumentoidaan |
| **`normalizeLang` / kielimäppäys** | `lib/openai.js:31` (kanon), `js/state.js:89` `apiLang` (client-twin), `middleware/language.js:17` `resolveLang` (request-resolver — eri tarkoitus), `lib/readingBank.js:23` + `lib/writingBank.js:18` (reverse-map) | `lib/openai.js`; client-twin dokumentoidaan mirroriksi |
| **`LANG_LABEL`** | `lib/openai.js:10` (kanon, monikenttä), `scripts/build-articles.mjs:31`, `routes/onboarding.js:28` (genetiivi, legit eri) | `lib/openai.js` |
| **`getUserProfileContext` ennen AI-generointia** | 11× `routes/exercises.js`, 1× `routes/writing.js:143` | shared "build-AI-context" -helper/middleware |
| **`checkFeatureAccess`+`incrementFreeUsage` -gate** | ~9 kopiota route-handlereissa | shared gate-helper |
| **`optionalAuth` inline** | `placement.js:19`, `curriculum.js:23` (identtiset) | middleware |
| **`DAY_MS`/`WEEK_MS`** | `lib/openai.js:477` (kanon), `js/screens/onboarding.js:15` | import kanonista |

---

## 3. Kilpailevat patternit

### Screen-switch / state (memory L-V388: "3 kilpailevaa")
- **Kanoninen primitiivi:** `js/ui/nav.js:53` `show(id)` — ainoa paikka joka tekee "deaktivoi kaikki, aktivoi yksi" + modal-cleanup + shell-mode + scroll-reset. **Säilytettävä ainoana.**
- **Looginen kerros:** `js/main.js:264` `navigateTo(nav)` + hash-router (`main.js:381`). EI kutsu `show()` suoraan vaan lazy-loadereita jotka kutsuvat `show()` sisäisesti → refaktorissa pakko jäljittää joka screen-moduulin oma `show()`-kutsu.
- **Pre-paint:** `js/app-prepaint.js` — synkroninen classic-script ennen moduuligraafia, valitsee 1. screenin. Erillinen systeemi joka pidettävä synkassa hash-routerin kanssa.
- **Kuollut 3.:** `#screen-path` / `loadCurriculum` (`dashboard.js:141` "killed", CSS `display:none`) — haamu HTML:ssä, pysyvästi piilossa.

### Global state
- **Yksi kanoninen:** `js/state.js:14` `state`-objekti (ES-import joka screeniin).
- Varjo-accessit: `window.state` (read-only fallback `dashboard.js:1594`, `sidebarItems.js:32`), `window.__currentLang` (**dead guard** — kukaan ei aseta), `onboardingV4.js` oma moduuli-`state` (nimivarjostus, EI globaali), `diagnostic.js:69` oma IIFE-`state`.
- **Kielitila:** `state.language` kanoninen; `puheo:lang` = synkattu mirror (`setLanguage()` kirjoittaa molemmat). Ainoa divergenssi: `landing-lang-cta.js:30` kirjoittaa `puheo:lang` päivittämättä `state.language` (landing→app-silta, onboardingV4 lukee startissa).

### `[hidden]` vs `.hidden` vs `style.display` (kolme rinnakkaista visibility-tapaa)
- A: `.hidden{display:none!important}` (style.css:1519) — dominoiva exercise-subelementeille
- B: `element.hidden = true` (modalit, paywall, accent-bar, profile-menu, dashboard-kortit)
- C: `style.display="none"` inline (sidebar, vocab-options, spinner)
- **Riski:** app-shellissä EI globaalia `[hidden]{display:none!important}` → B-pattern alttiina class-override-bugille (L-V390). Landing korjaa lokaalisti 3× (`landing.css:169`, `landing-editorial.css:359,2246`).

### Event-wiring
- Dominoiva: per-element `addEventListener` init-aikaan. Sekundääri: delegointi (`main.js:150`, `offCanvasNav.js:123`), custom-event-bus (`puheo:open-lesson`, `puheo:profile-updated`, `puheo:render-exercise`), `.click()`-simulaatio (`digikirja.js:449`, `profileMenu.js:69`).

### Backend RLS-client (memory L-V392: `req.supabase||adminClient`)
- **Pattern A (idiomaattinen):** 9 reittiä — digikirja, exam, onboarding, personalization, placement, profile, progress, push, sr (sr käyttää `||supabase` eri muuttujanimellä).
- **Pattern B:** `getRequestDb(adminClient)` — curriculum, dashboardV2, exercises (rinnakkainen lähestyminen, EI `req.supabase`).
- **Pattern C (suojaamaton):** `stripe.js`, `email.js`, `config.js` bare `supabase`; `gdpr.js` bare `adminClient` (intentional). **Konsolidoitavat:** stripe/email/config (user-scoped readit ilman fallbackia), sr (muuttujanimi).

---

## 4. CSS-cascade-riskit (yksityiskohdat)

### Token-systeemi: 3 kilpailevaa `:root` + 2 scoped-layeria, EI single-source
- `style.css :root` (~137 var, primary), `css/tokens.css :root` (~34, additive z-index/aliakset), `landing.css :root` (~63, **ORPHANED** mint).
- `body.app` (app-old-spain.css): ~25 legacy-bridge + ~30 `--ed-*`. **Semanttiset divergenssit** (EI pelkkä re-aliasointi): `--success` `#059669`→`#3C7A4E`, `--error` `#DC2626`→`#B23B2E`, `--warn` `#D97706`→`#C99A22`, `--accent-dark`, `--accent-soft` (rgba), `--ink-faint` (oklch AA-fix). **Tämä on L-V388-väribugin juurisyy.**
- `.landing` (landing-tokens.css ~69 + landing-editorial-tokens.css ~81). `--ed-*` elää **kahdessa rinnakkaisnimiavaruudessa** (`body.app` vs `.landing`) eri arvoilla (esim. `--ed-bg-deep` `#F6F0E2` vs `#F4EEE1`).

### `!important` — inventaario ennen-tila (grep-luvut)
`style.css`:21, `app-old-spain.css`:12, `landing-editorial.css`:10, `off-canvas-nav.css`:10, `digikirja.css`:9, `landing.css`:5, `sidebar-shell.css`:2(kommentit, 0 sääntöä), `app-shell.css`:1, `landing-tokens.css`:4(reduced-motion).

**Dokumentoidut cascade-sodat:**
1. **off-canvas-nav vs app-shell/sidebar-shell** — `.app-sidebar` display/transform breakpointeilla (off-canvas omistaa `>=1024px`).
2. **digikirja vs app-shell** — `.dk-shell` taistelee `.app-main{padding:40px}`-media-queryä vastaan (digikirja.css:62 selittää).
3. **`[hidden]`-no-op** — 3 tiedostoa lisää `display:none!important` itsenäisesti.
4. **`.brand-wordmark`** — font/color `!important` 2 tiedostossa (Inter vs Mulish-perintö).
- Iso osa `!important`eista on `prefers-reduced-motion`-lohkoissa (legit, ei sota).

### `@layer`: EI käytössä tuotannossa (vain `tailwind-input.css:18`, output vain 404.html:ssä).
→ #1+#2 ratkaisu: yksi token-source + `@layer`-rakenne (reset < base < components < app < landing < utilities) joka poistaa suurimman osan `!important`eista oikealla spesifisyydellä.

---

## 5. Testikate (rauta-sääntö #2 — kattamattomia EI refaktoroida sokkona)

### Regressioverkko (aja vaiheiden välissä)
- `npm test` (vitest, ~exclude e2e) — lib/middleware-painottunut, threshold 65/60/55/65
- `npm run test:e2e` (Playwright, workers=1, auto-start)
- `node -r dotenv/config tests/verify-backbone.mjs` — register→write→relogin→read-back, kielisko­pattu
- `tests/verify-clickthrough.mjs` — 12 app-reittiä, 0 JS-erroria, ei-tyhjä DOM
- `tests/verify-isolation.mjs` — kieli + cross-user
- `tests/verify-rls-net.mjs` — DB-tason RLS
- `tests/verify-sweep.mjs` — 14 GET + 40-concurrent isolation-stress
- **Launch-gate bypass pakollinen:** `addInitScript` → `puheo_gate_ok_v1="1"` ennen `goto`.

### SAFE refaktoroida (kattava unit-testi)
`lib/openai.js`, `lib/writingGrading.js`, `lib/personalization.js`, `lib/lukioMapping.js`; routes `auth/profile/placement/gdpr/sr/dashboardV2`; CSS-komponentit (tokens/typography/button/nav/skeleton-unit-testit toimivat token-regressioverkkona) + pikselidiffi.

### DEFERRED / characterization-testi ENNEN refaktoria (EI unit-testiä)
1. `js/screens/dashboard.js` — HIGH
2. `js/screens/vocab.js` — HIGH
3. `js/screens/lessonRunner.js` — HIGH
4. `js/screens/settings.js` — MEDIUM
5. `lib/lessonContext.js` — MEDIUM (täysin kattamaton happy-path)
6. `routes/curriculum.js` — MEDIUM (vain e2e-navigointi, ei shape-testiä)
7. `routes/exercises.js` — MEDIUM (vain 401-smoke + 1 generointi-fixture)

→ Näiden god-file-split (#5) vaatii ensin characterization-testin TAI jää DEFERRED-listalle.

---

## 6. Epäjohdonmukaiset konventiot
- **Error-shape:** ~95% `res.status(500).json({error:"..."})`, mutta `stripe.js` käyttää `{error,message}`, `exercises.js:394` `{error,hint}`, `progress.js:267`+`exercises.js:973` vuotaa raa'an Supabase-error.message. EI shared `asyncHandler`/error-helper (331 try/catch hajallaan).
- **Response-envelope:** ei universaalia. `{ok:true}` = ACK ~25 paikassa, mutta data palautetaan kuorimattomina domain-objekteina (`{kurssit}`, `{exercises}`, raw `res.json(payload)`).
- **Middleware:** `requirePro`/`softProGate` importattu `exercises.js`+`writing.js`:ssä mutta EI käytössä yhdelläkään reitillä (dead import) — Pro-gating tehdään `checkFeatureAccess`-inline. `isPro` kutsutaan handler-bodyssä eikä middlewarena. `checkMonthlyCostLimit` puuttuu `curriculum.js`:stä vaikka siellä on `callOpenAI`.
- **Kielen luku requestista:** 4 ad-hoc-patternia (`normalizeLang(req.query.lang??...)`, `SUPPORTED_LANGS.has(...)`, 2× local `resolveLang`).
- **fetch:** `js/api.js:135` `apiFetch` olemassa (token-refresh+lang-injektio), mutta grammar/reading/writing-screenit käyttävät `retryable(()=>fetch())` → menettävät auto-`?lang=`-injektion (latentti fr/de-bugi, EI korjata tässä — kirjaa DEFERRED-bugiksi).

---

## DEFERRED-bugit (löydetty, EI korjata tässä loopissa)
- **B1:** grammar/reading/writing-screenit bypassaa `apiFetch` → ei auto-`?lang=` → fr/de-käyttäjä voi saada väärän kielen sisältöä (riippuu palauttaako reitti silti oikein). `js/screens/grammar.js:65`, `reading.js:34`, `writing.js:460`.
- **B2:** `routes/placement.js:191` `VALID=["A","B","C","M","E","L"]` — puuttuu "I" (muista poiketen). Mahdollinen validointiaukko.
- **B3:** `routes/digikirja.js:25` SUPPORTED_LANGS fr/de eri järjestyksessä (Set → ei vaikuta, mutta latentti).
- **B4:** `stripe.js`/`email.js`/`config.js` user-scoped readit bare `supabase`-clientilla ilman RLS-net-fallbackia (toimii nyt, mutta poikkeaa V392-invariantista).
- **B5:** `progress.js:267` + `exercises.js:973` vuotaa raa'an Supabase-error.message vastaukseen.
- **B6:** `window.__currentLang` dead guard 2 paikassa (ei aseteta koskaan).

## Poistoehdokkaat (orphan, varmistettava ennen)
- `landing.css` (root, 1332r) — EI linkattu mistään .html:stä (kaikki linkkaa `/css/landing.css`).
- `js/screens/learningPath.js` — jo poistettu (ei tiedostoa), memory korrekti.
- V2/V3-onboarding: LIVE mutta vain fallback-hasheilla (`#/aloitus-v2/-v3`); ne ovat staattisessa hot-bundlessa turhaan → `makeLazyScreen` ilman käyttäytymismuutosta.

---

## Ehdotettu vaihe­järjestys (kukin oma commit-sarja + vihreä regressio + pikselidiffi)
1. **Jaetut vakiot dedup** (#3) — turvallisin, kattava testikate, ei visuaalimuutosta. Aloita tästä.
2. **Backend RLS+error-shape yhtenäistys** (#4) — routes-testit + sweep + isolation kattavat.
3. **Token-source-konsolidointi** (#1) — yksi `:root`-totuus + `@layer`; pikselidiffi todistaa.
4. **`!important`-purku** (#2) — seuraa #3:sta.
5. **`CONVENTIONS.md`** (#6) — lukitsee uuden screenin/reitin/tehtävän lisäystavan.
6. **God-file-split** (#5) — vain testikatetut; muut characterization-testi ensin tai DEFERRED.

**Pysähdys:** odotan Marcelin reprioriointia ennen Vaihe 1:tä.
