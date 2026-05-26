// One-shot script: swap the legacy CSS-styled "Puhe<span>o</span>" brand
// wordmark for an <img> referencing public/brand/logo.svg, on every public
// + auth HTML surface. Idempotent — safe to re-run.

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
  // app.html already done via Edit tool above — keep idempotent
  "app.html",
];

// Two known patterns (landing nav__brand-o and app/diagnose plain <span>)
const PATTERNS = [
  {
    name: "nav__brand-o",
    find: /Puhe<span class="nav__brand-o" aria-hidden="true">o<\/span>/g,
    replace: '<img src="/public/brand/logo.svg" alt="" class="brand-img" width="78" height="32">',
  },
  {
    name: "plain span",
    find: /Puhe<span>o<\/span>/g,
    replace: '<img src="/public/brand/logo.svg" alt="" class="brand-img" width="78" height="32">',
  },
];

let totalReplaced = 0;
for (const rel of FILES) {
  const path = join(REPO, rel);
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch (err) {
    console.log(`  SKIP ${rel}: ${err.message}`);
    continue;
  }
  let changedCount = 0;
  for (const p of PATTERNS) {
    const matches = content.match(p.find);
    if (matches) {
      content = content.replace(p.find, p.replace);
      changedCount += matches.length;
    }
  }
  if (changedCount > 0) {
    writeFileSync(path, content, "utf-8");
    console.log(`  ${rel}: ${changedCount} swap${changedCount === 1 ? "" : "s"}`);
    totalReplaced += changedCount;
  } else {
    console.log(`  ${rel}: no matches (already swapped or no brand wordmark)`);
  }
}
console.log(`\nTotal: ${totalReplaced} CSS-text → <img> swaps`);
