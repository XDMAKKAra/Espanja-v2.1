# Exam Week Plan — 28.9.2026

Spanish YO-koe (lyhyt oppimäärä) is sat on **28.9.2026**. This plan covers the two weeks around it.

## Key dates

| Date | Milestone |
|---|---|
| **2026-09-14 Mon** | Feature freeze for Pass 6 work. Only bug fixes after this. |
| **2026-09-21 Mon** | Hard freeze — no deploys except critical (P0) bugs. |
| **2026-09-22 Tue** | Flip `EXAM_WEEK=true` env in prod. Bank-only content; OpenAI paths disabled. Banner shown. |
| **2026-09-28 Mon** | **Exam day.** On-call active from 07:00 EET. |
| **2026-09-29 Tue** | Post-mortem log opens. Keep `EXAM_WEEK` on until Wed. |
| **2026-09-30 Wed** | Flip `EXAM_WEEK=false`. Resume normal deploys. |

## Hard freeze rules (21.9 → 30.9)

- No merges to `main` without on-call approval.
- Critical = app unreachable, grading broken, login broken, paywall blocks a paid user.
- Non-critical (copy fixes, analytics, new content) waits until 1.10.
- If a deploy is required: (a) run full Gate A + Gate B suites, (b) manual smoke of 5 golden flows, (c) tag release, (d) keep prior build one click away for rollback.

## Exam-day dashboard

A single page at `/status.html` (built in P6-C17) plus:

- **Live concurrency:** count of sessions started in last 10 min (Supabase query).
- **Error rate:** 5xx responses / total, 5-min window.
- **Grading latency:** writing grade p50/p95 (from `cost/` logs).
- **Queue depth:** pending writes per user (IndexedDB telemetry pinged back).
- **OpenAI status:** cached `/models` ping + last 429 timestamp.

Pin to on-call's second monitor from 07:00.

## On-call rotation

Solo project. On-call = monamalou@gmail.com. Backup channel: email + phone push (web-push to own devices). Checklist at 07:00:

1. Hit `/status.html` — all green.
2. Run smoke E2E against prod (`npm run test:e2e -- --grep "@smoke" PROD=1`).
3. Confirm `EXAM_WEEK=true` in Vercel env.
4. Pin last-known-good deploy in Vercel dashboard.
5. Stay reachable 08:00–15:00 EET (exam window + buffer).

## Rollback plan

- **Trigger:** (a) error rate > 5% for 5 min, (b) grading endpoint p95 > 10s for 5 min, (c) login broken, (d) reports from >2 users of stuck screens.
- **Action:** Vercel → Deployments → previous stable → Promote to Production. Takes ~30s.
- **If rollback insufficient:** flip `EXAM_WEEK=true` (if not already), flip `OPENAI_DISABLED=true`. Last resort: put a maintenance page at `/` + deep-link students to an offline `exercises/` static bundle.
- Post-incident: open issue, write post-mortem within 48h, file against Pass 6 test gap if missing coverage caused it.

## What ships "exam-ready"

By 2026-09-14 the following must be true, verified in CI:

- [ ] Gate A green: unit coverage thresholds met on `lib/**` and `middleware/**`.
- [ ] Gate B green: E2E for all 5 golden flows + a11y clean on every SPA screen.
- [ ] Gate C green: load baseline recorded, `/status.html` live, exam-day flag tested.
- [ ] `RECOVERY.md` audit table all yes/yes/yes/yes.
- [ ] Rollback rehearsed at least once against prod (off-peak).
- [ ] Seed bank validated to cover all exercise types × CEFR levels with ≥ 50 items each.

## Non-goals during exam week

- New features.
- New email drips.
- Dependency upgrades.
- Schema migrations (last migration window: 2026-09-14).
- A/B experiments.
