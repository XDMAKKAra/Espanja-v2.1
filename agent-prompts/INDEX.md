# Agent Prompt INDEX

> **Päivitetään automaattisesti META_QA_LOOP-orkestraattorin Vaihe 4:ssä jokaisen loopin lopussa.**
> Manuaalinen päivitys vain kun lisäät/poistat/uudelleenjärjestät prompteja queue:hen.

**Last updated:** 2026-05-13 (L-LESSON-PREP-DE-FR-1 valmis → 06 arkistoitu, 07 = NEXT)

---

## Aktiivinen (juuri ajossa)

_Tyhjä_

---

## Jono (numerojärjestys = ajojärjestys)

| # | Brief | Status | Skoop |
|---|---|---|---|
| 07 | `02-queue/07_LESSONS_DE_LYHYT.md` | 🔴 NEXT | 90 saksa-lyhyt-oppituntia (canonical pipeline). Edellyttää 06 (✓ valmis). BLOCKER: `scripts/validate-lessons.mjs` `--lang=`-tuki puuttuu — ks. `agent-prompts/templates/VALIDATE_LESSONS_LANG_SUPPORT_TODO.md`. |
| 08 | `02-queue/08_LESSONS_FR_LYHYT.md` | 🟡 P1 | 90 ranska-lyhyt-oppituntia. Edellyttää 06 (✓ valmis) + sama validate-blocker. |
| 09 | `02-queue/09_LINT_CLEANUP.md` | 🟢 P3 | ESLint/parse-error-cleanup, 101 warningia |
| 10 | `02-queue/10_LIVE_AUDIT_P2.md` | 🟢 P3 | Production perf-audit, fontit self-host, ennen/jälkeen-mittaus |
| 11 | `02-queue/11_SEO_BROADENING_1.md` | 🟡 P2 | Abikurssi-keyword + 6 blog-postausta. Perustuu `docs/seo-keywords.md`-dataan. |
| 12 | `02-queue/12_SOCIAL_CONTENT_PLAYBOOK.md` | 🟡 P2 | TikTok/Reels-launch: 5 pilaria, 30 valmista skriptiä, mittarit. |

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
- `05_FRONTEND_POLISH_1.md` — ✓ 2026-05-07 (visuaalinen polish 4 päänäkymälle: onboarding/dashboard/mode-pages/pricing+landing; a11y-fixit 3 critical + 3 serious)
- `06_LESSON_PREP_DE_FR_1.md` — ✓ 2026-05-13 (yo-rubriikit DE+FR, LANG_CURRICULA.{de,fr} 8 kurssia A→E, curriculum-spec kavereille, DE/FR canonical lesson-template + validate-skripti-TODO)
- `13_HERO_COUNTDOWN_AND_OFFCANVAS_MENU.md` — ✓ 2026-05-13 (YO-countdown landing-heroon 4 kielelle + slide-in off-canvas mobile-nav app-shelliin focus-trapilla)

---

## Templatet (recurring)

`agent-prompts/templates/` — älä numeroi, älä siirrä.

- `AGENT_PROMPT_LESSON_BATCHES_AUTONOMOUS.md` — canonical lesson-generointi-pipeline (16-skill-set + adaptiivinen vaikeus + frontend-tarkistus)
- `AGENT_PROMPT_RUFLO_LOOP.md` — recurring P0/P1-sweep-template

---

## Orkestraattori

`agent-prompts/META_QA_LOOP.md` — top-level B-istunto-prompti. Pasta tämä komento kun haluat ajaa seuraavan loopin:

> `Lue ja toimi agent-prompts/META_QA_LOOP.md mukaan`
