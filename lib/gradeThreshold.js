/**
 * Threshold ladder for the dashboard YO-arvosana widget.
 *
 * A single vocab drill cannot produce a valid YTL grade. This module gates
 * the grade estimate so the dashboard only shows a letter when there is
 * enough data — and upgrades the presentation as coverage improves.
 *
 * Tiers:
 *   none          — < 10 exercises total. No grade, placeholder copy.
 *   preliminary   — 10–29 exercises. Muted "Alustava taso: X".
 *   estimated     — 30–99 exercises OR ≥100 but missing some sections.
 *                   Grade + confidence bar.
 *   full          — ≥100 total AND ≥10 in each of the 4 sections.
 *                   Full widget with confidence bar + last-updated caption.
 *
 * Confidence (0–5): one point per section with ≥ 10 exercises (0–4),
 *                   plus 1 bonus when total ≥ 100 exercises.
 */

import { GRADES, GRADE_ORDER } from "./openai.js";

export const SECTIONS = ["vocab", "grammar", "reading", "writing"];
export const MIN_PER_SECTION_FOR_FULL = 10;
export const TOTAL_THRESHOLD_PRELIMINARY = 10;
export const TOTAL_THRESHOLD_ESTIMATED = 30;
export const TOTAL_THRESHOLD_FULL = 100;

export function computeCoverage(logs) {
  const coverage = { vocab: 0, grammar: 0, reading: 0, writing: 0 };
  for (const l of logs) {
    if (coverage[l.mode] !== undefined) coverage[l.mode]++;
  }
  return coverage;
}

function averageGrade(logs) {
  const graded = logs.filter(
    (l) => l.ytl_grade && GRADE_ORDER[l.ytl_grade] !== undefined,
  );
  if (graded.length === 0) return null;
  const avgIdx = Math.round(
    graded.reduce((s, l) => s + GRADE_ORDER[l.ytl_grade], 0) / graded.length,
  );
  return GRADES[Math.max(0, Math.min(6, avgIdx))];
}

export function computeGradeEstimate(logs) {
  const total = logs.length;
  const coverage = computeCoverage(logs);
  const sectionsWithCoverage = SECTIONS.filter(
    (s) => coverage[s] >= MIN_PER_SECTION_FOR_FULL,
  ).length;
  const confidence = Math.min(
    5,
    sectionsWithCoverage + (total >= TOTAL_THRESHOLD_FULL ? 1 : 0),
  );

  if (total < TOTAL_THRESHOLD_PRELIMINARY) {
    return {
      tier: "none",
      grade: null,
      confidence: 0,
      coverage,
      total,
    };
  }

  const grade = averageGrade(logs);

  if (total < TOTAL_THRESHOLD_ESTIMATED) {
    return { tier: "preliminary", grade, confidence, coverage, total };
  }

  if (
    total >= TOTAL_THRESHOLD_FULL &&
    sectionsWithCoverage === SECTIONS.length
  ) {
    return { tier: "full", grade, confidence, coverage, total };
  }

  return { tier: "estimated", grade, confidence, coverage, total };
}
