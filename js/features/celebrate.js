// Celebration helper — fires confetti on high-score results.
// Lazy-imports canvas-confetti so non-results screens never pay the parse cost.
// Gated by prefers-reduced-motion (ui-ux-pro-max P6 animation rule).

let _confettiP = null;
function loadConfetti() {
  if (_confettiP) return _confettiP;
  _confettiP = import("../vendor/confetti.mjs").then((m) => m.default || m).catch(() => null);
  return _confettiP;
}

// Threshold tiers — match what feels "celebratable" without firing on every passing score.
const TIERS = [
  { min: 100, particles: 220, spread: 110, scalar: 1.25 },
  { min: 90,  particles: 160, spread: 95,  scalar: 1.10 },
  { min: 80,  particles: 110, spread: 80,  scalar: 1.00 },
];

export async function celebrateScore(pct) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(pct) || pct < 80) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = await loadConfetti();
  if (!confetti) return;
  const t = TIERS.find((tt) => pct >= tt.min) || TIERS[TIERS.length - 1];
  // Two cones from the bottom corners — feels celebratory without engulfing the result card.
  const common = { particleCount: t.particles, spread: t.spread, scalar: t.scalar, ticks: 220, gravity: 1.0 };
  confetti({ ...common, origin: { x: 0.18, y: 0.82 }, angle: 60 });
  confetti({ ...common, origin: { x: 0.82, y: 0.82 }, angle: 120 });
  // Top burst on perfect.
  if (pct >= 100) {
    setTimeout(() => confetti({ ...common, particleCount: 260, origin: { x: 0.5, y: 0.25 }, spread: 130 }), 150);
  }
}

// Streak milestone bands — once-per-crossing celebration. Persists the
// last celebrated band in localStorage so a returning user doesn't get the
// same burst on every dashboard load.
const STREAK_KEY = "puheo_streak_milestone";
const STREAK_BANDS = [3, 7, 30];

function bandFor(streak) {
  let last = 0;
  for (const m of STREAK_BANDS) if (streak >= m) last = m;
  return last;
}

export async function celebrateStreakMilestone(streak) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(streak) || streak < STREAK_BANDS[0]) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const current = bandFor(streak);
  if (!current) return;

  let seen = 0;
  try { seen = parseInt(localStorage.getItem(STREAK_KEY) || "0", 10) || 0; } catch { /* private mode */ }
  if (current <= seen) return;

  const confetti = await loadConfetti();
  if (!confetti) return;

  // Tier the burst to the band — 30-day milestone gets the full top-down rain.
  const intensity = current === 30 ? 1.4 : current === 7 ? 1.1 : 0.85;
  const common = {
    particleCount: Math.round(140 * intensity),
    spread: 90 + (current === 30 ? 30 : 0),
    scalar: intensity,
    ticks: 240,
    gravity: 1.0,
  };
  confetti({ ...common, origin: { x: 0.20, y: 0.30 }, angle: 300 });
  confetti({ ...common, origin: { x: 0.80, y: 0.30 }, angle: 240 });
  if (current === 30) {
    setTimeout(() => confetti({ ...common, particleCount: 220, origin: { x: 0.5, y: 0.2 }, spread: 130 }), 180);
  }

  try { localStorage.setItem(STREAK_KEY, String(current)); } catch { /* private mode */ }
}
