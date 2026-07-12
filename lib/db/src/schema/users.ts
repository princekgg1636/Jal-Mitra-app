import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", {
    enum: ["grahak", "delivery_boy", "admin", "shop", "co_admin"],
  }).notNull().default("grahak"),
  approved: boolean("approved").notNull().default(false),
  // co_admin permissions — array of permission keys, null for non-co_admin
  permissions: jsonb("permissions").$type<string[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
