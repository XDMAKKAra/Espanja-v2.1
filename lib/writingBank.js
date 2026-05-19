/* Static writing-task bank loader.
   Spec: docs/superpowers/specs/2026-05-19-writing-bank-design.md

   Reads pre-generated JSON prompts at
   data/exam-pools/writing-tasks/{lang}/{short|long}.json on first call
   and caches the parsed array in-process. The route prefers a bank
   draw over the live OpenAI call; AI fallback runs only if the bank
   slot is empty. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_ROOT = path.resolve(__dirname, "..", "data", "exam-pools", "writing-tasks");

const LANGUAGE_TO_DIR = {
  spanish: "es",
  french: "fr",
  german: "de",
};

const _cache = new Map(); // key = `${lang}/${type}`

function loadFile(lang, type) {
  const cacheKey = `${lang}/${type}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);
  const filePath = path.join(BANK_ROOT, lang, `${type}.json`);
  let parsed = [];
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) parsed = [];
  } catch {
    parsed = [];
  }
  _cache.set(cacheKey, parsed);
  return parsed;
}

/**
 * Draw a writing prompt matching (language, taskType). Optional filters:
 *   - recentIds: ids to avoid this session
 *   - weaknessCategories: prefer prompts whose rubric_focus mentions one
 *     of these (best-effort string match; falls back to any).
 *
 * @returns {object|null} task object shaped like the existing
 *   POST /api/writing-task response, or null when the bank is empty.
 */
export function pickWritingTaskFromBank({ language, taskType, recentIds = [], weaknessCategories = [] } = {}) {
  const langDir = LANGUAGE_TO_DIR[language];
  if (!langDir) return null;
  if (taskType !== "short" && taskType !== "long") return null;

  const all = loadFile(langDir, taskType);
  if (all.length === 0) return null;

  const recent = new Set(Array.isArray(recentIds) ? recentIds : []);

  // Weakness-aware first pass: prompts whose rubric_focus mentions one of
  // the recent weakness category keywords. Best-effort substring scan.
  const weaknessNeedles = (Array.isArray(weaknessCategories) ? weaknessCategories : [])
    .map((w) => String(w?.category || w || "").toLowerCase())
    .filter(Boolean);

  if (weaknessNeedles.length > 0) {
    const matched = all.filter((t) => {
      if (recent.has(t.id)) return false;
      const focus = String(t.rubric_focus || "").toLowerCase();
      return weaknessNeedles.some((n) => focus.includes(n));
    });
    if (matched.length > 0) return pickRandom(matched);
  }

  // Unseen first.
  const unseen = all.filter((t) => !recent.has(t.id));
  if (unseen.length > 0) return pickRandom(unseen);

  // Repeat as last resort.
  return pickRandom(all);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function _resetWritingBankCache() {
  _cache.clear();
}

export function listWritingBankFiles() {
  const out = [];
  for (const [lang, dir] of Object.entries(LANGUAGE_TO_DIR)) {
    for (const type of ["short", "long"]) {
      const fp = path.join(BANK_ROOT, dir, `${type}.json`);
      if (!fs.existsSync(fp)) continue;
      try {
        const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
        out.push({ language: lang, type, file: fp, count: Array.isArray(arr) ? arr.length : 0 });
      } catch {
        out.push({ language: lang, type, file: fp, count: 0, broken: true });
      }
    }
  }
  return out;
}
