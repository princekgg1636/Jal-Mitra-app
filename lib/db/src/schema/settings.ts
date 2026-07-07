import { pgTable, serial, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull().default("मेरा जल व्यवसाय"),
  businessAddress: text("business_address"),
  phone: text("phone"),
  upiId: text("upi_id"),
  defaultJarRate: numeric("default_jar_rate", { precision: 10, scale: 2 }).notNull().default("30"),
  whatsappTemplateDeliveryPeople: text("whatsapp_template_delivery_people"),
  whatsappTemplateDeliveryShop: text("whatsapp_template_delivery_shop"),
  whatsappTemplatePayment: text("whatsapp_template_payment"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
