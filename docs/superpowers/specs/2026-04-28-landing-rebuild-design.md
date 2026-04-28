# Landing-page rebuild — design (2026-04-28)

**Status:** approved 2026-04-28. Source-of-truth requirements: `LANDING_PLAN.md` at repo root. This doc captures the execution-level decisions reached in brainstorming after the user wrote LANDING_PLAN.md, and the per-loop breakdown that supersedes the "Loop 42 = item 7" stub in PLAN.md.

## Strategic frame (from LANDING_PLAN.md, copied verbatim so the spec stands alone)

- **Audience:** Finnish high-school students (lukiolaiset) preparing the Spanish YO-koe lyhyt oppimäärä. Address them directly ("sinä"), never parents/teachers.
- **Single goal:** free-account signup. Every CTA points to the existing register flow. Pro upsell happens *inside* the dashboard, never on landing.
- **Visual register:** restrained premium — Linear / Vercel / Stripe. Dark base, subtle gradients, generous whitespace, calm typography, motion is purposeful. The opposite of Duolingo / Babbel / Astra chaos. We sell seriousness.
- **No invented social proof.** Real numbers don't exist yet — use `<!-- TODO: replace with real number -->` placeholders the user fills later.
- **No mobile-app mockups.** Puheo is a web app. Browser frames + isolated UI fragments only.
- **Finnish copy throughout.** No English UI text except the brand "Puheo" and "Pro".

## Decisions reached in brainstorming (2026-04-28)

### D1 — Existing `landing/` strategy docs
**Decision:** skim, do not delete. Section A produces a 5-bullet survivors-list folded into the section copy. LANDING_PLAN.md wins on every conflict.
**Why:** prior session (2026-04-23) produced AUDIT.md / DESIGN.md / RESEARCH.md / DIAGNOSTIC.md / BLOG.md / PLAN.md (~80 KB). May contain valid YO-koe demographics, real-bug observations, or copy notes that survive even though the visual direction has flipped from light-mint to dark-near-black.

### D2 — Existing `landing.css` (1332 lines, light-mint, imports app component CSS)
**Decision:** retire. Build a fresh `css/landing-tokens.css` with the new dark palette in Section A; `index.html` swaps its `<link>` to point at the new file once it's ready. Old `landing.css` stays on disk through the rebuild as a fallback, deleted in Loop 49 alongside the audit.

### D3 — Visual generation strategy for the AI-grading showcase (Section 6)
**Decision:** hybrid. Section A captures one real `/api/grade-writing` JSON response and saves it as a fixture; Loop 45 hand-builds the showcase markup using the real strings (Spanish paragraph, Finnish annotations, rubric numbers) inside a custom landing-only HTML/CSS layout that idealises presentation.
**Why:** "static recreation, but pretty" (LANDING_PLAN.md §6) is honest if the content is real. Stripe's receipt showcase is the reference: real data, idealised frame.

### D4 — Auth/screenshot harness
**Decision:** hybrid harness. For visual screenshots (dashboard, vocab, profile, writing-task UI) Playwright mocks `/api/*` with `serviceWorkers: "block"` (proven L27/L28 pattern). For the one-time grading-JSON capture, the user drops a Pro test account's email + password into `.env` (`TEST_PRO_EMAILS` already supported per CLAUDE.md), Playwright logs in normally, the JSON is saved to `references/puheo-screens/grading-response.json`, and the creds are removed at the end of Loop 42.
**Why:** `/api/writing-task` and `/api/grade-writing` both require `requireAuth + requirePro`. Pure mocking can't deliver the real-content half of D3. Test creds in `.env` for one loop only minimises lifetime.

### D5 — CTA destination
**Decision:** every "Aloita ilmaiseksi" → `/app.html#rekisteroidy`. A 5-line addition to the auth-screen init reads the URL hash and pre-selects the register tab when `#rekisteroidy` is present. This change ships in Section A so every later loop can wire CTAs to the canonical URL.
**Why:** there is no separate `/register` page — the auth UI is `#screen-auth` inside `app.html` with login/register tabs. The hash-aware tab default makes landing→app feel like one product.

### D6 — Tooling (no new npm)
- **Add:** none.
- **Geist** via Google Fonts `<link>` (preconnect first). Latin Extended covers ä/ö.
- **Lucide icons** as inline SVG. No `iconify-icon`, no `lottie-web`, no GSAP.
- **Motion:** CSS transitions/keyframes only.

### D7 — Visual content choices
- **Hero browser frame:** ~40 lines of vanilla CSS, written from scratch with one CodePen URL cited as visual reference. Curator-rule justification: smaller than any port; the 3-traffic-dot + URL-pill pattern is convention, not invention.
- **Hero floating card:** real Puheo streak chip (cropped from a captured screenshot), rotated `-3deg`, accent shadow lift. Streak chip beats daily-challenge / correct-answer card for first-glance legibility.
- **3 product-pillar thumbnails:** real Puheo screenshots, tightly cropped, radius 8.
- **AI-grading showcase:** real grader JSON (D3) rendered in custom HTML; wavy underlines as SVG paths; rubric card hand-built.
- **Background gradient:** pure CSS radial. Subtle accent-tinted radial behind Section 6.
- **Icons:** Lucide inline SVG — `book-open`, `sparkles`, `pen-tool`, `check`.
- **Lottie:** skipped. Restrained aesthetic doesn't earn it.

### D8 — Brand-color reuse
**Decision:** keep the existing app accent `#2DD4BF` (with hover `#14B8A6`). Don't introduce a landing-only accent.
**Why:** landing → /app.html#rekisteroidy is the conversion path. Same accent on both sides = brand continuity. The dark surface vs the app's light surface is the only theme difference.

## Design tokens (`css/landing-tokens.css`)

```css
:root.landing,
.landing {
  /* Surfaces */
  --bg:           #0a0a0a;
  --bg-elevated:  #141414;
  --bg-gradient:  radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%);
  --surface:      rgba(255, 255, 255, 0.04);
  --border:       rgba(255, 255, 255, 0.08);
  --border-strong:rgba(255, 255, 255, 0.14);

  /* Text */
  --text:         #fafafa;
  --text-muted:   #a1a1aa;
  --text-subtle:  #71717a;

  /* Accent — same as app for brand continuity */
  --accent:       #2DD4BF;
  --accent-hover: #14B8A6;
  --accent-glow:  rgba(45, 212, 191, 0.20);

  /* Type */
  --font-display: "Geist", "Inter", system-ui, sans-serif;
  --font-body:    "Geist", "Inter", system-ui, sans-serif;

  /* Type scale (px): 14 16 18 24 32 48 72 96 */
  --fs-xs: 14px; --fs-sm: 16px; --fs-md: 18px;
  --fs-lg: 24px; --fs-xl: 32px; --fs-2xl: 48px;
  --fs-3xl: 72px; --fs-4xl: 96px;

  /* Tracking */
  --tracking-tight: -0.04em;  /* display */
  --tracking-snug:  -0.02em;
  --tracking-wide:  0.10em;   /* eyebrow labels */

  /* Spacing — 8 base */
  --sp-1: 8px;  --sp-2: 16px; --sp-3: 24px; --sp-4: 32px;
  --sp-6: 48px; --sp-8: 64px; --sp-12: 96px; --sp-16: 128px;

  /* Radius */
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-xl: 24px;

  /* Motion */
  --t-fast: 150ms ease-out;
  --t-mid:  220ms ease-out;
  --t-slow: 320ms ease-out;
}
```

These tokens are **scoped to landing** via a `.landing` class on `<html>` (or `<body>`), so they don't leak into `app.html`. The existing app tokens stay untouched.

## Page structure (locked from LANDING_PLAN.md §B)

One long static document, semantic `<section>` per stripe, max content width 1200 px centred, vertical padding 96 px desktop / 64 px mobile.

1. Nav (sticky, transparent → blurred-solid on scroll)
2. Hero (60/40 desktop, stacked mobile)
3. Problem (centred, two lines, whitespace as visual)
4. Product pillars (3-card grid: vocab / grammar / writing)
5. How it works (3 numbered steps + connector line)
6. AI grading showcase (50/50 — real JSON, idealised layout)
7. Pricing (Free vs Pro, both CTAs → `/app.html#rekisteroidy`)
8. FAQ (5–7 `<details>` items)
9. Final CTA (one big card, single button)
10. Footer (3-column minimal)

## Browser-frame component (Section D)

```html
<div class="browser-frame">
  <div class="browser-frame__bar">
    <div class="browser-frame__dots"><span></span><span></span><span></span></div>
    <div class="browser-frame__url">puheo.fi/dashboard</div>
  </div>
  <div class="browser-frame__viewport">
    <img src="references/puheo-screens/dashboard-1440.png" alt="Puheon kojelauta" />
  </div>
</div>
```

Vanilla CSS, no JS. Top corners radius 12, traffic-light dots desaturated, URL pill with low-opacity border, viewport `overflow: hidden`. Box-shadow `0 40px 80px -20px rgba(0,0,0,0.5)`. ~40 lines.

## Per-loop verification harness (standardised)

Every loop ends with:
1. `scripts/agent-test/loopXX-landing-<section>.mjs` — Playwright at 1440 × 900 *and* 375 × 812. Screenshots saved next to the script.
2. Agent reads the screenshots; fixes anything ugly; re-shoots.
3. axe-core run — zero new violations.
4. One ledger line in IMPROVEMENTS.md citing every external source URL.
5. SW cache version bumped only if files in `STATIC_ASSETS` changed. (Landing `index.html` is currently *not* in `STATIC_ASSETS`; Loop 42 decides whether to add it. Default: keep landing out of SW so users always get fresh marketing copy.)

Final loop additionally runs `npm run audit:lighthouse:landing` (already wired in `package.json`). Target ≥ 95 / 95 / 95 (perf / a11y / best-practices).

## Loop breakdown (replaces PLAN.md item 7 + resume-notes for L42)

| Loop | Section | Deliverables |
|------|---------|--------------|
| **42** | A — Setup | (a) skim `landing/` docs, 5-bullet survivors summary; (b) Playwright-screenshot Linear / Vercel / Stripe / Cron / Duolingo to `references/landing/<site>/`; (c) lock `css/landing-tokens.css`; (d) capture mocked Puheo screenshots (dashboard / vocab / writing UI / profile) at 1440 + 375 to `references/puheo-screens/`; (e) one-time creds → capture real `/api/grade-writing` JSON to `references/puheo-screens/grading-response.json`; revoke creds at loop end; (f) wire `#rekisteroidy` URL-hash → register-tab default in the auth screen. |
| **43** | B + C 1–2 — Nav + Hero | sticky nav with scroll-state JS, Finnish copy, hero 60/40 with browser-frame component, floating streak chip, radial gradient. |
| **44** | C 3–4 — Problem + 3 Pillars | one-section problem statement, 3 cards with Lucide icons + tight thumbnails. |
| **45** | C 5–6 — How It Works + AI-Grading Showcase | 3 numbered steps with thin connector, hybrid showcase using real grader JSON. |
| **46** | C 7–8 — Pricing + FAQ | 2-card pricing (free/Pro both → `/app.html#rekisteroidy`), `<details>`-based FAQ with 5–7 honest entries. |
| **47** | C 9–10 + scroll behaviour | Final CTA + minimal footer + nav scroll-state JS + responsive pass at 768 / 1024. |
| **48** | Polish | scroll-reveal fade-up, hover/focus states, micro-animations, copy polish via the `puheo-finnish-voice` skill. |
| **49** | A11y + perf audit | axe-core across the page, Lighthouse landing run, fix anything < 95, append final summary block to IMPROVEMENTS.md, retire `landing.css`. |

## Hard rules (re-stamped — verification gates)

- Finnish copy throughout. Brand "Puheo" + "Pro" allowed in English; nothing else.
- No phone/iPhone mockups. No unDraw / Storyset / DrawKit characters. No emojis as decoration. No Lottie.
- No invented social proof. `<!-- TODO: replace with real number -->` placeholders only.
- Every CTA → `/app.html#rekisteroidy`.
- References reading via Playwright is **mandatory** before any landing markup is written (Section A).
- Lighthouse ≥ 95 / 95 / 95 in the final loop.
- Every loop's IMPROVEMENTS.md ledger line must cite its external source URLs (curator discipline).

## Out of scope (do not touch in these 8 loops)

- `app.html` other than the 5-line `#rekisteroidy` hash handler in Section A.
- Existing blog posts under `blog/` (link to from footer, but don't rewrite).
- `pricing.html`, `privacy.html`, `terms.html`, `refund.html`, `diagnose.html`, `offline.html` — left as-is; landing footer can link to them.
- `sw.js` STATIC_ASSETS — landing stays out of the SW cache by default (always-fresh marketing).

## Resume note

Loop 42 starts in the **next** invocation of the improvement loop, not this one. This loop's only deliverables are: this spec, the PLAN.md replacement of item 7 + resume-notes, the AGENT_STATE.md "next" pointer, and one IMPROVEMENTS.md `[META]` line.

## Appendix — survivors from existing `landing/` strategy docs (Section A skim, 2026-04-28)

5 facts/decisions worth folding into copy and behaviour, lifted from `landing/AUDIT.md`, `landing/DESIGN.md`, `landing/RESEARCH.md`, `landing/PLAN.md`. Everything else in those docs is superseded by `LANDING_PLAN.md`.

1. **Exam date is 28.9.2026.** Espanjan YO-koe lyhyt oppimäärä, syksy 2026. Confirmed across all four docs. The current landing's urgency-bar JS has a wrong `new Date(2026, 8, 15)` (Sep 15) — when copying any countdown logic forward, use **`new Date(2026, 8, 28)`** (months are 0-indexed). Loops 43+ that mention a deadline should use this date verbatim.

2. **Y-tunnus / live-payment constraint.** Until business registration completes, `Pro` and any "kesäpaketti" CTAs cannot route to live payment. LANDING_PLAN.md's "every CTA → free signup, Pro upsell happens inside dashboard" rule already neutralises this. Loop 46 (pricing) must enforce it: even the Pro card's CTA goes to `/app.html#rekisteroidy`, not to LemonSqueezy or a payment URL.

3. **Quantified claim ammo (cite anywhere we need a number that is real).** Total exercise count is **2 080+** across the bank: 500 vocab, 480 aukkotehtävä, 480 matching, 240 translation, 240 sentence construction, 60 reading, 50 correction, 30 writing — use "**2 000+ harjoitustehtävää**" as the round number. Useful in pillar copy or how-it-works section. Sourced from `landing/PLAN.md` Step 1 confirmation.

4. **Tone-of-voice survivors from `landing/RESEARCH.md`.** Calm + direct (no American hype), respectful of intelligence, honest about limitations ("tällä hetkellä vain lyhyt oppimäärä" builds trust, overselling destroys it), formal-enough-for-parents while warm-enough-for-students, no manipulative urgency tactics. Highest-trust signal in the Finnish edu market is **"YTL:n mukainen"**. Specific numbers always beat vague superlatives. Bans (validated by research): "Nosta arvosanaasi 2 portaalla!", "Only 3 spots left!", "kymmenet tuhannet käyttäjät" before we have them.

5. **FAQ answers reusable verbatim or near-verbatim from `landing/DESIGN.md` §10.** Six already-Finnish-voiced answers ready to lift into Loop 46's FAQ — officially-YTL-approved (no, but built on the public rubric — most trust-buying answer in the doc); exam-format-changes (we update per YTL guidelines); GDPR/data (EU servers, no third-party sales); mobile (yes, PWA, no install needed); AI vs teacher (3 criteria, 30 s, 24/7); cancellation (anytime; refund within 14 days for one-time payments). Don't reuse the unsubstantiated "10 vuoden YO-arkisto" claim — `landing/AUDIT.md` flagged it as un-defensible.

**Discard, do not fold:**
- The whole "mini-diagnostic inline" feature from `DESIGN.md` §3 — LANDING_PLAN.md's structure has no diagnostic; landing is single-funnel to free signup and the diagnostic is dropped.
- The "urgency bar" pattern at the top of `DESIGN.md` §0 — LANDING_PLAN.md doesn't include one; restraint aesthetic doesn't carry urgency-bar furniture.
- The Duolingo / Abitreenit comparison table from `DESIGN.md` §8 — LANDING_PLAN.md doesn't include comparison sections.
- The "Liisa lemmikki" essay example currently in landing — Loop 45's hybrid showcase will use the **real** `/api/grade-writing` JSON captured in Loop 42(e), so we don't need a fictional sample.
