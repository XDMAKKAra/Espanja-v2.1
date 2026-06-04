/**
 * curriculumCache — single source of truth for /api/curriculum data
 * (v282 perf-pass).
 *
 * Previously each consumer (oppimispolkuIndex, courseDetail) kept its
 * own Map. Course detail fetched the lang-level overview a second time
 * even though oppimispolkuIndex had it warm one click earlier — a free
 * 200-500 ms round-trip we pay because the caches don't talk.
 *
 * This module exports two readers (`getCurriculumList`, `getCourseDetail`)
 * and two prefetchers (`prefetchCurriculumList`, `prefetchCourseDetail`).
 * The detail reader shares the list cache, so navigating
 * Aloitus → Oppimispolku → Kurssi makes one /api/curriculum call total,
 * not two. Inflight promises are coalesced so two hovers in flight don't
 * race.
 */

import { API, apiFetch, isLoggedIn, authHeader } from "../api.js";

const TTL_MS = 60_000;

// L-V290 microcopy sweep: em-dash exists in the curriculum migration that
// hydrated supabase (20260429_curriculum.sql) — "Kurssi 1 — Kuka olen".
// A SQL UPDATE would touch production data; instead, normalise on read.
// Replace " — " with ": " (acts as a course-title separator) and lone
// em-dashes inside descriptions with a comma.
function humanizeText(s) {
  if (typeof s !== "string") return s;
  return s.replace(/ — /g, ": ").replace(/—/g, ",");
}
function humanize(k) {
  if (!k || typeof k !== "object") return k;
  return {
    ...k,
    title: humanizeText(k.title),
    description: humanizeText(k.description),
  };
}
const _listCache = new Map();   // lang → { ts, kurssit, promise? }
const _detailCache = new Map(); // `${lang}/${key}` → { ts, kurssi, lessons, promise? }

function isFresh(entry) {
  return !!(entry && entry.ts && (Date.now() - entry.ts) < TTL_MS);
}

function authedHeaders() {
  return { ...(isLoggedIn() ? authHeader() : {}) };
}

export async function getCurriculumList(lang) {
  const cached = _listCache.get(lang);
  if (isFresh(cached)) return cached.kurssit;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    try {
      const res = await apiFetch(
        `${API}/api/curriculum?lang=${encodeURIComponent(lang)}`,
        { headers: authedHeaders() },
      );
      if (!res.ok) { _listCache.delete(lang); return []; }
      const data = await res.json();
      if (data?.available === false) {
        _listCache.set(lang, { ts: Date.now(), kurssit: [] });
        return [];
      }
      const kurssit = Array.isArray(data?.kurssit)
        ? data.kurssit.filter((k) => k && typeof k.key === "string").map(humanize)
        : [];
      _listCache.set(lang, { ts: Date.now(), kurssit });
      return kurssit;
    } catch {
      _listCache.delete(lang);
      return [];
    }
  })();
  _listCache.set(lang, { ts: 0, kurssit: [], promise });
  return promise;
}

export async function getCourseDetail(lang, kurssiKey) {
  const cacheKey = `${lang}/${kurssiKey}`;
  const cached = _detailCache.get(cacheKey);
  if (isFresh(cached)) return cached;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    try {
      const listP = getCurriculumList(lang);
      // L-V390: pass ?lang so the server scopes completion state to this
      // language. Without it the detail endpoint defaulted to "es" and a
      // Spanish completion showed as done on the German/French course.
      const detailReq = apiFetch(
        `${API}/api/curriculum/${encodeURIComponent(kurssiKey)}?lang=${encodeURIComponent(lang)}`,
        { headers: authedHeaders() },
      );
      const [kurssit, detailRes] = await Promise.all([listP, detailReq]);
      const detail = detailRes.ok ? await detailRes.json() : null;
      const stepNumber = kurssit.findIndex((k) => k.key === kurssiKey) + 1;
      const kurssi = kurssit.find((k) => k.key === kurssiKey) || null;
      const lessons = Array.isArray(detail?.lessons)
        ? detail.lessons.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        : [];
      if (kurssi) kurssi._stepNumber = stepNumber;
      const payload = { ts: Date.now(), kurssi, lessons };
      _detailCache.set(cacheKey, payload);
      return payload;
    } catch {
      _detailCache.delete(cacheKey);
      return { ts: Date.now(), kurssi: null, lessons: [] };
    }
  })();
  _detailCache.set(cacheKey, { ts: 0, kurssi: null, lessons: [], promise });
  return promise;
}

export function prefetchCurriculumList(lang) {
  if (!lang) return;
  const cached = _listCache.get(lang);
  if (isFresh(cached) || cached?.promise) return;
  getCurriculumList(lang);
}

export function prefetchCourseDetail(lang, kurssiKey) {
  if (!lang || !kurssiKey) return;
  const cacheKey = `${lang}/${kurssiKey}`;
  const cached = _detailCache.get(cacheKey);
  if (isFresh(cached) || cached?.promise) return;
  getCourseDetail(lang, kurssiKey);
}
