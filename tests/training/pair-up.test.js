/**
 * Unit tests for the pure pairUp(src, dst, state) helper (Commit 12).
 * Drives the keyboard-first matching flow: first click selects, second click
 * either pairs or misses, already-matched items are inert, and the game is
 * "done" when every pair is matched.
 */
import { describe, it, expect } from "vitest";
import { pairUp } from "../../js/features/answerGrading.js";

const initial = (pairs) => ({ pairs, matched: new Set(), selected: null });
const sample = [
  { spanish: "hola", finnish: "hei" },
  { spanish: "adiós", finnish: "näkemiin" },
];

describe("pairUp", () => {
  it("first click selects the source", () => {
    const s = pairUp("hola", null, initial(sample));
    expect(s.outcome).toBe("selected");
    expect(s.selected).toBe("hola");
    expect(s.matched.size).toBe(0);
  });

  it("correct second click matches and clears selection", () => {
    let s = pairUp("hola", null, initial(sample));
    s = pairUp(null, "hola", s);
    expect(s.outcome).toBe("matched");
    expect(s.matched.has("hola")).toBe(true);
    expect(s.selected).toBe(null);
  });

  it("wrong second click leaves selection intact with outcome=miss", () => {
    let s = pairUp("hola", null, initial(sample));
    s = pairUp(null, "adiós", s); // user clicks the wrong Finnish side
    expect(s.outcome).toBe("miss");
    expect(s.selected).toBe("hola");
    expect(s.matched.size).toBe(0);
  });

  it("clicking an already-matched destination is ignored", () => {
    let s = pairUp("hola", null, initial(sample));
    s = pairUp(null, "hola", s);             // match
    s = pairUp("adiós", null, s);            // new selection
    s = pairUp(null, "hola", s);             // try to pair to already-matched
    expect(s.outcome).toBe("ignored");
    expect(s.selected).toBe("adiós");
  });

  it("done flag flips true when all pairs are matched", () => {
    let s = initial(sample);
    s = pairUp("hola", null, s);  s = pairUp(null, "hola", s);
    s = pairUp("adiós", null, s); s = pairUp(null, "adiós", s);
    expect(s.done).toBe(true);
    expect(s.matched.size).toBe(2);
  });

  it("selecting an already-matched source is a noop", () => {
    let s = initial(sample);
    s = pairUp("hola", null, s);
    s = pairUp(null, "hola", s);             // matched
    s = pairUp("hola", null, s);             // try to re-select
    expect(s.outcome).toBe("noop");
  });
});
