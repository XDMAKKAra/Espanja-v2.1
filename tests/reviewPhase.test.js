// L-V411 Vaihe C — synthetic review phase construction (client glue, pure part).

import { describe, it, expect } from "vitest";
import { REVIEW_PHASE_ID, buildReviewPhase } from "../js/lib/reviewPhase.js";

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
