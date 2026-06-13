import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const carbonEntriesTable = pgTable("carbon_entries", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  category: text("category").notNull(),
  co2Kg: real("co2_kg").notNull(),
  explanation: text("explanation"),
  alternatives: text("alternatives"),
  chosenAlternative: text("chosen_alternative"),
  savedCo2Kg: real("saved_co2_kg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCarbonEntrySchema = createInsertSchema(carbonEntriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCarbonEntry = z.infer<typeof insertCarbonEntrySchema>;
export type CarbonEntry = typeof carbonEntriesTable.$inferSelect;
