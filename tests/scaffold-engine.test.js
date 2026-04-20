import { describe, it, expect, beforeEach, vi } from "vitest";

const state = { row: null, lastUpsert: null, lastUpdate: null };

vi.mock("../supabase.js", () => ({
  default: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({ data: state.row, error: state.row ? null : { code: "PGRST116" } }),
          }),
        }),
      }),
      upsert: async (row) => {
        state.lastUpsert = row;
        state.row = { ...(state.row || {}), ...row };
        return { data: null, error: null };
      },
      update: (patch) => {
        state.lastUpdate = patch;
        state.row = { ...(state.row || {}), ...patch };
        return {
          eq: () => ({
            eq: async () => ({ data: null, error: null }),
          }),
        };
      },
    }),
  },
}));

const { getSessionState, processAnswer, describeScaffold, scaffoldPromptFragment } =
  await import("../lib/scaffoldEngine.js");

beforeEach(() => {
  state.row = null;
  state.lastUpsert = null;
  state.lastUpdate = null;
});

describe("describeScaffold", () => {
  it("level 3 unlocks options, hints, and translation", () => {
    expect(describeScaffold(3)).toEqual({
      showOptions: true,
      showHint: true,
      showTranslation: true,
      level: 3,
    });
  });

  it("level 2 unlocks options + hint but not translation", () => {
    const d = describeScaffold(2);
    expect(d.showOptions).toBe(true);
    expect(d.showHint).toBe(true);
    expect(d.showTranslation).toBe(false);
  });

  it("level 1 unlocks only a hint", () => {
    const d = describeScaffold(1);
    expect(d.showOptions).toBe(false);
    expect(d.showHint).toBe(true);
    expect(d.showTranslation).toBe(false);
  });

  it("level 0 gives no help at all", () => {
    const d = describeScaffold(0);
    expect(d.showOptions).toBe(false);
    expect(d.showHint).toBe(false);
    expect(d.showTranslation).toBe(false);
  });
});

describe("scaffoldPromptFragment", () => {
  it("emits FULL text for level ≥ 3", () => {
    expect(scaffoldPromptFragment(3)).toMatch(/FULL/);
  });

  it("emits MEDIUM text for level 2", () => {
    expect(scaffoldPromptFragment(2)).toMatch(/MEDIUM/);
  });

  it("emits MINIMAL text for level 1", () => {
    expect(scaffoldPromptFragment(1)).toMatch(/MINIMAL/);
  });

  it("emits NONE text for level 0", () => {
    expect(scaffoldPromptFragment(0)).toMatch(/NONE/);
  });
});

describe("getSessionState", () => {
  it("creates a new session with the level default scaffold", async () => {
    state.row = null;
    const s = await getSessionState("u", "grammar", "A");
    expect(s.scaffold_level).toBe(3); // level A default
    expect(s.correct_streak).toBe(0);
    expect(state.lastUpsert).toBeTruthy();
  });

  it("resets a session that expired more than 30 min ago", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 0,
      correct_streak: 5,
      wrong_streak: 0,
      updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    };
    const s = await getSessionState("u", "grammar", "B");
    expect(s.scaffold_level).toBe(2); // reset to B default
    expect(s.correct_streak).toBe(0);
    expect(state.lastUpdate).toBeTruthy();
  });

  it("keeps an active session intact", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 1,
      correct_streak: 2,
      wrong_streak: 0,
      updated_at: new Date().toISOString(),
    };
    const s = await getSessionState("u", "grammar", "B");
    expect(s.scaffold_level).toBe(1);
    expect(s.correct_streak).toBe(2);
    expect(state.lastUpdate).toBeNull();
  });
});

describe("processAnswer — scaffold adjustment", () => {
  it("decreases scaffold after 3 correct in a row", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 3,
      correct_streak: 2,
      wrong_streak: 0,
      updated_at: new Date().toISOString(),
    };
    const r = await processAnswer("u", "grammar", true, "A");
    expect(r.scaffoldChanged).toBe(true);
    expect(r.direction).toBe("down");
    expect(r.scaffoldLevel).toBe(2);
    expect(r.correctStreak).toBe(0); // reset after adjustment
  });

  it("increases scaffold after 2 wrong in a row", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 1,
      correct_streak: 0,
      wrong_streak: 1,
      updated_at: new Date().toISOString(),
    };
    const r = await processAnswer("u", "grammar", false, "B");
    expect(r.scaffoldChanged).toBe(true);
    expect(r.direction).toBe("up");
    expect(r.scaffoldLevel).toBe(2);
    expect(r.wrongStreak).toBe(0);
  });

  it("does not drop below 0", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 0,
      correct_streak: 2,
      wrong_streak: 0,
      updated_at: new Date().toISOString(),
    };
    const r = await processAnswer("u", "grammar", true, "L");
    expect(r.scaffoldLevel).toBe(0);
    expect(r.scaffoldChanged).toBe(false);
  });

  it("does not climb above 3", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 3,
      correct_streak: 0,
      wrong_streak: 1,
      updated_at: new Date().toISOString(),
    };
    const r = await processAnswer("u", "grammar", false, "A");
    expect(r.scaffoldLevel).toBe(3);
    expect(r.scaffoldChanged).toBe(false);
  });

  it("resets wrong_streak on a correct answer", async () => {
    state.row = {
      user_id: "u",
      topic: "grammar",
      scaffold_level: 2,
      correct_streak: 0,
      wrong_streak: 1,
      updated_at: new Date().toISOString(),
    };
    const r = await processAnswer("u", "grammar", true, "B");
    expect(r.wrongStreak).toBe(0);
    expect(r.correctStreak).toBe(1);
    expect(r.scaffoldChanged).toBe(false);
  });
});
