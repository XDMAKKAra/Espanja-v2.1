/* Dashboard "Day's drill" CTA — selection logic + DOM updater.
   Spec: docs/superpowers/specs/2026-04-26-dashboard-editorial-redesign-design.md §3.3
   Selection priority (first match wins):
     1. Profile incomplete  → onboarding
     2. SR cards due        → SR review
     3. Default             → daily drill (seeded with weakest topic) */

export function selectDashboardCta({ profileComplete, srDueCount, weakestTopic }) {
  if (!profileComplete) {
    return {
      kind: "onboarding",
      title: "Täydennä profiilisi",
      meta: "2 MIN · RÄÄTÄLÖI HARJOITTELU",
      target: "onboarding",
    };
  }

  const due = Number(srDueCount) || 0;
  if (due > 0) {
    return {
      kind: "sr",
      title: `Kertaa nyt — ${due} ${due === 1 ? "kortti" : "korttia"}`,
      meta: `${due} ODOTTAA · ~${Math.max(2, Math.round(due / 4))} MIN`,
      target: "sr-review",
    };
  }

  const topicTag = weakestTopic
    ? String(weakestTopic).toUpperCase()
    : null;
  return {
    kind: "drill",
    title: "Aloita päivän treeni",
    meta: topicTag
      ? `20 SANAA · 5 MIN · ${topicTag}`
      : "20 SANAA · 5 MIN",
    target: "vocab",
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
