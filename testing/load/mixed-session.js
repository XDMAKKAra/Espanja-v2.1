// k6 load scenario — 100 concurrent students, 10-minute ramp-hold.
//
// Simulates a Pass 6 exam-week-style load: every endpoint that a student
// touches in a session, weighted by the observed traffic mix. Run with:
//
//   BASE_URL=https://puheo.vercel.app \
//   K6_VU=100 K6_DURATION=10m \
//   TEST_USER_TOKEN="$(cat token.txt)" \
//   k6 run testing/load/mixed-session.js
//
// The token is a Supabase access token for a test Pro user. The load
// generator never creates accounts or persists meaningful state — all
// endpoints exercised are idempotent (read + grade advisory + generate),
// none mutate exam history or SR schedule.
//
// Thresholds fail the run if latency or error rate regresses beyond spec:
//   p95 < 800ms for cached endpoints (seed picks, dashboard)
//   p95 < 4000ms for AI-grading endpoints (writing/grade)
//   overall error rate < 1%

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const TOKEN = __ENV.TEST_USER_TOKEN || '';
const VU = parseInt(__ENV.K6_VU || '100', 10);
const DUR = __ENV.K6_DURATION || '10m';

export const options = {
  scenarios: {
    mixed: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: VU },       // ramp to peak
        { duration: DUR, target: VU },         // hold
        { duration: '30s', target: 0 },        // ramp down
      ],
      gracefulStop: '15s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{kind:cache}': ['p(95)<800'],
    'http_req_duration{kind:ai}': ['p(95)<4000'],
  },
};

const errorRate = new Rate('errors');
const aiLatency = new Trend('ai_latency_ms', true);

const HEADERS = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};

// Traffic mix: 40% vocab, 20% grade writing, 20% SR, 10% placement, 10% reading
export default function () {
  const r = Math.random();

  if (r < 0.4) {
    group('vocab generate', () => {
      const res = http.post(
        `${BASE}/api/exercises/gap-fill`,
        JSON.stringify({ topic: 'ser_estar', level: 'B', count: 5, language: 'spanish' }),
        { headers: { 'Content-Type': 'application/json', ...HEADERS }, tags: { kind: 'ai' } },
      );
      aiLatency.add(res.timings.duration);
      const ok = check(res, { 'vocab 200/401': r => [200, 401].includes(r.status) });
      errorRate.add(!ok);
    });
  } else if (r < 0.6) {
    group('writing grade', () => {
      const payload = {
        task: { taskType: 'short', charMin: 160, charMax: 240, points: 33, prompt: 'x', requirements: [] },
        studentText: 'Hola, me llamo Juan y estudio español en Finlandia. Me gusta mucho el idioma pero es difícil.',
      };
      const res = http.post(
        `${BASE}/api/writing/grade-writing`,
        JSON.stringify(payload),
        { headers: { 'Content-Type': 'application/json', ...HEADERS }, tags: { kind: 'ai' } },
      );
      aiLatency.add(res.timings.duration);
      const ok = check(res, { 'writing 200/401/400': r => [200, 400, 401].includes(r.status) });
      errorRate.add(!ok);
    });
  } else if (r < 0.8) {
    group('SR due', () => {
      const res = http.get(`${BASE}/api/sr/due?language=spanish&limit=20`, {
        headers: HEADERS,
        tags: { kind: 'cache' },
      });
      const ok = check(res, { 'sr 200/401': r => [200, 401].includes(r.status) });
      errorRate.add(!ok);
    });
  } else if (r < 0.9) {
    group('placement fetch', () => {
      const res = http.get(`${BASE}/api/placement/questions?language=spanish`, {
        headers: HEADERS,
        tags: { kind: 'cache' },
      });
      const ok = check(res, { 'placement 200/401': r => [200, 401].includes(r.status) });
      errorRate.add(!ok);
    });
  } else {
    group('reading task', () => {
      const res = http.post(
        `${BASE}/api/exercises/reading-task`,
        JSON.stringify({ topic: 'society', level: 'B', language: 'spanish' }),
        { headers: { 'Content-Type': 'application/json', ...HEADERS }, tags: { kind: 'ai' } },
      );
      aiLatency.add(res.timings.duration);
      const ok = check(res, { 'reading 200/401': r => [200, 401].includes(r.status) });
      errorRate.add(!ok);
    });
  }

  // Realistic think-time between actions
  sleep(Math.random() * 5 + 2);
}

export function handleSummary(data) {
  return {
    'testing/load/last-run.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data),
  };
}

function textSummary(data) {
  const dur = data.metrics.http_req_duration?.values || {};
  const fail = data.metrics.http_req_failed?.values || {};
  return `
k6 mixed-session summary
────────────────────────
requests   ${data.metrics.http_reqs?.values.count ?? 0}
p50        ${Math.round(dur.med ?? 0)}ms
p95        ${Math.round(dur['p(95)'] ?? 0)}ms
p99        ${Math.round(dur['p(99)'] ?? 0)}ms
error rate ${((fail.rate ?? 0) * 100).toFixed(2)}%
`;
}
