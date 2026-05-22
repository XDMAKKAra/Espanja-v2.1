// v278 — builds sidebar items[] for MODE-state.
//
// Reads the same /api/curriculum?lang=… payload that curriculum.js +
// dashboard.js already share via window._curriculumCache_<lang>, then
// fan-out fetches each kurssi's lessons via /api/curriculum/:kurssiKey
// (reusing the same window cache so warm re-entry pays no round-trips).
//
// Returns a flat array of { type: "heading" | "lesson", … } objects that
// js/components/sidebarShell.js renderToi sidebariin. Active lesson is
// tagged from sessionStorage.currentLesson (set by curriculum.js openLesson)
// so the highlight survives any navigation that doesn't go through us.

import { API, apiFetch, isLoggedIn, authHeader } from "../api.js";

const KURSSI_CACHE_MS = 30_000;
const LESSON_CACHE_MS = 5 * 60_000;

// Mode → lesson types that belong in that mode's sidebar list.
//   - "mixed" + "test" appear in every mode (they cover multiple skills)
//   - exam shows everything (kertaus across all skills)
const MODE_LESSON_TYPES = {
  vocab:   new Set(["vocab",   "mixed", "test"]),
  grammar: new Set(["grammar", "mixed", "test"]),
  reading: new Set(["reading", "mixed", "test"]),
  writing: new Set(["writing", "mixed", "test"]),
  exam:    null, // null = show all
};

function currentLang() {
  try {
    return window.__currentLang
      || (window.state && window.state.language)
      || "es";
  } catch { return "es"; }
}

function authHeadersIfAny() {
  return isLoggedIn() ? authHeader() : {};
}

// Fetches the kurssi overview ({ kurssit: [...] }). Shares the
// window._curriculumCache_<lang> promise key with curriculum.js + dashboard.js
// so we never trigger a duplicate request.
async function fetchKurssitOverview(lang) {
  const cacheKey = "_curriculumCache_" + lang;
  const atKey = cacheKey + "_at";
  const fresh = window[cacheKey]
    && (Date.now() - (window[atKey] || 0)) < KURSSI_CACHE_MS;
  if (!fresh) {
    window[cacheKey] = apiFetch(`${API}/api/curriculum?lang=${encodeURIComponent(lang)}`, {
      headers: { ...authHeadersIfAny() },
    }).then(async (r) => ({ ok: r.ok, status: r.status, data: r.ok ? await r.json().catch(() => null) : null }));
    window[atKey] = Date.now();
  }
  const cached = await window[cacheKey];
  return Array.isArray(cached?.data?.kurssit) ? cached.data.kurssit : [];
}

// Fetches a single kurssi's lessons. Cached per kurssi for 5 min on
// window._sidebarLessonsCache_<lang>_<kurssiKey> so the sidebar doesn't pay
// 8 round-trips every time the user toggles between modes.
async function fetchLessonsForKurssi(lang, kurssiKey) {
  const cacheKey = `_sidebarLessonsCache_${lang}_${kurssiKey}`;
  const atKey = cacheKey + "_at";
  const fresh = window[cacheKey]
    && (Date.now() - (window[atKey] || 0)) < LESSON_CACHE_MS;
  if (fresh) return window[cacheKey];
  try {
    const res = await apiFetch(`${API}/api/curriculum/${encodeURIComponent(kurssiKey)}`, {
      headers: { ...authHeadersIfAny() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const lessons = Array.isArray(data?.lessons)
      ? data.lessons.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      : [];
    window[cacheKey] = lessons;
    window[atKey] = Date.now();
    return lessons;
  } catch {
    return [];
  }
}

// Reads the currently-open lesson from sessionStorage (set by
// js/screens/curriculum.js openLesson()). Returns "kurssi_x:N" or null.
function getActiveLessonKey() {
  try {
    const raw = sessionStorage.getItem("currentLesson");
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.kurssiKey || p?.lessonIndex == null) return null;
    return `${p.kurssiKey}:${p.lessonIndex}`;
  } catch { return null; }
}

function lessonAppliesToMode(lessonType, modeKey) {
  const allowed = MODE_LESSON_TYPES[modeKey];
  if (!allowed) return true; // null = all
  return allowed.has(lessonType);
}

/**
 * Build sidebar items[] for the given mode. Resolves to:
 *   [{ type: "heading", label: "Kurssi 1 — Kuka olen" },
 *    { type: "lesson",  key: "kurssi_1:1", label: "Perhe ja kansallisuudet …", active: false, completed: true },
 *    …]
 *
 * Kurssit with zero matching lessons are skipped entirely (heading + body
 * both omitted) so Sanasto-modessa Kurssi 4 ei näy tyhjänä otsikkona.
 */
export async function buildSidebarItemsForMode(modeKey, lang = currentLang()) {
  const kurssit = await fetchKurssitOverview(lang);
  if (kurssit.length === 0) return [];

  const activeKey = getActiveLessonKey();

  // Fan out lesson fetches in parallel. Cached after first run.
  const lessonsByKurssi = await Promise.all(
    kurssit.map((k) => fetchLessonsForKurssi(lang, k.key)),
  );

  const items = [];
  for (let i = 0; i < kurssit.length; i += 1) {
    const k = kurssit[i];
    const lessons = lessonsByKurssi[i] || [];
    const filtered = lessons.filter((l) => lessonAppliesToMode(l.type, modeKey));
    if (filtered.length === 0) continue;

    items.push({ type: "heading", label: k.title });
    for (const lesson of filtered) {
      const key = `${k.key}:${lesson.sortOrder}`;
      items.push({
        type: "lesson",
        key,
        kurssiKey: k.key,
        lessonIndex: lesson.sortOrder,
        label: lesson.focus || `Oppitunti ${lesson.sortOrder}`,
        active: key === activeKey,
        completed: !!lesson.completed,
        locked: !k.isUnlocked,
      });
    }
  }
  return items;
}

export const _internal = { MODE_LESSON_TYPES };
