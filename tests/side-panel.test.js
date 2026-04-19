/**
 * Guards the side-panel primitive.
 *
 * Pass 1.5 dropped the ff_side_panel flag — .split is live everywhere. The
 * feature-flag runtime is still exported (other flags may use it), but the
 * side-panel no longer depends on it.
 *
 * Contract:
 *   - .split is display:block by default (mobile / tablet stacks).
 *   - @media (min-width: 1200px) switches it to 2-col grid with sticky aside.
 *   - Aside is sticky and clears the 64 px top-nav.
 *   - Empty aside fades out (no lonely panel before content arrives).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const css = readFileSync(resolve(root, "css/components/side-panel.css"), "utf8");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");

describe("side-panel CSS contract", () => {
  it("default is display:block (stacks on phone / tablet)", () => {
    expect(css).toMatch(/\.split\s*\{[\s\S]*?display:\s*block/);
  });
  it(">=1200px switches to 2-column grid", () => {
    expect(css).toMatch(/@media\s*\(\s*min-width:\s*1200px\s*\)[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+380px/);
  });
  it("aside is sticky and clears top-nav", () => {
    expect(css).toMatch(/\.split__aside[\s\S]*?position:\s*sticky/);
    expect(css).toMatch(/top:\s*calc\(64px/);
  });
  it("empty aside fades — no lonely panel before content arrives", () => {
    expect(css).toMatch(/\.split__aside:empty[\s\S]*?opacity:\s*0/);
  });
  it("imported by style.css", () => {
    expect(styleCss).toMatch(/@import[^;]*side-panel\.css/);
  });
});
