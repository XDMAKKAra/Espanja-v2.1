# Landing Page Audit — Puheo

> Current state: `index.html` ~1550 lines, `landing.css` ~1270 lines.
> Reviewed 2026-04-22. No PostHog events found on landing — zero behavioral data to cite.

---

## Section 0 — `<head>` / SEO (lines 1–88)

**Intent:** Metadata, OG tags, JSON-LD structured data for Google.

**Working:**
- Title tag is well-formed with year and product name.
- JSON-LD SoftwareApplication schema is complete with all three pricing tiers.
- FAQPage schema in the FAQ section (line 1392) enables rich snippets.
- Google site verification present.

**Issues:**
- Canonical still points to `https://espanja-v2-1.vercel.app/` (line 18, 25). Must update to `puheo.fi` before marketing launch.
- OG description mentions "Kesäpaketti 29€" — this is hardcoded and will go stale the moment the offer changes.
- Missing `<link rel="alternate" hreflang="fi">` — low impact but correct for a Finnish-only site.
- No `dateModified` on JSON-LD — Google freshness signal.

**Conversion failure mode:** None direct, but stale canonical will split link equity.

---

## Section 1 — Fonts + CSS imports (lines 93–101)

**Intent:** Load Cuaderno design system.

**Working:** Font stacking correct. `preload` on `landing.css` is good.

**Issues:**
- `landing.css` imports 7 component CSS files (`button.css`, `input.css`, etc.) which are then re-defined inline in `<style>` blocks in `index.html` (starting line 102). **Duplication risk** — if component files differ from inline overrides, specificity battles ensue.
- Google Fonts load is render-blocking. Should add `font-display=swap` to the URL (it's not currently in the query string).

---

## Section 2 — Inline `<style>` block (lines 102–724)

**Intent:** Page-specific styles for mini-diagnostic, comparison table, rubric grid, essay demo.

**Issues:**
- This block is 622 lines. Half of it (demo styles lines 568–724) should live in `landing.css`.
- `.mini-diag-opt:hover:not(:disabled)` sets `background: #261818` (line 226) — this is **dark mode color** leaked into light mode Cuaderno. Bug visible on hover in light mode.
- `.mini-diag-next:hover` sets `background: #a01818` (line 289) — hardcoded dark red, not a design token. Inconsistent.

**Conversion failure mode:** Minor visual bugs undermine trust. The hover bug on the inline diagnostic answers looks broken.

---

## Section 3 — Urgency Bar (lines 729–737)

**Intent:** Fixed top bar, visible June–September only, shows countdown to exam day.

**Working:** Correct conditional display. Closeable with sessionStorage.

**Issues:**
- `examDate = new Date(2026, 8, 15)` (line 1547) — September 15th, but the exam is **28.9.2026**. Wrong date used in urgency bar countdown, though `hero-trust-days` and the countdown section use 28.9.2026 correctly (inconsistency).
- The urgency bar is hidden in April–May (current date = 2026-04-22). The top of the funnel currently has no urgency signal at all — the countdown section below the hero must carry that weight alone.
- `urgency-bar:not(.hidden) ~ .hero` shift (landing.css line 275) only shifts `.hero`, not the mini-diagnostic or card sections directly below. On smaller viewports the bar may overlap content.

**Conversion failure mode:** Wrong exam date in urgency bar copy could confuse returning users who see both "15.9" and "28.9".

---

## Section 4 — Nav (lines 740–752)

**Intent:** Sticky nav with logo, internal links, login, and primary CTA.

**Working:** Scroll-based border behavior in CSS. Mobile hides nav links.

**Issues:**
- Nav links don't have `aria-current="page"` — minor a11y gap.
- "Testaa tasosi" links to `diagnose.html` (external page) while the mini-diagnostic below the hero does the same thing inline. Users see two different entry points for the same funnel without understanding the difference.
- Nav CTA "Aloita ilmaiseksi" goes to `app.html` — but the hero's primary CTA does the same. Nav CTA should probably link to `#mini-diag` first (value before commitment).

---

## Section 5 — Hero (lines 757–797)

**Intent:** Primary conversion point. Single promise + dual CTA + trust strip + social proof placeholder.

**Working:**
- Headline "Paranna espanjan YO-arvosanaa tekoälyllä" is clear.
- Trust strip items are credible (days to exam, no credit card, 14-day refund).
- SVG icons instead of emojis in trust strip.

**Issues:**
- **Hero is not conversion-optimized.** The primary CTA "Aloita ilmaiseksi — 2 min" goes straight to app signup, bypassing the mini-diagnostic below. You're asking for commitment before showing value.
- Hero headline does not mention the date `28.9.2026` — the single most actionable fact for the audience. It's relegated to the trust strip where it's in small mono font.
- `hero-social-proof` (line 792) is always hidden — it requires a user count from the backend but there's no fetch call for it. Dead DOM node.
- The hero has no visual — the card mockup was moved below the fold (line 861). The hero is text-only. On desktop this is a large empty space.
- Secondary CTA "Testaa tasosi" is a link to `diagnose.html` (full page), but the inline mini-diag is just below. Mixed signals.

**Conversion failure mode:** Users scroll past the hero looking for proof before converting. Both CTAs ask for action before showing the product working.

---

## Section 6 — Exam Countdown (lines 800–809)

**Intent:** Show days remaining to 28.9.2026, contextualize urgency.

**Working:** Design is clean, correctly placed below hero.

**Issues:**
- The countdown number element (`countdown-days`, line 804) is populated by JS (not shown in the audit range but inferred). If JS fails or is slow, the user sees "—" as the number.
- The countdown lives in its own `<section class="exam-countdown">` below the hero — but the hero already has a trust strip with the same days-to-exam info. Duplication.
- `countdown-context` (line 807) is empty by default — the JS presumably fills it with a contextual phrase. Without JS, there's no fallback text.
- The countdown section and mini-diagnostic are siblings — the page has: Hero → Countdown → Mini-diag → Hero card mockup. This ordering creates friction: the student has to scroll past a countdown and a full quiz before seeing the product card. Ideal: Countdown merged INTO hero, mini-diag directly under hero, no separate card mockup.

**Conversion failure mode:** Page feels repetitive above the fold. Three separate "urgency" signals (urgency bar, trust strip, countdown) before any content creates anxiety without value.

---

## Section 7 — Mini-Diagnostic (lines 812–858)

**Intent:** Inline 3-question adaptive level check, result pushes to app signup.

**Working:**
- Flow: CTA state → question state → result state.
- Shows grade estimate + weakest area + ETA to M-level.
- Result CTA links to `app.html`.

**Issues:**
- Only 3 questions — result grade estimate will feel thin and unconvincing. User won't trust a grade from 3 MCQs.
- The "Aloita arvio" button (line 819) is `class="btn-hero"` — same styling as the hero primary CTA. Visual hierarchy breaks: everything looks like the primary action.
- Progress shows "1/3" which telegraphs that this is short — good. But the grade shown at the end ("Nykyinen tasosi: C") uses a Finnish letter grade (I/A/B/C/M/E/L) without explaining what this maps to in real-world terms. A student who doesn't know the scale won't know if C is bad or average.
- No fallback if user doesn't answer — they can close the card state without any email capture or nudge.

**Conversion failure mode:** Grade isn't credible (3 questions), scale isn't explained, no email capture at the value moment.

---

## Section 8 — Hero Card Mockup (lines 861–877)

**Intent:** Show what a Puheo exercise looks like.

**Working:** Visual is nice. Uses Cuaderno tokens.

**Issues:**
- This is below the fold on most viewports (below hero + countdown + mini-diag).
- The floating card animation (`float`) is disabled on mobile (CSS line 1197). On mobile there's just no visual at all.
- It's a static mockup — it doesn't demonstrate interactivity. The interactive demo section (#8 below) exists but is never shown here.
- `emoji` icon `📚` used in `.hc-badge` (line 866) — violates no-emoji-icons guideline.

---

## Section 9 — Problem (lines 880–908)

**Intent:** Articulate the 3 pain points students have.

**Working:** Problem framing is accurate and specific to YO-koe context.

**Issues:**
- Uses ✗ emoji (line 887, 893, 899) as icons — should be SVG.
- Pain points are generic ("ei tarpeeksi harjoituksia", "kielioppi jää jumiin") — they apply to any language learning tool, not specifically Puheo's YO-koe context.
- Missing the most specific pain point: **students get C/B, not M/E, because they don't know what the grader actually wants** — this is a Puheo-specific hook.
- No parent-facing language — secondary audience (parents) isn't addressed anywhere.

---

## Section 10 — Solution / Features (lines 911–955)

**Intent:** Three feature cards solving the three problems.

**Working:** Problem → solution mapping is logical. Feature cards have SVG icons.

**Issues:**
- Three features is correct, but the copy is vague: "järjestelmä oppii heikkoutesi" (feature 1) is not differentiated from "virheesi kertautuvat älykkäästi" (feature 3) — they sound like the same thing.
- Feature 2 ("YTL-rubriikin mukainen arviointi") is the strongest differentiator but it's in the middle, not leading.
- No quantified claim anywhere — "500+ sanastokohde" or "AI feedback in < 30 seconds" would be stronger.
- Mobile carousel (CSS line 1154) works but no visible affordance (the dots are small and unlabeled).

---

## Section 11 — How It Works (lines 958–985)

**Intent:** 4 linear steps, the user journey.

**Working:** Steps are clear and logical.

**Issues:**
- Step 1 says "Vastaa 7 kysymykseen itsestäsi" — but the mini-diagnostic above is 3 questions, and the full `diagnose.html` is 15 questions. Neither is 7. Inconsistency.
- The 4-step horizontal layout breaks to 2-column on mobile, then 1-column on narrow mobile. The connector line (`steps::before`) is display:none on mobile — fine, but the steps feel disconnected.
- Duplicate with the vertical timeline section below (lines 988–1015). Two "how it works" sections back-to-back is repetitive.

---

## Section 12 — How Puheo Teaches (lines 988–1015)

**Intent:** Vertical timeline showing the adaptive learning loop.

**Working:** Scroll-triggered animation (`.timeline-item.visible`) adds personality.

**Issues:**
- Completely redundant with section 11. Both explain the same four steps. Cut one.
- Timeline dot animation requires IntersectionObserver JS — not confirmed present from the HTML alone.

---

## Section 13 — Screenshots Carousel (lines 1018–1048)

**Intent:** Show real app screenshots.

**Working:** Dots, slide fade, correct aria labels.

**Issues:**
- Images reference `/public/screenshots/dashboard.png` etc. — these files likely don't exist in production (not visible in `ls` output). If images 404, users see broken layout.
- Static images don't convey interactivity. The interactive demo section below is a better proof point.
- No lazy loading on the first slide (first `loading="lazy"` on `data-idx=0` means it won't load until visible — should be `loading="eager"` for the active slide).

**Conversion failure mode:** Broken image links destroy credibility.

---

## Section 14 — Authority Signals (lines 1051–1098)

**Intent:** Three cards explaining why Puheo is credible (YTL rubric, 10-year archive, exam structure).

**Working:** Links to official YTL and YLE Abitreenit pages.

**Issues:**
- YTL link (line 1066) goes to the Swedish short syllabus PDF — wrong link for Spanish.
- The "10 vuoden YO-arkisto" (line 1075) claim says "10 years" but the app bases harjoitukset on the archive — this should be quantified: "pohjana 15+ vuoden YO-tehtäväarkisto" if accurate.
- The emoji icons (📋 📚 🎯) on lines 1063/1075/1086 violate the no-emoji rule.

---

## Section 15 — Credibility Strip (lines 1101–1120)

**Intent:** Quick authority bar below authority cards.

**Working:** SVG icons. Compact.

**Issues:**
- "Tehty Suomessa" is a weak signal for high school students — more useful for parents. Reposition or replace.
- Redundant with authority cards above — same four claims duplicated as a strip.

---

## Section 16 — Comparison Table (lines 1123–1189)

**Intent:** Head-to-head vs. Abitreenit.

**Working:** Accessible table with mobile card fallback. Honest ("Abitreenit on hyvä ilmainen resurssi — käytä sitä").

**Issues:**
- The pull quote "Abitreenit on kuin oppikirja. Puheo on kuin yksityisopettaja." is unattributed — reads as marketing copy, not a real student quote.
- Not addressing Duolingo or Quizlet, which are probably where students actually spend time.
- Price in comparison row is "$9,99€/kk tai 29€ kesäpaketti" — inconsistently uses decimal comma vs. period.

---

## Section 17 — Grading Demo (lines 1192–1298)

**Intent:** Show what AI feedback looks like with a real essay annotation example.

**Working:** This is the strongest section on the page. The side-by-side essay + annotated feedback with score bars is visually convincing. No emojis. YTL criteria correctly named.

**Issues:**
- Section is placed after two "how it works" sections and a comparison table — users who made it here are already deeply scrolled. This should be closer to the hero.
- The essay example (Liisa's email about summer vacation) is not a common YO-koe format — it looks like a very simple task. A more recognizable exam-style task would be stronger.
- The rubric link at line 1296 goes to `https://www.ylioppilastutkinto.fi/` (homepage, not the rubric). Should link to the actual criteria page.

---

## Section 18 — Pricing (lines 1302–1358)

**Intent:** Three pricing cards (Free, Pro 9,99/kk, Kesäpaketti 29€).

**Working:** Clean structure. Waitlist modal for the summer package.

**Issues:**
- The pricing section is far down the page (~12 sections in). For a product targeting students making a purchase decision, pricing is buried.
- **Y-tunnus constraint (from brief):** Both Pro and Kesäpaketti buttons currently link to `app.html` (lines 1335, 1354) — they should route to a "Coming soon — join waitlist" page or trigger the waitlist modal. The Pro button `href="app.html"` is particularly wrong since Pro implies live payment.
- The "Suosituin" badge logic shows on neither card currently (both `id="pro-badge"` and `id="summer-badge"` have `.hidden`) — this is likely controlled by JS based on season. No badge is showing in April.
- `price-features li.bonus::before { content: '🎁 '; }` (landing.css line 734) — emoji in CSS. Should be SVG or a character.
- Summer card's `Ei automaattista uusimista` is a strong differentiator but listed third — should be first.

**Conversion failure mode:** Live payment buttons before Y-tunnus registration. Pro CTA goes to app.html which likely has no payment flow yet.

---

## Section 19 — Waitlist Modal (lines 1362–1377)

**Intent:** Email capture for summer package launch.

**Working:** Form with Resend integration (inferred from CLAUDE.md).

**Issues:**
- Modal is only triggered on summer package CTA. Pro CTA doesn't trigger it — inconsistent.
- Waitlist icon is an emoji (`✉️`, line 1365) — not a token-aware SVG.
- Modal h3 says "Ilmoita kun kesäpaketti aukeaa" — but from today's date (2026-04-22) the package should be available soon. The messaging may be outdated or need date-conditioning.

---

## Section 20 — CTA Section (lines 1380–1384)

**Intent:** Mid-page or post-pricing re-engagement CTA.

**Working:** Minimal. Clean.

**Issues:**
- "Aloita nyt. Ilmaiseksi." is correct but placed AFTER pricing, which is odd — CTA should come BEFORE pricing to capture the "already convinced" cohort.
- "5 harjoitusta päivässä ilmaiseksi" undersells the free tier. More compelling: "Aloita nyt — 5 harjoitusta ilmaiseksi, ei luottokorttia."

---

## Section 21 — FAQ (lines 1387–1511)

**Intent:** Address 9 common objections.

**Working:** JSON-LD FAQPage schema for Google rich snippets. `<details>` native accordion.

**Issues:**
- First 3 FAQ items are about the summer package specifically — this order favors users who already intend to buy but haven't quite committed. Users earlier in the funnel (who don't even know if Puheo is right for them) need earlier objections addressed: "Is this officially endorsed by YTL?", "What if the exam format changes?".
- "Miten Puheo eroaa Abitreeneistä?" appears as an FAQ but the same question is answered more deeply in section 16. Redundant.
- Missing: "Onko tämä virallisesti YTL:n hyväksymä?" — high-priority trust question especially for parents.
- Missing: "Onko tietoni turvassa?" — GDPR-aware Finnish students and parents will want this.

---

## Section 22 — Footer (lines 1516–1536)

**Intent:** Legal links, contact.

**Working:** Correct links (privacy, terms, refund, contact email, blog).

**Issues:**
- Footer doesn't show Y-tunnus or business address — required in Finland for B2C e-commerce under consumer protection law once payments go live.
- "© {year} Puheo" — year is JS-injected (line 1526). No fallback.
- No social links (Instagram, TikTok) where Finnish high schoolers actually spend time.

---

## Section 23 — Inline JS block (lines 1538+)

**Intent:** Urgency bar logic, countdown, mini-diagnostic, social proof, pricing badge, scroll effects.

**Issues:**
- Urgency bar JS uses `new Date(2026, 8, 15)` (September 15) — wrong, should be September 28.
- No PostHog or analytics events on any CTA. Zero funnel visibility. Cannot tell if users click "Aloita ilmaiseksi" vs. "Testaa tasosi" vs. scroll to pricing.
- Mini-diagnostic result shows letter grade without explaining YO grading scale (I/A/B/C/M/E/L) — new users who don't know Finnish school grades are left confused.

---

## Conversion Failure Summary

| Priority | Issue | Impact |
|----------|-------|--------|
| P0 | Pro/Summer CTAs link to app.html, not waitlist (Y-tunnus missing) | Revenue leak |
| P0 | Wrong exam date (Sep 15 vs Sep 28) in urgency bar JS | Trust |
| P1 | No analytics events — zero funnel data | Invisible |
| P1 | Hero has no visual proof above the fold | Bounce rate |
| P1 | Pricing buried 12 sections deep | Low conversion |
| P2 | Broken screenshot images | Credibility |
| P2 | Hover bug on mini-diag options (dark color in light mode) | Polish |
| P2 | Wrong YTL link (Swedish rubric, not Spanish) | Trust |
| P3 | Emoji icons throughout (CSS and HTML) | Design system |
| P3 | Two redundant "how it works" sections | Scroll fatigue |
