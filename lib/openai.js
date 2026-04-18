import supabase from "../supabase.js";

export const OPENAI_API = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODEL = "gpt-4o-mini";

// ─── Timeout + Circuit breaker ──────────────────────────────────────────────

const OPENAI_TIMEOUT_MS = 30000; // 30s max per request
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60000; // 1 minute cooldown

let _circuitFailures = 0;
let _circuitOpenUntil = 0;

// ─── Response cache ─────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
const _memCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX_SIZE = 100;

function getCacheKey(prompt, maxTokens) {
  return `${prompt.slice(0, 200)}::${maxTokens}`;
}

// In-memory cache (dev)
function memGetCached(key) {
  const entry = _memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _memCache.delete(key);
    return null;
  }
  return entry.data;
}

function memSetCache(key, data) {
  if (_memCache.size >= CACHE_MAX_SIZE) {
    const oldest = _memCache.keys().next().value;
    _memCache.delete(oldest);
  }
  _memCache.set(key, { data, ts: Date.now() });
}

// Supabase cache (prod)
async function dbGetCached(key) {
  try {
    const { data, error } = await supabase
      .from("ai_cache")
      .select("data, expires_at")
      .eq("key", key)
      .single();

    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) return null;
    return data.data;
  } catch {
    return null;
  }
}

async function dbSetCache(key, data) {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();

    // Enforce max size: delete oldest if at cap
    const { count } = await supabase
      .from("ai_cache")
      .select("*", { count: "exact", head: true });

    if (count >= CACHE_MAX_SIZE) {
      const { data: oldest } = await supabase
        .from("ai_cache")
        .select("key")
        .order("created_at", { ascending: true })
        .limit(count - CACHE_MAX_SIZE + 1);

      if (oldest?.length) {
        await supabase
          .from("ai_cache")
          .delete()
          .in("key", oldest.map((r) => r.key));
      }
    }

    await supabase.from("ai_cache").upsert({
      key,
      data,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cache write error:", err.message);
  }
}

async function getCached(key) {
  if (!isProd) return memGetCached(key);
  return dbGetCached(key);
}

async function setCache(key, data) {
  if (!isProd) return memSetCache(key, data);
  return dbSetCache(key, data);
}

/**
 * Call OpenAI chat completions API with caching and circuit breaker.
 * @param {string} prompt - The user prompt to send
 * @param {number} [maxTokens=2000] - Maximum tokens in response
 * @returns {Promise<object>} Parsed JSON response from the model
 * @throws {Error} On timeout, API error, or circuit breaker open
 */
export async function callOpenAI(prompt, maxTokens = 2000) {
  // Circuit breaker check
  if (_circuitFailures >= CIRCUIT_FAILURE_THRESHOLD && Date.now() < _circuitOpenUntil) {
    throw new Error("AI-palvelu on tilapäisesti poissa käytöstä. Yritä hetken kuluttua uudelleen.");
  }

  // Check cache
  const cacheKey = getCacheKey(prompt, maxTokens);
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`OpenAI API error ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());

    // Extract usage info
    const usage = data.usage || {};
    parsed._usage = {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    };

    // Reset circuit breaker on success
    _circuitFailures = 0;

    // Cache the result (fire-and-forget in prod)
    setCache(cacheKey, parsed);

    return parsed;
  } catch (err) {
    if (err.name === "AbortError") {
      _circuitFailures++;
      _circuitOpenUntil = Date.now() + CIRCUIT_RESET_MS;
      throw new Error("AI-pyyntö aikakatkaistiin (30s). Yritä uudelleen.");
    }
    _circuitFailures++;
    if (_circuitFailures >= CIRCUIT_FAILURE_THRESHOLD) {
      _circuitOpenUntil = Date.now() + CIRCUIT_RESET_MS;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const LEVEL_DESCRIPTIONS = {
  I: "improbatur — barely any Spanish. Student cannot form basic sentences. Test only the most fundamental words: casa, familia, libro, amigo, comer, ir. Distractors should be plausible but clearly different in meaning.",
  A: "approbatur — weak pass. Knows basic vocabulary but makes fundamental errors. Can handle present tense only. Test elementary everyday words: ropa, tienda, hablar, trabajar, ciudad. Student at this level confuses very basic words.",
  B: "lubenter approbatur — adequate pass. Understands everyday vocabulary, still makes frequent grammar errors. Test vocabulary related to travel, food, school, work, health. Distractors should be semantically close (e.g. confusing similar concepts).",
  C: "cum laude approbatur — above average. Decent vocabulary range. Test intermediate vocabulary: less common nouns, phrasal structures, words from authentic texts about society and culture. Distractors should require real knowledge to distinguish.",
  M: "magna cum laude approbatur — good. Solid vocabulary, can handle complex topics. Test nuanced vocabulary, idiomatic expressions, words used in journalism and everyday authentic texts. Focus on register and connotation.",
  E: "eximia cum laude approbatur — excellent, top ~15%. Strong vocabulary. Test sophisticated vocabulary, less common expressions, words requiring cultural knowledge about Spain and Latin America. Distractors are very close in meaning.",
  L: "laudatur — top 5%. Near-native comprehension. Test advanced vocabulary, idioms, regional differences, words from high-quality authentic texts. Distractors require deep knowledge to eliminate.",
};

export const TOPIC_CONTEXT = {
  "general vocabulary": "general everyday Spanish vocabulary appropriate for the level",
  "society and politics": "societal topics: discrimination, equality, environment, democracy, protests, social media influence",
  "environment and nature": "ecological topics: recycling, climate, biodiversity, sustainable living, nature conservation",
  "health and body": "health topics: exercise, diet, mental health, sports, medical appointments, body image",
  "travel and transport": "travel: airports, delays, directions, accommodation, public transport, tourism",
  "culture and arts": "culture: music, art, theatre, ballet, cinema, festivals, Latin American culture, Spanish traditions",
  "work and economy": "work: jobs, salaries, internships, unemployment, economy, entrepreneurship",
};

export const LANGUAGE_META = {
  spanish: { name: "Spanish", nativeName: "español", country: "Spain and Latin America", yearsStudied: "3 years in lukio" },
  swedish: { name: "Swedish", nativeName: "svenska", country: "Sweden and Finland", yearsStudied: "6+ years in school" },
  german:  { name: "German",  nativeName: "Deutsch", country: "Germany, Austria and Switzerland", yearsStudied: "3 years in lukio" },
  french:  { name: "French",  nativeName: "français", country: "France and francophone countries", yearsStudied: "3 years in lukio" },
};

export const GRAMMAR_TOPIC_DESCS = {
  mixed: "a mix of ALL these (at least 3 different types per set): ser/estar, hay/estar, ojalá+subjunctive, conditional vs imperfect, preterite vs imperfect, relative pronouns, article mistakes",
  ser_estar: "ONLY ser vs estar. ser = permanent (identity, origin, nationality, profession, material, time). estar = temporary (location, feelings/states, condition, progressive). Key pairs to test: ¿Eres/Estás triste?, es/está cansado, La sopa es/está fría, ¿Dónde estás/eres?",
  hay_estar: "ONLY hay vs estar/haber. hay = existence (impersonal, there is/are). estar = location of specific known thing. CRITICAL RULE: hay NEVER takes a definite article. hay una mesa ✓, hay la mesa ✗, hay gaviotas ✓, hay las gaviotas ✗",
  subjunctive: "ONLY subjunctive mood. ojalá ALWAYS requires subjunctive, NEVER indicative. Also: para que, querer que, esperar que, es importante que. Test: Ojalá te guste (✓) vs Ojalá te gustará (✗), Para que puedas venir (✓)",
  conditional: "ONLY conditional tense. me gustaría (I would like) ≠ me quería (I wanted/imperfect). podría, sería, tendría. Polite requests: ¿Podrías ayudarme? Wishes: Me gustaría vivir en España. Test the imperfect vs conditional confusion",
  preterite_imperfect: "ONLY preterite vs imperfect. Preterite = completed action (ayer, anteayer, el lunes, de repente). Imperfect = background/habit/state (siempre, todos los días, cuando era niño, antes). Classic: Estaba en casa cuando llegó",
  pronouns: "ONLY pronouns. Relative: que (things+people), quien after prepositions (people), donde (places). Object pronoun order: indirect before direct (te lo doy, me lo ha dado). NEVER omit que: sitios que tienes que visitar ✓, sitios tienes que visitar ✗",
};

export const READING_LEVEL_DESCS = {
  B: "A2 level: short simple sentences, present/past tense only, very common everyday vocabulary. ~180-200 words.",
  C: "B1- level: some subordinate clauses, moderate vocabulary, variety of tenses. ~210-250 words.",
  M: "B1 level: authentic-feeling prose, varied vocabulary, complex sentences occasionally. ~250-290 words.",
  E: "B2- level: sophisticated vocabulary, complex structures, cultural references. ~290-330 words.",
  L: "B2 level: near-authentic journalism/blog style, rich idiomatic vocabulary. ~330-380 words.",
};

export const READING_TOPIC_CONTEXTS = {
  "animals and nature": "animals, wildlife, pets, nature, animal rescue or rehabilitation centre",
  "travel and places": "tourism, a city or neighbourhood, hotels, transport, travel experiences",
  "culture and history": "historical figure or monument, cultural heritage, art, music, traditions",
  "social media and technology": "social media influencer, blogger, TikTok creator, digital life",
  "health and sports": "exercise, diet, mental health, a sport, outdoor activity",
  "environment": "recycling, climate change, sustainability, circular economy app or initiative",
};

// ─── Shared constants ───────────────────────────────────────────────────────

export const GRADES = ["I", "A", "B", "C", "M", "E", "L"];

export const GRADE_ORDER = { I: 0, A: 1, B: 2, C: 3, M: 4, E: 5, L: 6 };

export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;

/**
 * Calculate the current daily practice streak from exercise logs.
 * @param {Array<{created_at?: string, createdAt?: string}>} logs - Exercise log entries
 * @returns {number} Number of consecutive days practiced (0 if none recent)
 */
export function calculateStreak(logs) {
  const daySet = new Set(logs.map((l) => (l.created_at || l.createdAt || "").slice(0, 10)));
  const sortedDays = [...daySet].filter(Boolean).sort().reverse();
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayStr = new Date(Date.now() - DAY_MS).toISOString().slice(0, 10);
  let streak = 0;
  if (sortedDays.length > 0 && (sortedDays[0] === todayStr || sortedDays[0] === yesterdayStr)) {
    streak = 1;
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i + 1])) / DAY_MS;
      if (diff === 1) streak++;
      else break;
    }
  }
  return streak;
}

/**
 * Estimate the student's YTL grade level from recent graded logs.
 * @param {Array<{ytl_grade?: string}>} logs - Exercise logs with optional grade
 * @returns {string|null} Estimated grade (I-L) or null if no graded logs
 */
export function calculateEstLevel(logs) {
  const recentGraded = logs
    .filter((l) => l.ytl_grade && GRADE_ORDER[l.ytl_grade] !== undefined)
    .slice(0, 5);
  if (recentGraded.length === 0) return null;
  const avgIdx = Math.round(
    recentGraded.reduce((s, l) => s + GRADE_ORDER[l.ytl_grade], 0) / recentGraded.length
  );
  return GRADES[Math.max(0, Math.min(6, avgIdx))];
}

// ─── User profile context for prompts ──────────────────────────────────────

/**
 * Fetch user profile and build a context string for AI prompts.
 * Returns empty string if no profile found.
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function getUserProfileContext(userId) {
  if (!userId || !supabase) return "";
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("current_grade, target_grade, study_background, weak_areas, exam_date")
      .eq("user_id", userId)
      .single();

    if (error || !data) return "";

    const BACKGROUND_EN = {
      lukio: "studied Spanish only in upper secondary (lukio)",
      ylakoulu_lukio: "started Spanish in middle school (B2-kieli)",
      alakoulu: "started Spanish in primary school or as A-language",
      asunut: "has lived in a Spanish-speaking country",
      kotikieli: "speaks Spanish at home / with family",
    };

    const parts = [];
    if (data.target_grade) parts.push(`Target yo-koe grade: ${data.target_grade}`);
    if (data.current_grade && data.current_grade !== "en tiedä") {
      parts.push(`Current estimated level: ${data.current_grade}`);
    }
    if (data.study_background && BACKGROUND_EN[data.study_background]) {
      parts.push(`Background: ${BACKGROUND_EN[data.study_background]}`);
    }
    if (data.weak_areas?.length && !data.weak_areas.includes("unknown")) {
      const AREA_EN = {
        vocabulary: "vocabulary", grammar: "grammar overall",
        ser_estar: "ser vs estar", subjunctive: "subjunctive mood",
        preterite_imperfect: "preterite vs imperfect", conditional: "conditional tense",
        pronouns: "pronouns", writing: "writing", reading: "reading comprehension",
        verbs: "verb conjugation", idioms: "idiomatic expressions",
      };
      const areas = data.weak_areas.map(a => AREA_EN[a] || a).join(", ");
      parts.push(`Weak areas: ${areas}`);
    }
    if (data.exam_date) {
      const d = new Date(data.exam_date);
      const daysLeft = Math.max(0, Math.round((d - new Date()) / (24 * 60 * 60 * 1000)));
      if (daysLeft > 0) parts.push(`Exam in ~${daysLeft} days`);
    }

    if (parts.length === 0) return "";
    return `\nSTUDENT CONTEXT: ${parts.join(". ")}. Tailor exercise difficulty and focus accordingly.\n`;
  } catch {
    return "";
  }
}

// ─── Valid input sets ───────────────────────────────────────────────────────

export const VALID_LEVELS = new Set(GRADES);
export const VALID_VOCAB_TOPICS = new Set(Object.keys(TOPIC_CONTEXT));
export const VALID_GRAMMAR_TOPICS = new Set(Object.keys(GRAMMAR_TOPIC_DESCS));
export const VALID_READING_TOPICS = new Set(Object.keys(READING_TOPIC_CONTEXTS));
export const VALID_READING_LEVELS = new Set(Object.keys(READING_LEVEL_DESCS));
export const VALID_LANGUAGES = new Set(Object.keys(LANGUAGE_META));
