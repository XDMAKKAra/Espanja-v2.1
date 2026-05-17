# Handoff — 2026-05-17 landing + app surgical fixes

Carries the working context from the chat that ran `/impeccable critique` → editorial-paper rebuild (rolled back) → ValintakoeFPro-style surgical fixes → Playwright verification → app surgical-2. Paste the final section into a fresh chat to resume.

## Where things stand

### Production (espanja-v2-1.vercel.app, sw cache v166)

**Landing (`index.html`):**
- 10 sections cut to 5: Hero / Testimoniaalit / Pricing / FAQ / Final CTA / Footer.
- Hero headline (ValintakoeFPro-style): *"YO-koe espanjasta, saksasta tai ranskasta 28.9.2026. Oletko valmis?"*
- Grader card (Ainon arvioitu sähköposti + YTL-rubriikki 13/20) promoted from old §7 to the hero right column. Replaced the browser-frame-with-dashboard-screenshot.
- 3 beta-tester testimonials (alkukirjain-attribuutio: AK, MV, RL) before pricing.
- Trust line claims YTL-rubric credibility, not user-count.
- Removed: floating fake-streak chip, language hub, 8-course grid, problem lede, 3-pillar grid, how-it-works, separate grader showcase.
- Live countdown still ticks (`134 pv` mobile, `134 PV 08 H 52 MIN` desktop).

**App (`app.html`):**
- Täyskoe-typot korjattu (`täyskoe`, `ymmärtäminen`, `pitkä`, `täydellinen`).
- `dash-hero-grade` got a visible info-icon + `aria-haspopup="dialog"` + `aria-expanded`.
- Mastery-result hierarchy flipped: percentage first (data), small emoji as pinned marker after.
- Decorative `01 02 03` ordinals on mode-page topic buttons hidden via CSS (`.mode-topic__n { display: none }`). DOM kept intact in case JS keys off it.

### On disk, not loaded (archive)

- `css/landing-editorial-tokens.css` — editorial-paper register tokens (Source Serif 4, warm off-white, muted teal). The rebuild was rolled back because the audience is closer to Mafy/Astra register than NYT Magazine, but the file is kept for reference if you ever want to revisit the editorial direction.
- `css/landing-editorial.css` — hero + grader CSS for that rebuild.
- Both files removed from `sw.js` STATIC_ASSETS so they're not even pre-cached.

### Strategic context now in repo

| File | Purpose |
|---|---|
| `PRODUCT.md` | Brand register (`brand`), audience (Finnish lukiolaiset 16–19, lyhyt kieli yo-koe), anti-references (Linear/Vercel/Cursor; Duolingo/Cake; Quizlet/Anki/MAOL/Otava; ChatGPT framing), 5 design principles, WCAG 2.2 AA. |
| `DESIGN.md` | Visual-system end-of-life baseline ("Tinted-Mint Workshop") — the dark register Puheo still ships. 6-section Stitch format. |
| `.impeccable/design.json` | Sidecar with tonal ramps, shadows, motion, breakpoints, component snippets, narrative. |
| `docs/superpowers/specs/2026-05-16-landing-editorial-rebuild-design.md` | Editorial rebuild brief (rolled back, kept as artifact). |
| `docs/superpowers/specs/2026-05-17-dashboard-widget-consolidation-design.md` | **Next work** — Plan B2. Cuts dashboard from 14 conditional widgets to 5 always-visible + 2-3 conditional. Mode-briefing-stats removal. Smart-default writing-mode aloitus. Needs a dashboard.js audit first so removing IDs doesn't null-deref. |

### Competitor map (used in critique)

| Tuote | Hero | Visual | Proof | Hinta |
|---|---|---|---|---|
| Mafy | "Me uskomme jokainen voi oppia oppimaan" | Vaalea, ulkokuvat | 20 k opiskelijaa, 77% lääkikseen | Hidden |
| Eezy Valmennuskeskus | "50 v valmennusta" | Vaalea + sininen | 13 k asiakasta, 97% tyytyväisyys | Hidden |
| **ValintakoeFPro** | "Alle 30 päivää valintakoe F:ään — oletko valmis?" | Vaalea, countdown-urgency | 300 opiskelijaa, 4.7/5, 3 testimonials | 34,99 € kerta |
| Astra AI | "Pass exams 2x faster" | Vaalea, keltainen | 1M+ users, 4.87★, raha takaisin | Free → sub |
| WordDive | "Murra kielimuuri" | Vaalea, ystävällinen | (niukka) | 8,92–10,99 €/kk |
| Studeo | "Sukelletaan…" | Vaalea, B2B | 94% suosittelee | B2B vuosi |

**Insight:** Every Finnish edu competitor is LIGHT mode. Puheo's dark register is the category outlier. Brand-distinctive but anti-category. Decision so far: keep dark for now (data-decision-not-mine), but if conversion data later supports light, that's a single token-flip away.

## Loops shipped this session

| Loop | PR | Commit | Cache |
|---|---|---|---|
| Editorial-paper rebuild | — | (rolled back) | v164 |
| Landing surgical-1 | [#59](https://github.com/XDMAKKAra/Espanja-v2.1/pull/59) | `2e248d2` | v165 |
| App surgical-2 | [#60](https://github.com/XDMAKKAra/Espanja-v2.1/pull/60) | `9507464` | v166 |

Both PRs auto-merged via `gh pr merge --squash --delete-branch --auto`. Vercel auto-deployed; both verified live via `node _audit/landing-surgical-1/audit.mjs` (Playwright + Node).

## Open work

**B2 — Dashboard widget consolidation** (brief in `docs/superpowers/specs/2026-05-17-dashboard-widget-consolidation-design.md`).
Three sub-loops planned:
1. Audit `dashboard.js` for which IDs can be DOM-removed vs CSS-hidden without null-deref.
2. CSS-only hide cut-list (`dash-tutor`, `daily-challenge`, `dash-heatmap`, `dash-adaptive-card`, `dash-ai-usage`, `dash-modes`, `dash-recommendations`, `dash-placement-retake`, all `.mode-briefing` blocks). Playwright e2e validation.
3. HTML cleanup once JS-safe. Smart-default writing-mode aloitus.

**Open user questions** (carry into next chat):
- Heatmap fans: keep on profile/progress page, or cut entirely?
- Daily-challenge vs day-CTA: which wins (currently both compete)?
- Mode-briefing per-mode-tarkkuus: collapse to one line ("Viime sanasto-treenissä 84 %") or remove fully?
- Test-account credentials: still needed if you want Playwright to audit auth-protected screens.

**Things NOT to redo:**
- Don't restart the editorial-paper rebuild without a deliberate decision. The artifact is on disk; revive only if a register A/B test demands it.
- Don't move register to light just because all competitors are light. That's a data-driven decision, not a copy-paste from Mafy.
- Don't replace alkukirjain-testimonial attribution with full made-up names. If those quotes go to real users, get permission and use real attribution.

## Memory entries the next chat will inherit

These already live in `~/.claude/.../memory/`:

- `feedback_sw_cache_bump.md` — bump CACHE_VERSION on every static-asset edit
- `feedback_node_check_before_commit.md` — `node --check` before commit
- `feedback_auto_push_workflow.md` — auto-branch + `gh pr merge --auto`, don't push to main directly
- `feedback_playwright_works_in_harness.md` — `npx playwright test` works; project uses Node Playwright not Python
- `feedback_playwright_gate.md` — `addInitScript` sets `puheo_gate_ok_v1=1` before goto
- `feedback_curriculum_uses_ytl_grades.md` — I/A/B/C/M/E/L, not CEFR
- `feedback_skip_measurement_gates.md` — chain the loop, user reads the ledger after
- `feedback_brief_placement_overprescription.md` — say intent + constraints, let worker pick composition

## Resume prompt — paste into a new chat

```
Continue the Puheo landing-and-app polish work from 2026-05-17.

Read `docs/superpowers/HANDOFF-2026-05-17-landing-and-app-surgical.md`
for the full state. Two production deploys shipped this week:

- PR #59 (v165): landing 10 → 5 sections, grader card promoted to hero,
  ValintakoeFPro-style headline, 3 beta-tester testimonials, removed
  problem/pillars/lang-hub/courses/steps/grader-showcase sections.
- PR #60 (v166): app surgical fixes — täyskoe typos, dash-hero info
  icon, mastery-result hierarchy flip, decorative ordinals hidden.

Next planned loop is B2 — dashboard widget consolidation, brief at
`docs/superpowers/specs/2026-05-17-dashboard-widget-consolidation-design.md`.
Plan is 14 conditional widgets → 5 always-visible + 2-3 conditional.
First sub-loop: audit dashboard.js for null-deref risk before any DOM
changes. Don't start coding until you've read both that brief and
PRODUCT.md.

Anchored anti-references stay: Linear/Vercel/Cursor (banned dark SaaS),
Duolingo/Cake (banned cartoon), Quizlet/Anki/MAOL/Otava (banned mute or
dated). Audience: Finnish lukiolaiset 16-19, lyhyt-language yo-koe.
Differentiator: YTL-rubriikkiarviointi suomeksi.

Start by either:
  (a) "execute B2" — begin the dashboard consolidation, first sub-loop
      = dashboard.js audit
  (b) "test-creds: email pass" — Playwright audit on auth-protected
      screens before any code changes
  (c) "critique X" where X is a specific area (e.g. `app onboarding`,
      `pricing page mobile`, `/espanja-yo-koe SEO landing`)

If unclear what to do, read PRODUCT.md + the open questions in the
handoff doc, then ask before touching code.
```

---

*Handoff written at end of 2026-05-17 chat. Session shipped 2 PRs, 2 cache bumps, 1 critique, 1 rebuild that was rolled back, and 1 plan brief for the next loop.*
