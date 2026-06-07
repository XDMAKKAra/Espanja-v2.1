# CONVENTIONS.md — yksi dokumentoitu tapa lisätä asioita

> Tämä dokumentti kuvaa **miten Puheo-koodikantaan lisätään uusi screen, reitti, tehtävätyyppi,
> vakio tai tyyli — yhdellä tavalla**, jotta uusia kilpailevia patterneja ei synny.
> Syntyi L-V399-ylläpidettävyysrefaktorin yhteydessä (evidenssi: `docs/briefs/L-V399-CLEANUP-MAP.md`).
> Rooli-, skill-stack- ja työtyylisäännöt ovat `CLAUDE.md`:ssä — tämä täydentää sitä, ei korvaa.

---

## Yleisperiaatteet

- **Koodi + kommentit: englanti. Käyttäjälle näkyvät UI-stringit + commit-viestit: suomi.**
- **Suomi-teksti käyttäjälle → aja `humanizer` ennen committia** (ks. CLAUDE.md).
- **Pieni tiedosto > iso.** Yksi tiedosto = yksi vastuu. Jos tiedosto kasvaa yli ~1000 riviä, harkitse pilkkomista vastuun mukaan.
- **DRY:** ennen kuin kirjoitat vakion/helperin, etsi onko se jo olemassa (alla kanoniset kodit).

---

## Tiedostorakenne (mihin mikä kuuluu)

```
server.js            — Express entry (paikallinen dev/prod)
api/index.js         — Vercel serverless entry — MOLEMMAT pitää mountata uusi reitti
routes/*.js          — API-reitit (yksi tiedosto per domain)
middleware/
  auth.js            — requireAuth, optionalAuth, isPro, requirePro, checkFeatureAccess, getUserTier
  rateLimit.js       — rate-limiterit
  costLimit.js       — checkMonthlyCostLimit (AI-reitit)
  language.js        — resolveLang(req) — kielen luku requestista
lib/
  constants.js       — JAETUT VAKIOT (zero-dep): PRODUCT_LANGS, GRADES, GRADE_ORDER, DAY_MS, WEEK_MS
  openai.js          — OpenAI-wrapper + normalizeLang + LANG_LABEL (re-exporttaa constants.js:n)
  grading.js         — pointsToYoGrade (YO-arvosanan ainoa kynnyslähde)
  writingGrading.js  — kirjoitelma-rubriikki (delegoi grading.js:lle)
app.html             — SPA: KAIKKI screen-markup (#screen-* elementit)
js/
  state.js           — KANONINEN client-state (`state`-objekti) + LEVELS (client-mirror) + apiLang
  api.js             — apiFetch (token-refresh + ?lang=-injektio) + retryable + humanizeApiError
  ui/nav.js          — show(id) — AINOA screen-switch-primitiivi
  main.js            — bootstrap + hash-router (navigateTo, HASH_NAV/NAV_HASH)
  screens/*.js       — per-screen-logiikka (yksi tiedosto per screen)
  features/*.js       — jaetut UI-palaset (paywallModal, accentBar, profileMenu, answerGrading…)
css/
  style.css          — primary :root-tokenit + ydinkomponentit
  tokens.css         — ADDITIIVISET tokenit (z-index, aliakset) — ei redefinoi olemassaolevia
  app-old-spain.css  — body.app token-layer (--ed-*) — ladataan bundlessa VIIMEISENÄ
  landing*.css       — landing-sivujen tyylit (.landing-scopattu)
  components/*.css    — per-komponentti/-screen-tyylit
scripts/bundle-entry.css  — CSS-bundlen entry (@import-järjestys ratkaisee cascaden; build-bundle.mjs)
data/courses/{es,fr,de}/  — pre-generoidut oppitunnit (8 kurssia × ~90 lessonia per kieli)
tests/               — vitest *.test.js + Playwright *.spec.js + verify-*.mjs (selkäranka)
```

---

## Jaetut vakiot — ÄLÄ redeclaroi

| Vakio | Kanoninen koti (server) | Kanoninen koti (client) |
|---|---|---|
| Tuetut kielet | `lib/constants.js` → `PRODUCT_LANGS` (Set) | importtaa server-puolelta ei onnistu → käytä `js/state.js`-mirroria |
| YTL-arvosanat I/A/B/C/M/E/L | `lib/constants.js` → `GRADES` / `GRADE_ORDER` | `js/state.js` → `LEVELS` |
| Aikavakiot | `lib/constants.js` → `DAY_MS` / `WEEK_MS` | sama, client-mirror |
| Kielinormalisointi (es↔spanish) | `lib/openai.js` → `normalizeLang()` | `js/state.js` → `apiLang()` (dokumentoitu mirror) |
| Kielen luku requestista | `middleware/language.js` → `resolveLang(req)` | — |
| YO-arvosanan kynnys | `lib/grading.js` → `pointsToYoGrade(points, max)` | `js/features/answerGrading.js` (dokumentoitu mirror) |

**Sääntö:** `lib/constants.js` on **zero-dependency** — älä importtaa siihen mitään. Näin myös kevyet
moduulit (esim. `lib/gradeThreshold.js`) voivat käyttää sitä vetämättä mukaan supabasea/OpenAI:ta.
Client (`js/`) ei voi importtata server-moduuleja → client-mirrorit ovat sallittuja, mutta merkitse ne
kommentilla joka osoittaa server-lähteeseen.

---

## Uusi screen (SPA)

1. **Markup:** lisää `#screen-<nimi>` elementti `app.html`:iin (luokka `.screen`).
2. **Moduuli:** `js/screens/<nimi>.js`, exporttaa init/render-funktio.
3. **Reititys:** rekisteröi `main.js`:n `HASH_NAV`/`NAV_HASH`-mappeihin; isot/harvoin käytetyt → `makeLazyScreen` (lazy import).
4. **Screen-vaihto:** käytä **`show(id)`:tä** (`js/ui/nav.js`) ainoana tapana näyttää screen. Älä toggle `.active`-luokkaa käsin äläkä `style.display`-suoraan screen-tasolla — `show()` hoitaa modal-cleanupin, shell-moden ja scroll-resetin.
5. **CSS:** `css/components/<nimi>.css`; lisää `@import url('...') layer(components);` `scripts/bundle-entry.css`:ään. Käytä **`layer(components)`** (ei `base`) — uusi sääntö voittaa silloin legacy-`base`-cascaden layer-järjestyksellä ilman `!important`-taistelua (ks. CSS-säännöt: @layer). Todella globaalit one-off-pakotteet → `layer(utilities)`.
6. **Kieli:** lue aktiivinen kieli `state.language`:sta (EI suoraan `localStorage["puheo:lang"]`).

## Uusi API-reitti

1. **Tiedosto:** `routes/<domain>.js`.
2. **Mount:** rekisteröi **sekä `server.js`:ssä ETTÄ `api/index.js`:ssä** (muuten 404 tuotannossa).
3. **Auth:** käytä `requireAuth` (pakollinen) tai `optionalAuth` (vieras sallittu) `middleware/auth.js`:stä. Älä tee inline-JWT-verifiointia.
4. **DB-client:** käyttäjän omaan dataan **`const supabase = req.supabase || adminClient;`** (RLS-scopattu per request, L-V392). Jaettuun/admin-dataan bare `adminClient` kommentilla miksi.
5. **Virhe:** `res.status(<koodi>).json({ error: "<koodi-tai-viesti>" })`. **Älä vuoda raakaa Supabase-`error.message`a** vastaukseen.
6. **AI-reitti:** lisää `aiLimiter` + `aiGlobalDailyLimiter` + `checkMonthlyCostLimit` -stack.
7. **Kieli:** `normalizeLang(resolveLang(req))` kun reitti on kieliskooppinen.

## Uusi tehtävätyyppi (exercise/item)

1. Renderöinti seuraa olemassa olevia item-tyyppejä (mc/typed/translate/gap_fill/match/reading_mc).
2. Pisteytys: käytä jaettua `js/features/answerGrading.js`:ää, älä kirjoita omaa graderia screeniin.
3. YTL-arvosana: `lib/grading.js` (server) / `answerGrading.js` (client) — ei uutta kynnystaulua.
4. Sisältö suomeksi → `humanizer` + EXERCISE-skill-stack (ks. CLAUDE.md).

---

## CSS-säännöt

- **@layer-arkkitehtuuri (L-V399 A2):** app-bundle (`scripts/bundle-entry.css`) deklaroi `@layer base, components, utilities;` ja kaikki nykyinen legacy-CSS on `base`-layerissa. Layer-järjestys: `base` < `components` < `utilities`. **Uusi komponentti-CSS → `layer(components)`**, jolloin se voittaa legacy-`base`:n layer-järjestyksellä ilman spesifisyystaistelua tai `!important`ia. `utilities` = harvinainen globaali pakote. **HUOM:** `base` on yksi layer tarkoituksella — sen sisällä cascade toimii kuten ennen (spesifisyys + source-order). Älä pilko `base`:a ali-layereihin: se kääntäisi olemassaolevia cascadeja eikä ole behavior-preserving (todistettavissa vain 5 pinnan pikselidiffillä, ei koko appin).
- **Token-lähteet ovat KONTEKSTIKOHTAISIA, älä dedupoi yli kontekstien:** kukin token-tiedosto palvelee eri sivujoukkoa, joten "sama nimi eri tiedostossa" ei ole turha duplikaatti vaan eri konteksti.

  | Token-tiedosto | Konteksti (mitkä sivut) | Rooli |
  |---|---|---|
  | `style.css :root` | app-bundle (app.html) | primary app-tokenit |
  | `css/tokens.css :root` | app **+ kaikki artikkelit/*.html** | additiiviset (z-index, aliakset) — EI redefinoi style.css:ää |
  | `css/app-old-spain.css body.app` | app-bundle | `--ed-*` + legacy-bridge (Old-Spain-remap, L-V388-divergenssit) |
  | `css/landing-*tokens.css .landing` | landing-sivut | landing-scope |

  Uusi token → lisää oikeaan olemassaolevaan kontekstiin, älä luo uutta `:root`-lohkoa. **Älä poista tokenia olettaen toisen tiedoston kattavan sen** — esim. tokens.css elää artikkelisivuilla ilman style.css:ää, joten sen tokenin poisto rikkoo artikkelit (L-V399 A2 -löydös).
- **`!important` vain `@media (prefers-reduced-motion)` -lohkoissa.** Layout-/väri-`!important` = merkki cascade-ongelmasta → korjaa **`layer(components)`-järjestyksellä** tai spesifisyydellä, älä lisää uutta `!important`ia. **Varo:** `!important` *kääntää* layer-järjestyksen (matalan layerin `!important` voittaa korkeamman layerin normaalisäännön), joten `!important`ien poisto layeroinnin yhteydessä vaatii tapauskohtaisen analyysin — ei blanket-poistoa.
- **Älä lisää uutta stylesheettiä** ennen kuin olemassaoleva ei riitä — kilpailevat sheetit ovat dokumentoitu bugilähde (L-V388).
- **Näkyvyys:** käytä `.hidden`-luokkaa (`display:none !important`, style.css) TAI `element.hidden = true`. Jos käytät `[hidden]`-attribuuttia elementtiin jolla on `display`-luokka, varmista `[hidden]{display:none !important}` -guard (attribuutti on muuten no-op).
- **Lämpimät värit:** ei pure `#000`/`#fff` — warm-black/cream (ks. CLAUDE.md anti-slop).

---

## Verifiointi ennen committia (regressioverkko)

```bash
npm test                                              # vitest (1303 testiä) — nopea, ydinverkko
node --check <muokattu>.js                            # parse-tarkistus js/screens/* (vitest ei importtaa niitä)
node -r dotenv/config tests/verify-backbone.mjs       # live: register→write→relogin→read-back
node tests/verify-clickthrough.mjs                    # Playwright: 12 reittiä, 0 JS-virhettä (aja localhost-originista)
node -r dotenv/config tests/verify-isolation.mjs      # kieli + cross-user
npm run test:e2e                                       # Playwright-spec:it
```

- **Playwright-gate:** spec:n pitää asettaa `puheo_gate_ok_v1="1"` `addInitScript`illa ennen `goto`.
- **Frontti-muutos → `npm run build`** ennen committia (app.html lataa `/app.bundle.js`+`.css`).
- **Jos muutat `sw.js` STATIC_ASSETS -listaa → BUMP `CACHE_VERSION`** (`npm run bump:sw`).
- **Push Verceliin = vain käyttäjälle näkyvät muutokset** (ks. CLAUDE.md).

---

## Behavior-preserving -refaktorin sääntö (L-V399)

Kun siivoat rakennetta: **käyttäytyminen ei muutu, vain rakenne/nimet/dedup.** Jos löydät bugin,
kirjaa se erilliseen DEFERRED-listaan (`L-V399-CLEANUP-MAP.md`), älä korjaa samassa refaktorissa.
Älä refaktoroi testikatteen ulkopuolista moduulia ilman characterization-testiä ensin.
