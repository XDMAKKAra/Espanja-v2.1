// Maps a placement weakness category → Finnish sentence for the S3 path screen.
// Also finds the lowest-correct-rate category from placement's scoreByLevel /
// per-item answers so the onboarding can surface one concrete weakness.

export const WEAKNESS_SENTENCES = {
  preterite_irregular: "Sanastossa epäsäännölliset preterit-verbit.",
  preterite_regular: "Preterit-aikamuodon tunnistaminen.",
  imperfect: "Imperfektin käyttö kerronnassa.",
  subjunctive_present: "Subjunktiivin tunnistaminen käskymuodoissa.",
  subjunctive_imperfect: "Imperfektin subjunktiivi ehtolauseissa.",
  por_vs_para: "Por- ja para-prepositioiden erottaminen.",
  ser_vs_estar: "Ser ja estar — tilapäinen vs. pysyvä.",
  pronouns_reflexive: "Refleksiiviverbit ja pronominit.",
  pronouns_object: "Objektipronominien paikka lauseessa.",
  gender_agreement: "Adjektiivien sukusopu.",
  number_agreement: "Monikon muodostus ja adjektiivien taivutus.",
  vocab_food: "Sanasto: ruoka ja juoma.",
  vocab_travel: "Sanasto: matkustaminen.",
  vocab_family: "Sanasto: perhe ja ihmissuhteet.",
  vocab_work: "Sanasto: työ ja koulutus.",
  vocab_daily: "Sanasto: arkielämä.",
  vocab_general: "Yleissanasto.",
  grammar_general: "Kielioppi laajasti.",
};

export const WEAKNESS_FALLBACK = "Yleinen sanasto ja kielioppi — vahvistamme kaikkea.";

// Derive a weakness category from a placement result.
// Accepts the shape POSTed back by /api/placement/submit:
//   { placementLevel, scoreByLevel, answers: [{ id, level, correct, category? }] }
// Returns { category, sentence }. If no clear signal, returns the fallback.
export function deriveWeakness(result) {
  if (!result) return { category: null, sentence: WEAKNESS_FALLBACK };

  // Preferred path: if answers carry category metadata, use the category with
  // the lowest correct-rate (min 2 items to avoid single-item noise).
  if (Array.isArray(result.answers) && result.answers.some(a => a.category)) {
    const buckets = new Map();
    for (const a of result.answers) {
      if (!a.category) continue;
      const b = buckets.get(a.category) || { total: 0, correct: 0 };
      b.total += 1;
      if (a.correct) b.correct += 1;
      buckets.set(a.category, b);
    }
    let worst = null;
    for (const [category, b] of buckets) {
      if (b.total < 2) continue;
      const rate = b.correct / b.total;
      if (!worst || rate < worst.rate) worst = { category, rate };
    }
    if (worst) {
      return {
        category: worst.category,
        sentence: WEAKNESS_SENTENCES[worst.category] || WEAKNESS_FALLBACK,
      };
    }
  }

  // Fallback path: use the lowest-scoring level and map to a level-flavoured
  // generic sentence (we don't have category granularity yet).
  if (result.scoreByLevel) {
    let worstLevel = null;
    for (const [level, s] of Object.entries(result.scoreByLevel)) {
      if (!s || !s.total) continue;
      const rate = s.pct / 100;
      if (!worstLevel || rate < worstLevel.rate) worstLevel = { level, rate };
    }
    if (worstLevel && worstLevel.rate < 0.75) {
      return {
        category: `level_${worstLevel.level}`,
        sentence: `Tason ${worstLevel.level} tehtävät jäivät heikoimmiksi — vahvistamme niitä.`,
      };
    }
  }

  return { category: null, sentence: WEAKNESS_FALLBACK };
}

// For S3 "Tavoite vs nyt" line. Takes current + target CEFR-ish letters.
export function gapSentence(current, target) {
  const ORDER = ["A", "B", "C", "M", "E", "L"];
  const ci = ORDER.indexOf(current);
  const ti = ORDER.indexOf(target);
  if (ci === -1 || ti === -1) return "";
  if (ci < ti) return `Vähän alle YTL-tavoitteen (${current} → ${target}).`;
  if (ci > ti) return `Yli YTL-tavoitteen (${current} → ${target}).`;
  return `Juuri YTL-tavoitteessa (${current}).`;
}
