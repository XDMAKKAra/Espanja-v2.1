# Puheo — Spanish YO-koe Learning App

## Project Overview
AI-powered adaptive Spanish language learning platform for Finnish high school students preparing for the "ylioppilastutkinto" matriculation exam (lyhyt oppimäärä).

## Tech Stack
- **Backend:** Node.js + Express (ES modules)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI API (gpt-4o-mini)
- **Email:** Resend.io
- **Payments:** Stripe
- **Frontend:** Vanilla JS + CSS (no framework)

## Key Commands
- `npm run dev` — Start dev server with auto-reload (port 3000)
- `npm start` — Start production server
- `npm test` — Run vitest test suite

## Project Structure
```
server.js          — Express entry point
api/index.js       — Serverless/Vercel entry point
routes/
  auth.js          — Register, login, password reset, email verify
  exercises.js     — Vocab generate, grade, grammar drill, reading task
  writing.js       — Writing task + AI grading
  progress.js      — Save progress, dashboard data
  email.js         — Weekly progress, streak reminders, preferences
  stripe.js        — LemonSqueezy checkout, portal, webhooks
middleware/
  auth.js          — requireAuth, isPro, requirePro, softProGate
  rateLimit.js     — Rate limiters for auth, AI, registration
lib/
  openai.js        — OpenAI wrapper, shared constants, utilities
app.html           — Main SPA (all screens)
app.js             — Frontend logic (2300+ lines, vanilla JS)
index.html         — Landing page
email.js           — Email templates (Resend)
supabase.js        — Supabase client
```

## Important Notes
- All UI text is in Finnish
- Frontend is a single-page app with screen switching (no router)
- db.js exists but is unused legacy — Supabase is the real database
- Test accounts are configured via env vars (TEST_PRO_EMAILS, TEST_FREE_EMAILS)
- CORS is restricted to ALLOWED_ORIGINS env var

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
