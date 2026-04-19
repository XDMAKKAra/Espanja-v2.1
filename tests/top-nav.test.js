/**
 * Guards design-system/DESIGN.md §8.9 top-nav component.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "css/components/top-nav.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");
const landingCss = readFileSync(resolve(root, "landing.css"), "utf8");

describe("top-nav CSS contract", () => {
  it("fixed 64px bar with safe-area top padding", () => {
    expect(css).toMatch(/\.top-nav\s*\{[\s\S]*?position:\s*fixed/);
    expect(css).toMatch(/\.top-nav\s*\{[\s\S]*?height:\s*64px/);
    expect(css).toMatch(/env\(safe-area-inset-top/);
  });
  it("honours left/right safe-area insets for landscape notches", () => {
    expect(css).toMatch(/env\(safe-area-inset-left/);
    expect(css).toMatch(/env\(safe-area-inset-right/);
  });
  it("links + login have min-height 44px (touch target)", () => {
    expect(css).toMatch(/\.top-nav__links a\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.top-nav__login\s*\{[\s\S]*?min-height:\s*44px/);
  });
  it("uses tokens for colours (no raw hex)", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  it("collapses .top-nav__links below 768px; login + CTA stay visible", () => {
    expect(css).toMatch(/@media[\s\S]*?max-width:\s*767px[\s\S]*?\.top-nav__links\s*\{[\s\S]*?display:\s*none/);
  });
  it("scrolled state adds hairline border", () => {
    expect(css).toMatch(/\.top-nav\.is-scrolled[\s\S]*?border-bottom-color:\s*var\(--border\)/);
  });
  it("focus ring uses --brand-light", () => {
    expect(css).toMatch(/:focus-visible[\s\S]*?var\(--brand-light\)/);
  });
  it("respects prefers-reduced-motion", () => {
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});

describe("top-nav — imported by both CSS files", () => {
  it("style.css imports top-nav.css", () => {
    expect(styleCss).toMatch(/@import[^;]*top-nav\.css/);
  });
  it("landing.css imports top-nav.css", () => {
    expect(landingCss).toMatch(/@import[^;]*top-nav\.css/);
  });
});
