import { isPro } from "./auth.js";
import { checkCostLimit } from "../lib/aiCost.js";
import supabase from "../supabase.js";

/**
 * Middleware that checks monthly AI cost limit.
 * Must be used after auth (req.user must exist, or request is unauthenticated).
 */
export async function checkMonthlyCostLimit(req, res, next) {
  // Skip for unauthenticated requests
  if (!req.user?.userId) return next();
  if (!supabase) return next();

  try {
    const pro = await isPro(req.user.userId);
    const { exceeded, totalCost, limit } = await checkCostLimit(req.user.userId, pro);

    if (exceeded) {
      return res.status(403).json({
        error: pro ? "pro_cost_limit" : "pro_required_cost_limit",
        message: pro
          ? `Kuukauden AI-raja ($${limit}) ylitetty. Ota yhteyttä tukeen.`
          : `Ilmainen AI-kiintiö ($${limit}/kk) täynnä. Päivitä Pro saadaksesi lisää.`,
        totalCost: Math.round(totalCost * 100) / 100,
        limit,
      });
    }

    next();
  } catch {
    // Fail open — don't block on errors
    next();
  }
}
