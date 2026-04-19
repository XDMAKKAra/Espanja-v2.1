/**
 * Guards design-system/DESIGN.md §8.2 (input + textarea) and §8.3 (card).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const inputCss = readFileSync(resolve(root, "css/components/input.css"), "utf8");
const cardCss = readFileSync(resolve(root, "css/components/card.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");
const landingCss = readFileSync(resolve(root, "landing.css"), "utf8");

describe("input / textarea component", () => {
  it("declares .input, .textarea, .select", () => {
    expect(inputCss).toMatch(/\.input,[\s\S]*?\.textarea,[\s\S]*?\.select/);
  });
  it("uses --surface-2 background + --border", () => {
    expect(inputCss).toMatch(/background:\s*var\(--surface-2\)/);
    expect(inputCss).toMatch(/border:\s*1px solid var\(--border\)/);
  });
  it("focus border becomes --brand-light", () => {
    expect(inputCss).toMatch(/:focus[\s\S]*?border-color:\s*var\(--brand-light\)/);
  });
  it("focus adds 3px ring with brand-light alpha", () => {
    expect(inputCss).toMatch(/box-shadow:\s*0 0 0 3px rgba\(245,\s*158,\s*11,\s*0\.15\)/);
  });
  it("textarea has min-height 120px + resize vertical", () => {
    expect(inputCss).toMatch(/\.textarea\s*\{[\s\S]*?min-height:\s*120px/);
    expect(inputCss).toMatch(/\.textarea\s*\{[\s\S]*?resize:\s*vertical/);
  });
  it("error state uses --error", () => {
    expect(inputCss).toMatch(/\.field--error[\s\S]*?var\(--error\)/);
    expect(inputCss).toMatch(/\[aria-invalid="true"\][\s\S]*?var\(--error\)/);
  });
});

describe("card component", () => {
  it("base card uses --surface + --border + --r-lg", () => {
    expect(cardCss).toMatch(/\.card\s*\{[\s\S]*?background:\s*var\(--surface\)/);
    expect(cardCss).toMatch(/\.card\s*\{[\s\S]*?border:\s*1px solid var\(--border\)/);
    expect(cardCss).toMatch(/\.card\s*\{[\s\S]*?border-radius:\s*var\(--r-lg\)/);
  });
  it("interactive card hover raises + shifts background", () => {
    expect(cardCss).toMatch(/\.card--interactive:hover[\s\S]*?var\(--surface-2\)/);
    expect(cardCss).toMatch(/\.card--interactive:hover[\s\S]*?translateY\(-2px\)/);
  });
  it("focus-visible outline uses --brand-light", () => {
    expect(cardCss).toMatch(/:focus-visible[\s\S]*?var\(--brand-light\)/);
  });
  it("padding comes from spacing tokens, not raw px", () => {
    expect(cardCss).toMatch(/padding:\s*var\(--s-5\)/);
    expect(cardCss).not.toMatch(/padding:\s*\d+px\s*;/);
  });
});

describe("both components honour reduced motion", () => {
  it("input.css uses prefers-reduced-motion", () => {
    expect(inputCss).toMatch(/prefers-reduced-motion/);
  });
  it("card.css uses prefers-reduced-motion", () => {
    expect(cardCss).toMatch(/prefers-reduced-motion/);
  });
});

describe("style.css + landing.css import both", () => {
  for (const [name, css] of [["style.css", styleCss], ["landing.css", landingCss]]) {
    it(`${name} imports input.css`, () => {
      expect(css).toMatch(/@import[^;]*input\.css/);
    });
    it(`${name} imports card.css`, () => {
      expect(css).toMatch(/@import[^;]*card\.css/);
    });
  }
});
