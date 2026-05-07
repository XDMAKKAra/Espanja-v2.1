# L-RUFLO-LOOP — Autonominen orkestroija (fallback ilman Rufloa)

> **Tämä on fallback-prompti** kun Rufloa ei haluta tai se ei toimi. Ajetaan Claude Codessa Opus-orkestroijana joka spawnaa Sonnet-workereita Task-toolilla. Sama malli kuin `AGENT_PROMPT_LESSON_BATCHES_AUTONOMOUS.md`, mutta nyt sisällön sijaan **bugien korjaus + frontend-parannukset + auditit**.

> **Aja kun:** Vaihe A on valmis (90 oppituntia generoitu, validate exit 0). Vaihe B (käyttäjän testikäynti tuotannossa) on pidetty ja BUGS.md sisältää kaikki tunnetut vaiheen B löydökset.

---

## 1. Pakollinen lukemistus (ennen ensimmäistä loop:ia)

Lue järjestyksessä:

1. `AGENT_PROMPT_STANDARDS.md` — kaikki säännöt joka loopille
2. `AGENT_STATE.md` — current state (max 50 riviä)
3. `BUGS.md` — bugiluettelo, P0 → P1 → P2
4. `IMPROVEMENTS.md` — viimeisimmät loop-merkinnät
5. `CLAUDE.md` — projektin yleiskuva
6. `.ruflo/config.json` — sama policy on koodattu sinne — käytä referenssinä

---

## 2. Roolijako

**Orkestroija (sinä, Opus):**
- Lukee BUGS.md:n ja päättää, mitkä bugit/auditit ajetaan tässä sessiossa (max 5 looppia)
- Spawnaa Sonnet-workereita Task-toolilla, max 3 rinnakkain
- Vastaanottaa worker-raportit, kirjaa IMPROVEMENTS.md + AGENT_STATE.md
- EI itse koodaa (paitsi 1-rivisiä korjauksia state-tiedostoihin)

**Workerit (Sonnet 4.6 — pakollinen `model: "sonnet"`):**
- 1 worker per loop-scope (esim. "korjaa P0-1 + P0-2", "aja design-critique etusivulle", "korjaa CI lint")
- Lukevat skill-setin per STANDARDS §1
- 21st.dev-sourcing-passi jos lisäävät uutta UI-komponenttia
- Eivät committaa, eivät deployaa
- Raportoivat takaisin: muutetut tiedostot, axe-tulos, test-tulos, mahdolliset uudet bugit jotka pitää lisätä BUGS.md:hen

**Pakollinen syntax:**

```
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "...",
  prompt: "..."
})
```

ÄLÄ spawnaa Opus-subagentteja (5x kustannus). ÄLÄ unohda `model: "sonnet"`.

---

## 3. Loop-priorisointi

Kullakin sessiolla orkestroija ajaa max 5 looppia. Valitse seuraavassa järjestyksessä:

### Prioriteetti 1 — P0-bugit BUGS.md:stä
Jokainen P0 omaksi loopikseen, paitsi jos kaksi bugia ovat samassa tiedostossa → yhdistä yhteen workeriin.

### Prioriteetti 2 — CI-korjaus
Jos `npm run lint` palauttaa virheitä TAI GitHub Actions main on punainen, korjaa se ennen P1:ä. Käyttäjä saa sähköposti-spämmiä punaisesta CI:stä.

### Prioriteetti 3 — Etusivu-näkyvyys
Jos `AGENT_PROMPT_HOME_COURSE_VISIBILITY.md` on ajamatta (tarkista IMPROVEMENTS.md `[L-HOME-COURSE-VISIBILITY]`), aja se omaksi loopiksi.

### Prioriteetti 4 — P1-bugit klustereittain
Yhdistä saman screenin / saman teeman P1:t (esim. P1-1 dashboard empty space + P1-3 results screen redesign jos molemmat koskevat samaa screenflowiä).

### Prioriteetti 5 — Auditit (joka 5. loop)
Aja:
- `npm audit` (security)
- `npx playwright test` jos olemassa (E2E)
- axe-core sweep neljällä viewportilla
- Lighthouse landing + dashboard
- `marketing:seo-audit` etusivulle

Päivitä BUGS.md uusilla löydöksillä, ÄLÄ auto-fixaa kriittisiä turvallisuusasioita ilman ihmisreviewa.

### Prioriteetti 6 — P2-polish
Vain jos sessiolla on slackia. Yhdistä useita P2:ia yhteen workeriin.

---

## 4. Worker-prompt-runko (kopioi jokaiseen Task-kutsuun)

```
Olet Sonnet-worker Puheon Vaihe C -orkestroinnissa. Kontekstisi:

# Pakollinen lukemistus ennen koodaamista
- AGENT_PROMPT_STANDARDS.md — säännöt joka loopille
- BUGS.md — bugiluettelo (etsi ja korjaa: <BUG_ID> tai <SCOPE>)
- AGENT_STATE.md — projektin current state
- CLAUDE.md — tech stack

# Skill-set (lue ne mitkä ovat relevantteja TÄLLE TASKILLE)

PAKOLLISET frontend-loopeissa (avaa ja pidä auki koko loopin ajan):
- .claude/skills/puheo-finnish-voice/SKILL.md — kaikki copy
- .claude/skills/puheo-screen-template/SKILL.md — layout/spacing/states
- .claude/skills/ui-ux-pro-max/SKILL.md — a11y, focus, motion, kontrastit, touch targets, font-pairings — **avaa ENSIMMÄISENÄ ennen koodia**

PAKOLLINEN frontend-makua varten (jos asennettu):
- design:taste-frontend — **ENSISIJAINEN** kaikkeen frontend-uudistukseen. Aja se 21st.dev-kandidaattien yli + ennen committia.
- Jos design:taste-frontend EI ole saatavilla → fallback: design:design-critique + ui-ux-pro-max -yhdistelmä. Kerro IMPROVEMENTS.md-rivissä kumpaa käytit.

Muut design-pluginin skillit (kutsu nimellä):
- design:design-critique — pakollinen valmiille UI-muutokselle (myös taste-frontendin lisäksi)
- design:ux-copy — kaikkiin uusiin teksteihin
- design:accessibility-review — pakollinen ennen valmista
- design:design-system — jos lisäät uuden tokenin tai komponentin
- marketing:brand-review — kun copy on valmis

# 21st.dev-sourcing — TARKISTA AINA ENNEN KOODIA

**Sääntö:** Ennen kuin kirjoitat ensimmäistäkään HTML-tagia tai CSS-luokkaa uudelle komponentille, käy 21st.devissä ja katso onko siellä jotain sopivaa. Tämä ei ole valinnainen vaihe.

1. Aja Playwrightilla `21st.dev/s/<term>` kokeillen 3–5 termiä, älä yhtä
2. Screenshot 2–3 kandidaattia → `references/<feature>/21stdev/`
3. Pick the most restrained dark option (Linear/Vercel-tier — säästeliäs accent, ohut viiva, ei loud-glow)
4. Port React+Tailwind → vanilla CSS olemassa olevilla tokeneilla (`--accent`, `--surface`, `--text`, `--r-lg`, `--sp-*`)
5. Cite EXACT 21st.dev component URL IMPROVEMENTS.md-rivissä

Jos 21st.devistä ei löydy → fallback järjestyksessä: magicui.design → ui.shadcn.com → Aceternity UI → HyperUI. Sama workflow joka tasolla.

**Älä keksi tyhjästä.** Älä päädy "tein oman variantin" ilman lähdettä. Triviaalit laajennukset olemassa olevasta (esim. 3-card grid → 8-card responsiivisesti) eivät vaadi uutta sourcing-passia.

# Scope tälle workerille
<TÄHÄN ORKESTROIJA KIRJOITTAA TARKAN SCOPEN>

# Pakolliset rajoitukset
- ÄLÄ committaa Gitiin (käyttäjä tekee sen)
- ÄLÄ deployaa
- ÄLÄ koske data/courses/-tiedostoihin
- ÄLÄ aja Supabase-migraatioita
- ÄLÄ keksi sisältöä mitä ei ole curriculumData.js:ssä

# Verify-checklist (pakollinen ennen "valmista")
1. axe-core sweep 1440 + 375 → 0 violations
2. design:design-critique applied (jos UI-muutos)
3. design:accessibility-review applied (jos UI-muutos)
4. marketing:brand-review applied (jos copy-muutos)
5. npm test → 1064/1064 ✓
6. SW bump jos STATIC_ASSETS muuttui
7. List muutetut tiedostot

# Raportoi takaisin
- Muutetut tiedostot (path:lla)
- axe-tulos
- test-tulos
- design-critique feedback ja mitä applyattiin
- mahdolliset uudet bugit BUGS.md:hen
- mitä SKIPPASIT (jos jotain ei voinut tehdä)
```

---

## 5. Orkestroijan check-list per loop

Kun worker palauttaa raportin:

1. ✅ Verify worker ajoi axe-coren (jos UI-muutos) ja se on 0 violations
2. ✅ Verify `npm test` ajettiin (1064/1064 jos testit eivät muuttuneet, muuten oikea kasvu)
3. ✅ **Verify 21st.dev-sourcing-passi** (jos uusi UI-komponentti) — IMPROVEMENTS.md-rivissä on tarkka URL, ei vain "katsoin 21st.devin"
4. ✅ **Verify ui-ux-pro-max + taste-frontend** (jos UI-muutos) — workerin raportissa pitää näkyä että ne avattiin/ajettiin. Jos taste-frontend ei ollut saatavilla, raportissa on syy ja fallback (design:design-critique).
5. ✅ Lue uusi BUGS.md jos worker lisäsi rivejä
6. ✅ Päivitä `AGENT_STATE.md` (max 7 riviä per loop, vanhin "Recent loops"-merkintä archiveen jos ylittyy 50 riviä)
7. ✅ Päivitä `IMPROVEMENTS.md` (1–3 riviä per UPDATE, prefix `[YYYY-MM-DD L-RUFLO-LOOP-N]`, mainitsee skillit + 21st.dev-URLit)
8. ✅ Jos SW bumpattiin, varmista että `sw.js`-versio nousi (workerin pitäisi se tehdä)
9. ✅ ÄLÄ committaa — kerää muutokset käyttäjän reviewattavaksi

---

## 6. Stop-conditions

Lopeta sessio kun:

- 5 looppia ajettu
- BUGS.md on tyhjä (kaikki P0+P1+P2 ratkaistu) — silloin Vaihe D (julkaisukelpoinen MVP) on saavutettu
- Käytetty 90 min per loop ja loop ei ole valmis → keskeytä, kirjaa AGENT_STATE.md:hen "blocker", siirrä seuraavaan sessioon
- Worker palauttaa virheen jota et voi ratkaista (esim. Supabase-skeema-migration vaaditaan) → kirjaa BUGS.md:hen "ACTION REQUIRED: <kuvaus>"

---

## 7. Mitä orkestroija EI tee

- ❌ Ei aja workeria kahdesti samaan bugiin
- ❌ Ei spawnaa Opus-subagentteja
- ❌ Ei committaa Gitiin
- ❌ Ei deployaa Verceliin
- ❌ Ei muokkaa `data/courses/`-tiedostoja
- ❌ Ei keksi BUGS.md:hen merkintöjä jotka eivät tule worker-raportista
- ❌ Ei aja `npm install` itse — workeri pyytää sitä jos tarvitsee uuden paketin

---

## 8. Vaihe D — julkaisukelpoinen MVP (loop-tavoite)

Kun seuraavat täyttyvät, sessio voi päättyä "ship-ready" -tilassa:

- [ ] `BUGS.md` on tyhjä TAI vain "Open questions" jäljellä
- [ ] Test coverage ≥80% kriittisissä reiteissä (`routes/auth.js`, `routes/exercises.js`, `routes/writing.js`, `routes/curriculum.js`)
- [ ] Lighthouse ≥90 etusivulla ja dashboardilla (1440 + 375)
- [ ] `npm audit` puhdas (ei high/critical)
- [ ] Smoke test K1L1 (A) + K3L1 (B) + K5L1 (C) + K7L1 (M) + K8L1 (E) ovat kaikki vihreitä
- [ ] CI on vihreä mainissa (ei sähköposti-spämmiä)

Kun ship-ready, päivitä `AGENT_STATE.md` "Current state" → "Vaihe D — ship-ready, awaiting user QA + go-live."

---

## 9. Käyttäjän tehtävät loopin välissä / jälkeen

Loop-prompti EI saa tehdä näitä — kirjaa "ACTION REQUIRED" -ohje IMPROVEMENTS.md:hen:

- Git commit + push
- Vercel deploy / redeploy
- Vercel env-muuttujien päivitys (esim. `USE_PREGENERATED_LESSONS=true`)
- Supabase SQL-migraatioiden ajo
- Stripe / LemonSqueezy / Resend webhook-tarkistukset live-konsolista
- Käyttäjätestaus tuotannossa (5 oppituntia eri tasoilta)

---

## 10. Esimerkki sessio-ajosta

```
Session 1 (5 looppia):
  L-RUFLO-LOOP-1: P0-1 (English "Loading…") + P0-3 (empty greeting fallback) — 1 worker
  L-RUFLO-LOOP-2: P0-2 (Helmet CSP fonts) + P0-4 (landing 404) + P0-5 (empty heading) + P0-6 (tablist) — 2 workers rinnakkain
  L-RUFLO-LOOP-3: L-HOME-COURSE-VISIBILITY (etusivun kurssiosio) — 1 worker
  L-RUFLO-LOOP-4: P1-1 + P1-3 (dashboard empty + results redesign) — 1 worker (sama screenflow)
  L-RUFLO-LOOP-5: AUDIT-PASS — npm audit + Lighthouse + axe sweep — 1 worker

Session 2 (5 looppia):
  L-RUFLO-LOOP-6 ... 10: P1-loput + P2-polish + smoke test
```

Tarkka työnjako on dynaaminen: orkestroija lukee BUGS.md tilan ja päättää scopen. Yllä on vain esimerkki.

---

## 11. Loop-tunniste

`L-RUFLO-LOOP-N` — N kasvaa joka loopilla yli sessiorajojen. Älä nollaa N:ää uudessa sessiossa — lue viimeisin numero IMPROVEMENTS.md:stä.
