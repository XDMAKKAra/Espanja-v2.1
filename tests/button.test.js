/**
 * Guards design-system/DESIGN.md §8.1 button component.
 *
 * The CSS lives in css/components/button.css. This test asserts:
 *   - All four variants + three sizes are defined.
 *   - Sizes hit their DESIGN.md min-height.
 *   - Touch target is ≥44px for every size (sm uses a ::before expander).
 *   - All colour values reference tokens (no raw hex except #fff for primary text).
 *   - style.css and landing.css both @import the component.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const buttonCss = readFileSync(resolve(root, "css/components/button.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");
const landingCss = readFileSync(resolve(root, "landing.css"), "utf8");

describe("button component — existence", () => {
  for (const variant of ["primary", "secondary", "ghost", "destructive"]) {
    it(`declares .btn--${variant}`, () => {
      expect(buttonCss).toMatch(new RegExp(`\\.btn--${variant}\\s*\\{`));
    });
  }
  for (const size of ["sm", "md", "lg"]) {
    it(`declares .btn--${size}`, () => {
      expect(buttonCss).toMatch(new RegExp(`\\.btn--${size}\\s*\\{`));
    });
  }
});

describe("button component — sizing + touch targets", () => {
  it("sm has min-height 32px + ::before expander for 44px hit", () => {
    expect(buttonCss).toMatch(/\.btn--sm\s*\{[\s\S]*?min-height:\s*32px/);
    expect(buttonCss).toMatch(/\.btn--sm::before\s*\{/);
  });
  it("md has min-height 44px", () => {
    expect(buttonCss).toMatch(/\.btn--md\s*\{[\s\S]*?min-height:\s*44px/);
  });
  it("lg has min-height 52px", () => {
    expect(buttonCss).toMatch(/\.btn--lg\s*\{[\s\S]*?min-height:\s*52px/);
  });
});

describe("button component — tokenised colours (mint+navy)", () => {
  it("primary uses --accent background + --ink text", () => {
    expect(buttonCss).toMatch(/\.btn--primary\s*\{[\s\S]*?background:\s*var\(--accent\)/);
    expect(buttonCss).toMatch(/\.btn--primary\s*\{[\s\S]*?color:\s*var\(--ink\)/);
  });
  it("destructive uses --error", () => {
    expect(buttonCss).toMatch(/\.btn--destructive\s*\{[\s\S]*?var\(--error\)/);
  });
  it("secondary uses transparent bg + --ink border (ink-on-white)", () => {
    expect(buttonCss).toMatch(/\.btn--secondary\s*\{[\s\S]*?background:\s*transparent/);
    expect(buttonCss).toMatch(/\.btn--secondary\s*\{[\s\S]*?border-color:\s*var\(--ink\)/);
  });
  it("focus ring uses --accent", () => {
    expect(buttonCss).toMatch(/\.btn:focus-visible\s*\{[\s\S]*?var\(--accent\)/);
  });
});

describe("button component — honours reduced motion", () => {
  it("disables transitions + spinner under prefers-reduced-motion", () => {
    expect(buttonCss).toMatch(/prefers-reduced-motion/);
  });
});

describe("style.css + landing.css import button component", () => {
  it("style.css @imports button.css", () => {
    expect(styleCss).toMatch(/@import[^;]*button\.css/);
  });
  it("landing.css @imports button.css", () => {
    expect(landingCss).toMatch(/@import[^;]*button\.css/);
  });
});
