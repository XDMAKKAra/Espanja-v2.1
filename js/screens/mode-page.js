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
