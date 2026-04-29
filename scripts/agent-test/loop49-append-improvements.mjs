// L49 — append L49 ledger line + landing-rebuild final summary to IMPROVEMENTS.md.
import fs from "node:fs";

const block = `

- [2026-04-29 L49] [Infra/UX] Landing mobile + a11y/perf audit — final loop of the LANDING_PLAN.md rebuild. **Responsive sweep** at 4 viewports (375 / 768 / 1024 / 1920) via new \`scripts/agent-test/loop49-responsive.mjs\` — captures full-page screenshots, probes horizontal-overflow (compares \`documentElement.scrollWidth\` vs \`clientWidth\` and lists every descendant whose \`getBoundingClientRect().right\` exceeds the viewport with non-fixed position), runs axe-core 4.10.2 with \`wcag2a/aa/21a/21aa\`, scans heading hierarchy for \`H{n}→H{n+2+}\` jumps, scans for \`target="_blank"\` anchors missing \`rel=noopener\`, and inventories every \`<img>\`'s alt/width/height/loading. **Result on first run, zero fixes needed:** all four viewports clean — \`hScroll=false\`, \`overflow=0\`, \`axe=0\`, \`headingJumps=0\`, \`unsafeBlankTargets=0\`, single \`<img>\` (the hero dashboard PNG) has \`alt="" width=1440 height=900 loading="eager" decoding="async"\`. The 768-px mid-band concern (\`≤880\` is the smallest desktop-collapse breakpoint) turned out fine — at 768 the page already renders single-column mobile because the ≤880 query hits, leaving the 768-880 band as desktop-still + content clamped to 720 px inner via \`--content-max: 1200px\` minus 24 px section padding. Read all 4 screenshots: 1920 sits Linear-style at 1200 px clamped centre with breathing dark margins, 1024 hits desktop 60/40 hero + 3-col pillars + 50/50 grader + 2-col pricing, 768 collapses to single column, 375 stacks cleanly with no overflow. **Lighthouse** (\`npm run audit:lighthouse:landing\`, desktop preset, headless): **97 / 100 / 100** (perf / a11y / best-practices) — all above the ≥ 95 gate. First run was 97 / 100 / 96 with two 404s in \`errors-in-console\` (\`/favicon.ico\` + \`/icon-192.png\`); manifest.json references \`/icon-192.png\` + \`/icon-512.png\` which never existed on disk. Generated three icons (\`icon-192.png\`, \`icon-512.png\`, \`favicon-32.png\`) via new \`scripts/agent-test/loop49-gen-icons.mjs\` — Playwright renders a 22%-radius dark-slate square with a Geist-700 "Po" mark (the o in \`var(--accent) #2DD4BF\`, matching the wordmark used in the nav since L48-hotfix) plus a 30/25 radial accent glow, captures via headless screenshot at the requested DPR=1 size. Added \`<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">\` + \`<link rel="apple-touch-icon" href="/icon-192.png">\` to **both** \`index.html\` and \`app.html\` for parity. Re-audit: best-practices flipped 96 → 100; LCP 1.1 s, FCP 0.7 s, TBT 0 ms, CLS 0.001, SI 0.7 s. **Old \`landing.css\` deletion deferred** — grep surfaced 14 active references beyond \`index.html\`: 6 blog pages (\`blog/{index,espanja-yo-koe-2026-lyhyt-oppimaara,por-vs-para-selkea-ero,ojala-subjunktiivi-yleisimmat-virheet,ser-vs-estar-milloin-kumpaakin,preteriti-vs-imperfekti-opas}.html\`), 4 legal pages (\`pricing.html\`, \`privacy.html\`, \`refund.html\`, \`terms.html\`), \`sw.js\` cache list, and 7 unit tests in \`tests/\` that read the file's contents and run assertions against it. Verified all are live on dev (\`pricing.html\`, \`terms.html\`, \`blog/\` all 200). Brief assumed only \`index.html\` referenced the old sheet; reality is broader and deletion would visually break the blog + legal pages immediately. Punts cleanly to L52–L55 dark-theme migration where blog/legal will be ported to the new \`.landing\`-scoped tokens and their \`<link>\` swapped to \`css/landing.css\` + \`css/landing-tokens.css\`. SW cache \`puheo-v94 → puheo-v95\` because \`index.html\` and \`app.html\` (both in STATIC_ASSETS) were edited; added the 3 new icons to STATIC_ASSETS so they cache offline. Files: \`index.html\`, \`app.html\`, \`sw.js\`, \`icon-192.png\` (NEW), \`icon-512.png\` (NEW), \`favicon-32.png\` (NEW), \`scripts/agent-test/loop49-responsive.mjs\` (NEW), \`scripts/agent-test/loop49-gen-icons.mjs\` (NEW), \`scripts/agent-test/screenshots/loop49-{375,768,1024,1920}-full.png\` (NEW), \`exercises/baselines/lighthouse-landing.json\` (regen). Skill: ui-ux-pro-max P1 (axe 0/0/0/0), P3 (perf 97 with sub-second FCP/SI), puheo-screen-template (4 breakpoints — 375 / 768 / 1024 / 1920 — pixel-checked).

## Landing rebuild — final (L42 → L49)

**Eight loops, one cohesive landing.** \`index.html\` rewritten from a 1938-line legacy light-mint document into a 756-line dark Linear/Vercel-restraint shell scoped under \`<html class="landing">\`; ten \`<section>\` blocks (nav, hero, problem, pillars, steps, grader, pricing, FAQ, CTA, footer) all built off \`.landing-section\` + token-only CSS in \`css/landing.css\` (1525 lines) + \`css/landing-tokens.css\` (156 lines). Six register-CTAs across the page all point at \`/app.html#rekisteroidy\` (Y-tunnus / live-payment constraint — Pro upsell happens inside dashboard, never on landing).

**Final scores (2026-04-29):**

| Metric | Score | Threshold |
|---|---|---|
| Lighthouse Performance | **97** | ≥ 95 ✓ |
| Lighthouse Accessibility | **100** | ≥ 95 ✓ |
| Lighthouse Best Practices | **100** | ≥ 95 ✓ |
| axe-core violations (375 / 768 / 1024 / 1920) | **0 / 0 / 0 / 0** | 0 ✓ |
| FCP | 0.7 s | < 1.8 s ✓ |
| LCP | 1.1 s | < 2.5 s ✓ |
| TBT | 0 ms | < 200 ms ✓ |
| CLS | 0.001 | < 0.1 ✓ |
| Speed Index | 0.7 s | < 3.4 s ✓ |
| Heading-hierarchy jumps | 0 | 0 ✓ |
| Horizontal scroll @ 375 / 768 / 1024 / 1920 | none | none ✓ |
| \`target="_blank"\` without \`rel=noopener\` | 0 | 0 ✓ |

**Final-loop screenshots:** \`scripts/agent-test/screenshots/loop49-{375,768,1024,1920}-full.png\`. Per-section verification screenshots from L43–L48 remain alongside.

**21st.dev sourcing trail (L46 → L48):** pricing → \`community/components/efferd/pricing/default\`, FAQ → \`community/components/tailark/faq/faq-accordion-with-title\`, final CTA → \`community/components/dhiluxui/spotlight-cta/default\`, footer → \`community/components/shadcnblockscom/footer-7/default\`. All ported React+Tailwind → vanilla matching \`css/landing.css\` patterns. Structure from 21st.dev, copy from Puheo (Finnish, never generic SaaS).

**Deferred / open:**

- **Old \`landing.css\`** (1332-line light-mint sheet) still on disk and still actively linked by 6 blog pages + 4 legal pages + \`sw.js\` cache list + 7 unit tests. Deletion punts to **L52–L55 dark-theme migration** where blog + legal will be ported to the new \`.landing\`-scoped tokens and their \`<link>\` swapped to \`css/landing.css\` + \`css/landing-tokens.css\`.
- **Hero dashboard PNG** (\`references/puheo-screens/dashboard-1440.png\`, 2880×1800 source, displayed 1440×900) is the single largest network asset on the page. Already has \`loading="eager" decoding="async" width="1440" height="900"\` so LCP lands at 1.1 s on desktop preset; a WebP/AVIF variant would shave a few hundred ms but is not required for the ≥ 95 gate. \`cwebp\` / \`sharp\` are not currently available in the dev env. Punt to a future micro-loop or wire \`sharp\` as a devDependency if a perf-budget tightening is ever asked for.
- **TODO placeholders the user needs to fill** before launch:
  - **Real social-proof numbers** — the page currently leans on product claims (\`2 000+ harjoitustehtävää\`, \`YTL:n mukainen rubriikki\`) rather than user-count or testimonial logos. Add a real "Testimonials / Social proof" block **only when there are real students whose results can be cited** — invented social proof was explicitly excluded per spec.
  - **Real blog post imagery** for the 6 blog pages once L52–L55 ports them to the new theme.
  - **Y-tunnus + payments live** — until that lands, every "Aloita Pro 9,99 €" path on the landing routes to free signup at \`/app.html#rekisteroidy\`. The page is structurally ready to flip to live-payment CTAs (e.g. inline LemonSqueezy checkout) the moment the legal entity is on file.
  - **Sosiaaliset kanavat** — the footer was deliberately built without a social-icon row because Puheo doesn't have public socials yet. Add an \`<ul class="landing-footer__social">\` once an account is live.

**After L49:** PLAN.md continues with **L50–L51** (right-rail rebuild + dismissible Pro popup, only after 5 s on page, 7-day suppress on dismiss, free-only) and **L52–L55** (dark-theme polish across the entire app — shared tokens file \`css/tokens-shared.css\`, app theme toggle keeps Auto/Vaalea/Tumma working, blog + legal pages migrate off \`landing.css\`).
`;

fs.appendFileSync("IMPROVEMENTS.md", block);
console.log("appended", block.length, "chars");
