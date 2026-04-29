import { Router } from "express";
import supabase from "../supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { callOpenAI } from "../lib/openai.js";
import { KURSSI_META } from "../lib/curriculum.js";
import {
  CURRICULUM_KURSSIT,
  CURRICULUM_LESSONS,
  lessonsForKurssi,
  findKurssi,
} from "../lib/curriculumData.js";

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
router.get("/", optionalAuth, async (req, res) => {
  try {
    let kurssit = null;
    try {
      kurssit = await fetchKurssitDb();
    } catch (err) {
      console.error("curriculum fetch error:", err.message);
    }
    if (!kurssit || kurssit.length === 0) kurssit = CURRICULUM_KURSSIT;

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

// Build a teaching-page Markdown via OpenAI for a grammar/mixed lesson.
// Cached in `teaching_pages` keyed by `${kurssiKey}_lesson_${sortOrder}`.
async function getOrGenerateTeachingPage(kurssiKey, sortOrder, lesson) {
  if (!lesson || !["grammar", "mixed"].includes(lesson.type)) return null;
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

  // Generate
  const prompt = [
    "Olet Puheo, suomalainen AI-tutori, joka opettaa lukiolaista YO-koetta varten",
    "espanjan lyhyestä oppimäärästä. Selitykset ovat suomeksi, lyhyitä, konkreettisia.",
    "Älä mainitse abstrakteja tasoja (A/B/C/M/E/L). Älä käytä bullet-listoja paitsi taulukoissa.",
    "Älä kirjoita ylimääräisiä otsikoita. Käytä TARKASTI alla olevaa rakennetta.",
    "",
    `Aihe: ${lesson.focus}`,
    `Oppituntityyppi: ${lesson.type === "mixed" ? "yhdistelmä (kielioppi + sanasto)" : "kielioppi"}`,
    `Konteksti: Tämä on Kurssi (${KURSSI_META[kurssiKey]?.name || kurssiKey}).`,
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

  let contentMd = null;
  try {
    const ai = await callOpenAI(prompt, 400, { temperature: 0.3 });
    if (ai?.contentMd && typeof ai.contentMd === "string" && ai.contentMd.length > 50) {
      contentMd = ai.contentMd.trim();
    }
  } catch (err) {
    console.warn("teaching-page OpenAI failed:", err.message);
  }

  if (!contentMd) {
    contentMd = [
      `# ${lesson.focus}`,
      "",
      lesson.teaching_snippet || "Tämä aihe sisältää kielioppirakenteen, jota harjoitellaan tässä oppitunnissa.",
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

    res.json({
      lesson: {
        id: lesson.id ?? lesson.sort_order,
        kurssiKey,
        sortOrder: lesson.sort_order,
        type: lesson.type,
        focus: lesson.focus,
        exerciseCount: lesson.exercise_count,
        teachingSnippet: lesson.teaching_snippet,
      },
      teachingPage,
    });
  } catch (err) {
    console.error("GET lesson error:", err.message);
    res.status(500).json({ error: "Jokin meni pieleen — yritä uudelleen" });
  }
});

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

    // Determine kurssi-complete status
    const isKertaustesti = lesson.type === "test" && lessonIndex === lessons.length;
    const passPct = scoreTotal > 0 ? (scoreCorrect / scoreTotal) : 0;
    const kurssiComplete = isKertaustesti && passPct >= PASS_THRESHOLD;

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
      const passLabel = passPct >= 0.80 ? "hyvä" : "tarvitsee lisäharjoittelua";
      const aiPrompt = [
        "Olet Puheo, suomalainen AI-tutori (lukio, espanjan YO-koe).",
        "Vastaa AINA suomeksi, sinä-muodossa, lämpimästi mutta täsmällisesti.",
        "Älä käytä bullet-listoja. Älä mainitse pistemääriä numeroin.",
        "",
        `Konteksti:`,
        `- Oppilas suoritti oppitunnin aiheesta "${lesson.focus}".`,
        `- Kurssi: ${kurssiName}.`,
        `- Tulos: ${scoreCorrect}/${scoreTotal} (${passLabel})${isKertaustesti ? " — KERTAUSTESTI" : ""}.`,
        `- Väärät vastaukset:`,
        wrongList,
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
