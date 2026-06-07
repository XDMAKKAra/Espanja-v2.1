# L-V402 — dead-code-häntä #2 + onboarding-kuonan siivous

> **Rooli:** WRITER. Jatkaa L-V400 + L-V401 -haamusiivousta. Lue ENSIN muistista
> `project_v400_ghost_screens_removed` (sis. L-V401-tail-yhteenvedon) + tämä brief.
> **Skill-stack:** FRONTEND-M (`frontend-design`, `ui-ux-pro-max`) + TESTING-M
> (`webapp-testing`). Onboarding-osassa jos kosket suomi-microcopyyn → lisää `humanizer`.

## Konteksti

L-V400/401 poistivat `#screen-path` + `#screen-dashboard` -haamut, renderDashboard-
klusterin, `renderDailyChallengeInto`:n ja cross-file dead dash-*/path-*-CSS:n. Read-only
dead-code-sweep (2026-06-07) löysi vielä alla olevat. **Kaikki tämän briefin kohteet ovat
inerttiä koodia — 0 käyttäjälle näkyvää muutosta odotettavissa.** Sen takia pikseliharness
0-diff on jokaisen CSS/HTML-commitin pää-gate. Jokainen alla numeroitu kohta = **oma commit
+ oma verify**. Älä niputa.

**OUT OF SCOPE (älä koske):**
- `routes/email.js` -endpointit ja koko sähköposti-stack — tuleva feature, ei nyt.
- Muut frontend-kutsumattomat API-reitit (`/api/exercises/checkpoint/*`, `/adaptive-*`,
  `/focus-session`, `/exam/history`, `/sr/forecast`, `/api/grade` (vs elävä `/grade/advisory`),
  `/curriculum/tutor-message` ym.) — osa voi olla keskeneräistä/tulevaa featurea. **Älä poista
  server-reittejä tässä loopissa.** Erillinen tutkimusloop tarvittaessa.

---

## OSA A — varma dead code (0 viitettä elävässä koodissa)

### A1. `dailyChallenge.js` kokonaan kuollut → poista koko ketju

`js/features/dailyChallenge.js`. L-V401 jätti `markModeCompletedToday`-ketjun koska briefi
sanoi sen eläväksi — mutta sweep todisti sen **write-only-kuolleeksi**: ketju kirjoittaa
`localStorage["puheo_dailychallenge_done"]`-flagin jota **ei lueta missään**.

**VERIFY ENSIN (pakollinen ennen poistoa):**
```bash
grep -rn "puheo_dailychallenge_done\|dailyChallenge\|markModeCompletedToday\|getDailyChallenge" js/ app.html | grep -v app.bundle | grep -v chunks/
```
Jos `puheo_dailychallenge_done`:lla on **vain kirjoitus** (ei `getItem`-lukua) ja ainoa
`markModeCompletedToday`-kutsuja on `dashboard.js:~265` (saveProgress) → koko moduuli on
kuollut sivuvaikutus.

**Toteutus jos vahvistuu:**
- Poista koko `js/features/dailyChallenge.js`.
- Poista import + kutsu `js/screens/dashboard.js`:stä (rivi ~7 import, ~265 kutsu saveProgressissa).
- Poista `/js/features/dailyChallenge.js` `sw.js` STATIC_ASSETS-listalta (muuten precache 404aa).
- Poista `tests/`-viittaukset jos niitä on (grep todisti ei ollut L-V401:ssä, varmista uudelleen).

**Jos `getItem("puheo_dailychallenge_done")` löytyykin jostain** (esim. suunniteltu streak/
badge-feature) → ÄLÄ poista, raportoi sen sijaan mihin flagia luetaan.

### A2. Orpo-moduuli `js/screens/dash-cta.js`

`renderDashboardCta`/`selectDashboardCta` ei importata mistään elävästä (vain
`tests/dash-cta.test.js` + sw-precache). **Verify:**
```bash
grep -rn "dash-cta\|renderDashboardCta\|selectDashboardCta" js/ app.html | grep -v app.bundle | grep -v chunks/
```
0 ei-testi-osumaa → poista `js/screens/dash-cta.js` + `tests/dash-cta.test.js` + sw-precache-rivi
(~`sw.js:154`). vitest-count laskee testimäärällä (odotettua).

### A3. Orpo-moduuli `js/diagnostic.js`

IIFE joka vaatii `#mini-diag`-elementin jota ei ole missään HTML:ssä → ei suorita mitään.
**Verify:** `grep -rn "mini-diag" **/*.html` = 0 **ja** mikään `<script>` app.html:ssä ei lataa
`/js/diagnostic.js` (vain sw-precache `~sw.js:129`). Jos vahvistuu → poista `js/diagnostic.js`
+ sw-precache-rivi.

### A4. Kuollut `.mastery-*`-CSS (`style.css`)

`#screen-mastery-intro/-result` poistettu (app.html:1139 vahvistaa). Säännöt jäivät, eivät ole
dash-/path-prefixiä joten L-V401 ei koskenut. **Verify:**
```bash
grep -rn "mastery-intro\|mastery-result\|screen-mastery" js/ app.html | grep -v app.bundle | grep -v chunks/
```
Vain poistokommentti app.html:1139 → poista `.mastery-intro-*` + `.mastery-result-*` -säännöt
`style.css`:stä (sweep paikansi ~rivit 4264–4335 + `.mastery-result-icon--small` ~5647;
varmista rivit grepillä, ne liikkuvat). **VARO:** `mastery-seed` on API-polku, EI luokka — älä
sekoita.

### A5. Kuollut `.lpc-*` + `.heatmap-*`-CSS (`css/app-old-spain.css`)

`.lpc-*` (level-progress-card, ~rivit 260–279) ja `.heatmap-cell`/`.heatmap-lvl-*` (~282–289)
+ yksittäinen `.heatmap-label`-selektoririvi jaetussa typografia-comma-ryhmässä (~rivi 2020,
muut ryhmän `.profile-*`-selektorit ELÄVÄT → poista vain `.heatmap-label`-rivi, ei sääntöä).
**Verify:** `grep -rn "lpc-\|heatmap-" js/ app.html | grep -v app.bundle | grep -v chunks/` = 0.

### A6. Vanhentunut app.html-kommentti

`app.html` ~rivit 1143–1157: iso `LEGACY [L-MERGE-DASH-PATH 2026-05-04]`-lohko joka kuvaa jo
poistettua `#screen-dashboardia` lapsineen ("To fully delete..."). Rivi 1158 jo sanoo että se
on poistettu → harhaanjohtava. Poista stale-lohko, säilytä rivi 1158:n L-V400-merkintä.
(Pieni siisteys; voi niputtaa A4/A5-CSS-commitin kanssa tai omaksi.)

---

## OSA B — onboarding-kuona (keskisuuri riski)

### Verifioidut faktat (sweep 2026-06-07)

Neljä onboarding-toteutusta elää rinnakkain. Reititys (`js/main.js`):
- **V4 = aktiivinen.** `#/aloitus`, `#/aloitus-v4` → `showOnboardingV4()` (main.js:207–208) +
  uloskirjautuneen startup `checkOnboarding()` delegoi V4:ään (`onboarding.js:11` importtaa
  `showOnboardingV4`).
- **V2/V3 = fallback-only.** Dokumentoidut hashit `#/aloitus-v2` (main.js:209–210) ja
  `#/aloitus-v3` (211–212), vain uloskirjautuneena, lazy-load (`lazyOnboardingV2/V3`,
  main.js:184–197). **EIVÄT ole täysin unreachable** — hash toimii jos joku ajaa sen.
- **`onboarding.js` (V1-moduuli) on JAETTU — EI saa poistaa.** Vie `initOnboarding`,
  `checkOnboarding` (→ main.js, auth.js), `hideAppCountdown` (→ dashboard.js),
  `showPathFromPlacement` (→ placement.js), `maybeShowFirstCelebration` (→ vocab.js).

### ⚠️ PÄÄTÖSPORTTI ennen mitään B-poistoa (kysy Marcelilta jos epäselvä)

V2/V3 ovat fallback-testihashien takana. **Suositus: poista V2 + V3 kokonaan** (markup +
`onboardingV2.js` + `onboardingV3.js` + lazy-wiring + hash-haarat main.js:209–212 +
`window._onboardingV2/V3`). Perustelu: ne ovat vain manuaalista fallback-testausta varten,
0 oikeaa käyttäjäpolkua, ja neljän rinnakkaisen onboardingin ylläpito on nettotappio. Jos
Marcel haluaa pitää V2/V3-vertailuversiot elossa → **älä poista, raportoi** ja tee vain V1-
ruutujen siivous (B3).

### B1. Poista V2-onboarding (jos päätösportti = kill)
- Markup app.html (sweep arvioi ~rivit 919–1083, `#screen-ob1-profile … #screen-ob4-plan`;
  varmista grepillä `id="screen-ob1`).
- `js/screens/onboardingV2.js`, lazy-määrittely main.js:184–187, hash-haara 209–210,
  `window._onboardingV2` (196), sw-precache-rivi jos on.

### B2. Poista V3-onboarding (jos päätösportti = kill)
- Markup app.html (sweep ~439–705, `#screen-ob-v3-*`).
- `js/screens/onboardingV3.js`, lazy main.js:189–192, hash 211–212, `window._onboardingV3` (197),
  sw-precache jos on.

### B3. Poista V1:n kuolleet onboarding-RUUDUT (säilytä moduuli)
V1-markup `#screen-ob-welcome/-ob-goal/-ob-personalize/-ob-path` (sweep ~242–439).
**KRIITTINEN VERIFY ennen poistoa** — moduulin jaetut funktiot voivat koskea näitä DOM-id:itä:
```bash
grep -rn "ob-welcome\|ob-goal\|ob-personalize\|ob-path\|screen-ob-path" js/screens/onboarding.js js/screens/placement.js js/screens/vocab.js js/screens/auth.js js/screens/dashboard.js
```
- Erityisesti `showPathFromPlacement` (placement.js käyttää) — koskeeko se `#screen-ob-path`?
- `checkOnboarding` / `maybeShowFirstCelebration` — näyttävätkö ne mitään `#screen-ob-*`?
- **Poista RUUTU vain jos mikään elävä funktio ei reitititä/manipuloi sitä.** Jos jokin
  V1-ruutu (todennäköisimmin `ob-path`) on yhä elävän funktion käytössä → jätä se, poista vain
  todistetusti kuolleet (welcome/goal/personalize). Säilytä `onboarding.js`-moduuli aina.

---

## Pakollinen verify JOKA commitin jälkeen (älä luota silmäilyyn)

Dev-server pyörii jo portissa 3000 (jaettu); käytä `BASE_URL`/`VERIFY_BASE`-envia ettei
playwright yritä omaa webServeriä. Creds `.env`:ssä (TEST_PRO_EMAILS=testpro123@gmail.com,
TEST_PRO_PASSWORD=Testpro123).

```bash
node --check <muokattu>.js          # JS-poistoille
npm run build                        # app lataa /app.bundle.*; stage app.bundle.* + chunks/*
npx vitest run                       # all-pass (lukumäärä laskee kun poistat dead-testejä — OK)

# 29-pinnan pikseliharness — KAAPPAA baseline ENNEN CSS/HTML-muutoksia:
BASE_URL=http://localhost:3000 TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  npx playwright test e2e-visual-layer --update-snapshots
# ... tee muutos, rebuild, sitten 0-diff-verify:
BASE_URL=http://localhost:3000 TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  npx playwright test e2e-visual-layer        # MUST: 29 passed, 0-diff

# Onboarding-flow (OSA B) — harness EI kata onboardingia (ei kirjautuneessa shellissä).
# Lisää TESTING-M smoke-spec: uloskirjautuneena #/aloitus → V4 läpi alusta loppuun, 0 JS-erroria.
# + clickthrough kirjautuneelle (ei saa regressoida):
VERIFY_BASE=http://localhost:3000 TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  node -r dotenv/config tests/verify-clickthrough.mjs   # 0 JS-erroria
```

- Pikseliharness `tests/e2e-visual-layer.spec.js` on lokaali/untracked (baselinet gitignoressa).
  CSS/HTML-poiston pitää olla **0-diff**. Jos diffaa → joku "dead"-asia oli elävä → revert se
  yksi muutos, jätä rauhaan.
- **`sw.js` CACHE_VERSION:** bump joka commitissa jossa bundle/asset muuttuu. Nyt `v400n` →
  jatka `v400o`, `v400p`, … Poista 404-aavat entryt (dailyChallenge/dash-cta/diagnostic).
- **ÄLÄ `git add -A`** — repossa on untracked dev-kohinaa (auditit/screenshotit/lokaali harness).
  Stage täsmälliset tiedostot.
- Push mainiin per commit (asset-muutos = push-OK vaikka visuaali identtinen, jotta uusi SW
  propagoituu). Brief/tests/dev-skriptit eivät pushaudu.
- IMPROVEMENTS.md +1 rivi lopuksi. Päivitä `project_v400_ghost_screens_removed`-muisti.

## Acceptance

- [ ] OSA A: A1–A6 poistettu, jokainen oma commit + harness 0-diff + vitest all-pass +
      clickthrough 0 erroria. dailyChallenge poistettu VAIN jos done-flag todistetusti
      lukematon. Elävät (onboarding.js shared funcs, `.profile-*`-comma-ryhmä) koskemattomia.
- [ ] OSA B: päätösportti ratkaistu (V2/V3 kill vai keep). Jos kill → markup + moduulit +
      wiring + hash-haarat poistettu, V4 toimii edelleen uudelle käyttäjälle alusta loppuun
      (smoke-spec todistaa). V1-ruudut poistettu vain todistetusti unreachablet; `onboarding.js`
      jäljellä eikä yksikään importtaaja (auth/dashboard/placement/vocab) hajoa.
- [ ] sw CACHE_VERSION bumpattu jokaisessa asset-commitissa, STATIC_ASSETS ehjä (ei 404-entryjä).
- [ ] Email-stack ja muut server-reitit koskemattomia (out of scope).
