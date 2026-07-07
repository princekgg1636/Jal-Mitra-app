import { Router } from "express";
import { db } from "@workspace/db";
import { deliveriesTable, customersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { customerId, date, startDate, endDate } = req.query;
    const conditions = [];

    if (customerId) conditions.push(eq(deliveriesTable.customerId, parseInt(String(customerId))));
    if (date) conditions.push(eq(deliveriesTable.deliveryDate, String(date)));
    if (startDate) conditions.push(gte(deliveriesTable.deliveryDate, String(startDate)));
    if (endDate) conditions.push(lte(deliveriesTable.deliveryDate, String(endDate)));

    const rows = await db
      .select({ delivery: deliveriesTable, customer: customersTable })
      .from(deliveriesTable)
      .leftJoin(customersTable, eq(deliveriesTable.customerId, customersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${deliveriesTable.deliveryDate} DESC, ${deliveriesTable.createdAt} DESC`);

    res.json(rows.map(r => formatDelivery(r.delivery, r.customer!)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { customerId, jarCount, isPaid, deliveryDate, notes } = req.body;
    if (!customerId || !jarCount) {
      res.status(400).json({ error: "customerId and jarCount required" });
      return;
    }

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, parseInt(customerId)));
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const amount = parseFloat(customer.jarRate) * parseInt(jarCount);
    const today = deliveryDate || new Date().toISOString().split("T")[0];

    const [delivery] = await db
      .insert(deliveriesTable)
      .values({
        customerId: parseInt(customerId),
        jarCount: parseInt(jarCount),
        amount: String(amount),
        isPaid: isPaid === true || isPaid === "true",
        deliveryDate: today,
        notes,
      })
      .returning();

    const balanceDelta = isPaid === true || isPaid === "true" ? 0 : amount;
    await db
      .update(customersTable)
      .set({
        balance: sql`CAST(${customersTable.balance} AS NUMERIC) + ${balanceDelta}`,
        lastDeliveryDate: today,
      })
      .where(eq(customersTable.id, parseInt(customerId)));

    res.status(201).json(formatDelivery(delivery, customer));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select({ delivery: deliveriesTable, customer: customersTable })
      .from(deliveriesTable)
      .leftJoin(customersTable, eq(deliveriesTable.customerId, customersTable.id))
      .where(eq(deliveriesTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatDelivery(row.delivery, row.customer!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { jarCount, isPaid, deliveryDate, notes } = req.body;

    const [existing] = await db
      .select({ delivery: deliveriesTable, customer: customersTable })
      .from(deliveriesTable)
      .leftJoin(customersTable, eq(deliveriesTable.customerId, customersTable.id))
      .where(eq(deliveriesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (jarCount !== undefined) {
      updates.jarCount = parseInt(jarCount);
      updates.amount = String(parseInt(jarCount) * parseFloat(existing.customer!.jarRate));
    }
    if (isPaid !== undefined) updates.isPaid = isPaid;
    if (deliveryDate !== undefined) updates.deliveryDate = deliveryDate;
    if (notes !== undefined) updates.notes = notes;

    const [delivery] = await db.update(deliveriesTable).set(updates).where(eq(deliveriesTable.id, id)).returning();
    res.json(formatDelivery(delivery, existing.customer!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select({ delivery: deliveriesTable })
      .from(deliveriesTable)
      .where(eq(deliveriesTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    if (!row.delivery.isPaid) {
      await db
        .update(customersTable)
        .set({ balance: sql`CAST(${customersTable.balance} AS NUMERIC) - ${parseFloat(row.delivery.amount)}` })
        .where(eq(customersTable.id, row.delivery.customerId));
    }

    await db.delete(deliveriesTable).where(eq(deliveriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function formatDelivery(
  d: typeof deliveriesTable.$inferSelect,
  customer: typeof customersTable.$inferSelect
) {
  return {
    id: d.id,
    customerId: d.customerId,
    customerName: customer.name,
    customerType: customer.type,
    jarCount: d.jarCount,
    amount: parseFloat(d.amount),
    isPaid: d.isPaid,
    deliveryDate: d.deliveryDate,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
  };
}

export default router;
