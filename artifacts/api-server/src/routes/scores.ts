import { Router, type IRouter } from "express";
import { db, carbonEntriesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { GetScoreHistoryQueryParams } from "@workspace/api-zod";
import { DEFAULT_DAILY_BUDGET_KG } from "../lib/carbon-utils.js";

const router: IRouter = Router();

/** Number of days included in each history period. */
const PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  year: 365,
};

/** Default history period when none is specified. */
const DEFAULT_PERIOD = "month";

router.get("/scores", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(carbonEntriesTable)
    .orderBy(desc(carbonEntriesTable.createdAt));

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(lastWeekStart.getDate() - PERIOD_DAYS.week);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const sumFrom = (from: Date): number =>
    rows.filter((r) => r.createdAt >= from).reduce((s, r) => s + r.co2Kg, 0);

  const daily = sumFrom(startOfDay);
  const weekly = sumFrom(startOfWeek);
  const monthly = sumFrom(startOfMonth);
  const yearly = sumFrom(startOfYear);

  const lastWeek = rows
    .filter((r) => r.createdAt >= lastWeekStart && r.createdAt < startOfWeek)
    .reduce((s, r) => s + r.co2Kg, 0);

  const lastMonth = rows
    .filter((r) => r.createdAt >= lastMonthStart && r.createdAt < lastMonthEnd)
    .reduce((s, r) => s + r.co2Kg, 0);

  const weeklyChange =
    lastWeek > 0
      ? parseFloat((((weekly - lastWeek) / lastWeek) * 100).toFixed(1))
      : 0;

  const monthlyChange =
    lastMonth > 0
      ? parseFloat((((monthly - lastMonth) / lastMonth) * 100).toFixed(1))
      : 0;

  res.json({
    daily: parseFloat(daily.toFixed(2)),
    weekly: parseFloat(weekly.toFixed(2)),
    monthly: parseFloat(monthly.toFixed(2)),
    yearly: parseFloat(yearly.toFixed(2)),
    dailyBudget: DEFAULT_DAILY_BUDGET_KG,
    weeklyChange,
    monthlyChange,
  });
});

router.get("/scores/history", async (req, res): Promise<void> => {
  const params = GetScoreHistoryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const period = params.data.period ?? DEFAULT_PERIOD;
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS[DEFAULT_PERIOD];
  const now = new Date();

  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);

  const rows = await db
    .select()
    .from(carbonEntriesTable)
    .orderBy(desc(carbonEntriesTable.createdAt));

  const filtered = rows.filter((r) => r.createdAt >= startDate);

  // Pre-fill all dates in the period with 0 to ensure continuity on the chart
  const byDate: Record<string, { co2Kg: number; savedCo2Kg: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().split("T")[0];
    byDate[key] = { co2Kg: 0, savedCo2Kg: 0 };
  }

  for (const r of filtered) {
    const key = r.createdAt.toISOString().split("T")[0];
    if (byDate[key]) {
      byDate[key].co2Kg += r.co2Kg;
      byDate[key].savedCo2Kg += r.savedCo2Kg ?? 0;
    }
  }

  const result = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { co2Kg, savedCo2Kg }]) => ({
      date,
      co2Kg: parseFloat(co2Kg.toFixed(2)),
      savedCo2Kg: parseFloat(savedCo2Kg.toFixed(2)),
    }));

  res.json(result);
});

export default router;
