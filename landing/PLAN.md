# Implementation Plan — Pass 3 Step 2

Ordered commit sequence. Target: 13 commits. Hero ships first, diagnostic and blog ship last. All changes to `index.html` / `landing.css` only unless noted.

**Answered questions from Step 1:**
- Pricing confirmed: Free / 9,99€/kk / 29€ kesäpaketti.
- Exercise count: **2 080+** total (500 vocab, 480 aukkotehtävä, 480 matching, 240 translation, 240 sentence construction, 60 reading, 50 correction, 30 writing). Use "2 000+ harjoitustehtävää" as the round number.
- No teacher quote phase this pass — skip placeholder card.
- Screenshots: current ones are from the old dark theme and don't match Cuaderno. Regenerate new screenshots → new commit added.
- Diagnostic questions: reuse existing 60-question bank in `data/diagnose_questions.json`, select 8 across grade levels.
- Domain: `puheo.fi` purchase pending — leave canonical URLs as Vercel alias.

---

## Commit 1 — `fix(landing): correct urgency bar date and make always-visible`

**Files:** `index.html`

- Fix urgency bar JS: `new Date(2026, 8, 15)` → `new Date(2026, 8, 28)` (September 28).
- Remove the `summerSeason` gate so urgency bar shows from today through exam day.
- Update urgency bar copy: "YO-koe 28.9.2026 — **[N]** päivää jäljellä →" (mobile-friendly single line).
- Urgency bar link: change from `#pricing` → `#mini-diag`.
- Fix `urgency-bar:not(.hidden) ~ .hero` offset to also shift the mini-diag section.

**Why first:** Date bug is a credibility issue. Urgency bar should be live immediately.

---

## Commit 2 — `fix(landing): route Pro and Kesäpaketti CTAs to waitlist modal`

**Files:** `index.html`

- Pro pricing card CTA: `href="app.html"` → `id="pro-cta" onclick="openWaitlist()"`.
- Kesäpaketti CTA: already has `id="summer-cta"` but the href still resolves to `app.html` as fallback — remove fallback href, make it fully modal-driven.
- Update waitlist modal `h3` copy: "Maksullinen tilaus avautuu pian — ilmoita sähköpostisi" (generic, not "kesäpaketti avautuu", since Pro also triggers it now).
- Update waitlist modal body: "Otamme yhteyttä heti kun tilaus on ostettavissa. Arvioimme avauksen kesäkuussa 2026."
- Free tier CTA unchanged (`app.html`).

**Why second:** This is a revenue/legal blocker. No live payment links while Y-tunnus is pending.

---

## Commit 3 — `feat(landing): hero — add essay card visual, update headline and CTA`

**Files:** `index.html`, `landing.css`

- Hero layout: two-column on desktop (text left, essay annotation card right).
  - Left: existing text with updated headline and CTAs.
  - Right: static mini essay annotation card (~300px wide) reusing existing `.essay-demo` markup, reduced to show 1 annotation + score totals only.
- Headline update: `Paranna espanjan YO-arvosanaa tekoälyllä.` → `Paranna espanjan YO-arvosanaa ennen 28.9.2026.`
- Primary CTA: `Aloita ilmaiseksi — 2 min` → `Testaa tasosi — 60 sekuntia →` (anchor to `#mini-diag`).
- Secondary CTA: `Testaa tasosi` (link to diagnose.html) → `Aloita harjoittelu ilmaiseksi →` (link to `app.html`).
- Remove `hero-social-proof` (dead DOM node, always hidden).
- Remove the standalone `exam-countdown` section below hero — merge "28.9.2026" and days remaining into trust strip as the first item (already exists, just make it more prominent).
- CSS: `.hero` two-column grid, essay card hidden on mobile (`display:none` at ≤768px).

**Why third:** Hero is first-impression — once urgency bar and payment CTAs are fixed, hero gets the rebuild.

---

## Commit 4 — `feat(landing): reorder page — move grading demo to section 4`

**Files:** `index.html`

- Cut the `#grading` section from its current position (after compare table).
- Paste it as section 4, immediately after the mini-diagnostic.
- Update section heading to: `YTL-rubriikki, rivi riviltä.` (same as current — no change).
- Add one intro sentence above the essay demo: `Näin Puheo arvioi kirjoitelmasi — YTL:n kolmen kriteerin mukaan.`
- Fix rubric link: `https://www.ylioppilastutkinto.fi/` → `https://www.ylioppilastutkinto.fi/ylioppilastutkinto/koe-ja-tehtavatyypit/kielikokeet` (actual criteria page).

No CSS changes needed — section is self-contained.

---

## Commit 5 — `feat(landing): problem/solution — merge and rewrite copy`

**Files:** `index.html`

- Merge `#problem` and `#solution` into one section `#problem-solution`.
- Two-column layout on desktop: problem bullets (left), feature cards (right). Single column on mobile (bullets above cards).
- Problem bullets: rewrite all three to be Puheo-specific (see DESIGN.md section 5 for copy).
- Replace ✗ emoji problem icons with SVG × marks.
- Feature cards: rewrite copy to be benefit-first (see DESIGN.md section 5).
- Remove the separate `#teaching` vertical timeline section (redundant with rewritten features).

---

## Commit 6 — `feat(landing): features — replace emoji icons with SVG, sharpen copy`

**Files:** `index.html`

- Replace `feature-icon` content in all 3 cards — use inline SVG from Heroicons (pen, cycle, grid patterns).
- Rewrite feature titles and descriptions per DESIGN.md section 6.
- Add a quantified claim to feature 3: "2 000+ harjoitusta" with the sub-breakdown (500 sanaa · 480 aukkotehtävää · 60 lukua · 30 kirjoitelma-aihetta).
- Remove `#screenshots` section from HTML for now — current images are from the old dark theme. The essay annotation demo (moved up in commit 4) carries the visual proof until new screenshots are captured (separate commit below).

---

## Commit 7 — `feat(landing): authority — merge strip and cards into compact component`

**Files:** `index.html`, `landing.css`

- Remove the 3-card `#why-works` authority grid.
- Remove the separate `#credibility` strip.
- Replace both with a single compact authority row: 4 inline items with SVG icons (YTL-rubriikki · 2 000+ harjoitusta · Lukion OPS 2021 · Tehty Suomessa).
- No teacher quote card — skip until real endorsements exist.
- CSS: add `.authority-row` flex component, single horizontal line with separators.

---

## Commit 8 — `feat(landing): comparison — expand to include Duolingo and Quizlet`

**Files:** `index.html`

- Expand comparison table from 2 columns (Abitreenit, Puheo) to 4 columns (Duolingo, Quizlet, Abitreenit, Puheo).
- Update pull quote framing: attribute clearly as editorial explanation, not fake testimonial.
- Update `#compare` section-tag and h2 copy: "Miksi Puheo eikä Duolingo tai Abitreenit?"
- Preserve mobile card collapse behavior.

---

## Commit 9 — `feat(landing): pricing — reorder to section 9, update constraints`

**Files:** `index.html`, `landing.css`

- Move `#pricing` section from its current position to directly after the comparison section.
- Remove the third card (monthly Pro) — reduce to two cards: Free + Kesäpaketti.
- Update feature list copy on Kesäpaketti: lead with "Ei automaattista uusimista" as first item.
- Replace `price-features li.bonus::before { content: '🎁 '; }` with SVG star in CSS.
- Add below-pricing trust line: "14 päivän rahat takaisin -takuu · Peruta milloin tahansa".
- Move CTA section from post-pricing to post-FAQ (correct position for "final nudge").

---

## Commit 10 — `feat(landing): FAQ — reorder and add missing questions`

**Files:** `index.html`

- Reorder FAQ per DESIGN.md section 10 (8 items, YTL endorsement first).
- Add: "Onko tämä virallisesti YTL:n hyväksymä?" (most important missing question).
- Add: "Onko tietoni turvassa?" (GDPR trust signal).
- Remove duplicate: "Miten Puheo eroaa Abitreeneistä?" — already answered in comparison section.
- Update JSON-LD FAQPage schema to match new question set.

---

## Commit 11 — `feat(diagnose): redesign standalone diagnostic — 8 questions, email-after-value`

**Files:** `diagnose.html`

- Select 8 questions from existing `data/diagnose_questions.json` (60-question bank, already Finnish, already level-tagged A/B/C/M/E/L). One per grade level plus two mid-band extras per DIAGNOSTIC.md.
- Implement weighted scoring: A=1, B=1.2, C=1.5, M=2, E=2.5, L=3; sum → band → grade letter.
- Remove email gate: result screen shows grade unconditionally.
- Add grade scale key (I · A · B · C · M · E · L) below grade letter on result screen.
- Add breakdown table (Sanasto / Kielioppi / Luetun ymmärtäminen dots).
- Add "Heikoin alue" personalized recommendation (the category with lowest correct-rate).
- Email capture moved below primary CTAs on result screen.
- Fix mobile hover bug on options: `background: #261818` → `background: var(--surface-2)`.
- Update intro screen: replace vague "Selvitä tasosi" with concrete result promise.
- CTA on result: `app.html?diagnostic=[grade]&weak=[area]` — URL params for app to read.

---

## Commit 12 — `feat(blog): Article schema, CTA blocks, internal linking on all posts`

**Files:** `blog/*.html`

- Add Article JSON-LD schema to all 5 existing posts.
- Add standard CTA block component at end of each post (links to relevant in-app exercise).
- Add related posts section (2 links) at end of each post.
- Add reading-time estimate to post header.
- Canonical URLs: leave as `espanja-v2-1.vercel.app` — domain purchase pending.
- No new posts yet — new posts are separate tickets once the design system is locked.

---

## Commit 13 — `chore(landing): regenerate screenshots for Cuaderno theme`

**Files:** `public/screenshots/*.png`, `index.html`

- Capture new screenshots from the live app (post Pass 1 Cuaderno theme):
  - `dashboard.png` — main app dashboard with warm parchment palette
  - `vocab.png` — sanastoharjoitus
  - `writing.png` — kirjoitusteht&auml;v&auml;
  - `feedback.png` — AI-palaute with YTL score bars
- Use consistent viewport: 1600×1000 for desktop, 390×844 for a mobile variant of each.
- Replace the blank space left by the removed `#screenshots` section with a new "Puheo käytännössä" section — same carousel markup, new images.
- Verify `loading` attributes: first slide `eager`, rest `lazy`.
- This commit depends on Pass 1's Cuaderno theme being fully deployed so that the real app actually looks like the design system.

---

## Commit sequence summary

| # | Scope | Risk | Blocker for |
|---|-------|------|-------------|
| 1 | Fix urgency bar date + visibility | Low | Trust |
| 2 | Fix payment CTA routing to waitlist | Low | Legal/revenue |
| 3 | Hero rebuild (headline, 2-col, CTA) | Medium | First impression |
| 4 | Reorder: grading demo moves up | Low | Proof ordering |
| 5 | Problem/solution merge + copy | Medium | Narrative clarity |
| 6 | Feature icons + copy + remove screenshots | Low | Polish |
| 7 | Authority merge | Low | Page length |
| 8 | Comparison expand | Low | SEO/positioning |
| 9 | Pricing move + constraints | Medium | Conversion |
| 10 | FAQ reorder + new questions | Low | Trust |
| 11 | Diagnose full rebuild | High | Funnel |
| 12 | Blog schemas + CTAs | Low | SEO |
| 13 | New Cuaderno screenshots + re-add carousel | Low | Final polish |

**Total estimated time:** 11–15 hours of implementation work across 13 commits.

**Ship order:** Commits 1 and 2 can go in the same session (both are fixes, zero visual risk). Commits 3–10 are the landing page pass, best done in order since each depends on the previous section's position in the DOM. Commit 11 (diagnose.html) is independent and can be done in parallel. Commit 12 (blog) is also independent. Commit 13 is last — it's the visual "polish" pass once the skeleton is right.
