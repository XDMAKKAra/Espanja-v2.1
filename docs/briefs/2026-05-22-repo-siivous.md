# BRIEF: Repo-siivous — dead code + docs + legacy shims + AI-slop

**Päivä:** 2026-05-22
**Versio:** v272 (varattu — älä commit ennen kuin v270 ja v271 ovat mainissa)
**Tilaaja:** Marcel (monamalou@gmail.com)
**Toteuttaja:** VS Code Claude agent
**Toteutustapa:** Yksi iso PR, kaikki 4 scopea kerralla
**Edeltävät:** v270 (Jatka harjoittelua -fix), v271 (dashboard-redesign) — odota että molemmat on merged mainiin ENNEN tämän aloittamista

---

## Tavoite

Poista repoosta kaikki turha niin että jäljellä on vain mitä Puheo tarvitsee toimiakseen. Lopputulos: pienempi diff-pinta-ala, nopeampi build, ei kuolleita reittejä jotka hämmentävät tulevia agentteja.

---

## Scope (4 aluetta, yhdessä PR:ssä)

### A. Dead code & unused files

**Pakolliset poistot:**
- `db.js` juuressa — CLAUDE.md sanoo "db.js exists but is unused legacy — Supabase is the real database". Verifioi grepillä että mikään ei importtaa, sitten poista.
- Vanhat `chunks/app-chunk-*.js` jotka eivät enää löydy `app.bundle.js`:n importeista — esbuild generoi uudet hashit joka buildissa, vanhoja jää orvoiksi.
- Mahdolliset `.bak`, `.old`, `.copy`, `~`, `tmp_*` -tiedostot — etsi `git ls-files | grep -E '\\.(bak|old|copy|tmp)$|~$'`.

**Etsi ja ehdota (älä poista ilman vahvistusta jos epävarma):**
- Aja `npx depcheck` → listaa npm-deps joita ei käytetä missään. Poista varmoista vain ne joita käytetään suoraan applikaatiokoodissa, ei dev-toolingia (vitest, esbuild, playwright konfiguraatioista voi tulla false-positiveja).
- Aja `npx knip` tai `npx unimported` → listaa unused exports & unused files. Käy lista läpi käsin — älä luota työkaluun sokeasti, varsinkin lazy-loadattujen screen-moduulien kanssa.
- Grep `console.log` / `console.debug` koko `js/`, `routes/`, `middleware/`, `lib/` -kansioista — poista debug-loggit, säilytä `console.error` ja `console.warn`.
- Etsi viittaamattomat funktiot ja export:it `app.js`:stä (2300+ riviä, suurin todennäköisyys kuolleelle koodille).

**EI saa poistaa:**
- `routes/stripe.js` ja sen 503/410 placeholderit — memory `feedback_keep_payment_infra.md` sanoo Stripe-infra säilyy seuraavaan L-STRIPE-1 -looppiin asti.
- `middleware/auth.js`:n `isPro`/`requirePro`/`softProGate` — käyttäjien Pro-statukset luetaan näistä, ÄLÄ koske vaikka näyttäisi käyttämättömältä koodipoluilta.
- `lib/supabase.js`:n `adminClient` ja `createUserClient` — v260–v269 security-pass nojaa näihin.
- Test-account-koodi (`TEST_PRO_EMAILS`, `TEST_FREE_EMAILS` env-vars + niiden lukukoodi) — käytössä manuaalisessa testauksessa.

### B. Vanhat dokumentit & arkistot

**Tarkista jokainen markdown-tiedosto `docs/`:ssa ja juuressa, päätä per tiedosto:**

Päätöskaavio:
1. Onko sisältö **ajantasainen ja viitattu** (esim. README:stä, CLAUDE.md:stä, tai aktiivinen handoff)? → **säilytä**
2. Onko sisältö **historiallisesti tärkeä** (esim. päätöksen perustelu jota tarvitaan tulevaisuudessa)? → **siirrä `docs/archive/`** jos ei jo ole
3. Onko se **vanhentunut handoff/next-session-prompt** jonka tilanne on jo ratkennut? → **poista**

Tunnetut kandidaatit (verifioi ennen poistoa):
- `docs/NEXT_SESSION_PROMPT.md` — jos sisältö koskee jo merged feature-tasoa, poista
- `docs/HANDOFF_PROMPT_2026_05_20.md` — vanhentunut, koska 05-22 brief korvaa
- `docs/archive/IMPROVEMENTS_PRE_AUDIT.md` — jo arkistoitu, mutta tarkista onko siihen viittauksia mistään aktiivisesta
- `PUHEO_NETTISIVU_V2.md` (juuressa) — siirrä `docs/archive/`:n jos sisältö relevantti, muuten poista
- Mahdolliset `AGENT_PROMPT_*.md` jotka ovat memory:n `feedback_lesson_canonical_prompts.md`:n mukaan canonical — säilytä, mutta varmista että ne ovat oikeassa paikassa
- `IMPROVEMENTS.md` — **älä poista**, tämä on aktiivinen ledger

**EI saa poistaa:**
- `README.md`, `CLAUDE.md`, `MEMORY.md`, `package.json`, `vercel.json`, `.env.example`
- `docs/test-accounts.md` ja `docs/seo-keywords.md` (näyttävät aktiivisilta)

### C. Legacy-koodin shimit (varovasti)

**Käy läpi:**
- `email.js` (juuressa) — onko kaikki template-funktiot käytössä? `routes/email.js` viittaa joihinkin; etsi unused.
- `routes/`-hakemisto — onko reittejä joita ei kutsuta frontendista? Aja `grep -r "fetch.*\\/api\\/" js/ app.js` ja vertaa `routes/`:n reitti-defaultteihin.
- `middleware/` — onko middleware-funktioita joita ei käytetä `routes/`:ssä?
- `lib/openai.js` — jos siellä on vanhoja prompt-templaatteja jotka eivät enää ole käytössä, poista.

**Sääntö:** jos epävarma, **jätä paikalleen ja merkitse `// TODO(siivous v272): used?` -kommentilla**. Älä poista mitään mikä voisi olla payment-, auth- tai content-generointi-flowssa ilman 100% varmuutta.

**EI saa poistaa:**
- LemonSqueezy-stubit (memory: `feedback_keep_payment_infra.md`)
- Stripe-placeholderit (sama memory)
- Email-verification-flow (`routes/auth.js`:ssä), vaikka se olisi nyt vähemmän käytössä

### D. AI-slop placeholder-copy & rikki UI

**HUOM:** v271 dashboard-redesign hoitaa Aloitus-näytön slopin. Tämä brief koskee **muita** näyttöjä.

**Etsi ja korjaa:**
- `grep -rn "font-family.*Fraunces" js/ *.css` → varmista että italic Fraunces on VAIN hero-otsikoissa, ei pikku-UI-elementeissä
- `grep -rn "Ladataan…\\|Ladataan\\.\\.\\." *.html *.js js/` → vaihda skeleton-loaderiin tai poista
- `grep -rn "—" *.html *.js js/ *.css` → em-dash (—) ei saa esiintyä suomi-UI-tekstissä; vaihda joko tavuviivaan tai kahteen pisteeseen
- Etsi placeholder-otsikot: "Lorem ipsum", "Esimerkki", "TODO", "TBD", "Coming soon", tyhjät `<h2></h2>`-tagit
- Etsi rikki napit: `<button>`:t joilla ei ole onclick / event-listeneriä eikä type="submit" → joko poista tai connect handler
- Etsi screenit joissa on AI-slop-symmetria (4 identtistä korttia samalla mitalla samalla eyebrowilla) — flagaa briefiin v273:lle, älä korjaa nyt

**Säännöt:**
- Suomi-UI-teksti pitää ajaa humanizer-säännöt läpi (memory: `feedback_humanizer_required.md`): ei em-dash, ei "kalibroitu"-sanaa, ei rule-of-three -listoja kaikkialla
- AI-slop-check (memory: `feedback_ai_slop_check_every_frontend.md`)

---

## Toteutusjärjestys (pakollinen)

1. **Baseline-snapshot**: `git status` + `npm run build` + `npm test` + Playwright smoke-test (kirjaudu, avaa Aloitus, ota screenshot). Tallenna outputit `docs/briefs/siivous-baseline.log`. Tämä on totuus jota verrataan lopussa.
2. **Aja työkalut**: `npx depcheck`, `npx knip` (tai `npx unimported`), tallenna raportit `docs/briefs/siivous-tool-reports/` -kansioon (älä committaa raportteja PR:n, ne ovat scratchpadia).
3. **Tee poistot batchina per scope (A → B → C → D)**, jokaisen batchin jälkeen:
   - `node --check` jokaiselle muokatulle JS-tiedostolle
   - `npm test`
   - `npm run build`
   - Jos joku failaa, palauta batch ja siirry eteenpäin (älä yritä korjata mid-batchissa)
4. **Lopuksi**:
   - Aja Playwright täysi smoke: kirjautuminen + Aloitus + Settings + Kurssipolku + ainakin yksi mode-näyttö
   - Vertaa screenshotteja baselineen — visuaalisia muutoksia EI saa tulla (paitsi D-scopen korjauksista)
   - `npm run build` → bundlet stagattu
   - Bumpaa `sw.js` CACHE_VERSION jos `STATIC_ASSETS`-lista on muuttunut

---

## Skill-stack

Aja kaikki nämä Skill-toolilla aidosti ennen ensimmäistä Write/Edit/Bash-kutsua:

- **SUPABASE/BACKEND**: `supabase`, `supabase-postgres-best-practices` (koska kosket routes/ ja middleware/)
- **FRONTEND**: `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng` (koska D-scope koskee UI:ta)
- **TESTING**: `webapp-testing`, `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `superpowers:systematic-debugging`

Aloita vastauksesi rivillä `Skills invoked: <lista>`.

---

## Commit & PR

- **Yksi commit**, message: `chore(siivous): dead code + docs + legacy shims + slop (v272)`
- PR-otsikko: `chore: repo-siivous v272`
- PR-bodyssa lista mitä poistettiin per scope + linkki tähän briefiin
- Lisää rivi `IMPROVEMENTS.md`:hen: `v272 — chore: repo-siivous (poistettu N tiedostoa, M unused dep, K AI-slop-fix)`

---

## Onnistumiskriteerit

- [ ] `npm test` PASS (sama tai parempi kuin baseline)
- [ ] `npm run build` PASS, bundlet stagattu
- [ ] Playwright smoke PASS, ei visuaalisia regressioita Aloituksen ulkopuolella
- [ ] `node --check` PASS kaikille JS-tiedostoille
- [ ] Stripe-koodi koskemattomana (`git diff routes/stripe.js` tyhjä)
- [ ] Pro/Free-middleware koskemattomana (`git diff middleware/auth.js` tyhjä)
- [ ] `lib/supabase.js` exports koskemattomana
- [ ] AI-slop-checklist (memory: `feedback_ai_slop_check_every_frontend.md`) ajettu manuaalisesti
- [ ] PR avattu mutta EI mergattu — odota Marcelin lupa

---

## Don't

- ÄLÄ poista mitään payment-, auth-, lib/supabase- tai test-account-koodia ilman 100% varmuutta
- ÄLÄ poista `memory/`-hakemistoa tai sen tiedostoja — ne ovat auto-memory eivätkä kuulu repoon
- ÄLÄ refaktoroi koodia siivouksen ohessa — vain poistoja ja AI-slop-fixejä, ei rakennemuutoksia
- ÄLÄ pushaa Verceliin (memory: `feedback_vercel_push_threshold.md`) — tämä on chore, ei näkyvä muutos
- ÄLÄ mergaa PR:ää ennen lupaa
- ÄLÄ syytä cachea — verifioi clean-buildillä
- ÄLÄ vie muutoksia mainiin jos jokin baseline-testi failaa
