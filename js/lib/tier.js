/**
 * Tier helpers — PR auto/ohjaamo (2026-05-19).
 *
 * Single source of truth for "is this user pro?" so HOME ohjaamo,
 * course-overview locks, mode-card badges, and any other paywall
 * check stay consistent. Reads from window._userProfile.subscription_status
 * which dashboard.js hydrates from /api/dashboard/v2 on first load.
 */

const PRO_STATUSES = ["pro", "treeni", "lifetime", "trialing", "active"];

export function isProTier(profile) {
  const sub = (profile?.subscription_status || window._userProfile?.subscription_status || "").toLowerCase();
  return PRO_STATUSES.some((s) => sub.includes(s));
}

export function getTierLabel(profile) {
  return isProTier(profile) ? "Treeni" : "Free";
}
