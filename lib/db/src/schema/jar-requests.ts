import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const jarRequestsTable = pgTable("jar_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  jarCount: integer("jar_count").notNull().default(1),
  requestDate: text("request_date").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "delivered", "cancelled"] }).notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type JarRequest = typeof jarRequestsTable.$inferSelect;
