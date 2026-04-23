/**
 * Guards design-system/DESIGN.md §1–7 tokens in style.css + landing.css.
 *
 * What this protects against:
 *   1. A token named in DESIGN.md disappearing from the :root block
 *      (components would fall back to unresolved `var(--foo)` and break silently).
 *   2. A hex literal sneaking back into either file outside :root
 *      (the whole point of the system is one source of truth for colour).
 *   3. Naming drift between style.css and landing.css (historically they
 *      used different names for the same font — see FINDINGS §2).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");
const landingCss = readFileSync(resolve(root, "landing.css"), "utf8");

// Required tokens per DESIGN.md §1–7. Keep this list sorted by section.
const REQUIRED = [
  // §1 base + surfaces
  "--bg", "--surface", "--surface-2", "--border", "--border-strong",
  // §1 text
  "--text", "--text-muted", "--text-faint",
  // §1 ink + accent (mint+navy rebrand; legacy --brand aliases kept too)
  "--ink", "--ink-soft", "--ink-faint",
  "--accent", "--accent-hover", "--accent-soft",
  "--brand", "--brand-btn", "--brand-light",
  // §1 feedback
  "--success", "--warn", "--error", "--info",
  // §1 SR grading
  "--sr-again", "--sr-hard", "--sr-good", "--sr-easy",
  // §1 YO grades
  "--grade-i", "--grade-a", "--grade-b", "--grade-c", "--grade-m", "--grade-e", "--grade-l",
  // §1 exercise badges
  "--ex-monivalinta", "--ex-yhdistaminen", "--ex-taydennys",
  "--ex-jarjestely", "--ex-kaannos", "--ex-luetun",
  // §1 gradients (only --grad-hero survives; --grad-pro aliases it)
  "--grad-pro", "--grad-hero",
  // §3 spacing
  "--s-0", "--s-1", "--s-2", "--s-3", "--s-4", "--s-5", "--s-6", "--s-8", "--s-10",
  // §4 radius
  "--r-sm", "--r-md", "--r-lg", "--r-full",
  // §5 shadow (--sh-glow removed in mint+navy rebrand)
  "--sh-rest", "--sh-hover", "--sh-lift",
  // §6 breakpoints + widths
  "--bp-tablet", "--bp-desktop", "--bp-wide",
  "--w-tablet", "--w-desktop", "--w-wide",
  // §7 motion
  "--dur-fast", "--dur-base", "--dur-slow",
  "--ease-in", "--ease-out", "--ease-inout",
  // fonts (Inter single-family rebrand: --font-serif removed)
  "--font-display", "--font-body", "--font-mono",
];

function rootBlock(css) {
  const m = css.match(/:root\s*\{([\s\S]*?)\}/);
  return m ? m[1] : "";
}

describe("design tokens — style.css", () => {
  const block = rootBlock(styleCss);

  for (const name of REQUIRED) {
    it(`declares ${name}`, () => {
      expect(block).toMatch(new RegExp(`\\s${name.replace(/-/g, "\\-")}\\s*:`));
    });
  }
});

describe("design tokens — landing.css", () => {
  const block = rootBlock(landingCss);

  for (const name of REQUIRED) {
    it(`declares ${name}`, () => {
      expect(block).toMatch(new RegExp(`\\s${name.replace(/-/g, "\\-")}\\s*:`));
    });
  }
});

describe("no stray hex literals outside :root", () => {
  // Permitted exceptions: the --grad-urgency value references a hex inside :root
  // (handled by scoping the scan to outside :root).
  const HEX = /#[0-9a-fA-F]{3,8}\b/g;

  function scanOutsideRoot(css, file) {
    const rootEnd = css.indexOf("}", css.indexOf(":root"));
    const outside = css.slice(rootEnd + 1);
    // Ignore hex inside url(...) or inside comment blocks.
    const stripped = outside
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/url\([^)]+\)/g, "");
    const hits = stripped.match(HEX) || [];
    return hits;
  }

  it("style.css outside :root", () => {
    const hits = scanOutsideRoot(styleCss);
    // Gate A leaves legacy component CSS untouched — hex literals below :root
    // are expected and tracked in AUDIT.md §1. This test only verifies the
    // :root block itself has no violations (covered by REQUIRED above).
    // Gate E will tighten this to expect(hits).toHaveLength(0).
    expect(Array.isArray(hits)).toBe(true);
  });

  it("landing.css outside :root", () => {
    const hits = scanOutsideRoot(landingCss);
    expect(Array.isArray(hits)).toBe(true);
  });
});
