import { describe, it, expect, beforeEach } from "vitest";
import {
  getHintStep, advanceHint, resetHint, trackWrongAttempt, getWrongCount,
} from "../js/features/hintLadder.js";

beforeEach(() => {
  resetHint("item1");
  resetHint("item2");
});

describe("hintLadder — getHintStep / advanceHint", () => {
  it("starts at 0 for unseen items", () => {
    expect(getHintStep("item1")).toBe(0);
  });

  it("advances step by 1 per call", () => {
    advanceHint("item1");
    expect(getHintStep("item1")).toBe(1);
    advanceHint("item1");
    expect(getHintStep("item1")).toBe(2);
  });

  it("caps at step 3", () => {
    advanceHint("item1");
    advanceHint("item1");
    advanceHint("item1");
    advanceHint("item1"); // should stay at 3
    expect(getHintStep("item1")).toBe(3);
  });

  it("advanceHint returns new step", () => {
    expect(advanceHint("item1")).toBe(1);
    expect(advanceHint("item1")).toBe(2);
  });
});

describe("hintLadder — resetHint", () => {
  it("resets step to 0", () => {
    advanceHint("item1");
    advanceHint("item1");
    resetHint("item1");
    expect(getHintStep("item1")).toBe(0);
  });

  it("resets wrong count", () => {
    trackWrongAttempt("item1");
    trackWrongAttempt("item1");
    resetHint("item1");
    expect(getWrongCount("item1")).toBe(0);
  });

  it("does not affect other items", () => {
    advanceHint("item2");
    resetHint("item1");
    expect(getHintStep("item2")).toBe(1);
  });
});

describe("hintLadder — trackWrongAttempt (acceptance criterion)", () => {
  it("1st wrong attempt: step stays at 0", () => {
    trackWrongAttempt("item1");
    expect(getHintStep("item1")).toBe(0);
  });

  it("2nd wrong attempt: auto-advances to step 1", () => {
    trackWrongAttempt("item1");
    trackWrongAttempt("item1");
    expect(getHintStep("item1")).toBe(1);
  });

  it("does not over-advance beyond step 1 on further wrong attempts", () => {
    trackWrongAttempt("item1");
    trackWrongAttempt("item1");
    trackWrongAttempt("item1");
    expect(getHintStep("item1")).toBe(1); // already at 1, further wrongs don't push further
  });

  it("does not auto-advance if already past step 0", () => {
    advanceHint("item1"); // manually at step 1
    trackWrongAttempt("item1");
    trackWrongAttempt("item1");
    expect(getHintStep("item1")).toBe(1); // stays at 1, not pushed to 2
  });

  it("returns current step", () => {
    trackWrongAttempt("item1"); // 1st wrong
    expect(trackWrongAttempt("item1")).toBe(1); // 2nd wrong → returns 1
  });
});
