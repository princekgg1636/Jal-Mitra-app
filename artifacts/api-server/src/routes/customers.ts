import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, deliveriesTable, paymentsTable } from "@workspace/db";
import { eq, desc, like, and, or, sql, gt } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { search, type, active, hasBalance } = req.query;
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(customersTable.name, `%${search}%`),
          like(customersTable.mobile, `%${search}%`),
          like(customersTable.address, `%${search}%`)
        )
      );
    }
    if (type && (type === "people" || type === "shop")) {
      conditions.push(eq(customersTable.type, type));
    }
    if (active !== undefined) {
      conditions.push(eq(customersTable.active, active === "true"));
    }
    if (hasBalance === "true") {
      conditions.push(gt(sql`CAST(${customersTable.balance} AS NUMERIC)`, 0));
    }

    const customers = await db
      .select()
      .from(customersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customersTable.createdAt));

    res.json(customers.map(formatCustomer));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, type, address, mobile, whatsapp, jarRate, securityDeposit, notes } = req.body;
    if (!name || !jarRate) {
      res.status(400).json({ error: "Name and jarRate required" });
      return;
    }

    const [customer] = await db
      .insert(customersTable)
      .values({
        name,
        type: type || "people",
        address,
        mobile,
        whatsapp: whatsapp || mobile,
        jarRate: String(jarRate),
        securityDeposit: securityDeposit ? String(securityDeposit) : null,
        notes,
      })
      .returning();

    res.status(201).json(formatCustomer(customer));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
    if (!customer) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatCustomer(customer));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, type, address, mobile, whatsapp, jarRate, securityDeposit, active, notes } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (address !== undefined) updates.address = address;
    if (mobile !== undefined) updates.mobile = mobile;
    if (whatsapp !== undefined) updates.whatsapp = whatsapp;
    if (jarRate !== undefined) updates.jarRate = String(jarRate);
    if (securityDeposit !== undefined) updates.securityDeposit = securityDeposit !== null ? String(securityDeposit) : null;
    if (active !== undefined) updates.active = active;
    if (notes !== undefined) updates.notes = notes;

    const [customer] = await db.update(customersTable).set(updates).where(eq(customersTable.id, id)).returning();
    if (!customer) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(formatCustomer(customer));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/summary/:year/:month", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
    if (!customer) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const deliveries = await db
      .select()
      .from(deliveriesTable)
      .where(
        and(
          eq(deliveriesTable.customerId, id),
          sql`${deliveriesTable.deliveryDate} >= ${startDate}`,
          sql`${deliveriesTable.deliveryDate} <= ${endDate}`
        )
      )
      .orderBy(deliveriesTable.deliveryDate);

    const payments = await db
      .select()
      .from(paymentsTable)
      .where(
        and(
          eq(paymentsTable.customerId, id),
          sql`${paymentsTable.paymentDate} >= ${startDate}`,
          sql`${paymentsTable.paymentDate} <= ${endDate}`
        )
      )
      .orderBy(paymentsTable.paymentDate);

    const totalJars = deliveries.reduce((s, d) => s + d.jarCount, 0);
    const totalAmount = deliveries.reduce((s, d) => s + parseFloat(d.amount), 0);
    const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);

    res.json({
      customerId: customer.id,
      customerName: customer.name,
      month,
      year,
      totalJars,
      totalAmount,
      totalPaid,
      balance: totalAmount - totalPaid,
      deliveries: deliveries.map(d => formatDelivery(d, customer)),
      payments: payments.map(p => formatPayment(p, customer)),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

function formatCustomer(c: typeof customersTable.$inferSelect) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    address: c.address,
    mobile: c.mobile,
    whatsapp: c.whatsapp,
    jarRate: parseFloat(c.jarRate),
    securityDeposit: c.securityDeposit ? parseFloat(c.securityDeposit) : null,
    balance: parseFloat(c.balance),
    emptyJarBalance: c.emptyJarBalance,
    active: c.active,
    notes: c.notes,
    lastDeliveryDate: c.lastDeliveryDate,
    lastPaymentDate: c.lastPaymentDate,
    createdAt: c.createdAt.toISOString(),
  };
}

function formatDelivery(d: typeof deliveriesTable.$inferSelect, customer: typeof customersTable.$inferSelect) {
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

function formatPayment(p: typeof paymentsTable.$inferSelect, customer: typeof customersTable.$inferSelect) {
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
