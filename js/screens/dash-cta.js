/* Dashboard "Day's drill" CTA, selection logic + DOM updater.
   Spec: docs/superpowers/specs/2026-05-19-dashboard-writingfirst-confirm-design.md
   Selection priority (first match wins):
     1. Profile incomplete  → onboarding
     2. Default             → writing task (vocab/grammar/SR standalone modes
                              were removed; SR queue is frozen — see Task 1
                              sub-fix A, user-chosen option B). */

export function selectDashboardCta({ profileComplete, weakestTopic } = {}) {
  if (!profileComplete) {
    return {
      kind: "onboarding",
      title: "Täydennä profiilisi",
      meta: "2 MIN · RÄÄTÄLÖI HARJOITTELU",
      target: "onboarding",
    };
  }

  // Day-CTA is the writing task: it's Puheo's centerpiece
  // (YTL-rubriikilla treenattu AI-grader) and produces the deepest signal
  // for the adaptive engine. Vocab/grammar standalone modes were removed
  // from the dashboard so this CTA never falls back to them.
  const topicTag = weakestTopic
    ? String(weakestTopic).toUpperCase()
    : null;
  return {
    kind: "drill",
    title: "Kirjoita päivän tehtävä",
    meta: topicTag
      ? `~15 MIN · LYHYT KIRJOITUS · ${topicTag}`
      : "~15 MIN · LYHYT KIRJOITUS",
    target: "writing",
  };
}

export function renderDashboardCta(rootEl, state) {
  if (!rootEl) return;
  const { title, meta, target, kind } = selectDashboardCta(state);
  const titleEl = rootEl.querySelector("[data-cta-title]");
  const metaEl = rootEl.querySelector("[data-cta-meta]");
  if (titleEl) titleEl.textContent = title;
  if (metaEl) metaEl.textContent = meta;
  rootEl.dataset.target = target;
  rootEl.dataset.kind = kind;
}
