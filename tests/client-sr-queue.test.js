// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";

// api.js: force guest path in every test so we exercise the localStorage fallback.
vi.mock("../js/api.js", () => ({
  API: "",
  isLoggedIn: () => false,
  authHeader: () => ({}),
  apiFetch: vi.fn(),
}));

import { srReview, srGetDue, srDueCount, srAddWrong, srMarkCorrect, srPop } from "../js/features/spacedRepetition.js";

const SR_KEY = "puheo_sr_queue";

beforeEach(() => {
  localStorage.clear();
});

describe("guest SR queue — srReview", () => {
  it("adds item to queue when grade < 3", async () => {
    await srReview({ question: "hola" }, 0);
    const q = JSON.parse(localStorage.getItem(SR_KEY));
    expect(q.length).toBe(1);
    expect(q[0].question).toBe("hola");
    expect(q[0]._sr).toBe(true);
  });

  it("removes item from queue when grade >= 3", async () => {
    await srReview({ question: "hola" }, 0);
    await srReview({ question: "hola" }, 4);
    const q = JSON.parse(localStorage.getItem(SR_KEY));
    expect(q.length).toBe(0);
  });

  it("does not duplicate an existing question", async () => {
    await srReview({ question: "hola" }, 0);
    await srReview({ question: "hola" }, 0);
    await srReview({ question: "hola" }, 1);
    const q = JSON.parse(localStorage.getItem(SR_KEY));
    expect(q.length).toBe(1);
  });

  it("keeps multiple distinct questions", async () => {
    await srReview({ question: "hola" }, 0);
    await srReview({ question: "adiós" }, 0);
    await srReview({ question: "gracias" }, 1);
    const q = JSON.parse(localStorage.getItem(SR_KEY));
    expect(q.length).toBe(3);
  });

  it("truncates at SR_MAX=20 items (FIFO)", async () => {
    for (let i = 0; i < 25; i++) {
      await srReview({ question: `word_${i}` }, 0);
    }
    const q = JSON.parse(localStorage.getItem(SR_KEY));
    expect(q.length).toBeLessThanOrEqual(20);
  });
});

describe("guest SR queue — srGetDue / srDueCount / srPop", () => {
  it("srGetDue returns up to `limit` items", async () => {
    for (let i = 0; i < 5; i++) await srReview({ question: `w_${i}` }, 0);
    const due = await srGetDue(3);
    expect(due.length).toBe(3);
    expect(due.every(x => x._sr === true)).toBe(true);
  });

  it("srGetDue returns all when limit exceeds queue", async () => {
    await srReview({ question: "hola" }, 0);
    const due = await srGetDue(50);
    expect(due.length).toBe(1);
  });

  it("srDueCount returns queue length", async () => {
    await srReview({ question: "a" }, 0);
    await srReview({ question: "b" }, 0);
    expect(await srDueCount()).toBe(2);
  });

  it("srPop removes and returns n items (guest only)", async () => {
    await srReview({ question: "a" }, 0);
    await srReview({ question: "b" }, 0);
    await srReview({ question: "c" }, 0);
    const popped = srPop(2);
    expect(popped.length).toBe(2);
    expect(await srDueCount()).toBe(1);
  });
});

describe("legacy compat — srAddWrong / srMarkCorrect", () => {
  it("srAddWrong adds to queue (quality 0)", async () => {
    srAddWrong({ question: "hola" });
    // fire-and-forget — flush microtasks
    await new Promise(r => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem(SR_KEY)).length).toBe(1);
  });

  it("srMarkCorrect removes from queue (quality 4)", async () => {
    await srReview({ question: "hola" }, 0);
    srMarkCorrect({ question: "hola" });
    await new Promise(r => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem(SR_KEY)).length).toBe(0);
  });
});

describe("robustness", () => {
  it("tolerates corrupt localStorage payload", async () => {
    localStorage.setItem(SR_KEY, "not-json");
    // Should not throw; treats as empty
    await srReview({ question: "hola" }, 0);
    const q = JSON.parse(localStorage.getItem(SR_KEY));
    expect(q.length).toBe(1);
  });

  it("srDueCount returns 0 on corrupt payload", async () => {
    localStorage.setItem(SR_KEY, "{not-valid");
    expect(await srDueCount()).toBe(0);
  });
});
