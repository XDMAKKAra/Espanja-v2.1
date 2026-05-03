// Scroll-reveal — L-PLAN-8 UPDATE 3.
//
// Watches every [data-reveal] in the document and adds .is-revealed when
// it crosses 40 % of the viewport (with a -10 % bottom margin so the
// trigger fires slightly before the element is fully in frame).
//
// Idempotent — safe to re-run; observed elements are unobserved on first
// reveal so we never double-trigger when the user scrolls back up.

const REVEAL_SELECTOR = "[data-reveal]";

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function initScrollReveal() {
  if (typeof document === "undefined") return;
  const targets = document.querySelectorAll(REVEAL_SELECTOR);
  if (!targets.length) return;

  // Reduced-motion users get the final state immediately — the CSS
  // already overrides opacity/transform under the same media query, but
  // we also add the class so any JS-side observers stay coherent.
  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    targets.forEach((el) => el.classList.add("is-revealed"));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-revealed");
      io.unobserve(e.target);
    }
  }, {
    threshold: 0.4,
    rootMargin: "0px 0px -10% 0px",
  });

  targets.forEach((el) => io.observe(el));
}
