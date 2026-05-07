# Agent Prompt INDEX

> **Päivitetään automaattisesti META_QA_LOOP-orkestraattorin Vaihe 4:ssä jokaisen loopin lopussa.**
> Manuaalinen päivitys vain kun lisäät/poistat/uudelleenjärjestät prompteja queue:hen.

**Last updated:** 2026-05-07

---

## Aktiivinen (juuri ajossa)

_Tyhjä_

---

## Jono (numerojärjestys = ajojärjestys)

| # | Brief | Status | Skoop |
|---|---|---|---|
| 05 | `02-queue/05_LINT_CLEANUP.md` | 🟢 P3 | ESLint/parse-error-cleanup, 101 warningia |
| 06 | `02-queue/06_LIVE_AUDIT_P2.md` | 🟢 P3 | Production perf-audit, fontit self-host, ennen/jälkeen-mittaus |

---

## Valmiit (arkisto)

`agent-prompts/03-done/` — säilössä referenssinä, ei poisteta.

- `AGENT_PROMPT_ONBOARDING_REDESIGN_1.md` — ✓ 2026-05-07 (V3 9-vaihe)
- `AGENT_PROMPT_PRICING_REVAMP_1.md` — ✓ 2026-05-07 (3-tier + Stripe)
- `AGENT_PROMPT_DB_TABLE_FIX_1.md` — ✓ 2026-05-07 (user_profile-taulu)
- `01_BUG_HUNT_DASHBOARD_1.md` — ✓ 2026-05-07 (profile.js [object Object] + dashboard.js NaN-guard)
- `02_PRICING_REVAMP_2.md` — ✓ 2026-05-07 (paywall-wirings + Settings tier + Customer Portal)
- `03_LANG_INFRA_1.md` — ✓ 2026-05-07 (data/courses/{es,de,fr} split + AI-prompt lang-param + Coming-Soon-screen + Settings lang-vaihto)
- `04_LANG_LANDINGS_1.md` — ✓ 2026-05-07 (per-lang SEO landings `/espanja-yo-koe`/`/saksan-yo-koe`/`/ranskan-yo-koe` + waitlist email + sitemap/robots)

---

## Templatet (recurring)

`agent-prompts/templates/` — älä numeroi, älä siirrä.

- `AGENT_PROMPT_LESSON_BATCHES_AUTONOMOUS.md` — canonical lesson-generointi-pipeline (16-skill-set + adaptiivinen vaikeus + frontend-tarkistus)
- `AGENT_PROMPT_RUFLO_LOOP.md` — recurring P0/P1-sweep-template

---

## Orkestraattori

`agent-prompts/META_QA_LOOP.md` — top-level B-istunto-prompti. Pasta tämä komento kun haluat ajaa seuraavan loopin:

> `Lue ja toimi agent-prompts/META_QA_LOOP.md mukaan`
