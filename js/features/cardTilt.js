// Card tilt + glare — sourced from Aceternity UI 3d-card-effect
// (mousemove → rotateX/Y derivation) and Magic UI magic-card (cursor-tracked
// radial glare positioned via CSS custom properties). Vanilla JS port.
//
// Usage: enableCardTilt(".mode-picker .mode-btn:not(.mode-locked)").
// Call after the matching elements are in the DOM. Idempotent — re-calling
// with the same elements is a no-op (each element gets one set of listeners).

const DEFAULTS = {
  maxRotateDeg: 8,
  scale: 1.015,
  glare: true,
};

function attach(el, cfg) {
  if (el.dataset.tiltAttached === "1") return;
  el.dataset.tiltAttached = "1";

  // The :before glare pseudo reads --tilt-mx / --tilt-my from the element.
  // CSS handles all the painting; JS only writes coordinates.
  const onMove = (e) => {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;   // 0..1
    const y = (e.clientY - rect.top)  / rect.height;  // 0..1
    const rx = (0.5 - y) * cfg.maxRotateDeg * 2;      // tilt up when cursor on top
    const ry = (x - 0.5) * cfg.maxRotateDeg * 2;
    el.style.setProperty("--tilt-rx", `${rx.toFixed(2)}deg`);
    el.style.setProperty("--tilt-ry", `${ry.toFixed(2)}deg`);
    el.style.setProperty("--tilt-scale", String(cfg.scale));
    if (cfg.glare) {
      el.style.setProperty("--tilt-mx", `${(x * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-my", `${(y * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-glare-opacity", "1");
    }
  };
  const onLeave = () => {
    el.style.setProperty("--tilt-rx", "0deg");
    el.style.setProperty("--tilt-ry", "0deg");
    el.style.setProperty("--tilt-scale", "1");
    el.style.setProperty("--tilt-glare-opacity", "0");
  };

  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerleave", onLeave);
  el.addEventListener("blur", onLeave);
}

export function enableCardTilt(selector, opts = {}) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  // Coarse pointers (touch devices) — skip; tilt-on-tap is jarring and
  // the focus state already handles primary interaction.
  if (window.matchMedia?.("(pointer: coarse)").matches) return;
  const cfg = { ...DEFAULTS, ...opts };
  document.querySelectorAll(selector).forEach((el) => attach(el, cfg));
}
