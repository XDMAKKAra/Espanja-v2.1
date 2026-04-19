/**
 * Guards the Pass 0.5 Bug 3 acceptance criterion (copied here from
 * plans/01-design-system-step1.md):
 *
 *   "Desktop layout (≥1024px) must use ≥960px of content width on
 *    dashboard and every exercise screen."
 *
 * The only way to satisfy that is to reach for --w-desktop (1080px) —
 * or a larger width — on the primary container of each screen. This
 * test asserts that the screens re-skinned by each Gate D commit use
 * the token, not a hard-coded narrow value.
 *
 * Commits add their screen to this list as they ship. A missing screen
 * means that commit hasn't landed yet — not a failure.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const styleCss = readFileSync(resolve(root, "style.css"), "utf8");

function cap(selector) {
  // Strip @media blocks first so we only see top-level rules.
  // Simple depth-1 stripper (all our @media blocks are depth 1).
  let depth = 0;
  let inMedia = false;
  let clean = "";
  const s = styleCss;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inMedia && ch === "@" && s.startsWith("@media", i)) {
      // scan to opening brace
      const open = s.indexOf("{", i);
      if (open === -1) { clean += s.slice(i); break; }
      inMedia = true;
      depth = 1;
      i = open;
      continue;
    }
    if (inMedia) {
      if (ch === "{") depth++;
      else if (ch === "}") { depth--; if (depth === 0) { inMedia = false; continue; } }
      continue;
    }
    clean += ch;
  }
  const re = new RegExp(`(^|\\s)${selector.replace(/[-.]/g, (c) => "\\" + c)}\\s*\\{([^}]*)\\}`);
  const m = clean.match(re);
  if (!m) return null;
  const mw = m[2].match(/max-width\s*:\s*([^;]+)/);
  return mw ? mw[1].trim() : null;
}

describe("desktop content widths — Pass 0.5 Bug 3 acceptance", () => {
  it(".dashboard-inner uses --w-desktop (≥1080px content)", () => {
    expect(cap(".dashboard-inner")).toMatch(/var\(--w-desktop\)/);
  });
  it(".path-inner uses --w-desktop", () => {
    expect(cap(".path-inner")).toMatch(/var\(--w-desktop\)/);
  });
  it(".exercise-inner uses --w-desktop", () => {
    expect(cap(".exercise-inner")).toMatch(/var\(--w-desktop\)/);
  });
});
