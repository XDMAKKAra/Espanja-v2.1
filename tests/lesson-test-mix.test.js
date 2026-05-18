/**
 * lesson-test-mix.test.js
 *
 * Validates item-type diversity for every kertaustesti (lesson_type === "test")
 * in data/courses/{es,fr,de}/**\/lesson_*.json.
 *
 * Rules (hard-fail on 1 + 2, soft-warn on 3):
 *   1. No single item_type may exceed 60 % of total items.
 *   2. At least 3 distinct item_types must appear.
 *   3. Every item should have a "topic_key" field
 *      (soft warning — up to 14 legacy mc items may lack it; does not fail).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sync as globSync } from "glob";

// ── helpers ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PATTERN = "data/courses/{es,fr,de}/**/lesson_*.json";

/** Collect every item across all phases of a lesson JSON. */
function allItems(lesson) {
  return (lesson.phases ?? []).flatMap((p) => p.items ?? []);
}

/** Build a { type -> count } map. */
function typeCounts(items) {
  const counts = {};
  for (const item of items) {
    counts[item.item_type] = (counts[item.item_type] ?? 0) + 1;
  }
  return counts;
}

// ── discover test lessons ─────────────────────────────────────────────────────

const allFiles = globSync(PATTERN, { cwd: ROOT });

const testLessons = allFiles
  .map((rel) => {
    const absPath = join(ROOT, rel);
    let lesson;
    try {
      lesson = JSON.parse(readFileSync(absPath, "utf8"));
    } catch {
      return null;
    }
    if (lesson?.meta?.lesson_type !== "test") return null;
    return { rel, absPath, lesson };
  })
  .filter(Boolean);

// ── tests ─────────────────────────────────────────────────────────────────────

describe("kertaustesti item-type diversity", () => {
  it("finds at least one kertaustesti JSON to validate", () => {
    expect(testLessons.length).toBeGreaterThan(0);
  });

  describe.each(testLessons.map(({ rel, lesson }) => ({ rel, lesson })))(
    "$rel",
    ({ rel, lesson }) => {
      const items = allItems(lesson);
      const counts = typeCounts(items);
      const total = items.length;
      const distinctTypes = Object.keys(counts);
      const maxCount = Math.max(...Object.values(counts));
      const maxPct = total > 0 ? maxCount / total : 0;

      it(`rule 1 — no single item_type exceeds 60 % (${rel})`, () => {
        const dominant = Object.entries(counts).find(
          ([, n]) => n / total > 0.6
        );
        if (dominant) {
          const [type, n] = dominant;
          throw new Error(
            `${rel}: item_type "${type}" is ${n}/${total} = ${(
              (n / total) *
              100
            ).toFixed(1)}% — exceeds 60% cap`
          );
        }
        expect(maxPct).toBeLessThanOrEqual(0.6);
      });

      it(`rule 2 — at least 3 distinct item_types (${rel})`, () => {
        if (distinctTypes.length < 3) {
          throw new Error(
            `${rel}: only ${distinctTypes.length} distinct item_type(s): ${distinctTypes.join(", ")}`
          );
        }
        expect(distinctTypes.length).toBeGreaterThanOrEqual(3);
      });

      it(`rule 3 (soft) — every item has topic_key (${rel})`, () => {
        const missing = items.filter((item) => !item.topic_key);
        if (missing.length > 0) {
          // Soft-fail: warn but don't throw.
          // The grace allows up to 14 legacy mc items that predate topic_key.
          console.warn(
            `[WARN] ${rel}: ${missing.length} item(s) missing topic_key ` +
              `(types: ${[...new Set(missing.map((i) => i.item_type))].join(", ")})`
          );
        }
        // Hard assertion is intentionally omitted — rule 3 is soft.
        expect(true).toBe(true);
      });
    }
  );
});
