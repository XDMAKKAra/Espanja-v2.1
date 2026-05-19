/* Static reading-bank loader.
   Spec: docs/superpowers/specs/2026-05-19-reading-bank-design.md

   Reads pre-generated JSON files at data/exam-pools/reading-bank/{lang}/{topic}.json
   on first call per lang+topic and caches the parsed array in-process.
   The bank is served before tryBankExercise (the DB cache) so we never spin
   up an OpenAI call on a cold cache for a topic that has static content.

   Random rotation is naive: pick any text whose level matches the request and
   whose id has not been seen in the caller-supplied recentlyShown list. We
   don't ship per-user history in this module — the route already passes
   recentTitles; we extend it to recent ids when callers want stronger
   non-repeat semantics. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_ROOT = path.resolve(__dirname, "..", "data", "exam-pools", "reading-bank");

const LANGUAGE_TO_DIR = {
  spanish: "es",
  french: "fr",
  german: "de",
};

// Map the human-readable topic strings used in the API ↔ the filename slugs
// the static bank lives under. Keep this in lockstep with READING_TOPIC_CONTEXTS
// in lib/openai.js — adding a new topic without adding a slug here just falls
// back to AI generation, which is the safe default.
const TOPIC_TO_SLUG = {
  "animals and nature": "animals_and_nature",
  "travel and places": "travel_and_places",
  "culture and history": "culture_and_history",
  "social media and technology": "social_media_and_technology",
  "health and sports": "health_and_sports",
  "environment": "environment",
};

const _cache = new Map(); // key = `${lang}/${slug}`, value = array

function loadFile(lang, slug) {
  const cacheKey = `${lang}/${slug}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);
  const filePath = path.join(BANK_ROOT, lang, `${slug}.json`);
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
 * Pick a static reading text matching the (language, topic, level) tuple.
 * Returns null if the bank is empty for that slot or no matching level
 * is available — caller should then fall through to AI generation.
 *
 * @param {object} args
 * @param {string} args.language  - "spanish" | "french" | "german"
 * @param {string} args.topic     - human-readable topic from READING_TOPIC_CONTEXTS
 * @param {string} args.level     - "B" | "C" | "M" | "E" | "L"
 * @param {string[]} [args.recentTitles] - lowercased titles to avoid
 * @returns {object|null} the parsed text object (without the bankId wrapper)
 */
export function pickReadingFromBank({ language, topic, level, recentTitles = [] }) {
  const langDir = LANGUAGE_TO_DIR[language];
  const slug = TOPIC_TO_SLUG[topic];
  if (!langDir || !slug) return null;

  const all = loadFile(langDir, slug);
  if (all.length === 0) return null;

  const seen = new Set(
    (Array.isArray(recentTitles) ? recentTitles : [])
      .filter((s) => typeof s === "string")
      .map((s) => s.toLowerCase().trim().slice(0, 80))
  );

  // First pass — exact level match, unseen.
  const exactUnseen = all.filter(
    (t) => t.level === level && !seen.has((t.title || "").toLowerCase().trim().slice(0, 80))
  );
  if (exactUnseen.length > 0) return pickRandom(exactUnseen);

  // Second pass — exact level, even if seen.
  const exact = all.filter((t) => t.level === level);
  if (exact.length > 0) return pickRandom(exact);

  // Third pass — any level, unseen. Better a different level than an AI cold-start.
  const anyUnseen = all.filter(
    (t) => !seen.has((t.title || "").toLowerCase().trim().slice(0, 80))
  );
  if (anyUnseen.length > 0) return pickRandom(anyUnseen);

  return pickRandom(all);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Test-only / migration helper: reset the in-process cache so a freshly
 * regenerated file gets picked up without a server restart.
 */
export function _resetReadingBankCache() {
  _cache.clear();
}

/**
 * List all bank files that exist on disk, with their entry counts. Used by
 * the vitest schema spec and by scripts/build-reading-bank.mjs for a
 * coverage report.
 */
export function listReadingBankFiles() {
  const out = [];
  for (const [lang, dir] of Object.entries(LANGUAGE_TO_DIR)) {
    for (const [topic, slug] of Object.entries(TOPIC_TO_SLUG)) {
      const fp = path.join(BANK_ROOT, dir, `${slug}.json`);
      if (!fs.existsSync(fp)) continue;
      try {
        const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
        out.push({ language: lang, topic, slug, file: fp, count: Array.isArray(arr) ? arr.length : 0 });
      } catch {
        out.push({ language: lang, topic, slug, file: fp, count: 0, broken: true });
      }
    }
  }
  return out;
}
