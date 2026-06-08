// L-V411 Vaihe C — synthetic review phase construction (client glue, pure part).

import { describe, it, expect } from "vitest";
import { REVIEW_PHASE_ID, buildReviewPhase, toGradedItem } from "../js/lib/reviewPhase.js";

describe("buildReviewPhase", () => {
  it("produces a renderable phase tagged for SR calibration", () => {
    const phase = buildReviewPhase({
      items: [
        { item_type: "mc", stem: "x", choices: ["a", "b"], correct_index: 0, _concept: "subjunctive" },
        { item_type: "gap_fill", sentence_template: "y {1}", _concept: "ser_estar" },
      ],
    });
    expect(phase.phase_id).toBe(REVIEW_PHASE_ID);
    expect(phase._isReview).toBe(true);
    expect(phase.title).toBe("Kertaus");
    expect(phase.items).toHaveLength(2);
    // each item tagged with its concept so captureGraded routes SR to it
    expect(phase.items[0].topics).toEqual(["subjunctive"]);
    expect(phase.items[1].topics).toEqual(["ser_estar"]);
    // original item fields preserved (renderItem dispatches on item_type)
    expect(phase.items[0].item_type).toBe("mc");
    expect(phase.items[0].choices).toEqual(["a", "b"]);
  });

  it("keeps an existing topics array if present, and tolerates missing concept", () => {
    const phase = buildReviewPhase({
      items: [
        { item_type: "typed", prompt: "z", topics: ["future", "irregular_verbs"] },
        { item_type: "mc", stem: "no concept" },
      ],
    });
    expect(phase.items[0].topics).toEqual(["future", "irregular_verbs"]);
    expect(phase.items[1].topics).toEqual([]);
  });

  it("uses a neutral mastery threshold so the review phase never shames or blocks", () => {
    const phase = buildReviewPhase({ items: [] });
    expect(Object.values(phase.mastery_threshold).every((v) => v <= 0.5)).toBe(true);
    expect(phase.skip_for_targets).toEqual([]);
  });
});

describe("toGradedItem — capture payload mapping (digikirja port)", () => {
  it("mc: resolves student + correct answers from choices, carries concept", () => {
    const item = { item_type: "mc", stem: "Quiero que ella ___.", choices: ["es", "sea"], correct_index: 1, explanation: "subj", _concept: "subjunctive" };
    const g = toGradedItem(item, { correct: false, choiceIndex: 0 }, { phase_type: "review_mixed", title: "Kertaus" });
    expect(g.itemType).toBe("mc");
    expect(g.correct).toBe(false);
    expect(g.studentAnswer).toBe("es");
    expect(g.correctAnswer).toBe("sea");
    expect(g.topics).toEqual(["subjunctive"]);
    expect(g.phaseType).toBe("review_mixed");
  });

  it("typed: uses userAnswer + first accept; gap_fill joins arrays", () => {
    const typed = toGradedItem(
      { item_type: "typed", prompt: "tener yo", accept: ["tendré", "tengo"] },
      { correct: true, userAnswer: "tendré" }, {});
    expect(typed.studentAnswer).toBe("tendré");
    expect(typed.correctAnswer).toBe("tendré");

    const gap = toGradedItem(
      { item_type: "gap_fill", sentence_template: "{1} y {2}", answers: [["soy"], ["estoy"]] },
      { correct: false, userAnswer: ["es", "esta"] }, {});
    expect(gap.studentAnswer).toBe("es, esta");
    expect(gap.correctAnswer).toBe("soy, estoy");
  });

  it("authored item with no concept yields empty topics (server infers)", () => {
    const g = toGradedItem({ item_type: "mc", stem: "x", choices: ["a", "b"], correct_index: 0 }, { correct: true, choiceIndex: 0 }, {});
    expect(g.topics).toEqual([]);
  });
});
