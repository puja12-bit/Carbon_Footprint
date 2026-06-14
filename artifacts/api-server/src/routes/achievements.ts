import { Router, type IRouter } from "express";
import { db, achievementsTable, carbonEntriesTable } from "@workspace/db";
import {
  KG_CO2_PER_TREE_PER_YEAR,
  computeStreak,
  toSortedUniqueDates,
} from "../lib/carbon-utils.js";

const router: IRouter = Router();

/** Minimum kg CO₂ saved to unlock the Carbon Cutter badge. */
const CARBON_CUTTER_TARGET = 50;

/** Minimum kg CO₂ saved to unlock the Planet Guardian badge. */
const PLANET_GUARDIAN_TARGET = 200;

/** Minimum total log entries to unlock the Carbon Analyst badge. */
const CARBON_ANALYST_TARGET = 20;

/** Minimum tree-equivalent savings to unlock the Tree Planter badge. */
const TREE_PLANTER_TARGET = 5;

/** Minimum unique categories logged to unlock the Eco Explorer badge. */
const ECO_EXPLORER_TARGET = 5;

/** Minimum streak days to unlock the Green Streak badge. */
const GREEN_STREAK_TARGET = 3;

const ACHIEVEMENT_SEEDS = [
  {
    title: "First Step",
    description: "Log your first carbon estimate",
    icon: "Footprints",
    target: 1,
  },
  {
    title: "Green Streak",
    description: "Log estimates for 3 days in a row",
    icon: "Flame",
    target: GREEN_STREAK_TARGET,
  },
  {
    title: "Carbon Cutter",
    description: "Save 50 kg CO₂ with greener alternatives",
    icon: "Scissors",
    target: CARBON_CUTTER_TARGET,
  },
  {
    title: "Planet Guardian",
    description: "Save 200 kg CO₂ in total",
    icon: "Shield",
    target: PLANET_GUARDIAN_TARGET,
  },
  {
    title: "Flight Skipper",
    description: "Log 5 transport alternatives instead of flights",
    icon: "Plane",
    target: 5,
  },
  {
    title: "Plant Powered",
    description: "Choose a plant-based food option 10 times",
    icon: "Leaf",
    target: 10,
  },
  {
    title: "Refurb Champion",
    description: "Choose refurbished over new electronics 3 times",
    icon: "RotateCcw",
    target: 3,
  },
  {
    title: "Carbon Analyst",
    description: "Log 20 carbon estimates",
    icon: "BarChart2",
    target: CARBON_ANALYST_TARGET,
  },
  {
    title: "Tree Planter",
    description: "Save the equivalent of 5 trees worth of CO₂",
    icon: "Trees",
    target: TREE_PLANTER_TARGET,
  },
  {
    title: "Eco Explorer",
    description: "Estimate carbon across 5 different categories",
    icon: "Compass",
    target: ECO_EXPLORER_TARGET,
  },
];

/** Seeds the achievements table if it is empty. */
async function ensureAchievements(): Promise<void> {
  const existing = await db.select().from(achievementsTable);
  if (existing.length > 0) {return;}

  await db.insert(achievementsTable).values(
    ACHIEVEMENT_SEEDS.map((a) => ({
      title: a.title,
      description: a.description,
      icon: a.icon,
      isUnlocked: false,
      progress: 0,
      target: a.target,
    })),
  );
}

router.get("/achievements", async (_req, res): Promise<void> => {
  await ensureAchievements();

  const achievements = await db.select().from(achievementsTable);
  const entries = await db.select().from(carbonEntriesTable);

  const totalEntries = entries.length;
  const totalSaved = entries.reduce((s, r) => s + (r.savedCo2Kg ?? 0), 0);
  const categories = new Set(entries.map((r) => r.category));
  const streakDays = computeStreak(toSortedUniqueDates(entries));

  const updatedAchievements = achievements.map((a) => {
    let progress = a.progress ?? 0;
    let isUnlocked = a.isUnlocked;

    switch (a.title) {
      case "First Step":
        progress = Math.min(totalEntries, 1);
        break;
      case "Green Streak":
        progress = Math.min(streakDays, GREEN_STREAK_TARGET);
        break;
      case "Carbon Cutter":
        progress = Math.min(totalSaved, CARBON_CUTTER_TARGET);
        break;
      case "Planet Guardian":
        progress = Math.min(totalSaved, PLANET_GUARDIAN_TARGET);
        break;
      case "Carbon Analyst":
        progress = Math.min(totalEntries, CARBON_ANALYST_TARGET);
        break;
      case "Tree Planter":
        progress = Math.min(totalSaved / KG_CO2_PER_TREE_PER_YEAR, TREE_PLANTER_TARGET);
        break;
      case "Eco Explorer":
        progress = Math.min(categories.size, ECO_EXPLORER_TARGET);
        break;
      default:
        break;
    }

    const target = a.target ?? 1;
    if (progress >= target && !isUnlocked) {
      isUnlocked = true;
    }

    return {
      ...a,
      progress: parseFloat(progress.toFixed(2)),
      isUnlocked,
      unlockedAt: isUnlocked && !a.unlockedAt ? new Date() : a.unlockedAt,
    };
  });

  res.json(updatedAchievements);
});

export default router;
