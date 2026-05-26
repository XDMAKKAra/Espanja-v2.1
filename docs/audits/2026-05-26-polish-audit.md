# L-V320 polish audit · 2026-05-26

**Base:** https://espanja-v2-1.vercel.app
**Surfaces scanned:** 11 (desktop + mobile = 22 pages)
**Screenshots:** `screenshots/polish-audit-2026-05-26/`
**Full data:** `docs/audits/2026-05-26-polish-audit.json`

## Headline numbers

| Bucket | Count |
|---|---|
| Critical a11y violations | 6 |
| Serious a11y violations | 117 |
| Moderate a11y violations | 16 |
| Minor a11y violations | 2 |
| Console errors (across all pages) | 4 |
| Network errors ≥400 (across all pages) | 0 |
| Touch targets <44 px (mobile) | 230 |
| Pages with at least one error | 4 / 22 |

## Top 15 a11y rules by node count

- **color-contrast** — 96 nodes
- **aria-prohibited-attr** — 16 nodes
- **region** — 12 nodes
- **aria-allowed-attr** — 6 nodes
- **scrollable-region-focusable** — 5 nodes
- **landmark-one-main** — 2 nodes
- **heading-order** — 2 nodes
- **aria-allowed-role** — 2 nodes

## Per-page summary

| Page | Device | Status | Axe | Console | Network | TT<44 | LCP | CLS |
|---|---|---|---|---|---|---|---|---|
| p01-index-hub | desktop | ok | 24 | 0 | 0 | 9 | 3760 | 0.006 |
| p01-index-hub | mobile | ok | 25 | 0 | 0 | 8 | 360 | 0 |
| p02-landing-es | desktop | ok | 3 | 0 | 0 | 5 | 468 | 0.001 |
| p02-landing-es | mobile | ok | 4 | 0 | 0 | 4 | 228 | 0.043 |
| p03-landing-de | desktop | ok | 9 | 0 | 0 | 5 | 584 | 0.001 |
| p03-landing-de | mobile | ok | 10 | 0 | 0 | 4 | 256 | 0.001 |
| p04-landing-fr | desktop | ok | 3 | 0 | 0 | 5 | 596 | 0.001 |
| p04-landing-fr | mobile | ok | 4 | 0 | 0 | 4 | 228 | 0.001 |
| p05-diagnose | desktop | ok | 11 | 1 | 0 | 3 | 384 | 0.002 |
| p05-diagnose | mobile | ok | 11 | 1 | 0 | 3 | 180 | 0.006 |
| p06-pricing | desktop | ok | 1 | 1 | 0 | 6 | 412 | 0.007 |
| p06-pricing | mobile | ok | 2 | 1 | 0 | 6 | 212 | 0.019 |
| p07-terms | desktop | ok | 4 | 0 | 0 | 19 | 364 | 0.005 |
| p07-terms | mobile | ok | 4 | 0 | 0 | 18 | 184 | 0 |
| p08-privacy | desktop | ok | 4 | 0 | 0 | 18 | 408 | 0.002 |
| p08-privacy | mobile | ok | 4 | 0 | 0 | 17 | 200 | 0.008 |
| p09-refund | desktop | ok | 4 | 0 | 0 | 17 | 572 | 0.002 |
| p09-refund | mobile | ok | 4 | 0 | 0 | 16 | 180 | 0.074 |
| p10-blog-index | desktop | ok | 4 | 0 | 0 | 26 | 440 | 0.004 |
| p10-blog-index | mobile | ok | 4 | 0 | 0 | 21 | 180 | 0.003 |
| p11-app-shell-unauth | desktop | ok | 1 | 0 | 0 | 8 | 976 | 0.001 |
| p11-app-shell-unauth | mobile | ok | 1 | 0 | 0 | 8 | 272 | — |

## Pages with console errors (top 5)

### p05-diagnose (desktop)

- `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-/rG85k8Gu+0TbjdlqftNIV4fncCQRU`

### p05-diagnose (mobile)

- `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-/rG85k8Gu+0TbjdlqftNIV4fncCQRU`

### p06-pricing (desktop)

- `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-A+CAYsOOcXz6nhYohqUug4Eck+rNKb`

### p06-pricing (mobile)

- `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-A+CAYsOOcXz6nhYohqUug4Eck+rNKb`

## Pages with network errors (top 5)

_(none)_
