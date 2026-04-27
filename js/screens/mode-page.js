/**
 * Mode-page module — Spec 2 §3.
 *
 * Owns:
 *  - Briefing card population (loadBriefing — added in Task 6).
 *  - Topic-row interaction (radio-group toggle on click + keyboard).
 *  - Start-CTA meta line live update on topic change.
 *  - generateCoachLine helper used by results (added in Task 14).
 *
 * Why a separate module: keeps app.js from growing further; the briefing
 * card needs cached dashboard state and there's no good home for that
 * in vocab.js / grammar.js / reading.js individually.
 */

const TOPIC_LABELS = {
  // vocab
  "general vocabulary": "Yleinen sanasto",
  "society and politics": "Yhteiskunta",
  "environment and nature": "Ympäristö",
  "health and body": "Terveys",
  "travel and transport": "Matkailu",
  "culture and arts": "Kulttuuri",
  "work and economy": "Työ & talous",
  // grammar
  mixed: "Sekaisin",
  ser_estar: "Ser vs. Estar",
  hay_estar: "Hay vs. Estar",
  subjunctive: "Subjunktiivi",
  conditional: "Konditionaali",
  preterite_imperfect: "Pret. vs. Imperf.",
  pronouns: "Pronominit",
  // reading
  "animals and nature": "Eläimet & luonto",
  "travel and places": "Matkailu & paikat",
  "culture and history": "Kulttuuri & historia",
  "social media and technology": "Some & teknologia",
  "health and sports": "Terveys & urheilu",
  environment: "Ympäristö",
};

/**
 * Wire one topic-picker container.
 * Clicking a row reassigns .is-current + aria-checked,
 * and (if a CTA is provided) updates its meta line.
 *
 * @param {HTMLElement} container — `.mode-topics` element
 * @param {{ ctaEl?: HTMLElement, ctaMetaTemplate?: (topic: string) => string }} [opts]
 */
export function wireTopicPicker(container, { ctaEl, ctaMetaTemplate } = {}) {
  if (!container) return;
  container.addEventListener("click", (e) => {
    const row = e.target.closest(".mode-topic");
    if (!row || !container.contains(row)) return;
    setCurrentRow(container, row);
    if (ctaEl && ctaMetaTemplate) {
      updateCtaMeta(ctaEl, row, ctaMetaTemplate);
    }
  });
}

function setCurrentRow(container, row) {
  container.querySelectorAll(".mode-topic").forEach((r) => {
    r.classList.remove("is-current");
    r.setAttribute("aria-checked", "false");
  });
  row.classList.add("is-current");
  row.setAttribute("aria-checked", "true");
}

function updateCtaMeta(ctaEl, row, template) {
  const metaEl = ctaEl.querySelector(".btn--cta__meta");
  if (!metaEl) return;
  const topicId = row.dataset.topic || row.dataset.tense || row.dataset.type || "";
  metaEl.textContent = template(topicId);
}

/** Look up a Finnish display name for a topic ID. Falls back to the raw ID. */
export function topicLabel(topicId) {
  return TOPIC_LABELS[topicId] || topicId;
}

/**
 * Populate the briefing-card slots for `modeId` from cached dashboard state.
 *
 * Reads from `window._dashModeStats[modeId]`, `window._dashStreak`,
 * `window._dashModeDaysAgo[modeId]`. If any field is missing, that row
 * shows "—". If `modeStats[modeId].sessions === 0` (or the entire entry
 * is missing), the briefing collapses to its empty-state variant.
 *
 * @param {string} modeId — "vocab" | "grammar" | "reading" | "writing" | "verbsprint"
 */
export function loadBriefing(modeId) {
  const briefing = document.getElementById(`${modeId}-briefing`);
  if (!briefing) return;

  const stats = (typeof window !== "undefined" && window._dashModeStats?.[modeId]) || null;
  const streak = (typeof window !== "undefined") ? window._dashStreak : 0;
  const daysAgo = (typeof window !== "undefined" && window._dashModeDaysAgo?.[modeId]);

  // Empty-state branch — first-time visitor or no data for this mode.
  if (!stats || !stats.sessions || stats.sessions === 0) {
    briefing.classList.add("mode-briefing--empty");
    const eyebrow = briefing.querySelector(".eyebrow");
    if (eyebrow) eyebrow.textContent = "ENSIMMÄINEN KERTA";
    let intro = briefing.querySelector(".mode-briefing__intro");
    if (!intro) {
      intro = document.createElement("p");
      intro.className = "mode-briefing__intro";
      intro.textContent = "Aloita Sekaisin-aiheella nähdäksesi, mihin aiheeseen sinun kannattaa keskittyä.";
      briefing.appendChild(intro);
    }
    return;
  }

  // Populated branch.
  briefing.classList.remove("mode-briefing--empty");

  const eyebrow = briefing.querySelector(".eyebrow");
  if (eyebrow) {
    eyebrow.textContent = formatLastEyebrow(daysAgo);
  }

  const accEl = briefing.querySelector(`#${modeId}-last-acc`);
  if (accEl) accEl.textContent = stats.avgPct == null ? "—" : String(stats.avgPct);

  const sessEl = briefing.querySelector(`#${modeId}-week-sessions`);
  if (sessEl) sessEl.textContent = stats.sessions == null ? "—" : String(stats.sessions);

  const streakEl = briefing.querySelector(`#${modeId}-streak`);
  if (streakEl) streakEl.textContent = streak == null ? "—" : String(streak);
}

function formatLastEyebrow(daysAgo) {
  if (daysAgo == null) return "VIIMEKSI · —";
  if (daysAgo === 0) return "VIIMEKSI · TÄNÄÄN";
  if (daysAgo === 1) return "VIIMEKSI · EILEN";
  return `VIIMEKSI · ${daysAgo} PV SITTEN`;
}

/**
 * Generate the short Finnish coaching line shown above the breakdown list.
 *
 * @param {{ scorePct: number, sessionWeakestLabel?: string|null }} params
 * @returns {string}
 */
export function generateCoachLine({ scorePct, sessionWeakestLabel }) {
  if (scorePct >= 90) return "Loistavaa. Pidä vauhtia yllä.";
  if (scorePct >= 70) {
    return sessionWeakestLabel
      ? `Hyvä. Paranna ${sessionWeakestLabel}-aihetta.`
      : "Hyvä. Pidä taso yllä.";
  }
  if (scorePct >= 50) {
    return sessionWeakestLabel
      ? `Tasolla. ${sessionWeakestLabel} kaipaa toistoa.`
      : "Tasolla. Kertaa kaikki aiheet.";
  }
  return "Tämä jäi vielä. Yritä helpompaa tasoa tai lyhyempää sarjaa.";
}

/**
 * Animate an element's textContent from 0 up to `target` over `duration` ms.
 * Eases out cubic. Respects prefers-reduced-motion (writes target immediately).
 *
 * @param {HTMLElement|null} el
 * @param {number} target — final integer to land on
 * @param {number} [duration=1200]
 */
export function countUp(el, target, duration = 1200) {
  if (!el) return;
  if (typeof target !== "number" || !Number.isFinite(target)) {
    el.textContent = String(target);
    return;
  }
  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || duration <= 0 || typeof requestAnimationFrame !== "function") {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
