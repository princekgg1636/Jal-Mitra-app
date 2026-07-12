import { pgTable, serial, integer, text, numeric, timestamp } from "drizzle-orm/pg-core";

export const partyOrdersTable = pgTable("party_orders", {
  id: serial("id").primaryKey(),
  eventName: text("event_name").notNull(),
  contactName: text("contact_name").notNull(),
  address: text("address"),
  phone: text("phone"),
  jarCount: integer("jar_count").notNull(),
  litresPerJar: integer("litres_per_jar").notNull().default(20),
  ratePerJar: numeric("rate_per_jar", { precision: 10, scale: 2 }).notNull(),
  eventDate: text("event_date").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "delivered", "cancelled"] }).notNull().default("pending"),
  advancePaid: numeric("advance_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PartyOrder = typeof partyOrdersTable.$inferSelect;
