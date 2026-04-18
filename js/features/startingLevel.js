// YTL grade ladder: weakest → strongest
export const YTL_LEVELS = ["I", "A", "B", "C", "M", "E", "L"];

export const STUDY_BACKGROUNDS = new Set([
  "lukio",
  "ylakoulu_lukio",
  "alakoulu",
  "asunut",
  "kotikieli",
]);

function clampIdx(i) {
  return Math.max(0, Math.min(YTL_LEVELS.length - 1, i));
}

/**
 * Derive a starting YTL level from onboarding signals.
 *
 * Signals:
 *   coursesCompleted — integer 1..8 or null
 *   gradeAverage     — integer 4..10 or null
 *   background       — one of STUDY_BACKGROUNDS or null
 *
 * Returns a YTL letter (I/A/B/C/M/E/L) or null when not derivable.
 *
 * Calibration (per product spec):
 *   lukio           + 1–3 courses → A1 / low A2      (≈ I/A/B)
 *   lukio           + 4–6 courses → A2 / low B1      (≈ B/C)
 *   lukio           + 7–8 courses → B1               (≈ M, bumped with grade)
 *   ylakoulu_lukio                → +1 step vs lukio baseline
 *   alakoulu                      → minimum B1 (M), higher if grade is strong
 *   asunut / kotikieli            → B1 high / B2     (≈ E or L)
 */
export function computeStartingLevel(coursesCompleted, gradeAverage, background) {
  const c = Number(coursesCompleted);
  const g = Number(gradeAverage);
  const hasCourses = Number.isFinite(c) && c > 0;
  const hasGrade = Number.isFinite(g) && g > 0;

  // Native / immersion backgrounds clamp high regardless of courses & grade.
  if (background === "asunut" || background === "kotikieli") {
    return hasGrade && g >= 9 ? "L" : "E";
  }

  // Every other rule needs at least the background.
  if (!STUDY_BACKGROUNDS.has(background)) return null;
  if (!hasCourses) return null;

  // Lukio baseline by course count — picks mid of the band.
  //   1–3 courses → "A"  (A1 / low A2 band)
  //   4–6 courses → "B"  (A2 / low B1 band)
  //   7–8 courses → "M"  (B1 band)
  let idx;
  if (c <= 3)      idx = 1; // A
  else if (c <= 6) idx = 2; // B
  else             idx = 4; // M

  // Grade average shifts within the band.
  if (hasGrade) {
    if (c <= 3) {
      // A1 weak .. low A2
      if (g >= 8)      idx = 2; // B (low A2)
      else if (g >= 6) idx = 1; // A (A1)
      else             idx = 0; // I (A1 weak)
    } else if (c <= 6) {
      // A2 .. low B1
      if (g >= 8)      idx = 3; // C (low B1)
      else if (g >= 6) idx = 2; // B (A2)
      else             idx = 1; // A
    } else {
      // B1 band
      if (g >= 9)      idx = 5; // E (B1 high)
      else if (g >= 7) idx = 4; // M (B1)
      else             idx = 3; // C (below B1)
    }
  }

  // Background adjustments
  if (background === "ylakoulu_lukio") {
    idx += 1;
  } else if (background === "alakoulu") {
    idx = Math.max(idx, 4); // minimum M (B1)
    if (hasGrade && g >= 9) idx = Math.max(idx, 5); // strong grade → E
  }

  return YTL_LEVELS[clampIdx(idx)];
}

/**
 * True when the background signals pre-existing fluency that makes
 * beginner-tier vocab drills pointless. The caller (e.g. placement / dashboard)
 * can use this to skip A1/A2 vocab mini-exercises.
 */
export function shouldSkipBeginnerVocab(background) {
  return background === "asunut" || background === "kotikieli";
}
