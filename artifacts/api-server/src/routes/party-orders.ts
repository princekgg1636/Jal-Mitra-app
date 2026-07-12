import { Router } from "express";
import { db } from "@workspace/db";
import { partyOrdersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(partyOrdersTable).orderBy(desc(partyOrdersTable.createdAt));
    res.json(rows.map(fmt));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { eventName, contactName, address, phone, jarCount, litresPerJar, ratePerJar, eventDate, advancePaid, notes } = req.body;
    if (!eventName || !contactName || !jarCount || !ratePerJar || !eventDate) {
      res.status(400).json({ error: "Zaroori fields missing hain" });
      return;
    }
    const [order] = await db.insert(partyOrdersTable).values({
      eventName, contactName, address, phone,
      jarCount: parseInt(jarCount),
      litresPerJar: parseInt(litresPerJar) || 20,
      ratePerJar: String(ratePerJar),
      eventDate,
      advancePaid: String(advancePaid || 0),
      notes,
    }).returning();
    res.status(201).json(fmt(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates: Record<string, unknown> = {};
    const allowed = ["eventName","contactName","address","phone","jarCount","litresPerJar","ratePerJar","eventDate","status","advancePaid","notes"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.ratePerJar) updates.ratePerJar = String(updates.ratePerJar);
    if (updates.advancePaid) updates.advancePaid = String(updates.advancePaid);
    const [order] = await db.update(partyOrdersTable).set(updates).where(eq(partyOrdersTable.id, id)).returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    res.json(fmt(order));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(partyOrdersTable).where(eq(partyOrdersTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function fmt(o: typeof partyOrdersTable.$inferSelect) {
  return {
    ...o,
    ratePerJar: parseFloat(o.ratePerJar),
    advancePaid: parseFloat(o.advancePaid),
    totalAmount: parseInt(String(o.jarCount)) * parseFloat(o.ratePerJar),
  };
}

export default router;
