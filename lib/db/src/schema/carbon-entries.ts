import { pgTable, text, serial, timestamp, real, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const carbonEntriesTable = pgTable(
  "carbon_entries",
  {
    id: serial("id").primaryKey(),
    action: text("action").notNull(),
    category: text("category").notNull(),
    co2Kg: real("co2_kg").notNull(),
    explanation: text("explanation"),
    alternatives: text("alternatives"),
    chosenAlternative: text("chosen_alternative"),
    savedCo2Kg: real("saved_co2_kg"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("carbon_entries_created_at_idx").on(table.createdAt),
    index("carbon_entries_category_idx").on(table.category),
  ],
);

export const insertCarbonEntrySchema = createInsertSchema(carbonEntriesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCarbonEntry = z.infer<typeof insertCarbonEntrySchema>;
export type CarbonEntry = typeof carbonEntriesTable.$inferSelect;
