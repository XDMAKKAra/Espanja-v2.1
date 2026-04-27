// Meteors mounter — sourced from Magic UI meteors.tsx
// (github.com/magicuidesign/magicui — apps/www/registry/magicui/meteors.tsx).
// React + framer-motion in the original; here it's vanilla. Mount once per
// container; pass `count` and `angle` to taste. The parent should be
// position:relative — the .meteors-fx container is absolute-positioned to
// inset:0 so it traces the hero without affecting layout.

const DEFAULTS = {
  count: 18,
  minDelaySec: 0.2,
  maxDelaySec: 1.4,
  minDurationSec: 4,
  maxDurationSec: 8,
  // Visual tilt of the meteor body (the head + trailing tail). The CSS
  // keyframe already animates translate(--mx, --my) for the actual
  // movement; this rotation only controls how the tail aligns with the
  // diagonal path. -25° puts the tail up-and-right of a head that's
  // moving down-and-left.
  angleDeg: -25,
};

function rand(lo, hi) { return Math.random() * (hi - lo) + lo; }

export function mountMeteors(container, opts = {}) {
  if (!container) return;
  if (container.dataset.meteorsMounted === "1") return; // idempotent
  const cfg = { ...DEFAULTS, ...opts };

  // The CSS keyframe sweeps a fixed -720px translateX, so we randomise the
  // starting horizontal position across the container width to avoid all
  // meteors starting from the same column.
  const width = container.clientWidth || container.parentElement?.clientWidth || 1200;

  const frag = document.createDocumentFragment();
  for (let i = 0; i < cfg.count; i++) {
    const m = document.createElement("span");
    m.className = "meteor";
    m.setAttribute("aria-hidden", "true");
    // Spread starting positions across the full width plus a buffer on the
    // right (since meteors translate down-and-left, that buffer keeps the
    // strip looking populated through the whole sweep).
    const left = Math.floor(rand(0, width + 200));
    const delay = rand(cfg.minDelaySec, cfg.maxDelaySec);
    const dur   = rand(cfg.minDurationSec, cfg.maxDurationSec);
    m.style.left = `${left}px`;
    m.style.setProperty("--angle", `${cfg.angleDeg}deg`);
    m.style.setProperty("--delay", `${delay}s`);
    m.style.setProperty("--duration", `${dur.toFixed(1)}s`);
    frag.appendChild(m);
  }
  container.appendChild(frag);
  container.dataset.meteorsMounted = "1";
  container.hidden = false;
}

export function unmountMeteors(container) {
  if (!container) return;
  container.innerHTML = "";
  container.dataset.meteorsMounted = "";
  container.hidden = true;
}
