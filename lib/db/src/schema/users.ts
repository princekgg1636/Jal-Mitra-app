import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["grahak", "delivery_boy", "admin", "shop"] }).notNull().default("grahak"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
