#!/usr/bin/env node
/* Reading-bank coverage report.

   Walks data/exam-pools/reading-bank/{lang}/{topic}.json, validates each
   file's schema, and reports counts per (lang, topic, level). Doesn't
   generate content — sub-agents do that (see PR description for the
   parallel-Sonnet generation pattern). This script is the audit trail
   that runs in CI / before every release. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_ROOT = path.resolve(__dirname, "..", "data", "exam-pools", "reading-bank");

const LANGUAGES = ["es", "fr", "de"];
const TOPICS = [
  "animals_and_nature",
  "travel_and_places",
  "culture_and_history",
  "social_media_and_technology",
  "health_and_sports",
  "environment",
];

let totalTexts = 0;
let missingFiles = 0;
let brokenFiles = 0;
const summary = [];

for (const lang of LANGUAGES) {
  for (const slug of TOPICS) {
    const fp = path.join(BANK_ROOT, lang, `${slug}.json`);
    if (!fs.existsSync(fp)) {
      missingFiles++;
      summary.push({ lang, slug, status: "missing", count: 0 });
      continue;
    }
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(fp, "utf8"));
    } catch (err) {
      brokenFiles++;
      summary.push({ lang, slug, status: `parse-error: ${err.message}`, count: 0 });
      continue;
    }
    if (!Array.isArray(arr)) {
      brokenFiles++;
      summary.push({ lang, slug, status: "not-an-array", count: 0 });
      continue;
    }
    const byLevel = arr.reduce((acc, t) => {
      const k = t.level || "?";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    totalTexts += arr.length;
    summary.push({ lang, slug, status: "ok", count: arr.length, byLevel });
  }
}

const header = `${"lang".padEnd(4)}  ${"topic".padEnd(28)}  ${"n".padStart(4)}  level-mix`;
console.log(header);
console.log("─".repeat(header.length));
for (const row of summary) {
  const mix = row.byLevel
    ? Object.entries(row.byLevel).map(([k, v]) => `${k}:${v}`).join(" ")
    : row.status;
  console.log(`${row.lang.padEnd(4)}  ${row.slug.padEnd(28)}  ${String(row.count).padStart(4)}  ${mix}`);
}
console.log("─".repeat(header.length));
console.log(`total texts: ${totalTexts} | missing files: ${missingFiles} | broken: ${brokenFiles}`);

if (missingFiles > 0 || brokenFiles > 0) process.exit(1);
