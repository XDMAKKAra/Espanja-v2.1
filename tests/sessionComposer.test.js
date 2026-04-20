import { describe, it, expect } from "vitest";
import {
  buildSessionSlots,
  isColdStart,
  pickAdjacencyTopic,
  TOPIC_ADJACENCY,
  COLD_START_MIN_TOPICS,
  COLD_START_MIN_MASTERED,
} from "../lib/sessionComposer.js";

// ─── isColdStart ───────────────────────────────────────────────────────────

describe("isColdStart", () => {
  it("cold when 0 mastered topics", () =>
    expect(isColdStart([], 0)).toBe(true));

  it("cold when mastered topics < 2", () =>
    expect(isColdStart(["ser_estar"], 50)).toBe(true));

  it("cold when mastered items < 40 even with 2+ topics", () =>
    expect(isColdStart(["ser_estar", "hay_estar"], 39)).toBe(true));

  it("warm when ≥ 2 mastered topics AND ≥ 40 mastered items", () =>
    expect(isColdStart(["ser_estar", "hay_estar"], 40)).toBe(false));

  it("warm threshold is exactly 2 topics + 40 items", () => {
    expect(isColdStart(new Array(2).fill("t"), 40)).toBe(false);
    expect(isColdStart(new Array(2).fill("t"), 39)).toBe(true);
    expect(isColdStart(new Array(1).fill("t"), 40)).toBe(true);
  });
});

// ─── TOPIC_ADJACENCY ───────────────────────────────────────────────────────

describe("TOPIC_ADJACENCY", () => {
  it("ser_estar has 4 neighbors", () =>
    expect(TOPIC_ADJACENCY.ser_estar).toHaveLength(4));

  it("adjacency is mutual — ser_estar↔hay_estar", () => {
    expect(TOPIC_ADJACENCY.ser_estar).toContain("hay_estar");
    expect(TOPIC_ADJACENCY.hay_estar).toContain("ser_estar");
  });

  it("subjunctive↔conditional mutual", () => {
    expect(TOPIC_ADJACENCY.subjunctive).toContain("conditional");
    expect(TOPIC_ADJACENCY.conditional).toContain("subjunctive");
  });
});

// ─── buildSessionSlots — topic spread ─────────────────────────────────────

function makeDueCards(topicsWithCounts) {
  // topicsWithCounts: { ser_estar: 3, hay_estar: 3, conditional: 2 }
  const cards = [];
  let id = 1;
  for (const [topic, n] of Object.entries(topicsWithCounts)) {
    for (let i = 0; i < n; i++) {
      cards.push({ id: `card_${id++}`, word: `word_${id}`, topic, daysOverdue: i });
    }
  }
  return cards;
}

describe("buildSessionSlots — topic spread", () => {
  it("no more than 2 consecutive same-topic items in a 15-item session", () => {
    // 8 due cards across 3 topics + 7 new slots
    const due = makeDueCards({ ser_estar: 4, hay_estar: 2, conditional: 2 });
    const mastered = ["ser_estar", "hay_estar", "conditional", "subjunctive", "pronouns"];
    const slots = buildSessionSlots(due, mastered, 50, { reviews: 8, newCards: 7 });

    expect(slots).toHaveLength(15);

    let consecutive = 1;
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].topic === slots[i - 1].topic) {
        consecutive++;
        expect(consecutive).toBeLessThanOrEqual(2);
      } else {
        consecutive = 1;
      }
    }
  });

  it("all 3 topics appear in the review slots when 8 due items spread across 3 topics", () => {
    const due = makeDueCards({ ser_estar: 3, hay_estar: 3, conditional: 2 });
    const slots = buildSessionSlots(due, ["ser_estar", "hay_estar", "conditional"], 50, { reviews: 8, newCards: 0 });
    const reviewTopics = new Set(slots.filter(s => s.type === "review").map(s => s.topic));
    expect(reviewTopics.size).toBe(3);
  });

  it("review slots come before new slots", () => {
    const due = makeDueCards({ ser_estar: 3 });
    const slots = buildSessionSlots(due, ["ser_estar"], 50, { reviews: 3, newCards: 3 });
    const firstNew = slots.findIndex(s => s.type === "new");
    const lastReview = slots.map(s => s.type).lastIndexOf("review");
    expect(lastReview).toBeLessThan(firstNew);
  });
});

// ─── buildSessionSlots — cold-start ───────────────────────────────────────

describe("buildSessionSlots — cold-start path", () => {
  it("uses coldStartPath topics for new slots when cold", () => {
    const slots = buildSessionSlots([], [], 0, { reviews: 0, newCards: 4 }, {
      coldStartPath: ["present_regular", "present_irregular"],
    });
    expect(slots.every(s => s.type === "new")).toBe(true);
    expect(slots[0].topic).toBe("present_regular");
  });

  it("respects forceTopic over cold-start path", () => {
    const slots = buildSessionSlots([], [], 0, { reviews: 0, newCards: 3 }, {
      forceTopic: "subjunctive",
      coldStartPath: ["present_regular"],
    });
    expect(slots.every(s => s.topic === "subjunctive")).toBe(true);
  });
});

// ─── buildSessionSlots — slot shape ───────────────────────────────────────

describe("buildSessionSlots — slot shape", () => {
  it("review slots carry srCardId and word", () => {
    const due = [{ id: "abc", word: "estar", topic: "ser_estar", daysOverdue: 1 }];
    const slots = buildSessionSlots(due, ["ser_estar"], 50, { reviews: 1, newCards: 0 });
    expect(slots[0].srCardId).toBe("abc");
    expect(slots[0].word).toBe("estar");
  });

  it("new slots have null srCardId", () => {
    const slots = buildSessionSlots([], ["ser_estar"], 50, { reviews: 0, newCards: 2 });
    expect(slots.every(s => s.srCardId === null)).toBe(true);
  });

  it("every slot has type, topic, seedCollection", () => {
    const due = makeDueCards({ ser_estar: 2 });
    const slots = buildSessionSlots(due, ["ser_estar"], 50, { reviews: 2, newCards: 2 });
    for (const s of slots) {
      expect(s.type).toBeDefined();
      expect(s.topic).toBeDefined();
      expect(s.seedCollection).toBeDefined();
    }
  });
});
