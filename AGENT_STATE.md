# Puheo Agent State

**Last updated:** 2026-05-04
**Current state:** L-COURSE-1 shipped (kurssin sisältö pre-generated → Git:iin, infrastruktuuri-loop).

---

## Recent loops (last 5)

### L-COURSE-1 — 2026-05-04 ✓ shipped
**Scope:** Infra — `schemas/lesson.json` + `scripts/validate-lessons.mjs` + `npm run validate:lessons`; `data/courses/kurssi_{1..8}/lesson_1.json` placeholderit; `routes/curriculum.js` `readPregeneratedLesson()` + `USE_PREGENERATED_LESSONS` env-flag; `js/screens/lessonRunner.js` vaihe-pohjainen runner (mastery-banneri, skip-link, side-panel, lesson-results YO-kokeessa-callout); `js/lib/lessonAdapter.js`; `css/components/lesson-runner.css`. Käyttäjän pre-written `PROMPT_GENERATE_LESSON.md` säilyy juuressa.
**Files:** 9 new + 5 modified. **SW:** v116→v117. **Tests:** 1064/1064 ✓. **Build:** clean.
**Pending:** Käyttäjä generoi sisältöä `PROMPT_GENERATE_LESSON.md`-promptilla batch-istunnoissa → `USE_PREGENERATED_LESSONS=true` Vercel-dashissa kun batch valmis. Playwright sweep deferattu (workflow_dispatch-gated).

### L-CAT-COLORS-1 — 2026-05-03 ✓ shipped
**Scope:** L-LIVE-AUDIT-P1 UPDATE 8 follow-up — `--cat-*` tokenit `:root`-tasolle (vocab/grammar/reading/writing/verbsprint), dark-theme override `[data-theme="dark"]`-blokkiin (-700 → -400 shadet AA-kontrastilla #0a0a0a:lla), `mode-page.css` raw-hex → token-referenssi.
**Files:** 3 (`style.css`, `css/components/mode-page.css`, `sw.js`) + bundles. **SW:** v115→v116. **Tests:** 1064/1064 ✓.

### L-CLEANUP-1 — 2026-05-03 ✓ shipped
**Scope:** Documentation siivous (state archive split) + dead-code removal (LemonSqueezy + console.logs + unused imports + stale TODOs).
**Files moved to archive:** 12 agent-prompts + IMPROVEMENTS pre-audit history + AGENT_STATE history.
**Code removed:** routes/stripe.js LemonSqueezy logic + refs in 5 active files + `@lemonsqueezy/lemonsqueezy.js` dep.
**Tokens saved:** ~30k per session (40k → 10k context preload).
**Tests:** 1064/1064 ✓ (was 1067; 3 LemonSqueezy webhook signature tests dropped).

### L-LIVE-AUDIT-P2 — 2026-05-03 ✓ shipped
**Scope:** Performance — bundling, batch APIs, vocab pre-gen, theme-toggle View Transitions, self-host fonts.
**Files:** 14 changed across 3 PRs (#10, #11, #12). **SW:** v112→v115.
**Tests:** 1067/1067 ✓.
**Pending:** Lighthouse cold-load mittaus tuotannossa, Supabase index ACTION REQUIRED (`user_progress(user_id, mode)` + `attempts(user_id, created_at DESC)`).

### L-LIVE-AUDIT-P1 — 2026-05-03 ✓ shipped
**Scope:** Visual polish — dash-tutor card, level-progress, skill bars, Inter font, SR-rating buttons, Konteksti badge mint.
**Files:** 8. **SW:** v111→v112. **Tests:** 1067/1067 ✓.
**Pending decision (käyttäjältä):** UPDATE 8 category color strategy (token / mint / neutral). Suositus: token-cleanup.

---

## Next loop

**Recommended:** Käyttäjä generoi `PROMPT_GENERATE_LESSON.md`-promptilla Batch 1 (Kurssi 1 oppitunnit 1–5). Sen jälkeen L-STRIPE-1 tai L-COURSE-2 (riippuen Batch 1:n havainnoista).

**Recurring blockers:** Playwright E2E gated since d3f5ca5; manual prod verify on käyttäjän tehtävä.

---

For older loop history (L-PLAN-1 through L-PLAN-7 + L-SECURITY-1+2 + hotfixes), see `docs/archive/AGENT_STATE_HISTORY.md`.
