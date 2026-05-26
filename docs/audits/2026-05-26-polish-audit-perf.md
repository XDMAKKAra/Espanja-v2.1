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

- **38 pages good · 2 needs improvement · 0 poor (by LCP)**

## All pages ranked by LCP (worst first)

| Slug | Viewport | LCP (ms) | CLS | FCP (ms) | TTFB (ms) | Bytes | Status |
|---|---|---|---|---|---|---|---|
| p01-index | desktop | 3940 ⚠️ | 0 | 3824 | 2820 | 82 KB | ok |
| l02-profile | desktop | 3060 ⚠️ | 0 | 92 | 31 | 126 KB | ok |
| l01-home | desktop | 2216 | 0 | 84 | 30 | 127 KB | ok |
| l01-home | mobile | 1976 | 0.001 | 124 | 84 | 126 KB | ok |
| l06-reading | mobile | 1860 | 0.001 | 60 | 27 | 126 KB | ok |
| l06-reading | desktop | 1476 | 0 | 88 | 35 | 126 KB | ok |
| l02-profile | mobile | 1460 | 0.001 | 72 | 38 | 126 KB | ok |
| l09-exam | desktop | 1456 | 0 | 76 | 28 | 126 KB | ok |
| l05-grammar | mobile | 1372 | 0.001 | 80 | 26 | 126 KB | ok |
| l04-vocab | desktop | 1352 | 0 | 64 | 29 | 126 KB | ok |
| l08-results | mobile | 1220 | 0.001 | 64 | 31 | 126 KB | ok |
| l08-results | desktop | 1192 | 0 | 60 | 25 | 126 KB | ok |
| l07-writing | desktop | 1172 | 0 | 68 | 28 | 126 KB | ok |
| l07-writing | mobile | 1172 | 0.001 | 68 | 26 | 126 KB | ok |
| l09-exam | mobile | 1168 | 0.001 | 72 | 28 | 126 KB | ok |
| l04-vocab | mobile | 1148 | 0 | 68 | 26 | 126 KB | ok |
| l05-grammar | desktop | 1132 | 0 | 76 | 28 | 126 KB | ok |
| p11-app-unauth | desktop | 1056 | 0.001 | 1056 | 70 | 101 KB | ok |
| p03-landing-de | desktop | 732 | 0.001 | 732 | 71 | 58 KB | ok |
| p04-landing-fr | desktop | 596 | 0.001 | 596 | 79 | 58 KB | ok |
| p01-index | mobile | 496 | 0 | 396 | 74 | 82 KB | ok |
| p02-landing-es | desktop | 480 | 0.001 | 480 | 74 | 58 KB | ok |
| p09-refund | desktop | 440 | 0.002 | 440 | 74 | 82 KB | ok |
| p05-diagnose | desktop | 404 | 0.002 | 404 | 74 | 62 KB | ok |
| p10-blog | desktop | 388 | 0.003 | 388 | 70 | 82 KB | ok |
| p08-privacy | desktop | 368 | 0.002 | 368 | 76 | 82 KB | ok |
| p06-pricing | desktop | 360 | 0.007 | 360 | 71 | 58 KB | ok |
| p07-terms | desktop | 360 | 0.005 | 360 | 75 | 82 KB | ok |
| p11-app-unauth | mobile | 260 | 0 | 176 | 70 | 101 KB | ok |
| p04-landing-fr | mobile | 256 | 0.001 | 256 | 78 | 58 KB | ok |
| p02-landing-es | mobile | 232 | 0.043 | 232 | 74 | 58 KB | ok |
| p03-landing-de | mobile | 228 | 0.001 | 228 | 72 | 58 KB | ok |
| p06-pricing | mobile | 192 | 0.019 | 192 | 73 | 58 KB | ok |
| p08-privacy | mobile | 188 | 0.008 | 188 | 80 | 81 KB | ok |
| p10-blog | mobile | 188 | 0.003 | 188 | 68 | 81 KB | ok |
| p09-refund | mobile | 184 | 0.091 | 184 | 73 | 81 KB | ok |
| p05-diagnose | mobile | 176 | 0.006 | 176 | 75 | 56 KB | ok |
| p07-terms | mobile | 172 | 0 | 172 | 67 | 81 KB | ok |
| l03-settings | desktop | 108 | 0.085 | 68 | 26 | 157 KB | ok |
| l03-settings | mobile | 108 | 0.213 | 60 | 25 | 156 KB | ok |

## Poor LCP pages (>4s)

_(none — all pages ≤4s LCP)_

## Needs-improvement LCP pages (2.5–4s)

- **p01-index desktop** — LCP 3940ms
- **l02-profile desktop** — LCP 3060ms

## CLS issues (>0.1)

- **l03-settings mobile** — CLS 0.213

## TTFB issues (>800ms)

- **p01-index desktop** — TTFB 2820ms
