# Puheo Agent State

**Last updated:** 2026-05-03
**Current state:** L-LIVE-AUDIT-P2 shipped (pending: Vercel manual measurements + Supabase indexes)

---

## Recent loops (last 5)

### L-LIVE-AUDIT-P2 — 2026-05-03 ✓ shipped
**Scope:** Performance — bundling, batch APIs, vocab pre-gen, theme-toggle View Transitions, self-host fonts.
**Files:** 14 changed across 3 PRs (#10, #11, #12).
**Deliverables:** SW v112→v115, `app.bundle.css` 232 KB, `app.bundle.js` 318 KB, `/fonts/` self-hosted.
**Tests:** 1067/1067 ✓.
**Pending:** Lighthouse cold-load mittaus tuotannossa, Supabase index ACTION REQUIRED (`user_progress(user_id, mode)` + `attempts(user_id, created_at DESC)`).

### L-LIVE-AUDIT-P1 — 2026-05-03 ✓ shipped
**Scope:** Visual polish — dash-tutor card, level-progress, skill bars, Inter font (not mono), SR-rating buttons, Konteksti badge mint.
**Files:** 8 changed.
**SW:** v111→v112.
**Tests:** 1067/1067 ✓.
**Pending decision (käyttäjältä):** UPDATE 8 category color strategy — 3 vaihtoehtoa (token / mint / neutral). Suositus: token-cleanup.

### L-LIVE-AUDIT-P0 — 2026-05-03 ✓ shipped
**Scope:** Critical bugs — exam confirm modal + discard endpoint, heatmap empty-state, quick-review contrast, exit-active-exercise nav, /api/config/public 404.
**Files:** 5 changed.
**SW:** v110→v111.
**Tests:** 1067/1067 ✓.

### L-PLAN-8 (+ hotfix) — 2026-04-XX ✓ shipped
**Scope:** Landing-polish + dashboard empty-state + a11y. Code-only subset shipped first, deferred items as hotfix.
**SW:** v103→v106.

### L-PLAN-7 — 2026-04-XX ✓ shipped
**Scope:** Kumulatiivinen kertaus — sisäinen + cross-kurssi + SR-pohjainen henkilökohtainen kertaus.
**SW:** v101→v102.

---

## Next loop

**Recommended:** L-CLEANUP-1 in progress (state file rotation + dead-code removal). After that, käyttäjän päätös Stripe-migraatiosta tai uusista featureista.

**Pending decisions (käyttäjältä):**
- L-LIVE-AUDIT-P1 UPDATE 8 — kategoriaväri-strategia

**Recurring blockers:**
- Playwright E2E gated since d3f5ca5 (workflow_dispatch + secrets-puute)
- Manual prod verify after every Vercel deploy on käyttäjän tehtävä

---

For older loop history (L-PLAN-1 through L-SECURITY-2 + hotfixes), see `docs/archive/AGENT_STATE_HISTORY.md`.
