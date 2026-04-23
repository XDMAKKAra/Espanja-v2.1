import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isExamWeek, isOpenAIDisabled, isFeatureDisabled, ExamWeekBlockedError,
} from "../lib/featureFlags.js";

const ORIGINAL_EXAM = process.env.EXAM_WEEK;
const ORIGINAL_DISABLED = process.env.OPENAI_DISABLED;

beforeEach(() => {
  delete process.env.EXAM_WEEK;
  delete process.env.OPENAI_DISABLED;
});
afterEach(() => {
  process.env.EXAM_WEEK = ORIGINAL_EXAM ?? "";
  process.env.OPENAI_DISABLED = ORIGINAL_DISABLED ?? "";
});

describe("isExamWeek", () => {
  it("false when env is unset", () => {
    expect(isExamWeek()).toBe(false);
  });
  it("true only when EXAM_WEEK=='true' exact string", () => {
    process.env.EXAM_WEEK = "true";
    expect(isExamWeek()).toBe(true);
    process.env.EXAM_WEEK = "TRUE";
    expect(isExamWeek()).toBe(false);
    process.env.EXAM_WEEK = "1";
    expect(isExamWeek()).toBe(false);
  });
});

describe("isOpenAIDisabled", () => {
  it("false when neither flag is set", () => {
    expect(isOpenAIDisabled()).toBe(false);
  });
  it("true when EXAM_WEEK=true", () => {
    process.env.EXAM_WEEK = "true";
    expect(isOpenAIDisabled()).toBe(true);
  });
  it("true when OPENAI_DISABLED=true (independent of exam week)", () => {
    process.env.OPENAI_DISABLED = "true";
    expect(isOpenAIDisabled()).toBe(true);
  });
  it("true when both are set", () => {
    process.env.EXAM_WEEK = "true";
    process.env.OPENAI_DISABLED = "true";
    expect(isOpenAIDisabled()).toBe(true);
  });
});

describe("isFeatureDisabled", () => {
  it("always false outside exam week", () => {
    expect(isFeatureDisabled("experimental_grammar_drill_v2")).toBe(false);
    expect(isFeatureDisabled("anything")).toBe(false);
  });
  it("true in exam week for listed feature", () => {
    process.env.EXAM_WEEK = "true";
    expect(isFeatureDisabled("experimental_grammar_drill_v2")).toBe(true);
  });
  it("false in exam week for unknown feature (conservative)", () => {
    process.env.EXAM_WEEK = "true";
    expect(isFeatureDisabled("core_grading")).toBe(false);
  });
});

describe("callOpenAI honours the exam-week flag", () => {
  it("throws ExamWeekBlockedError when EXAM_WEEK=true", async () => {
    process.env.EXAM_WEEK = "true";
    // Import fresh so the circuit-breaker state doesn't leak across tests
    const { callOpenAI } = await import("../lib/openai.js");
    await expect(callOpenAI("test prompt", 100)).rejects.toBeInstanceOf(ExamWeekBlockedError);
  });

  it("error is catchable by name/code for callers that fall back to bank", async () => {
    process.env.EXAM_WEEK = "true";
    const { callOpenAI } = await import("../lib/openai.js");
    try {
      await callOpenAI("x", 100);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err.code).toBe("EXAM_WEEK_BLOCKED");
      expect(err.name).toBe("ExamWeekBlockedError");
    }
  });
});
