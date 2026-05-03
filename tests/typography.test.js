/**
 * Guards design-system/DESIGN.md §2 typography spec.
 *
 * Checks:
 *   - --font-body is declared in both CSS files (Inter).
 *   - --fs-h1..h5, --fs-body, --fs-caption, --fs-mono exist.
 *   - Global h1–h4 rules exist and reference --fs-* tokens (not raw values).
 *   - Every HTML shell that serves interactive UI loads Inter with
 *     the latin-ext subset (required for Finnish ä/ö/å + Spanish ñ/á/í/ó/ú).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const styleCss = readFileSync(resolve(root, "style.css"), "utf8");
const landingCss = readFileSync(resolve(root, "landing.css"), "utf8");

const FS_TOKENS = [
  "--fs-h1", "--fs-h2", "--fs-h3", "--fs-h4", "--fs-h5",
  "--fs-body", "--fs-body-sm", "--fs-caption", "--fs-mono",
];

describe("typography tokens", () => {
  for (const file of [["style.css", styleCss], ["landing.css", landingCss]]) {
    for (const t of FS_TOKENS) {
      it(`${file[0]} declares ${t}`, () => {
        expect(file[1]).toMatch(new RegExp(`${t.replace(/-/g, "\\-")}\\s*:`));
      });
    }
    it(`${file[0]} declares --font-body`, () => {
      // Mint+navy rebrand uses Inter single-family. Only assert token exists
      // and is non-empty — font choice is owned by design-system/DESIGN.md.
      expect(file[1]).toMatch(/--font-body\s*:[^;]+;/);
    });
    it(`${file[0]} declares --font-display`, () => {
      expect(file[1]).toMatch(/--font-display\s*:[^;]+;/);
    });
  }
});

describe("global heading rules reference tokens", () => {
  for (const file of [["style.css", styleCss], ["landing.css", landingCss]]) {
    it(`${file[0]} h1 uses var(--fs-h1)`, () => {
      expect(file[1]).toMatch(/^h1\s*\{[^}]*var\(--fs-h1\)/ms);
    });
    it(`${file[0]} h2 uses var(--fs-h2)`, () => {
      expect(file[1]).toMatch(/^h2\s*\{[^}]*var\(--fs-h2\)/ms);
    });
    it(`${file[0]} h3 uses var(--fs-h3)`, () => {
      expect(file[1]).toMatch(/^h3\s*\{[^}]*var\(--fs-h3\)/ms);
    });
    it(`${file[0]} h4 uses var(--fs-h4)`, () => {
      expect(file[1]).toMatch(/^h4\s*\{[^}]*var\(--fs-h4\)/ms);
    });
  }
});

describe("HTML shells load a webfont with latin-ext support", () => {
  // Finnish (ä/ö/å) and Spanish (ñ/á/í/ó/ú) both need the latin-ext subset.
  // The exact font family is owned by design-system/DESIGN.md — we only
  // guard that a webfont with latin-ext exists, either via Google Fonts CDN
  // or via self-hosted @font-face declarations in style.css (L-LIVE-AUDIT-P2
  // UPDATE 8 moved app.html to self-hosted Inter + DM Mono).
  const shells = ["index.html", "app.html", "pricing.html", "diagnose.html",
                  "privacy.html", "terms.html", "refund.html"];
  for (const shell of shells) {
    it(`${shell} loads a webfont with latin-ext subset`, () => {
      const path = resolve(root, shell);
      if (!existsSync(path)) return;
      const html = readFileSync(path, "utf8");
      const usesGoogleFonts = /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html)
        && /subset=latin-ext|latin-ext/.test(html);
      // Self-hosted path: the shell preloads /fonts/* AND style.css ships
      // latin-ext @font-face declarations.
      const usesSelfHosted = /\/fonts\/[^"'\s]+latin[^"'\s]*\.woff2/.test(html)
        && /latin-ext-\d+-normal\.woff2/.test(styleCss);
      expect(usesGoogleFonts || usesSelfHosted).toBe(true);
    });
  }
});
