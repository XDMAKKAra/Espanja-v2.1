# Pass 3 — Landing + conversion · Step 1 (design only)

You are working in `C:\Users\marce\OneDrive\Documents\espanja paska\`. Goal: rebuild the marketing site (`index.html`, `landing.css`, `pricing.html`, diagnostic flow, blog) for real conversion, inheriting the design system from Pass 1.

**Do NOT begin until Pass 1 (design system) is fully merged.** Landing inherits tokens, components, and typography from the design system — rebuilding landing first means throwing it away.

## Skills to load

- `.claude/skills/ui-ux-pro-max/SKILL.md`
- `.claude/skills/redesign-existing-projects/SKILL.md` — the "take what exists and redo it" workflow. Follow its process.

## Why this pass

Current `index.html` is 85KB and `landing.css` is 35KB — there's a lot there, but conversion-wise it's unclear what the hero promises, social proof is thin, pricing is buried, and the value prop doesn't lead with the YO koe exam date. By now Pass 0 has shipped real exercise variety, Pass 1 has given the app a polished look, and Pass 2 has filled the content bank — the landing page can finally tell the truth and it's a good truth.

## Audience

Finnish high schoolers taking Spanish YO koe 28.9.2026 (primary) and their parents (secondary — parents often pay). Language: Finnish. Tone: competent, calm, exam-serious with warmth. Not bubbly. Not corporate.

## Deliverables (Step 1 only, no production code)

### 1. `landing/AUDIT.md`
Review the current `index.html` + `landing.css` top to bottom. Section by section: what's the intent, is it working, what's the conversion failure mode. Include current analytics if any (PostHog events on landing?). Cite line numbers.

### 2. `landing/RESEARCH.md`
One-page-each lookup of:
- 3 competitor sites (e.g. WordDive, Mondly, Duolingo) — what does their landing do that ours doesn't.
- Finnish EdTech conventions — what do Finnish students expect from a learning site? (tone, imagery, trust signals).
- YO-koe specific messaging — what do students actually google? ("espanja yo-koe", "lyhyt oppimäärä harjoitukset", "subjunktiivi espanja" etc.) Use this for SEO alignment.

### 3. `landing/DESIGN.md`
The new landing spec, section by section:
- **Hero**: single promise, single CTA, countdown to 28.9.2026, mini-diagnostic inline (not buried).
- **Social proof bar**: even with zero users, lean on authority signals — YTL syllabus alignment, Finnish teacher review quotes (solicit if absent), data points ("500+ hand-curated vocab items").
- **Problem / solution**: the pain point Finnish students have (bored of Quizlet, Duolingo doesn't prep YO koe, teacher moves too fast/slow). Our answer.
- **Product demo**: a real embedded exercise, not a screenshot. Shows the app actually working.
- **Features**: 3–4 features max. Each with a one-sentence benefit + visual.
- **Pricing**: free + pro, crystal-clear. Price in €. No hidden tiers. **⚠️ Y-tunnus constraint:** the "Buy now" button on the pricing card routes to a "Coming soon — join waitlist" page (capture email + send to Resend), NOT to live LemonSqueezy checkout. marcel registers y-tunnus closer to marketing launch; live payments wire up then.
- **FAQ**: 6–8 objections answered. "Is this officially endorsed by YTL?" "What if the exam changes?" "Can I cancel anytime?" "Does it work on phone?" "Is my data safe?"
- **Footer**: trust links, privacy, refund, contact.
- Mobile mock + desktop mock for each section.

### 4. `landing/BLOG.md`
Audit the existing 5 blog posts against the new design system and SEO keywords. List 10 new posts to add, each with working title, target keyword, word count, linked exercise type inside the app. Blog is a traffic driver — it needs real plans.

### 5. `landing/DIAGNOSTIC.md`
The current `diagnose.html` captures emails via a mini-test. Audit it, propose a redesign that:
- Tightens to ~8 questions.
- Gives an instant grade + "you're at level X, here's your gap."
- Only asks for email AFTER showing the grade (email-after-value, not email-wall).
- Pushes into app sign-up with a single CTA.

### 6. `landing/PLAN.md`
Ordered commit sequence for Step 2. Target 10–14 commits. Sections of the landing ship in order (hero first, footer last). Blog and diagnostic ship last.

## Stop here

Reply with:
1. The aesthetic + tone direction in one paragraph.
2. PLAN.md inline.
3. Any open questions (e.g. pricing numbers, whether to solicit Finnish teacher quotes, etc).
4. "Ready for approval."
