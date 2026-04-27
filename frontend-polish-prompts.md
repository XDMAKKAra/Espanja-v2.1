# Puheo — Frontend polish prompts (anti-AI-look pass)

Three prompts, intended to be pasted into Claude Code **one at a time, in order**. Each one stops and waits for your review before the next. The goal is a frontend that feels made by a human with taste — not a generic AI-generated app.

Reference point for mood: **worddive.com/fi** — calm, confident, grown-up. Lots of whitespace. Warm accent. Real photography where it earns its place. No bubble-cute mascots, no gradient explosion, no floating orbs, no emoji-as-icon. Note: **we are NOT copying WordDive.** We keep the Cuaderno parchment aesthetic that already exists in `design-system/DESIGN.md`. WordDive is a *restraint benchmark* — look at how little visual noise they get away with and match that discipline.

Stack stays as-is: vanilla HTML/CSS/JS, no framework, no build step. `style.css` is the token source of truth. All copy stays in Finnish. Don't touch `routes/`, `middleware/`, `lib/`, `supabase.js`, `server.js`, or `app.js` logic — CSS, markup, and icons only.

---

## Prompt 1 — Diagnose what makes Puheo look AI-generated

_(already run — produced `ui-ux/AI-LOOK-AUDIT.md`)_

---

## Prompt 2 — Restraint pass + corrections + live countdown

Paste this into Claude Code as one message. It:
1. locks the signature moves the audit already implied (so Claude doesn't re-invent them),
2. overrides three audit calls that went too far or got the numbers wrong,
3. adds a real live countdown (ticks every second, days / hours / min / sec) since the current implementation only refreshes every hour and only shows whole days.

```
You already produced ui-ux/AI-LOOK-AUDIT.md. Good audit. This prompt is the restraint-pass plan + three corrections + a live countdown build. Read AI-LOOK-AUDIT.md fully before you start.

## Locked signature moves — do not re-derive these

The audit already implied them. Use exactly these three:

1. **Flat ochre CTA, no halo.** Primary CTA is a flat `--brand-btn` rectangle, `--r-md`, no box-shadow, no transform on hover (hover darkens background ~6% only). Reused identically across hero, mini-diag, pricing, and closing-CTA. This becomes the single consistent "action" shape on the whole site.

2. **Mono countdown in a bordered data block.** Editorial-brutalist per DESIGN.md §8.4. DM Mono numerals, `--text` colour, `--surface-2` background, 1px `--border` on all sides, `--r-sm`, no shadow. Ticks live (see the countdown spec below). This is the urgency anchor — it replaces the gradient pinstripe urgency bar.

3. **Left-aligned section headlines, italic serif used once.** Crimson Pro roman for all H2s; italic Crimson Pro reserved for exactly one place: the hero H1's closing phrase (`ennen 28.9.2026.`). Headlines for `#solution`, `#how-it-works`, `#proof`, `#pricing`, `#faq` all left-align on desktop and mobile. Hero and closing-CTA stay centered as bookends.

Every other design decision flows from those three. If you find yourself inventing a fourth signature move, stop and ask.

## Corrections to AI-LOOK-AUDIT.md

Before writing the plan, fix these in `ui-ux/AI-LOOK-AUDIT.md` directly (edit the file):

### Correction A — finding 5 (urgency bar)
Do NOT delete the urgency bar. The exam-day countdown is the single strongest conversion anchor on the page and distinguishes Puheo from Duolingo. **Reskin it, don't remove it.** Update finding 5 to read:

> **Fix:** Keep the urgency bar. Remove the `--grad-urgency` gradient. New style: flat `--surface-2` fill, 1px bottom border `--border`, 32px tall (40px on desktop), `--text-muted` label + `--brand-btn` day number in DM Mono, no arrow decoration. Countdown must be live (see live-countdown spec in prompt 2).

### Correction B — missing finding: above-the-fold density
Add a new finding 26 (cap at 26 now, not 25). Severity 🔴.

> **26. 🔴 Hero has 8 elements above the fold on mobile.**
> **Where:** `index.html:755–870` (hero-tag, H1, sub, two CTAs, trust-strip with 3 items, hero-proof-card, hero-card-below mockup).
> **What:** Even after finding 6 (center-axis) lands, eight elements competing above the 844px fold is dense enough to look frantic. A calm hero is the single loudest signal of "designed product, not vibe-coded."
> **Fix:** Cap above-the-fold at 5 elements on mobile: (1) hero-tag, (2) H1, (3) sub, (4) primary CTA + inline secondary link, (5) live countdown block. Push the hero-proof-card, exercise mockup, and secondary trust chips below the fold. Desktop may keep 6 by bringing the countdown to the right column.

### Correction C — finding 25 (countdown contrast)
The audit said `C8950A` on `F5EEDB` is 3.5:1. Recompute it — WCAG relative luminance gives closer to 3.1:1. Either way it fails AA for body text (4.5:1), but the real number matters. Replace finding 25's contrast claim with the value you actually compute from the WCAG formula. Then apply the proposed fix (use `--brand-btn #7A5A18` for the numeral, `--text-muted` for the label).

## Live countdown — build spec

The current countdown (`index.html:1593–1635`) ticks once per hour and shows only whole days. Replace it with a live ticker.

### Visual
- Data block: `--surface-2` fill, 1px `--border`, `--r-sm`, `padding: var(--s-3) var(--s-4)`, `display: inline-flex` with 4 segments: `DD : HH : MM : SS`.
- Each segment: DM Mono, `--fs-h3`, colour `--text`. Label under each in Nunito `--fs-caption` `--text-muted` uppercase letter-spacing 0.04em: `päivää`, `tuntia`, `min`, `sek`. The `:` separators are `--text-faint`.
- Zero-pad HH, MM, SS to two digits. DD not padded (158, not 0158).
- No colour change during normal countdown. When diff drops under 7 days the numerals turn `--brand-btn` (the signature colour, not red).
- No pulse/glow/flash animation. Ticker updates the text node only. This is the whole point of the "editorial-brutalist" move: it feels alive because the seconds visibly change, not because anything glows.

### Behaviour
- Exam target: `2026-09-28T09:00:00+03:00` (same as existing code, Helsinki summer-to-winter transition — keep the ISO string with `+03:00` even though September in Finland is EEST; the current code uses that value and all other surfaces are consistent with it, so don't change the timestamp without a product conversation).
- Tick every 1000ms via `setInterval`. Call `render()` immediately on load so the block isn't blank on first paint.
- When `diff <= 0`: stop the interval, replace the block with the single word "Tänään." in Crimson Pro italic, `--brand-btn`. Do NOT hide the element — the final-day state is itself a conversion moment.
- Respect `prefers-reduced-motion`: no animation is used anyway, so nothing to gate, but wrap the interval so it pauses when `document.hidden` is true (Page Visibility API) — save phone battery and stop wasting cycles on a background tab. Resume on `visibilitychange` and immediately re-render.
- Use `requestAnimationFrame` only if you specifically need sub-second visual smoothness; for a 1Hz tick, `setInterval(render, 1000)` is correct and cheaper.

### Where to place it
Two places on the landing page share one countdown module — write it as a single IIFE that finds every `[data-countdown="yo-koe"]` element on the page and renders into all of them each tick.

1. Urgency bar (`#urgency-bar`): compact variant — single `DDd HH:MM:SS` string on one line, no segment labels. Size `--fs-body-sm`. Add `data-countdown-variant="compact"` on the element.
2. Hero countdown block: full variant as specified above. Replaces the current `.hero-trust-urgency` li. Add `data-countdown-variant="full"`.

Code outline:

```html
<div class="countdown" data-countdown="yo-koe" data-countdown-variant="full" aria-live="off">
  <div class="countdown-seg"><span class="countdown-num" data-seg="d">—</span><span class="countdown-lbl">päivää</span></div>
  <span class="countdown-sep">:</span>
  <div class="countdown-seg"><span class="countdown-num" data-seg="h">—</span><span class="countdown-lbl">tuntia</span></div>
  <span class="countdown-sep">:</span>
  <div class="countdown-seg"><span class="countdown-num" data-seg="m">—</span><span class="countdown-lbl">min</span></div>
  <span class="countdown-sep">:</span>
  <div class="countdown-seg"><span class="countdown-num" data-seg="s">—</span><span class="countdown-lbl">sek</span></div>
</div>
```

`aria-live="off"` on purpose — a screen reader announcing every second is hostile. Put the human-readable fallback in an adjacent `<span class="sr-only">YO-koe alkaa 28.9.2026 klo 9.00</span>`.

Delete the two old IIFEs (`index.html:1593–1614` and `:1616–1635`) and replace with the one unified module. Keep the `urgency-dismissed` sessionStorage logic for the close button.

## Remaining restraint-plan sections

After corrections and the countdown module are designed, write `ui-ux/RESTRAINT-PLAN.md` with:

1. **Signature moves** — copy the three locked above verbatim, no rewording.
2. **Kill list** — every decoration to delete, with `file:line`. Must include every item from findings 1, 2 (all 7 glow lines), 3 (every rogue radius), 4, 8, 9, 10, 13, 14, 16, 17, 18, 19, 21.
3. **Keep list** — explicitly protect: the parchment `body::before` radial (one wash kept), month-aware pricing logic, PostHog `data-cta` attributes, all form IDs, the hero H1 italic close, the mini-diag card structure, `app.html` sidebar Lucide icons already in place.
4. **Component restyle targets** — button, card, input, badge, nav item, hero, pricing card, countdown block, feature row, empty state. 2–3 lines of CSS pseudocode each.
5. **Landing page re-layout** — mobile above-the-fold in 5 elements max per Correction B. Desktop above-the-fold in 6 max (countdown moves to right column).
6. **Risks** — name 3 concrete failure modes (e.g. "removing all hero-proof shadow makes the mockup look pasted onto the page", "live-seconds ticker on a low-end Android eats battery", "removing italic from section headers makes readers miss the section breaks").

Stop after the plan is written. Post the signature moves, the kill list summary (count per file), and the countdown module code in chat for me to react to. Do NOT touch any component CSS, HTML layout, or app.js yet.
```

---

## Prompt 3 — Implement the restraint pass

```
Implement ui-ux/RESTRAINT-PLAN.md. You may have already started; if so, keep going from wherever you stopped.

Rules of engagement:
- Frontend only. Do not touch routes/, middleware/, lib/, supabase.js, server.js, app.js business logic. You may edit inline event wiring in app.js ONLY to replace emoji icons with Lucide SVG and to swap class names when restyling — nothing else.
- Keep all IDs, data-* attributes, form names, hrefs, and PostHog event names unchanged. app.js and analytics depend on them.
- All Finnish copy stays Finnish. You may tighten copy for rhythm (shorter, punchier) but do not translate.
- Preserve the month-aware pricing logic on the landing page. Restyle, don't rewire.
- Commit discipline: one logical change per diff block. Recommended sequence:
  1. Token cleanup in style.css :root (remove any tokens that aren't used; don't add new ones)
  2. Live countdown module (replace the two old IIFEs with one unified one + its CSS)
  3. Urgency bar reskin (flat --surface-2, 1px border, compact countdown inline)
  4. Button component restyle (css/components/button.css) — kill the halo economy
  5. Card component restyle (css/components/card.css) — one emphasis, not four
  6. Radius + spacing token snap (global find-replace to 6 / 10 / 16 / full)
  7. Input + badge + pricing-feature glyph unification (one ✓ system, no 🎁)
  8. Nav (top + bottom + side-panel) — final emoji→Lucide sweep (app.html mode icons)
  9. Landing hero re-layout (5 elements above fold mobile, 6 desktop)
  10. Landing feature sections — remove one-icon-per-bullet pattern; left-align H2s
  11. Pricing section — anchor Kesäpaketti, one flat Pro card, one ghost Free card, left-aligned feature lists
  12. Feature-card hover + body background washes (2px lift, one radial wash)
  13. Testimonial / trust section — text-only authority strip (drop 📋 📚 🎯)
  14. app.html sidebar + sub-screens emoji→SVG, card restyle
  15. Loading states — skeletons that match real layout, not spinners
  16. Empty states — one consistent pattern (small icon + two lines of copy + one action)

After each numbered step, screenshot at 390×844 and 1440×900 and save to `ui-ux/ai-look-after/step-{n}/`. Don't move to the next step until the current one looks right. The live countdown (step 2) is the highest-leverage change — make sure it's visibly ticking before moving on.

Accessibility checks at each step:
- Contrast ≥ 4.5:1 on body copy, ≥ 3:1 on large text and UI components
- Focus ring visible on every interactive element (uses :focus-visible)
- Touch targets ≥ 44×44 on mobile
- Reduced-motion respected
- Countdown: aria-live="off", sr-only text gives the static exam date

When all 16 steps are done:
- Re-run Lighthouse mobile against `/` and save to `ui-ux/lighthouse-after-polish.json`. Targets: Perf ≥90, A11y ≥95, BP ≥95, SEO ≥95. If the 1-second interval costs measurable perf, fall back to requestAnimationFrame throttled to 1Hz and measure again.
- Write `ui-ux/POLISH-VERIFIED.md` with: before/after screenshot pairs (one line each), Lighthouse delta, and an honest list of anything you cut from the plan and why.

Do NOT commit. Leave the tree dirty. Report at the end:
- Count of files touched
- Top 3 visual changes the user will notice (countdown ticking is likely #1)
- One thing I should manually QA on my phone (check the countdown actually ticks in the background tab and stops when not visible)
- One thing that's still AI-looking and would need a real designer or real photography to fix

Begin with step 1.
```

---

## Tips while using these

- Run prompt 2, eyeball the signature moves + kill list + countdown code that comes back, push back on anything that drifts before running prompt 3.
- If prompt 2's plan feels too aggressive, tell it to preserve the specific section by name — then run prompt 3.
- If the live countdown feels too busy on mobile at the 1Hz tick, drop the seconds segment below 767px and keep only DD / HH / MM. Don't kill the tick rate — the aliveness is the point.
- If you want a fourth prompt later (photography / hand-drawn illustration / brand refresh), do that as a separate pass once the restraint cleanup has landed. Don't mix "remove decoration" and "add new visual language" in the same round.
