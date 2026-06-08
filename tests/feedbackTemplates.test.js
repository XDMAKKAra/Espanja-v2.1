// L-V411 Vaihe B — feedback template engine + "no runtime AI in /complete" guard.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  pickFeedback, toneBucketFor, bandFor, concentrationConcept,
} from "../lib/feedbackTemplates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const noUnresolved = (s) => expect(/\{[a-z_]+\}/.test(s)).toBe(false);

describe("toneBucketFor", () => {
  it("maps the seven YTL grades into three buckets", () => {
    expect(toneBucketFor("I")).toBe("I_A");
    expect(toneBucketFor("A")).toBe("I_A");
    expect(toneBucketFor("B")).toBe("B_C");
    expect(toneBucketFor("C")).toBe("B_C");
    expect(toneBucketFor("M")).toBe("M_E_L");
    expect(toneBucketFor("E")).toBe("M_E_L");
    expect(toneBucketFor("L")).toBe("M_E_L");
  });
  it("defaults unknown/empty to B_C", () => {
    expect(toneBucketFor("")).toBe("B_C");
    expect(toneBucketFor(null)).toBe("B_C");
    expect(toneBucketFor("Z")).toBe("B_C");
  });
});

describe("bandFor", () => {
  it("mastered at/above threshold, almost within 0.15 below, else struggling", () => {
    expect(bandFor(0.9, 0.8)).toBe("mastered");
    expect(bandFor(0.8, 0.8)).toBe("mastered");
    expect(bandFor(0.7, 0.8)).toBe("almost");
    expect(bandFor(0.66, 0.8)).toBe("almost");
    expect(bandFor(0.5, 0.8)).toBe("struggling");
  });
});

describe("concentrationConcept", () => {
  it("returns the most frequent topic_key", () => {
    expect(concentrationConcept([
      { topic_key: "subjunctive" }, { topic_key: "ser_estar" }, { topic_key: "subjunctive" },
    ])).toBe("subjunctive");
  });
  it("returns null for empty / untagged", () => {
    expect(concentrationConcept([])).toBe(null);
    expect(concentrationConcept([{ topic_key: null }])).toBe(null);
    expect(concentrationConcept(null)).toBe(null);
  });
});

describe("pickFeedback — discrete lessons", () => {
  it("concept-specific message injects the label + rule hint (es subjunctive)", () => {
    const fb = pickFeedback({
      lang: "es", toneBucket: "B_C", band: "struggling",
      concept: "subjunctive", vars: { aihe: "Subjunktiivin muodostus" },
    });
    expect(fb.tutorMessage).toContain("Subjunktiivi");
    expect(fb.tutorMessage).toContain("que");
    noUnresolved(fb.tutorMessage);
    noUnresolved(fb.metacognitivePrompt);
  });

  it("falls back to the generic {aihe} template for vocab / unmapped concepts", () => {
    const fb = pickFeedback({
      lang: "es", toneBucket: "B_C", band: "struggling",
      concept: "food", vars: { aihe: "Ruoka ja ateriat" },
    });
    expect(fb.tutorMessage).toContain("Ruoka ja ateriat");
    expect(fb.tutorMessage).not.toContain("{konsepti}");
    noUnresolved(fb.tutorMessage);
  });

  it("no concept -> generic mastered message references the topic", () => {
    const fb = pickFeedback({
      lang: "es", toneBucket: "I_A", band: "mastered",
      concept: null, vars: { aihe: "Gustar-rakenne", seuraava: "seuraavaan oppituntiin" },
    });
    expect(fb.tutorMessage).toContain("Gustar-rakenne");
    expect(fb.tutorMessage).toContain("seuraavaan oppituntiin");
    noUnresolved(fb.tutorMessage);
  });

  it("language-specific pedagogy differs (fr subjonctif vs es subjunctive)", () => {
    const es = pickFeedback({ lang: "es", toneBucket: "B_C", band: "almost", concept: "subjunctive", vars: { aihe: "x" } });
    const fr = pickFeedback({ lang: "fr", toneBucket: "B_C", band: "almost", concept: "subjunctive", vars: { aihe: "x" } });
    expect(fr.tutorMessage).toContain("Subjonctif");
    expect(fr.tutorMessage).toContain("il faut que");
    expect(es.tutorMessage).not.toEqual(fr.tutorMessage);
  });

  it("de has no subjunctive concept -> generic fallback, still complete", () => {
    const fb = pickFeedback({ lang: "de", toneBucket: "B_C", band: "almost", concept: "subjunctive", vars: { aihe: "Konjunktiv II" } });
    expect(fb.tutorMessage).toContain("Konjunktiv II");
    noUnresolved(fb.tutorMessage);
  });
});

describe("pickFeedback — kertaustesti", () => {
  it("pass references the course + next course", () => {
    const fb = pickFeedback({
      lang: "es", toneBucket: "B_C", kertaustesti: "pass",
      vars: { kurssi: "Arki ja elämä", seuraava_kurssi: "kurssille Mitä tein" },
    });
    expect(fb.tutorMessage).toContain("Arki ja elämä");
    expect(fb.tutorMessage).toContain("kurssille Mitä tein");
    noUnresolved(fb.tutorMessage);
  });
  it("fail encourages retry without unlocking", () => {
    const fb = pickFeedback({
      lang: "es", toneBucket: "M_E_L", kertaustesti: "fail",
      vars: { kurssi: "YO-koevalmiiksi" },
    });
    expect(fb.tutorMessage).toContain("YO-koevalmiiksi");
    expect(fb.tutorMessage.toLowerCase()).toMatch(/ei vielä|uudestaan|ennen/);
    noUnresolved(fb.tutorMessage);
  });
});

describe("pickFeedback — fallback robustness (proves no AI is ever needed)", () => {
  it("never leaves placeholders unresolved across every tone × band × all langs", () => {
    for (const lang of ["es", "de", "fr"]) {
      for (const toneBucket of ["I_A", "B_C", "M_E_L"]) {
        for (const band of ["mastered", "almost", "struggling"]) {
          const fb = pickFeedback({ lang, toneBucket, band, concept: "ser_estar", vars: { aihe: "Aihe", seuraava: "eteenpäin" } });
          expect(fb).toBeTruthy();
          expect(fb.tutorMessage.length).toBeGreaterThan(10);
          noUnresolved(fb.tutorMessage);
          noUnresolved(fb.metacognitivePrompt);
        }
      }
    }
  });
  it("unknown tone bucket falls back to B_C; unknown band to struggling", () => {
    const fb = pickFeedback({ lang: "es", toneBucket: "ZZZ", band: "weird", concept: null, vars: { aihe: "X" } });
    expect(fb).toBeTruthy();
    noUnresolved(fb.tutorMessage);
  });
});

describe("/complete makes ZERO OpenAI calls for discrete lessons", () => {
  it("the complete handler source contains no callOpenAI", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "..", "routes", "curriculum.js"), "utf8");
    const start = src.indexOf("lesson/:lessonIndex/complete");
    // cut before the separate GET /tutor-message endpoint, which legitimately uses AI
    const end = src.indexOf("/api/curriculum/tutor-message", start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const handler = src.slice(start, end);
    expect(handler.includes("callOpenAI")).toBe(false);
  });
});
