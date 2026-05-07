# META QA LOOP — orkestraattori (B-istunto)

> **Käyttöohje:** Avaa Claude Code (Opus) projektihakemistossa, pasta:
> `Lue ja toimi agent-prompts/META_QA_LOOP.md mukaan`
> ja anna mennä autonomisesti.

Tämä on **pysyvä orkestraattori-prompti**. Älä koskaan poista. Sitä ajetaan joka kerta kun haluat suorittaa seuraavan loop-briefin jonosta.

---

## 0. Pakollinen lukemistus (joka kerta)

Lue tässä järjestyksessä **ennen** kuin spawnaat yhtään subagenttia:

1. `CLAUDE.md` — projektiohjeet
2. `AGENT_PROMPT_STANDARDS.md` — STANDARDS (mitä saa committaa, mitä ei, jne)
3. `AGENT_STATE.md` — viimeisin tila (max 30 riviä)
4. `BUGS.md` — P0/P1 mitä on jäljellä
5. `IMPROVEMENTS.md` — viimeiset 5 riviä
6. `graphify-out/GRAPH_REPORT.md` (jos olemassa) — community-rakenne
7. `agent-prompts/01-active/*.md` JOS olemassa → tämä on KESKEN OLEVA loop, jatka siitä
8. Jos `01-active/` on tyhjä → POIMI seuraava: `agent-prompts/02-queue/`-kansion **pienin numero** (esim `01_*.md`) → siirrä `mv` komennolla `01-active/`:iin → siitä tulee tämän kerran scope

---

## 1. Pipeline (4 vaihetta — älä skippaa yhtään)

### Vaihe 1 — IMPLEMENT (rinnakkain)

Lue active-prompti. Skoppaa työ **itsenäisiksi paloiksi** (per tiedostojoukko, per reitti, per komponentti). Spawnaa 1–4 **Sonnet-subagenttia rinnakkain** yhdessä viestissä:

```
Agent({
  subagent_type: "general-purpose",
  model: "sonnet",
  description: "Implement <slice>",
  prompt: "<self-contained brief: konteksti + scope + acceptance + älä committaa>"
})
```

**Pakollinen sääntö:** maksimi 4 rinnakkain (rate limits + Phase 2 vaatii kaikkien valmistumisen).

Kun **kaikki** Phase 1 -workerit ovat palanneet → siirry vaiheeseen 2.

### Vaihe 2 — VERIFY (rinnakkain, kaikki Sonnet)

Spawnaa **3 verifioijaa rinnakkain** yhdessä viestissä:

**A. Code-reviewer** (general-purpose, sonnet):
- Lue `git diff` (committaamattomat muutokset)
- Etsi nämä bug-luokat:
  - String-interpolaatio objektista (esim `${someObj}` jossa someObj on `{label, count}` → renderöityy `[object Object]`)
  - `undefined`/`null`-pääsy ilman optional chainingia
  - Väärä taulun nimi (`users` kun pitäisi olla `user_profile`)
  - Broken import / dead reference
  - SW-cache: jos `STATIC_ASSETS` muuttui mutta `CACHE_VERSION` ei → P0
  - Pre-commit-blokkaaja: `node --check` jokaisella muokatulla `.js`-tiedostolla
- Output: P0/P1/P2-lista konkreettisilla file:line-viitteillä

**B. Live-tester** (general-purpose, sonnet) — **PAKOLLINEN GATE**:

Tämä on Phase 2:n tärkein vaihe. Loop ei voi mennä Phase 4:ään ilman PASS-statusta tästä.

**Polku 1 — Subagent ajaa Playwrightin Bash-toolilla** (oletus — TOIMII tässä harnessissa, validoitu 2026-05-07):
- Subagent ajaa: `npm run test:bug-scan` projektin juuressa
- Spec sijaitsee: `tests/e2e-bug-scan.spec.js` (käynnistää dev-serverin Playwright-configin kautta)
- Spec tarkistaa kaikki public + logged-in screenit ja FAIL:aa jos DOM:ssa `[object Object]` / `undefined` / `NaN%` / `NaN/N` tai `console.error` fires
- Loggautuneet screenit ajetaan vain jos `TEST_LOGIN_EMAIL` + `TEST_LOGIN_PASSWORD` env on asetettu — public-puoli ajetaan aina
- **Jos virhe `Executable doesn't exist at ...webkit-2272/Playwright.exe` (tms)** → aja **ensin** `npx playwright install <browser>` (chromium / webkit / firefox) → retry. Älä SKIP:aa.
- Jos exit-koodi 0 → Phase 2B PASS, jatka

**Polku 2 — Jos Polku 1 ei toimi harness-shellissä** (npm/Playwright sandbox-blokki):
- Subagent **EI saa silent-skipata** ja claimata onnistuneeksi (vanhan systeemin virhe)
- Subagent kirjoittaa raportin, joka päättyy **eksplisiittiseen käyttäjä-toimintapyyntöön**:
  ```
  ⚠️ HARNESS BLOCK — Playwright ei voinut ajaa shellissä.
  Käyttäjä, aja **omassa terminaalissasi**:
      npm run test:bug-scan
  Jos exit 0 → vastaa "PASS" tähän viestiin.
  Jos failure → liitä virhelokin loppu, älä mark loop shippediksi ennen kuin korjattu.
  ```
- Orkestraattori (sinä) ODOTTAA käyttäjän vastausta. Älä siirry Phase 4:ään ennen "PASS"-vahvistusta.
- Tämä on hidaste mutta turvallinen — bug ei voi enää slipata.

**Älä koskaan käytä webapp-testing-skilliä bash-fallback-mielessä** — se sotkee gating-logiikan. Polku 1 = npm-skripti, Polku 2 = käyttäjä manuaalisti, ei muuta.

**C. A11y/visual-checker** (general-purpose, sonnet, **vain jos UI muuttui**):
- Aja `axe-core` jokaisella muutetulla screenillä
- Tarkista WCAG-kontrastit dark+light modessa
- Output: violation-lista impact-tasoittain (critical/serious/moderate)

Kun **kaikki kolme** ovat palanneet → vaihe 3.

### Vaihe 3 — FIX (Opus = sinä, päämallilla)

1. Aggregoi P0/P1/P2-listat kaikilta verifioijilta
2. **Älä spawnaa subagenttia korjauksiin** — fixaa itse `Edit`-toolilla. Subagent-overhead > Edit-suoritus.
3. Bumppaa `sw.js` `CACHE_VERSION` jos STATIC_ASSETS muuttui
4. Aja `node --check` jokaiselle muokatulle `.js`-tiedostolle (memory: `feedback_node_check_before_commit.md`)
5. Aja Phase 2 -live-testeri uudestaan **vain jos** muutokset koskivat reittejä joita testattiin → kunnes clean (P0 = 0)

### Vaihe 4 — CLOSE OUT

Tee **kaikki** nämä, älä skippaa yhtään:

1. **Päivitä `AGENT_STATE.md`:**
   - `Last updated:` tämän päivän pvm
   - `Current state:` 1-rivinen tila (loop-tunniste + scope + ✓ shipped)
   - Lisää `## Recent loops (last 5)` -osioon uusi entry, poista vanhin jos > 5

2. **Päivitä `IMPROVEMENTS.md`:**
   - Lisää 1 rivi muotoa: `- [YYYY-MM-DD L-LOOP-ID] <scope>. UPDATE 1: ... UPDATE 2: ... Files: a, b, c. SW: vN→vM. Verify: live=PASS, axe=N violations, code-review=N P0 fixed.`

3. **Poista active-prompti:** `rm "agent-prompts/01-active/<TIEDOSTO>.md"`

4. **Päivitä `agent-prompts/INDEX.md`** (queue-status — ks. §3 alla)

5. **Älä committaa.** Älä deployaa. Älä `git push`. Käyttäjä tekee.

6. Raportoi käyttäjälle:
   - Mitä shipattiin (1 lause)
   - Phase 2 -löydökset (P0/P1 määrät, mikä fiksattiin)
   - Tarvitaanko käyttäjältä manuaalista toimintaa (Stripe-dashboard, npm install, jne)
   - Seuraava jonossa: `agent-prompts/02-queue/`-pienin numero

---

## 2. Skill-set joka avataan kunkin vaiheen alussa

**Vaihe 1 (workerit):** auto-pickaa briefin perusteella, mutta vähintään `puheo-screen-template`, `puheo-finnish-voice`, `frontend-design`.

**Vaihe 2 verifier B (live-tester):** ei skilliä — käyttää `npm run test:bug-scan` -skriptiä joka ajaa `tests/e2e-bug-scan.spec.js`:n (Playwright). Jos ei toimi harness-shellissä → ESCALATE käyttäjälle (ks. §1 Vaihe 2B Polku 2), älä SKIP-claimaa.

**Vaihe 2 verifier C (a11y):** `design:accessibility-review`.

**Vaihe 3 (fix):** auto-pickaa skillit Edit:n yhteydessä.

---

## 3. Queue-tiedostorakenne

```
agent-prompts/
├── META_QA_LOOP.md          ← TÄMÄ (orchestrator, älä koske)
├── INDEX.md                  ← human-readable jononäkymä (päivität joka loopin lopussa)
├── 01-active/                ← max 1 tiedosto kerrallaan (juuri ajossa)
├── 02-queue/                 ← numeroidut, pienin numero ajetaan seuraavaksi
│   ├── 01_*.md
│   ├── 02_*.md
│   └── ...
├── 03-done/                  ← arkistoidut shipped-prompit (säilytys)
└── templates/                ← canonical pohjat (lesson-batches, ruflo-loop, jne)
```

**Naming convention queue:**
`NN_LOOP_ID.md` — NN = 2-numeroinen järjestys (zero-padded), LOOP_ID = SCREAMING_SNAKE_CASE.

**Re-numerointi:** jos lisäät uuden korkeammalle prioriteetille, voit re-numeroida `mv`:llä. Pidä numerot peräkkäisinä.

---

## 4. Briefin pakollinen footer (joka brief 02-queue:ssa sisältää tämän)

Joka loop-briefin loppuun lisätään (META_QA_LOOP itse hoitaa close-out:n, mutta briefin pitää tietää oma järjestysnumeronsa):

```markdown
---
## Lopuksi
Tämä on **NN / TOTAL** jonossa (`agent-prompts/02-queue/NN_*.md`).
Close-out hoituu META_QA_LOOP-orkestraattorin Vaihe 4:ssa — **älä manuaalisesti poista tätä tiedostoa workerina**, orkestraattori tekee sen.
```

---

## 5. Guardrailit

- **EI committia** tästä loopista (käyttäjä committaa kun hyväksyy)
- **EI deploya**
- **EI git pushia**
- **EI npm installeja** ellei brief eksplisiittisesti vaadi
- **EI Stripe-dashboard-toimia** (memory: `feedback_no_stripe_actions_until_authorized.md`)
- **EI käyttäjää pyydetä koodaamaan** (memory: `feedback_user_does_not_code.md`) — kaikki SQL-migraatiot MCP:llä, ei copy-paste-SQL:nä
- **EI subagenttia korjauksiin Vaiheessa 3** — Opus tekee Edit:llä

---

## 6. Virhetilanteet

- **Phase 1 -worker stallaa > 10 min:** tappaa, splittaa scopen pienempiin paloihin, retry
- **Phase 2 live-tester ei voi käynnistää dev-serveriä:** raportoi käyttäjälle, lopeta loop, ÄLÄ claimaa shippediksi
- **P0-bugi joka ei korjaannu 2 fix-iteraatiolla:** raportoi käyttäjälle, lopeta loop, jätä active-prompti paikalleen (älä poista) jotta seuraava istunto voi jatkaa
- **Ristiriitainen brief vs koodissa nähty todellisuus:** brief häviää — toimi nähdyn mukaan, raportoi ristiriita käyttäjälle close-outissa
