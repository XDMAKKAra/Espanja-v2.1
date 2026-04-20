import { describe, it, expect, beforeEach, vi } from "vitest";

const state = {
  masteryRows: [],
  existing: null,
  upserts: [],
};

function selectForUserMastery() {
  return {
    eq: (_field, _value) => {
      // Second eq applies a topic_key filter — peel it off and do a simple lookup
      return {
        single: async () => ({ data: state.existing, error: state.existing ? null : { code: "PGRST116" } }),
        eq: () => ({
          single: async () => ({ data: state.existing, error: state.existing ? null : { code: "PGRST116" } }),
        }),
      };
    },
  };
}

vi.mock("../supabase.js", () => ({
  default: {
    from: (table) => {
      if (table === "user_mastery") {
        return {
          select: (cols) => {
            // For getUserPath: .select("*").eq("user_id", id) — returns all rows
            // For recordMasteryAttempt: .select("*").eq().eq().single() — returns one
            // For getMasteredTopics: .select("topic_key").eq().eq() — awaited
            const listChain = {
              eq: () => {
                const node = {
                  eq: () => ({
                    single: async () => ({ data: state.existing, error: state.existing ? null : { code: "PGRST116" } }),
                    then: (resolve) => resolve({ data: state.masteryRows.filter(r => r.status === "mastered"), error: null }),
                  }),
                  single: async () => ({ data: state.existing, error: state.existing ? null : { code: "PGRST116" } }),
                  then: (resolve) => resolve({ data: state.masteryRows, error: null }),
                };
                return node;
              },
            };
            return listChain;
          },
          upsert: async (row) => {
            state.upserts.push(row);
            return { data: null, error: null };
          },
        };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) };
    },
  },
}));

const {
  LEARNING_PATH,
  MASTERY_THRESHOLD,
  MASTERY_TEST_SIZE,
  getTopicByKey,
  getNextTopicKey,
  getUserPath,
  recordMasteryAttempt,
  getMasteredTopics,
} = await import("../lib/learningPath.js");

beforeEach(() => {
  state.masteryRows = [];
  state.existing = null;
  state.upserts = [];
});

describe("LEARNING_PATH constants", () => {
  it("declares mastery thresholds", () => {
    expect(MASTERY_THRESHOLD).toBe(0.80);
    expect(MASTERY_TEST_SIZE).toBe(20);
  });

  it("every topic has key, label, level, and promptFocus", () => {
    for (const topic of LEARNING_PATH) {
      expect(topic.key).toBeTruthy();
      expect(topic.label).toBeTruthy();
      expect(topic.level).toMatch(/^[IABCMEL]$/);
      expect(topic.promptFocus).toBeTruthy();
    }
  });

  it("topic keys are unique", () => {
    const keys = LEARNING_PATH.map(t => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("getTopicByKey", () => {
  it("returns the full topic object for a known key", () => {
    const t = getTopicByKey("preterite");
    expect(t.label).toMatch(/Preteriti/);
  });

  it("returns null for an unknown key", () => {
    expect(getTopicByKey("not-a-topic")).toBeNull();
  });
});

describe("getNextTopicKey", () => {
  it("advances to the next key in the path", () => {
    expect(getNextTopicKey("present_regular")).toBe("present_irregular");
    expect(getNextTopicKey("preterite")).toBe("imperfect");
  });

  it("returns null for the last topic", () => {
    expect(getNextTopicKey("subjunctive_imperfect")).toBeNull();
  });

  it("returns null for an unknown key", () => {
    expect(getNextTopicKey("made_up")).toBeNull();
  });
});

describe("getUserPath", () => {
  it("first topic is available when user has no mastery rows", async () => {
    state.masteryRows = [];
    const path = await getUserPath("u");
    expect(path[0].status).toBe("available");
    expect(path[1].status).toBe("locked");
  });

  it("next topic unlocks once the previous one is mastered", async () => {
    state.masteryRows = [
      { topic_key: "present_regular", status: "mastered", best_pct: 0.9, best_score: 18, attempts: 1 },
    ];
    const path = await getUserPath("u");
    const regular = path.find(t => t.key === "present_regular");
    const irregular = path.find(t => t.key === "present_irregular");
    expect(regular.status).toBe("mastered");
    expect(irregular.status).toBe("available");
  });

  it("deeper topics stay locked when predecessor is not mastered", async () => {
    state.masteryRows = [
      { topic_key: "present_regular", status: "in_progress", best_pct: 0.5, best_score: 10, attempts: 2 },
    ];
    const path = await getUserPath("u");
    expect(path.find(t => t.key === "present_irregular").status).toBe("locked");
  });
});

describe("recordMasteryAttempt", () => {
  it("throws for an invalid topic key", async () => {
    await expect(recordMasteryAttempt("u", "made_up", 5, 10)).rejects.toThrow();
  });

  it("marks mastered + unlocks next when pct >= 80%", async () => {
    state.existing = null;
    const r = await recordMasteryAttempt("u", "present_regular", 17, 20);
    expect(r.passed).toBe(true);
    expect(r.newlyMastered).toBe(true);
    expect(r.unlockedNext).toBe("present_irregular");

    const [primary, unlock] = state.upserts;
    expect(primary.topic_key).toBe("present_regular");
    expect(primary.status).toBe("mastered");
    expect(unlock.topic_key).toBe("present_irregular");
    expect(unlock.status).toBe("available");
  });

  it("marks in_progress without unlocking when below threshold", async () => {
    state.existing = null;
    const r = await recordMasteryAttempt("u", "preterite", 10, 20);
    expect(r.passed).toBe(false);
    expect(r.newlyMastered).toBe(false);
    expect(r.unlockedNext).toBeNull();
    expect(state.upserts[0].status).toBe("in_progress");
  });

  it("preserves an already-mastered status on a failed retake", async () => {
    state.existing = {
      topic_key: "preterite",
      status: "mastered",
      best_pct: 0.95,
      best_score: 19,
      attempts: 1,
      mastered_at: "2025-01-01T00:00:00Z",
    };
    const r = await recordMasteryAttempt("u", "preterite", 10, 20);
    expect(r.passed).toBe(false); // this attempt failed
    expect(state.upserts[0].status).toBe("mastered"); // but overall still mastered
    expect(state.upserts[0].best_pct).toBe(0.95); // best preserved
  });

  it("does not treat already-mastered as newlyMastered even when passing again", async () => {
    state.existing = {
      topic_key: "preterite",
      status: "mastered",
      best_pct: 0.90,
      best_score: 18,
      attempts: 1,
      mastered_at: "2025-01-01T00:00:00Z",
    };
    const r = await recordMasteryAttempt("u", "preterite", 20, 20);
    expect(r.passed).toBe(true);
    expect(r.newlyMastered).toBe(false);
    expect(r.unlockedNext).toBeNull();
  });

  it("never unlocks past the last topic", async () => {
    state.existing = null;
    const r = await recordMasteryAttempt("u", "subjunctive_imperfect", 20, 20);
    expect(r.passed).toBe(true);
    expect(r.unlockedNext).toBeNull();
  });
});

describe("getMasteredTopics", () => {
  it("returns an empty list when nothing is mastered", async () => {
    state.masteryRows = [];
    const list = await getMasteredTopics("u");
    expect(list).toEqual([]);
  });

  it("returns only mastered topic keys", async () => {
    state.masteryRows = [
      { topic_key: "present_regular", status: "mastered" },
      { topic_key: "preterite", status: "mastered" },
    ];
    const list = await getMasteredTopics("u");
    expect(list).toEqual(["present_regular", "preterite"]);
  });
});
