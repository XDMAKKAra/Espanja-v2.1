// L-V399 C3 — characterization test for the pure vocab helpers extracted from
// js/screens/vocab.js into js/features/vocabHelpers.js. Locks fmtElapsed's
// formatting bands, extractClientHeadwordKey's option/article stripping, and
// dedupe's case-insensitive first-wins behavior so the move is provable.
import { describe, it, expect } from "vitest";
import { fmtElapsed, extractClientHeadwordKey, dedupe } from "../js/features/vocabHelpers.js";

describe("fmtElapsed", () => {
  it("returns the em-dash placeholder for non-positive / non-finite input", () => {
    expect(fmtElapsed(0)).toBe("—");
    expect(fmtElapsed(-5)).toBe("—");
    expect(fmtElapsed(NaN)).toBe("—");
    expect(fmtElapsed(Infinity)).toBe("—");
  });
  it("formats sub-minute durations as 'N s'", () => {
    expect(fmtElapsed(5000)).toBe("5 s");
    expect(fmtElapsed(59000)).toBe("59 s");
  });
  it("formats exact minutes as 'M min'", () => {
    expect(fmtElapsed(60000)).toBe("1 min");
    expect(fmtElapsed(120000)).toBe("2 min");
  });
  it("formats minute+second durations as 'M:SS'", () => {
    expect(fmtElapsed(65000)).toBe("1:05");
    expect(fmtElapsed(90000)).toBe("1:30");
  });
});

describe("extractClientHeadwordKey", () => {
  it("derives the lemma from the correct option, stripping letter prefix + article", () => {
    expect(extractClientHeadwordKey({ correct: "A", options: ["A) el gato", "B) perro"] })).toBe("gato");
    expect(extractClientHeadwordKey({ correct: "B", options: ["A) x", "B) la casa"] })).toBe("casa");
  });
  it("lowercases and trims", () => {
    expect(extractClientHeadwordKey({ correct: "a", options: ["A)  PERRO  "] })).toBe("perro");
  });
  it("returns null for malformed input", () => {
    expect(extractClientHeadwordKey(null)).toBe(null);
    expect(extractClientHeadwordKey({ correct: null, options: ["A) x"] })).toBe(null);
    expect(extractClientHeadwordKey({ correct: "A", options: "notarray" })).toBe(null);
    expect(extractClientHeadwordKey({ correct: "Z", options: ["A) x"] })).toBe(null);
  });
});

describe("dedupe", () => {
  it("removes case-insensitive duplicates, keeping the first occurrence", () => {
    expect(dedupe(["Gato", "gato", "Perro"])).toEqual(["Gato", "Perro"]);
  });
  it("returns an empty array for empty input", () => {
    expect(dedupe([])).toEqual([]);
  });
  it("preserves order of distinct entries", () => {
    expect(dedupe(["uno", "dos", "tres"])).toEqual(["uno", "dos", "tres"]);
  });
});
