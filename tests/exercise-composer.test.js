import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { pickExerciseType, composePrompt, getMaxTokens } from "../lib/exerciseComposer.js";

describe("pickExerciseType", () => {
  let rng;
  beforeEach(() => {
    rng = vi.spyOn(Math, "random").mockReturnValue(0);
  });
  afterEach(() => rng.mockRestore());

  it("restricts to topic affinity list", () => {
    // writing affinity = ["translate_mini"]
    expect(pickExerciseType("writing")).toBe("translate_mini");
  });

  it("falls back to all types for unknown topic", () => {
    const t = pickExerciseType("no_such_topic");
    expect(["multichoice", "gap_fill", "matching", "reorder", "translate_mini"]).toContain(t);
  });

  it("does not repeat the same type three times in a row", () => {
    // vocab affinity first item is "multichoice" when Math.random=0
    // Force recent=["gap_fill","gap_fill"] → filter drops gap_fill
    rng.mockReturnValue(0);
    const next = pickExerciseType("vocab", ["gap_fill", "gap_fill"]);
    expect(next).not.toBe("gap_fill");
  });

  it("respects userPreference when rng < 0.5 and preference is eligible", () => {
    rng.mockReturnValue(0.1);
    expect(pickExerciseType("vocab", [], "matching")).toBe("matching");
  });

  it("ignores userPreference when rng >= 0.5", () => {
    // rng returns 0.7 first (preference coin flip fails), then 0 for the index pick
    rng.mockReturnValueOnce(0.7).mockReturnValueOnce(0);
    const pick = pickExerciseType("vocab", [], "matching");
    // vocab affinity order: multichoice, matching, gap_fill, translate_mini → first is multichoice
    expect(pick).toBe("multichoice");
  });

  it("ignores userPreference that is not eligible for the topic", () => {
    rng.mockReturnValue(0.1);
    // grammar affinity does not include "matching"
    const pick = pickExerciseType("grammar", [], "matching");
    expect(pick).not.toBe("matching");
  });
});

describe("composePrompt", () => {
  const base = {
    level: "B",
    scaffoldLevel: 2,
    topic: "daily_life",
    count: 5,
    language: "spanish",
    profileContext: "profile-xyz",
  };

  it("includes level, topic, count, language name, and profile context", () => {
    const p = composePrompt({ ...base, type: "multichoice" });
    expect(p).toContain("LEVEL: B");
    expect(p).toContain("TOPIC: daily_life");
    expect(p).toContain("COUNT: 5");
    expect(p).toContain("Spanish");
    expect(p).toContain("profile-xyz");
  });

  it("routes to gap_fill composer and emits gap_fill JSON shape keys", () => {
    const p = composePrompt({ ...base, type: "gap_fill" });
    expect(p).toContain('"type": "gap_fill"');
    expect(p).toContain("correctAnswer");
    expect(p).toContain("alternativeAnswers");
  });

  it("routes to matching composer with pairs shape", () => {
    const p = composePrompt({ ...base, type: "matching" });
    expect(p).toContain('"type": "matching"');
    expect(p).toContain("pairs");
    expect(p).toContain("spanish");
    expect(p).toContain("finnish");
  });

  it("routes to reorder composer with scrambled/correct shape", () => {
    const p = composePrompt({ ...base, type: "reorder" });
    expect(p).toContain('"type": "reorder"');
    expect(p).toContain("scrambled");
    expect(p).toContain("finnishHint");
  });

  it("routes to translate_mini composer with acceptedTranslations", () => {
    const p = composePrompt({ ...base, type: "translate_mini" });
    expect(p).toContain('"type": "translate_mini"');
    expect(p).toContain("acceptedTranslations");
    expect(p).toContain("grammarFocus");
  });

  it("defaults unknown type to multichoice", () => {
    const p = composePrompt({ ...base, type: "not_a_real_type" });
    expect(p).toContain('"type": "multichoice"');
    expect(p).toContain('"options"');
  });

  it("omits translationHint when scaffold < 3 (gap_fill)", () => {
    const low = composePrompt({ ...base, scaffoldLevel: 1, type: "gap_fill" });
    expect(low).not.toContain("finnishTranslation");
  });

  it("includes finnishTranslation when scaffold >= 3 (gap_fill)", () => {
    const high = composePrompt({ ...base, scaffoldLevel: 3, type: "gap_fill" });
    expect(high).toContain("finnishTranslation");
  });

  it("omits options array when scaffold < 2 (gap_fill)", () => {
    const low = composePrompt({ ...base, scaffoldLevel: 1, type: "gap_fill" });
    expect(low).not.toMatch(/"options":\s*\[/);
  });

  it("includes context and translationHint in multichoice at scaffold 3", () => {
    const p = composePrompt({ ...base, scaffoldLevel: 3, type: "multichoice" });
    expect(p).toContain("context");
    expect(p).toContain("translationHint");
  });

  it("falls back to default level description for unknown level", () => {
    const p = composePrompt({ ...base, level: "Z", type: "multichoice" });
    // unknown level falls back to B description; no throw
    expect(p).toContain("LEVEL: Z");
    expect(p).toContain("lubenter approbatur");
  });

  it("uses spanish meta when language is unknown", () => {
    const p = composePrompt({ ...base, language: "klingon", type: "multichoice" });
    expect(p).toContain("Spanish");
  });

  it("renders swedish meta when language=swedish", () => {
    const p = composePrompt({ ...base, language: "swedish", type: "matching" });
    expect(p).toContain("Swedish");
  });

  it("tolerates missing profileContext", () => {
    const p = composePrompt({ ...base, profileContext: undefined, type: "multichoice" });
    expect(p).toContain("LEVEL: B");
  });
});

describe("getMaxTokens", () => {
  it("returns per-type base multiplied by count", () => {
    expect(getMaxTokens("multichoice", 2)).toBe(800);
    expect(getMaxTokens("gap_fill", 3)).toBe(900);
    expect(getMaxTokens("matching", 1)).toBe(800);
    expect(getMaxTokens("reorder", 4)).toBe(1400);
    expect(getMaxTokens("translate_mini", 2)).toBe(700);
  });

  it("caps at 3000 tokens regardless of count", () => {
    expect(getMaxTokens("matching", 10)).toBe(3000);
    expect(getMaxTokens("multichoice", 100)).toBe(3000);
  });

  it("defaults unknown type to 400 base", () => {
    expect(getMaxTokens("unknown_type", 2)).toBe(800);
  });

  it("treats count<=0 as count=1", () => {
    expect(getMaxTokens("gap_fill", 0)).toBe(300);
    expect(getMaxTokens("gap_fill", -5)).toBe(300);
  });
});
