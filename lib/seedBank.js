/**
 * Seed bank — loads curated JSON exercise data at boot.
 *
 * Throws synchronously if any file is missing or undersized, so a bad
 * deployment surfaces immediately rather than silently degrading to AI-only.
 *
 * Lookup helpers (pickFromSeed, getSeedItemById) are used by both route
 * handlers (to serve exercises) and graders (to fetch correct answers
 * without ever sending them to the client).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const SEEDS_DIR = join(__dir, '../data/seeds');

function load(filename) {
  return JSON.parse(readFileSync(join(SEEDS_DIR, filename), 'utf8'));
}

// Loaded once — any JSON parse error or missing file crashes the process here.
export const seedBank = {
  aukkotehtava:         load('aukkotehtava.json'),
  matching:             load('matching.json'),
  translation:          load('translation.json'),
  sentenceConstruction: load('sentence-construction.json'),
  readingPassages:      load('reading-passages.json'),
  writingPrompts:       load('writing-prompts.json'),
};

// Boot-time size assertions — fail fast rather than serving empty exercises.
const MINIMUMS = {
  aukkotehtava:         400,
  matching:             400,
  translation:          200,
  sentenceConstruction: 200,
  readingPassages:       50,
  writingPrompts:        20,
};
for (const [key, min] of Object.entries(MINIMUMS)) {
  const arr = seedBank[key];
  if (!Array.isArray(arr) || arr.length < min) {
    throw new Error(
      `seedBank boot check failed: "${key}" has ${arr?.length ?? 0} items (minimum ${min})`
    );
  }
}

// Build O(1) lookup maps by ID for every collection.
const idMaps = Object.fromEntries(
  Object.entries(seedBank).map(([key, items]) => [
    key,
    new Map(items.map(item => [item.id, item])),
  ])
);

/**
 * Look up a single seed item by its ID.
 * Returns undefined if the ID is not found in any collection, or the item
 * from the specified collection if `collection` is provided.
 */
export function getSeedItemById(id, collection = null) {
  if (collection) return idMaps[collection]?.get(id);
  for (const map of Object.values(idMaps)) {
    const item = map.get(id);
    if (item) return item;
  }
  return undefined;
}

/**
 * Pick up to `count` items from a seed collection.
 *
 * Filtering priority:
 *   1. topic + cefr + excludeIds   (exact match)
 *   2. topic + excludeIds           (relax cefr if no results)
 *   3. excludeIds only              (relax topic too as last resort)
 *
 * @param {'aukkotehtava'|'matching'|'translation'|'sentenceConstruction'|'readingPassages'|'writingPrompts'} collection
 * @param {{ topic?: string, cefr?: string, count?: number, excludeIds?: string[] }} opts
 * @returns {object[]}
 */
export function pickFromSeed(collection, { topic, cefr, count = 1, excludeIds = [] } = {}) {
  const all = seedBank[collection] ?? [];

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function candidates(arr) {
    return arr.filter(x => !excludeIds.includes(x.id));
  }

  // Pass 1: topic + cefr
  if (topic && cefr) {
    const pool = candidates(all.filter(x => x.topic === topic && x.cefr === cefr));
    if (pool.length) return shuffle(pool).slice(0, count);
  }

  // Pass 2: topic only
  if (topic) {
    const pool = candidates(all.filter(x => x.topic === topic));
    if (pool.length) return shuffle(pool).slice(0, count);
  }

  // Pass 3: no filter (last resort)
  const pool = candidates(all);
  return shuffle(pool).slice(0, count);
}

/** Convenience counts for health/debug responses. */
export const seedCounts = Object.fromEntries(
  Object.entries(seedBank).map(([k, v]) => [k, v.length])
);
