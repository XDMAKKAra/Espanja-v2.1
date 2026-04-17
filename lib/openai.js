export const OPENAI_API = "https://api.openai.com/v1/chat/completions";
export const OPENAI_MODEL = "gpt-4o-mini";

// ─── Timeout + Circuit breaker ──────────────────────────────────────────────

const OPENAI_TIMEOUT_MS = 30000; // 30s max per request
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_MS = 60000; // 1 minute cooldown

let _circuitFailures = 0;
let _circuitOpenUntil = 0;

// ─── Response cache ─────────────────────────────────────────────────────────

const _cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CACHE_MAX_SIZE = 100;

function getCacheKey(prompt, maxTokens) {
  // Simple hash: first 200 chars of prompt + maxTokens
  return `${prompt.slice(0, 200)}::${maxTokens}`;
}

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  // Evict oldest if at max size
  if (_cache.size >= CACHE_MAX_SIZE) {
    const oldest = _cache.keys().next().value;
    _cache.delete(oldest);
  }
  _cache.set(key, { data, ts: Date.now() });
}

export async function callOpenAI(prompt, maxTokens = 2000) {
  // Circuit breaker check
  if (_circuitFailures >= CIRCUIT_FAILURE_THRESHOLD && Date.now() < _circuitOpenUntil) {
    throw new Error("AI-palvelu on tilapäisesti poissa käytöstä. Yritä hetken kuluttua uudelleen.");
  }

  // Check cache (skip for writing grading which contains student text)
  const cacheKey = getCacheKey(prompt, maxTokens);
  const cached = getCached(cacheKey);
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

    // Reset circuit breaker on success
    _circuitFailures = 0;

    // Cache the result
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

// ─── Valid input sets ───────────────────────────────────────────────────────

export const VALID_LEVELS = new Set(GRADES);
export const VALID_VOCAB_TOPICS = new Set(Object.keys(TOPIC_CONTEXT));
export const VALID_GRAMMAR_TOPICS = new Set(Object.keys(GRAMMAR_TOPIC_DESCS));
export const VALID_READING_TOPICS = new Set(Object.keys(READING_TOPIC_CONTEXTS));
export const VALID_READING_LEVELS = new Set(Object.keys(READING_LEVEL_DESCS));
export const VALID_LANGUAGES = new Set(Object.keys(LANGUAGE_META));
