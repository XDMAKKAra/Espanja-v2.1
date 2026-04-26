/**
 * Guards design-system/DESIGN.md §8.10 bottom nav (mobile only).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "css/components/bottom-nav.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");

describe("bottom-nav CSS contract", () => {
  it("hidden by default (desktop-first — only appears on mobile)", () => {
    expect(css).toMatch(/^\.bottom-nav\s*\{[\s\S]*?display:\s*none/m);
  });
  it("shows below 768px", () => {
    expect(css).toMatch(/@media[\s\S]*?max-width:\s*767px[\s\S]*?\.bottom-nav\s*\{[\s\S]*?display:\s*flex/);
  });
  it("height is 56px + safe-area-inset-bottom", () => {
    expect(css).toMatch(/height:\s*calc\(56px\s*\+\s*env\(safe-area-inset-bottom/);
    expect(css).toMatch(/padding-bottom:\s*env\(safe-area-inset-bottom/);
  });
  it("items have min-height 44px", () => {
    expect(css).toMatch(/\.bottom-nav__item\s*\{[\s\S]*?min-height:\s*44px/);
  });
  it("active state uses --accent", () => {
    expect(css).toMatch(/\.bottom-nav__item\.is-active[\s\S]*?var\(--accent\)/);
  });
  it("focus ring is visible", () => {
    expect(css).toMatch(/:focus-visible[\s\S]*?var\(--accent\)/);
  });
  it("no raw hex", () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
  it("respects prefers-reduced-motion", () => {
    expect(css).toMatch(/prefers-reduced-motion/);
  });
});

describe("bottom-nav — imported by style.css only", () => {
  it("style.css imports bottom-nav.css", () => {
    expect(styleCss).toMatch(/@import[^;]*bottom-nav\.css/);
  });
});
