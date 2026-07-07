import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable, customersTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { customerId, date, startDate, endDate } = req.query;
    const conditions = [];

    if (customerId) conditions.push(eq(paymentsTable.customerId, parseInt(String(customerId))));
    if (date) conditions.push(eq(paymentsTable.paymentDate, String(date)));
    if (startDate) conditions.push(gte(paymentsTable.paymentDate, String(startDate)));
    if (endDate) conditions.push(lte(paymentsTable.paymentDate, String(endDate)));

    const rows = await db
      .select({ payment: paymentsTable, customer: customersTable })
      .from(paymentsTable)
      .leftJoin(customersTable, eq(paymentsTable.customerId, customersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${paymentsTable.paymentDate} DESC, ${paymentsTable.createdAt} DESC`);

    res.json(rows.map(r => formatPayment(r.payment, r.customer!)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { customerId, amount, mode, paymentDate, notes } = req.body;
    if (!customerId || !amount) {
      res.status(400).json({ error: "customerId and amount required" });
      return;
    }

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, parseInt(customerId)));
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }

    const today = paymentDate || new Date().toISOString().split("T")[0];

    const [payment] = await db
      .insert(paymentsTable)
      .values({
        customerId: parseInt(customerId),
        amount: String(amount),
        mode: mode || "cash",
        paymentDate: today,
        notes,
      })
      .returning();

    await db
      .update(customersTable)
      .set({
        balance: sql`CAST(${customersTable.balance} AS NUMERIC) - ${parseFloat(amount)}`,
        lastPaymentDate: today,
      })
      .where(eq(customersTable.id, parseInt(customerId)));

    res.status(201).json(formatPayment(payment, customer));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select({ payment: paymentsTable })
      .from(paymentsTable)
      .where(eq(paymentsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    await db
      .update(customersTable)
      .set({ balance: sql`CAST(${customersTable.balance} AS NUMERIC) + ${parseFloat(row.payment.amount)}` })
      .where(eq(customersTable.id, row.payment.customerId));

    await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function formatPayment(
  p: typeof paymentsTable.$inferSelect,
  customer: typeof customersTable.$inferSelect
) {
  return {
    id: p.id,
    customerId: p.customerId,
    customerName: customer.name,
    amount: parseFloat(p.amount),
    mode: p.mode,
    paymentDate: p.paymentDate,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
