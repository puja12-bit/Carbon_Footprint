import { Router, type IRouter } from "express";
import { db, carbonEntriesTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import {
  EstimateCarbonBody,
  ListCarbonEntriesQueryParams,
  SaveCarbonEntryBody,
  GetRecentEntriesQueryParams,
  GetCarbonEntryParams,
  DeleteCarbonEntryParams,
} from "@workspace/api-zod";
import { estimateCarbon } from "../lib/carbon-engine";

const router: IRouter = Router();

router.post("/carbon/estimate", async (req, res): Promise<void> => {
  const parsed = EstimateCarbonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = estimateCarbon(parsed.data.query);
  res.json(result);
});

router.get("/carbon/entries/recent", async (req, res): Promise<void> => {
  const params = GetRecentEntriesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 10;
  const entries = await db
    .select()
    .from(carbonEntriesTable)
    .orderBy(desc(carbonEntriesTable.createdAt))
    .limit(limit);

  res.json(entries);
});

router.get("/carbon/entries", async (req, res): Promise<void> => {
  const params = ListCarbonEntriesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 20;
  const offset = params.data.offset ?? 0;

  let query = db
    .select()
    .from(carbonEntriesTable)
    .orderBy(desc(carbonEntriesTable.createdAt))
    .limit(limit)
    .offset(offset);

  if (params.data.category) {
    const entries = await db
      .select()
      .from(carbonEntriesTable)
      .where(eq(carbonEntriesTable.category, params.data.category))
      .orderBy(desc(carbonEntriesTable.createdAt))
      .limit(limit)
      .offset(offset);
    res.json(entries);
    return;
  }

  const entries = await query;
  res.json(entries);
});

router.post("/carbon/entries", async (req, res): Promise<void> => {
  const parsed = SaveCarbonEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(carbonEntriesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(entry);
});

router.get("/carbon/entries/:id", async (req, res): Promise<void> => {
  const params = GetCarbonEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .select()
    .from(carbonEntriesTable)
    .where(eq(carbonEntriesTable.id, params.data.id));

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.json(entry);
});

router.delete("/carbon/entries/:id", async (req, res): Promise<void> => {
  const params = DeleteCarbonEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(carbonEntriesTable)
    .where(eq(carbonEntriesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/carbon/stats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(carbonEntriesTable);

  const totalCo2Kg = rows.reduce((s, r) => s + r.co2Kg, 0);
  const savedCo2Kg = rows.reduce((s, r) => s + (r.savedCo2Kg ?? 0), 0);
  const totalEntries = rows.length;

  // Equivalents
  const treesEquivalent = parseFloat((savedCo2Kg / 21.77).toFixed(2)); // avg tree absorbs 21.77 kg/yr
  const phonesCharged = parseFloat((savedCo2Kg / 0.00822).toFixed(0)); // 8.22 g CO₂ per charge
  const homesEquivalent = parseFloat((savedCo2Kg / 7650).toFixed(4)); // avg US home 7650 kg/yr
  const moneySavedUsd = parseFloat((savedCo2Kg * 0.15).toFixed(2)); // rough carbon price proxy

  // Calculate streak
  const sortedDates = rows
    .map((r) => r.createdAt.toISOString().split("T")[0])
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    if (sortedDates[i] === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else {
      break;
    }
  }

  res.json({
    totalCo2Kg,
    savedCo2Kg,
    totalEntries,
    treesEquivalent,
    phonesCharged,
    homesEquivalent,
    streakDays: streak,
    moneySavedUsd,
  });
});

router.get("/carbon/categories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(carbonEntriesTable);

  const byCategory: Record<string, { co2Kg: number; count: number }> = {};
  let total = 0;

  for (const r of rows) {
    if (!byCategory[r.category]) byCategory[r.category] = { co2Kg: 0, count: 0 };
    byCategory[r.category].co2Kg += r.co2Kg;
    byCategory[r.category].count++;
    total += r.co2Kg;
  }

  const result = Object.entries(byCategory).map(([category, { co2Kg, count }]) => ({
    category,
    co2Kg: parseFloat(co2Kg.toFixed(2)),
    count,
    percentage: total > 0 ? parseFloat(((co2Kg / total) * 100).toFixed(1)) : 0,
  }));

  result.sort((a, b) => b.co2Kg - a.co2Kg);
  res.json(result);
});

export default router;
