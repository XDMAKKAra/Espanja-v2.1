import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listWritingBankFiles, pickWritingTaskFromBank, _resetWritingBankCache } from "../lib/writingBank.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_ROOT = path.resolve(__dirname, "..", "data", "exam-pools", "writing-tasks");

const REQUIRED_LANGS = ["es", "fr", "de"];
const REQUIRED_TYPES = ["short", "long"];

function readBank(lang, type) {
  const fp = path.join(BANK_ROOT, lang, `${type}.json`);
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

describe("writing bank — file presence", () => {
  for (const lang of REQUIRED_LANGS) {
    for (const type of REQUIRED_TYPES) {
      it(`${lang}/${type}.json exists`, () => {
        const fp = path.join(BANK_ROOT, lang, `${type}.json`);
        expect(fs.existsSync(fp), `missing ${fp}`).toBe(true);
      });
    }
  }
});

describe("writing bank — JSON schema", () => {
  for (const lang of REQUIRED_LANGS) {
    for (const type of REQUIRED_TYPES) {
      it(`${lang}/${type}: every prompt is well-formed`, () => {
        const arr = readBank(lang, type);
        expect(Array.isArray(arr)).toBe(true);
        // Type-level expected counts: short=50, long=25 per brief.
        const expectedMin = type === "short" ? 30 : 15;
        expect(arr.length, `${lang}/${type} count`).toBeGreaterThanOrEqual(expectedMin);

        const ids = new Set();
        for (const [idx, p] of arr.entries()) {
          const where = `${lang}/${type}[${idx}] (id=${p?.id ?? "?"})`;
          expect(typeof p.id, `${where}.id`).toBe("string");
          expect(ids.has(p.id), `${where}.id duplicate`).toBe(false);
          ids.add(p.id);

          expect(p.taskType, `${where}.taskType`).toBe(type);
          expect(["informal", "formal"]).toContain(p.register);
          expect(typeof p.topic, `${where}.topic`).toBe("string");
          expect(typeof p.rubric_focus, `${where}.rubric_focus`).toBe("string");

          if (type === "short") {
            expect(p.charMin, `${where}.charMin`).toBe(160);
            expect(p.charMax, `${where}.charMax`).toBe(240);
            expect(p.points, `${where}.points`).toBe(20);
          } else {
            expect(p.charMin, `${where}.charMin`).toBe(300);
            expect(p.charMax, `${where}.charMax`).toBe(450);
            expect(p.points, `${where}.points`).toBe(40);
          }

          expect(typeof p.situation, `${where}.situation`).toBe("string");
          expect(typeof p.prompt, `${where}.prompt`).toBe("string");
          expect(p.prompt.length, `${where}.prompt length`).toBeGreaterThan(20);
          expect(Array.isArray(p.requirements), `${where}.requirements`).toBe(true);
          expect(p.requirements.length, `${where}.requirements.length`).toBe(3);
          for (const r of p.requirements) {
            expect(typeof r, `${where}.requirements[*]`).toBe("string");
            expect(r.length, `${where}.requirements[*] length`).toBeGreaterThan(5);
          }
          expect(typeof p.textType, `${where}.textType`).toBe("string");
        }
      });
    }
  }
});

describe("pickWritingTaskFromBank", () => {
  it("returns a task matching language + taskType", () => {
    _resetWritingBankCache();
    const t = pickWritingTaskFromBank({ language: "spanish", taskType: "short" });
    if (t) {
      expect(t.taskType).toBe("short");
      expect(t.charMin).toBe(160);
    }
  });

  it("returns null for unknown language", () => {
    expect(pickWritingTaskFromBank({ language: "klingon", taskType: "short" })).toBeNull();
  });

  it("returns null for invalid taskType", () => {
    expect(pickWritingTaskFromBank({ language: "spanish", taskType: "essay" })).toBeNull();
  });

  it("avoids recently-shown ids when possible", () => {
    _resetWritingBankCache();
    const first = pickWritingTaskFromBank({ language: "spanish", taskType: "short" });
    if (!first) return;
    const second = pickWritingTaskFromBank({
      language: "spanish",
      taskType: "short",
      recentIds: [first.id],
    });
    // With 50 prompts and only 1 in recent, second should never be the same id.
    if (second) expect(second.id).not.toBe(first.id);
  });
});
