import { describe, it, expect, beforeEach, vi } from "vitest";

// Test doubles: a simple in-memory user_level table + exercise_logs rows
const state = {
  userLevel: null,
  logs: [],
  lastUpsert: null,
  lastUpdate: null,
};

function resetState() {
  state.userLevel = null;
  state.logs = [];
  state.lastUpsert = null;
  state.lastUpdate = null;
}

function makeSelectChain(result) {
  return {
    select: () => ({
      eq: () => ({
        single: async () => result,
      }),
    }),
  };
}

function makeUpdateChain() {
  return {
    update: (patch) => {
      state.lastUpdate = patch;
      return {
        eq: async () => ({ data: null, error: null }),
      };
    },
  };
}

vi.mock("../supabase.js", () => ({
  default: {
    from: (table) => {
      if (table === "user_level") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({ data: state.userLevel, error: state.userLevel ? null : { code: "PGRST116" } }),
            }),
          }),
          upsert: async (row) => {
            state.lastUpsert = row;
            state.userLevel = { ...(state.userLevel || {}), ...row };
            return { data: null, error: null };
          },
          update: (patch) => {
            state.lastUpdate = patch;
            state.userLevel = { ...(state.userLevel || {}), ...patch };
            return { eq: async () => ({ data: null, error: null }) };
          },
        };
      }
      if (table === "exercise_logs") {
        return {
          select: () => ({
            eq: () => ({
              gte: () => ({
                not: () => ({
                  gt: async () => ({ data: state.logs, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return makeSelectChain({ data: null, error: null });
    },
  },
}));

const {
  LEVELS,
  getUserLevel,
  computeRollingAccuracy,
  refreshUserLevel,
  processCheckpointResult,
  levelDown,
  defaultScaffoldForLevel,
  progressToNextLevel,
} = await import("../lib/levelEngine.js");

beforeEach(() => {
  resetState();
});

describe("LEVELS ordering", () => {
  it("progresses I → A → B → C → M → E → L", () => {
    expect(LEVELS).toEqual(["I", "A", "B", "C", "M", "E", "L"]);
  });
});

describe("defaultScaffoldForLevel", () => {
  it("gives beginners full scaffolding", () => {
    expect(defaultScaffoldForLevel("I")).toBe(3);
    expect(defaultScaffoldForLevel("A")).toBe(3);
  });

  it("reduces scaffolding as level rises", () => {
    expect(defaultScaffoldForLevel("B")).toBe(2);
    expect(defaultScaffoldForLevel("C")).toBe(2);
    expect(defaultScaffoldForLevel("M")).toBe(1);
    expect(defaultScaffoldForLevel("E")).toBe(1);
    expect(defaultScaffoldForLevel("L")).toBe(0);
  });

  it("falls back to 2 for unknown levels", () => {
    expect(defaultScaffoldForLevel("Z")).toBe(2);
    expect(defaultScaffoldForLevel(undefined)).toBe(2);
  });
});

describe("progressToNextLevel", () => {
  it("returns 0 when user has too few sessions", () => {
    expect(progressToNextLevel(1.0, 2)).toBe(0);
  });

  it("is 100 when accuracy and session count are both at/above threshold", () => {
    expect(progressToNextLevel(0.70, 15)).toBe(100);
  });

  it("weights accuracy more heavily than session count", () => {
    // Low sessions but good accuracy still gives meaningful progress
    const mostlyAccuracy = progressToNextLevel(0.70, 5);
    const mostlySessions = progressToNextLevel(0.10, 15);
    expect(mostlyAccuracy).toBeGreaterThan(mostlySessions);
  });

  it("caps output at 100", () => {
    expect(progressToNextLevel(1.0, 100)).toBe(100);
  });
});

describe("getUserLevel", () => {
  it("creates a default level row at 'B' for a new user", async () => {
    state.userLevel = null;
    const level = await getUserLevel("user-1");
    expect(level.current_level).toBe("B");
    expect(state.lastUpsert.user_id).toBe("user-1");
  });

  it("returns the existing row for a known user", async () => {
    state.userLevel = { user_id: "user-1", current_level: "C", rolling_accuracy_30d: 0.8 };
    const level = await getUserLevel("user-1");
    expect(level.current_level).toBe("C");
    expect(state.lastUpsert).toBeNull();
  });
});

describe("computeRollingAccuracy", () => {
  it("returns zero when no logs exist", async () => {
    state.logs = [];
    const r = await computeRollingAccuracy("user-1");
    expect(r).toEqual({ accuracy: 0, sessionCount: 0, byTopic: {} });
  });

  it("computes accuracy from log rows and groups by mode", async () => {
    state.logs = [
      { mode: "grammar", score_correct: 8, score_total: 10 },
      { mode: "grammar", score_correct: 6, score_total: 10 },
      { mode: "vocab", score_correct: 10, score_total: 10 },
    ];
    const r = await computeRollingAccuracy("user-1");
    // 24/30
    expect(r.accuracy).toBeCloseTo(0.8, 5);
    expect(r.sessionCount).toBe(3);
    expect(r.byTopic.grammar.accuracy).toBeCloseTo(0.7, 5);
    expect(r.byTopic.vocab.accuracy).toBe(1);
  });

  it("labels untagged logs as 'general'", async () => {
    state.logs = [{ mode: null, score_correct: 5, score_total: 10 }];
    const r = await computeRollingAccuracy("user-1");
    expect(r.byTopic.general.total).toBe(10);
  });
});

describe("refreshUserLevel — checkpoint eligibility", () => {
  it("flags canCheckpoint when accuracy ≥ 0.7 and sessions ≥ 15", async () => {
    state.userLevel = { user_id: "u", current_level: "B", last_checkpoint_at: null };
    state.logs = Array.from({ length: 15 }, () => ({
      mode: "grammar", score_correct: 8, score_total: 10,
    }));
    const r = await refreshUserLevel("u");
    expect(r.canCheckpoint).toBe(true);
    expect(r.nextLevel).toBe("C");
  });

  it("does not flag canCheckpoint when session count is below minimum", async () => {
    state.userLevel = { user_id: "u", current_level: "B", last_checkpoint_at: null };
    state.logs = Array.from({ length: 10 }, () => ({
      mode: "grammar", score_correct: 10, score_total: 10,
    }));
    const r = await refreshUserLevel("u");
    expect(r.canCheckpoint).toBe(false);
  });

  it("honours the 7-day checkpoint cooldown", async () => {
    state.userLevel = {
      user_id: "u",
      current_level: "B",
      last_checkpoint_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    };
    state.logs = Array.from({ length: 20 }, () => ({
      mode: "grammar", score_correct: 10, score_total: 10,
    }));
    const r = await refreshUserLevel("u");
    expect(r.canCheckpoint).toBe(false);
  });

  it("returns nextLevel=null at the top level (L)", async () => {
    state.userLevel = { user_id: "u", current_level: "L", last_checkpoint_at: null };
    const r = await refreshUserLevel("u");
    expect(r.nextLevel).toBeNull();
    expect(r.canCheckpoint).toBeFalsy();
  });

  it("flags shouldWarnDown when accuracy is critically low", async () => {
    state.userLevel = { user_id: "u", current_level: "C", level_down_warned: false };
    state.logs = Array.from({ length: 10 }, () => ({
      mode: "grammar", score_correct: 2, score_total: 10,
    }));
    const r = await refreshUserLevel("u");
    expect(r.shouldWarnDown).toBe(true);
  });

  it("does not re-warn a user who was already warned", async () => {
    state.userLevel = { user_id: "u", current_level: "C", level_down_warned: true };
    state.logs = Array.from({ length: 10 }, () => ({
      mode: "grammar", score_correct: 2, score_total: 10,
    }));
    const r = await refreshUserLevel("u");
    expect(r.shouldWarnDown).toBe(false);
  });
});

describe("processCheckpointResult", () => {
  it("levels the user up when they score ≥ 80%", async () => {
    state.userLevel = { user_id: "u", current_level: "B" };
    const r = await processCheckpointResult("u", 16, 20);
    expect(r.passed).toBe(true);
    expect(r.previousLevel).toBe("B");
    expect(r.newLevel).toBe("C");
    expect(state.lastUpdate.current_level).toBe("C");
  });

  it("does not level up on a failed checkpoint", async () => {
    state.userLevel = { user_id: "u", current_level: "B" };
    const r = await processCheckpointResult("u", 10, 20);
    expect(r.passed).toBe(false);
    expect(r.newLevel).toBe("B");
    expect(state.lastUpdate.current_level).toBeUndefined();
  });

  it("does not promote past the top level (L)", async () => {
    state.userLevel = { user_id: "u", current_level: "L" };
    const r = await processCheckpointResult("u", 20, 20);
    expect(r.passed).toBe(true);
    expect(r.newLevel).toBe("L");
  });
});

describe("levelDown", () => {
  it("demotes to the previous level", async () => {
    state.userLevel = { user_id: "u", current_level: "C" };
    const r = await levelDown("u");
    expect(r.current_level).toBe("B");
  });

  it("is a no-op at the bottom level (I)", async () => {
    state.userLevel = { user_id: "u", current_level: "I" };
    const r = await levelDown("u");
    expect(r.current_level).toBe("I");
  });
});
