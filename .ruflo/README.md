# Ruflo configuration for Puheo

This folder contains a Ruflo orchestrator configuration. Ruflo (https://github.com/ruvnet/ruflo) is a multi-agent platform on top of Claude Code that coordinates 100+ specialized agents (coder, reviewer, security, testgen, docs).

## Install (high level — verify against current Ruflo docs)

The Ruflo install commands change between versions; check the project README before running. As of research time:

```bash
# Lite path (slash commands only, no MCP server)
/plugin install ruflo-core@ruflo

# Full path (full orchestrator)
npx ruflo@latest init wizard

# Register as MCP server in Claude Code
claude mcp add ruflo -- npx ruflo@latest mcp start
```

## What `config.json` does

It tells the Ruflo orchestrator and any agents it spawns:

1. **What to read every loop** — `AGENT_PROMPT_STANDARDS.md`, `AGENT_STATE.md`, `BUGS.md`, `CLAUDE.md`
2. **Which skills to apply** — Puheo-internal skills + design-plugin skills + marketing-plugin skills
3. **Sourcing rule** — 21st.dev primary, magicui/shadcn/HyperUI fallback
4. **Guardrails** — never commit, never deploy, never modify lesson JSON, never invent facts
5. **Task routing** — which Ruflo agents handle BUGS.md P0/P1/P2, audits, CI repair
6. **Workflow limits** — max 90 minutes per loop, 5 loops per session
7. **Verify checklist** — axe, design-critique, accessibility-review, brand-review, npm test, IMPROVEMENTS.md, SW bump
8. **Doc size limits** — AGENT_STATE.md max 50 lines, IMPROVEMENTS.md max 100 lines
9. **Ship readiness** — BUGS.md empty, coverage ≥80%, Lighthouse ≥90, npm audit clean, smoke test 5 levels
10. **Fallback** — points to `AGENT_PROMPT_RUFLO_LOOP.md` if Ruflo cannot run

## When to fall back to `AGENT_PROMPT_RUFLO_LOOP.md`

If any of these are true, run `AGENT_PROMPT_RUFLO_LOOP.md` directly in Claude Code instead:

- Ruflo install fails or version diverges from this config schema
- You want a single auditable run rather than a daemon
- You don't want to add Ruflo's API-key footprint (Claude + OpenAI + Gemini + Cohere) to this project

The fallback prompt produces the same outcomes (BUGS.md correction loops, audits, frontend updates) by spawning Sonnet workers via the Task tool — the exact pattern already used for `AGENT_PROMPT_LESSON_BATCHES_AUTONOMOUS.md`.

## What to verify before first run

- [ ] `BUGS.md` reflects current state (some entries may be stale post-lesson-batch)
- [ ] `AGENT_STATE.md` has the latest "Last completed loop" entry
- [ ] `AGENT_PROMPT_STANDARDS.md` is up to date
- [ ] `lib/curriculumData.js` matches the JSON files in `data/courses/`
- [ ] `.env` has API keys for whatever models Ruflo needs
- [ ] Recent git push has succeeded (Ruflo expects a clean working tree)
