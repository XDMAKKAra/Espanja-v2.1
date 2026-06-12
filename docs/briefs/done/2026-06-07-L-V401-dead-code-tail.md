# L-V401 — viimeistele dead-code-poisto (renderDashboard-jäänteet)

> **Rooli:** WRITER. Tämä on L-V400:n jatko. Lue ENSIN muistista
> `project_v400_ghost_screens_removed` + tämä brief. Skill-stack:
> FRONTEND-M (`frontend-design`, `ui-ux-pro-max`) + TESTING-M (`webapp-testing`).

## Konteksti

L-V400 poisti molemmat hidden-haamuruudut (`#screen-path` + `#screen-dashboard`)
+ koko `renderDashboard`-klusterin (`js/screens/dashboard.js` 1668→324r). `home.js`
omistaa kodin (`#screen-home` / `#home-root`), exitit reitittävät `screen-home`:en,
Pro-badge = `renderSidebarProBadge`. Jäljellä on **inertti tail** — kolme erillistä
pikku-poistoa, kukin **oma commit + verify**. Älä niputa.

## Tehtävät

**1. `dailyChallenge.js` puolikuollut.**
`renderDailyChallengeInto` on kutsumaton (oli vain poistetussa renderDashboardissa),
mutta `markModeCompletedToday` samasta moduulista on elävä (`saveProgress` käyttää).
Poista VAIN `renderDailyChallengeInto` + sen apurit + `.daily-challenge*`-CSS
`css/components/dashboard.css`:stä. Varmista ensin:
`grep -rn "daily-challenge\|renderDailyChallengeInto" js/ app.html` → ei renderöinti-osumia.

**2. Dead main.js-wiring.**
`btnDashStart` (~rivi 854) + `btn-retake-placement` (~618) wiraavat poistettuja
#screen-dashboard-elementtejä (guarded no-opit nyt). Poista wiring-blokit. Tarkista
että niiden kutsumat funktiot (`loadLastSettings`, `startPlacementFromRetake`,
`btn-back-to-dash`) eivät jää orvoiksi — jos jäävät (0 muuta kutsujaa), poista nekin.

**3. Cross-file dash-*-CSS.**
`style.css` + `css/app-old-spain.css` sisältävät vielä `.dash-greeting / .dash-kpi /
.dash-heatmap / .dash-hero-grade / .dash-day-cta / .path-*`-sääntöjä jotka olivat vain
#screen-dashboardilla. Aja class-aware-tarkistus: luokka on dead jos EI esiinny
`app.html`:ssä tai `js/`:ssä (poiston jälkeen). Poista dead-säännöt.
**VARO eläviä:** `.dash-mode-card / .dash-hero / .dash-block / .dash-ring` ovat
home.js:n → ÄLÄ poista.

## Pakollinen verify JOKA commitin jälkeen (älä luota silmäilyyn)

```bash
npm run build
node --check <muokattu>.js
npx vitest run                              # pitää pysyä 1256/1256

# 29-pinnan pikseliharness + characterization (creds .env:ssä):
TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  npx playwright test e2e-visual-layer e2e-home-characterization

TEST_PRO_EMAILS=testpro123@gmail.com TEST_PRO_PASSWORD=Testpro123 \
  node tests/verify-clickthrough.mjs        # 0 JS-erroria
```

- Pikseliharness `tests/e2e-visual-layer.spec.js` on **lokaali/untracked** (baselinet
  gitignoressa). Kaappaa before-baseline ENNEN muutoksia:
  `... npx playwright test e2e-visual-layer --update-snapshots`. Dead-CSS:n poiston
  pitää olla **0-diff** (matchaa nyt ei-mitään). Jos diffaa → joku "dead"-luokka oli
  elävä → revert se yksi muutos, jätä rauhaan.

## Säännöt (L-V400:n opit)

- **`sw.js` STATIC_ASSETS + `cache.addAll`:** jos poistat tiedoston tai bundlatun
  CSS:n, poista se MYÖS `sw.js` STATIC_ASSETSista (addAll hylkää koko precachen jos
  yksi asset 404aa) + bump `CACHE_VERSION` (nyt v400k → v400l).
- **`npm run build` ennen committia** (app lataa `/app.bundle.*`). Stage `app.bundle.*`
  + muuttuneet `chunks/*`.
- **ÄLÄ `git add -A`** — vetää mukaan untracked dev-kohinaa (auditit/screenshotit/
  lokaali harness). Stage täsmälliset tiedostot.
- Push mainiin per commit (käyttäjälle näkyvä = push).
- IMPROVEMENTS.md +1 rivi lopuksi.

## Acceptance

- [ ] 3 erillistä committia, jokainen harness 0-diff + vitest 1256/1256 + clickthrough 0 erroria.
- [ ] Ei `renderDailyChallengeInto` / dead btn-wiring / dead dash-*-CSS jäljellä (grep todistaa).
- [ ] Elävät (`.dash-mode-card/.dash-hero/.dash-block/.dash-ring`, `markModeCompletedToday`) koskemattomia.
- [ ] sw CACHE_VERSION bumpattu + STATIC_ASSETS ehjä (ei 404-entryjä).
