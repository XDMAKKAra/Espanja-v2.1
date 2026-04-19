/**
 * Guards the Gate C.5 side-panel pilot.
 *
 * Contract:
 *   - .split is display:block by default.
 *   - body[data-ff-side-panel="1"] + >=1200px switches to grid with sticky aside.
 *   - Flag off: .split__aside reads as a margin-topped inline block.
 *   - js/features/flags.js sets data-ff-side-panel on <body> when the key
 *     ff_side_panel is "1" in localStorage.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "css/components/side-panel.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");

describe("side-panel CSS contract", () => {
  it("flag-off default is block (no grid)", () => {
    expect(css).toMatch(/body\[data-ff-side-panel="1"\]\s+\.split\s*\{[\s\S]*?display:\s*block/);
  });
  it("flag-on + >=1200px switches to 2-column grid", () => {
    expect(css).toMatch(/@media\s*\(\s*min-width:\s*1200px\s*\)[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+380px/);
  });
  it("aside is sticky and clears top-nav", () => {
    expect(css).toMatch(/\.split__aside[\s\S]*?position:\s*sticky/);
    expect(css).toMatch(/top:\s*calc\(64px/);
  });
  it("empty aside fades — no lonely panel before user answers", () => {
    expect(css).toMatch(/\.split__aside:empty[\s\S]*?opacity:\s*0/);
  });
  it("imported by style.css", () => {
    expect(styleCss).toMatch(/@import[^;]*side-panel\.css/);
  });
});

describe("feature-flags runtime", () => {
  let applyFeatureFlags, isFlagOn;
  beforeEach(async () => {
    document.body.innerHTML = "";
    document.body.removeAttribute("data-ff-side-panel");
    localStorage.clear();
    vi.resetModules();
    ({ applyFeatureFlags, isFlagOn } = await import("../js/features/flags.js"));
  });

  it("applyFeatureFlags does nothing when no keys set", () => {
    applyFeatureFlags();
    expect(document.body.hasAttribute("data-ff-side-panel")).toBe(false);
  });

  it("applyFeatureFlags sets data-ff-side-panel when ff_side_panel=1", () => {
    localStorage.setItem("ff_side_panel", "1");
    applyFeatureFlags();
    expect(document.body.getAttribute("data-ff-side-panel")).toBe("1");
  });

  it("isFlagOn reflects localStorage", () => {
    expect(isFlagOn("side_panel")).toBe(false);
    localStorage.setItem("ff_side_panel", "1");
    expect(isFlagOn("side_panel")).toBe(true);
  });
});
