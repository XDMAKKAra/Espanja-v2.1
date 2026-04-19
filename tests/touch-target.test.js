/**
 * Touch-target lint — enforces DESIGN.md §9 (44×44 minimum on interactive
 * elements).
 *
 * Parses style.css + landing.css + every component CSS file. For each
 * rule whose selector looks interactive (button, a, .btn*, .nav-*,
 * .toast__close, .modal__close, .bottom-nav__item, etc.) that ALSO
 * declares an explicit min-height, assert the min-height is ≥44px.
 *
 * Selectors that don't declare min-height are skipped (component authors
 * may rely on padding + line-height or on hit-area expanders like
 * .btn--sm::before). Pass 6 can tighten this to full height computation.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const CSS_FILES = [
  resolve(root, "style.css"),
  resolve(root, "landing.css"),
  ...readdirSync(resolve(root, "css/components"))
    .filter((f) => f.endsWith(".css"))
    .map((f) => join(root, "css/components", f)),
];

const INTERACTIVE_SELECTORS = [
  /\bbutton\b/,
  /^[^,{]*\ba\b(?::\w|\[|\.| |$)/,  // bare `a` selector
  /\.btn(?:--|\b|:)/,
  /\.nav-(?:cta|link|logo|right|login)/,
  /\.top-nav__/,
  /\.bottom-nav__/,
  /\.toast__close/,
  /\.modal__close/,
  /\.mobile-nav-btn/,
  /\.mode-btn/,
  /\.auth-tab/,
  /\.ob-(?:option|checkbox|button|next)/,
  /\.price-cta/,
  /\.btn-\w+/,
];

function isInteractiveSelector(selector) {
  return INTERACTIVE_SELECTORS.some((re) => re.test(selector));
}

/**
 * Documented exemptions. Each entry explains why the selector is allowed
 * to declare min-height < 44px. Reviewed case by case — do not grow this
 * list casually.
 */
const EXEMPT = new Set([
  // .btn--sm ships a ::before that expands the hit area to ≥44px (see
  // DESIGN.md §9 note + button.css). Visual 32px is intentional.
  ".btn--sm",
  // .toast__close is a secondary dismiss affordance inside a toast; the
  // whole toast is also dismissable via auto-timeout or by tapping the
  // action button. 32px is acceptable per DESIGN.md §8.7 review.
  ".toast__close",
]);

function parseRules(css) {
  // Very small CSS rule walker — enough for a lint. Ignores @media blocks
  // by unwrapping one level (sufficient for our files).
  const rules = [];
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}@]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(noComments)) != null) {
    const selector = m[1].trim().replace(/\s+/g, " ");
    const body = m[2].trim();
    if (!selector || selector.includes("@")) continue;
    rules.push({ selector, body });
  }
  return rules;
}

function minHeightPx(body) {
  const m = body.match(/min-height\s*:\s*([^;]+)/);
  if (!m) return null;
  const value = m[1].trim();
  // Accept 44px exactly, any px value, or calc(44px + env(...))
  const px = value.match(/(\d+)\s*px/);
  if (!px) return -1;  // non-px unit — can't evaluate
  return parseInt(px[1], 10);
}

describe("touch-target lint — 44px minimum on interactive selectors", () => {
  const offenders = [];

  for (const file of CSS_FILES) {
    const css = readFileSync(file, "utf8");
    const rules = parseRules(css);
    for (const { selector, body } of rules) {
      if (!isInteractiveSelector(selector)) continue;
      if (EXEMPT.has(selector)) continue;
      const mh = minHeightPx(body);
      if (mh == null) continue;         // no explicit min-height → skip
      if (mh < 0) continue;              // non-px unit → skip
      if (mh < 44) {
        offenders.push({ file: file.replace(root + "\\", "").replace(root + "/", ""), selector, minHeight: mh });
      }
    }
  }

  it("no interactive selector declares min-height below 44px", () => {
    expect(offenders, `Found touch-target violations:\n${JSON.stringify(offenders, null, 2)}`).toHaveLength(0);
  });
});
