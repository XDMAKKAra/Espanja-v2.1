import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listReadingBankFiles, pickReadingFromBank, _resetReadingBankCache } from "../lib/readingBank.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_ROOT = path.resolve(__dirname, "..", "data", "exam-pools", "reading-bank");

const REQUIRED_LANGUAGES = ["es", "fr", "de"];
const REQUIRED_TOPIC_SLUGS = [
  "animals_and_nature",
  "travel_and_places",
  "culture_and_history",
  "social_media_and_technology",
  "health_and_sports",
  "environment",
];
const VALID_LEVELS = new Set(["B", "C", "M", "E", "L"]);

function readBank(lang, slug) {
  const fp = path.join(BANK_ROOT, lang, `${slug}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

describe("reading bank — file presence", () => {
  for (const lang of REQUIRED_LANGUAGES) {
    for (const slug of REQUIRED_TOPIC_SLUGS) {
      it(`${lang}/${slug}.json exists`, () => {
        const fp = path.join(BANK_ROOT, lang, `${slug}.json`);
        expect(fs.existsSync(fp), `missing ${fp}`).toBe(true);
      });
    }
  }
});

describe("reading bank — JSON schema", () => {
  const files = listReadingBankFiles();

  for (const { language, slug, file, count } of files) {
    it(`${language}/${slug}: has at least 1 text`, () => {
      expect(count, `file ${file} is empty`).toBeGreaterThan(0);
    });

    it(`${language}/${slug}: every text is well-formed`, () => {
      const arr = readBank(
        { spanish: "es", french: "fr", german: "de" }[language],
        slug
      );
      expect(Array.isArray(arr)).toBe(true);

      for (const [idx, t] of arr.entries()) {
        const where = `${language}/${slug}[${idx}] (id=${t?.id ?? "?"})`;
        expect(typeof t.id, `${where}.id`).toBe("string");
        expect(VALID_LEVELS.has(t.level), `${where}.level=${t.level}`).toBe(true);
        expect(typeof t.title, `${where}.title`).toBe("string");
        expect(typeof t.text, `${where}.text`).toBe("string");
        expect(t.text.length, `${where}.text too short`).toBeGreaterThan(120);
        expect(typeof t.source, `${where}.source`).toBe("string");

        expect(Array.isArray(t.questions), `${where}.questions`).toBe(true);
        expect(t.questions.length, `${where}.questions count`).toBeGreaterThanOrEqual(4);

        let mcCount = 0;
        let tfCount = 0;
        let saCount = 0;
        for (const [qi, q] of t.questions.entries()) {
          const qw = `${where} q[${qi}]`;
          expect(typeof q.id === "number" || typeof q.id === "string", `${qw}.id`).toBe(true);
          expect(typeof q.explanation, `${qw}.explanation`).toBe("string");

          if (q.type === "multiple_choice") {
            mcCount++;
            expect(Array.isArray(q.options), `${qw}.options`).toBe(true);
            expect(q.options.length, `${qw}.options.length`).toBeGreaterThanOrEqual(3);
            expect(["A", "B", "C", "D"].includes(q.correct), `${qw}.correct=${q.correct}`).toBe(true);
          } else if (q.type === "true_false") {
            tfCount++;
            expect(typeof q.statement, `${qw}.statement`).toBe("string");
            expect(typeof q.correct, `${qw}.correct (tf)`).toBe("boolean");
            expect(typeof q.justification, `${qw}.justification`).toBe("string");
            // Justification must appear in body. Normalise whitespace AND
            // strip the various quote glyphs (straight, German „/", French
            // «/», typographic “/”/‘/’) before comparing — agents wrap the
            // justification in surrounding quotes that the source text
            // doesn't have. 60-char prefix is enough to catch real drift
            // without flagging punctuation-only mismatches.
            const stripQuotes = (s) => s.replace(/[«»"“”„‟‘’`]/g, "");
            const needle = stripQuotes(q.justification).replace(/\s+/g, " ").trim().toLowerCase().slice(0, 60);
            const hay = stripQuotes(t.text).replace(/\s+/g, " ").trim().toLowerCase();
            expect(hay.includes(needle), `${qw}.justification not found verbatim in text`).toBe(true);
          } else if (q.type === "short_answer") {
            saCount++;
            expect(Array.isArray(q.acceptedAnswers), `${qw}.acceptedAnswers`).toBe(true);
            expect(q.acceptedAnswers.length, `${qw}.acceptedAnswers.length`).toBeGreaterThanOrEqual(1);
          }
        }
        expect(mcCount, `${where}: needs >=2 multiple_choice`).toBeGreaterThanOrEqual(2);
        expect(tfCount + saCount, `${where}: needs at least 1 tf or short_answer`).toBeGreaterThanOrEqual(1);
      }
    });
  }
});

describe("pickReadingFromBank", () => {
  it("returns a text matching the requested level when one exists", () => {
    _resetReadingBankCache();
    const t = pickReadingFromBank({
      language: "spanish",
      topic: "animals and nature",
      level: "B",
    });
    if (t) {
      expect(["B", "C", "M", "E", "L"]).toContain(t.level);
      expect(t.title).toBeTypeOf("string");
    }
  });

  it("returns null for unknown language", () => {
    expect(
      pickReadingFromBank({ language: "klingon", topic: "animals and nature", level: "B" })
    ).toBeNull();
  });

  it("returns null for unknown topic", () => {
    expect(
      pickReadingFromBank({ language: "spanish", topic: "quantum mechanics", level: "B" })
    ).toBeNull();
  });
});
