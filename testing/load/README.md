# Load Testing — Pass 6 C15

## Local run

Requires k6 (`brew install k6` or https://k6.io/docs/get-started/installation).

```
# Against local dev server (lightweight smoke — 10 VU, 1 min):
K6_VU=10 K6_DURATION=1m BASE_URL=http://localhost:3000 k6 run testing/load/mixed-session.js

# Exam-week target (100 VU, 10 min):
BASE_URL=https://puheo.vercel.app \
TEST_USER_TOKEN="$(cat .test-token)" \
K6_VU=100 K6_DURATION=10m \
k6 run testing/load/mixed-session.js
```

Results written to `testing/load/last-run.json`. Commit this only after an intentional baseline re-take.

## Thresholds (fail build if exceeded)

- `http_req_failed` overall error rate < 1%
- `http_req_duration{kind:cache}` p95 < 800ms (SR due, placement fetch, dashboard)
- `http_req_duration{kind:ai}` p95 < 4000ms (grading, generation)

## Scenario weighting

| Weight | Endpoint | Kind |
|---|---|---|
| 40% | `POST /api/exercises/gap-fill` | ai |
| 20% | `POST /api/writing/grade-writing` | ai |
| 20% | `GET /api/sr/due` | cache |
| 10% | `GET /api/placement/questions` | cache |
| 10% | `POST /api/exercises/reading-task` | ai |

Weighting roughly matches expected exam-week traffic: vocab-heavy with writing spikes around the exam day.

## CI

A nightly GH Actions job (`load.yml`, separate from the PR `ci.yml`) runs the smoke at 10 VU / 1m against the preview deployment and uploads results. Full 100 VU / 10m is manual — it hits OpenAI quota and costs real money.
