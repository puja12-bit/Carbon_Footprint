/**
 * Shared utilities and domain constants for carbon footprint calculations.
 * Centralised here so that multiple route handlers stay DRY and use the same
 * reference values.
 */

// ─── Emission-equivalence constants ──────────────────────────────────────────

/** Average kg of CO₂ absorbed by one tree per year (IPCC reference). */
export const KG_CO2_PER_TREE_PER_YEAR = 21.77;

/** kg of CO₂ emitted charging one smartphone (EPA estimate). */
export const KG_CO2_PER_PHONE_CHARGE = 0.00822;

/** Average annual CO₂ footprint of a US home in kg (EIA 2023). */
export const KG_CO2_PER_US_HOME_PER_YEAR = 7650;

/** USD value of 1 kg CO₂ offset at voluntary carbon-market rates. */
export const CARBON_PRICE_USD_PER_KG = 0.15;

/** Default daily CO₂ budget for a user in kg. */
export const DEFAULT_DAILY_BUDGET_KG = 10;

// ─── Streak helpers ───────────────────────────────────────────────────────────

/**
 * Derives sorted unique ISO date strings (YYYY-MM-DD) from carbon entry rows.
 * Used by the streak and achievements calculators.
 */
export function toSortedUniqueDates(rows: { createdAt: Date }[]): string[] {
  return rows
    .map((r) => r.createdAt.toISOString().split("T")[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();
}

/**
 * Computes the current consecutive-day logging streak from a sorted list of
 * unique ISO date strings (YYYY-MM-DD). Returns 0 when the list is empty or
 * today has not yet been logged.
 */
export function computeStreak(sortedUniqueDates: string[]): number {
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;

  for (let i = sortedUniqueDates.length - 1; i >= 0; i--) {
    if (sortedUniqueDates[i] === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Aggregates carbon entry rows by category, returning a sorted breakdown with
 * percentages. Rows with the same category are summed together.
 */
export function aggregateByCategory(
  rows: { category: string; co2Kg: number }[],
): { category: string; co2Kg: number; count: number; percentage: number }[] {
  const byCategory: Record<string, { co2Kg: number; count: number }> = {};
  let total = 0;

  for (const row of rows) {
    if (!byCategory[row.category]) {
      byCategory[row.category] = { co2Kg: 0, count: 0 };
    }
    byCategory[row.category].co2Kg += row.co2Kg;
    byCategory[row.category].count++;
    total += row.co2Kg;
  }

  return Object.entries(byCategory)
    .map(([category, { co2Kg, count }]) => ({
      category,
      co2Kg: parseFloat(co2Kg.toFixed(2)),
      count,
      percentage:
        total > 0 ? parseFloat(((co2Kg / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.co2Kg - a.co2Kg);
}
