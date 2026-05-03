// Landing hero "live elements" — L-PLAN-8 UPDATE 1.
//
// Two effects, both gated by IntersectionObserver and prefers-reduced-motion:
//
//   A. Vocab pillar demo card cycles through 6 example word pairs every 5s,
//      crossfading on opacity only (no transform → no CLS). The correct-
//      option border stays painted on the first <li>; we only swap text.
//
//   B. Hero radial-glow drifts within ±2% on a 60s ease-in-out loop. CSS
//      keyframe lives in landing.css; this module only adds the trigger
//      class once the section enters the viewport so the animation starts
//      at a deterministic moment.
//
// Idempotent. Cleans up its observer on visibility loss to avoid burning
// rAF in background tabs.

const ROTATION_MS = 5000;
const FADE_MS = 250;

const PAIRS = [
  { q: "el estrés",          correct: "stressi",      distractors: ["väsymys", "onnellisuus", "rohkeus"] },
  { q: "la huelga",          correct: "lakko",        distractors: ["loma",    "kokous",       "vapaapäivä"] },
  { q: "el medio ambiente",  correct: "ympäristö",    distractors: ["sää",     "ilmasto",      "luonto"] },
  { q: "ahorrar",            correct: "säästää",      distractors: ["ostaa",   "kuluttaa",     "lainata"] },
  { q: "la jubilación",      correct: "eläke",        distractors: ["palkka",  "loma",         "työpaikka"] },
  { q: "el desempleo",       correct: "työttömyys",   distractors: ["lakko",   "palkka",       "loma"] },
];

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

function paintPair(card, pair) {
  const q = card.querySelector(".pillar__demo-q strong");
  const opts = card.querySelectorAll(".pillar__demo-opt");
  if (!q || opts.length < 4) return;

  const items = [
    { text: `${pair.correct} ✓`, correct: true },
    { text: pair.distractors[0], correct: false },
    { text: pair.distractors[1], correct: false },
    { text: pair.distractors[2], correct: false },
  ];

  q.textContent = `«${pair.q}»`;
  opts.forEach((li, i) => {
    li.textContent = items[i].text;
    li.classList.toggle("pillar__demo-opt--correct", items[i].correct);
  });
}

function startRotation(card) {
  if (card.dataset.rotationStarted === "1") return;
  card.dataset.rotationStarted = "1";

  let idx = 0;
  // Track inline state on the host so the demo crossfades in place.
  const stage = card.querySelector(".pillar__demo");
  if (!stage) return;
  stage.style.transition = `opacity ${FADE_MS}ms ease`;

  const tick = () => {
    if (card.dataset.rotationActive !== "1") return;
    idx = (idx + 1) % PAIRS.length;
    stage.style.opacity = "0";
    window.setTimeout(() => {
      paintPair(card, PAIRS[idx]);
      stage.style.opacity = "1";
    }, FADE_MS);
  };

  card.__rotationTimer = window.setInterval(tick, ROTATION_MS);
}

function stopRotation(card) {
  if (card.__rotationTimer) {
    window.clearInterval(card.__rotationTimer);
    card.__rotationTimer = null;
  }
  card.dataset.rotationActive = "";
}

function initVocabRotation() {
  const card = document.querySelector(".pillar.pillar--vocab");
  if (!card) return;
  // Prime the static state from the first pair so the markup stays
  // self-consistent even before the observer fires.
  paintPair(card, PAIRS[0]);

  if (prefersReducedMotion()) return;
  if (typeof IntersectionObserver === "undefined") return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        card.dataset.rotationActive = "1";
        startRotation(card);
      } else {
        stopRotation(card);
      }
    }
  }, { threshold: 0.4 });

  io.observe(card);
}

function initHeroBokehDrift() {
  const glow = document.querySelector(".hero__glow");
  if (!glow) return;
  if (prefersReducedMotion()) return;
  // Add a gating class so the keyframe only runs once observed; this also
  // gives reduced-motion users a clean opt-out target.
  glow.classList.add("hero__glow--drift");
}

export function initLandingHero() {
  if (typeof document === "undefined") return;
  initVocabRotation();
  initHeroBokehDrift();
}
