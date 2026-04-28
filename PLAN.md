# Puheo — Active Roadmap (P0 user-directed)

> Set 2026-04-28 by user mid-loop. **Supersedes** any "keep building" plan in
> AGENT_STATE.md. Items 1–7 below run BEFORE any new feature work
> (cmd-K palette, dialog primitive, etc.). Each loop ships one numbered item
> end-to-end, verifies, and writes one IMPROVEMENTS.md ledger line.

## Source-of-truth references

- `references/astra/` — 7 competitor screenshots (Astra AI). Read these
  before items 5/6/7. Adapt structure + polish; Puheo stays Puheo.
  - 221557 / 221601 — sidebar layout (Ask / Exam Prep / Lab / IB Math; My
    activity / calendar / classroom / chat history; Download app + Connect
    your phone + Buy Plus pinned bottom).
  - 221631 — `Buy +` upsell card (top-right rail), accent border, single CTA.
  - 221659 — calendar / streak / daily-study-goal modal — the inline `Edit`
    button on a goal row is the chip pattern we want for the profile page.
  - 221755 — landing-page phone mockups (Astra uses iPhone frames; Puheo
    will use **browser/laptop** frames because Puheo is a web app).
  - 221810 — landing-page big claim panels: "Improve your grade or get your
    money back" + "Unlimited AI tutoring vs Traditional Tutoring" — two-up
    bento with primary/secondary contrast.
  - 221816 — phone-frame topic-mastery card showing a percent ring + lesson
    title — adapt to a Puheo desktop card and float it on the hero.

## P0 bugs — fix in next 4 loops

### 1. Settings page Muokkaa buttons dead
- `js/screens/settings.js` `renderRows()` writes the buttons + wires
  `openEditor` per click. Code looks correct on paper.
- Approach: reproduce live with Playwright at `#/asetukset`, click each
  Muokkaa, log to console — find the failure mode (could be modal CSS
  hidden by a stacking context, click handler attaching too early,
  `wireModal()` running before the modal exists, or a sidebar-overlay
  intercepting events). Fix the actual cause, then verify all 8 fields
  open the modal + save.

### 2. YO-readiness math wrong (8 sessions = 14% should not happen)
- `loadAndRenderReadinessMap` in `js/screens/dashboard.js` computes the
  ring %. Formula source = `/api/learning-path` (path-node mastery counts)
  fused with the 4 writing dimensions.
- Approach: read both ends. If the formula is "mastered / (mastered + in
  progress + writing dims)" then 0/14 paths makes sense at low totals.
  But the user expects readiness to track *exam preparedness*, not
  arbitrary node count. Re-anchor to: `% of YO topics where the user has
  hit a competency threshold`. Plumb through `routes/progress.js` if
  needed, expose `readinessPct` directly, drop frontend formula.

### 3. NaN pv sitten in profile activity list
- `js/screens/profile.js:41 timeAgo()` — when `dateStr` is null returns
  "" (good); when format is unexpected, the diff is NaN and `Number.isNaN`
  catches it (good). But the user sees NaN — so a code path slips
  through. Likely culprit: `new Date(dateStr + "Z")` doubles the Z when
  the server already returns ISO with Z, producing Invalid Date but
  `isNaN(diff)` returns "" — actually that's fine. Need to repro.
- Approach: defensive timeAgo — accept Date / number / ISO / `2026-04-27
  18:00:00`; if all fail, return "äskettäin"; never NaN.

### 4. Right sidebar overflow
- `.app-rail` / `.sidebar-right` — clip on narrow desktop. Fix at 1280,
  1440, 1920. Likely `overflow-x: visible` or missing `min-width: 0` on a
  flex/grid track.
- Approach: Playwright reproduction at the three widths, screenshot
  before/after.

## Design rebuilds — items 5/6/7 (each its own loop)

### 5. Profile page → ONE viewport
**Rule:** Fits 1440×900 and 375×812 above the fold.
**Layout:**
- Header strip — avatar + name + level chip + exam countdown.
- Stats row (4 cells) — streak / total / week / readiness.
- 4-up mode breakdown (Sanasto / Kielioppi / Lukeminen / Kirjoittaminen)
  with a single number each, no per-mode timeline.
- 3 most recent activities, compact rows.
- 4–6 inline editable settings chips (most-used: kokeen päivä,
  päivätavoite, tavoitearvosana, taso) — Astra-style chip with `Edit`
  inline. Reuse the existing `openEditor()` modal.
- "Kaikki asetukset →" link to `#screen-settings`.
**Source:** Linear / Vercel / Cron / Raycast desktop profile pages
(visit, screenshot one with Playwright before designing).

### 6. Right sidebar → 2 panels
**Top (compact, ~80px):** small avatar + name + tiny streak chip → click
opens profile. Pattern: Linear's top-right user menu.
**Below (large, fills remaining):**
- Free user — Pro upsell card adapted from Astra's `Buy +` card
  (`references/astra/Screenshot 2026-04-27 221631.png`). Finnish copy:
  "Pääse YO-kokeesta läpi paremmin arvosanoin." CTA "Kokeile Pro 7 päivää
  ilmaiseksi". Match LemonSqueezy flow.
- Pro user — daily-progress + word-of-day stack.

### 7. Landing page rebuild — full restraint-aesthetic refit (8 loops, L42–L49)

**Source-of-truth spec:** `LANDING_PLAN.md` (requirements, written by user 2026-04-28) + `docs/superpowers/specs/2026-04-28-landing-rebuild-design.md` (execution plan, agreed in brainstorm 2026-04-28). Read **both** before Loop 42.

**Top-line direction:** restrained Linear / Vercel / Stripe aesthetic, dark base, NO phone mockups, NO unDraw characters, NO Lottie, NO invented social proof. Single CTA goal everywhere = "Aloita ilmaiseksi" → `/app.html#rekisteroidy`. Finnish copy throughout.

**Loop breakdown (replaces the old single-loop "L42 = item 7" stub):**

| Loop | Section | Deliverables |
| --- | --- | --- |
| 42 | A — Setup | (a) skim existing `landing/` docs, 5-bullet survivors summary; (b) Playwright-screenshot Linear / Vercel / Stripe / Cron / Duolingo to `references/landing/<site>/`; (c) lock `css/landing-tokens.css` with dark palette + Geist + 8/16/24/32/48/72/96 type scale; (d) capture mocked Puheo screenshots (dashboard / vocab / writing / profile) to `references/puheo-screens/`; (e) one-time `.env` test creds to capture real `/api/grade-writing` JSON to `references/puheo-screens/grading-response.json`, then revoke; (f) wire `#rekisteroidy` URL hash → register tab in auth screen. |
| 43 | B + C 1–2 | Sticky nav (transparent → blurred-solid) + Hero (60/40 desktop, browser frame component, floating streak chip, radial accent gradient). |
| 44 | C 3–4 | Problem statement section + 3 product pillars (Sanasto / Kielioppi / Kirjoittaminen) with Lucide inline SVG + tight thumbnails. |
| 45 | C 5–6 | How It Works (3 numbered steps + connector line) + AI Grading Showcase using **real** captured JSON in idealised custom layout. |
| 46 | C 7 — Pricing | 2-card layout (Free + Pro) sourced from **21st.dev /s/pricing**. Restrained dark, both CTAs → `/app.html#rekisteroidy` per Y-tunnus constraint. Cite exact 21st.dev component URL. |
| 47 | C 8 — FAQ | 5–7 `<details>` items, smooth accordion sourced from **21st.dev /s/faq**. Must use `<details>` under the hood for a11y. 6 honest answers from spec appendix #5. |
| 48 | C 9–10 — Final CTA + Footer | One big centred CTA card + minimal 3-column footer. Both sourced from **21st.dev**. |
| 49 | Mobile + polish + a11y/perf | Responsive pass 375 / 768 / 1024; default to NO extra motion (21st.dev marquee/scroll only if it earns its place); axe-core across full page; `npm run audit:lighthouse:landing` with ≥95/95/95 gate; retire old `landing.css`; append final summary block to IMPROVEMENTS.md. |

**Per-loop verification gate:** Playwright at 1440 + 375, agent reads its own screenshots and fixes ugliness, axe-core zero new violations, one IMPROVEMENTS.md ledger line citing every external source URL. Final loop: Lighthouse ≥ 95 / 95 / 95.

**Tooling — no new npm:** Geist via Google Fonts `<link>`, Lucide as inline SVG, CSS-only motion. No `lottie-web`, no `iconify-icon`, no GSAP, no character illustrations.

**Hard rules (verified per loop):**
- Finnish copy throughout; "Puheo" / "Pro" the only English allowed.
- No phone mockups. Browser frames + isolated Puheo UI fragments only.
- No unDraw / Storyset / DrawKit characters on landing.
- No emojis as decoration.
- No invented numbers — `<!-- TODO: replace with real number -->` placeholders.
- Every CTA → `/app.html#rekisteroidy`.
- Reference reading via Playwright is **mandatory** in Section A before any landing markup is written.

**Out of scope (do not touch in L42–L49):** `app.html` (except the 5-line hash handler in Section A); blog posts; `pricing.html` / `privacy.html` / `terms.html` / `refund.html` (footer-link only); `sw.js` STATIC_ASSETS (landing stays out of SW for always-fresh marketing).

## Sourcing discipline (applies to every loop)

Every component built for items 5/6/7 must cite source on its
IMPROVEMENTS.md ledger line. From-scratch requires written justification.
**Curation > origination.**

Concrete sources still on the toolbox: Linear, Vercel, Stripe, Cron,
Raycast, shadcn, Magic UI, Aceternity, **21st.dev (now primary for L46–L49
and the post-L49 popup)**, Tailwind UI, Heroicons, Lucide, Tabler,
`references/astra/`. **Banned for landing:** unDraw, Storyset, DrawKit,
Lottiefiles (incompatible with restrained aesthetic).

**21st.dev workflow** (added 2026-04-28):
1. Visit 21st.dev via Playwright (e.g. `21st.dev/s/pricing`, `21st.dev/s/faq`).
2. Pick 2–3 candidates, screenshot to `references/landing/21stdev/<section>/`.
3. Pick best fit for Puheo's restrained Linear-tier aesthetic (avoid loud / over-animated).
4. Components are React + Tailwind — extract structural HTML, port styling to vanilla matching `css/landing.css` patterns.
5. Cite the exact 21st.dev component URL in IMPROVEMENTS.md.
**Rule:** Structure from 21st.dev, content from Puheo. Copy is always Finnish-Puheo-specific, never generic SaaS copy.

## Loop order (estimate)

| Loop | Item | Notes |
| --- | --- | --- |
| 37 | Bug 1 (settings) | + reproduction technique reusable for 2/4 |
| 38 | Bug 2 (readiness math) | server + client |
| 39 | Bug 3 + Bug 4 | both small, bundle |
| 40 | Item 5 (profile rebuild) | biggest layout loop |
| 41 | Item 6 (right rail rebuild) | depends on profile being one viewport |
| 42 | Item 7 / Section A — landing setup | references + tokens + screenshots + grading-JSON capture + hash handler |
| 43 | Item 7 / Section B + C1–2 — nav + hero | the make-or-break section |
| 44 | Item 7 / Section C3–4 — problem + 3 pillars | |
| 45 | Item 7 / Section C5–6 — how it works + AI grading showcase | uses Loop 42's captured JSON |
| 46 | Item 7 / Section C7–8 — pricing + FAQ | |
| 47 | Item 7 / Section C9–10 + scroll | final CTA + footer + nav scroll-state + responsive |
| 48 | Item 7 / polish | scroll-reveal, hover/focus, copy polish |
| 49 | Item 7 / mobile + polish + a11y/perf | responsive 375/768/1024 + axe + Lighthouse + retire `landing.css` |
| 50 | Item 8 / right rail panel rewrite | Remove the large Pro upsell card from the rail (kept the small top-right user chip from L41 — already correct). Rail body becomes daily-progress + word-of-day stack shown to ALL users (not just Pro). |
| 51 | Item 9 / Pro upsell popup | Dismissible bottom-right toast/popup, ~320 px, fixed bottom-right ~24 px from edges, slide-up + fade-in 300 ms ease-out, only after 5 s on the page. localStorage `puheo_pro_popup_dismissed` ISO date, 7-day suppress. Free users only; Pro users never see it. Source pattern from Magic UI / Aceternity / **21st.dev** / shadcn sonner — pick one, port to vanilla, cite URL. |
| 52 | Item 10 / dark theme — audit + tokens-shared.css | (a) Audit existing app theme system (Auto/Vaalea/Tumma toggle in settings — find where preference is stored, where current dark CSS vars live if any). (b) Move all shared design tokens (palette, type scale, spacing, radius, motion) into NEW `css/tokens-shared.css` consumed by both `.landing` (index.html) AND app.html — single source of truth. (c) Keep `css/landing-tokens.css` for landing-only overrides (gradient hero bg, very-large display sizes). |
| 53 | Item 10 / dark theme — app screen sweep part 1 | Make existing Auto/Vaalea/Tumma toggle still work. "Tumma" gives the new dark palette (matching landing). "Vaalea" gives the original mint/light. "Auto" follows system. Test dashboard, profile, settings via Playwright at 1440 + 375 in BOTH themes. Screenshot each. axe across each. Fix every contrast violation + every "this color was hardcoded" instance. |
| 54 | Item 10 / dark theme — app screen sweep part 2 | Same sweep across all 4 exercise modes (vocab/grammar/reading/writing), achievements, learning path, exam-day countdown widget. Default theme stays "Auto" — do NOT force users into dark. |
| 55 | Item 10 / dark theme — final polish + retire | Final pass at 1440 + 375 in BOTH themes for any screens missed. axe-core 0 violations across all screens both themes. SW bump for tokens-shared.css + any screen CSS touched. Append summary block to IMPROVEMENTS.md. |

After L55 ships, items 1–10 are done — resume the curator-mode polish queue
from AGENT_STATE.md (cmd-K palette, dialog primitive, marquee, auth tabs).

## Process

1. Update AGENT_STATE.md "Next" pointer to PLAN.md.
2. Add IMPROVEMENTS.md `[META]` line confirming receipt.
3. Each loop: pick the next item, execute end-to-end, verify, ship one
   IMPROVEMENTS line, bump SW (only if STATIC_ASSETS changed).
4. Do not introduce new features (cmd-K, dialog, marquee) until L49
   ships.
