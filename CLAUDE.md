# 🛑 PAKOLLINEN SKILL-STACK — lue tämä ENSIN

Ennen kuin teet **mitään** Write/Edit/Bash-tool-kutsua (Read/Glob/Grep sallittu lukea ensin), sinun TÄYTYY:

1. **Luokitella tehtävä** ja kutsua sen skill-stack `Skill`-toolilla. Skill-stack on pakollinen, ei vihje. Pelkkä skill-nimien listaus briefiin ei riitä — sinun täytyy oikeasti kutsua `Skill`-toolia.

| Luokka | Mitä se on | Skill-stack (kutsu KAIKKI) |
|---|---|---|
| **FRONTEND** | HTML/CSS/JS-UI, landing, app-shell, screen-redesign, animaatio, copy, hero, modaali, nav, layout, visuaalinen korjaus, a11y-fix, mobile-responsive | `frontend-design`, `design-taste-frontend`, `ui-ux-pro-max`, `puheo-screen-template`, `puheo-finnish-voice` |
| **EXERCISE / LESSON** | oppituntien sisältö, sanasto/kielioppi/luetun-ymmärtäminen/kirjoitustehtävät, monivalinta, tasotesti, adaptiivisuus, pisteytys, rubric, hinttiketju | `practice-problem-sequence-designer`, `variation-theory-task-designer`, `retrieval-practice-generator`, `scaffolded-task-modifier`, `worked-example-fading-designer`, `cognitive-load-analyser`, `criterion-referenced-rubric-generator`, `adaptive-hint-sequence-designer`, `puheo-finnish-voice` |
| **TESTING** | Playwright, e2e, käyttäjäpolku-audit, bug-scan, regression-spec, screenshot-vertailu | `webapp-testing`, `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `superpowers:systematic-debugging` |
| **PLANNING / BRIEF** | planner-istunto, brief-kirjoitus, scope-keskustelu, queue-päivitys, audit-suunnittelu | `superpowers:brainstorming`, `superpowers:writing-plans` |
| **SUPABASE / BACKEND** | migraatio, RLS, taulu-muutos, edge function, API-reitti, palvelinpuolen logiikka | `supabase`, `supabase-postgres-best-practices` |

2. **Aloita vastauksesi rivillä:** `Skills invoked: <pilkulla erotettu lista>`. Jos rivi puuttuu, käyttäjä tietää että skipattiin → työ hylätään.

3. **Useampi luokka samassa loopissa** → kutsu KAIKKIEN luokkien stackit. Esim. fix joka muuttaa frontendin ja lisää Playwright-spec:n = FRONTEND + TESTING.

4. **Ainoa poikkeus — pure-discussion:** jos tehtävä on puhdas kysymys/mielipide/keskustelu/file-katselu ilman koodimuutoksia → kirjoita `Skills: none (pure-discussion)` ja jatka normaalisti.

5. **Tämä ei korvaa briefiin kirjoitettua skill-listaa** — molemmat tarvitaan: brief dokumentoi mitä pitäisi käyttää, ja `Skill`-tool-kutsu lataa skillin sisällön kontekstiisi. Ilman tool-kutsua skillin säännöt eivät vaikuta.

Hook `.claude/settings.json` → `UserPromptSubmit` → `.claude/inject-skill-directive.sh` injektoi tämän direktiivin joka käyttäjäpyynnön alkuun. Älä yritä kiertää.

---

# Puheo — Spanish YO-koe Learning App

## Project Overview
AI-powered adaptive Spanish language learning platform for Finnish high school students preparing for the "ylioppilastutkinto" matriculation exam (lyhyt oppimäärä).

## Tech Stack
- **Backend:** Node.js + Express (ES modules)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI API (gpt-4o-mini)
- **Email:** Resend.io
- **Payments:** Stripe
- **Frontend:** Vanilla JS + CSS (no framework)

## Key Commands
- `npm run dev` — Start dev server with auto-reload (port 3000)
- `npm start` — Start production server
- `npm test` — Run vitest test suite

## Project Structure
```
server.js          — Express entry point
api/index.js       — Serverless/Vercel entry point
routes/
  auth.js          — Register, login, password reset, email verify
  exercises.js     — Vocab generate, grade, grammar drill, reading task
  writing.js       — Writing task + AI grading
  progress.js      — Save progress, dashboard data
  email.js         — Weekly progress, streak reminders, preferences
  stripe.js        — LemonSqueezy checkout, portal, webhooks
middleware/
  auth.js          — requireAuth, isPro, requirePro, softProGate
  rateLimit.js     — Rate limiters for auth, AI, registration
lib/
  openai.js        — OpenAI wrapper, shared constants, utilities
app.html           — Main SPA (all screens)
app.js             — Frontend logic (2300+ lines, vanilla JS)
index.html         — Landing page
email.js           — Email templates (Resend)
supabase.js        — Supabase client
```

## Important Notes
- All UI text is in Finnish
- Frontend is a single-page app with screen switching (no router)
- db.js exists but is unused legacy — Supabase is the real database
- Test accounts are configured via env vars (TEST_PRO_EMAILS, TEST_FREE_EMAILS)
- CORS is restricted to ALLOWED_ORIGINS env var

## Conetext Navigation
When you need to understand the codebase,docs, or any files in this project
1. ALWAYS query the knowledge graph first: '/graphify query "your questio"'
2. Only read raw files if i explicitly say "read the file or "look at the raw file"
3. Use ' graphify-out/wiki/index.md' as your navigation entrypoint for browsing sructure

# graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- **Auto-update on commit:** `.git/hooks/post-commit` ajaa `graphify update .`:n automaattisesti aina kun commit koskettaa koodi-tiedostoja (js/mjs/cjs/ts/tsx/jsx/html/css/json/py). Ei API-kuluja (AST-only). Älä poista hookia.
- **Käytä graphify:tä proaktiivisesti:** (a) cross-module-kyselyihin jotka muuten vaatisivat >3 file-luentaa, (b) "miten X liittyy Y:hin" -arkkitehtuuriin, (c) ennen ison refaktoroinnin scope-ehdotusta, (d) kun palaat tyhjästä kontekstista pitkän tauon jälkeen. ÄLÄ käytä yhden tiedoston bug-fix:ssä tai pienissä CSS/copy-muutoksissa — Read/Grep ovat nopeammat.
