# Puheo Agent State

**Last updated:** 2026-05-03
**Current state:** L-CLEANUP-1 shipped — context-preload now ~10k tokens (was ~40k).

---

## Recent loops (last 5)

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

### L-LIVE-AUDIT-P0 — 2026-05-03 ✓ shipped
**Scope:** Critical bugs — exam confirm modal + discard endpoint, heatmap empty-state, quick-review contrast, exit-active-exercise nav, /api/config/public 404.
**Files:** 5. **SW:** v110→v111. **Tests:** 1067/1067 ✓.

### L-PLAN-8 (+ hotfix) — 2026-04-XX ✓ shipped
**Scope:** Landing-polish + dashboard empty-state + a11y. **SW:** v103→v106.

---

## Next loop

**Recommended:** Käyttäjän päätös. Vaihtoehdot: L-STRIPE-1 (Stripe-migraatio), L-LIVE-AUDIT-P1 UPDATE 8 (kategoriavärit), uusi feature.

**Pending decisions (käyttäjältä):**
- L-LIVE-AUDIT-P1 UPDATE 8 — kategoriaväri-strategia

**Recurring blockers:**
- Playwright E2E gated since d3f5ca5 (workflow_dispatch + secrets-puute)
- Manual prod verify after every Vercel deploy on käyttäjän tehtävä

---

For older loop history (L-PLAN-1 through L-PLAN-7 + L-SECURITY-1+2 + hotfixes), see `docs/archive/AGENT_STATE_HISTORY.md`.
