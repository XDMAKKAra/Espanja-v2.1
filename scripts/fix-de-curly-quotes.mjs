#!/usr/bin/env node
/* DE reading-bank JSON post-fix.

   Symptom: agent output used `„word"` (curly opener + ASCII closer) for
   German direct speech. The ASCII `"` then closes the surrounding JSON
   string and the parser errors out.

   Fix pass A (per line): for each line, scan left-to-right; whenever a
   `„` is encountered, replace the NEXT ASCII `"` on the same line with
   `"` (U+201D). This converts paired German quotes inside string content
   from `„word"` into `„word"`.

   Fix pass B (per file): walk through `"key": "..."` value pairs. If the
   value-closing position happens to be `"` (U+201D) because pass A was
   over-eager, convert it back to ASCII `"`. A value-closer is identified
   structurally: a `"` (any kind) followed by `\s*[,}\]]` followed by
   whitespace then a JSON property key (`"keyname":`) or a structural
   closer.

   Idempotent. Safe to re-run. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DE_DIR = path.resolve(__dirname, "..", "data", "exam-pools", "reading-bank", "de");

function passA(raw) {
  const lines = raw.split("\n");
  let n = 0;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Reset: only re-pair lines that still have „...?" patterns.
    while (/„[^"”\n]*"/.test(line)) {
      const replaced = line.replace(/„([^"”\n]*)"/, "„$1”");
      if (replaced === line) break;
      line = replaced;
      n++;
    }
    lines[i] = line;
  }
  return { out: lines.join("\n"), n };
}

function passB(raw) {
  // Restore JSON value closers that were curly-ified by an over-eager pass A.
  // Pattern: `"` followed by `,\n  "<word>":` (next property) → must be ASCII.
  let out = raw;
  let n = 0;
  // Case 1: `",` followed by newline + indent + `"key":`
  out = out.replace(/”(\s*,\s*"\w+"\s*:)/g, (_m, tail) => { n++; return '"' + tail; });
  // Case 2: end of object — `"\n  }`
  out = out.replace(/”(\s*\n\s*})/g, (_m, tail) => { n++; return '"' + tail; });
  // Case 3: end of array entry — `"\n  ]`
  out = out.replace(/”(\s*\n\s*])/g, (_m, tail) => { n++; return '"' + tail; });
  // Case 4: end of inline array — `"]`
  out = out.replace(/”\s*(\])/g, (_m, tail) => { n++; return '"' + tail; });
  return { out, n };
}

const files = fs.readdirSync(DE_DIR).filter((f) => f.endsWith(".json"));
let totalA = 0, totalB = 0;
for (const name of files) {
  const fp = path.join(DE_DIR, name);
  let raw = fs.readFileSync(fp, "utf8");
  const a = passA(raw);
  raw = a.out;
  const b = passB(raw);
  raw = b.out;
  fs.writeFileSync(fp, raw);
  totalA += a.n;
  totalB += b.n;
  try {
    JSON.parse(fs.readFileSync(fp, "utf8"));
    console.log(`✓ ${name}: passA=${a.n} passB=${b.n}`);
  } catch (e) {
    console.log(`✗ ${name}: passA=${a.n} passB=${b.n} — ${e.message}`);
  }
}
console.log(`pass A total: ${totalA}  |  pass B total: ${totalB}`);
