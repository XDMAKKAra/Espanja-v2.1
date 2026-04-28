# Puheo Improvement Agent — Handoff Brief

> Read this first if you are a new Cowork session, Claude.ai chat session, or Claude Code session that is helping marcel work on Puheo. The Improvement Agent itself runs separately in Claude Code — this file briefs whoever is helping marcel **plan and direct** that agent, not the agent itself.

## Background

I'm marcel. I'm building **Puheo** — an AI-powered learning app for Finnish high-school students preparing for the Spanish YO-koe matriculation exam (lyhyt oppimäärä, short syllabus). Stack: Node + Express ESM, Supabase (PostgreSQL), OpenAI gpt-4o-mini, vanilla JS frontend (no framework). All UI text is in Finnish. Email via Resend, payments via LemonSqueezy.

Repo lives at: `C:\Users\marce\OneDrive\Documents\espanja paska` (yes, "paska" is Finnish — the project started as a joke and the folder name stuck).

I am Finnish. You can reply in Finnish or English — Finnish is fine for our conversation, but the prompts you write for the agent should be in English because Claude handles English instructions more reliably.

## How I work with the agent

I run an autonomous "Improvement Agent" in Claude Code that loops continuously: it invents improvements, builds them, browser-tests them with Playwright + axe screenshots at 1440 + 375, self-reviews via subagents, ships, checkpoints, repeats. It runs hands-off until I say "stop" or until I give it a course correction.

Your job (whoever is reading this in a new session) is **not** to be the agent. Your job is to help me:

1. Review what the agent has shipped (read screenshots and files).
2. Catch when it has misunderstood my intent.
3. Write clean, paste-ready prompts that I drop into Claude Code to course-correct or kick off the next phase.
4. Brainstorm where to take the product next.

When I send you a screenshot of the live app or a screenshot of Claude Code's terminal, infer what's happening. Don't ask me to re-explain things that are visible in the image.

## Files in the repo that matter to YOU (the helper)

- `SUPERPOWER_PROMPT_V2.md` — master prompt for the agent. Resume protocol, loop structure, token discipline, sourcing rules.
- `LANDING_PLAN.md` — full spec for the landing page rebuild (Linear/Vercel restrained dark aesthetic, browser-frame mockups, no phone mockups, no invented social proof).
- `PLAN.md` — agent's living roadmap, edited per loop.
- `AGENT_STATE.md` — single-file checkpoint the agent overwrites every loop. Last completed loop number, what's next, files memorized (so resumes don't re-read them), files worth re-reading. **This is your primary source of truth for "where is the agent right now".**
- `IMPROVEMENTS.md` — one-line ledger per shipped loop. Read the last 30 lines for recent work.
- `BUGS.md` — agent's own bug backlog.
- `references/astra/` — competitor screenshots (Astra AI, used as visual reference, not copied).
- `references/landing/<site>/` — Linear, Vercel, Stripe, Cron, Duolingo screenshots for the landing rebuild.
- `references/puheo-screens/` — real Puheo UI screenshots used inside browser-frame mockups on the landing.
- `CLAUDE.md` — project-level instructions checked into the repo. Tech stack, commands, structure.

## Operating model I built into the agent

These are the rules the agent runs under. Don't fight them — work within them.

1. **Curator/integrator, not originator.** For every UI piece, the agent is required to source from existing libraries (21st.dev, Magic UI, Aceternity, shadcn, Linear, Vercel, unDraw, Lottie, Hero Patterns) and adapt to Puheo. Writing from scratch requires written justification in IMPROVEMENTS.md. When you suggest features, name 2-3 concrete sources for the agent to pull from.
2. **Loop structure:** INVENT → PLAN → BUILD → BROWSER-TEST (Playwright + axe screenshots at 1440 + 375) → SELF-REVIEW (spawned subagent) → RECORD (one IMPROVEMENTS.md line) → CHECKPOINT (overwrite AGENT_STATE.md) → NEXT.
3. **Token discipline:** Edit > Write, Grep > Read, never re-read files in the AGENT_STATE.md "memorized" list, no chat preamble, subagent reviews get diff + 1-2 screenshots only.
4. **Resume protocol:** when I `/clear` or my quota resets, I paste a one-liner that tells the agent to read AGENT_STATE.md and continue. It picks up exactly where it left off without re-onboarding.
5. **Hard removals:** the speaking/pronunciation feature was deleted entirely in early loops. Don't suggest bringing it back.
6. **Never invent social proof numbers.** Use `<!-- TODO -->` placeholders in landing copy.
7. **No phone/iPhone mockups on landing.** Puheo is a web app. Browser frames + isolated UI cards only.
8. **Always slot work explicitly.** When you write a prompt that adds a task, say exactly when to do it ("AFTER L49, BEFORE the dark-theme polish"). The agent is bad at prioritizing on its own.

## Current state of the project

(As of this handoff — the agent moves fast, so read AGENT_STATE.md for the actual current loop number.)

The agent has shipped ~45 loops. Already done:
- Speaking feature fully removed (L0).
- Bug bash, axe violations 28 → 0, console errors 69 → 0 (L1-L15).
- Lighthouse desktop landing 99/100/92, app 93/100/96.
- Profile screen rebuilt to one viewport (no scroll), Astra-style.
- Right sidebar redesigned (top-right user chip + Pro panel — though the Pro panel is still wrong, see below).
- 4 P0 bugs from my review fixed: settings buttons, YO-readiness math (was 14% on 8 sessions, now correct), "NaN pv sitten" date parsing, right-rail overflow.
- Three local skills created: `puheo-screen-template`, `puheo-finnish-voice`, `puheo-ai-prompt`.
- Landing rebuild: L42 setup, L43 nav + hero, L44 problem + 3 pillars, L45 how-it-works + AI grading showcase.

In progress: landing rebuild loops L46-L49.

Queued AFTER L49 (in this order):
- **2 loops:** Pro upsell rebuild — current panel in right rail must become a small dismissible bottom-right popup (~320px wide, X close button, localStorage `puheo_pro_popup_dismissed` for 7-day suppression, slide-up after 5s, free users only). Source the popup pattern from magicui.design / aceternity.com / 21st.dev.
- **3-4 loops:** Dark theme done properly — current dark palette leaked from landing into the app accidentally and I decided I like it. Build it intentionally: shared `css/tokens-shared.css` consumed by both `.landing` and app.html, preserve the existing Auto/Vaalea/Tumma toggle, test every screen at 1440 + 375 in both themes, fix every contrast violation.

Active sourcing libraries: 21st.dev (primary for landing pricing/FAQ/footer/CTA), Magic UI, Aceternity, shadcn, Linear, Vercel, Stripe, Cron, unDraw, Lottiefiles, Hero Patterns, Heroicons, Lucide, Tabler.

Loose idea wells for after the dark theme polish (not committed): spaced repetition queue, achievements/badges expansion, exam mode (timed mock YO-koe), AI prompt quality audit (rewrite all OpenAI prompts in lib/openai.js + routes/exercises.js + routes/writing.js with structured JSON output and YO-koe rubric few-shot examples), performance pass (split app.js into modules, lazy-load screens), shareable score cards, exportable progress reports.

## Token economy — important

I am on a metered Claude plan and watch my quota. I work across three surfaces:

- **Cowork** (Claude desktop with file access) — high-fidelity, can read screenshots, write files directly into the repo, run shell. Cost-per-message: high (~15-30k tokens including system prompt overhead).
- **Claude.ai chat** (web/mobile) — text + screenshot in, text out. No file access. Cost-per-message: low (~2-5k tokens).
- **Claude Code** (CLI in repo) — runs the actual Improvement Agent. Pure agent work, fairly token-efficient per loop.

Optimal flow:
1. Brainstorm + planning + writing prompts → **Claude.ai chat** (cheapest).
2. Pasting prompts and supervising the agent → **Claude Code** (the agent itself burns tokens on the work).
3. **Cowork only when** I need a helper to write files directly into my repo (like creating LANDING_PLAN.md, HANDOFF.md, etc.).

If you're a Cowork session and the user just needs a prompt or analysis, suggest moving the conversation to claude.ai chat to save tokens.

## How to write prompts for the agent

When I ask you to write a prompt for the agent, follow this structure:

````
PAUSE before Loop N. [One-line context for why we're interrupting.]

=== UPDATE 1: [name] ===

[What you want done. Concrete enough that the agent doesn't need to guess.]

Specs:
- [Bullet list of measurable requirements]
- [Source library to pull from, with URL]
- [Files to touch]

=== UPDATE 2: [name] ===

[Next item, same structure.]

=== ORDER ===

1. [Exact sequence]
2. [Including when each item happens — "now" vs "AFTER Loop N"]

[Closing rule, e.g. "Do not start the dark theme work now — keep landing momentum."]
````

Always:
- English prose, even if the user wrote in Finnish.
- Reference specific files by path.
- Cite specific source libraries (21st.dev URL, Magic UI component name, etc.) when asking for visual work.
- Tell the agent when to do the work, not just what.
- For bugs, give the agent enough information to reproduce: which screen, which viewport, exact symptom.

Avoid:
- Vague directives ("make it better", "polish it").
- Letting the agent prioritize its own queue when I have a specific intent.
- Asking the agent to invent numbers, copy, or facts that the user hasn't supplied.

## Active question right now

[REPLACE THIS LINE with whatever you want help with in the new session. Examples:
- "Agentti on juuri päättämässä L45 ledger-päivitystä. Kirjoita mulle paste-valmis prompti L46:lle (Pricing) joka käyttää 21st.dev:tä lähteenä."
- "Tee taulukko jossa on landing-rebuildin kaikki 49 looppia, mitä on tehty, mitä on jäljellä, ja arvioidut tokenit per loop."
- "Brainstormaa 10 ideaa post-landing roadmappiin. Painota differentiaatiota suomalaisilla YO-markkinoilla."
- "Olen huomannut bugin: [kuvaus]. Kirjoita prompti joka korjaa sen."]
