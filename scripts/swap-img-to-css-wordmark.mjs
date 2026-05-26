// Swap every <img src="/public/brand/logo.svg" class="brand-img" ...> back
// to <span class="brand-wordmark">puheo</span> so the wordmark renders as
// CSS-styled Inter-700 text, identical on every browser.
// SVG files stay in repo for external (off-app) use.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));

const FILES = [
  "index.html",
  "public/landing/espanja.html",
  "public/landing/saksa.html",
  "public/landing/ranska.html",
  "pricing.html",
  "terms.html",
  "privacy.html",
  "refund.html",
  "blog/index.html",
  "diagnose.html",
  "app.html",
];

// Match both width and height variants
const PATTERN = /<img src="\/public\/brand\/logo\.svg" alt="" class="brand-img"[^>]*>/g;
const REPLACEMENT = '<span class="brand-wordmark">puheo</span>';

let total = 0;
for (const rel of FILES) {
  const path = join(REPO, rel);
  let content;
  try { content = readFileSync(path, "utf-8"); }
  catch (err) { console.log(`  SKIP ${rel}: ${err.message}`); continue; }

  const matches = content.match(PATTERN);
  if (!matches) {
    console.log(`  ${rel}: no matches`);
    continue;
  }
  content = content.replace(PATTERN, REPLACEMENT);
  writeFileSync(path, content, "utf-8");
  console.log(`  ${rel}: ${matches.length} swap${matches.length === 1 ? "" : "s"}`);
  total += matches.length;
}
console.log(`\nTotal: ${total} <img> → <span class="brand-wordmark">puheo</span>`);
