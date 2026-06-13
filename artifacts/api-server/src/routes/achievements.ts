import { Router, type IRouter } from "express";
import { db, achievementsTable, carbonEntriesTable } from "@workspace/db";

const router: IRouter = Router();

const ACHIEVEMENT_SEEDS = [
  { title: "First Step", description: "Log your first carbon estimate", icon: "Footprints", target: 1 },
  { title: "Green Streak", description: "Log estimates for 3 days in a row", icon: "Flame", target: 3 },
  { title: "Carbon Cutter", description: "Save 50 kg CO₂ with greener alternatives", icon: "Scissors", target: 50 },
  { title: "Planet Guardian", description: "Save 200 kg CO₂ in total", icon: "Shield", target: 200 },
  { title: "Flight Skipper", description: "Log 5 transport alternatives instead of flights", icon: "Plane", target: 5 },
  { title: "Plant Powered", description: "Choose a plant-based food option 10 times", icon: "Leaf", target: 10 },
  { title: "Refurb Champion", description: "Choose refurbished over new electronics 3 times", icon: "RotateCcw", target: 3 },
  { title: "Carbon Analyst", description: "Log 20 carbon estimates", icon: "BarChart2", target: 20 },
  { title: "Tree Planter", description: "Save the equivalent of 5 trees worth of CO₂", icon: "Trees", target: 5 },
  { title: "Eco Explorer", description: "Estimate carbon across 5 different categories", icon: "Compass", target: 5 },
];

async function ensureAchievements() {
  const existing = await db.select().from(achievementsTable);
  if (existing.length > 0) return;

  await db.insert(achievementsTable).values(
    ACHIEVEMENT_SEEDS.map((a) => ({
      title: a.title,
      description: a.description,
      icon: a.icon,
      isUnlocked: false,
      progress: 0,
      target: a.target,
    }))
  );
}

router.get("/achievements", async (_req, res): Promise<void> => {
  await ensureAchievements();

  const achievements = await db.select().from(achievementsTable);
  const entries = await db.select().from(carbonEntriesTable);

  // Calculate progress for each achievement
  const totalEntries = entries.length;
  const totalSaved = entries.reduce((s, r) => s + (r.savedCo2Kg ?? 0), 0);
  const categories = new Set(entries.map((r) => r.category));

  // Calculate streak
  const sortedDates = entries
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
    } else break;
  }

  const updatedAchievements = achievements.map((a) => {
    let progress = a.progress ?? 0;
    let isUnlocked = a.isUnlocked;

    if (a.title === "First Step") progress = Math.min(totalEntries, 1);
    if (a.title === "Green Streak") progress = Math.min(streak, 3);
    if (a.title === "Carbon Cutter") progress = Math.min(totalSaved, 50);
    if (a.title === "Planet Guardian") progress = Math.min(totalSaved, 200);
    if (a.title === "Carbon Analyst") progress = Math.min(totalEntries, 20);
    if (a.title === "Tree Planter") progress = Math.min(totalSaved / 21.77, 5);
    if (a.title === "Eco Explorer") progress = Math.min(categories.size, 5);

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
