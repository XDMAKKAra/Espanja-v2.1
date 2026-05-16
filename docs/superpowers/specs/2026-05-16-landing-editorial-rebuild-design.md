# Landing rebuild — editorial-paper register

**Status:** Design brief (Phase 2 output of `/impeccable shape landing`). Awaiting user confirmation. No code yet.

**Replaces:** The current `index.html` + `css/landing.css` + `css/landing-tokens.css` Tinted-Mint Workshop register (documented in `DESIGN.md` as end-of-life). This brief defines the new visual register only; subsequent `/impeccable craft` runs implement it section by section.

**Anchored by:** `PRODUCT.md` (strategic) + `DESIGN.md` (current visual baseline being replaced).

---

## 1. Feature Summary

Rebuild the Puheo marketing landing (`index.html` + landing CSS) in an **editorial-paper register** — warm off-white surface, one strong display serif, teal demoted to action-color only — and reorganize the page around the YTL grader card as the hero artifact. Audience is Finnish lukiolaiset 16–19 prepping yo-koe (lyhyt oppimäärä) in Spanish (open now), German (autumn 2026), French (spring 2027). The rebuild must (a) move off the Linear/Vercel/Cursor first-order category reflex documented in DESIGN.md Overview, (b) prove the AI grader differentiator above the fold, and (c) shrink the page from ten sections to six.

## 2. Primary User Action

**See the grader work on real Spanish, above the fold.** A visitor must — within the first viewport, without scrolling — understand that Puheo grades a student's writing on the YTL rubric and explains every error in Finnish. The single most important action is *reading the marked-up student email and the rubric breakdown*. The "Aloita ilmaiseksi" click is downstream of trust, and trust comes from the artifact.

Secondary: scroll to compare the three pricing tiers and decide between Free, Treeni (€9/kk), and Mestari (€19/kk).

## 3. Design Direction

**Color strategy: Restrained.** Tinted neutrals (warm off-white surface, ink-dark text) + a single accent at ≤10% of any visible viewport. The accent moves from mint (`#2DD4BF`) to a related but **less SaaS-coded teal-blue**: muted, slightly desaturated, readable as "ink that happens to be teal" rather than "neon glow." Working anchor: `oklch(48% 0.09 195)` — a deep teal-petrol, around `#1a6b75`. Confirm or override.

**Theme — scene sentence (forces light):** *"Aino, 17, opens Puheo on a Sunday afternoon in her bedroom, daylight slanting in from one window, her chemistry notebook and a half-cold mug beside the phone, four months until yo-koe."* The scene forces **warm off-white surface** (paper, not screen), **ink-dark text**, **morning-light shadows**.

**Anchor references** (three, named, all in the editorial-typographic lane DESIGN.md flagged as the second-order escape from SaaS-cream):

1. **NYT Magazine** — long-form editorial. The header uses a strong serif at near-poster scale, body in a humanist sans, generous margins, photography or marked-up artifacts as the primary visual. We borrow: serif-display-as-the-image, hairline rules between sections instead of cards, body type set at editorial 17–18 px with leading ~1.6, asymmetric column rhythm.
2. **Stripe Press** — editorial-but-technical book site. Restrained palette (cream / ink / one accent), confident type, the only ornament is a single signature element per page. We borrow: the discipline of one "moment" per scroll, marginalia for metadata, the way it makes a technical product look like a book.
3. **Are.na** — calm content tool, paper-feeling minimalism, no glow, no scroll choreography, complete absence of "tech vibe." We borrow: the willingness to leave space empty, the trust that the visitor will read.

**Anti-reference reminder from PRODUCT.md:** Linear / Vercel / Cursor (banned: current register), Duolingo / Cake (banned: cartoon), Quizlet / Anki / MAOL (banned: visually mute / school-IT dated), tutor-startup-with-stock-photos, ChatGPT-as-chatbot framing. The editorial-paper lane sidesteps both the first-order and second-order reflexes.

**Type direction:**

- **Display:** an editorial serif with personality. Asserting **GT Sectra** (Grilli Type) if the project has a license budget; **Source Serif 4** as the open-source fallback (free, broad Latin-ext support including ä/ö, well-engineered weights 200–900). Use weight 400–500 for headlines so it reads literate, not heavy.
- **Body:** **Söhne** (Klim) commercial, or **Inter** as the open-source fallback (already loaded by the project; we revoke its banned-font status only because the body face has to be Latin-ext-safe for Finnish and we don't want to inherit the project's display-Geist baggage). Body weight 400, 17 px, leading 1.6.
- **Mono:** keep **Geist Mono** for digits (countdown, scores, prices). One typographic concession to continuity with the app.
- **Tracking:** display tracking near-normal (`-0.01em` to `0`), not the `-0.04em` of the current Geist system. Editorial serifs don't need negative tracking; they need air.

**Asserting open-source pair as the default (Source Serif 4 + Inter + Geist Mono).** All three are free, all three handle ä/ö/å, all three are already on Google Fonts. Confirm or override with a commercial-license choice.

## 4. Scope

- **Fidelity:** Production-ready. This is shipping code, not a sketch.
- **Breadth:** Whole landing page (`index.html` + new `css/landing.css` + new `css/landing-tokens.css`). The three language sub-pages (`/espanja-yo-koe`, `/saksan-yo-koe`, `/ranskan-yo-koe`) inherit the tokens but are scoped to a later loop. The blog index inherits the tokens but is not redesigned in this brief.
- **Interactivity:** Static-first with progressive enhancement. The YO-koe countdown stays live (JS). FAQ accordions stay native `<details>`. No new JS frameworks. No scroll-driven choreography beyond a single, optional, prefers-reduced-motion-gated reveal stagger on first paint.
- **Time intent:** Polish until it ships. The current landing is the most-trafficked surface; the rebuild is meant to convert and to last. Budget the work over multiple `craft` loops (hero, voice section, pricing, FAQ, final CTA, footer), each shippable independently.

## 5. Layout Strategy

The page goes from ten sections to **six**. The hierarchy is editorial, not card-grid.

**Six sections in order:**

1. **Header / Nav** (sticky-light on scroll, not blurred glass). Brand wordmark in the display serif. Three text links + one "Aloita ilmaiseksi" primary CTA. Yo-koe countdown moves *out* of the eyebrow pill and into the hero's marginalia (smaller, less prominent, more honest).
2. **Hero — The Graded Email.** Asymmetric two-column on desktop, single-column on mobile. Left column: oversized editorial serif headline (one sentence, max 8 words: e.g. *"Tekoäly korjaa espanjasi kuin YTL-arvioija."*), a single sub-sentence, one primary CTA, hairline marginalia (countdown + trust line). Right column: the **grader card** rendered as a real student email on paper, with marked-up error spans and the YTL rubric block beneath. The grader card *is* the hero image. No browser frame, no dashboard screenshot, no floating streak chip.
3. **Voice & Proof — Three demos, no card grid.** Replaces the current Pillars + How-it-works + Grader showcase combo. One section, three pieces of evidence stacked editorially (not as a 3-up grid): (a) a sanasto micro-demo set as a marked-up vocabulary list in the margin of a paragraph, (b) a kielioppi micro-demo set as an inline fill-in-the-blank Spanish sentence with the correct form revealed, (c) the writing example *is* the grader card from the hero, recalled here at small scale with a "näe koko arviointi" anchor. Rhythm: three different layouts, not three identical boxes.
4. **Pricing — One section, three columns.** Kept as a grid because pricing comparison IS the grid affordance. Free / Treeni / Mestari, with Mestari (€19) highlighted as the editorial pull-quote tier rather than the SaaS "popular" chip. Red `×` rows stay (honest), paired with text not color alone. CTA hierarchy: only Mestari uses the primary accent; Free and Treeni use ghost styling but **with a visible bottom-rule** so they don't read as disabled (current bug).
5. **FAQ — Editorial.** Hairline-divided list of `<details>` items, large readable serif questions, ample air. Replaces the current chevron-card treatment.
6. **Final CTA + Footer.** Final CTA is a single typographic statement (no glow-card, no glow-shadow), and the footer becomes a single 1-row letterpress-feeling block: wordmark, four column links, "© 2026 Puheo · Tehty Suomessa." No accent.

**Sections deliberately cut from the current landing:** Problem lede (folded into hero sub-sentence), Pillars (folded into Voice & Proof), Language hub (folded into a one-line "Espanja avoinna nyt. Saksa syksyllä 2026, ranska keväällä 2027." inside the hero marginalia), 8-card Course grid (moved off the landing entirely to `/espanja-yo-koe`; landing visitors don't need to see 8 cards before they trust the grader), How-it-works (cut — same story as Voice & Proof). The cut is itself a design move: the page becomes a book chapter, not a SaaS feature inventory.

**Spacing rhythm:** Vary by section. Hero has the most air (~25vh top, ~15vh bottom). Voice & Proof has reading-density spacing (paragraph rhythm, not card rhythm). Pricing is denser (grid). FAQ returns to reading-density. Final CTA is air-heavy again. No `--section-pad-y` constant applied uniformly; rhythm carries hierarchy.

## 6. Key States

For each major component:

**Hero grader card:**
- Default: full marked-up email + full rubric block, statically rendered, no interactivity required.
- Hover (desktop): underlined errors show their Finnish tooltip inline (current behavior preserved, restyled as marginalia-callout, not floating tip).
- Focus (keyboard): same tooltip on focus, with visible focus ring on the underlined span.
- No "loading" state — the card ships server-rendered HTML. No "error" state — it's static example content.

**Primary CTA "Aloita ilmaiseksi":**
- Default: filled accent button, ink-on-paper text, no glow.
- Hover: deeper accent tint (`oklch(42% 0.10 195)` direction).
- Focus: 2 px solid accent outline at 3 px offset.
- Pressed (`:active`): -1 px translate-y, no scale.
- Loading state: not applicable (link, not async).

**Pricing cards:**
- Default: hairline-bordered, paper background, deep ink text.
- "Mestari" tier: an editorial pull-quote treatment (accented serif quote mark, slightly larger leading, *not* a colored border or "Popular" chip).
- Free / Treeni CTA: ghost button **with a 1 px ink-bottom-rule** so it reads as a button, not as disabled text.
- Mestari CTA: primary accent button.

**FAQ items:**
- Closed: question in serif, chevron in muted ink.
- Open: chevron rotates, answer in body sans, hairline-divider stays.
- Focus: 2 px accent outline on the summary.

**Final CTA card:**
- Default: typographic statement, no card chrome, no shadow, no glow.
- Only the CTA itself is interactive.

**Page-level:**
- First paint: optional, prefers-reduced-motion-gated stagger reveal on hero text (200/250/300 ms cascade, opacity + 4 px translateY only). Reduced motion users see the page instantly.
- Scroll: nothing. No parallax, no scroll-triggered fades after first paint, no sticky-on-scroll except the nav.
- No empty states (marketing surface).
- No error states (marketing surface).
- No loading skeletons (server-rendered HTML).

## 7. Interaction Model

This is a marketing landing, not an app surface. Interaction model is intentionally narrow:

- **Scroll** carries the entire experience. Six sections, top-to-bottom, no horizontal scroll, no parallax.
- **Click / tap** primary CTA → `/app.html#rekisteroidy`. Once per viewport, never repeated five times.
- **Click / tap** nav links → anchor scroll to in-page section, with `scroll-behavior: smooth` honored unless prefers-reduced-motion.
- **Click / tap** FAQ summary → expand/collapse via native `<details>`.
- **Hover / focus** marked-up error span in the grader card → reveals the Finnish tooltip. Touch users see all tooltips as collapsible disclosure rows beneath the email (so the artifact is accessible on phones without hover).
- **Keyboard:** Tab order matches visual order, all controls reachable, skip-link to `#hero` preserved.

No modals. No dialogs. No sticky chat widget. No exit-intent popup. No cookie banner (the site doesn't currently set tracking cookies; if Plausible Analytics or similar lands later, it gets a footer-level consent line, not a modal).

## 8. Content Requirements

**Hero headline (Finnish, one sentence, serif display, max 8 words):**

> Asserting: *"Tekoäly korjaa espanjasi kuin YTL-arvioija."* — replaces the current three-language enumeration. The single language reframes Puheo as "the Spanish yo-koe AI grader" (the position it can actually win in), and the German/French disclosure moves to the marginalia. Confirm or override.

**Hero sub-sentence (Finnish, one sentence, body sans):**

> Asserting: *"Kymmenen minuuttia päivässä — saat saman rubriikkiarvioinnin jonka YTL antaa kokeessasi. Suomeksi, tarkasti."*

**Hero marginalia (small body, muted ink, set as a single column to the right of the headline on desktop, beneath on mobile):**

> *"Espanja avoinna nyt. Saksa syksyllä 2026, ranska keväällä 2027."*
>
> Countdown line: *"YO-koe alkaa 28.9.2026 — 134 päivän päästä."* (live, Geist Mono digits)
>
> Trust line: *"Ei luottokorttia. Toimii selaimessa. Tehty Suomessa."*

**Grader card content:** identical YTL example to current (Aino's birthday-invitation email, 13/20, arvosana E). The example is already strong — it stays. Reset the visual to the editorial register (paper-colored card, serif headline "Sähköposti ystävälle · 160–240 merkkiä", body in the new sans, error spans in deep teal underline + paper-colored tooltip).

**Voice & Proof section copy:** rewritten editorially, not as three card titles. One paragraph leading into three inline demos:

> *"Puheo arvioi kolmea asiaa: sanaston, jonka YO-koe tunnetusti rakastaa; kielen rakenteet, joissa puolet pisteistä putoaa väärässä paikassa; ja kirjoitelman, jonka YTL pisteyttää neljällä eri osa-alueella. Tässä esimerkki kustakin."*

Followed by three inline demos with editorial captions, not three card titles.

**Pricing section** copy stays close to current (it works), but headline becomes serif: *"Kolme tasoa. Yksi oikea sinulle."* Mestari row gets a serif pull-quote treatment: *"Koko valmennus, kahdeksan kurssia, kahdeksankymmentäkahdeksan oppituntia. Sama hinta kuin yksi viikkokahvi."* — concrete, not "popular tier" SaaS-speak.

**FAQ:** keep current seven items, rewrite questions in slightly more conversational serif voice. Cut none. Add one new item: *"Mihin teilläkin perustuu YTL-rubriikki, jos ette ole YTL?"* with a 2-sentence answer pointing at YTL's published `arviointiohjeet` PDF.

**Final CTA copy:** *"YO-koe lähestyy. Aloita ilmaiseksi tänään."* — full stop, no exclamation, no glow.

**Required visual assets:**
- **The grader card content** (Aino's email + rubric) — already authored, lives in current HTML. Restyle, don't rewrite.
- **Display serif specimen file** — Source Serif 4 (Google Fonts, free) by default.
- **Body sans specimen file** — Inter (already loaded by the project, free) by default.
- **Geist Mono** — already loaded, kept.
- **No photography.** The page should have zero stock photos and zero illustrations. The grader card and the typography are the visual.
- **No flag emojis.** Replaced by typographic treatments of the language names where languages are mentioned (in the marginalia, not as cards).
- **Favicon, OG image, manifest icons** — kept as-is for this brief.

## 9. Recommended References

For the `craft` runs that will implement this brief:

- **DESIGN.md** (the current baseline being replaced) — every named rule that survives the rebuild needs to be re-derived in the new register (Mint-Once → Accent-Once, Single-Voice → display-serif-as-the-image, Earned-Elevation → no-elevation editorial).
- **PRODUCT.md design principles 1–5** — every craft loop should be checkable against these. Principle 1 (show the grader) shapes the hero. Principle 5 (~5 sections, one CTA per viewport) shapes the layout strategy.
- **puheo-finnish-voice skill** — every visible string passes through this. Sinä-form, verb-first, no exclamation-spam, no anglicisms.
- **puheo-screen-template skill** — section-spacing tokens, focus-ring rule, touch-target 44 px floor, reduced-motion gating. The screen template was built for product surfaces but its a11y discipline applies here equally.
- **impeccable reference/brand.md** — full-bleed editorial-typographic lane guidance for the visual register (load when `/impeccable craft` runs).

## 10. Open Questions

Asserting decisions on what would otherwise be open questions, per the shape skill's "If you'd write `Recommend: X`, just decide X" rule:

- **Display serif:** **Source Serif 4** (open-source default). Override only if a Grilli Type / Klim license is in budget.
- **Body sans:** **Inter** (already loaded, free, Latin-ext-safe for ä/ö). Revokes Inter's "banned" status from `design-taste-frontend` because the body face has to handle Finnish and Inter does it well; the design-taste-frontend ban was about generic SaaS body voice, which we sidestep by pairing Inter with a strong serif display.
- **Accent color:** muted deep teal (`oklch(48% 0.09 195)` ≈ `#1a6b75`). Override the mint if the brand-continuity-with-the-app concern outweighs the "move off saturated teal" goal.
- **Surface color:** warm off-white, `oklch(96% 0.005 80)` ≈ `#f7f4ee`. Not paper-yellow, not screen-white.
- **Ink color:** deep neutral, `oklch(20% 0.006 80)` ≈ `#1d1a14`. Not `#000`.

**Resolved (user-confirmed 2026-05-16):**

1. **Three-language hero headline.** Replace asserted single-language headline with: *"Tekoäly korjaa espanjasi, saksasi tai ranskasi kuin YTL-arvioija."* The three-language framing earns its keep by surfacing German and French as in-roadmap above the fold; the marginalia still discloses dates (espanja avoinna, saksa syksyllä 2026, ranska keväällä 2027) so the headline doesn't over-promise. Headline goes ~14 words — set in a slightly smaller display size than a single-sentence hero would carry, but still the largest type on the page.
2. **Pricing: serif pull-quote, no chip.** Mestari tier gets an editorial pull-quote treatment (oversized opening quote glyph, leading bumped, optional ruled callout above the price). No "Suosituin" badge anywhere.
3. **8-course grid: full cut from landing.** Curriculum lives at `/espanja-yo-koe`. The landing's "Voice & Proof" section doesn't preview the 8 courses; it shows three demos of *what Puheo grades*, not three previews of *what Puheo teaches*.

---

**Brief confirmed. Ready for `/impeccable craft hero` as the first shippable slice.**
