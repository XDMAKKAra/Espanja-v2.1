// lib/itemBank.js — L-V411 Vaihe D
//
// Deterministic item-bank lookup for /focus-session.
// Loads the pre-built data/item-bank/<short>.json, resolves refs to real lesson
// items via readLessonFile, and returns them annotated with _concept.
//
// No AI, no randomness. Takes the first `count` resolvable entries in array order.
// Falls through gracefully when the bank is absent or the concept is unknown.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readLessonFile } from "./curriculum.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_DIR = path.resolve(__dirname, "..", "data", "item-bank");

// Map full language names (as stored in DB) to the short codes used in the bank files.
const FULL_TO_SHORT = { spanish: "es", german: "de", french: "fr" };

// Process-lifetime caches — bank files and lesson files are static build artifacts.
const _bankCache = new Map();
const _lessonCache = new Map();

/** Load and cache the item bank for a given short language code. */
function loadBank(shortLang) {
  if (_bankCache.has(shortLang)) return _bankCache.get(shortLang);
  let bank = null;
  try {
    const raw = fs.readFileSync(path.join(BANK_DIR, `${shortLang}.json`), "utf8");
    bank = JSON.parse(raw);
  } catch (err) {
    console.warn(`[itemBank] bank load ${shortLang} failed:`, err.message);
  }
  _bankCache.set(shortLang, bank);
  return bank;
}

/**
 * Resolve a bank entry ref to the actual renderable lesson item.
 * Returns null if the ref is invalid, the lesson is unavailable, or the
 * item index is out of range.
 */
async function resolveItem(ref, shortLang) {
  // Strip the language prefix from kurssiKey to get the bare course key
  // that readLessonFile expects (e.g. "es_kurssi_2" -> "kurssi_2").
  const courseKey = String(ref.kurssiKey || "").replace(/^[a-z]{2}_/, "");
  if (!courseKey || ref.lessonIndex == null) return null;

  const cacheKey = `${shortLang}|${courseKey}|${ref.lessonIndex}`;
  let lesson = _lessonCache.get(cacheKey);
  if (lesson === undefined) {
    lesson = await readLessonFile(courseKey, ref.lessonIndex, shortLang);
    _lessonCache.set(cacheKey, lesson);
  }
  if (!lesson || lesson.available === false) return null;

  const phase = (lesson.phases || []).find((p) => p.phase_id === ref.phaseId);
  if (!phase) return null;
  return (phase.items || [])[ref.itemIndex] || null;
}

/**
 * Fetch up to `count` renderable items for a concept from the pre-built bank.
 *
 * @param {object} opts
 * @param {string} opts.concept   - topic key, e.g. "subjunctive"
 * @param {string} opts.lang      - full ("spanish") OR short ("es") lang code
 * @param {number} [opts.count=10]
 * @returns {Promise<Array>}      - resolved item objects, each with _concept set
 */
export async function getBankItemsForConcept({ concept, lang, count = 10 }) {
  // Normalise to short code: try FULL_TO_SHORT first, then treat as short already.
  const shortLang = FULL_TO_SHORT[lang] || (["es", "de", "fr"].includes(lang) ? lang : "es");

  const bank = loadBank(shortLang);
  if (!bank) return [];

  const entries = bank[concept];
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const results = [];
  for (const entry of entries) {
    if (results.length >= count) break;
    const item = await resolveItem(entry.ref, shortLang);
    if (!item) continue;
    results.push({ ...item, _concept: concept });
  }
  return results;
}

/**
 * Test seam: clear the module-level caches so unit tests can start fresh.
 */
export function _resetItemBankCache() {
  _bankCache.clear();
  _lessonCache.clear();
}
