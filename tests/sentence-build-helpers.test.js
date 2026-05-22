// v279 — unit tests for the pure helpers in js/screens/sentenceBuild.js.
// Keeps grading logic safe from drift even though the screen itself runs
// in the browser. Covers exact match, case-insensitive match, and length
// mismatch — the three branches arraysEqualCI must handle.

import { describe, it, expect } from "vitest";
import { _internal } from "../js/screens/sentenceBuild.js";

const { arraysEqualCI } = _internal;

describe("sentence-build arraysEqualCI", () => {
  it("returns true for exact same-order arrays", () => {
    expect(arraysEqualCI(["No", "me", "gusta"], ["No", "me", "gusta"])).toBe(true);
  });

  it("is case-insensitive on capitalization", () => {
    expect(arraysEqualCI(["no", "Me", "GUSTA"], ["No", "me", "gusta"])).toBe(true);
  });

  it("returns false when order differs", () => {
    expect(arraysEqualCI(["me", "no", "gusta"], ["No", "me", "gusta"])).toBe(false);
  });

  it("returns false when lengths differ", () => {
    expect(arraysEqualCI(["No", "me"], ["No", "me", "gusta"])).toBe(false);
  });

  it("returns true for empty arrays (degenerate)", () => {
    expect(arraysEqualCI([], [])).toBe(true);
  });
});
