# L-V323 performance baseline · 2026-05-26

**Base:** https://espanja-v2-1.vercel.app
**Pages:** 11 public + 9 logged-in × 2 viewports = 40 scans
**Account:** testpro123@gmail.com
**Full data:** `docs/audits/2026-05-26-polish-audit-perf.json`

## Web Vitals thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| TTFB | ≤ 0.8s | ≤ 1.8s | > 1.8s |

## Headline

- **22 pages good · 0 needs improvement · 0 poor (by LCP)**

## All pages ranked by LCP (worst first)

| Slug | Viewport | LCP (ms) | CLS | FCP (ms) | TTFB (ms) | Bytes | Status |
|---|---|---|---|---|---|---|---|
| p11-app-unauth | desktop | 404 | 0.001 | 404 | 70 | 101 KB | ok |
| p04-landing-fr | mobile | 396 | 0.001 | 396 | 70 | 58 KB | ok |
| p01-index | desktop | 380 | 0 | 264 | 77 | 82 KB | ok |
| p02-landing-es | desktop | 336 | 0.001 | 336 | 66 | 58 KB | ok |
| p01-index | mobile | 324 | 0 | 240 | 64 | 82 KB | ok |
| p04-landing-fr | desktop | 288 | 0.001 | 288 | 102 | 58 KB | ok |
| p10-blog | mobile | 280 | 0.003 | 280 | 72 | 81 KB | ok |
| p03-landing-de | desktop | 256 | 0.001 | 256 | 71 | 58 KB | ok |
| p10-blog | desktop | 256 | 0.004 | 256 | 77 | 82 KB | ok |
| p11-app-unauth | mobile | 256 | 0 | 172 | 68 | 101 KB | ok |
| p03-landing-de | mobile | 236 | 0.001 | 236 | 92 | 58 KB | ok |
| p02-landing-es | mobile | 224 | 0.043 | 224 | 71 | 58 KB | ok |
| p09-refund | desktop | 220 | 0.002 | 220 | 101 | 82 KB | ok |
| p08-privacy | desktop | 196 | 0.002 | 196 | 75 | 82 KB | ok |
| p07-terms | desktop | 192 | 0.005 | 192 | 77 | 82 KB | ok |
| p05-diagnose | desktop | 188 | 0.002 | 188 | 81 | 62 KB | ok |
| p05-diagnose | mobile | 188 | 0.006 | 188 | 78 | 56 KB | ok |
| p06-pricing | mobile | 188 | 0.019 | 188 | 70 | 58 KB | ok |
| p07-terms | mobile | 188 | 0 | 188 | 72 | 81 KB | ok |
| p09-refund | mobile | 188 | 0.085 | 188 | 79 | 81 KB | ok |
| p06-pricing | desktop | 184 | 0.007 | 184 | 67 | 58 KB | ok |
| p08-privacy | mobile | 176 | 0.008 | 176 | 70 | 81 KB | ok |

## Poor LCP pages (>4s)

_(none — all pages ≤4s LCP)_

## Needs-improvement LCP pages (2.5–4s)

_(none — all pages ≤2.5s LCP)_

## CLS issues (>0.1)

_(none)_

## TTFB issues (>800ms)

_(none)_
