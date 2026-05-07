import supabase from "../supabase.js";
import { createHash } from "node:crypto";

export const OPENAI_API = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODEL = "gpt-4o-mini";

// ─── Multi-language label map ────────────────────────────────────────────────
// fi = Finnish UI label, en = English prompt label used inside AI prompts.
// Routes import LANG_LABEL to validate lang codes and resolve human strings.
export const LANG_LABEL = {
  es: { fi: "espanja",  en: "Spanish" },
  de: { fi: "saksa",    en: "German"  },
  fr: { fi: "ranska",   en: "French"  },
};

// ─── Timeout + Circuit breaker ──────────────────────────────────────────────

const OPENAI_TIMEOUT_MS = 30000; // 30s max per request
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60000; // 1 minute cooldown

let _circuitFailures = 0;
let _circuitOpenUntil = 0;

// ─── Response cache ─────────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
const _memCache = new Map();
export const CACHE_TTL_MS_GRADER = 30 * 60 * 1000;     // 30 min for graders (freshness matters)
export const CACHE_TTL_MS_GENERATOR = 24 * 60 * 60 * 1000; // 24 h for exercise generators
const CACHE_MAX_SIZE = 100;
// Back-compat export: some callers import CACHE_TTL_MS directly. Map it to the
// shorter grader TTL so pre-Commit-7 call-sites don't accidentally grow their
// TTL by 48×.
export const CACHE_TTL_MS = CACHE_TTL_MS_GRADER;

/**
 * Stable cache key: SHA-256 hash of the full prompt + maxTokens + model.
 * The old 200-char-prefix key collided any time two prompts shared the same
 * preamble (e.g. every grammar drill starts with identical boilerplate),
 * which meant user A could get user B's cached exercise and profile context
 * could leak. Hashing covers the entire prompt so two prompts that differ
 * anywhere — including late-in-the-string user profile context — always
 * produce different keys.
 */
export function getCacheKey(prompt, maxTokens, model = OPENAI_MODEL) {
  return createHash("sha256")
    .update(`${prompt}::${maxTokens}::${model}`)
    .digest("hex");
}

// In-memory cache (dev)
function memGetCached(key) {
  const entry = _memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _memCache.delete(key);
    return null;
  }
  return entry.data;
}

function memSetCache(key, data, ttlMs) {
  if (_memCache.size >= CACHE_MAX_SIZE) {
    const oldest = _memCache.keys().next().value;
    _memCache.delete(oldest);
  }
  _memCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// Test-only: access the in-memory cache internals. Not imported by production code.
export const __memCacheInternals = {
  cache: _memCache,
  get: memGetCached,
  set: memSetCache,
  max: CACHE_MAX_SIZE,
};

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

async function dbSetCache(key, data, ttlMs) {
  try {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();

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

async function setCache(key, data, ttlMs = CACHE_TTL_MS_GRADER) {
  if (!isProd) return memSetCache(key, data, ttlMs);
  return dbSetCache(key, data, ttlMs);
}

/**
 * Call OpenAI chat completions API with caching and circuit breaker.
 * @param {string} prompt - The user prompt to send
 * @param {number} [maxTokens=2000] - Maximum tokens in response
 * @param {object} [opts]
 * @param {number} [opts.cacheTtl] - Override default TTL. Default behavior:
 *   maxTokens >= 1500 is treated as a generator call (24h TTL);
 *   anything smaller is treated as a grader (30min TTL). Pass an explicit
 *   number to override.
 * @returns {Promise<object>} Parsed JSON response from the model
 * @throws {Error} On timeout, API error, or circuit breaker open
 */
/**
 * Best-effort salvage of a truncated / malformed JSON response from the model.
 * Handles the two most common failure modes:
 *   1. Array truncated mid-object (max_tokens hit) — trim to the last complete
 *      `}` and close the array.
 *   2. Object truncated mid-value — trim to the last complete property.
 *   3. Trailing commas before `]` or `}`.
 * Returns the parsed value, or null if repair is impossible.
 */
export function tryRepairTruncatedJson(text) {
  if (typeof text !== "string" || text.length === 0) return null;

  // Kill trailing commas: `,]` → `]`, `,}` → `}`. Cheap and safe.
  const noTrailing = text.replace(/,(\s*[}\]])/g, "$1");
  try { return JSON.parse(noTrailing); } catch { /* fall through */ }

  // If the payload starts with `[`, try trimming back to the last `}` followed
  // by optional whitespace, then closing the array. Covers the classic
  // truncated-batch case where the final item is incomplete.
  if (noTrailing.trimStart().startsWith("[")) {
    const lastCloseBrace = noTrailing.lastIndexOf("}");
    if (lastCloseBrace > 0) {
      const head = noTrailing.slice(0, lastCloseBrace + 1);
      const candidate = `${head.replace(/,\s*$/, "")}\n]`;
      try { return JSON.parse(candidate); } catch { /* fall through */ }
    }
  }

  // Object that's missing its closing brace(s). Strip any partial trailing
  // property (`,"key":` or `,"key":"partial`) before patching braces.
  if (noTrailing.trimStart().startsWith("{")) {
    const stripped = noTrailing.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, "").replace(/,\s*$/, "");
    const opens = (stripped.match(/\{/g) || []).length;
    const closes = (stripped.match(/\}/g) || []).length;
    if (opens > closes) {
      try { return JSON.parse(stripped + "}".repeat(opens - closes)); } catch { /* fall through */ }
    }
  }

  return null;
}

export async function callOpenAI(prompt, maxTokens = 2000, opts = {}) {
  // Exam-week kill switch — callers must have a bank fallback.
  // Lazy import avoids a circular dep with featureFlags.js importing nothing.
  const { isOpenAIDisabled, ExamWeekBlockedError } = await import("./featureFlags.js");
  if (isOpenAIDisabled()) {
    throw new ExamWeekBlockedError();
  }

  // Circuit breaker check
  if (_circuitFailures >= CIRCUIT_FAILURE_THRESHOLD && Date.now() < _circuitOpenUntil) {
    throw new Error("AI-palvelu on tilapäisesti poissa käytöstä. Yritä hetken kuluttua uudelleen.");
  }

  // Pick TTL. Graders use small max_tokens (300-1500) — we treat anything
  // < 1500 as a grader. Callers can override with opts.cacheTtl.
  const cacheTtl = typeof opts.cacheTtl === "number"
    ? opts.cacheTtl
    : (maxTokens >= 1500 ? CACHE_TTL_MS_GENERATOR : CACHE_TTL_MS_GRADER);

  // Check cache — SHA-256 of full prompt + maxTokens + model
  const cacheKey = getCacheKey(prompt, maxTokens);
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  // Optional structured output + temperature override (per puheo-ai-prompt skill).
  // Defaults: temperature 0.7 (generation), JSON object response (every Puheo
  // prompt today expects JSON output — plain-text callers opt out with
  // `opts.responseFormat: null`). Graders pass `{ temperature: 0.2 }` for
  // determinism on top of the JSON default.
  const requestBody = {
    model: OPENAI_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (typeof opts.temperature === "number") requestBody.temperature = opts.temperature;
  if (opts.responseFormat === null) {
    // explicit opt-out — leave undefined
  } else {
    requestBody.response_format = opts.responseFormat || { type: "json_object" };
  }

  try {
    const response = await fetch(OPENAI_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`OpenAI API error ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      const repaired = tryRepairTruncatedJson(cleaned);
      if (repaired === null) {
        throw new Error("AI palautti viallisen vastauksen. Yritä uudelleen.");
      }
      parsed = repaired;
    }

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
    setCache(cacheKey, parsed, cacheTtl);

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
  I: "improbatur — barely any target language knowledge. Student cannot form basic sentences. Test only the most fundamental words. Distractors should be plausible but clearly different in meaning.",
  A: "approbatur — weak pass. Knows basic vocabulary but makes fundamental errors. Can handle present tense only. Test elementary everyday words. Student at this level confuses very basic words.",
  B: "lubenter approbatur — adequate pass. Understands everyday vocabulary, still makes frequent grammar errors. Test vocabulary related to travel, food, school, work, health. Distractors should be semantically close (e.g. confusing similar concepts).",
  C: "cum laude approbatur — above average. Decent vocabulary range. Test intermediate vocabulary: less common nouns, phrasal structures, words from authentic texts about society and culture. Distractors should require real knowledge to distinguish.",
  M: "magna cum laude approbatur — good. Solid vocabulary, can handle complex topics. Test nuanced vocabulary, idiomatic expressions, words used in journalism and everyday authentic texts. Focus on register and connotation.",
  E: "eximia cum laude approbatur — excellent, top ~15%. Strong vocabulary. Test sophisticated vocabulary, less common expressions, words requiring cultural knowledge. Distractors are very close in meaning.",
  L: "laudatur — top 5%. Near-native comprehension. Test advanced vocabulary, idioms, regional differences, words from high-quality authentic texts. Distractors require deep knowledge to eliminate.",
};

const TOPIC_CONTEXT_BASE = {
  "general vocabulary": "general everyday {lang} vocabulary appropriate for the level",
  "society and politics": "societal topics: discrimination, equality, environment, democracy, protests, social media influence",
  "environment and nature": "ecological topics: recycling, climate, biodiversity, sustainable living, nature conservation",
  "health and body": "health topics: exercise, diet, mental health, sports, medical appointments, body image",
  "travel and transport": "travel: airports, delays, directions, accommodation, public transport, tourism",
  "culture and arts": "culture: music, art, theatre, ballet, cinema, festivals, cultures of {langCountry}",
  "work and economy": "work: jobs, salaries, internships, unemployment, economy, entrepreneurship",
};

// Returns topic context strings with language labels substituted.
// For ES, output is identical to the old hardcoded strings.
export function getTopicContext(lang = "es") {
  const label = LANG_LABEL[lang] || LANG_LABEL.es;
  const countryMap = {
    es: "Spain, Latin America and Hispanic cultures",
    de: "German-speaking countries and German traditions",
    fr: "France, francophone countries and French traditions",
  };
  const langCountry = countryMap[lang] || countryMap.es;
  const result = {};
  for (const [key, val] of Object.entries(TOPIC_CONTEXT_BASE)) {
    result[key] = val
      .replace("{lang}", label.en)
      .replace("{langCountry}", langCountry);
  }
  return result;
}

// Back-compat: callers that import TOPIC_CONTEXT directly get the ES version.
export const TOPIC_CONTEXT = getTopicContext("es");

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

// ─── Response shape coercion ────────────────────────────────────────────────
//
// callOpenAI's default response_format is `{ type: "json_object" }`, which
// constrains the model to a JSON OBJECT. Several legacy prompts ask for a
// top-level JSON array (`Return ONLY a JSON array: [...]`); under json_object
// mode the model wraps the array, e.g. `{"exercises":[...]}`. This coerces
// both shapes back to the array the consumer expects so a recently-changed
// response_format default can't quietly break exercise generation.
export function coerceArrayResponse(result) {
  if (Array.isArray(result)) return result;
  if (!result || typeof result !== "object") return null;
  const clean = { ...result };
  delete clean._usage;
  for (const k of ["exercises", "items", "questions", "data", "result", "results", "list"]) {
    if (Array.isArray(clean[k])) return clean[k];
  }
  const arrayProps = Object.entries(clean).filter(([, v]) => Array.isArray(v));
  if (arrayProps.length === 1) return arrayProps[0][1];
  return null;
}

// ─── Valid input sets ───────────────────────────────────────────────────────

export const VALID_LEVELS = new Set(GRADES);
export const VALID_VOCAB_TOPICS = new Set(Object.keys(TOPIC_CONTEXT));
export const VALID_GRAMMAR_TOPICS = new Set(Object.keys(GRAMMAR_TOPIC_DESCS));
export const VALID_READING_TOPICS = new Set(Object.keys(READING_TOPIC_CONTEXTS));
export const VALID_READING_LEVELS = new Set(Object.keys(READING_LEVEL_DESCS));
export const VALID_LANGUAGES = new Set(Object.keys(LANGUAGE_META));
