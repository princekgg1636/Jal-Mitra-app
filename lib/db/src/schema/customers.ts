import { pgTable, serial, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["people", "shop"] }).notNull().default("people"),
  address: text("address"),
  mobile: text("mobile"),
  whatsapp: text("whatsapp"),
  jarRate: numeric("jar_rate", { precision: 10, scale: 2 }).notNull().default("0"),
  securityDeposit: numeric("security_deposit", { precision: 10, scale: 2 }),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
  emptyJarBalance: integer("empty_jar_balance").notNull().default(0),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  lastDeliveryDate: text("last_delivery_date"),
  lastPaymentDate: text("last_payment_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({ id: true, createdAt: true, balance: true, emptyJarBalance: true, lastDeliveryDate: true, lastPaymentDate: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
