// Pass 4 Commit 10 — free-tier daily exercise cap (vocab/grammar only).
// Client-side soft cap: exercises still run and save progress; result
// screens render a gentle nudge banner from exercise #15 onward.
//
// Cap is keyed on Helsinki-local day via a plain ISO date so a user in
// Vantaa doesn't get reset at UTC midnight (22:00 Helsinki in winter).

const KEY = "puheo_exercises_today";
export const FREE_DAILY_CAP = 15;

function helsinkiDateKey(now = new Date()) {
  // YYYY-MM-DD in Europe/Helsinki. Acceptable approximation: toLocaleDateString.
  try {
    return now.toLocaleDateString("sv-SE", { timeZone: "Europe/Helsinki" });
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function incrementDailyCount() {
  try {
    const today = helsinkiDateKey();
    const raw = localStorage.getItem(KEY);
    let next;
    if (!raw) {
      next = { date: today, count: 1 };
    } else {
      const parsed = JSON.parse(raw);
      next = parsed.date === today ? { date: today, count: parsed.count + 1 } : { date: today, count: 1 };
    }
    localStorage.setItem(KEY, JSON.stringify(next));
    return next.count;
  } catch {
    return 0;
  }
}

export function getDailyCount() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (parsed.date !== helsinkiDateKey()) return 0;
    return Number(parsed.count) || 0;
  } catch {
    return 0;
  }
}

export function isPro() {
  // Lightweight client-side check — server still owns truth. We use
  // subscription status cached by hydrateConfig for the banner decision.
  return window.__IS_PRO === true;
}

export function shouldShowCapBanner() {
  if (isPro()) return false;
  return getDailyCount() >= FREE_DAILY_CAP;
}

export const CAP_BANNER_COPY =
  "Olet tehnyt tänään 15 harjoitusta — huippusuoritus. Lisää huomenna tai Pro-tilauksella heti.";
