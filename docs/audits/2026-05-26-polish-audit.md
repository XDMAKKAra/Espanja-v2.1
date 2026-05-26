# L-V320 polish audit · 2026-05-26

**Base:** https://espanja-v2-1.vercel.app
**Surfaces scanned:** 11 (desktop + mobile = 22 pages)
**Screenshots:** `screenshots/polish-audit-2026-05-26/`
**Full data:** `docs/audits/2026-05-26-polish-audit.json`

## Headline numbers

| Bucket | Count |
|---|---|
| Critical a11y violations | 0 |
| Serious a11y violations | 0 |
| Moderate a11y violations | 0 |
| Minor a11y violations | 0 |
| Console errors (across all pages) | 34 |
| Network errors ≥400 (across all pages) | 0 |
| Touch targets <44 px (mobile) | 192 |
| Pages with at least one error | 22 / 22 |

## Top 15 a11y rules by node count



## Per-page summary

| Page | Device | Status | Axe | Console | Network | TT<44 | LCP | CLS |
|---|---|---|---|---|---|---|---|---|
| p01-index-hub | desktop | ok | 0 | 1 | 0 | 10 | 4096 | 0.004 |
| p01-index-hub | mobile | ok | 0 | 2 | 0 | 10 | 136 | — |
| p02-landing-es | desktop | ok | 0 | 1 | 0 | 8 | 452 | 0.001 |
| p02-landing-es | mobile | ok | 0 | 2 | 0 | 10 | 116 | — |
| p03-landing-de | desktop | ok | 0 | 2 | 0 | 8 | 640 | 0.001 |
| p03-landing-de | mobile | ok | 0 | 3 | 0 | 10 | 148 | — |
| p04-landing-fr | desktop | ok | 0 | 2 | 0 | 8 | 668 | 0.001 |
| p04-landing-fr | mobile | ok | 0 | 3 | 0 | 10 | 148 | — |
| p05-diagnose | desktop | ok | 0 | 2 | 0 | 3 | 424 | 0.002 |
| p05-diagnose | mobile | ok | 0 | 2 | 0 | 3 | 180 | 0.006 |
| p06-pricing | desktop | ok | 0 | 2 | 0 | 10 | 464 | 0.006 |
| p06-pricing | mobile | ok | 0 | 2 | 0 | 6 | 200 | 0.019 |
| p07-terms | desktop | ok | 0 | 1 | 0 | 10 | 676 | 0.004 |
| p07-terms | mobile | ok | 0 | 1 | 0 | 10 | 336 | 0 |
| p08-privacy | desktop | ok | 0 | 1 | 0 | 10 | 384 | 0.002 |
| p08-privacy | mobile | ok | 0 | 1 | 0 | 10 | 192 | 0.008 |
| p09-refund | desktop | ok | 0 | 1 | 0 | 10 | 392 | 0.001 |
| p09-refund | mobile | ok | 0 | 1 | 0 | 10 | 232 | 0.085 |
| p10-blog-index | desktop | ok | 0 | 1 | 0 | 10 | 408 | 0.003 |
| p10-blog-index | mobile | ok | 0 | 1 | 0 | 10 | 244 | 0.002 |
| p11-app-shell-unauth | desktop | ok | 0 | 1 | 0 | 8 | 1508 | 0.001 |
| p11-app-shell-unauth | mobile | ok | 0 | 1 | 0 | 8 | — | — |

## Pages with console errors (top 5)

### p01-index-hub (desktop)

- `Loading the script 'https://unpkg.com/axe-core@4.8.2/axe.min.js' violates the following Content Security Policy directive: "script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com". Note that 'script-src-elem' was not expl`

### p01-index-hub (mobile)

- `UNCAUGHT: gate`
- `Loading the script 'https://unpkg.com/axe-core@4.8.2/axe.min.js' violates the following Content Security Policy directive: "script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com". Note that 'script-src-elem' was not expl`

### p02-landing-es (desktop)

- `Loading the script 'https://unpkg.com/axe-core@4.8.2/axe.min.js' violates the following Content Security Policy directive: "script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com". Note that 'script-src-elem' was not expl`

### p02-landing-es (mobile)

- `UNCAUGHT: gate`
- `Loading the script 'https://unpkg.com/axe-core@4.8.2/axe.min.js' violates the following Content Security Policy directive: "script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com". Note that 'script-src-elem' was not expl`

### p03-landing-de (desktop)

- `Executing inline script violates the following Content Security Policy directive 'script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com'. Either the 'unsafe-inline' keyword, a hash ('sha256-TI/TQ2R06mGyGjN58KyEe5y35oexVB`
- `Loading the script 'https://unpkg.com/axe-core@4.8.2/axe.min.js' violates the following Content Security Policy directive: "script-src 'self' https://cdn.jsdelivr.net https://browser.sentry-cdn.com". Note that 'script-src-elem' was not expl`

## Pages with network errors (top 5)

_(none)_
