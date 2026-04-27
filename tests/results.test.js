import { describe, it, expect } from "vitest";
import { generateCoachLine } from "../js/screens/mode-page.js";

describe("generateCoachLine", () => {
  it("returns the >=90% line at 90 and above", () => {
    expect(generateCoachLine({ scorePct: 90 })).toBe("Loistavaa. Pidä vauhtia yllä.");
    expect(generateCoachLine({ scorePct: 100 })).toBe("Loistavaa. Pidä vauhtia yllä.");
  });

  it("returns the 70-89 with-weakest line", () => {
    expect(generateCoachLine({ scorePct: 75, sessionWeakestLabel: "subjunktiivi" }))
      .toBe("Hyvä. Paranna subjunktiivi-aihetta.");
  });

  it("returns the 70-89 no-weakest line", () => {
    expect(generateCoachLine({ scorePct: 80, sessionWeakestLabel: null }))
      .toBe("Hyvä. Pidä taso yllä.");
    expect(generateCoachLine({ scorePct: 80 })).toBe("Hyvä. Pidä taso yllä.");
  });

  it("returns the 50-69 lines", () => {
    expect(generateCoachLine({ scorePct: 60, sessionWeakestLabel: "preteriti" }))
      .toBe("Tasolla. preteriti kaipaa toistoa.");
    expect(generateCoachLine({ scorePct: 50 })).toBe("Tasolla. Kertaa kaikki aiheet.");
  });

  it("returns the <50% line regardless of weakest label", () => {
    expect(generateCoachLine({ scorePct: 49 }))
      .toBe("Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa.");
    expect(generateCoachLine({ scorePct: 0, sessionWeakestLabel: "x" }))
      .toBe("Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa.");
  });
});
