import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

// Get settings (auto-create if not exists)
router.get("/", async (req, res) => {
  try {
    let [settings] = await db.select().from(settingsTable).limit(1);

    if (!settings) {
      [settings] = await db
        .insert(settingsTable)
        .values({
          businessName: "मेरा जल व्यवसाय",
          defaultJarRate: "30",
          whatsappTemplateDeliveryPeople:
            "नमस्ते {naam} जी, आज आपके यहाँ {jars} जार पानी पहुँचाया गया है।\n\nकुल बकाया: ₹{balance}\n\nधन्यवाद।",
          whatsappTemplateDeliveryShop:
            "नमस्ते, आज आपकी दुकान पर {jars} जार पानी डिलीवर किया गया है।\n\nकुल बकाया: ₹{balance}\n\nधन्यवाद।",
          whatsappTemplatePayment:
            "नमस्ते {naam} जी, ₹{amount} का भुगतान प्राप्त हुआ।\n\nशेष बकाया: ₹{balance}\n\nधन्यवाद।",
        })
        .returning();
    }

    res.json(formatSettings(settings));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update settings
router.patch("/", async (req, res) => {
  try {
    const {
      businessName, businessAddress, phone, upiId,
      defaultJarRate, whatsappTemplateDeliveryPeople,
      whatsappTemplateDeliveryShop, whatsappTemplatePayment,
    } = req.body;

    const updates: Record<string, unknown> = {};
    if (businessName !== undefined) updates.businessName = businessName;
    if (businessAddress !== undefined) updates.businessAddress = businessAddress;
    if (phone !== undefined) updates.phone = phone;
    if (upiId !== undefined) updates.upiId = upiId;
    if (defaultJarRate !== undefined) updates.defaultJarRate = String(defaultJarRate);
    if (whatsappTemplateDeliveryPeople !== undefined) updates.whatsappTemplateDeliveryPeople = whatsappTemplateDeliveryPeople;
    if (whatsappTemplateDeliveryShop !== undefined) updates.whatsappTemplateDeliveryShop = whatsappTemplateDeliveryShop;
    if (whatsappTemplatePayment !== undefined) updates.whatsappTemplatePayment = whatsappTemplatePayment;

    let [settings] = await db.select().from(settingsTable).limit(1);

    let updated;
    if (settings) {
      [updated] = await db.update(settingsTable).set(updates).where(eq(settingsTable.id, settings.id)).returning();
    } else {
      [updated] = await db
        .insert(settingsTable)
        .values({ businessName: String(businessName || "मेरा जल व्यवसाय"), ...updates })
        .returning();
    }

    res.json(formatSettings(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function formatSettings(s: typeof settingsTable.$inferSelect) {
  return {
    id: s.id,
    businessName: s.businessName,
    businessAddress: s.businessAddress,
    phone: s.phone,
    upiId: s.upiId,
    defaultJarRate: parseFloat(s.defaultJarRate),
    whatsappTemplateDeliveryPeople: s.whatsappTemplateDeliveryPeople,
    whatsappTemplateDeliveryShop: s.whatsappTemplateDeliveryShop,
    whatsappTemplatePayment: s.whatsappTemplatePayment,
  };
}

export default router;
