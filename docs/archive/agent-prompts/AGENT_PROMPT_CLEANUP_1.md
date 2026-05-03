# Agent Prompt — L-CLEANUP-1
# Yhdistetty siivous-loop: state-tiedostot, dead code, LemonSqueezy, arkistoidut promptit, console.log-jämät, käyttämättömät imports

> Paste tämä Claude Codeen sellaisenaan. Älä muokkaa.
> Tämä on **siivous-loop**, ei feature-loop. Tarkoitus: pienentää joka istunnon kontekstikulutusta ja poistaa kuollut koodi. **Ei** muutoksia käyttäjälle näkyvään toiminnallisuuteen.
> Tämä loop on TÄRKEÄ ennen seuraavia feature-loopeja koska AGENT_STATE.md + IMPROVEMENTS.md syövät tällä hetkellä ~40 000 tokenia joka istunnossa pelkän alkuluvun aikana — suurin osa siitä historiasta on irrelevanttia jokaiseen yksittäiseen looppiin.

---

## Edellytys

- L-LIVE-AUDIT-P2 shipattu kokonaisuudessaan (tarkista `grep '\[L-LIVE-AUDIT-P2\]' IMPROVEMENTS.md`)
- Vercel-tuotanto stabiili, manuaalitestit tehty (käyttäjä vahvistanut Lighthouse-mittaukset)
- Jos jokin P2-UPDATE on yhä pending, STOP ja viimeistele se ennen tätä looppia

---

## Lue ensin — EI muutoksia ennen kuin olet lukenut

1. **`AGENT_PROMPT_STANDARDS.md`** — KAIKKI skillit, säännöt. Tämä loop päivittää myös tätä tiedostoa (uusi sääntö §7 koskien AGENT_STATE.md:n maksimikokoa).
2. `AGENT_STATE.md` — koko nykyinen tiedosto. Tämä on tämän loopin pääkohde — se siivotaan dramaattisesti.
3. `IMPROVEMENTS.md` — koko tiedosto (~494 riviä). Pääosa siirretään archiveen.
4. `routes/stripe.js` — sisältö on LemonSqueezy, nimi vain Stripe. Käyttäjän päätös: LemonSqueezy poistuu, Stripe-koodi voi tulla myöhemmin omana feature-looppinaan.
5. `js/screens/writing.js`, `routes/config.js`, `server.js`, `tests/routes-smoke.test.js` — muut LemonSqueezy-viittaukset
6. `package.json` — `@lemonsqueezy/lemonsqueezy.js` -dependency
7. Repon juuren tiedostolista (`ls`) — paljon `AGENT_PROMPT_LPLAN*.md` ja `AGENT_PROMPT_HOTFIX*.md` -tiedostoja jotka ovat historiallista aineistoa

---

## Konteksti

Repon dokumentaatio on kasvanut hallitsemattomasti L-PLAN-1:stä L-LIVE-AUDIT-P2:een (~12 isoa loopia + ~5 hotfixiä). Käyttäjä havaitsi että Claude Code lukee koko historian joka istunnon alussa, vaikka 95% siitä on irrelevanttia nykyisen loopin kannalta.

Mittarit:
- `IMPROVEMENTS.md` = **494 riviä**, ~25 000 tokenia
- `AGENT_STATE.md` = 30+ riviä, mutta jokainen rivi on 800-1500 sanan paragraph → ~12 000 tokenia
- `AGENT_PROMPT_STANDARDS.md` = ~3 000 tokenia
- **Summa ~40 000 tokenia ennen kuin yhtään koodi-tiedostoa on luettu**

Lisäksi LemonSqueezy on käyttäjän päätöksen mukaan dead code (Stripe-migraatio tulee myöhemmin omana looppinaan), mutta se elää 5 tiedostossa + dependencyna.

**Käyttäjän vahvistettu lopputavoite:**
> "Joka istunnossa Claude Codella on enemmän kontextia oikealle työlle. Vanha historia on saatavilla arkistosta jos tarvitsen, mutta ei kuormita oletusta."

Tämä loop ei muuta käyttäjälle näkyvää toiminnallisuutta. Käyttäjälle tämä on näkymätön — kuolleen painon poistoa.

---

## Skills + design plugins käyttöön

**Aktivoi nämä, lue niiden SKILL.md** (STANDARDS-pohjan päälle):

- `puheo-finnish-voice` — UPDATE 2 (jos lisäät uusia copy-rivejä archive-readme:ihin tai STANDARDS:iin)
- `ui-ux-pro-max` — vain a11y-tarkistukseen jos kosket DOM:iin (epätodennäköistä tässä loopissa)

Education-skillit: ei tarvita — tämä on infrastruktuurityö, ei opetussisältöä.

Design plugins:
- `design:design-system` — vaihtoehtoisesti UPDATE 5 (LemonSqueezy-tokeneiden + luokkien siivous CSS:stä) — varmista ettei siivottavaksi merkitty CSS-luokka ole käytössä jollain piilo-screenillä

**Ei 21st.dev-sourcingia** — tämä on dokumentaation ja koodin siivousta, ei uusia komponentteja.

---

## UPDATE 1 — Siirrä `IMPROVEMENTS.md`-historia archiveen

**Mitä tehdään:** Pidetään aktiivisessa `IMPROVEMENTS.md`:ssä vain viimeisten ~5 loopin tiivistelmät. Loput menevät archiveen.

### A. Luo arkistorakenne

```
docs/
  archive/
    IMPROVEMENTS_PRE_AUDIT.md      ← rivit ennen L-LIVE-AUDIT-P0:aa (kaikki L-PLAN-1...L-PLAN-8 + L-SECURITY-1+2 + hotfixit)
    AGENT_STATE_HISTORY.md         ← AGENT_STATE.md:n vanha historia
    agent-prompts/                 ← (UPDATE 4 luo tämän)
      AGENT_PROMPT_LPLAN1.md
      AGENT_PROMPT_LPLAN2.md
      ...
      AGENT_PROMPT_LPLAN8.md
      AGENT_PROMPT_HOTFIX_PRICING.md
      AGENT_PROMPT_HOTFIX_PRICING2.md
      AGENT_PROMPT_SECURITY1.md
      AGENT_PROMPT_SECURITY2.md
```

`docs/archive/`-kansion juureen lisää `README.md`:

```markdown
# Archive

Historiallinen aineisto. Claude Code ei lue tätä oletuksena —
loop-prompteissa on pyydettävä eksplisiittisesti jos tarvitset historian.

- `IMPROVEMENTS_PRE_AUDIT.md` — kaikki shipatut fixit ennen 2026-05-03 (L-PLAN-1...L-PLAN-8, L-SECURITY-1+2, hotfixit)
- `AGENT_STATE_HISTORY.md` — kaikki edelliset loop-tilat ennen 2026-05-03
- `agent-prompts/` — vanhat L-PLAN-prompit referenssinä
```

### B. Pilko `IMPROVEMENTS.md`

Avaa `IMPROVEMENTS.md`. Etsi rivi joka aloittaa L-LIVE-AUDIT-P0:n (todennäköisesti `[2026-05-03 L-LIVE-AUDIT-P0]` tai vastaava). Kaikki ENNEN sitä riviä menee `docs/archive/IMPROVEMENTS_PRE_AUDIT.md`:hen.

`IMPROVEMENTS.md` jää sisältäen:
- Header (1-3 riviä)
- Lyhyt selitys: "Aktiivinen ledger. Vanhempi historia: `docs/archive/IMPROVEMENTS_PRE_AUDIT.md`"
- L-LIVE-AUDIT-P0:n rivit
- L-LIVE-AUDIT-P1:n rivit
- L-LIVE-AUDIT-P2:n rivit

Tavoite: **alle 100 riviä aktiivisessa tiedostossa** loopin jälkeen.

**Älä:** poista mitään riviä historiasta — vain siirrä. Archiven tiedosto sisältää bit-perfect kopion siitä mitä `IMPROVEMENTS.md`:ssä oli ennen.

**Verify:**
- `wc -l docs/archive/IMPROVEMENTS_PRE_AUDIT.md` ≈ 480
- `wc -l IMPROVEMENTS.md` < 100
- Jokainen alkuperäinen rivi on jossakin (joko aktiivisessa tai archivessa) — `cat docs/archive/IMPROVEMENTS_PRE_AUDIT.md IMPROVEMENTS.md | wc -l` palauttaa likimäärin alkuperäisen kokonaissumman

---

## UPDATE 2 — Tiivistä `AGENT_STATE.md` 5-rivin formaattiin per loop

**Mitä tehdään:** Nykyiset 800-1500-sanan paragrafit per loop tiivistetään 5-7-rivin yhteenvetoihin. Vanha pitkä versio menee archiveen.

### A. Siirrä vanha kokonaisuus archiveen

```bash
cp AGENT_STATE.md docs/archive/AGENT_STATE_HISTORY.md
```

`docs/archive/AGENT_STATE_HISTORY.md` on bit-perfect kopio nykyisestä `AGENT_STATE.md`:stä — historiallinen referenssi.

### B. Kirjoita uusi `AGENT_STATE.md` formaatti

Tavoite-rakenne:

```markdown
# Puheo Agent State

**Last updated:** YYYY-MM-DD
**Current state:** L-LIVE-AUDIT-P2 shipped (pending: Vercel manual measurements + Supabase indexes)

---

## Recent loops (last 5)

### L-LIVE-AUDIT-P2 — 2026-05-03 ✓ shipped
**Scope:** Performance — bundling, batch APIs, vocab pre-gen, theme-toggle VT, self-host fonts.
**Files:** 14 changed across 3 PRs.
**Deliverables:** SW v112→v115, app.bundle.css 232KB, app.bundle.js 318KB, /fonts/ self-hosted.
**Tests:** 1067/1067 ✓.
**Pending:** Lighthouse cold-load mittaus tuotannossa, Supabase index ACTION REQUIRED (`user_progress(user_id, mode)` + `attempts(user_id, created_at DESC)`).

### L-LIVE-AUDIT-P1 — 2026-05-03 ✓ shipped
**Scope:** Visual polish — dash-tutor card, level-progress, skill bars, Inter font (not mono),
SR-rating buttons, Konteksti badge mint.
**Files:** 8 changed.
**SW:** v111→v112.
**Tests:** 1067/1067 ✓.
**Pending decision (käyttäjältä):** UPDATE 8 category color strategy — 3 vaihtoehtoa (token / mint / neutral). Suositus: token-cleanup.

### L-LIVE-AUDIT-P0 — 2026-05-03 ✓ shipped
**Scope:** Critical bugs — exam confirm modal + discard endpoint, heatmap empty-state,
quick-review contrast, exit-active-exercise nav, /api/config/public 404.
**Files:** 5 changed.
**SW:** v110→v111.
**Tests:** 1067/1067 ✓.

### L-PLAN-8 — 2026-04-XX ✓ shipped
**Scope:** Landing-polish + dashboard empty-state + a11y. Code-only subset shipped first, deferred items as separate hotfix.
**SW:** v103→v106 (kahdessa erässä).

### L-PLAN-7 — 2026-04-XX ✓ shipped
**Scope:** Kumulatiivinen kertaus — sisäinen + cross-kurssi + SR-pohjainen henkilökohtainen kertaus.
**SW:** v101→v102.

---

## Next loop

**Recommended:** L-CLEANUP-2 (dead code -loppu, app.js-pilkkominen jos perustelu) — tehdään myöhemmin tarpeen mukaan.

**Pending decisions (käyttäjältä):**
- L-LIVE-AUDIT-P1 UPDATE 8 — kategoriaväri-strategia

**Recurring blockers:**
- Playwright E2E gated since d3f5ca5 (workflow_dispatch + secrets-puute)
- Manual prod verify after every Vercel deploy on käyttäjän tehtävä

---

For older loop history (L-PLAN-1 through L-SECURITY-2 + hotfixes), see `docs/archive/AGENT_STATE_HISTORY.md`.
```

**Maksimi:** 50 riviä aktiivisessa `AGENT_STATE.md`:ssä. Jos rivit ylittyvät, vanhin "Recent loops"-merkintä siirretään archiveen.

**Älä:** keksi mitä loopit tekivät — kopioi tiivistelmät nykyisestä `AGENT_STATE.md`:stä ja tiivistä ne. Tarkkuus tärkeämpi kuin nopeus.

**Verify:**
- `wc -l AGENT_STATE.md` ≤ 50
- Jokainen loop joka mainitaan, on tunnistettavissa archiven täydestä versiosta
- Käyttäjä voi yhdellä silmäyksellä nähdä mihin tilaan repo on jäänyt

---

## UPDATE 3 — Päivitä STANDARDS uusiksi sääntöiksi

**Mitä tehdään:** `AGENT_PROMPT_STANDARDS.md` saa uuden §7 "Dokumentaation kokorajoitukset" -osion. Päivitetään myös §6 (loop-tiedostojen lista) viittaamaan archiveen.

### A. Lisää §7 STANDARDS:iin

Lisää STANDARDS:n loppuun, ennen §6:ta tai sen jälkeen (loogisempaa loppuun):

```markdown
---

## 7. Dokumentaation kokorajoitukset (kontekstin säästäminen)

Koska Claude Code lukee `AGENT_STATE.md` + `IMPROVEMENTS.md` + tämän STANDARDS-tiedoston joka istunnon alussa, ne pidetään pieninä:

- **`AGENT_STATE.md` max 50 riviä.** Jos loopin lisäys ylittäisi rajan, vanhin "Recent loops"-merkintä siirretään `docs/archive/AGENT_STATE_HISTORY.md`:hen.
- **`IMPROVEMENTS.md` max 100 riviä.** Sama logiikka — vanhimmat loopit `docs/archive/IMPROVEMENTS_PRE_AUDIT.md`:hen tai uusiin per-vuosi-archive-tiedostoihin.
- **Loop-merkintä `AGENT_STATE.md`:hen on max 7 riviä.** Formaatti: scope, files, SW-bumppi, tests, pending. Kaikki tarkka toteutus on git-historiassa + commit-viesteissä.
- **Loop-merkintä `IMPROVEMENTS.md`:hen on max 3 riviä per UPDATE.** Linkkaa commit-hashiin jos tarvitsee viitata yksityiskohtiin.

Loop:n päättyessä, lopuksi:
1. Lisää uusi merkintä `AGENT_STATE.md`:hen ja `IMPROVEMENTS.md`:hen
2. Tarkista rivimäärät (`wc -l`)
3. Jos ylittyvät, siirrä vanhimmat archiveen
4. Commit yksinkertaisella viestillä: `chore(docs): rotate state archive after L-XXX`

`docs/archive/`-kansiota ei lueta Claude Codessa oletuksena. Loop-prompin "Lue ensin"-osio voi pyytää sitä eksplisiittisesti jos historia on relevanttia (esim. "Lue `docs/archive/IMPROVEMENTS_PRE_AUDIT.md` rivit jotka mainitsevat target_grade").
```

### B. Päivitä §6 (loop-tiedostot)

Vanha §6 listaa kaikki L-PLAN-1...L-PLAN-7 tiedostot. Korvaa se:

```markdown
## 6. Loop-tiedostot

**Aktiiviset (juuressa):**
- `AGENT_PROMPT_STANDARDS.md` — tämä tiedosto
- `AGENT_PROMPT_LIVE_AUDIT_P0.md` — viimeisin shipattu (L-LIVE-AUDIT-P0)
- `AGENT_PROMPT_LIVE_AUDIT_P1.md` — viimeisin shipattu (L-LIVE-AUDIT-P1)
- `AGENT_PROMPT_LIVE_AUDIT_P2.md` — viimeisin shipattu (L-LIVE-AUDIT-P2)

**Arkistoidut (`docs/archive/agent-prompts/`):**
- `AGENT_PROMPT_LPLAN1.md` ... `AGENT_PROMPT_LPLAN8.md`
- `AGENT_PROMPT_HOTFIX_PRICING.md`, `AGENT_PROMPT_HOTFIX_PRICING2.md`
- `AGENT_PROMPT_SECURITY1.md`, `AGENT_PROMPT_SECURITY2.md`

Aja yksi looppi kerrallaan järjestyksessä. `/clear` looppien välissä — uudessa istunnossa
tämä STANDARDS-tiedosto + `AGENT_STATE.md` riittää contextiksi.
```

**Älä:** muuta §1-§5 (skillit, design plugins, 21st.dev, verifiointi, älä-tee). Ne ovat yhä päteviä.

**Verify:**
- `AGENT_PROMPT_STANDARDS.md` lukee §7-osion uutena, §6-osion päivitettynä
- Standardin kokonaiskoko ei kasva merkittävästi (uusi §7 lisää ~30 riviä, päivitetty §6 vähentää ~10 riviä)

---

## UPDATE 4 — Arkistoi vanhat AGENT_PROMPT-tiedostot

**Mitä tehdään:** Siirrä `AGENT_PROMPT_LPLAN*.md` ja vanhat hotfix/security-promptit `docs/archive/agent-prompts/`-kansioon.

### A. Luo kansio + siirrä

```bash
mkdir -p docs/archive/agent-prompts/

# Siirrä L-PLAN-promptit
git mv AGENT_PROMPT_LPLAN1.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN2.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN3.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN4.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN5.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN6.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN7.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_LPLAN8.md docs/archive/agent-prompts/

# Siirrä hotfixit
git mv AGENT_PROMPT_HOTFIX_PRICING.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_HOTFIX_PRICING2.md docs/archive/agent-prompts/

# Siirrä vanhat security-promptit
git mv AGENT_PROMPT_SECURITY1.md docs/archive/agent-prompts/
git mv AGENT_PROMPT_SECURITY2.md docs/archive/agent-prompts/
```

**Käytä `git mv` eikä pelkkää `mv`** — git seuraa tiedostohistoriaa siirron yli.

### B. Säilytä juuressa

- `AGENT_PROMPT_STANDARDS.md` — pakollinen kaikille looppeille
- `AGENT_PROMPT_LIVE_AUDIT_P0.md`, `_P1.md`, `_P2.md` — viimeisimmät shipatut, voi yhä viitata
- `AGENT_PROMPT_CLEANUP_1.md` — tämä tiedosto, kun loop on shipattu, siirrä archiveen seuraavassa cleanup-loopissa

### C. Lisää README.md archiveen

`docs/archive/agent-prompts/README.md`:

```markdown
# Archived agent prompts

Historiallinen referenssi. Näitä ei lueta Claude Codessa oletuksena.

| Loop | Tiedosto | Shipped |
|------|----------|---------|
| L-PLAN-1 | AGENT_PROMPT_LPLAN1.md | 2026-04-XX (Onboarding redesign + placement upgrade) |
| L-PLAN-2 | AGENT_PROMPT_LPLAN2.md | 2026-04-XX (Curriculum structure + Oppimispolku) |
| L-PLAN-3 | AGENT_PROMPT_LPLAN3.md | 2026-04-XX (Exercise loop wired + tutor voice on dashboard) |
| ... | ... | ... |
| L-SECURITY-1 | AGENT_PROMPT_SECURITY1.md | 2026-04-XX (hardcoded secrets sweep) |
| L-SECURITY-2 | AGENT_PROMPT_SECURITY2.md | 2026-04-XX (security headers, CSP enforced) |
| L-PLAN-8 hotfix | AGENT_PROMPT_HOTFIX_PRICING.md | 2026-XX-XX (Free-card pricing accessibility) |
| L-PLAN-8 hotfix | AGENT_PROMPT_HOTFIX_PRICING2.md | 2026-XX-XX (purppurat link-spam-rivit pois) |
```

Voit hakea tarkat shippauspäivät `IMPROVEMENTS.md`:n archive-versiosta.

**Verify:**
- `ls docs/archive/agent-prompts/` listaa 12 tiedostoa
- `ls *.md | grep AGENT_PROMPT` listaa enintään 5 (STANDARDS + 3 LIVE_AUDIT + CLEANUP_1)
- `git log --follow docs/archive/agent-prompts/AGENT_PROMPT_LPLAN1.md` näyttää koko historian

---

## UPDATE 5 — Poista LemonSqueezy-koodi

**Mitä tehdään:** Käyttäjä on päättänyt että LemonSqueezy poistuu. Stripe-migraatio tulee myöhemmin omana feature-loopinaan (todennäköisesti L-STRIPE-1 jossain vaiheessa). Toistaiseksi: tilauspolku poistuu kokonaan, käyttäjille näkyvät napit kohti maksusivua piilotetaan tai vievät "Tulossa pian"-laatikkoon.

### A. Poista LemonSqueezy-koodi tiedostoittain

**`routes/stripe.js`** — Tämä on harhaanjohtavasti nimetty, sisältö on LemonSqueezy. Vaihtoehdot:
- (a) **Poista tiedosto kokonaan** ja `server.js`/`api/index.js`:ssä mountit. Lisää placeholder-route `/api/checkout` joka palauttaa 503 ("Maksu ei käytössä, tulossa pian").
- (b) Säilytä tiedosto, kommentoi sisältö `/* LEGACY LEMONSQUEEZY — REPLACED BY STRIPE IN L-STRIPE-1 */` blokkiin. Säilytä endpoint-routet mutta palauta 503.

**Suositus: (a).** Koodi on git-historiassa, ei tarvitse pitää sitä reposlassa kommentoituna.

**`js/screens/writing.js`** — etsi LemonSqueezy-viittaukset. Todennäköisesti jokin checkout-knappi tai redirect. Poista tai vaihda "Tulossa pian"-toiminnoksi.

**`routes/config.js`** — etsi LemonSqueezy-vakiot (LEMONSQUEEZY_VARIANT_ID jne.). Poista `process.env.LEMONSQUEEZY_*`-readit. Jos config palauttaa frontille jotain tilauspolkuun liittyvää, palauta tyhjä tai null.

**`server.js`** — etsi LemonSqueezy-importit ja route-mountit. Poista.

**`tests/routes-smoke.test.js`** — etsi LemonSqueezy-testit. Poista (eivät ole enää relevantteja).

### B. Poista dependency

```bash
npm uninstall @lemonsqueezy/lemonsqueezy.js
```

`package.json` ja `package-lock.json` päivittyvät.

### C. Poista env-muuttujat dokumentaatiosta

`.env.example` — etsi `LEMONSQUEEZY_*`-rivit ja poista. Lisää kommentti:

```
# Stripe (will be added in L-STRIPE-1)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# STRIPE_PRICE_ID=
```

### D. Käyttäjälle näkyvä copy

Jos `js/screens/writing.js` tai muualla ohjattiin käyttäjä LemonSqueezy-checkoutiin, vaihda:

- Painike → näytä "Pro tulossa pian — saat ensimmäisenä tiedon" + email-form joka tallentaa Supabaseen `waitlist`-tauluun (jos olemassa) TAI piilota painike kokonaan
- Run `puheo-finnish-voice`-skill copyyn

**Älä:** poista Pro-tunnusten oikeuksia tai feature-flageja. Käyttäjillä on Pro-tilejä joiden pitää toimia (testpro123@gmail.com on Pro).

**Verify:**
- `grep -ri "lemon" --include="*.js" --include="*.json" .` palauttaa 0 osumaa (paitsi `package-lock.json`-näkyvä kommentti tai vastaava — se päivittyy npm uninstallilla)
- `npm test` 1067/1067 ✓ (poistettujen testien jälkeen testimäärä saattaa olla pienempi — se on OK)
- `node --check server.js routes/*.js` clean
- Manuaalitesti: kirjautuminen Pro-tunnuksilla → kaikki Pro-toiminnot toimivat
- Manuaalitesti: kirjautuminen Free-tunnuksilla → painikkeet jotka aiemmin veivät checkoutiin näyttävät "Tulossa pian" -tilaa tai ovat piilossa

---

## UPDATE 6 — Console.log-jämät + käyttämättömät imports

**Mitä tehdään:** Aja siisti pass dead-koodille koko frontend- + backend-puolelta.

### A. Console.log-jämät

```bash
grep -rn "console\.log\|console\.debug" --include="*.js" js/ routes/ lib/ middleware/ 2>/dev/null
```

Käy jokainen läpi. Päätä per esiintymä:
- **Säilytä:** `console.error()`, `console.warn()` — ne ovat legitiimiä errorlokia. Muuta `logger.error()` jos olemassa.
- **Säilytä:** `console.info()` joka kirjaa kriittistä boot-flowia (esim. server start, webhook validation success).
- **Poista:** `console.log("hello")`, `console.log("got here")`, `console.log({ data })` -tyyppiset debug-jämät.

Jos epävarma, jätä rauhaan ja merkkaa `// TODO: review` -kommentilla.

### B. Käyttämättömät imports

Aja eslint jos käytössä, tai manuaalisesti:

```bash
# Etsi imports joita ei käytetä
npx eslint --rule "no-unused-vars: error" js/ routes/ lib/ middleware/ 2>/dev/null
```

Jos eslint ei ole käytössä, lisää `eslint.config.js` (tai vastaava) minimaalisesti:

```js
export default [{
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unused-imports': 'error',
  }
}];
```

Aja se ja korjaa flagatut esiintymät. Älä yritä korjata muita lint-rule-rikkomuksia tässä loopissa — keskity vain käyttämättömiin importeihin ja muuttujiin.

### C. TODO-/FIXME-rivit

```bash
grep -rn "TODO\|FIXME\|DEPRECATED\|@deprecated" --include="*.js" --include="*.css" --include="*.html" .
```

14 esiintymää 10 tiedostossa (tarkistettu auditissa). Käy jokainen läpi:
- **Toteutettu, unohdettu poistaa kommentti** → poista TODO
- **Yhä validi tehtävä** → muuta GitHub Issueksi (jos repo käyttää) tai siirrä `BACKLOG.md`-tiedostoon
- **Vanhentunut, ei enää relevantti** → poista

Älä jätä TODOja koodiin "myöhempää varten" — joko tee tai poista. Niillä on tapana kasaantua.

**Verify:**
- `grep -rn "console\.log" js/ routes/ | wc -l` < 5 (vain legitiimit info-logit)
- `grep -rn "TODO\|FIXME" --include="*.js" --include="*.css" .` < 5 (jos jätät joitakin, dokumentoi miksi)
- `npm test` 1067/1067 ✓
- Manuaalitesti: app toimii kuten ennen

---

## Verifiointi loop:in lopussa

1. **Token-mittaus** — varmista että siivous oikeasti vähensi kontextikulutusta:
   - Lue STANDARDS + AGENT_STATE.md + IMPROVEMENTS.md → karkea token-arvio (`wc -w` * 1.3)
   - Vertaa loop:n alkuun: tavoite ~10 000 tokenia tai vähemmän (alkutila ~40 000)

2. **`npm test` 1067/1067 ✓** (tai päivitetty määrä jos LemonSqueezy-testejä poistettiin — kerro käyttäjälle uusi luku)

3. **`node --check`** kaikilla muokatuilla JS-tiedostoilla puhtaana

4. **`git status` clean** ennen loopin commit-pushia (paitsi tämän loopin omat muutokset)

5. **Manuaalitesti tuotantoon** kun shipattu:
   - Pro-tunnukset toimivat
   - Free-tunnukset toimivat
   - Kaikki sivut latautuvat (dashboard, sanasto, puheoppi, jne.)
   - Tehtävät avautuvat ja toimivat
   - Asetukset-sivun theme-toggle toimii

6. **`AGENT_STATE.md` saa uuden 5-rivin merkinnän** L-CLEANUP-1:lle:

```markdown
### L-CLEANUP-1 — 2026-XX-XX ✓ shipped
**Scope:** Documentation siivous (state archive split) + dead code removal (LemonSqueezy + console.logs + unused imports).
**Files moved to archive:** 12 agent-prompts + IMPROVEMENTS history + AGENT_STATE history.
**Code removed:** routes/stripe.js + LemonSqueezy refs in 4 files + @lemonsqueezy/lemonsqueezy.js dep.
**Tokens saved:** ~30 000 per session (40k → 10k context preload).
**Tests:** XXXX/XXXX ✓.
```

7. **`IMPROVEMENTS.md`** saa kuusi 1-3-rivin merkintää (UPDATE 1-6, prefix `[2026-XX-XX L-CLEANUP-1]`)

8. **Commit-konventio:**
   - `chore(docs): split IMPROVEMENTS.md into active + archive [L-CLEANUP-1 UPDATE 1]`
   - `chore(docs): condense AGENT_STATE.md to 50-line format [L-CLEANUP-1 UPDATE 2]`
   - `docs(standards): add §7 documentation size limits + update §6 [L-CLEANUP-1 UPDATE 3]`
   - `chore(docs): archive old AGENT_PROMPT_LPLAN*.md files [L-CLEANUP-1 UPDATE 4]`
   - `chore(routes): remove LemonSqueezy code, replace checkout with 503 placeholder [L-CLEANUP-1 UPDATE 5]`
   - `chore(code): remove debug console.logs + unused imports + stale TODOs [L-CLEANUP-1 UPDATE 6]`

---

## Mitä EI saa tehdä

- ÄLÄ poista mitään historiaa lopullisesti — vain siirrä archiveen
- ÄLÄ koske `git log`:n historiaan (`git rebase`, `git filter-branch` jne.) — siirrot tehdään `git mv`:llä joka säilyttää historian
- ÄLÄ aja Stripe-migraatiota nyt — se on oma loopinsa myöhemmin (L-STRIPE-1)
- ÄLÄ poista feature-flageja tai Pro-/Free-erottelua koodista — vain LemonSqueezy-spesifinen koodi pois
- ÄLÄ refaktoroi `app.js`-monoliittia tähän looppiin — se on oma loopinsa (L-CLEANUP-2) jos perustelu löytyy myöhemmin
- ÄLÄ koske käyttäjälle näkyvään toimintaan paitsi UPDATE 5 D-osiossa (LemonSqueezy-checkout-painikkeen poisto/piilotus)
- ÄLÄ poista testejä paljon — vain LemonSqueezy-spesifiset testit pois
- ÄLÄ aja Supabase-migraatioita
- ÄLÄ koske landing-pageen
- ÄLÄ kirjoita uutta copya ilman `puheo-finnish-voice`-tarkistusta
- ÄLÄ jätä `TODO: tee tämä myöhemmin`-kommentteja siivottuun koodiin

---

## Ajojärjestys-suositus

Tee UPDATEt järjestyksessä — ne riippuvat osittain toisistaan:

1. **UPDATE 1** ensin (siirrä IMPROVEMENTS.md-historia archiveen) — ei riippuvuuksia
2. **UPDATE 2** (tiivistä AGENT_STATE.md) — voi tehdä rinnan UPDATE 1:n kanssa
3. **UPDATE 3** (päivitä STANDARDS) — riippuvainen UPDATE 1+2:sta (viittaa `docs/archive/`-rakenteeseen)
4. **UPDATE 4** (siirrä vanhat agent-promptit) — itsenäinen, mutta tee viimeiseksi dokumentaatio-osasta jotta archive-rakenne on jo paikallaan
5. **UPDATE 5** (LemonSqueezy-poisto) — itsenäinen, voi tehdä missä vaiheessa tahansa. Tämä on isoin yksittäinen muutos koodiin.
6. **UPDATE 6** (console.log + imports + TODO) — viimeisenä, koska UPDATE 5 saattaa lisätä tai poistaa tiedostoja jotka pitää siivota

Aja yksi UPDATE → committaa → seuraava. Älä bundlaa kaikkea yhteen committiin.

---

## Lopuksi

Kun loop on shipattu, raportoi käyttäjälle:
- Token-mittari: paljonko AGENT_STATE + IMPROVEMENTS + STANDARDS yhteensä on nyt vs. ennen
- Mitkä tiedostot siirrettiin archiveen
- LemonSqueezy-poiston laajuus (mitä tiedostoja koski, mitä testeja poistettiin)
- Mahdolliset löydökset console.log/TODO-passissa joita ei voinut päättää itsenäisesti — kysy käyttäjältä
- Suositus seuraavaksi loopiksi (todennäköisesti **odotetaan käyttäjän päätöstä** Stripe-migraatiosta tai uusista featureista)
