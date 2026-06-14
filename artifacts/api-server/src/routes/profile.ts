import { Router, type IRouter } from "express";
import { db, userProfileTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateProfileBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureProfile() {
  const [existing] = await db.select().from(userProfileTable).limit(1);
  if (existing) {return existing;}

  const [created] = await db
    .insert(userProfileTable)
    .values({
      homeCity: "San Francisco",
      dietPreference: "omnivore",
      hasVehicle: false,
      budgetSensitivity: "medium",
      timeSensitivity: "medium",
    })
    .returning();

  return created;
}

router.get("/profile", async (_req, res): Promise<void> => {
  const profile = await ensureProfile();
  res.json(profile);
});

router.put("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await ensureProfile();

  const [updated] = await db
    .update(userProfileTable)
    .set(parsed.data)
    .where(eq(userProfileTable.id, existing.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(updated);
});

export default router;
