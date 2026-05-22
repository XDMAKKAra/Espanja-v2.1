// L-ADAPTIVE-FIX (2026-05-22)
// Regression: dashboard must not call /api/adaptive/status?mode=writing.
// The adaptive system supports vocab/grammar/reading only — writing has its own
// renderWritingProgression() flow. A mode=writing request returns 400 by design
// (routes/adaptive.js VALID_MODES), polluting server logs on every login.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repo = join(__dirname, "..");

describe("adaptive status — writing mode", () => {
  it("routes/adaptive.js VALID_MODES excludes writing (vocab/grammar/reading only)", () => {
    const src = readFileSync(join(repo, "routes/adaptive.js"), "utf8");
    const match = src.match(/VALID_MODES\s*=\s*new Set\(\[([^\]]+)\]\)/);
    expect(match, "VALID_MODES not found").toBeTruthy();
    const modes = match[1];
    expect(modes).not.toMatch(/["']writing["']/);
  });

  it("dashboard does not invoke renderAdaptiveCard with mode 'writing'", () => {
    const src = readFileSync(join(repo, "js/screens/dashboard.js"), "utf8");
    expect(src).not.toMatch(/renderAdaptiveCard\(\s*["']writing["']\s*\)/);
  });

  it("no frontend module fetches /api/adaptive/status?mode=writing", () => {
    const files = [
      "js/screens/dashboard.js",
      "js/screens/adaptive.js",
      "js/screens/home.js",
      "app.js",
    ];
    for (const rel of files) {
      let src;
      try { src = readFileSync(join(repo, rel), "utf8"); } catch { continue; }
      expect(
        src,
        `${rel} must not hit adaptive/status with mode=writing`
      ).not.toMatch(/adaptive\/status\?mode=writing/);
    }
  });
});
