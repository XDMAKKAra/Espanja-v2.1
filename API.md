# Puheo API Documentation

Base URL: `http://localhost:3000` (dev) or `https://puheo.fi` (prod)

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### POST /api/auth/register
Create a new account.

**Body:**
```json
{ "email": "user@example.com", "password": "SecurePass1" }
```

**Password requirements:** min 8 chars, at least 1 uppercase, 1 lowercase, 1 number.

**Response:** `{ token, refreshToken, email, emailVerified }`

### POST /api/auth/login
Sign in with email and password.

**Body:** `{ "email": "...", "password": "..." }`

**Response:** `{ token, refreshToken, email }`

### POST /api/auth/refresh
Refresh an expired access token.

**Body:** `{ "refreshToken": "..." }`

**Response:** `{ token, refreshToken, email }`

### POST /api/auth/forgot-password
Request a password reset email.

**Body:** `{ "email": "..." }`

**Response:** `{ ok: true }` (always, to prevent email enumeration)

### POST /api/auth/reset-password
Set a new password using a reset token.

**Body:** `{ "token": "...", "newPassword": "..." }`

### POST /api/auth/verify-email
Verify email address using token from verification email.

**Body:** `{ "token": "..." }`

---

## Exercises

### POST /api/generate
Generate vocabulary exercises. Rate limited: 20/hour.

**Body:**
```json
{
  "level": "B",          // I|A|B|C|M|E|L
  "topic": "general vocabulary",  // see valid topics below
  "count": 4,            // 1-10
  "language": "spanish"  // spanish|swedish|german|french
}
```

**Valid topics:** `general vocabulary`, `society and politics`, `environment and nature`, `health and body`, `travel and transport`, `culture and arts`, `work and economy`

**Response:** `{ exercises: [...] }`

### POST /api/grade
Calculate a YTL grade from scores. No rate limit.

**Body:**
```json
{
  "correct": 10,
  "total": 12,
  "level": "B"  // affects grade bonus
}
```

**Response:** `{ grade: "E", pct: 83, correct: 10, total: 12 }`

### POST /api/grammar-drill
Generate grammar exercises. Rate limited: 20/hour.

**Body:**
```json
{
  "topic": "mixed",     // mixed|ser_estar|hay_estar|subjunctive|conditional|preterite_imperfect|pronouns
  "level": "C",         // B|C|M|E|L
  "count": 6,           // 1-10
  "language": "spanish"
}
```

**Response:** `{ exercises: [...] }`

### POST /api/reading-task
Generate a reading comprehension task. Rate limited: 10/hour. **Pro required.**

**Body:**
```json
{
  "level": "C",                    // B|C|M|E|L
  "topic": "animals and nature",   // see valid topics
  "language": "spanish"
}
```

**Valid topics:** `animals and nature`, `travel and places`, `culture and history`, `social media and technology`, `health and sports`, `environment`

**Response:** `{ reading: { title, text, source, questions: [...] } }`

### POST /api/writing-task
Generate a writing task. Rate limited: 10/hour. **Pro required.**

**Body:**
```json
{
  "taskType": "short",   // short|long
  "topic": "general",
  "language": "spanish"
}
```

**Response:** `{ task: { taskType, points, charMin, charMax, situation, prompt, requirements, textType } }`

### POST /api/grade-writing
Grade a student's writing. Rate limited: 10/hour. **Pro required.**

**Body:**
```json
{
  "task": { /* task object from /writing-task */ },
  "studentText": "Hola, me llamo..."
}
```

**Response:** `{ result: { rawScore, penalty, finalScore, maxScore, ytlGrade, criteria, errors, positives, overallFeedback } }`

---

## Progress & Dashboard

### POST /api/progress
Save exercise results. **Auth required.**

**Body:**
```json
{
  "mode": "vocab",       // vocab|grammar|reading|writing|exam
  "level": "C",
  "scoreCorrect": 10,
  "scoreTotal": 12,
  "ytlGrade": "M"
}
```

### GET /api/dashboard
Get user dashboard data. **Auth required.**

**Response:**
```json
{
  "totalSessions": 42,
  "modeStats": { "vocab": { "sessions": 20, "bestGrade": "E", "avgPct": 75 } },
  "recent": [...],
  "chartData": [...],
  "estLevel": "M",
  "streak": 5,
  "weekSessions": 8,
  "prevWeekSessions": 6,
  "suggestedLevel": "C",
  "modeDaysAgo": { "vocab": 0, "grammar": 2, "reading": null, "writing": 5 },
  "pro": false
}
```

---

## Email

### POST /api/email/weekly-progress
Trigger weekly progress email for the current user. **Auth required.**

### POST /api/email/streak-reminders
Send streak reminders to all eligible users. **Cron secret required** (`x-cron-secret` header).

### GET /api/email/preferences
Get email notification preferences. **Auth required.**

**Response:** `{ weeklyProgress: true, streakReminders: true }`

### PUT /api/email/preferences
Update email preferences. **Auth required.**

**Body:** `{ "weeklyProgress": true, "streakReminders": false }`

---

## Payments (LemonSqueezy)

### POST /api/payments/create-checkout-session
Create a checkout URL. **Auth required.**

**Response:** `{ url: "https://..." }`

### GET /api/payments/portal-session
Get customer portal URL. **Auth required.**

**Response:** `{ url: "https://..." }`

### POST /api/payments/webhook
LemonSqueezy webhook handler. **Raw body, signature verified.**

---

## Health Check

### GET /health
Server health check.

**Response:** `{ status: "ok", uptime: 12345.67 }`

---

## Error Responses

All errors return JSON:
```json
{ "error": "Error message in Finnish" }
```

**Status codes:**
- `400` — Invalid input
- `401` — Unauthorized / expired token
- `403` — Pro subscription required (`error: "pro_required"`)
- `429` — Rate limited
- `500` — Server error

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/login` | 10 | 1 min |
| `/api/auth/register` | 5 | 1 hour |
| `/api/auth/forgot-password` | 3 | 1 hour |
| `/api/generate`, `/api/grammar-drill` | 20 | 1 hour |
| `/api/reading-task`, `/api/writing-task`, `/api/grade-writing` | 10 | 1 hour |

Rate limit headers (`RateLimit-*`) are included in responses.

---

## Environment Variables

```
# Required
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
CRON_SECRET=

# Optional
PORT=3000
APP_URL=https://puheo.fi
EMAIL_FROM=Puheo <noreply@puheo.fi>
ALLOWED_ORIGINS=https://puheo.fi
TEST_PRO_EMAILS=           # comma-separated, for testing only
TEST_FREE_EMAILS=          # comma-separated, for testing only
```
