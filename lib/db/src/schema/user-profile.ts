import { pgTable, text, serial, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod/v4";

export const userProfileTable = pgTable("user_profile", {
  id: serial("id").primaryKey(),
  homeCity: text("home_city").notNull().default("San Francisco"),
  dietPreference: text("diet_preference").notNull().default("omnivore"),
  hasVehicle: boolean("has_vehicle").notNull().default(false),
  budgetSensitivity: text("budget_sensitivity").notNull().default("medium"),
  timeSensitivity: text("time_sensitivity").notNull().default("medium"),
  typicalCommute: text("typical_commute"),
  monthlyBudget: real("monthly_budget"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfileTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfileTable.$inferSelect;
