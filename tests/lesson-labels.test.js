import { describe, it, expect } from "vitest";
import { getLessonLabel } from "../lib/lessonLabels.js";

describe("getLessonLabel", () => {
  it("formats kurssi_X_lesson_Y with focus", () => {
    const out = getLessonLabel("kurssi_1_lesson_2");
    expect(out).toMatch(/Kurssi 1 · oppitunti 2/);
    expect(out).toMatch(/-ar-verbit/);
  });

  it("formats kurssi_X_review", () => {
    const out = getLessonLabel("kurssi_1_review");
    expect(out).toMatch(/Kurssi 1/);
    expect(out).toMatch(/yleiskertaus/);
  });

  it("returns the raw key on unknown shape", () => {
    expect(getLessonLabel("nonsense")).toBe("nonsense");
  });

  it("handles empty / null input", () => {
    expect(getLessonLabel("")).toBe("");
    expect(getLessonLabel(null)).toBe("");
  });

  it("falls back gracefully when kurssi exists but lesson is out of range", () => {
    const out = getLessonLabel("kurssi_1_lesson_99");
    expect(out).toMatch(/Kurssi 1/);
    expect(out).toMatch(/oppitunti 99/);
  });
});
