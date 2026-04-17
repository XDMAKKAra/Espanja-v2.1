# Puheo

AI-powered language practice for the Finnish matriculation exam (yo-koe).

**Live:** [espanja-v2-1.vercel.app](https://espanja-v2-1.vercel.app)

## Tech Stack

Express.js + Vanilla JS (ES modules) | Supabase (auth + DB) | OpenAI API | Vercel serverless

## Features

- **Vocabulary** - Adaptive multiple choice with spaced repetition (levels I-L)
- **Grammar** - Targeted drills on common YTL error patterns (ser/estar, subjunctive, etc.)
- **Reading comprehension** - AI-generated texts with multiple question types
- **Writing** - Essay tasks graded against YTL criteria
- **Mock exam** - Timed exam combining reading + writing (45 min)
- **Exercise bank** - Reuses generated exercises to reduce API costs
- **Dashboard** - Progress tracking, heatmap, streak counter, recommendations

## Setup

```bash
npm install
cp .env.example .env   # Add your API keys
npm run dev            # Starts on http://localhost:3000
```

### Required environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key (gpt-4o-mini) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | Resend email API key |
| `EMAIL_FROM` | Sender email address |
| `APP_URL` | Public URL of the app |

## Deployment (Vercel)

The app deploys automatically on push to `main` via GitHub integration.

1. Connect the repo to Vercel
2. Add all env vars in Vercel dashboard (Settings > Environment Variables)
3. Set `APP_URL` to your Vercel production URL
4. Push to `main`

The API runs as a serverless function via `api/index.js`. Static files are served directly.

## Project Structure

```
js/                    Frontend ES modules
  main.js              Entry point + wiring
  api.js               Auth tokens + fetch wrapper
  state.js             Shared state
  ui/                  Loading, navigation
  screens/             Auth, dashboard, vocab, grammar, reading, writing, exam
  features/            Spaced repetition
routes/                Express API routes
middleware/            Auth + rate limiting (Supabase-backed)
lib/                   OpenAI wrapper + cache
migrations/            SQL migrations for Supabase
api/                   Vercel serverless entry point
```

## Testing

```bash
npm test
```

## License

Private - All rights reserved.
