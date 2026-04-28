// Writing-specific progression tracking — localStorage cache of recent
// per-dimension grading results. Keeps the surface area small: no DB
// migration required. Cleared on logout.

const KEY = "puheo_writing_history";
const MAX_ENTRIES = 30;

const DIMENSIONS = ["viestinnallisyys", "kielen_rakenteet", "sanasto", "kokonaisuus"];

const DIM_LABELS = {
  viestinnallisyys: "Viestinnällisyys",
  kielen_rakenteet: "Kielen rakenteet",
  sanasto: "Sanasto",
  kokonaisuus: "Kokonaisuus",
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* quota — silent */ }
}

/**
 * Record a writing grading result so dashboard can show per-dimension trend.
 * Also captures error categories (for adaptive prompt input).
 */
export function recordWritingResult(result) {
  if (!result) return;
  const entry = {
    at: Date.now(),
    finalScore: Number(result.finalScore) || 0,
    maxScore: Number(result.maxScore) || 20,
    ytlGrade: result.ytlGrade || null,
    dims: {},
    errorCategories: [],
  };
  for (const d of DIMENSIONS) {
    if (result[d] && typeof result[d].score === "number") {
      entry.dims[d] = result[d].score;
    }
  }
  if (Array.isArray(result.errors)) {
    for (const e of result.errors) {
      if (e?.category) entry.errorCategories.push(String(e.category));
    }
  }
  const next = [entry, ...load()];
  save(next);
}

/**
 * Compute per-dimension averages across the last N entries.
 * Returns { dim: { avg, count, trend, lastScore } } or null if no data.
 */
export function getRecentWritingDimensions(n = 5) {
  const entries = load().slice(0, n);
  if (entries.length === 0) return null;

  const out = {};
  for (const d of DIMENSIONS) {
    const scores = entries.map(e => e.dims?.[d]).filter(s => typeof s === "number");
    if (scores.length === 0) continue;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    let trend = "flat";
    if (scores.length >= 4) {
      const recent2 = scores.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const older2 = scores.slice(-2).reduce((a, b) => a + b, 0) / 2;
      if (recent2 - older2 >= 0.5) trend = "up";
      else if (older2 - recent2 >= 0.5) trend = "down";
    }
    out[d] = {
      label: DIM_LABELS[d],
      avg: Math.round(avg * 10) / 10,
      count: scores.length,
      lastScore: scores[0],
      trend,
    };
  }
  return out;
}

/**
 * Recent error categories (counts) — used as adaptive-prompt signal so the
 * AI generates the next writing task aimed at the student's weak structures.
 */
export function getRecentErrorCategories(n = 10) {
  const entries = load().slice(0, n);
  const counts = {};
  for (const e of entries) {
    for (const cat of e.errorCategories || []) {
      counts[cat] = (counts[cat] || 0) + 1;
    }
  }
  // Top 3 by count
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({ category, count }));
}

/**
 * Build a readiness map combining grammar/vocab learning-path mastery with
 * recent writing-dimension averages. Output is dashboard-ready cells.
 */
export function computeReadinessMap({ learningPath = [], writingDims = null } = {}) {
  const cells = [];

  // Grammar/vocab nodes from learning-path API.
  for (const t of learningPath || []) {
    let lvl = 0;
    if (t.status === "mastered") lvl = 4;
    else if (t.status === "in_progress" || t.status === "available") {
      // bestPct from /api/learning-path is a 0–1 fraction (see
      // lib/learningPath.js:142). Earlier rev divided by 100 again before
      // comparing to the 60/30/10 thresholds, so pct sat in 0..1 and never
      // crossed any threshold — every in-progress topic read as level 0.
      const pct = Math.round((t.bestPct || 0) * 100);
      if (pct >= 60) lvl = 3;
      else if (pct >= 30) lvl = 2;
      else if (pct >= 10) lvl = 1;
    }
    cells.push({
      key: `path-${t.key}`,
      label: t.short || t.label,
      kind: "path",
      level: lvl,
      tooltip: `${t.label} — ${t.status === "mastered" ? "hallittu" : t.status === "locked" ? "lukittu" : `paras ${Math.round((t.bestPct || 0) * 100)}%`}`,
    });
  }

  // 4 writing dimensions.
  if (writingDims) {
    for (const [d, info] of Object.entries(writingDims)) {
      let lvl = 0;
      if (info.avg >= 4) lvl = 4;
      else if (info.avg >= 3) lvl = 3;
      else if (info.avg >= 2) lvl = 2;
      else if (info.avg > 0) lvl = 1;
      cells.push({
        key: `writing-${d}`,
        label: info.label,
        kind: "writing",
        level: lvl,
        tooltip: `${info.label} (kirjoittaminen) — keskiarvo ${info.avg}/5 (${info.count} viim. tehtävää)`,
      });
    }
  } else {
    for (const d of DIMENSIONS) {
      cells.push({
        key: `writing-${d}`,
        label: DIM_LABELS[d],
        kind: "writing",
        level: 0,
        tooltip: `${DIM_LABELS[d]} (kirjoittaminen) — ei dataa vielä`,
      });
    }
  }

  const totalCells = cells.length;
  const masteredCells = cells.filter(c => c.level >= 3).length;
  // Weighted partial-credit readiness: each cell contributes level/4 of full
  // credit so partial progress on many topics is visible. The earlier
  // mastered/total ratio penalised users who'd touched eight topics with
  // 30–50 % best scores by reading them as 0 % — produced "8 harjoitusta =
  // 14 %" which reads as "I've done nothing" when in fact every topic has
  // been started.
  const weightedSum = cells.reduce((s, c) => s + c.level, 0);
  const readinessPct = totalCells > 0
    ? Math.round((weightedSum / (totalCells * 4)) * 100)
    : 0;

  return { cells, totalCells, masteredCells, readinessPct };
}

export { DIMENSIONS, DIM_LABELS };
