# BRIEF: Spec-velka kiinni + landing-trim + reasoner — L-V313 → L-V315

**Päivä:** 2026-05-25
**Ledger-ankkurit:** L-V313, L-V314, L-V315
**Edellinen mega-loop:** `docs/briefs/2026-05-25-L-V301-V309-audit-fix-mega.md` (12 looppia shippattu)
**Followup:** `docs/briefs/MOBILE-AUDIT-2026-05-25-followup.md`
**Prod-rerun tulos (2026-05-25):** 22/26 PASS, 4 spec-timeout (ei product-bugia), V305 hero-fix näkyy prodissa, ledger backfill push `431560f`

---

## Executive

Kolme looppia, **aja järjestyksessä**, älä rinnakkaista — toinen riippuu ensimmäisestä:

1. **L-V313** — Korjaa 4 jäänyttä Playwright-spec-timeoutia niin että audit-rerun palaa 26/26 vihreäksi
2. **L-V314** — Landing-pituuden trim mobiilissa: kurssit-sektio → horizontal-scroll-strip (~−1500 px)
3. **L-V315** — Personalization-reasoner (alkuperäinen brief `docs/briefs/2026-05-23-personalization-reasoner.md` — toteuta se nyt, Step 5 placeholder pois)

Tämä sulkee audit-velan ja avaa polun feature-työhön. Ei skill-stack-listausta per-loop — käytä CLAUDE.md-taulukkoa (TESTING + FRONTEND + EXERCISE/LESSON + SUPABASE per loop).

Jokaisen loopin lopussa: `npm run build`, SW-bump jos STATIC_ASSETS muuttuu, IMPROVEMENTS.md-rivi, commit + push mainiin (Vercel auto-promote toimii L-V300-PROMOTE-FIX-1:n jälkeen).

---

## L-V313 — Playwright spec-timeoutit kiinni

**Tavoite:** `npx playwright test tests/e2e-mobile-audit-2026-05-24` palaa 26/26 vihreäksi prodia vasten.

**Tausta:** 2026-05-25 prod-rerun: 22/26 PASS, 4 FAIL. Ei product-bugeja — kaikki neljä ovat spec-timeoutteja (Playwright odottaa väärää selectoria tai liian lyhyttä `waitFor`-aikaa, prodin lazyloadattu chunk ei ehdi paintautua). Audit-spec on jo kärsinyt vastaavasta bugista L-V312:ssa (login-submit klikki vs. tab-painike → kaikki Pro-screenshotit unauthia).

**Mitä tehdään:**

1. **Aja rerun lokaalisti dev-prodi vasten:**
   ```bash
   AUDIT_BASE_URL=https://espanja-v2-1.vercel.app npx playwright test tests/e2e-mobile-audit-2026-05-24 --reporter=list
   ```
   Lue mitä 4 testiä feilaa + virheviestit (selector ei löydy / timeout 30000 ms).

2. **Diagnoosi per failu:**
   - Onko selector elossa DOM:ssa eri nimellä (selector-drift)?
   - Onko paint hidasta (lazy chunk, fontti, video-poster)?
   - Onko gate / cookie / addInitScript-tila väärin (vrt. `feedback_playwright_gate`)?
   - Onko prodi-spesifinen race (esim. service-worker preload vs. test runner)?

3. **Kor­jaa** spec-puolelta — älä koodin puolelta — paitsi jos diagnoosi paljastaa todellisen tuotantobugin (esim. dead `data-testid`, joka oli olemassa V310-vaiheessa mutta poistettu V311-refactorissa). Jos product-bug löytyy → erillinen sub-commit jolla on oma ledger-rivi.

4. **Vahvempi `waitFor`-strategia spec-puolelle:**
   - Älä `waitForTimeout(N)` — käytä `waitForSelector(s, { state: 'visible' })` tai `waitForLoadState('networkidle')`
   - Kriittisille screen-vaihdoille käytä `await page.locator('#screen-<name>.active').waitFor()` ei `setTimeout`
   - Jos lazy-chunk hidastaa, lisää `await page.waitForResponse(r => r.url().includes('app.bundle.js'))` ennen ensimmäistä klikkiä

5. **Verify-gate:**
   - 26/26 PASS prodia vasten kahdesti peräkkäin (race-immuniteetti)
   - Bug-scan 38/38 yhä vihreä (älä riko olemassa olevaa)

6. **Commit:**
   - `fix(test): tighten waitFor strategy in mobile-audit spec (L-V313-SPEC-TIMEOUT-FIX, v305)`
   - SW-bump VAIN jos spec-fix paljasti product-koodimuutoksen tarpeen (todennäköisesti ei)
   - IMPROVEMENTS.md-rivi: testit jotka feilasivat + mikä korjattiin + vahvistus 26/26

**Älä:**
- Lisää `waitForTimeout(5000)` -bandaidia. Jos timing ei selviä `waitForSelector`-mallilla, root-cause on syvempi
- Skip-tag failuria — me halutaan ne vihreäksi, ei piiloon
- Refaktoroi spec-rakennetta. Vain timing-fix.

**Skip-ehto:** jos rerun palaa 26/26 vihreänä **ennen** mitään muutoksia (esim. eilinen failu oli race jonka Vercel-rebuild jo siivosi), kirjoita ledger-rivi "no fix needed, race resolvoitui" ja siirry L-V314:ään.

---

## L-V314 — Landing mobile-pituus: kurssit-sektio horizontal-scroll-stripiksi

**Tavoite:** Mobile-landing tiivistyy 11931 px → ~10400 px (−1500 px, −13 %) ilman sisällön piilottamista.

**Marcelin brand-päätös (2026-05-25):** Vaihtoehto **(a)** — horizontal-scroll-strip kurssit-sektiossa mobiilissa, desktop pysyy 4-col grid. Lukio-edustaja näkee sisällön swipella (Quizletmäinen UX), mobile-pituus laskee, eikä lupausta jää piiloon.

**Mitä tehdään:**

### CSS

- `css/landing.css` (tai `css/components/landing-kurssit.css` jos eriytä on luettavampi): mobile-only media-query `@media (max-width: 768px)`:
  - `.kurssit-grid` → `display: flex; overflow-x: auto; scroll-snap-type: x mandatory; gap: 16px; padding-inline: var(--container-padding); scroll-padding-inline: var(--container-padding);`
  - `.kurssi-card` → `flex: 0 0 calc(85vw - 24px); scroll-snap-align: start; min-width: 280px;` (1.15 korttia näkyvissä → vihjaa swipattavuudesta)
  - `-webkit-overflow-scrolling: touch;`
  - Scrollbar piiloon mobiilissa: `&::-webkit-scrollbar { display: none; }` + `scrollbar-width: none;`
- Desktop `@media (min-width: 769px)`: koskematon (4-col grid)
- Lisää **vihjaus-affordanssi** mobiiliin: pieni "Pyyhkäise →" -teksti otsikon alle (12 px, var(--muted)), näkyy vain `<768px`. Älä lisää JS-arrowia tai dot-indikaattoreita — natiivi scroll-snap riittää, dotit ovat AI-slop.

### HTML

- Sama markup, ei dataa muuteta. Älä lisää duplikaattikortteja eri viewport-versioille.
- Tarkista että `<section class="kurssit-grid">` (tai mikä luokkanimi onkin) on yksi yhteinen wrap, ei mobile/desktop-haarautuksia.

### Per-kieli

- Toista sama rakenne **kolmessa landingissa:** `public/landing/espanja.html`, `public/landing/saksa.html`, `public/landing/ranska.html`. Saksa + ranska näyttävät "Avautuu syk. 2026" -chipit (V303:ssa shipattu), strip rendaa ne myös, ei poikkeuksia.

### Verify

1. **Pituusmittaus** Playwrightilla (lisää tai täydennä `tests/e2e-mobile-audit-2026-05-24` -spec):
   - Espanja-landing mobile-pituus < 10500 px
   - Saksa-landing mobile-pituus < 10500 px
   - Ranska-landing mobile-pituus < 10500 px
2. **Manuaalitesti** Playwrightilla: avaa landing 375 px-leveydellä, scrolla kurssit-osiolle, varmista että 1.15 korttia näkyy, swipe scroll-snäppää oikealle, kortit eivät katkea väärin
3. **Desktop ei rikkoudu:** screenshot ≥ 1024 px-leveydellä, 4-col-grid säilyy
4. **A11y:** scroll-snap-strip on focusable, vasen/oikea nuolinäppäin scrollaa (default browser behavior, ei custom JS:ää)

### Commit

- `feat(landing): kurssit-strip mobile horizontal-scroll (L-V314-LANDING-TRIM-A, v306)`
- SW-bump: v305 → v306, STATIC_ASSETS lisäys vain jos uusi CSS-tiedosto
- `npm run build` ennen committia (bundlattu CSS muuttuu)
- IMPROVEMENTS.md-rivi: ennen/jälkeen px-mittaus per kieli + brand-päätöksen justification

**Älä:**
- Lisää JS-controlleria scroll-snäpäykseen (natiivi CSS scroll-snap riittää, JS lisäisi 2 KB ja race-conditioneita)
- Tee desktop-puolelle mitään (4-col-grid on hyvä, älä koske)
- Lisää carousel-libraryä (Swiper, Embla, mitään) — overkill
- Piilota mitään sisältöä, vain layout-muutos
- Lisää dot-indikaattoreita tai prev/next-nuolia mobiiliin — AI-slop
- Käytä em-dashia "Pyyhkäise →" -tekstiin

---

## L-V315 — Personalization reasoner (alkuperäinen L-V294)

**Tavoite:** Toteuta `docs/briefs/2026-05-23-personalization-reasoner.md` kokonaisuudessaan. Step 5 placeholder ("transparent heuristic") katoaa, korvautuu LLM-pohjaisella reasonerilla joka tuottaa skill-profilen + 3 viikon suunnitelman + painotetut exercise-poolit.

**Älä kirjoita scopea uudelleen tähän briefiin.** Lue alkuperäinen brief ja toteuta se sellaisenaan. Jos jokin on vanhentunut (esim. data-rakenne muuttunut L-V300-sarjassa), korjaa briefiä samalla.

**Muutokset alkuperäiseen briefiin:**
- Skill-stack on jo CLAUDE.md-taulukossa, älä toista
- Käytä `LANG_CURRICULA`-rakennetta `lib/curriculumData.js`:stä (ei `SPANISH_KURSSIT`-vanha-nimi) — multi-lang-tuki shipattu 2026-05-13
- YTL-arvosanaskaalaa I/A/B/C/M/E/L (ei CEFR), ks. `feedback_curriculum_uses_ytl_grades`
- Reasoner-prompt-template: pidä **suomeksi** (käyttäjälle näkyvät transparency-reasonsit), humanizer-säännöt päälle (ei em-dashia, ei AI-brand-sanoja)
- **Skip** alkuperäisen briefin "Step 5 placeholder" -osio — koko piste on poistaa se

**Mitä toteuta minimissään:**
1. `lib/personalization.js` — `buildSkillProfile()` palauttaa { skillProfile, strengths, gaps, plan, courseWeights, transparencyReasons }
2. Reasoner-LLM-kutsu (gpt-4o-mini, prompt suomeksi, JSON-output-mode)
3. Integrointi onboarding-flow:n Step 5:een (`js/screens/onboardingV3.js` — verify-first, ei sokeasti diff-vanhaa)
4. Persistenssi: tallenna profile + plan käyttäjän `profiles`-tauluun (Supabase, RLS säilyy)
5. Exercise-painotus: kun adaptive-generator hakee seuraavaa tehtävää, lue `courseWeights` ja sample heikkoja aiheita 3x todennäköisyydellä — toteutus `routes/exercises.js` tai `lib/adaptive.js` -puolelle, riippuen olemassa olevasta rakenteesta

### Migraatio

Jos tarvitset uuden sarakkeen (esim. `profiles.skill_profile JSONB`, `profiles.plan JSONB`, `profiles.course_weights JSONB`):
- Käytä `mcp__claude_ai_Supabase__apply_migration` (ei SQL-editori käyttäjälle, ks. `feedback_migrations_via_mcp`)
- RLS-policy: vain `auth.uid() = user_id` saa lukea/kirjoittaa omat reasoner-tulokset

### Verify

1. Onboarding-diagnostic-spec: aja Marcelin esimerkki ("K3+K4+K6+K7, kotona puhuu, ortografia heikko, subjunktiivi ei tunnistettu") läpi → reasoner-tulos sisältää sekä "vahvuus: suullinen kommunikaatio" että "puute: ortografia, subjunktiivi"
2. Adaptive-test: aja 20 generointia → heikkojen aiheiden frequency ≥ 2x vahvojen
3. UI-test: Step 5 rendaa reasoner-tulokset (ei "transparent heuristic" -placeholder), suomi-teksti läpäisee humanizer-tarkistuksen
4. Bug-scan 38/38, audit 26/26 yhä vihreä
5. Onboarding-spec päivitetään tarvittaessa

### Commit

- `feat(personalization): LLM-pohjainen reasoner + exercise-painotus (L-V315-REASONER-1, v307)`
- SW-bump jos `js/screens/onboardingV3.js` muuttuu
- IMPROVEMENTS.md-rivi: mitä reasoner palauttaa Marcelin esimerkillä + frequency-mittaus

**Älä:**
- Lisää uusia kieliä reasonerille — `es/de/fr` riittää, sama curriculum-data jokaiselle
- Lisää reasoner-välimuistia frontend-puolelle ennen kuin on backend toimii (premature optimization)
- Sokeasti diffaa onboardingV3:a — verify ensin että Step 5 renderöityy nyt placeholderilla, sitten korvaa

**Skip-ehto:** jos onboardingV3.js Step 5 on jo poistettu / muuttunut V300-sarjassa, lue git log ja päivitä briefiä — älä lisää uudelleen poistettuja UI-elementtejä.

---

## Yleisohjeet (kaikki kolme looppia)

- **Skill-stack:** Lataa Skill-toolilla CLAUDE.md-taulukon mukaiset (TESTING + FRONTEND + EXERCISE/LESSON + SUPABASE). Yksi skilli per Skill-tool-kutsu.
- **Verifikaatio:** Kaikki testit OMILLA TOOLEILLA (Playwright + npm test), älä siirrä työtä Marcelille. `feedback_playwright_works_in_harness` — jos browser-binari puuttuu, aja `npx playwright install <browser>` itse.
- **Build + SW:** `npm run build` ennen committia jokaisessa loopissa joka koskee bundlattua koodia. SW-bump kun STATIC_ASSETS muuttuu.
- **Humanizer:** Mikä tahansa suomi-teksti joka päätyy käyttäjälle näkyväksi (reasoner-transparency-reasonsit, landing-microcopy "Pyyhkäise →") läpäisee humanizer-säännöt: ei em-dashia, ei "elevate/seamless/unleash", ei rule-of-three-listoja.
- **Ledger:** Lisää IMPROVEMENTS.md-rivi per loop (Files, SW, Verify, Pending). Ei jätä 12 looppia jäljelle kuten V300-sarja.
- **Push:** `git push origin main` per loop (solo-dev-pattern). Vercel auto-promotes.
- **Älä auto-pushaa pikkukorjauksia kesken loopin** — yksi commit per loop, ei viittä commitia per landing-CSS-tweak (`feedback_batch_pushes_no_auto_vercel`).

---

## Out-of-scope tälle briefille

- Stripe-aktivointi (vain pyydettäessä, `feedback_no_stripe_actions_until_authorized`)
- Uudet kielet (FI, IT, jne.)
- Onboarding-flow-restructure — jos reasoner-toteutus paljastaa että Step 5 -rakenne ei kestä, kirjoita follow-up-brief, älä restrukturoi tässä loopissa
- Lukio-pilot-outreach-toolit — odottaa erillistä päätöstä
