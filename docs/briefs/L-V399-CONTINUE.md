# L-V399 — JATKOBRIEF (resume cold from here)

> **Rooli:** WRITER. Tämä jatkaa L-V399-ylläpidettävyysrefaktoria täsmälleen siitä mihin sessio 1 jäi.
> Lue ENSIN: `docs/briefs/L-V399-CLEANUP-MAP.md` (evidenssikartta) + `CONVENTIONS.md` (konventiot).
> Rauta-säännöt ja työtyyli: alkuperäinen brief + `CLAUDE.md`. Älä toista kartoitusta — se on tehty.

---

## TILA (sessio 1, 2026-06-07) — 7 commitia, kaikki vihreät & behavior-preserving

Commitit `dc465b8..2d589da` (HEAD = `2d589da`). **Ei pushattu** (behavior-preserving, ei käyttäjälle näkyvää, app-bundle koskematon).

| Vaihe | Status | Commit |
|---|---|---|
| 0 Kartoitus | ✅ valmis (`L-V399-CLEANUP-MAP.md`) | e4be937 |
| 1 Vakiot-dedup (server) | ✅ `lib/constants.js` + 7×SUPPORTED_LANGS + 5×GRADES + writingGrading→grading | 1c59482, 4e351a5 |
| 2a optionalAuth → middleware | ✅ | 13720f5 |
| 6 CONVENTIONS.md | ✅ | 29a4ce3 |
| 3a orpo landing.css (root) poistettu | ✅ | 75e33d6 |

Marcelin lukitut päätökset sessio 1:ssä:
- Järjestys = **turvallisin ensin**.
- Kattamattomat god-screenit = **characterization-testi ENNEN refaktoria** (ei sokkoa).
- RLS-client + error-shape = **DEFERRED** (jälkimmäinen = behavior change, kielletty).
- Pivot no-net-vaiheisiin (siksi 6 + 3a tehtiin ennen 3:n syvää osaa).

---

## JÄLJELLÄ — prioriteettijärjestys (tee niin monta kuin ehdit)

### A) Vaihe 3 syvä: token-konsolidointi + CSS `@layer` + `!important`-purku  ← ISOIN ARVO + ISOIN RISKI
**Skill-stack:** `ui-ux-pro-max`, `emil-design-eng`, `design-taste-frontend`, `webapp-testing`.
**Miksi oma loop:** osittainen `@layer`-migraatio KÄÄNTÄÄ cascaden (mikä tahansa layeroitu sääntö häviää layeroimattomalle riippumatta spesifisyydestä) → on tehtävä **kerralla koko bundle-entrylle**, ei rippeinä.
**Pakollinen ensin — pikselidiffi-baseline** (acceptance-kriteeri):
1. Pystytä baseline avainnäytöille ENNEN mitään CSS-muutosta: landing (`/`), aloitus/kartoitus (`#/aloitus`), tehtävä (vocab `#/sanasto`), oppimispolku (`#/oppimispolku`), pricing (`/pricing` tai `nayte`), app-koti (`#/koti`). Käytä olemassaolevaa `npm run test:visual` (`VISUAL_BASELINE=1 playwright test tests/e2e-visual.spec.js`) tai laajenna sitä. **Playwright-gate:** `addInitScript` → `puheo_gate_ok_v1="1"` ennen `goto`. **Aja localhost-originista** (ei 127.0.0.1 — CORS torjuu selaimessa).
2. Tee muutos, aja diff, **0 pikseli-delta = hyväksytty**. Punainen → peru.

**Konkreettinen työ (evidenssi kartan §4):**
- **Token-source:** style.css `:root` (~137 var, primary) + tokens.css (additiivinen) + app-old-spain.css `body.app` (`--ed-*` + legacy-bridge) + landing-*tokens.css (`.landing`). **Älä romauta arvoja** — app-old-spainin `--success`/`--error`/`--warn`/`--accent-dark`/`--accent-soft`/`--ink-faint` ovat TARKOITUKSELLA eri kuin :root (L-V388-fix). Konsolidointi = poista same-value-realiakset (kartta listaa "Same hex" -rivit), säilytä semanttiset divergenssit.
- **`@layer`-rakenne** (suositus): `@layer reset, base, tokens, components, app, landing, utilities;` bundle-entryn alkuun, kääri kukin `@import` oikeaan layeriin. Kun layer-järjestys takaa voiton, **poista `!important`it jotka olivat vain spesifisyyssotaa**.
- **`!important`-baseline (grep ennen):** `style.css` 21, `app-old-spain.css` 12, `landing-editorial.css` 10, `off-canvas-nav.css` 10, `digikirja.css` 9, `landing.css` 5. Acceptance: määrä laskenut MITATTAVASTI (grep jälkeen). HUOM: `prefers-reduced-motion`-lohkojen `!important`it ovat legit — älä laske niitä sotiin.
- **Dokumentoidut cascade-sodat (kartta §4):** off-canvas-nav vs app-shell (`.app-sidebar`), digikirja vs app-shell (`.dk-shell`), `[hidden]`-no-op (3 tiedostoa), `.brand-wordmark` font/color. Nämä @layerillä ratkeavat.
- **CSS-bundlen entry on `scripts/bundle-entry.css`** (EI css/bundle-entry.css) — `@import`-järjestys siellä ratkaisee cascaden. app-old-spain.css ladataan VIIMEISENÄ tarkoituksella.
- Päivitä `CONVENTIONS.md`:n CSS-osio lopulliseen @layer-rakenteeseen.
- **Frontti-muutos → `npm run build` ennen committia + sw.js CACHE_VERSION bump** (`npm run bump:sw`) jos STATIC_ASSETS muuttuu.

### B) Vaihe 2 loppu: RLS-client-uniformiteetti (vaatii Marcelin luvan + live net)
**Skill-stack:** `supabase`, `supabase-postgres-best-practices`, `webapp-testing`.
- `stripe.js`, `email.js`, `config.js` (ja `sr.js` muuttujanimi) käyttävät bare `supabase` (= adminClient/service-role) user-scoped readeissa → yhtenäistä `req.supabase || adminClient`-patterniin.
- **EI behavior-preserving ilman todistusta:** vaihtaa service-rolen RLS-scopattuun → aja **live** `node -r dotenv/config tests/verify-rls-net.mjs` + `verify-isolation.mjs` + `verify-backbone.mjs` (luovat throwaway-userit oikeaan Supabaseen, dev-serveri päällä). **Pyydä Marcelilta lupa prod-sivuvaikutuksiin ennen ajoa.** `.env` löytyy (6 avainta).

### C) Vaihe 5: god-file-split (characterization-testit ENNEN)
**Skill-stack:** vaihtelee tiedostoittain — backend (`supabase`...) / frontend (`ui-ux-pro-max`...) + `webapp-testing`.
- Kattamattomat (DEFERRED kartta §5): `js/screens/dashboard.js` (1689), `vocab.js` (1416), `lessonRunner.js` (1081), `settings.js` (1107), `lib/lessonContext.js`. **Kirjoita happy-dom/vitest-characterization-testi joka lukitsee nykykäyttäytymisen ENNEN pilkkomista.**
- SAFE jo nyt (kattava testi): `routes/exercises.js` (1765) ja `routes/curriculum.js` (1103) on osin katettu — silti characterization-shape-testi suositeltu ennen jakoa.
- Luonteva split kullekin: kartta §1.

### D) Vaihe 1 loppu: client-screen-vakiot (kun screenit saavat characterization-testin)
- `GRADES`/`LEVELS` re-deklaraatiot client-screeneissä (`dashboard.js:721,1085`, `home.js:212`, `exam.js:209`, `onboardingV2/V3`, `js/features/startingLevel.js`) → importoi `js/state.js`:stä (kanoninen client-LEVELS). Nämä ovat uncovered-god-screeneissä → tee Vaihe 5:n yhteydessä.
- `DAY_MS` `js/screens/onboarding.js:15` → client-mirror.

---

## DEFERRED-bugit (löydetty kartoituksessa — EI korjata refaktorissa, omat fix-loopit)
- **B1:** grammar/reading/writing-screenit bypassaa `apiFetch` → ei auto-`?lang=` → mahdollinen fr/de-kielibugi. `js/screens/grammar.js:65`, `reading.js:34`, `writing.js:460`.
- **B2:** `routes/placement.js:191` `VALID` puuttuu "I" (validointiaukko). **Älä "korjaa" sitä dedupissa.**
- **B3:** `routes/digikirja.js` SUPPORTED_LANGS järjestys (nyt PRODUCT_LANGS, ratkennut).
- **B4:** stripe/email/config bare `supabase` (= Vaihe 2B yllä).
- **B5:** `progress.js:267` + `exercises.js:973` vuotaa raa'an Supabase-`error.message`. (Behavior change → omassa fix-loopissa, ei refaktorissa.)
- **B6:** `window.__currentLang` dead guard 2 paikassa.

## Poistoehdokkaat (jäljellä)
- V2/V3-onboarding: LIVE mutta vain fallback-hasheilla (`#/aloitus-v2/-v3`), ne ovat staattisessa hot-bundlessa → `makeLazyScreen` ilman behavior-muutosta (pieni bundle-win). Varmista ettei mikään muu importtaa niitä staattisesti.

---

## SUDENKUOPAT (opittu sessio 1 — säästää aikaa)
1. **`lib/constants.js` on zero-dep tarkoituksella** — älä importtaa siihen mitään (`gradeThreshold.js` ym. luottaa siihen ettei se vedä supabasea).
2. **Testimockit:** kun lisäät exportin middlewareen jota route importtaa, `vi.mock("../middleware/auth.js")` -lohkot testeissä pitää synkata (muuten "No X export defined on mock"). Esim. `optionalAuth` piti lisätä 2 mockiin.
3. **CSS-bundlen entry = `scripts/bundle-entry.css`** (ei css/).
4. **clickthrough/Playwright pakko ajaa localhost-originista** (CORS torjuu 127.0.0.1).
5. **Tämä Windows-boksi on hidas** — täysi `npm test` voi timeoutata yhden file-hookin (`openai-fixtures.test.js`) resurssipulan takia ja näyttää punaiselta. Aja epäilty file erikseen (`npx vitest run <file>`) varmistaaksesi flakyn vs todellisen. Baseline = **1303 testiä, 86 filea**.
6. **Pikselidiffi:** loaded-CSS muuttumaton = ei tarvetta diffiin (sessio 1:n muutokset eivät koskeneet ladattua CSS:ää). Vaihe 3A on ensimmäinen joka oikeasti tarvitsee sen.
7. **Subagentit:** kartoitus tehtiin 6 rinnakkaisella Sonnet-agentilla — toimi hyvin. Käytä samaa kun tarvitset laajaa luentaa.

## Regressioverkko (aja vaiheiden välissä — vihreä JOKAISEN commitin jälkeen)
```
npm test                                          # vitest 1303/86 — ydinverkko
node --check <muokattu>.js                        # js/screens/* (vitest ei importtaa niitä)
npm run test:e2e                                   # Playwright-spec:it
npm run test:visual                                # e2e-visual baseline (Vaihe 3A)
node -r dotenv/config tests/verify-backbone.mjs    # live (lupa)
node tests/verify-clickthrough.mjs                 # localhost-origin
node -r dotenv/config tests/verify-isolation.mjs   # live (lupa)
```

## Acceptance (alkuperäisestä briefistä, jäljellä olevat)
- [ ] Pikselidiffi avainnäytöille Vaihe 3A:ssa: 0 tahatonta visuaalimuutosta.
- [ ] `!important`-määrä laskenut mitattavasti (grep ennen/jälkeen, ei reduced-motion).
- [ ] CSS `@layer`-rakenne käytössä; CONVENTIONS.md päivitetty.
- [ ] Jokainen refaktoroitu kattamaton moduuli sai characterization-testin ENNEN muutosta.
- [ ] 0 käyttäytymismuutosta; löydetyt bugit DEFERRED-listalla, ei korjattu.
- [ ] `npm run build` + sw CACHE_VERSION bump frontti-muutoksista; IMPROVEMENTS.md +1 rivi per loop.

## Push-sääntö
Behavior-preserving server/docs = ei pushia (ei käyttäjälle näkyvää). **Vaihe 3 CSS-konsolidointi KOSKEE tuotantoa** → push OK vasta kun koko regressio + pikselidiffi vihreä. Kysy jos epäselvä.
