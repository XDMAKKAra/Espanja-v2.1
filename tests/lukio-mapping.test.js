import { describe, it, expect } from "vitest";
import {
  TEXTBOOK_MAPPING,
  TOPIC_TO_PUHEO_COURSE,
  inferGrammarExposure,
  computeCourseWeights,
  textbookOptionsFor,
} from "../lib/lukioMapping.js";

describe("inferGrammarExposure (es)", () => {
  it("returns past-tense topics for Mi mundo when K3-K4 completed", () => {
    const topics = inferGrammarExposure("es", "mi_mundo", [3, 4]);
    expect(topics).toContain("preterite");
    expect(topics).toContain("imperfect");
    expect(topics).toContain("preterite_vs_imperfect");
    expect(topics).not.toContain("subjunctive_present");
  });

  it("returns subjunctive when K6 completed with Mi mundo", () => {
    const topics = inferGrammarExposure("es", "mi_mundo", [6]);
    expect(topics).toContain("subjunctive_present");
  });

  it("Acción defers subjunctive: K6 alone does NOT yield subjunctive", () => {
    const topics = inferGrammarExposure("es", "accion", [6]);
    expect(topics).not.toContain("subjunctive_present");
  });

  it("Acción introduces gustar in K1", () => {
    const topics = inferGrammarExposure("es", "accion", [1]);
    expect(topics).toContain("gustar_verbs");
  });

  it("Mi mundo defers gustar to K2 (not in K1)", () => {
    const topics = inferGrammarExposure("es", "mi_mundo", [1]);
    expect(topics).not.toContain("gustar_verbs");
  });

  it("falls back to default mapping for unknown textbook", () => {
    const topics = inferGrammarExposure("es", "joku_outo_kirja", [3]);
    expect(topics).toContain("preterite");
  });

  it("returns deduplicated topics across multiple kurssit", () => {
    const topics = inferGrammarExposure("es", "mi_mundo", [6, 7]);
    const seen = new Set(topics);
    expect(seen.size).toBe(topics.length);
    expect(topics).toContain("subjunctive_present");
    expect(topics).toContain("pluscuamperfecto");
  });
});

describe("inferGrammarExposure (de)", () => {
  it("returns Perfekt when K3 completed with Magazin.de", () => {
    const topics = inferGrammarExposure("de", "magazin_de", [3]);
    expect(topics).toContain("perfekt");
    expect(topics).toContain("v2_word_order");
  });

  it("Genau! introduces dative_prepositions in K2 (vs K4 in Magazin)", () => {
    const k2genau = inferGrammarExposure("de", "genau", [2]);
    const k2magazin = inferGrammarExposure("de", "magazin_de", [2]);
    expect(k2genau).toContain("dative_prepositions");
    expect(k2magazin).not.toContain("dative_prepositions");
  });

  it("returns Konjunktiv II advanced for K8", () => {
    const topics = inferGrammarExposure("de", "magazin_de", [8]);
    expect(topics).toContain("konjunktiv_ii_advanced");
  });
});

describe("inferGrammarExposure (fr)", () => {
  it("returns passé composé when K3 completed with J'aime", () => {
    const topics = inferGrammarExposure("fr", "jaime", [3]);
    expect(topics).toContain("passe_compose");
    expect(topics).toContain("etre_vs_avoir_aux");
  });

  it("Voilà! introduces relative_pronouns in K6 (vs K7 in J'aime)", () => {
    const k6voila = inferGrammarExposure("fr", "voila", [6]);
    const k6jaime = inferGrammarExposure("fr", "jaime", [6]);
    expect(k6voila).toContain("relative_pronouns");
    expect(k6jaime).not.toContain("relative_pronouns");
  });

  it("returns si-hypothèses for K8", () => {
    const topics = inferGrammarExposure("fr", "jaime", [8]);
    expect(topics).toContain("si_hypotheses");
    expect(topics).toContain("conditionnel_passe");
  });
});

describe("inferGrammarExposure (edge cases)", () => {
  it("returns empty array for unsupported language", () => {
    expect(inferGrammarExposure("it", "default", [1, 2])).toEqual([]);
  });

  it("returns empty array when coursesCompleted is not an array", () => {
    expect(inferGrammarExposure("es", "mi_mundo", null)).toEqual([]);
    expect(inferGrammarExposure("es", "mi_mundo", undefined)).toEqual([]);
  });

  it("ignores out-of-range kurssi numbers gracefully", () => {
    const topics = inferGrammarExposure("es", "mi_mundo", [99, 3]);
    expect(topics).toContain("preterite");
  });

  it("returns empty array for empty coursesCompleted", () => {
    expect(inferGrammarExposure("es", "mi_mundo", [])).toEqual([]);
  });
});

describe("computeCourseWeights (es)", () => {
  it("up-weights kurssi_6 when subjunctive_present is weak", () => {
    const weights = computeCourseWeights("es", ["subjunctive_present"]);
    expect(weights.kurssi_6).toBeGreaterThan(1.5);
    expect(weights.kurssi_7).toBeGreaterThan(1.5);
  });

  it("leaves kurssi_1 at neutral when subjunctive_present is the only weak topic", () => {
    const weights = computeCourseWeights("es", ["subjunctive_present"]);
    expect(weights.kurssi_1).toBeCloseTo(1.0);
  });

  it("up-weights kurssi_3 when preterite is weak", () => {
    const weights = computeCourseWeights("es", ["preterite"]);
    expect(weights.kurssi_3).toBeGreaterThan(1.5);
  });

  it("up-weights multiple courses for multiple weak topics", () => {
    const weights = computeCourseWeights("es", ["preterite", "subjunctive_present"]);
    expect(weights.kurssi_3).toBeGreaterThan(1.5);
    expect(weights.kurssi_6).toBeGreaterThan(1.5);
  });
});

describe("computeCourseWeights (de + fr)", () => {
  it("up-weights kurssi_6 when DE passive_voice is weak", () => {
    const weights = computeCourseWeights("de", ["passive_voice"]);
    expect(weights.kurssi_6).toBeGreaterThan(1.5);
  });

  it("up-weights kurssi_4 when FR imparfait is weak", () => {
    const weights = computeCourseWeights("fr", ["imparfait"]);
    expect(weights.kurssi_4).toBeGreaterThan(1.5);
  });
});

describe("computeCourseWeights (defaults + edge cases)", () => {
  it("returns neutral 1.0 weights for all courses when no weak topics", () => {
    const weights = computeCourseWeights("es", []);
    for (const c of Object.keys(weights)) {
      expect(weights[c]).toBeCloseTo(1.0);
    }
  });

  it("returns 8 keys (kurssi_1..kurssi_8)", () => {
    const weights = computeCourseWeights("es", ["preterite"]);
    expect(Object.keys(weights).length).toBe(8);
    expect(weights.kurssi_8).toBeDefined();
  });

  it("ignores unknown weak topics silently", () => {
    const weights = computeCourseWeights("es", ["not_a_real_topic"]);
    for (const c of Object.keys(weights)) {
      expect(weights[c]).toBeCloseTo(1.0);
    }
  });

  it("returns neutral weights for unsupported language", () => {
    const weights = computeCourseWeights("it", ["preterite"]);
    expect(weights.kurssi_3).toBeCloseTo(1.0);
  });
});

describe("textbookOptionsFor", () => {
  it("returns es textbook options without default", () => {
    const opts = textbookOptionsFor("es");
    const keys = opts.map(o => o.key);
    expect(keys).toContain("mi_mundo");
    expect(keys).toContain("accion");
    expect(keys).not.toContain("default");
  });

  it("includes name and publisher", () => {
    const opts = textbookOptionsFor("es");
    const mi = opts.find(o => o.key === "mi_mundo");
    expect(mi.name).toBe("Mi mundo");
    expect(mi.publisher).toBe("SanomaPro");
  });

  it("returns empty array for unsupported language", () => {
    expect(textbookOptionsFor("it")).toEqual([]);
  });
});

describe("schema invariants", () => {
  it("every textbook has kurssit 1..8 defined", () => {
    for (const lang of ["es", "de", "fr"]) {
      for (const [tbKey, book] of Object.entries(TEXTBOOK_MAPPING[lang])) {
        for (let k = 1; k <= 8; k++) {
          expect(
            Array.isArray(book.grammar_by_kurssi[k]),
            `${lang}/${tbKey}/kurssi_${k} missing topic array`,
          ).toBe(true);
        }
      }
    }
  });

  it("every topic in TOPIC_TO_PUHEO_COURSE maps to valid kurssi keys", () => {
    const validCourses = new Set(["kurssi_1","kurssi_2","kurssi_3","kurssi_4","kurssi_5","kurssi_6","kurssi_7","kurssi_8"]);
    for (const lang of ["es", "de", "fr"]) {
      for (const [topic, courses] of Object.entries(TOPIC_TO_PUHEO_COURSE[lang])) {
        for (const c of courses) {
          expect(validCourses.has(c), `${lang}/${topic} maps to invalid course ${c}`).toBe(true);
        }
      }
    }
  });

  it("every topic used in textbook grammar_by_kurssi appears in TOPIC_TO_PUHEO_COURSE", () => {
    for (const lang of ["es", "de", "fr"]) {
      const reverseKeys = new Set(Object.keys(TOPIC_TO_PUHEO_COURSE[lang]));
      for (const book of Object.values(TEXTBOOK_MAPPING[lang])) {
        for (const topics of Object.values(book.grammar_by_kurssi)) {
          for (const t of topics) {
            expect(reverseKeys.has(t), `${lang}: topic "${t}" used in textbook but missing from TOPIC_TO_PUHEO_COURSE`).toBe(true);
          }
        }
      }
    }
  });
});
