// L-V315-REASONER-1 — onboarding-diagnostiikan jälkeinen skill-profile-reasoner.
// Korvaa Step 5:n staattinen synthesizeSummary-heuristiikka LLM-pohjaisella
// personoidulla suunnitelmalla. Käyttää:
//   - kurssi-historiaa + arvosanoja (lib/lukioMapping.js)
//   - mini-YO-diagnostiikkaa (mini_yo_progress -> per-osio-tarkkuus)
//   - biografiaa (homeUsage, livedAbroad, frequency)
// ja palauttaa { skillProfile, strengths, gaps, plan, courseWeights, transparencyReasons }.

import {
  inferGrammarExposure,
  computeCourseWeights,
} from "./lukioMapping.js";
import { callOpenAI } from "./openai.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const LANG_NAME_GENITIVE = {
  es: "espanjan",
  de: "saksan",
  fr: "ranskan",
};

const TOPIC_LABEL = {
  preterite: "preteriti",
  imperfect: "imperfekti",
  subjunctive_present: "subjunktiivin preesens",
  subjunctive_imperfect: "subjunktiivin imperfekti",
  si_clauses: "si-hypoteesilauseet",
  passive: "passiivi",
  konjunktiv_ii: "Konjunktiv II",
  perfekt: "perfekti",
  preterit: "preteriti (saks.)",
  passe_compose: "passé composé",
  imparfait: "imparfait",
  subjonctif_present: "subjonctif présent",
  conditionnel: "conditionnel",
  futur_simple: "futur simple",
};

const KURSSI_TO_PUHEO = {
  1: "kurssi_1",
  2: "kurssi_2",
  3: "kurssi_3",
  4: "kurssi_4",
  5: "kurssi_5",
  6: "kurssi_6",
  7: "kurssi_7",
  8: "kurssi_8",
};

// ─── Pure helpers (deterministic, no LLM) ───────────────────────────────────

function topicLabel(key) {
  return TOPIC_LABEL[key] || key.replace(/_/g, " ");
}

/**
 * Lukio-arvosana 4-10 -> taso 0-5 (rikastaa fraktiona, pyöristää).
 * Tuntematon arvosana -> matala confidence + neutraali taso.
 */
function gradeToLevel(grade) {
  if (grade == null || grade === "en_muista" || grade === "skipped") {
    return { level: 2, confidence: 0.3, source: "unknown_grade" };
  }
  if (!Number.isFinite(grade)) {
    return { level: 2, confidence: 0.3, source: "unknown_grade" };
  }
  const lvl = Math.max(0, Math.min(5, Math.round((grade - 4) * 0.83)));
  return { level: lvl, confidence: 0.5, source: "grade_inferred" };
}

/**
 * Käy läpi exposed-topicit ja rakentaa per-aihe arvion kurssi-arvosanoista.
 */
function buildBaselineProfile(lang, textbookKey, coursesCompleted, courseGrades) {
  const exposed = inferGrammarExposure(lang, textbookKey || "default", coursesCompleted);
  const profile = {};
  if (!exposed || exposed.length === 0) return profile;

  // Lasketaan käytyjen kurssien keskiarvo proxy:ksi yleiselle aktiiviselle tasolle.
  const numericGrades = (coursesCompleted || [])
    .map(k => courseGrades?.[k] ?? courseGrades?.[String(k)])
    .filter(g => Number.isFinite(g));
  const avgGrade = numericGrades.length
    ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
    : null;
  const baseFromAvg = avgGrade != null
    ? gradeToLevel(avgGrade)
    : { level: 2, confidence: 0.25, source: "no_grade" };

  for (const topic of exposed) {
    profile[topic] = { ...baseFromAvg };
  }
  return profile;
}

/**
 * Mini-YO Part A: tällä hetkellä per-osio overall-accuracy. Per-topic
 * scoresByTopic on tulevaisuuden parannus (vaatii kysymys-meta-mapping
 * tietokannassa). Tällä hetkellä Part A:n yleinen heikkous lasketaan
 * varovaisesti yli kaikkien profile-aiheiden.
 */
function applyMiniYOResults(profile, miniYO) {
  if (!miniYO) return;

  const a = miniYO.partA;
  if (a && a.scoresByTopic && typeof a.scoresByTopic === "object") {
    for (const [topic, score] of Object.entries(a.scoresByTopic)) {
      const observed = Math.round(Math.max(0, Math.min(1, score)) * 5);
      const prev = profile[topic];
      if (prev) {
        profile[topic] = {
          level: Math.round(prev.level * 0.3 + observed * 0.7),
          confidence: 0.85,
          source: "diagnostic",
        };
      } else {
        profile[topic] = { level: observed, confidence: 0.85, source: "diagnostic" };
      }
    }
  } else if (a && Number.isFinite(a.overallAccuracy)) {
    // Fallback: ilman per-topic scoresia, pieni nudge kaikille topiceille.
    const observed = Math.round(Math.max(0, Math.min(1, a.overallAccuracy)) * 5);
    for (const t of Object.keys(profile)) {
      profile[t] = {
        level: Math.round(profile[t].level * 0.6 + observed * 0.4),
        confidence: Math.max(profile[t].confidence, 0.55),
        source: "diagnostic_overall",
      };
    }
  }

  const b = miniYO.partB;
  if (b && Number.isFinite(b.score)) {
    profile.passive_vocab = {
      level: Math.round(Math.max(0, Math.min(1, b.score)) * 5),
      confidence: 0.7,
      source: "diagnostic",
    };
  }

  const c = miniYO.partC;
  if (c && typeof c === "object") {
    if (Number.isFinite(c.orthography_score)) {
      profile.orthography = {
        level: Math.round(Math.max(0, Math.min(1, c.orthography_score)) * 5),
        confidence: 0.85,
        source: "diagnostic",
      };
    }
    if (Number.isFinite(c.grammar_score)) {
      profile.active_grammar = {
        level: Math.round(Math.max(0, Math.min(1, c.grammar_score)) * 5),
        confidence: 0.85,
        source: "diagnostic",
      };
    }
    if (Number.isFinite(c.vocab_score)) {
      profile.active_vocab = {
        level: Math.round(Math.max(0, Math.min(1, c.vocab_score)) * 5),
        confidence: 0.85,
        source: "diagnostic",
      };
    }
    if (Array.isArray(c.used_grammar_topics)) {
      for (const t of c.used_grammar_topics) {
        if (profile[t]) {
          profile[t].confidence = Math.min(1, profile[t].confidence + 0.15);
        }
      }
    }
  }
}

/**
 * Heritage-speaker -patternit + asunut-maassa-boost. Ei muuta confidence:a;
 * vain tasoja silloin kun diagnostiikka ei jo todentanut.
 */
function applyBiographicalInferences(profile, biography) {
  if (!biography) return;

  if (biography.home_usage === "yes" || biography.homeUsage === "yes") {
    const oral = profile.oral_comprehension;
    profile.oral_comprehension = oral
      ? { ...oral, level: Math.min(5, oral.level + 1) }
      : { level: 4, confidence: 0.6, source: "biographical" };

    // Heritage speakers tyypillisesti heikompi oikeinkirjoitus.
    if (profile.orthography && profile.orthography.source !== "diagnostic") {
      profile.orthography = {
        ...profile.orthography,
        level: Math.max(0, profile.orthography.level - 1),
      };
    }
  }

  if (biography.lived_abroad === "over_year" || biography.livedAbroad === "over_year") {
    for (const k of Object.keys(profile)) {
      profile[k] = { ...profile[k], level: Math.min(5, profile[k].level + 1) };
    }
  }
}

function identifyGaps(profile) {
  const gaps = [];
  for (const [topic, info] of Object.entries(profile)) {
    if (info.level <= 2 && info.confidence >= 0.4) {
      gaps.push({ topic, level: info.level, source: info.source });
    }
  }
  // Vahvista että confidence-painotettu lajittelu nostaa selkeät puutteet ylös.
  gaps.sort((a, b) => a.level - b.level);
  return gaps;
}

function identifyStrengths(profile) {
  const strengths = [];
  for (const [topic, info] of Object.entries(profile)) {
    if (info.level >= 4 && info.confidence >= 0.5) {
      strengths.push({ topic, level: info.level, source: info.source });
    }
  }
  strengths.sort((a, b) => b.level - a.level);
  return strengths;
}

function buildTransparencyReasons(profile, gaps, input) {
  const reasons = {};
  const grades = input.courseGrades || {};

  for (const gap of gaps) {
    const label = topicLabel(gap.topic);
    if (gap.source === "diagnostic" || gap.source === "diagnostic_overall") {
      reasons[gap.topic] = `Diagnostisessa testissä ${label} jäi tunnistamatta tai jäi puutteelliseksi.`;
    } else if (gap.source === "biographical") {
      reasons[gap.topic] = `Profiilisi perusteella ${label} on tyypillinen kehityskohde ja ansaitsee lisäharjoitusta.`;
    } else if (gap.source === "grade_inferred") {
      const courseHint = (input.coursesCompleted || []).map(c => `K${c}: ${grades[c] ?? "?"}`).join(", ");
      reasons[gap.topic] = `Lukio-arvosanasi (${courseHint || "ei tiedossa"}) viittaavat siihen, että ${label} kannattaa kerrata.`;
    } else if (gap.source === "not_taught" || gap.source === "no_grade" || gap.source === "unknown_grade") {
      reasons[gap.topic] = `Et ole vielä käynyt aihetta tai sen arvosana ei ole tiedossa, joten ${label} alkaa nollasta.`;
    } else {
      reasons[gap.topic] = `${label} merkittiin kehityskohteeksi nykyisten signaalien perusteella.`;
    }
  }
  return reasons;
}

// ─── LLM call ───────────────────────────────────────────────────────────────

/**
 * Plain-Finnish, json-formaattinen 3 viikon polku. callOpenAI palauttaa
 * jo parse:tun JSONin (lib/openai.js heittää virheen jos viallinen).
 */
async function buildPlan({ lang, profile, gaps, strengths, grades, biography }) {
  const langName = LANG_NAME_GENITIVE[lang] || "kielen";

  const profileForLLM = {};
  for (const [k, v] of Object.entries(profile)) {
    profileForLLM[topicLabel(k)] = { taso_0_5: v.level, lahde: v.source };
  }
  const gapList = gaps.slice(0, 6).map(g => topicLabel(g.topic));
  const strengthList = strengths.slice(0, 4).map(s => topicLabel(s.topic));

  const promptPayload = {
    kieli: langName,
    skill_profile: profileForLLM,
    puutteet_priorisoituna: gapList,
    vahvuudet: strengthList,
    lukio_arvosanat: grades,
    biografia: biography || null,
  };

  const prompt = [
    `Olet ${langName} YO-kokeeseen valmentava opettaja. Rakenna 3 viikon henkilökohtainen oppimispolku.`,
    "Säännöt:",
    "- Keskity puutteisiin (max 2 aihetta per viikko), mut säilytä vahvuudet light-touchilla.",
    "- Kirjoita suomeksi, sentence-case (ei UPPERCASE), ei em-dashia, ei englanninkielisiä täytesanoja",
    "  (\"elevate\", \"seamless\", \"unleash\", \"next-gen\"). Käytä konkreettisia verbejä.",
    "- Jokainen viikko = 3-4 toimintaa, lyhyinä lauseina (max ~18 sanaa).",
    "- Vältä \"kalibroitu\", \"intuitiivinen\", \"monipuolinen\" -tyyppistä AI-täytettä.",
    "- Älä keksi prosenttilukuja tai lukio-nimiä.",
    "- Jos puutteita ei ole, viikko 1 = vahvuuksien ylläpito ja YO-koe-rakenteen tutustuminen.",
    "",
    "Käyttäjän diagnostiikka (JSON):",
    JSON.stringify(promptPayload, null, 2),
    "",
    "Vastaa pelkästään JSON-muodossa, ei muuta tekstiä:",
    "{",
    "  \"week1\": [\"...lyhyt lause...\", \"...\"],",
    "  \"week2\": [...],",
    "  \"week3\": [...]",
    "}",
  ].join("\n");

  const parsed = await callOpenAI(prompt, 800, {
    temperature: 0.4,
    responseFormat: { type: "json_object" },
  });

  const out = { week1: [], week2: [], week3: [] };
  for (const key of ["week1", "week2", "week3"]) {
    if (Array.isArray(parsed[key])) {
      out[key] = parsed[key]
        .map(s => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
        .slice(0, 4);
    }
  }
  return out;
}

/**
 * Fallback-polku jos LLM-kutsu epäonnistuu — pidetään parempaa kuin tyhjää.
 * Vastaa rakenteeltaan synthesizeSummary:n vanhaa heuristiikkaa, jotta UI
 * ei jää tyhjäksi jos OpenAI on alas.
 */
function buildFallbackPlan(input) {
  const maxCourse = (input.coursesCompleted || []).length
    ? Math.max(...input.coursesCompleted)
    : 0;
  if (maxCourse <= 2) {
    return {
      week1: [
        "Perusverbit, artikkelit ja preesens. Luo pohja jolle myöhemmät rakenteet nojaavat.",
        "Lyhyet kuullun- ja luetuntehtävät arjen sanastosta.",
      ],
      week2: [
        "Arjen sanasto ja epäsäännölliset verbit.",
        "Mini-kirjoitelmat: 4-6 lausetta per teema.",
      ],
      week3: [
        "Ensimmäiset menneen ajan rakenteet kontekstissa.",
        "Lyhyt arvioitu kirjoitelma palautteen kanssa.",
      ],
    };
  }
  if (maxCourse <= 5) {
    return {
      week1: [
        "Preteritin ja imperfektin ero: harjoitusta kontekstissa.",
        "Luetuntehtäviä YO-tyyliin.",
      ],
      week2: [
        "Futuuri ja konditionaali, lyhyitä kirjoitelmia.",
        "Sanaston laajennus YO-aiheissa (työ, ympäristö).",
      ],
      week3: [
        "Kirjoitelmaharjoituksia rubriikin mukaan.",
        "Heikoimpien aiheiden täsmäkertaus.",
      ],
    };
  }
  return {
    week1: [
      "Subjunktiivin laukaisijat ja si-lauseet kontekstissa.",
      "Pidempi luetuntehtävä + analyysiä rakenteista.",
    ],
    week2: [
      "Kokonaisen YO-osan harjoitus aikarajalla.",
      "Kirjoitelman pisteytyskriteerien läpikäynti omasta tekstistä.",
    ],
    week3: [
      "Pisteytyskriteerien hiominen ja heikoimpien aiheiden täsmäharjoittelu.",
      "Mallikokeen simulaatio kotioloissa, palaute jälkikäteen.",
    ],
  };
}

// ─── Main entry ─────────────────────────────────────────────────────────────

export async function buildSkillProfile(input) {
  if (!input || typeof input !== "object") {
    throw new Error("buildSkillProfile: input on pakollinen");
  }
  const { lang, miniYO, coursesCompleted, courseGrades, biography, textbookKey } = input;
  if (!lang) throw new Error("buildSkillProfile: lang on pakollinen");

  const profile = buildBaselineProfile(lang, textbookKey, coursesCompleted || [], courseGrades || {});
  applyMiniYOResults(profile, miniYO);
  applyBiographicalInferences(profile, biography);

  const gaps = identifyGaps(profile);
  const strengths = identifyStrengths(profile);

  let plan;
  let planSource = "llm";
  try {
    plan = await buildPlan({
      lang,
      profile,
      gaps,
      strengths,
      grades: courseGrades || {},
      biography,
    });
    if (!plan.week1.length && !plan.week2.length && !plan.week3.length) {
      throw new Error("LLM palautti tyhjän polun");
    }
  } catch (err) {
    plan = buildFallbackPlan(input);
    planSource = "fallback";
  }

  const weakTopicKeys = gaps.map(g => g.topic);
  const courseWeights = computeCourseWeights(lang, weakTopicKeys);

  const transparencyReasons = buildTransparencyReasons(profile, gaps, input);

  // UI-näkyvät vahvuudet/puutteet — käännetään human-readable.
  const strengthsHuman = strengthsToHuman(strengths, biography, courseGrades, coursesCompleted);
  const gapsHuman = gapsToHuman(gaps, biography, coursesCompleted);

  return {
    skillProfile: profile,
    strengths: strengthsHuman,
    gaps: gapsHuman,
    plan,
    courseWeights,
    transparencyReasons,
    meta: { planSource, gapsCount: gaps.length, strengthsCount: strengths.length },
  };
}

function strengthsToHuman(strengths, biography, courseGrades, coursesCompleted) {
  const out = [];
  if (biography?.home_usage === "yes" || biography?.homeUsage === "yes") {
    out.push("Kuulet kieltä päivittäin kotona, joten suullinen ymmärrys ja sanaston laajuus ovat etunasi.");
  }
  if (biography?.lived_abroad === "over_year" || biography?.lived_abroad === "months") {
    out.push("Olet asunut kohdemaassa, joten kuullun ymmärtäminen ja arkikieli ovat vahvempia kuin tyypillisellä lukio-opiskelijalla.");
  }
  for (const s of strengths.slice(0, 3)) {
    out.push(`${topicLabel(s.topic)} on hallussa hyvin (taso ${s.level}/5).`);
  }
  if (Array.isArray(coursesCompleted) && coursesCompleted.length >= 4) {
    const maxC = Math.max(...coursesCompleted);
    out.push(`Olet käynyt syvempiä kursseja (K${maxC} asti), joten pitkän kaaren rakenteet ovat tuttuja.`);
  }
  if (out.length === 0) {
    out.push("Aloitat puhtaalta pöydältä. Etuna on, että polku rakentuu täysin omaan tahtiisi.");
  }
  return out.slice(0, 4);
}

function gapsToHuman(gaps, biography, coursesCompleted) {
  const out = [];
  for (const g of gaps.slice(0, 4)) {
    out.push(`${topicLabel(g.topic)} (taso ${g.level}/5) kaipaa harjoitusta.`);
  }
  if (biography?.frequency === "rarely" || biography?.frequency === "monthly") {
    out.push("Säännöllinen päivittäinen kosketus (10-15 min) tuo nopeampaa edistystä kuin pidemmät harvat sessiot.");
  }
  if (Array.isArray(coursesCompleted) && coursesCompleted.length && Math.max(...coursesCompleted) < 6) {
    out.push("Subjunktiivi ja hypoteettiset rakenteet (K6 eteenpäin) ovat seuraava luonnollinen askel.");
  }
  if (out.length === 0) {
    out.push("Tarkka analyysi täydentyy ensimmäisten harjoitusten jälkeen, kun saamme oikeaa datapisteitä tasostasi.");
  }
  return out.slice(0, 4);
}

// ─── Adapter: Supabase row -> buildSkillProfile-input ───────────────────────

/**
 * mini_yo_progress-taulun rivit -> partA/partB/partC summary.
 * Yksinkertainen aggregaatio: yleinen tarkkuus per osio. Per-topic
 * mapping vaatii erillisen kysymys-meta-taulun, jonka rakentaminen on
 * out-of-scope L-V315:lle.
 */
export function summarizeMiniYOFromRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const byPart = {};
  for (const r of rows) {
    if (!byPart[r.part]) byPart[r.part] = { correct: 0, total: 0 };
    if (r.is_correct === true) byPart[r.part].correct += 1;
    if (r.is_correct === true || r.is_correct === false) byPart[r.part].total += 1;
  }
  const summary = {};
  if (byPart.A && byPart.A.total > 0) {
    summary.partA = { overallAccuracy: byPart.A.correct / byPart.A.total, scoresByTopic: null };
  }
  if (byPart.B && byPart.B.total > 0) {
    summary.partB = { score: byPart.B.correct / byPart.B.total };
  }
  // Part C on AI-graded eikä kulje is_correct-bool:lla; jätetään null jos ei
  // ole erikseen lainattu mini_yo_part_c_writing-kentästä.
  return Object.keys(summary).length > 0 ? summary : null;
}

// Export deterministic pieces for tests
export const __test = {
  buildBaselineProfile,
  applyMiniYOResults,
  applyBiographicalInferences,
  identifyGaps,
  identifyStrengths,
  buildTransparencyReasons,
  buildFallbackPlan,
  KURSSI_TO_PUHEO,
};
