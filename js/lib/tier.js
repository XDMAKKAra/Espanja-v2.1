/**
 * Tier helpers — PR auto/ohjaamo (2026-05-19).
 *
 * Single source of truth for "is this a paying user?" so HOME, course-overview
 * locks, mode-card badges, and any other paywall check stay consistent. Reads
 * from window._userProfile.subscription_status which dashboard.js hydrates from
 * /api/dashboard/v2 on first load. "Pro" is legacy naming — there is no Pro
 * tier; the paid tiers are Treeni (subscription) and Kurssi (course package).
 */

// Statuses that mean an active paid subscription. EXACT match — the old
// substring check (`sub.includes(s)`) mis-classified "inactive" as paid
// because it contains "active" (L-V377 follow-up).
const PAID_STATUSES = new Set(["treeni", "lifetime", "trialing", "active"]);

export function isPaidTier(profile) {
  const sub = (profile?.subscription_status || window._userProfile?.subscription_status || "")
    .toLowerCase().trim();
  return PAID_STATUSES.has(sub);
}

export function getTierLabel(profile) {
  return isPaidTier(profile) ? "Treeni" : "Free";
}

// Three-way tier for the dashboard launchpad (L-V377). There is no "Pro" tier:
//   free   — no active paid status
//   treeni — active subscription (the 9 €/kk retention tier)
//   kurssi — the 8-course package (subscription_tier "mestari", 49 €)
export function getTier(profile) {
  if (!isPaidTier(profile)) return "free";
  const tier = (profile?.subscription_tier || window._userProfile?.subscription_tier || "").toLowerCase();
  if (tier.includes("mestari")) return "kurssi";
  return "treeni";
}
