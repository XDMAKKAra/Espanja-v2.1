# PUHEO PLANNER — suunnitteluistunto (A)

> **Käyttöohje:** Avaa Claude Code projektihakemistossa, pasta `Lue ja toimi AGENT_PROMPT_PLANNER.md mukaan` ja aloita keskustelu. Tämä tiedosto on ELÄVÄ — kun käyttäjä sanoo "compactoi" tai "compact", planner päivittää §3:n ("Tämänhetkinen tila") uusimmaksi ja poistaa vanhentuneet tiedot. §1 ja §2 (vakio-osat) eivät muutu compactauksessa.

---

## 1. Projekti — vakio (älä muuta)

**Puheo** on AI-pohjainen espanjan YO-kokeen valmennusalusta lyhyen oppimäärän lukiolaisille. YO-arvosanat I/A/B/C/M/E/L (EI CEFR). Tech: Node + Express + Supabase + OpenAI + vanilla JS frontend. Repo: `C:\Users\marce\OneDrive\Documents\espanja paska`. Tuotanto: https://espanja-v2-1.vercel.app.

**Käyttäjän tunnetut periaatteet:**
- YO-arvosanat I/A/B/C/M/E/L, EI CEFR
- Mastery on signaali, EI gate
- Pre-generated kurssin sisältö Claude Codella, ei OpenAI runtimessa
- Education-skillit määräävät pedagogian, prompit määrittävät brand-säännöt + määrät
- "Tämä YO-kokeessa" -kytkös on Puheon brand-promise
- Älä committaa Git:iin agentista (käyttäjä tekee sen)
- Älä deployaa agentista (käyttäjä tekee sen)

**Pakollinen lukemistus joka istunnon alussa (tässä järjestyksessä):**
1. CLAUDE.md
2. AGENT_PROMPT_STANDARDS.md
3. AGENT_STATE.md (max 50 riviä, "Last completed loop" + "Next loop")
4. BUGS.md (mitä korjattavaa)
5. IMPROVEMENTS.md (10 viimeistä riviä)
6. graphify-out/GRAPH_REPORT.md (community-rakenne; käytä `graphify query/path/explain` cross-module-kysymyksiin grep:n sijaan)
7. .ruflo/config.json (policy)

---

## 2. Plannerin rooli — vakio (älä muuta)

**MITÄ TEET:**
- Keskustelet käyttäjän kanssa, lukea projektitilan, kirjoitat loop-promptin jonka käyttäjä syöttää erilliseen toteutusistuntoon (B)
- Suosittelet 1–3 vaihtoehtoa seuraavalle loopille perusteluineen (impact/effort, blocker-vapautus, käyttäjän testikäynti, jne)
- Brainstormaat skopea käyttäjän kanssa
- Jos käyttäjä sanoo "compactoi" tai "compact" → päivität §3:n alla (poista vanhentuneet, lisää uudet) ja vahvistat että se tehtiin
- Päivität §3:n myös uuden istunnon ALUSSA luettuasi pakollisen lukemistuksen, jos AGENT_STATE.md on edennyt enemmän kuin §3 tietää

**MITÄ ET TEE:**
- Et kirjoita itse koodia tai muuta Puheon toteutustiedostoja (HTML/CSS/JS/JSON)
- Et muuta §1 tai §2 koskaan ilman erillistä lupaa
- Et committaa Gitiin
- Et deployaa
- Et copy-pastea koko AGENT_PROMPT_STANDARDS.md tai BUGS.md sisältöä B-istunnon promptiin — viittaa polulla, B lukee itse

**LOPPUTUOTE B-istunnon prompti sisältää:**
- Loop-tunniste (esim. L-RUFLO-LOOP-7 tai L-NEW-LANGUAGE-INFRA-1)
- Tarkka scope (mitä tehdään, mitä EI tehdä)
- Pakollinen lukemistus polulla
- Skill-set joka avataan: ui-ux-pro-max + design:taste-frontend (tai fallback design:design-critique + ui-ux-pro-max) + design:accessibility-review + 21st.dev-sourcing jos uusi UI + marketing:brand-review jos copya
- Verify-checklist
- Guardrailit (älä committaa, älä deployaa)

---

## 3. Tämänhetkinen tila — ELÄVÄ (compactaus päivittää tämän)

> **Compactaus-protokolla:** kun käyttäjä sanoo "compactoi" tai "compact":
> 1. Lue AGENT_STATE.md, IMPROVEMENTS.md (10 viimeistä riviä), BUGS.md (P0+P1 määrä), session-keskustelu
> 2. Tunnista: mitä on valmistunut, mitä on kesken, mikä suunta on muuttunut
> 3. POISTA §3:sta merkinnät jotka eivät enää ole relevantteja (esim. valmis-loopit jotka ovat jo AGENT_STATE.md:ssä, hylätyt suunnat, vanhentuneet bugit)
> 4. LISÄÄ tilalle: tuoreimmat valmistuneet asiat, kesken oleva työ, uudet suunnitelmat keskustelusta
> 5. Pidä §3 max ~40 riviä — jos ylittyy, poista vanhin tai tiivistä
> 6. Vahvista käyttäjälle "compactaus tehty" + listaa mitä lisättiin/poistettiin
> 7. ÄLÄ koske §1 tai §2 — ne ovat vakio
> 8. ÄLÄ tallenna keskeneräisiä loop-prompteja tähän — niille on oma tiedosto juuressa (AGENT_PROMPT_<LOOP_NAME>.md)

### Strateginen päätös 2026-05-07
**Scope:** 3 kieltä (es/fr/de) × lyhyt oppimäärä, pitkät pois. TAM ~3173/v.
**Hinnoittelu:** 3-tier (Free / Treeni €9-19 / Mestari €19-39) — ROADMAP.md kertoo logiikan. Single-language vaiheessa 1.
**Sisältö** käsin tehty per kieli (käyttäjä + kaverit tarkistavat yo-kirjoittaessaan).
**AI:n rooli:** arviointi + adaptiivisuus + synonyymitarkistus, EI tehtävien generointia.
**Markkinointi:** sosiaalinen media + SEO.

### Viimeiseksi valmistunut
- L-RUFLO-LOOP-1...5 (2026-05-06): P0-sweep + kurssit-osio etusivulle + results-redesign + audit-pass. PR #30.
- L-LESSON-BATCH-7 (2026-05-06): kaikki 90 espanja-lyhyt-oppituntia generoitu, validoitu.
- Graphify + Obsidian integroitu (2026-05-07).
- L-LANDING-CONVERT-1 ✓ shipped (2026-05-07): body-class fix + hero-mockup + A→E rail.
- L-ONBOARDING-REDESIGN-1 ✓ shipped (2026-05-07): V3 9-vaiheinen flow.
- L-PRICING-REVAMP-1 ✓ shipped (2026-05-07): 3-tier + Stripe-routes + Tähtäin→Mestari + kesäpaketti-cleanup. SW v134→v135. ACTION REQUIRED: Stripe-dashboard tuotteet+webhook + `npm install stripe` (Stripe-toimet vain pyydettäessä).

### Uusi prompt-rakenne 2026-05-07
**Kaikki loop-briefit ovat nyt `agent-prompts/`-kansiossa numerojärjestyksessä.** Plannerin (sinun) ei tarvitse enää keksiä "next loop" -nimeä — se on aina `agent-prompts/02-queue/`-kansion pienin numero. Käyttäjä ajaa sen META_QA_LOOP-orkestraattorin kautta:
> `Lue ja toimi agent-prompts/META_QA_LOOP.md mukaan`
Orkestraattori hoitaa 4-vaiheen pipeline:n (implement → verify [code-review + Playwright + a11y rinnakkain] → fix → close-out joka poistaa active-promptin). Jonon näkymä: `agent-prompts/INDEX.md`.

### Viimeiseksi valmistunut (lisäys 2026-05-07)
- L-DB-TABLE-FIX-1 ✓ shipped: routes/onboarding.js + middleware/auth.js + routes/stripe.js käyttävät nyt `user_profile`-taulua. Migraatiot ajettu MCP:llä.

### Kesken / odottaa toimintaa
- **Aktiivinen jono** (`agent-prompts/02-queue/`):
  - **05_FRONTEND_POLISH_1** — NEXT (visuaalinen polish 4 päänäkymälle ennen markkinointia)
  - **06_LESSON_PREP_DE_FR_1** — research-loop, yo-rubriikit + curriculum-spec saksalle ja ranskalle, canonical-pipeline-template DE/FR
  - **07_LESSONS_DE_LYHYT** — 90 saksa-lessonia canonical-pipelinen kautta (edellyttää 06)
  - **08_LESSONS_FR_LYHYT** — 90 ranska-lessonia (edellyttää 06)
  - **09_LINT_CLEANUP** — 101 warningia
  - **10_LIVE_AUDIT_P2** — production perf-audit
  - **11_SEO_BROADENING_1** — abikurssi-keyword + 6 blog-postausta (perustuu `docs/seo-keywords.md`)
  - **12_SOCIAL_CONTENT_PLAYBOOK** — TikTok/Reels-launch + 30 skriptiä (pää-growth-vivu)
- ✓ valmiit (kaikki 2026-05-07): ONBOARDING-REDESIGN-1, PRICING-REVAMP-1, DB-TABLE-FIX-1, BUG-HUNT-DASHBOARD-1, PRICING-REVAMP-2, LANG-INFRA-1, LANG-LANDINGS-1.
- USE_PREGENERATED_LESSONS=true Vercelliin (käyttäjän toimi).
- Stripe-dashboard tuotteet+webhook + `npm install stripe` (käyttäjän toimi, vain pyydettäessä).

### Tehdyt MCP-toimet 2026-05-07
- ✓ `add_target_language_and_level_to_user_profile` — onboarding-kentät
- ✓ `add_subscription_tier_columns_to_user_profile` — Mestari/Treeni-tier + Stripe-id:t
- ✓ `create_free_usage_table` — Free-tier-kvootit, RLS owner-policyt
- ✓ `create_stripe_events_table` — webhook-idempotenssi, RLS service-role-only
- Supabase advisorit: 0 erroria, 11 INFO-tasoista (RLS-päällä-policyttä-tauluja jotka käyttävät service-rolea — OK), 1 WARN (auth_leaked_password_protection — Supabase-asetuksissa toggle, käyttäjän valinta)

### Hylätyt
- Pitkät oppimäärät (Espanja 109/v, Saksa 463/v, Ranska 300/v — liian pieni TAM laajennukseen).
- Runtime-AI-lessongenerointi (käyttäjän päätös: kaikki sisältö käsin tehty).
- Natiivi-tarkastajien palkkaaminen (käyttäjä + kaverit tarkistavat yo-kirjoittaessaan).
- L-LANDING-VIDEO-2 (Remotion) — lykätty kunnes app ship-ready.
- Ruflo-asennus npmistä (rikki).

---

## 4. Aloitusrutiini istunnon alussa

Kun istunto käynnistyy `Lue ja toimi AGENT_PROMPT_PLANNER.md mukaan`-pyynnöllä, tee tämä järjestyksessä:

1. Lue §1, §2, §3 tästä tiedostosta
2. Lue pakollinen lukemistus (§1)
3. Vertaa §3:n sisältöä todelliseen tilaan AGENT_STATE.md + IMPROVEMENTS.md:ssä — onko jotain valmistunut mitä §3 ei tiedä?
4. Jos on → ehdota käyttäjälle compactausta ENNEN keskustelun aloittamista
5. Sitten kerro yhteenveto:
   - Missä Puheo on nyt (1–2 lausetta)
   - Mitä BUGS.md:ssä on jäljellä (P0/P1/P2 määrät, kriittisimmät)
   - 1–3 ehdotusta seuraavalle loopille perusteluineen
6. Odota käyttäjän valintaa, sitten brainstormaa scope kanssaan
7. Kun scope on selvä, kirjoita B-istunnon prompti (tai uusi `AGENT_PROMPT_<LOOP>.md`-tiedosto jos käyttäjä haluaa pysyvän)

---

## 5. Compactaus-esimerkki

**Käyttäjä:** "compactoi"

**Planner:** *(lukee AGENT_STATE.md uudet rivit, IMPROVEMENTS.md uudet 5 riviä, palaa §3:een)*

> Compactaus tehty. Päivitin §3:
>
> **Lisätty "Viimeiseksi valmistunut":**
> - L-RUFLO-LOOP-6 (2026-05-08): P1-1 dashboard empty space + P1-3 results redesign. 21st.dev-sourcing: results-card patternista. design:taste-frontend ajettu, axe 0/0.
>
> **Poistettu "Kesken":**
> - "BUGS.md P1-klusterit (dashboard + results)" — nyt valmis
>
> **Lisätty "Suunnitteilla":**
> - Käyttäjän viime sessiosta: harkitsemme uuden kielen (saksa lyhyt) lisäämistä. Edellytys: nykyinen Vaihe C ship-ready ensin. Skeleton-arkkitehtuuri-keskustelu pitäisi käydä erillisessä loopissa.

Näin uusi A-istunto näkee tuoreen tilan §3:sta ja vanhentuneet asiat ovat poissa.

---

## 6. Mitä EI tallenneta tähän tiedostoon

- Yksittäiset B-istuntoon menevät loop-prompit — niillä on oma tiedosto `AGENT_PROMPT_<LOOP_NAME>.md`
- Worker-raportit — ne menevät IMPROVEMENTS.md:hen
- Bug-listat — BUGS.md on kanoninen lähde
- Viimeisten loopien tarkka diff — AGENT_STATE.md ja git history
- Pidempi visio / roadmap — jos sellainen tarvitaan, oma tiedosto `ROADMAP.md` juureen

§3 on vain **session-tason muisti**: mitä juuri valmistui, mitä on kesken, mitä brainstormataan. Ei pitkän aikavälin dokumentaatio.
