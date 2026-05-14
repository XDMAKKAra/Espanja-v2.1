# L-PLAN STANDARDS — pakollinen lukemistus jokaiseen looppiin

> Tämä tiedosto on referoitu jokaisen `AGENT_PROMPT_LPLAN*.md`-tiedoston yläosassa.
> Käyttäjä on määritellyt: nämä kaikki skillit + sourcing-säännöt OVAT käytössä KAIKISSA loopeissa, ei valikoidusti.

---

## 1. Skillit jotka aktivoidaan JOKAISESSA loopissa

### Puheon omat skillit (lue ENNEN koodaamista)
- `.claude/skills/puheo-screen-template/SKILL.md` — layout, spacing, states (loading/empty/error)
- `.claude/skills/puheo-finnish-voice/SKILL.md` — KAIKKI copy oppilaalle
- `.claude/skills/puheo-ai-prompt/SKILL.md` — KAIKKI OpenAI-kutsut: system message, JSON schema, cost guards
- `.claude/skills/ui-ux-pro-max/SKILL.md` — a11y, touch targets, focus states, motion, reduced-motion

### Education-skillit (lue se mikä matchaa työhön)
KAIKKI nämä ovat saatavilla. Lue se(t) mitkä matchaavat juuri sen UPDATEn aiheeseen JOTA OLET TEKEMÄSSÄ. Älä lue kaikkia 24 ennen jokaista riviä koodia — mutta lue relevantti(set) ENNEN sen UPDATEn alkamista.

Mappäys aiheittain:

**Opetussisällön suunnittelu:**
- `education/explicit-instruction-sequence-builder/SKILL.md` — I do → We do → You do
- `education/worked-example-fading-designer/SKILL.md` — esimerkkien karsinta osaamisen kasvaessa
- `education/backwards-design-unit-planner/SKILL.md` — kunkin oppitunnin mitattava sub-goal
- `education/curriculum-knowledge-architecture-designer/SKILL.md` — kurssirakenteen koherenssi
- `education/learning-target-authoring-guide/SKILL.md` — tehtävien tavoitelauseet
- `education/competency-unpacker/SKILL.md` — taidon pilkkominen alaosiin

**Tehtävien suunnittelu:**
- `education/practice-problem-sequence-designer/SKILL.md` — recognition→production
- `education/retrieval-practice-generator/SKILL.md` — testaamalla oppiminen
- `education/spaced-practice-scheduler/SKILL.md` — spacing + interleaving aikatauluna
- `education/interleaving-unit-planner/SKILL.md` — sekoitus eri aiheiden välillä
- `education/adaptive-hint-sequence-designer/SKILL.md` — vihjeketju exercise-screenissä
- `education/cognitive-load-analyser/SKILL.md` — älä ylikuormita (max ~4 elementtiä/screen)

**Arviointi + palaute:**
- `education/formative-assessment-loop-designer/SKILL.md` — välitön palaute -> seuraava askel
- `education/formative-assessment-technique-selector/SKILL.md` — millainen check-for-understanding
- `education/error-analysis-protocol/SKILL.md` — virheanalyysi tutorMessageen
- `education/criterion-referenced-rubric-generator/SKILL.md` — kirjoitustehtävien rubriikit
- `education/metacognitive-prompt-library/SKILL.md` — reflektiolauseet results-screenillä

**Adaptiivisuus + motivaatio:**
- `education/differentiation-adapter/SKILL.md` — eri tasoille adaptointi
- `education/individual-spacing-algorithm-explainer/SKILL.md` — SR per oppilaan history
- `education/cognitive-tutoring-architecture-designer/SKILL.md` — koko tutori-engine
- `education/intelligent-tutoring-dialogue-designer/SKILL.md` — tutori-äänen sisältö
- `education/flow-state-condition-designer/SKILL.md` — fast-track / pidäke / haasteen porras
- `education/self-efficacy-builder-sequence/SKILL.md` — älä shame, viesti agentticly
- `education/developmental-progression-synthesis/SKILL.md` — taso-progression validointi

**Sääntö:** ennen kuin kirjoitat OpenAI-promptia tehtävälle, results-cardille, tutori-viestille, opetussivulle TAI suunnittelet uutta UI-elementtiä joka ohjaa oppilaan käyttäytymistä, AVAA SE education-skill joka matchaa tilannetta ja sovella sen ohjeita. Mainitse skillin nimi IMPROVEMENTS.md-rivissä.

---

## 2. Design plugin -skillit (kutsu nimellä)

- `design:ux-copy` — KAIKKI mikrokopiointi: nappi-labelit, error-viestit, empty-statet, tooltip-tekstit, dialogi-otsikot. Aja ENNEN copyn lopullistamista jokaisessa screenissä.
- `design:accessibility-review` — JOKAISEN UPDATEn jälkeen. Etsii axe-coren ohi meneviä asioita: lukutaso, kognitiivinen kuorma, kosketus-kohteen laatu, focus-järjestys.
- `design:design-critique` — Playwright-screenshotit jokaisesta valmiista screenistä @ 1440 + 375. Etsii hierarkia-, väli- ja yleinen "näyttää-väärältä" -ongelmia.
- `design:design-system` — KÄYTÄ kun audit naming-inkonsistensseja TAI lisäät uutta komponenttia design-systemiin
- `design:design-handoff` — KÄYTÄ kun screen on valmis ja menee dev-handoffiin (ei tämän projektin oma vaihe, mutta käytettävissä)
- `design:research-synthesis` — KÄYTÄ jos käyttäjä antaa research-dataa (NPS, haastattelu, support tickets)
- `design:user-research` — KÄYTÄ jos suunnitellaan uutta featurea jonka pohjaksi tarvitaan 
Ui-ux-pro-max
frontend-design

**Käyttäjän erityispyyntö:** jos `design:taste-frontend` -niminen skilli on saatavilla (osa käyttäjän asentamia plugineja), käytä sitä KAIKEEN frontend-uudistukseen. Jos sitä ei ole, käytä `design:design-critique` + `ui-ux-pro-max` -yhdistelmää saman vaikutuksen saavuttamiseksi.

---

## 3. 21st.dev-sourcing — pakollinen jokaisessa uudessa UI-komponentissa

Ennen kuin koodaat ÄLÄKÄ keksi tyhjästä mitään seuraavista: nappi-tyyli, stepper, picker, kortti, lista-rivi, modaali, dropdown, tooltip, callout, results-card, navigaation kuvio, dialogi:

1. Visit `21st.dev/s/<relevant-term>` Playwrightilla
   - Yleisimmät hakusanat: stepper, dropdown-menu, user-menu, results, score-card, timeline, steps, faq, pricing, segmented-control, radio-group, dialog, modal, toast, lesson, article, markdown, callout, banner, breadcrumbs, tabs
2. Screenshot 2–3 kandidaattia → `references/app/<feature>/21stdev/`
3. Pick the most restrained dark option matching Puheo's Linear-tier aesthetic (welttisempi viivapaksuus, säästeliäs accent, ei loud-glow)
4. Port React+Tailwind → vanilla CSS matching `css/landing.css` ja olemassa olevien komponenttien token-systeemi (`--accent`, `--surface`, `--text` jne.)
5. Cite EXACT 21st.dev component URL IMPROVEMENTS.md-rivissä

Jos 21st.devistä ei löydy sopivaa: fall back järjestyksessä:
1. Magic UI (`magicui.design`)
2. shadcn (`ui.shadcn.com`)
3. Aceternity UI
4. Tailwind UI free / HyperUI

Sama workflow: screenshot → port → cite. Älä keksi tyhjästä.

**Poikkeus**: pieniä Puheo-spesifisiä asioita (esim. streak-chip, kurssikortti) joilla on jo olemassa oleva pattern, voi laajentaa olemassa olevaa komponenttia ilman uutta sourcing-passia. Mutta jos elementti on uudentyyppinen (esim. ensimmäinen modaali tai ensimmäinen segmented-control), sourcaus on pakollinen.

---

## 4. Verifiointi joka loopissa

Joka loop päättyy nämä tehden:

1. **axe-core sweep** kaikilla muutetuilla / uusilla screeneillä @ 1440 + 375 → 0 violations. Korjaa kaikki ennen loop:n päättämistä.
2. **Playwright screenshot + design:design-critique** muutetuilla screeneillä → applya feedback.
3. **E2E-testi** ainakin yhdelle keskeiselle user-flowille (loop-spesifinen, määritellään kunkin LPLAN-tiedoston UPDATE-listoissa).
4. **IMPROVEMENTS.md** — yksi rivi per UPDATE, prefix `[YYYY-MM-DD L-PLAN-N]`, mainitsee käytetyt skillit ja 21st.dev-URLit.
5. **AGENT_STATE.md** — päivitä `Last completed loop` ja `Next loop` kentät.
6. **SW-bumppi** jos STATIC_ASSETS muuttui (uusia .css/.js-tiedostoja lisätty).
7. **`graphify update .`** jos koodi muuttui (AST-only, 0 token-kustannus). Pitää `graphify-out/`:n synkassa, jotta seuraava istunto näkee oikean rakenteen.

---

## 5. Mitä EI saa tehdä

- ÄLÄ koske landing-pageen (`index.html`, `css/landing.css`) jollei loop sitä eksplisiittisesti vaadi
- ÄLÄ poista olemassa olevia screenejä — kommentoi ne `<!-- LEGACY ... -->` -tyyppisesti, varsinainen poisto myöhempänä loopissa
- ÄLÄ bumppaa SW jos STATIC_ASSETS ei muuttunut
- ÄLÄ aja Supabase-migraatioita itse (käyttäjä ajaa SQL-editorissa) — sen sijaan kirjoita ACTION REQUIRED -ohje IMPROVEMENTS.md:hen
- ÄLÄ kirjoita uusia OpenAI-kutsuja ilman puheo-ai-prompt-skillin pohjaa
- ÄLÄ kirjoita copyä ilman puheo-finnish-voice-skillin tarkistusta
- ÄLÄ keksi UI-komponenttia ilman 21st.dev-sourcing-passia (paitsi triviaali laajennus olemassa olevasta)

---

## 6. Loop-tiedostot

**Aktiiviset (juuressa):**
- `AGENT_PROMPT_STANDARDS.md` — tämä tiedosto
- `AGENT_PROMPT_LIVE_AUDIT_P2.md` — viimeisin shipattu referenssi (säilytetään juuressa esimerkkinä formaatista)

**Arkistoidut (`docs/archive/agent-prompts/`):** kaikki shipatut briefit, ml. LPLAN1-8, LIVE_AUDIT_P0/P1, HOME_HOTFIX_2/3, MERGE_DASH_PATH, COURSE_1, HOTFIX_LESSON_RUNNER, HOTFIX_PRICING1/2, SECURITY1/2, LINT_CLEANUP.

Aja yksi looppi kerrallaan järjestyksessä. `/clear` looppien välissä — uudessa istunnossa tämä STANDARDS-tiedosto + `AGENT_STATE.md` riittää contextiksi.

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
