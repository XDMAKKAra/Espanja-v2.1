import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { callOpenAI } from "../lib/openai.js";
import { KURSSI_META, readLessonFile } from "../lib/curriculum.js";
import {
  CURRICULUM_KURSSIT,
  CURRICULUM_LESSONS,
  LANG_CURRICULA,
  lessonsForKurssi,
  findKurssi,
} from "../lib/curriculumData.js";
import {
  applyTargetMultiplier,
  passThresholdFor,
  VALID_TARGET_GRADES,
} from "../lib/lessonContext.js";
import { getLessonLabel } from "../lib/lessonLabels.js";

const router = Router();

// Optional auth: populates req.user if Bearer token is valid, otherwise lets
// anonymous requests through (used by the public Oppimispolku preview).
async function optionalAuth(req, _res, next) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const { data: { user } } = await supabase.auth.getUser(auth.slice(7));
      if (user) req.user = { userId: user.id, email: user.email };
    } catch { /* anonymous fall-through */ }
  }
  next();
}

const PASS_THRESHOLD = 0.80;

// L-PLAN-6 — fetch the user's target_grade for multiplier + threshold logic.
// Falls back to "B" when the column is missing or the row has no value.
async function fetchTargetGrade(userId) {
  if (!userId) return "B";
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("target_grade")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return "B";
    const t = data?.target_grade;
    return (typeof t === "string" && VALID_TARGET_GRADES.includes(t)) ? t : "B";
  } catch { return "B"; }
}

// Treat "table doesn't exist" as a soft fallback — pre-migration the API
// still serves the JS-mirror so the UI can render. PGRST205 = table not in
// schema cache; 42P01 = relation does not exist.
function tablesMissing(err) {
  if (!err) return false;
  const code = err.code || err.error?.code;
  return code === "42P01" || code === "PGRST205" || /relation .* does not exist/i.test(err.message || "");
}

async function fetchKurssitDb() {
  const { data, error } = await supabase
    .from("curriculum_kurssit")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) {
    if (tablesMissing(error)) return null;
    throw error;
  }
  return data;
}

async function fetchLessonsDb(kurssiKey) {
  const { data, error } = await supabase
    .from("curriculum_lessons")
    .select("*")
    .eq("kurssi_key", kurssiKey)
    .order("sort_order", { ascending: true });
  if (error) {
    if (tablesMissing(error)) return null;
    throw error;
  }
  return data;
}

async function fetchUserProgressDb(userId, kurssiKey) {
  const { data, error } = await supabase
    .from("user_curriculum_progress")
    .select("kurssi_key, lesson_index, completed_at, score_correct, score_total")
    .eq("user_id", userId)
    .eq(kurssiKey ? "kurssi_key" : "user_id", kurssiKey || userId);
  if (error) {
    if (tablesMissing(error)) return null;
    throw error;
  }
  return data || [];
}

// Compute kurssi-level summary fields from a flat user-progress array.
function summariseProgress(allProgress, kurssiKey, kertausLessonIndex) {
  const rows = allProgress.filter((r) => r.kurssi_key === kurssiKey);
  const lessonsCompleted = rows.length;
  const sorted = [...rows].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  const lastScore = sorted[0]
    ? { correct: sorted[0].score_correct, total: sorted[0].score_total }
    : null;
  const kertaus = rows.find((r) => r.lesson_index === kertausLessonIndex);
  const kertausPassed = kertaus
    && typeof kertaus.score_correct === "number"
    && typeof kertaus.score_total === "number"
    && kertaus.score_total > 0
    && (kertaus.score_correct / kertaus.score_total) >= PASS_THRESHOLD;
  return { lessonsCompleted, lastScore, kertausPassed };
}

// ─── GET /api/curriculum ────────────────────────────────────────────────────
const SUPPORTED_LANGS = new Set(["es", "de", "fr"]);

router.get("/", optionalAuth, async (req, res) => {
  try {
    // L-LANG-INFRA-1 — ?lang= selects the language. Default "es".
    const lang = SUPPORTED_LANGS.has(req.query.lang) ? req.query.lang : "es";

    // For languages without content, return a structured "not available" response.
    if (lang !== "es") {
      const langKurssit = LANG_CURRICULA[lang] || [];
      if (langKurssit.length === 0) {
        return res.json({
          kurssit: [],
          available: false,
          language: lang,
          message: "Sisältöä ei vielä julkaistu — liity wait-listille",
        });
      }
    }

    let kurssit = null;
    // DB kurssit are currently Spanish-only; skip DB fetch for non-es.
    if (lang === "es") {
      try {
        kurssit = await fetchKurssitDb();
      } catch (err) {
        console.error("curriculum fetch error:", err.message);
      }
    }
    if (!kurssit || kurssit.length === 0) kurssit = LANG_CURRICULA[lang] || CURRICULUM_KURSSIT;

    let progressByKurssi = {};
    if (req.user?.userId) {
      try {
        const { data, error } = await supabase
          .from("user_curriculum_progress")
          .select("kurssi_key, lesson_index, completed_at, score_correct, score_total")
          .eq("user_id", req.user.userId);
        if (error && !tablesMissing(error)) throw error;
        for (const row of data || []) {
          (progressByKurssi[row.kurssi_key] ||= []).push(row);
        }
      } catch (err) {
        console.error("curriculum progress fetch:", err.message);
      }
    }

    // Compute unlock + summary per kurssi.
    const out = [];
    let prevPassed = true; // kurssi_1 always unlocked
    for (const k of kurssit) {
      const lessons = lessonsForKurssi(k.key);
      const kertausIdx = lessons.length; // last lesson is kertaustesti
      const userRows = progressByKurssi[k.key] || [];
      const summary = summariseProgress(userRows, k.key, kertausIdx);
      const isUnlocked = req.user ? prevPassed : (k.sort_order === 1);
      out.push({
        key: k.key,
        title: k.title,
        description: k.description,
        level: k.level,
        sortOrder: k.sort_order,
        lessonCount: k.lesson_count,
        lessonsCompleted: summary.lessonsCompleted,
        isUnlocked,
        lastScore: summary.lastScore,
        kertausPassed: summary.kertausPassed,
      });
      prevPassed = summary.kertausPassed;
    }

    res.json({ kurssit: out });
  } catch (err) {
    console.error("GET /api/curriculum error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// ─── GET /api/curriculum/tutor-message ──────────────────────────────────────
// Registered BEFORE the /:kurssiKey dynamic route so its literal path is not
// shadowed. Implementation lives at the bottom of the file (search for
// "tutor-message" handler) — this stub forwards to the deferred handler so
// the route is mounted at the right priority.
router.get("/tutor-message", optionalAuth, (req, res, next) => _tutorMessageHandler(req, res, next));

// ─── GET /api/curriculum/:kurssiKey ─────────────────────────────────────────
router.get("/:kurssiKey", optionalAuth, async (req, res) => {
  try {
    const { kurssiKey } = req.params;
    const fallback = findKurssi(kurssiKey);
    if (!fallback) return res.status(404).json({ error: "Kurssia ei löydy" });

    let kurssi = null;
    try {
      const { data, error } = await supabase
        .from("curriculum_kurssit")
        .select("*")
        .eq("key", kurssiKey)
        .maybeSingle();
      if (error && !tablesMissing(error)) throw error;
      kurssi = data;
    } catch (err) {
      console.error("kurssi fetch:", err.message);
    }
    if (!kurssi) kurssi = fallback;

    let lessons = null;
    try {
      lessons = await fetchLessonsDb(kurssiKey);
    } catch (err) {
      console.error("lessons fetch:", err.message);
    }
    if (!lessons || lessons.length === 0) lessons = lessonsForKurssi(kurssiKey);

    let progressByIndex = {};
    if (req.user?.userId) {
      try {
        const data = await fetchUserProgressDb(req.user.userId, kurssiKey);
        for (const row of data || []) progressByIndex[row.lesson_index] = row;
      } catch (err) {
        console.error("progress fetch:", err.message);
      }
    }

    const lessonsOut = lessons.map((l) => {
      const p = progressByIndex[l.sort_order];
      return {
        id: l.id ?? l.sort_order,
        sortOrder: l.sort_order,
        type: l.type,
        focus: l.focus,
        exerciseCount: l.exercise_count,
        teachingSnippet: l.teaching_snippet,
        completed: !!p,
        score: p ? { correct: p.score_correct, total: p.score_total } : null,
      };
    });

    res.json({
      kurssi: {
        key: kurssi.key,
        title: kurssi.title,
        description: kurssi.description,
        level: kurssi.level,
        vocabTheme: kurssi.vocab_theme,
        grammarFocus: kurssi.grammar_focus || [],
        lessonCount: kurssi.lesson_count,
        sortOrder: kurssi.sort_order,
      },
      lessons: lessonsOut,
    });
  } catch (err) {
    console.error("GET /api/curriculum/:k error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// L-PLAN-5 UPDATE 1 — build a teaching-page Markdown via OpenAI for any
// supported lesson type (grammar, mixed, vocab, reading, writing).
// Cached in `teaching_pages` keyed by `${kurssiKey}_lesson_${sortOrder}`.
function buildTeachingPrompt(lesson, kurssiKey) {
  const kurssiName = KURSSI_META[kurssiKey]?.name || kurssiKey;
  const focus = lesson.focus;

  if (lesson.type === "vocab") {
    return [
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
      "Älä mainitse abstrakteja tasoja (A/B/C/M/E/L). Älä käytä bullet-listoja paitsi taulukoissa.",
      "Käytä sinä-muotoa.",
      "",
      `Aihe: ${focus}`,
      `Konteksti: ${kurssiName}.`,
      "",
      "Kirjoita opetussivu Markdownina. Rakenne TARKASTI:",
      "# [Otsikko — sanastoaihe lyhyesti]",
      "[1 kappale (max 80 sanaa) selkokielistä suomea — kerro mistä sanastosta on kyse, miksi se on tärkeä, ja miten YO-koe testaa sitä.]",
      "## Tärkeimmät sanat",
      "| Suomeksi | Espanjaksi | Esimerkki |",
      "|----------|-----------|-----------|",
      "[Listaa 8–12 ydinsanaa tästä aiheesta. Esimerkkisarakkeessa lyhyt lause espanjaksi.]",
      "## Muista nämä",
      "[2–3 lausetta yleisimmistä sudenkuopista. Esim. ääntämys, kirjoitusasu tai sukumuoto.]",
      "## YO-vinkki 💡",
      "[1–2 lausetta YO-kokeen näkökulmasta. Mitä testataan, mitä kannattaa hallita.]",
      "",
      'Palauta JSON: { "contentMd": "..." }',
    ].join("\n");
  }

  if (lesson.type === "reading") {
    return [
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
      "Älä käytä bullet-listoja paitsi vinkkien kohdalla.",
      "Käytä sinä-muotoa.",
      "",
      `Aihe: ${focus}`,
      `Konteksti: ${kurssiName}.`,
      "",
      "Kirjoita lyhyt valmistautumissivu ENNEN luetun ymmärtämistehtävää. Rakenne TARKASTI:",
      "# [Otsikko — luetun ymmärtäminen aiheesta]",
      "[1 kappale (max 70 sanaa) selkokielistä suomea: rauhoita lukijaa, muistuta että koko tekstiä ei tarvitse ymmärtää sana sanalta. Mainitse mitä sanastoa kannattaa odottaa.]",
      "## Lukustrategia",
      "[2–3 lyhyttä bullet-pointtia: silmäile ensin, etsi avainsanoja, vasta sitten yksityiskohdat.]",
      "## YO-vinkki 💡",
      "[1–2 lausetta YO-luetun ymmärtämisen näkökulmasta — mitä monivalinnoissa testataan.]",
      "",
      'Palauta JSON: { "contentMd": "..." }',
    ].join("\n");
  }

  if (lesson.type === "writing") {
    return [
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
      "Käytä sinä-muotoa. Bullet-listoja saa käyttää rakenne-osassa.",
      "",
      `Aihe: ${focus}`,
      `Konteksti: ${kurssiName}.`,
      "",
      "Kirjoita opetussivu kirjoitustehtävälle. Rakenne TARKASTI:",
      "# [Tehtävän otsikko, esim. \"Kirjoita itsestäsi\"]",
      "[1 kappale (max 70 sanaa): mistä kirjoitat, mitkä aikamuodot oletettavasti tarvitset, mistä saat pisteitä.]",
      "## Vinkki rakenteeseen",
      "- [Aloitus: 1 lyhyt lause]",
      "- [Keskikohta: 1 lyhyt lause]",
      "- [Lopetus: 1 lyhyt lause]",
      "## Mistä saat pisteitä",
      "| Osa-alue | Mitä testataan |",
      "|----------|----------------|",
      "| Viestinnällisyys | [...] |",
      "| Kielen rakenteet | [...] |",
      "| Sanasto | [...] |",
      "| Kokonaisuus | [...] |",
      "## Esimerkkilause",
      "> [yksi malli-lause espanjaksi + suomennos suluissa]",
      "",
      'Palauta JSON: { "contentMd": "..." }',
    ].join("\n");
  }

  // grammar / mixed (default)
  return [
    "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
    "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
    "Älä mainitse abstrakteja tasoja (A/B/C/M/E/L). Älä käytä bullet-listoja paitsi taulukoissa.",
    "Älä kirjoita ylimääräisiä otsikoita. Käytä TARKASTI alla olevaa rakennetta.",
    "",
    `Aihe: ${focus}`,
    `Oppituntityyppi: ${lesson.type === "mixed" ? "yhdistelmä (kielioppi + sanasto)" : "kielioppi"}`,
    `Konteksti: ${kurssiName}.`,
    "",
    "Kirjoita opetussivu Markdownina. Rakenne TARKASTI:",
    "# [Otsikko — lyhyt ja konkreettinen, ei aikamuotojen latinaa]",
    "[1 kappale, max 80 sanaa, selkokielinen suomi, ilman jargonia]",
    "## Muodostus",
    "[Joko taulukko tai 2–4 lyhyttä riviä — vain jos aihe sitä vaatii]",
    "## Esimerkki",
    "> [1–2 lausetta espanjaksi + suomenkieliset käännökset suluissa]",
    "## YO-vinkki 💡",
    "[1–2 lausetta mitä YO-koe testaa tästä aiheesta — konkreettisesti]",
    "",
    'Palauta JSON: { "contentMd": "..." }',
  ].join("\n");
}

function buildTeachingFallback(lesson) {
  const focus = lesson.focus;
  const snippet = lesson.teaching_snippet || "";

  if (lesson.type === "vocab") {
    return [
      `# ${focus}`,
      "",
      snippet || `Tämä oppitunti käsittelee aihetta "${focus}". Opit ydinsanaston ennen harjoittelua.`,
      "",
      "## Tärkeimmät sanat",
      "",
      "| Suomeksi | Espanjaksi | Esimerkki |",
      "|----------|-----------|-----------|",
      "| (sanasto avautuu harjoittelun aikana) | — | — |",
      "",
      "## Muista nämä",
      "",
      "Kiinnitä huomiota oikeinkirjoitukseen ja sanan sukuun (el / la). Pieni ero kirjaimissa muuttaa merkityksen.",
      "",
      "## YO-vinkki 💡",
      "",
      "Sanasto-osiossa testataan sekä tunnistus (espanja → suomi) että tuotanto (suomi → espanja). Kannattaa hallita molemmat.",
    ].join("\n");
  }

  if (lesson.type === "reading") {
    return [
      `# ${focus}`,
      "",
      snippet || "Tämä on luetun ymmärtämisen tehtävä. Lue rauhassa — sinun ei tarvitse ymmärtää joka sanaa.",
      "",
      "## Lukustrategia",
      "",
      "- Silmäile teksti ensin nopeasti läpi.",
      "- Etsi avainsanoja jotka liittyvät kysymyksiin.",
      "- Lue sen jälkeen tarkemmin vain ne kohdat joissa vastaus on.",
      "",
      "## YO-vinkki 💡",
      "",
      "YO-luetun ymmärtämisessä monivalinnat testaavat usein synonyymejä — älä etsi tekstistä täsmälleen samoja sanoja kuin kysymyksessä.",
    ].join("\n");
  }

  if (lesson.type === "writing") {
    return [
      `# ${focus}`,
      "",
      snippet || `Tässä kirjoitustehtävässä harjoittelet aihetta "${focus}". Lue ohje rauhassa ennen kuin aloitat.`,
      "",
      "## Vinkki rakenteeseen",
      "",
      "- Aloita lyhyellä esittelyllä.",
      "- Kerro keskellä ydintieto tai tarina.",
      "- Päätä yhteenvetoon tai tunnelmaan.",
      "",
      "## Mistä saat pisteitä",
      "",
      "| Osa-alue | Mitä testataan |",
      "|----------|----------------|",
      "| Viestinnällisyys | Saatko viestin perille? |",
      "| Kielen rakenteet | Aikamuodot, sanajärjestys, sukumuoto. |",
      "| Sanasto | Aiheeseen sopiva sanavalinta. |",
      "| Kokonaisuus | Onko teksti sidottu yhteen? |",
      "",
      "## Esimerkkilause",
      "",
      "> Me llamo Anna y tengo diecisiete años. (Nimeni on Anna ja olen 17-vuotias.)",
    ].join("\n");
  }

  // grammar / mixed (default)
  return [
    `# ${focus}`,
    "",
    snippet || "Tämä aihe sisältää kielioppirakenteen, jota harjoitellaan tässä oppitunnissa.",
    "",
    "## Esimerkki",
    "",
    "> Harjoittelu alkaa heti — ratkaiset 8 lyhyttä tehtävää.",
    "",
    "## YO-vinkki 💡",
    "",
    "Tämä rakenne esiintyy YO-kokeen rakenteet-osiossa lähes joka vuosi.",
  ].join("\n");
}

const TEACHING_TYPES = new Set(["grammar", "mixed", "vocab", "reading", "writing"]);

async function getOrGenerateTeachingPage(kurssiKey, sortOrder, lesson) {
  if (!lesson || !TEACHING_TYPES.has(lesson.type)) return null;
  const topicKey = `${kurssiKey}_lesson_${sortOrder}`;

  // Check cache
  try {
    const { data, error } = await supabase
      .from("teaching_pages")
      .select("content_md")
      .eq("topic_key", topicKey)
      .maybeSingle();
    if (!error && data?.content_md) return { contentMd: data.content_md, cached: true };
  } catch { /* table missing or other — fall through to generation */ }

  const prompt = buildTeachingPrompt(lesson, kurssiKey);
  const maxTok = lesson.type === "writing" ? 450 : (lesson.type === "vocab" ? 600 : 400);

  let contentMd = null;
  try {
    const ai = await callOpenAI(prompt, maxTok, { temperature: 0.3 });
    if (ai?.contentMd && typeof ai.contentMd === "string" && ai.contentMd.length > 50) {
      contentMd = ai.contentMd.trim();
    }
  } catch (err) {
    console.warn("teaching-page OpenAI failed:", err.message);
  }

  if (!contentMd) {
    contentMd = buildTeachingFallback(lesson);
  }

  // Cache it (best-effort)
  try {
    await supabase.from("teaching_pages").upsert({
      topic_key: topicKey,
      content_md: contentMd,
      generated_at: new Date().toISOString(),
    });
  } catch { /* cache table missing — fine */ }

  return { contentMd, cached: false };
}

// L-LANG-INFRA-1 — delegate to lib/curriculum.js readLessonFile so the
// data/courses/${lang}/ path is managed in one place. Lang defaults to "es".
async function readPregeneratedLesson(courseKey, lessonIndex, lang = "es") {
  if (process.env.USE_PREGENERATED_LESSONS !== "true") return null;
  return readLessonFile(courseKey, lessonIndex, lang);
}

// ─── GET /api/curriculum/:kurssiKey/lesson/:lessonIndex ─────────────────────
router.get("/:kurssiKey/lesson/:lessonIndex", optionalAuth, async (req, res) => {
  try {
    const { kurssiKey } = req.params;
    const lessonIndex = Number(req.params.lessonIndex);
    if (!Number.isInteger(lessonIndex) || lessonIndex < 1) {
      return res.status(400).json({ error: "Virheellinen oppitunnin numero" });
    }
    if (!findKurssi(kurssiKey)) {
      return res.status(404).json({ error: "Kurssia ei löydy" });
    }

    // L-COURSE-1 UPDATE 3 / L-LANG-INFRA-1 — pre-generated short-circuit.
    // Returns the full schema-shaped object plus lessonContext (target_grade)
    // so the runner can pick mastery thresholds + skip_for_targets correctly.
    // For non-ES langs, readPregeneratedLesson returns { available: false }
    // which is surfaced to the client rather than falling through to AI gen.
    const lang = SUPPORTED_LANGS.has(req.query.lang) ? req.query.lang : "es";
    const pregenerated = await readPregeneratedLesson(kurssiKey, lessonIndex, lang);
    if (pregenerated) {
      if (pregenerated.available === false) {
        return res.status(503).json({
          available: false,
          language: pregenerated.language,
          message: pregenerated.message,
        });
      }
      const tg = req.user?.userId ? await fetchTargetGrade(req.user.userId) : "B";
      return res.json({ pregenerated, lessonContext: { targetGrade: tg } });
    }

    let lessons = null;
    try {
      lessons = await fetchLessonsDb(kurssiKey);
    } catch { /* fall through */ }
    if (!lessons || lessons.length === 0) lessons = lessonsForKurssi(kurssiKey);

    const lesson = lessons.find((l) => l.sort_order === lessonIndex);
    if (!lesson) return res.status(404).json({ error: "Oppituntia ei löydy" });

    let teachingPage = null;
    try {
      teachingPage = await getOrGenerateTeachingPage(kurssiKey, lessonIndex, lesson);
    } catch (err) {
      console.warn("teaching-page generate failed:", err.message);
    }

    // L-PLAN-6 — adjust the exposed exerciseCount by the user's target_grade.
    // Anonymous (no user) sees the baseline so the public preview is honest;
    // logged-in users see their own pacing.
    const targetGrade = req.user?.userId ? await fetchTargetGrade(req.user.userId) : "B";
    const baselineCount = Number(lesson.exercise_count) || 8;
    const adjustedCount = applyTargetMultiplier(baselineCount, targetGrade);

    res.json({
      lesson: {
        id: lesson.id ?? lesson.sort_order,
        kurssiKey,
        sortOrder: lesson.sort_order,
        type: lesson.type,
        focus: lesson.focus,
        // L-PLAN-6 — `exerciseCount` stays the baseline so the existing
        // contract is unchanged. `lessonContext.exerciseCount` exposes
        // the target-grade-adjusted count the UI prefers when present.
        exerciseCount: baselineCount,
        teachingSnippet: lesson.teaching_snippet,
      },
      lessonContext: { targetGrade, exerciseCount: adjustedCount, baselineExerciseCount: baselineCount },
      teachingPage,
    });
  } catch (err) {
    console.error("GET lesson error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// L-PLAN-7 — compute the "Kertasit myös tätä" summary from per-item
// reviewItems[] sent by the client. Bins by (review_source, topic_key)
// and emits one row per distinct review topic with a non-shaming
// headline matched to the band: 100% → "Vahvistui", >0% → "Pieni
// muistutus", 0% → "Tämä kaipaa vielä huomiota". Skill applied:
// design:ux-copy + education/self-efficacy-builder-sequence.
function sanitiseReviewItems(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((r) => r && typeof r === "object")
    .slice(0, 12)
    .map((r) => ({
      topic_key: String(r.topic_key || "").slice(0, 80) || null,
      review_source: String(r.review_source || "").slice(0, 80) || null,
      review_source_label: String(r.review_source_label || "").slice(0, 200) || null,
      correct: !!r.correct,
    }));
}

function buildReviewSummary(reviewItems) {
  if (!Array.isArray(reviewItems) || reviewItems.length === 0) return [];
  const bins = new Map();
  for (const r of reviewItems) {
    const key = r.review_source || r.topic_key || "unknown";
    if (!bins.has(key)) {
      bins.set(key, {
        topic_key: r.topic_key || null,
        review_source: r.review_source || null,
        label: r.review_source_label || (r.review_source ? getLessonLabel(r.review_source) : (r.topic_key || "")),
        correct: 0,
        total: 0,
      });
    }
    const row = bins.get(key);
    row.total += 1;
    if (r.correct) row.correct += 1;
  }
  const out = [];
  for (const row of bins.values()) {
    let headline;
    if (row.total > 0 && row.correct === row.total) headline = "Vahvistui";
    else if (row.correct > 0) headline = "Pieni muistutus";
    else headline = "Tämä kaipaa vielä huomiota";
    out.push({ ...row, headline });
  }
  return out;
}

// Sanitise wrongAnswers[] from the client. We trust nothing — every field is
// clamped to a string ≤200 chars, list capped at 20 entries.
function sanitiseWrongAnswers(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((a) => a && typeof a === "object")
    .slice(0, 20)
    .map((a) => ({
      question: String(a.question || "").slice(0, 200),
      studentAnswer: String(a.studentAnswer || "").slice(0, 200),
      correctAnswer: String(a.correctAnswer || "").slice(0, 200),
      topic_key: String(a.topic_key || "").slice(0, 60) || null,
    }));
}

// L-PLAN-6 — tone descriptor per target_grade. Same Finnish, different
// register. Applied via puheo-finnish-voice + education/intelligent-
// tutoring-dialogue-designer + education/self-efficacy-builder-sequence:
// I/A keep the warmth and forbid shame; M/E/L raise the bar without
// keventely. Frame: tavoite mahdollistaa, ei vaadi.
const TONE_DESCRIPTORS = {
  I: "Erittäin kannustava, kärsivällinen, juhli pieniä voittoja, älä koskaan moittele virheistä. Käytä lämmin sävy.",
  A: "Lämmin, kärsivällinen, nimeä konkreettinen onnistuminen, vihjaa seuraavaan askeleeseen pehmeästi.",
  B: "Suora ja lämmin, nimeä mitä meni hyvin ja mitä parannetaan, ehdota seuraava askel.",
  C: "Suora, nimeä rakenne joka oli vahva, mainitse yksi spesifi parannuskohde.",
  M: "Suora ja vaativa mutta lämmin, oletuksena että oppilas haluaa parantua, käytä ammattikielen termiä jos relevantti.",
  E: "Vaativa, suora, oletuksena täydellinen hallinta tavoitteena, älä keventele virheitä.",
  L: "Erittäin vaativa, oleta täydellinen kontrolli, nosta esille hienoja vivahde-eroja, vaadi lisätyötä jos jokin oli horjuva.",
};
function toneBlock(targetGrade) {
  const t = TONE_DESCRIPTORS[targetGrade] || TONE_DESCRIPTORS.B;
  return [
    "TYYLI:",
    `- Tavoite ${targetGrade || "B"}: ${t}`,
    "- Aina sinä-muoto, suomeksi, max 2 lausetta.",
    "- Ei \"Hyvää työtä!\" -geneerisyyksiä.",
  ].join("\n");
}

// Pick a fallback metacognitive prompt based on score band. The AI is the
// preferred source — this only fires when the AI call fails.
function fallbackMetacognitive(scorePct, lessonFocus) {
  if (scorePct >= 0.95) return `Pystyt nyt tunnistamaan rakenteen "${lessonFocus}" lähes virheettömästi — se on jo automatisoitumassa.`;
  if (scorePct >= 0.80) return `Hallitset jo aiheen "${lessonFocus}" peruskäytön — pari tarkkuusvirhettä on tässä vaiheessa täysin normaalia.`;
  if (scorePct >= 0.60) return `Aiheessa "${lessonFocus}" on vielä hiottavaa — se on yksi rakenne joka kaipaa toistoa, ei uutta sääntöä.`;
  return `"${lessonFocus}" on tässä vaiheessa vielä haastava — palaa rauhassa peruskäyttöön ennen edistyneempiä tehtäviä.`;
}

// Compute the fast-track flag: 3 consecutive lessons in the same kurssi with
// score ≥ 85%. Returns true only when the user has just completed a third
// such lesson in a row.
async function checkFastTrack(userId, kurssiKey) {
  try {
    const { data, error } = await supabase
      .from("user_curriculum_progress")
      .select("lesson_index, score_correct, score_total, completed_at")
      .eq("user_id", userId)
      .eq("kurssi_key", kurssiKey)
      .order("completed_at", { ascending: false })
      .limit(3);
    if (error) return false;
    const rows = data || [];
    if (rows.length < 3) return false;
    return rows.every((r) =>
      typeof r.score_correct === "number" &&
      typeof r.score_total === "number" &&
      r.score_total > 0 &&
      (r.score_correct / r.score_total) >= 0.85
    );
  } catch { return false; }
}

// ─── POST /api/curriculum/:kurssiKey/lesson/:lessonIndex/complete ───────────
router.post("/:kurssiKey/lesson/:lessonIndex/complete", requireAuth, async (req, res) => {
  try {
    const { kurssiKey } = req.params;
    const lessonIndex = Number(req.params.lessonIndex);
    const scoreCorrect = Number(req.body?.scoreCorrect ?? 0);
    const scoreTotal = Number(req.body?.scoreTotal ?? 0);
    const wrongAnswers = sanitiseWrongAnswers(req.body?.wrongAnswers);
    // L-PLAN-7 — review item array drives the post-results summary.
    const reviewItems = sanitiseReviewItems(req.body?.reviewItems);
    const reviewSummary = buildReviewSummary(reviewItems);

    if (!findKurssi(kurssiKey)) return res.status(404).json({ error: "Kurssia ei löydy" });

    const lessons = lessonsForKurssi(kurssiKey);
    const lesson = lessons.find((l) => l.sort_order === lessonIndex);
    if (!lesson) return res.status(404).json({ error: "Oppituntia ei löydy" });

    // Persist completion (best-effort — never block the UX)
    try {
      await supabase.from("user_curriculum_progress").upsert({
        user_id: req.user.userId,
        kurssi_key: kurssiKey,
        lesson_index: lessonIndex,
        completed_at: new Date().toISOString(),
        score_correct: scoreCorrect,
        score_total: scoreTotal,
      }, { onConflict: "user_id,kurssi_key,lesson_index" });
    } catch (err) {
      console.warn("progress upsert:", err.message);
    }

    // L-PLAN-4 UPDATE 5 — streak bridge. The dashboard streak counter (and
    // every per-mode dashboard.js stat) reads from `exercise_logs`, not from
    // `user_curriculum_progress`. Without this row the curriculum loop would
    // not register as activity for the streak / weekly counters. Map lesson
    // type to the existing VALID_MODES set in routes/progress.js so the row
    // is shaped identically to free-practice writes.
    try {
      const STREAK_MODE = ({
        vocab: "vocab",
        grammar: "grammar",
        mixed: "grammar",
        reading: "reading",
        writing: "writing",
        test: "exam",
      })[lesson.type] || "vocab";
      await supabase.from("exercise_logs").insert({
        user_id: req.user.userId,
        mode: STREAK_MODE,
        level: null,
        score_correct: scoreCorrect,
        score_total: scoreTotal,
        ytl_grade: null,
      });
    } catch (err) {
      // Never fail the endpoint over the bridge — streak is convenience.
      console.warn("[curriculum/complete] exercise_logs insert failed:", err.message);
    }

    // Determine kurssi-complete status
    // L-PLAN-6 — pass-threshold is now target_grade-dependent (I/A 0.7,
    // B/C 0.8, M 0.85, E/L 0.9). The default PASS_THRESHOLD constant
    // remains as the B/C baseline for any non-curriculum callers.
    const targetGrade = await fetchTargetGrade(req.user.userId);
    const targetThreshold = passThresholdFor(targetGrade);
    const isKertaustesti = lesson.type === "test" && lessonIndex === lessons.length;
    const passPct = scoreTotal > 0 ? (scoreCorrect / scoreTotal) : 0;
    const kurssiComplete = isKertaustesti && passPct >= targetThreshold;

    // Find next kurssi
    const all = CURRICULUM_KURSSIT;
    const idx = all.findIndex((k) => k.key === kurssiKey);
    const nextKurssi = (kurssiComplete && idx >= 0 && idx + 1 < all.length) ? all[idx + 1] : null;

    const kurssiName = (CURRICULUM_KURSSIT.find((k) => k.key === kurssiKey)?.title || kurssiKey).split(" — ").slice(1).join(" — ") || kurssiKey;

    // Build the AI prompt. Single OpenAI call returns BOTH the tutor message
    // and the metacognitive observation so we don't double-charge.
    let tutorMessage = "";
    let metacognitivePrompt = "";
    try {
      const wrongList = wrongAnswers.length
        ? wrongAnswers
            .map((w, i) => `  ${i + 1}. opiskelija kirjoitti "${w.studentAnswer}", oikea vastaus "${w.correctAnswer}"${w.topic_key ? ` (aihe: ${w.topic_key})` : ""}`)
            .join("\n")
        : "  (ei virheitä — kaikki oikein)";
      // L-PLAN-7 — describe what the student also reviewed so the
      // tutorMessage can reference the cumulative review explicitly,
      // e.g. "kertasit myös -ar verbejä — niissä menee nyt paremmin".
      const reviewLine = reviewSummary.length
        ? "Tässä sessiossa kertasit myös:\n" + reviewSummary
            .map((r) => `  - ${r.label} → ${r.correct}/${r.total} oikein (${r.headline.toLowerCase()})`)
            .join("\n")
        : "";
      const passLabel = passPct >= targetThreshold ? "hyvä" : "tarvitsee lisäharjoittelua";
      const aiPrompt = [
        "Olet Puheo, suomalainen AI-tutori (lukio, espanjan YO-koe).",
        "Vastaa AINA suomeksi, sinä-muodossa, lämpimästi mutta täsmällisesti.",
        "Älä käytä bullet-listoja. Älä mainitse pistemääriä numeroin.",
        "",
        toneBlock(targetGrade),
        "",
        `Konteksti:`,
        `- Oppilas suoritti oppitunnin aiheesta "${lesson.focus}".`,
        `- Kurssi: ${kurssiName}.`,
        `- Tulos: ${scoreCorrect}/${scoreTotal} (${passLabel})${isKertaustesti ? " — KERTAUSTESTI" : ""}.`,
        `- Väärät vastaukset:`,
        wrongList,
        reviewLine,
        "",
        "Tehtäväsi: kirjoita kaksi kenttää JSON-objektiin:",
        "1) tutorMessage: 2–3 lausetta. Jos virheitä on: mainitse juuri se rakenne tai sanaryhmä jossa virheet keskittyivät, selitä lyhyt sääntö, kerro seuraava askel. Jos kaikki oikein: mainitse mitä konkreettisesti hallitset nyt, vihjaa seuraavaan aiheeseen. " + (isKertaustesti
          ? (kurssiComplete
              ? `Tämä on kertaustesti ja se meni läpi — lupaa että jatketaan kohti seuraavaa kurssia "${nextKurssi?.title || "seuraavaa"}".`
              : "Tämä on kertaustesti eikä mennyt läpi — sano että harjoitellaan kurssin rakenteita vielä rauhassa ennen etenemistä.")
          : ""),
        "2) metacognitivePrompt: TARKASTI 1 lause, ei kysymys vaan reflektiohuomio. Auta oppilasta tunnistamaan oma kuvionsa virheissä — esim. \"Huomasit varmasti, että preteriti -ir verbeissä on eri pääte kuin -ar verbeissä.\" Jos kaikki oikein, kirjoita positiivinen huomio rakenteen hallinnasta. Tyyli: lyhyt, neutraali, konkreettinen.",
        "",
        'Palauta JSON: { "tutorMessage": "...", "metacognitivePrompt": "..." }',
      ].join("\n");
      const ai = await callOpenAI(aiPrompt, 200, { temperature: 0.5 });
      const t = String(ai?.tutorMessage || "").trim();
      if (t.length >= 20 && !/^[\s\-•*]/.test(t)) tutorMessage = t;
      const m = String(ai?.metacognitivePrompt || "").trim();
      if (m.length >= 15 && !/^[\s\-•*]/.test(m)) metacognitivePrompt = m;
    } catch (err) {
      console.warn("tutorMessage AI failed:", err.message);
    }

    if (!tutorMessage) {
      // Hardcoded Finnish fallback so endpoint never fails the user.
      if (isKertaustesti && kurssiComplete) {
        tutorMessage = `Hienoa työtä — kurssin "${kurssiName}" kertaustesti meni läpi. Jatketaan${nextKurssi ? ` kohti kurssia ${nextKurssi.title}` : " vielä syvemmälle"}.`;
      } else if (isKertaustesti) {
        tutorMessage = `Hyvä yritys, mutta kurssin "${kurssiName}" rakenteet kaipaavat vielä harjoittelua. Käydään niitä läpi rauhassa ennen etenemistä.`;
      } else if (passPct >= 0.80) {
        tutorMessage = `Hieno suoritus aiheesta "${lesson.focus}" — kurssi etenee hyvin. Seuraavaksi siirrytään seuraavaan oppituntiin.`;
      } else {
        tutorMessage = `Aihe "${lesson.focus}" kaipaa vielä harjoittelua. Annan sinulle 3 lisätehtävää tästä rakenteesta ennen kuin jatkat eteenpäin.`;
      }
    }
    if (!metacognitivePrompt) {
      metacognitivePrompt = fallbackMetacognitive(passPct, lesson.focus);
    }

    // Fast-track offer — 3 consecutive ≥85% in this kurssi.
    const fastTrack = await checkFastTrack(req.user.userId, kurssiKey);

    res.json({
      kurssiComplete,
      nextKurssiUnlocked: !!nextKurssi,
      nextKurssiKey: nextKurssi?.key || null,
      nextKurssiTitle: nextKurssi?.title || null,
      tutorMessage,
      metacognitivePrompt,
      // L-PLAN-7 — surface the review summary so the lesson-results card
      // can render the "Kertasit myös tätä" -osio.
      reviewSummary,
      fastTrack,
      isKertaustesti,
      passed: !isKertaustesti || kurssiComplete,
    });
  } catch (err) {
    console.error("POST complete error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

// ─── GET /api/curriculum/tutor-message ──────────────────────────────────────
// L-PLAN-3 — daily-cached AI tutor greeting for the dashboard. The cache key
// lives on user_profile (tutor_greeting + tutor_greeting_at). Anonymous
// callers receive { message: null } so the dashboard hides the card cleanly.
//
// CURRICULUM_SPEC §7: 1–2 sentences, concrete, sinä-muoto, references the
// student's last session + current kurssi + days-to-exam + weakest area.

const TUTOR_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_EXAM_DATE = "2026-09-28";

function timeOfDayFinnish() {
  const h = new Date().getHours();
  if (h < 5) return "yo";
  if (h < 11) return "aamu";
  if (h < 17) return "päivä";
  if (h < 22) return "ilta";
  return "yo";
}

function fallbackGreeting({ daysToExam, lastFocus, weakArea, kurssiTitle }) {
  // Time-of-day flavoured fallbacks so the card feels alive even when AI fails.
  const tod = timeOfDayFinnish();
  const tervehdys = tod === "aamu" ? "Hyvää huomenta!" : tod === "ilta" ? "Iltaa!" : "Tervetuloa takaisin.";
  if (lastFocus) {
    return `${tervehdys} Viime kerralla harjoittelit aiheesta "${lastFocus}". Jatketaan siitä — tänään tehdään seuraava askel.`;
  }
  if (weakArea) {
    return `${tervehdys} Sinulla on vielä haasteita aiheessa "${weakArea}". Tänään harjoitellaan sitä rauhassa.`;
  }
  if (kurssiTitle) {
    return `${tervehdys} Olet kurssilla "${kurssiTitle}". Tehdään tänään yksi pieni askel eteenpäin.`;
  }
  if (Number.isInteger(daysToExam) && daysToExam > 0) {
    return `${tervehdys} ${daysToExam} päivää YO-kokeeseen — pieni harjoitus tänään pitää vauhdin yllä.`;
  }
  return `${tervehdys} Aloitetaan päivän harjoitus rauhassa.`;
}

async function _tutorMessageHandler(req, res) {
  // Anonymous → no card.
  if (!req.user?.userId) return res.json({ message: null });
  const userId = req.user.userId;

  // 1. Read user_profile for cache + context.
  let profile = null;
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("tutor_greeting, tutor_greeting_at, placement_kurssi, weak_areas, exam_date, current_grade, target_grade")
      .eq("user_id", userId)
      .maybeSingle();
    if (!error) profile = data || null;
  } catch (err) {
    console.warn("tutor-message profile fetch:", err.message);
  }

  // 2. Cache hit?
  const cachedAt = profile?.tutor_greeting_at ? new Date(profile.tutor_greeting_at).getTime() : 0;
  const cachedMessage = profile?.tutor_greeting;
  if (cachedMessage && cachedAt && Date.now() - cachedAt < TUTOR_CACHE_TTL_MS) {
    return res.json({ message: cachedMessage, cached: true });
  }

  // 3. Build context for the prompt.
  let lastSession = null;
  try {
    const { data, error } = await supabase
      .from("user_curriculum_progress")
      .select("kurssi_key, lesson_index, score_correct, score_total, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(1);
    if (error && !tablesMissing(error)) throw error;
    lastSession = (data || [])[0] || null;
  } catch (err) {
    console.warn("tutor-message progress fetch:", err.message);
  }

  let lastFocus = null;
  if (lastSession) {
    const lessons = lessonsForKurssi(lastSession.kurssi_key);
    const lesson = lessons.find((l) => l.sort_order === lastSession.lesson_index);
    lastFocus = lesson?.focus || null;
  }

  const kurssiKey = lastSession?.kurssi_key || profile?.placement_kurssi || "kurssi_1";
  const kurssi = findKurssi(kurssiKey);
  const kurssiTitle = kurssi?.title || "";

  const examDateStr = profile?.exam_date || DEFAULT_EXAM_DATE;
  const examDate = new Date(examDateStr);
  const daysToExam = Number.isFinite(examDate.getTime())
    ? Math.max(0, Math.round((examDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const weakAreas = Array.isArray(profile?.weak_areas) ? profile.weak_areas : [];
  const weakArea = weakAreas[0] || null;

  // 4. Try OpenAI. On any failure → time-of-day fallback. Never fail the endpoint.
  let message = null;
  try {
    const scoreLine = lastSession && lastSession.score_total
      ? `${lastSession.score_correct}/${lastSession.score_total}`
      : "ei vielä tuloksia";
    const aiPrompt = [
      "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
      "espanjan lyhyestä oppimäärästä. Puhut suoraan oppilaalle (sinä-muoto), suomeksi.",
      "Tyyli: lyhyt, konkreettinen, lämmin. Ei yleisiä rohkaisuja, ei abstraktia tasopuhetta.",
      "Älä käytä bullet-listoja. Älä mainitse pistemääriä numeroin.",
      "",
      toneBlock(profile?.target_grade),
      "",
      `Oppilaan tilanne:`,
      `- Nykyinen kurssi: ${kurssiTitle || "ei vielä määritetty"}`,
      `- Viimeisin oppitunti: ${lastFocus || "ei vielä suoritettu"}`,
      `- Viimeisimmän session tulos: ${scoreLine}`,
      `- Heikoin alue: ${weakArea || "ei vielä tunnistettu"}`,
      `- Päivää YO-kokeeseen: ${daysToExam ?? "ei tiedossa"}`,
      "",
      "Kirjoita TARKASTI 1–2 lausetta, jotka ottavat huomioon yllä olevan kontekstin.",
      "Esimerkkejä oikeasta tyylistä (älä kopioi — generoi uusi):",
      "  - \"Hyvä putki! Eilen preteriti sujui hyvin — tänään mennään imperfektiin.\"",
      "  - \"Subjunktiivi tuottaa vielä haasteita. Tänään harjoitellaan sitä lisää.\"",
      "  - \"152 päivää kokeeseen. Olet kurssilla 3/8 — hyvää vauhtia.\"",
      "",
      'Palauta JSON: { "message": "..." }',
    ].join("\n");
    const ai = await callOpenAI(aiPrompt, 80, { temperature: 0.7 });
    const t = String(ai?.message || "").trim();
    // Sanity-check: ≥20 chars, no leading bullet/dash, ≤300 chars.
    if (t.length >= 20 && t.length <= 300 && !/^[\s\-•*]/.test(t)) {
      message = t;
    }
  } catch (err) {
    console.warn("tutor-message AI failed:", err.message);
  }

  if (!message) {
    message = fallbackGreeting({ daysToExam, lastFocus, weakArea, kurssiTitle });
  }

  // 5. Cache to user_profile (best-effort).
  try {
    await supabase
      .from("user_profile")
      .upsert({
        user_id: userId,
        tutor_greeting: message,
        tutor_greeting_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
  } catch (err) {
    // Columns may not exist yet pre-migration — fall through, the response
    // is still served. Silenced to avoid log noise on every dashboard load.
    if (!tablesMissing(err)) console.warn("tutor-message cache:", err.message);
  }

  res.json({ message, cached: false });
}

export default router;
