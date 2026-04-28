import { describe, it, expect } from "vitest";
import { computeReadinessMap } from "../js/features/writingProgression.js";

describe("computeReadinessMap (L48-hotfix)", () => {
  it("does not include phantom writing cells when writingDims is null", () => {
    const r = computeReadinessMap({
      learningPath: [
        { key: "a", label: "A", short: "A", status: "mastered", bestPct: 1 },
        { key: "b", label: "B", short: "B", status: "mastered", bestPct: 1 },
        { key: "c", label: "C", short: "C", status: "in_progress", bestPct: 0.7 },
      ],
      writingDims: null,
    });
    expect(r.totalCells).toBe(3);
    expect(r.cells.every(c => c.kind === "path")).toBe(true);
    // 2 mastered (lvl 4) + 1 in-progress with 70% (lvl 3) = (4+4+3)/(3*4) = 91.6% → 92
    expect(r.readinessPct).toBeGreaterThanOrEqual(75);
  });

  it("includes writing cells when writingDims is provided", () => {
    const r = computeReadinessMap({
      learningPath: [
        { key: "a", label: "A", short: "A", status: "mastered", bestPct: 1 },
      ],
      writingDims: {
        viestinnallisyys: { label: "Viestinnällisyys", avg: 3.5, count: 4 },
        kielen_rakenteet: { label: "Rakenteet", avg: 2.5, count: 4 },
        sanasto: { label: "Sanasto", avg: 4.2, count: 4 },
        kokonaisuus: { label: "Kokonaisuus", avg: 3.0, count: 4 },
      },
    });
    expect(r.totalCells).toBe(5);
    expect(r.cells.filter(c => c.kind === "writing")).toHaveLength(4);
  });

  it("returns 0 when there are no cells at all", () => {
    const r = computeReadinessMap({ learningPath: [], writingDims: null });
    expect(r.totalCells).toBe(0);
    expect(r.readinessPct).toBe(0);
  });
});
