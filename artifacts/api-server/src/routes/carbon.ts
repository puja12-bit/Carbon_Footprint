import { Router, type IRouter } from "express";
import { db, carbonEntriesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import {
  EstimateCarbonBody,
  ListCarbonEntriesQueryParams,
  SaveCarbonEntryBody,
  GetRecentEntriesQueryParams,
  GetCarbonEntryParams,
  DeleteCarbonEntryParams,
} from "@workspace/api-zod";
import { estimateCarbonWithScore } from "../lib/carbon-engine.js";
import { estimateCarbonWithAI } from "../lib/ai-estimator.js";
import {
  KG_CO2_PER_TREE_PER_YEAR,
  KG_CO2_PER_PHONE_CHARGE,
  KG_CO2_PER_US_HOME_PER_YEAR,
  CARBON_PRICE_USD_PER_KG,
  computeStreak,
  toSortedUniqueDates,
  aggregateByCategory,
} from "../lib/carbon-utils.js";

const router: IRouter = Router();

router.post("/carbon/estimate", async (req, res): Promise<void> => {
  const parsed = EstimateCarbonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { result, keywordScore } = estimateCarbonWithScore(parsed.data.query);

  // No keyword match — try AI for a more accurate, context-aware estimate
  if (keywordScore === 0) {
    const aiResult = await estimateCarbonWithAI(parsed.data.query);
    if (aiResult) {
      res.json(aiResult);
      return;
    }
  }

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

  const entries = await db
    .select()
    .from(carbonEntriesTable)
    .orderBy(desc(carbonEntriesTable.createdAt))
    .limit(limit)
    .offset(offset);
  res.json(entries);
});

router.post("/carbon/entries", async (req, res): Promise<void> => {
  const parsed = SaveCarbonEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(carbonEntriesTable).values(parsed.data).returning();
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

  const totalCo2Kg = rows.reduce((sum, row) => sum + row.co2Kg, 0);
  const savedCo2Kg = rows.reduce((sum, row) => sum + (row.savedCo2Kg ?? 0), 0);
  const totalEntries = rows.length;

  const treesEquivalent = parseFloat((savedCo2Kg / KG_CO2_PER_TREE_PER_YEAR).toFixed(2));
  const phonesCharged = parseFloat((savedCo2Kg / KG_CO2_PER_PHONE_CHARGE).toFixed(0));
  const homesEquivalent = parseFloat((savedCo2Kg / KG_CO2_PER_US_HOME_PER_YEAR).toFixed(4));
  const moneySavedUsd = parseFloat((savedCo2Kg * CARBON_PRICE_USD_PER_KG).toFixed(2));
  const streakDays = computeStreak(toSortedUniqueDates(rows));

  res.json({
    totalCo2Kg,
    savedCo2Kg,
    totalEntries,
    treesEquivalent,
    phonesCharged,
    homesEquivalent,
    streakDays,
    moneySavedUsd,
  });
});

router.get("/carbon/categories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(carbonEntriesTable);
  res.json(aggregateByCategory(rows));
});

export default router;
