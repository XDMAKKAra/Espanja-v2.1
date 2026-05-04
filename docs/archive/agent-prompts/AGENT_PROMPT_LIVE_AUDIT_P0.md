# Agent Prompt — L-LIVE-AUDIT-P0
# Kriittiset bugit live-auditista: koeharjoituksen confirm-loop, heatmap-empty-state, kontrasti, hash-routing, turha 404

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **bug-fix-loop**, ei feature-loop. Kaikki kohdat ovat regressioita/rikkinäisiä tiloja jotka näkyvät tuotannossa juuri nyt. Pro-maksavat käyttäjät kokevat nämä.

---

## Lue ensin — EI koodia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md` — KAIKKI skillit, design plugins, 21st.dev sourcing-säännöt. Standardilohko on PAKOLLINEN jokaiseen UPDATEen tässä loopissa.**
2. `AUDIT_LIVE_DASHBOARD.md` repon juuressa — koko tiedosto. Tämä on lähde-aineistoni; tästä loopista löydät täydellisen toistettavuuden, screenshotit ja mittausdata.
3. `AGENT_STATE.md` — varmista että L-PLAN-8 + L-SECURITY-2 on shipattu (grep IMPROVEMENTS.md `[L-PLAN-8]` ja `[L-SECURITY-2]`). Jos kumpikaan puuttuu, STOP.
4. `app.html` `#screen-dashboard` -lohko + `js/screens/dashboard.js` + `css/components/dashboard.css`
5. `js/screens/exam.js` JA `js/screens/fullExam.js` (kumpi tahansa missä keskeneräisen kokeen confirm-logiikka on)
6. `routes/exam.js` (tai missä `/api/exam/*`-endpointit ovat)
7. `js/screens/vocab.js` + muut harjoitusscreenit (`grammar.js`, `reading.js`, `writing.js`) — hash-routing-logiikka kun harjoitus on auki
8. `js/api.js` + `js/main.js` — etsi mistä `/api/config/public`-pyyntö lähtee
9. `js/ui/nav.js` — sivupalkin klikkauksen käsittely
10. IMPROVEMENTS.md viimeiset 80 riviä

---

## Konteksti

Käyttäjä ja minä ajoimme live-auditin tuotantoa vasten (`https://espanja-v2-1.vercel.app/app.html`) 2026-05-03 Chrome-MCP:llä, kirjautuneena Pro-tilillä (testpro123@gmail.com). Audit dokumentoitu kokonaan `AUDIT_LIVE_DASHBOARD.md`:ssä mittauksin, screenshoteilla ja network-pyyntölistalla.

Löydettiin 5 P0-bugia: koeharjoituksen natiivi `window.confirm()` joka jättää käyttäjän umpikujaan jos painaa Cancel, dashboardin Aktiivisuus-heatmap renderöityy 35 mustana laatikkona ilman level-luokkia, "Kertaa nyt" -kortin alateksti näkymättömän matalalla kontrastilla, hash-routing rikki kun harjoitus on auki, ja turha `/api/config/public` -pyyntö joka palaa 404:llä joka cold loadissa.

**Käyttäjän vahvistettu lopputavoite:**
> "Pro-maksava käyttäjä ei jää jumiin minkään virheen takia. Dashboard ei näytä rikkinäiseltä tyhjässä tilassa. Klikkaukset vievät sinne mihin pitääkin."

**Tämä loop ei lisää featureita.** Jokainen kohta korjaa olemassa olevan rikon. Älä laajenna scopea (esim. ei "tämän reissussa myös refaktoroin koko exam-flown" — pelkät P0:t).

---

## Skills + design plugins käyttöön

**Aktivoi nämä, lue niiden SKILL.md ennen kunkin UPDATEn aloittamista** (STANDARDS-pohjan päälle):

- `puheo-screen-template` — UPDATE 1 (modaali noudattaa screen-template state-pattern), UPDATE 2 (heatmap-empty-state)
- `puheo-finnish-voice` — UPDATE 1 (modaali-copy: otsikko, body, napit), UPDATE 4 (jos hash-routing-modaali tehdään)
- `ui-ux-pro-max` — KAIKKI UPDATEt — focus-ringit, touch targets ≥ 44 px, kontrasti AA, modaali-fokus-trap

Education-skillit:
- `education/self-efficacy-builder-sequence` — UPDATE 1 modaali-copyssä: "Aloita uusi koe" ei saa shameta käyttäjää siitä että ei jatkanut vanhaa. Neutraali sävy.
- `education/cognitive-load-analyser` — UPDATE 2 (heatmap empty state — älä yritä viestiä liikaa kerralla, joko hento ruudukko tai pelkkä CTA)

Design plugins:
- `design:ux-copy` — UPDATE 1 (modaali-otsikko + body + nappi-labelit), UPDATE 4 (hash-routing-modaali jos rakennat)
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen. UPDATE 1 erityisesti — modaali tarvitsee fokus-trapin, escape-näppäimen, aria-labelledby:n, ja aria-modal:n.
- `design:design-critique` — Playwright-screenshotit muutetuista näkymistä @ 1440 + 375 → applya feedback. Modaali avoinna + dashboard heatmap-tila molemmilla viewporteilla.
- `design:taste-frontend` jos saatavilla — UPDATE 1 + 2 + 3.

**21st.dev sourcing — pakollinen seuraaville:**

| UPDATE | Komponentti | Hakusanat |
|---|---|---|
| 1 | Brändätty confirm-modaali jossa primary + secondary | `21st.dev/s/dialog`, `21st.dev/s/modal`, `21st.dev/s/confirm-dialog`, `21st.dev/s/alert-dialog` |
| 2 (jos haarana) | Empty-state-CTA-laatikko heatmap-sectionin sijaan | `21st.dev/s/empty-state`, `21st.dev/s/zero-state` |
| 4 (jos haarana) | Inline confirm "Lopetetaanko harjoitus?" navigaation aikana | sama dialog-pohja kuin UPDATE 1 |

Cite EXACT 21st.dev URL IMPROVEMENTS.md-rivissä.

---

## UPDATE 1 — Koeharjoituksen confirm-modaali + Cancel-umpikuja-fix

**Toistettavasti tuotannossa nyt:**
1. Pro-tilillä jolla on aktiivinen koe Supabasessa
2. Klikkaa Koeharjoitus → selaimen natiivi `confirm()` ponnahtaa: "Sinulla on keskeneräinen koe. Haluatko jatkaa sitä?"
3. Klikkaa Cancel → mustalle sivulle "Jokin meni pieleen — Kokeen luonti epäonnistui: Sinulla on jo aktiivinen koe." + "Yritä uudelleen →"
4. Klikkaa "Yritä uudelleen" → sama virhe takaisin. **Käyttäjä jumissa.**

**Korjaus, kahdessa osassa:**

### A. Frontend — vaihda natiivi `confirm()` brändättyyn modaaliin

Etsi `js/screens/exam.js` tai `js/screens/fullExam.js`:stä kohta `confirm('Sinulla on keskeneräinen koe...')`. Korvaa appin oman modaali-komponentin kutsulla. Älä rakenna uutta modal-systeemiä — käytä olemassa olevaa (etsi `showModal`, `openModal`, `<dialog>`-elementtejä, tai `.modal`-luokkaa app.html:ssä).

Modal-sisältö (run `design:ux-copy` ja `puheo-finnish-voice` ennen lopullistamista):
- **Otsikko:** "Sinulla on keskeneräinen Yo-koe"
- **Body:** "Voit jatkaa siitä mihin jäit, tai aloittaa uuden kokeen alusta. Vanhan kokeen edistyminen ei tallennu, jos aloitat uuden."
- **Primary-nappi:** "Jatka kesken olevaa" → kutsuu `resumeExam()`
- **Secondary-nappi:** "Aloita uusi koe" → kutsuu uuden discard-flown (kts. B)

Modaali tarvitsee:
- Fokus-trap (ensimmäinen nappi fokus auto-asetus modal-avauksessa)
- Escape sulkee modaalin (sama kuin Cancel — palaa dashboardiin)
- `aria-labelledby` otsikkoon, `aria-modal="true"`, `role="dialog"`
- Touch target ≥ 44px molemmille napeille

### B. Backend — endpoint joka sallii uuden kokeen aloituksen

Tarkasta `routes/`-kansiosta missä koe-endpointit ovat. Frontend kutsuu todennäköisesti `POST /api/exam/start` joka tällä hetkellä torjuu "sinulla on jo aktiivinen koe" -virheellä.

**Lisää uusi endpoint:** `POST /api/exam/discard-active`
- Etsii käyttäjän aktiivisen kokeen (`status = 'in_progress'` tai vastaava)
- Päivittää `status = 'abandoned'` ja `abandoned_at = now()`
- **EI poista riviä** — säilytä historiaan
- Jos aktiivista koetta ei ole, palauta 200 OK joka tapauksessa (idempotent)

Frontend "Aloita uusi koe" -nappi kutsuu järjestyksessä:
1. `POST /api/exam/discard-active` — vanha hylätty
2. `POST /api/exam/start` — uusi luotu

**Älä:** anna `?force=true` -parametria olemassaoleville endpointeille — selkeämpi olisi erillinen endpoint.

**Jos vaatii Supabase-skeema-muutoksen** (esim. `abandoned_at`-sarake puuttuu): kirjoita SQL ACTION REQUIRED -ohje IMPROVEMENTS.md:hen, ÄLÄ aja itse.

**Verify:**
- Manuaalitesti: Pro-tunnuksilla aktiivinen koe → Koeharjoitus → modaali avautuu (ei natiivi confirm) → klikkaa "Aloita uusi koe" → uusi koe alkaa, vanhasta ei jälkeä koe-ruudulla
- Supabase: vanha rivi on `status='abandoned'`, ei poistettu
- E2E (Playwright): `tests/e2e/exam-resume.spec.js` — testaa molemmat haarat (Jatka + Aloita uusi)
- `design:accessibility-review` modaali avoinna → 0 violations
- Modaali Escape-näppäimellä toimii kuin Cancel — sulkee, palaa dashboardiin (ei umpikujaan)

---

## UPDATE 2 — Heatmap-empty-state ei näytä rikkinäiseltä

**Mitä näkyy:** Dashboardilla "Aktiivisuus · 30 päivää" -section näyttää 35 cellin gridin (5×7), kaikki samaa tummaa väriä `rgb(26,26,26)` = `--surface`. DOM:ssa cellit ovat `.heatmap-cell` -luokalla, ei level-luokkia. Käyttäjälle näyttää siltä että app on rikki.

**Korjaus — kaksi haaraa, valitse:**

### Haara A (suosittelemani — vähemmän invasive): hento ruudukko

`css/components/dashboard.css`:

```css
.heatmap-cell:not([class*="level-"]) {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.06);
}
```

Käytä `puheo-screen-template`-tokeneita jos vastaavat määriteltyjä (esim. `--surface-faint`, `--border-faint`).

### Haara B (radikaalimpi): piilota heatmap, näytä CTA

Kun käyttäjällä on **0 aktiivista päivää viimeisen 30 päivän aikana** (`data.activityDays === 0`), korvaa koko `.dash-heatmap-section` tämän tilalla:

```html
<div class="dash-heatmap-empty">
  <p class="eyebrow">Aktiivisuus</p>
  <h3>Tästä alkaa streakisi</h3>
  <p>Tee ensimmäinen harjoitus, niin aloitat 30 päivän aktiivisuusseurannan.</p>
  <button class="btn-primary">Aloita harjoitus →</button>
</div>
```

Run `21st.dev/s/empty-state` ja sourcaa empty-state-pohja siitä. Käytä `education/self-efficacy-builder-sequence` -sävyä — ei "et ole vielä harjoitellut" vaan "tästä alkaa".

**Päätös:** Tee Haara A oletuksena. Jos `design:design-critique` palaute @ 375px on "tämä näyttää yhä tyhjältä ja oudolta", siirry Haaraan B.

**ÄLÄ rikko tilannetta jossa käyttäjällä ON aktiivisuuksia** — level-luokat saavat täytetyn taustan kuten ennenkin. Lisää testi: simuloi käyttäjä jolla 5 aktiivista päivää 30:stä → fillatut cellit renderöityvät.

**Verify:**
- Manuaalitesti: testitili 0 aktiviteetilla → heatmap näyttää joko (a) hennot dashed-cellit, tai (b) on piilotettu ja CTA näkyy
- Manuaalitesti: testitili joka on harjoitellut → fillatut cellit näkyvät kuten ennenkin
- `design:design-critique` 1440 + 375 dashboardista molemmissa tiloissa
- `design:accessibility-review` — kontrasti dashed-borderille AA-tasoinen tai parempi (4.5:1)

---

## UPDATE 3 — "Kertaa nyt — 20 korttia" -kortin alateksti lukukelvoton

**Mitä näkyy:** Dashboardilla iso kortti "Kertaa nyt — 20 korttia →". Alarivillä lukee "28 odottaa · ~5 min" mintunvihreä-versaaleilla mustalla taustalla, lähes näkymätön.

**Korjaus:** Etsi `.dash-quick-review` (tai vastaava luokka — tarkista DOM-rakenne ensin) ja vaihda alarivin `color`:

```css
.dash-quick-review .meta {  /* TARKISTA todellinen selectori */
  color: var(--text-muted);  /* ei var(--accent) */
  /* säilytä text-transform: uppercase + letter-spacing */
}
```

Jos `--text-muted` on liian harmaa antaakseen riittävän kontrastin (4.5:1), käytä `var(--ink-soft)` tai vastaavaa, joka on suunniteltu tähän tarkoitukseen `puheo-screen-template`-tokenisetissä.

**Verify:**
- Renderöi dashboard → "28 ODOTTAA · ~5 MIN" luettavissa ilman silmäilyä
- DevTools → Lighthouse a11y-skanni → contrast 4.5:1 tai parempi
- `design:accessibility-review` dashboardilla

---

## UPDATE 4 — Hash-routing rikki kun harjoitus on auki

**Toistettavasti:**
1. Sanasto → Aloita sanastoharjoittelu → kysymys näkyy
2. Klikkaa sivupalkista "Puheoppi"
3. URL muuttuu `#/grammar`, mutta sanastotehtävä pysyy ruudulla
4. Klikkaa x-painiketta tehtävän yläoikeasta → vie dashboardiin (ei Puheoppi-sivulle vaikka URL sanoi `#/grammar`)

**Korjaus:** Etsi `js/ui/nav.js` ja `js/screens/vocab.js` (ja muut harjoitusscreenit). Kun käyttäjä klikkaa sivupalkista navigaatiota harjoituksen ollessa auki, valitse:

### Haara A — modaali (suosittelemani)

Brändätty confirm-modaali (sama pohja kuin UPDATE 1):
- **Otsikko:** "Lopetetaanko harjoitus?"
- **Body:** "Vastauksesi tähän asti tallentuvat, mutta keskeneräistä sessiota ei voi jatkaa myöhemmin."
- **Primary:** "Jatka harjoitusta" (peruuta navigaatio)
- **Secondary:** "Lopeta ja siirry [target]"

Run `design:ux-copy` body-tekstiin ja varmista `puheo-finnish-voice`-skill (älä shameta — neutraali sävy).

### Haara B — sulje automaattisesti

Yksinkertaisempi mutta menettää vastaukset hiljaa. Tee tämä vain jos modaali-pohja on hankala saada toimimaan tähän kohtaan ja käyttäjä on ok:lla nopealla fixillä.

**Lisäksi:** kun harjoituksen x-painiketta painetaan, se pitäisi viedä takaisin sinne mistä käyttäjä tuli (Sanasto-sivulle jos hän tuli sieltä), ei aina dashboardiin. Tarkista `history.back()` tai router-historian käsittely.

**Verify:**
- Manuaalitesti: Sanasto → Aloita harjoitus → klikkaa "Puheoppi" → modaali kysyy
- Manuaalitesti: Sanasto → Aloita harjoitus → x-nappi → palaa Sanasto-sivulle
- Toista jokaiselle harjoitustyypille (vocab, grammar, reading, writing, verb-sprint)
- E2E: `tests/e2e/exit-active-exercise.spec.js`

---

## UPDATE 5 — Poista turha `/api/config/public` -kutsu

**Mitä näkyy:** Network-tab joka cold loadissa: `GET /api/config/public` → 404 Not Found, kestää ~349ms. Endpoint ei ole olemassa.

**Korjaus:**

```bash
grep -rn "config/public\|configPublic\|publicConfig" js/ public/ src/ 2>/dev/null
```

Etsi mistä kutsu lähtee. Jos endpointin pitäisi olla olemassa (esim. palauttaa LemonSqueezy / Stripe public keys, tai feature flagit), kysy itseltäsi: toimiiko app nyt 404:n kanssa? Jos kyllä → kutsu on tarpeeton → poista frontend-kutsu kokonaan.

Jos toiminnallisuus puuttuu (esim. jokin feature ei aktivoidu): luo `routes/config.js` joka palauttaa odotetut publicit:t ympäristömuuttujista. Ei salaisuuksia frontille.

**Verify:**
- Refresh `/app.html` → DevTools Network → 0 × 404
- Cold load -aika lyhenee ~300ms (mittaa Lighthousella ennen/jälkeen)

---

## Verifiointi loop:in lopussa

1. **axe-core sweep** kaikilla muutetuilla / uusilla screeneillä @ 1440 + 375 → 0 violations. Korjaa kaikki ennen loopin päättämistä. Erityisesti UPDATE 1 modaali, UPDATE 4 modaali, UPDATE 3 kontrasti.
2. **Playwright screenshot + design:design-critique** kaikista muutetuista näkymistä:
   - Dashboard tyhjä-tilassa (UPDATE 2)
   - Dashboard kontrasti-fix (UPDATE 3)
   - Koeharjoitus-modaali avoinna (UPDATE 1) — molemmat haarat (Jatka / Aloita uusi)
   - Harjoitus-exit-modaali (UPDATE 4)
3. **E2E-testit:**
   - `tests/e2e/exam-resume.spec.js` — Jatka + Aloita uusi -haarat
   - `tests/e2e/exit-active-exercise.spec.js` — sivupalkki-klikkaus + x-nappi harjoituksen aikana
4. **Manuaalitesti tuotantoa vasten** kun kohdat shipattu: avaa Pro-tunnuksilla `https://espanja-v2-1.vercel.app/app.html`, käy kaikki 5 P0-skenaariota läpi.
5. **IMPROVEMENTS.md** — yksi rivi per UPDATE, prefix `[2026-05-03 L-LIVE-AUDIT-P0]`, mainitsee käytetyt skillit + 21st.dev URLit.
6. **AGENT_STATE.md** — päivitä `Last completed loop: L-LIVE-AUDIT-P0` ja `Next loop: L-LIVE-AUDIT-P1`.
7. **SW-bumppi** jos lisättiin uusia .css/.js tiedostoja.

---

## Mitä EI saa tehdä tässä loopissa

- ÄLÄ refaktoroi exam-flowta laajemmin kuin UPDATE 1 vaatii — vain confirm + discard-active
- ÄLÄ koske P1- tai P2-bugeihin (heatmap-empty-state on UPDATE 2; dash-tutor-kortti, mono-fontit, B→C-laatikko jne. ovat seuraava loop)
- ÄLÄ poista vanhoja exam-rivejä DB:stä — vain `status='abandoned'`
- ÄLÄ aja Supabase-migraatioita itse — kirjoita ACTION REQUIRED IMPROVEMENTS.md:hen
- ÄLÄ lisää uusia features (pre-load, cache, bundling — kaikki P2-loopissa)
- ÄLÄ koske landing-pageen
- ÄLÄ kirjoita uutta copya ilman `design:ux-copy` + `puheo-finnish-voice`-tarkistusta

---

## Commit-konventio

Yksi commit per UPDATE:
- `fix(exam): replace native confirm with branded modal + add discard-active endpoint [L-LIVE-AUDIT-P0 UPDATE 1]`
- `fix(dashboard): empty-state heatmap with subtle dashed cells [L-LIVE-AUDIT-P0 UPDATE 2]`
- `fix(dashboard): improve contrast on quick-review card meta line [L-LIVE-AUDIT-P0 UPDATE 3]`
- `fix(nav): handle navigation away from active exercise screen [L-LIVE-AUDIT-P0 UPDATE 4]`
- `chore(api): remove unused /api/config/public client call [L-LIVE-AUDIT-P0 UPDATE 5]`

Push pääbranchiin. Vercel deploy → manuaalitesti tuotannossa → vasta sitten IMPROVEMENTS.md + AGENT_STATE.md.
