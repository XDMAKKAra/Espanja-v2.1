import supabase from "../supabase.js";

// gpt-4o-mini pricing (per 1M tokens, as of 2025)
const INPUT_COST_PER_TOKEN = 0.15 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 0.60 / 1_000_000;

const FREE_MONTHLY_LIMIT_USD = 0.50;
const PRO_MONTHLY_LIMIT_USD = 5.00;

export function calculateCost(inputTokens, outputTokens) {
  return Math.round((inputTokens * INPUT_COST_PER_TOKEN + outputTokens * OUTPUT_COST_PER_TOKEN) * 1_000_000) / 1_000_000;
}

/**
 * Log AI usage to the database. Fire-and-forget.
 */
export async function logAiUsage(userId, endpoint, usage) {
  if (!supabase || !usage) return;
  const inputTokens = usage.inputTokens || usage.prompt_tokens || 0;
  const outputTokens = usage.outputTokens || usage.completion_tokens || 0;
  const costUsd = calculateCost(inputTokens, outputTokens);

  try {
    await supabase.from("ai_usage").insert({
      user_id: userId || null,
      endpoint,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    });
  } catch { /* silent */ }
}

/**
 * Get current month's total cost for a user.
 */
export async function getMonthlyUsage(userId) {
  if (!supabase) return { totalCost: 0, callCount: 0 };

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    const { data, error } = await supabase
      .from("ai_usage")
      .select("cost_usd")
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    if (error || !data) return { totalCost: 0, callCount: 0 };

    const totalCost = data.reduce((sum, row) => sum + Number(row.cost_usd || 0), 0);
    return { totalCost: Math.round(totalCost * 1_000_000) / 1_000_000, callCount: data.length };
  } catch {
    return { totalCost: 0, callCount: 0 };
  }
}

/**
 * Check if user has exceeded their monthly AI cost limit.
 */
export async function checkCostLimit(userId, isPro) {
  const { totalCost } = await getMonthlyUsage(userId);
  const limit = isPro ? PRO_MONTHLY_LIMIT_USD : FREE_MONTHLY_LIMIT_USD;
  return { exceeded: totalCost >= limit, totalCost, limit };
}
