import { describe, it, expect } from "vitest";
import { normalizeLang } from "../lib/openai.js";

// L-V339 P1 regression — progress tables are filtered by a normalized,
// full-word language. A stray short code ("es") must still match stored
// "spanish" rows, and unknown/empty input must default to "spanish" so the
// single-language (es-only) world keeps working unchanged.
describe("normalizeLang (cross-language progress scoping)", () => {
  it("maps short ISO codes to the full-word convention", () => {
    expect(normalizeLang("es")).toBe("spanish");
    expect(normalizeLang("fr")).toBe("french");
    expect(normalizeLang("de")).toBe("german");
  });

  it("passes through full words and is case/space tolerant", () => {
    expect(normalizeLang("spanish")).toBe("spanish");
    expect(normalizeLang("French")).toBe("french");
    expect(normalizeLang("  GERMAN ")).toBe("german");
  });

  it("defaults unknown/empty input to spanish (preserves single-language behaviour)", () => {
    expect(normalizeLang(undefined)).toBe("spanish");
    expect(normalizeLang(null)).toBe("spanish");
    expect(normalizeLang("")).toBe("spanish");
    expect(normalizeLang("klingon")).toBe("spanish");
  });
});
