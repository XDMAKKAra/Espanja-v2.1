#!/usr/bin/env node
/**
 * Validate every data/courses/**\/*.json against schemas/lesson.json.
 * Exits 0 on success, 1 on any validation failure.
 *
 * L-COURSE-1 UPDATE 1.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv from "ajv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(REPO_ROOT, "schemas", "lesson.json");
const DATA_ROOT = path.join(REPO_ROOT, "data", "courses");

async function loadSchema() {
  const raw = await readFile(SCHEMA_PATH, "utf8");
  return JSON.parse(raw);
}

function parseLangArg() {
  const arg = process.argv.find((a) => a.startsWith("--lang="));
  if (!arg) return null;
  const v = arg.slice("--lang=".length).trim();
  if (!v) return null;
  if (!/^[a-z]{2}$/.test(v)) {
    console.error(`✗ --lang=${v} invalid (expected 2-letter code like 'de', 'fr', 'es')`);
    process.exit(1);
  }
  return v;
}

async function findLessonFiles(langFilter) {
  // L-LANG-INFRA-1: lessons live under data/courses/${lang}/kurssi_N/.
  // L-VALIDATE-LANG-PARAM: optional --lang=<code> restricts scan to one lang dir.
  const out = [];

  if (langFilter) {
    const langDir = path.join(DATA_ROOT, langFilter);
    try {
      await stat(langDir);
    } catch {
      console.error(`✗ data/courses/${langFilter}/ does not exist — run L-COURSE-1 for ${langFilter} first`);
      process.exit(1);
    }
    let courseEntries;
    try {
      courseEntries = await readdir(langDir, { withFileTypes: true });
    } catch { return []; }
    for (const entry of courseEntries) {
      if (!entry.isDirectory()) continue;
      if (!/^kurssi_[1-8]$/.test(entry.name)) continue;
      const courseDir = path.join(langDir, entry.name);
      const courseFiles = await readdir(courseDir);
      for (const f of courseFiles) {
        if (!f.endsWith(".json")) continue;
        out.push(path.join(courseDir, f));
      }
    }
    return out.sort();
  }

  let topEntries;
  try {
    topEntries = await readdir(DATA_ROOT, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }

  for (const langEntry of topEntries) {
    if (!langEntry.isDirectory()) continue;
    if (/^kurssi_/.test(langEntry.name)) continue;
    const langDir = path.join(DATA_ROOT, langEntry.name);
    let courseEntries;
    try {
      courseEntries = await readdir(langDir, { withFileTypes: true });
    } catch { continue; }
    for (const entry of courseEntries) {
      if (!entry.isDirectory()) continue;
      if (!/^kurssi_[1-8]$/.test(entry.name)) continue;
      const courseDir = path.join(langDir, entry.name);
      const courseFiles = await readdir(courseDir);
      for (const f of courseFiles) {
        if (!f.endsWith(".json")) continue;
        out.push(path.join(courseDir, f));
      }
    }
  }
  return out.sort();
}

async function main() {
  const schema = await loadSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const langFilter = parseLangArg();
  const files = await findLessonFiles(langFilter);
  const scope = langFilter ? `lang=${langFilter}` : "all langs";
  console.log(`Validating lessons (${scope}, ${files.length} file(s))`);
  if (files.length === 0) {
    console.log("0 lessons validated, all OK.");
    return;
  }

  let failures = 0;
  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    let parsed;
    try {
      parsed = JSON.parse(await readFile(file, "utf8"));
    } catch (err) {
      console.error(`✗ ${rel} — JSON parse error: ${err.message}`);
      failures++;
      continue;
    }
    const ok = validate(parsed);
    if (!ok) {
      failures++;
      console.error(`✗ ${rel}`);
      for (const e of validate.errors || []) {
        console.error(`    ${e.instancePath || "/"} ${e.message}`);
      }
    } else {
      console.log(`✓ ${rel}`);
    }
  }

  console.log("");
  console.log(`${files.length} lesson(s) validated, ${failures} failure(s).`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error("validate-lessons crashed:", err);
  process.exit(2);
});
