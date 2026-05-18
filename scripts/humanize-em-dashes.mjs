// Humanization sweep — replaces " — " (space-em-dash-space) with ", "
// across user-facing surfaces. Bare "—" (used in countdown placeholders
// like ">—<") is untouched because it has no spaces around it.
//
// Run as: node scripts/humanize-em-dashes.mjs [--glob "pattern"]
import fs from "node:fs";
import path from "node:path";

const DEFAULT_FILES = [
  "index.html",
  "pricing.html",
  "public/landing/espanja.html",
  "public/landing/saksa.html",
  "public/landing/ranska.html",
  "email.js",
  "terms.html",
  "refund.html",
  "privacy.html",
  "app.html",
  "blog/index.html",
  "blog/ser-vs-estar-milloin-kumpaakin.html",
  "blog/preteriti-vs-imperfekti-opas.html",
  "blog/por-vs-para-selkea-ero.html",
  "blog/ojala-subjunktiivi-yleisimmat-virheet.html",
  "blog/espanja-yo-koe-2026-lyhyt-oppimaara.html",
  "offline.html",
  "diagnose.html",
  "styleguide.html",
  "js/ui/strings.js",
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|cjs|html)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const extras = [
  ...walk("js/screens"),
  ...walk("js/features"),
  ...walk("js/ui"),
  ...walk("js/renderers"),
  ...walk("js/lib"),
];

const files = [...new Set([...DEFAULT_FILES, ...extras])];

let total = 0;
let touched = 0;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const orig = fs.readFileSync(f, "utf8");
  let out = orig.replace(/ — /g, ", ");
  out = out.replace(/ —([.,)])/g, "$1");
  const count = (orig.match(/ — /g) || []).length;
  if (count > 0) {
    fs.writeFileSync(f, out);
    console.log(`${f}: ${count} replaced`);
    total += count;
    touched++;
  }
}
console.log(`Total: ${total} replacements in ${touched} files`);
