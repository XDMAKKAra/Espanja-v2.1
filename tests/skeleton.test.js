/**
 * Guards design-system/DESIGN.md §8.5 skeleton variants.
 *
 * Writing skeleton was explicitly missing in AUDIT §7; this test ensures
 * every exercise type now has a matching loader so the first paint of a
 * vocab/grammar/writing/reading/matching screen doesn't drop to a spinner.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "css/components/skeleton.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");
const landingCss = readFileSync(resolve(root, "landing.css"), "utf8");

describe("skeleton — base + variants", () => {
  it("declares .skeleton base", () => {
    expect(css).toMatch(/^\.skeleton\s*\{/ms);
  });
  for (const v of ["vocab", "grammar", "writing", "reading", "matching"]) {
    it(`defines rules for .skeleton--${v}`, () => {
      // Variants may be top-level rules OR descendant scopes; either counts.
      expect(css).toMatch(new RegExp(`\\.skeleton--${v}[\\s.{]`));
    });
  }
  it("writing variant has textarea placeholder block", () => {
    expect(css).toMatch(/\.skeleton--writing\s+\.skeleton__textarea\s*\{/);
  });
});

describe("skeleton — animation + reduced motion", () => {
  it("uses a 1.5s pulse keyframe", () => {
    expect(css).toMatch(/@keyframes\s+skeleton-pulse/);
    expect(css).toMatch(/animation:\s*skeleton-pulse\s+1\.5s/);
  });
  it("disables animation under prefers-reduced-motion", () => {
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*?animation:\s*none/);
  });
});

describe("skeleton — tokenised", () => {
  it("background uses --surface", () => {
    expect(css).toMatch(/\.skeleton\s*\{[\s\S]*?background:\s*var\(--surface\)/);
  });
  it("padding uses spacing token", () => {
    expect(css).toMatch(/padding:\s*var\(--s-5\)/);
  });
  it("no raw hex colours", () => {
    // rgba literals are permitted (opacity control on white).
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe("skeleton — imported by both CSS files", () => {
  it("style.css @imports skeleton.css", () => {
    expect(styleCss).toMatch(/@import[^;]*skeleton\.css/);
  });
  it("landing.css @imports skeleton.css", () => {
    expect(landingCss).toMatch(/@import[^;]*skeleton\.css/);
  });
});
