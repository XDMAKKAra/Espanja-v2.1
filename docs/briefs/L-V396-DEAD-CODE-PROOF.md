# L-V396 — Dead-code proof (zombie-consolidation)

**Ajettu:** 2026-06-06. **Tulos:** kaikki neljä briefin "tunnettua zombieta" oli JO poistettu tämän session aiemmissa loopeissa (L-V392 P1-1 + L-V394c/d/e). Tämä loop = todisti kuolleisuuden uudelleen, ajoi selkäranka-baselinen vihreäksi (Marcelin flaggaama P0) ja teki täyden regressio-klikkauksen. **Ei uusia poistoja, ei koodimuutoksia → ei pushia** (selkäranka + isolation + click-through ovat tests/* = Claude-internal).

---

## Vaihe 0 — BASELINE (ennen mitään): kaikki vihreä

| Verifiointi | Tulos |
|---|---|
| `tests/verify-backbone.mjs` (uusi käyttäjä → write-ketju → relogin → data tallessa, oikea kieli) | **15/15 ALL PASS** |
| `tests/verify-isolation.mjs` (cross-user + cross-language eristys) | **ALL PASS** |
| `npm test` (vitest) | **1286/1286 PASS** (85 tiedostoa) |

→ Marcelin flaggaama P0 (selkäranka ei vihreä?) **EI ole P0** — selkäranka on vihreä reaalipalvelinta + Supabasea vasten.

---

## Vaihe 1 — Kuolleisuuden todistus (grep koko repo, live-koodihaku)

### Zombie 1 — `js/screens/learningPath.js`
- **Tila: POISTETTU** (L-V394c). `test -f js/screens/learningPath.js` → GONE.
- Wiring poissa: `grep "initLearningPath|_learningPathRef|screens/learningPath" js/` → 0 osumaa.
- **Tasokoe-kytkös (briefin pelko) ratkennut:** placement-screen (`js/screens/placement.js`) renderöi OMIIN markupeihinsa `#screen-placement-test` + `#screen-placement-results` (rivit 80, 280). Zero viittausta `screen-mastery`/`learningPath`/`mastery`. Eli jaettua kuollutta markupia ei ole — tasokoe on itsenäinen.
- Live `/api/learning-path` + `lib/learningPath.js` (getUserPath) JÄÄVÄT (profile.js + writingProgression käyttävät) — eri asia, elossa, ei poistettu.

### Zombie 2 — mastery-test (unreachable)
- **Tila: POISTETTU** (L-V394c). Reitit `/api/mastery-test/*` poissa: `grep "mastery-test|mastery-intro|mixed-review" routes/ api/ js/ lib/` → 1 osuma, kommentti `routes/progress.js:281`.
- Markup poissa: `grep "screen-mastery|mastery-intro|mastery-result" app.html` → 1 osuma, kommentti `app.html:1364` ("L-V394: ... removed").
- Kanoninen adaptiivinen = `lib/levelEngine.js` + `user_level`/`user_mastery` (elossa). **Yksi tila, ei kolmatta.**

### Zombie 3 — curriculum `loadCurriculum`-zombie
- **Tila: POISTETTU** (L-V394d). `grep "loadCurriculum" js/` → 5 osumaa, KAIKKI kommentteja (teachingPanel.js:247, curriculum.js:10+345, lessonResults.js:25, lessonRunner.js:27). 0 live-kutsua.
- Live `openLesson`-ketju curriculum.js:ssä JÄÄ (jaetut helperit).

### Zombie 4 — `user_level_progress` phantom-taulu
- **Tila: PUHDAS** (upsertit poistettu L-V392 P1-1). `grep "user_level_progress" routes/ api/ lib/ js/ middleware/ server.js` → 5 osumaa, KAIKKI kommentteja (placement.js:164+221, progress.js:40+280+301). 0 elävää koodiviittausta.
- Migraatiohistoria (`migrations/011_adaptive_levels.sql`) säilyy — sallittu.

---

## Vaihe 2 — Poisto
**Ei tehtävää.** Kaikki neljä kohdetta oli jo poistettu/puhdistettu. Mitään ei poistettu tässä loopissa → ei riskiä, ei diffiä.

---

## Vaihe 3 — Regressio (full-app logged-in click-through)

`tests/verify-clickthrough.mjs` (kirjautunut PRO-testitili, 12 reittiä, kerää uncaught + console.error, mittaa renderöityneen sisällön):

| | tulos |
|---|---|
| JS-virheet (uncaught + console.error) | **0** |
| Tyhjät ruudut | **0** |
| Reittejä testattu | 12 |

Jokainen reitti renderöi oman screeninsä sisällöllä: `screen-home`, `screen-oppimispolku-index`, `screen-course-detail`, `screen-mode-reading`, `screen-mode-writing`, `screen-profile`, `screen-settings`, `screen-digikirja`. **Yksikään reitti ei päätynyt tapettuun `#screen-path`:iin** → kuollut screen on aidosti viittaamaton ja kaikki live-reitit toimivat. (sanasto/puheoppi → oppimispolku-index ja koeharjoitus → home ovat tarkoituksellisia mode-first-uudelleenohjauksia, eivät rikkoutumisia; ei tyhjää, ei virhettä.)

**Harness-huomio:** click-through pakko ajaa originista `http://localhost:3000` EI `127.0.0.1` — `API=window.location.origin` + palvelimen CORS-allowlist (`ALLOWED_ORIGINS`/`APP_URL=localhost:3000`) torjuu 127.0.0.1-originin (selain lähettää Origin-headerin, node-fetch ei → siksi verify-backbone/-isolation menevät läpi 127.0.0.1:llä mutta selain ei).

---

## Acceptance criteria -kuittaus
- [x] Jokainen kohde todistettu saavuttamattomaksi (yllä, grep-evidenssi).
- [x] Selkäranka-Playwright vihreä ennen (baseline). Jälkeen = sama (0 koodimuutosta) → before==after triviaalisti.
- [x] `learningPath.js` poistettu + tasokoe toimii omalla markupillaan (verifioitu placement.js).
- [x] Mastery-testi: yksi tila (poistettu).
- [x] `grep user_level_progress` → 0 elävää koodiviittausta (vain kommentit + migraatiohistoria).
- [x] verify-isolation + vitest + click-through vihreät.
- [x] Full-app click-through: ei tyhjää ruutua / konsolivirhettä / kuollutta nappia.
- [x] Ei frontti-bundle-kosketusta → ei build/sw-bumppia tarvita.
