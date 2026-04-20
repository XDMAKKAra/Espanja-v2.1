import { describe, it, expect } from "vitest";
import {
  TOPIC_LABELS,
  VALID_TOPICS,
  topicLabel,
  normalizeTopics,
  inferTopics,
} from "../lib/mistakeTaxonomy.js";

describe("topicLabel", () => {
  it("returns the Finnish label for a known key", () => {
    expect(topicLabel("ser_estar")).toBe("ser vs. estar");
    expect(topicLabel("subjunctive")).toBe("Subjunktiivi");
  });

  it("returns the key itself for an unknown topic", () => {
    expect(topicLabel("not_a_topic")).toBe("not_a_topic");
  });

  it("every key in TOPIC_LABELS is mirrored in VALID_TOPICS", () => {
    for (const key of Object.keys(TOPIC_LABELS)) {
      expect(VALID_TOPICS.has(key)).toBe(true);
    }
  });
});

describe("normalizeTopics", () => {
  it("returns [] for non-arrays", () => {
    expect(normalizeTopics(null)).toEqual([]);
    expect(normalizeTopics(undefined)).toEqual([]);
    expect(normalizeTopics("ser_estar")).toEqual([]);
    expect(normalizeTopics({ 0: "ser_estar" })).toEqual([]);
  });

  it("filters invalid topics", () => {
    expect(normalizeTopics(["ser_estar", "totally_made_up"])).toEqual(["ser_estar"]);
  });

  it("lower-cases and trims entries", () => {
    expect(normalizeTopics(["  SER_ESTAR ", "Subjunctive"])).toEqual(["ser_estar", "subjunctive"]);
  });

  it("strips non a-z_ characters before validating", () => {
    // "ser-estar" → "serestar" (invalid), "ser_estar!" → "ser_estar" (valid)
    expect(normalizeTopics(["ser_estar!", "ser-estar"])).toEqual(["ser_estar"]);
  });

  it("caps at 3 entries", () => {
    const topics = ["ser_estar", "subjunctive", "future", "conditional", "imperative"];
    expect(normalizeTopics(topics)).toHaveLength(3);
  });

  it("drops non-string entries", () => {
    expect(normalizeTopics(["ser_estar", 42, null, {}, "future"])).toEqual(["ser_estar", "future"]);
  });
});

describe("inferTopics", () => {
  it("returns [] when no patterns match", () => {
    expect(inferTopics({ question: "xyz qqq" })).toEqual([]);
  });

  it("detects ser_estar from keywords", () => {
    const topics = inferTopics({ sentence: "Usamos el verbo ser aquí." });
    expect(topics).toContain("ser_estar");
  });

  it("detects subjunctive from trigger words", () => {
    const topics = inferTopics({ sentence: "Ojalá esté en casa." });
    expect(topics).toContain("subjunctive");
  });

  it("detects por_para when both appear", () => {
    const topics = inferTopics({ sentence: "Compré el regalo por ti, para mi madre." });
    expect(topics).toContain("por_para");
  });

  it("caps inferred topics at 3", () => {
    const topics = inferTopics({
      question: "ser estar preteriti konditionaali gustaría gustar preposit ojalá",
    });
    expect(topics.length).toBeLessThanOrEqual(3);
  });

  it("does not duplicate a topic that matches twice", () => {
    const topics = inferTopics({ question: "ser", sentence: "ser", explanation: "ser estar" });
    const occurrences = topics.filter(t => t === "ser_estar").length;
    expect(occurrences).toBe(1);
  });
});
