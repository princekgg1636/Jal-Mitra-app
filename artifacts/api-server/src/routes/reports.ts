import { Router } from "express";
import { db } from "@workspace/db";
import { deliveriesTable, paymentsTable, customersTable } from "@workspace/db";
import { eq, and, gte, lte, sql, gt, desc } from "drizzle-orm";

const router = Router();

// Daily report
router.get("/daily", async (req, res) => {
  try {
    const date = String(req.query.date || new Date().toISOString().split("T")[0]);

    const deliveryRows = await db
      .select({ delivery: deliveriesTable, customer: customersTable })
      .from(deliveriesTable)
      .leftJoin(customersTable, eq(deliveriesTable.customerId, customersTable.id))
      .where(eq(deliveriesTable.deliveryDate, date))
      .orderBy(deliveriesTable.createdAt);

    const paymentRows = await db
      .select({ payment: paymentsTable, customer: customersTable })
      .from(paymentsTable)
      .leftJoin(customersTable, eq(paymentsTable.customerId, customersTable.id))
      .where(eq(paymentsTable.paymentDate, date))
      .orderBy(paymentsTable.createdAt);

    const deliveries = deliveryRows.map(r => ({
      id: r.delivery.id,
      customerId: r.delivery.customerId,
      customerName: r.customer?.name ?? "",
      customerType: r.customer?.type ?? "people",
      jarCount: r.delivery.jarCount,
      amount: parseFloat(r.delivery.amount),
      isPaid: r.delivery.isPaid,
      deliveryDate: r.delivery.deliveryDate,
      notes: r.delivery.notes,
      createdAt: r.delivery.createdAt.toISOString(),
    }));

    const payments = paymentRows.map(r => ({
      id: r.payment.id,
      customerId: r.payment.customerId,
      customerName: r.customer?.name ?? "",
      amount: parseFloat(r.payment.amount),
      mode: r.payment.mode,
      paymentDate: r.payment.paymentDate,
      notes: r.payment.notes,
      createdAt: r.payment.createdAt.toISOString(),
    }));

    res.json({
      date,
      totalDeliveries: deliveries.length,
      totalJars: deliveries.reduce((s, d) => s + d.jarCount, 0),
      totalCash: deliveries.filter(d => d.isPaid).reduce((s, d) => s + d.amount, 0),
      totalUdhar: deliveries.filter(d => !d.isPaid).reduce((s, d) => s + d.amount, 0),
      deliveries,
      payments,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Monthly report
router.get("/monthly", async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(String(req.query.month || now.getMonth() + 1));
    const year = parseInt(String(req.query.year || now.getFullYear()));
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const customers = await db.select().from(customersTable).where(eq(customersTable.active, true));

    const deliveryRows = await db
      .select({ delivery: deliveriesTable, customer: customersTable })
      .from(deliveriesTable)
      .leftJoin(customersTable, eq(deliveriesTable.customerId, customersTable.id))
      .where(
        and(
          gte(deliveriesTable.deliveryDate, startDate),
          lte(deliveriesTable.deliveryDate, endDate)
        )
      );

    const paymentRows = await db
      .select({ payment: paymentsTable, customer: customersTable })
      .from(paymentsTable)
      .leftJoin(customersTable, eq(paymentsTable.customerId, customersTable.id))
      .where(
        and(
          gte(paymentsTable.paymentDate, startDate),
          lte(paymentsTable.paymentDate, endDate)
        )
      );

    const customerMap = new Map<number, {
      customerId: number;
      customerName: string;
      month: number;
      year: number;
      totalJars: number;
      totalAmount: number;
      totalPaid: number;
      balance: number;
      deliveries: unknown[];
      payments: unknown[];
    }>();

    for (const c of customers) {
      customerMap.set(c.id, {
        customerId: c.id,
        customerName: c.name,
        month,
        year,
        totalJars: 0,
        totalAmount: 0,
        totalPaid: 0,
        balance: 0,
        deliveries: [],
        payments: [],
      });
    }

    for (const r of deliveryRows) {
      const cid = r.delivery.customerId;
      if (!customerMap.has(cid)) {
        customerMap.set(cid, {
          customerId: cid,
          customerName: r.customer?.name ?? "",
          month,
          year,
          totalJars: 0,
          totalAmount: 0,
          totalPaid: 0,
          balance: 0,
          deliveries: [],
          payments: [],
        });
      }
      const entry = customerMap.get(cid)!;
      entry.totalJars += r.delivery.jarCount;
      entry.totalAmount += parseFloat(r.delivery.amount);
      entry.deliveries.push({
        id: r.delivery.id,
        customerId: r.delivery.customerId,
        customerName: r.customer?.name ?? "",
        customerType: r.customer?.type ?? "people",
        jarCount: r.delivery.jarCount,
        amount: parseFloat(r.delivery.amount),
        isPaid: r.delivery.isPaid,
        deliveryDate: r.delivery.deliveryDate,
        notes: r.delivery.notes,
        createdAt: r.delivery.createdAt.toISOString(),
      });
    }

    for (const r of paymentRows) {
      const cid = r.payment.customerId;
      if (!customerMap.has(cid)) continue;
      const entry = customerMap.get(cid)!;
      entry.totalPaid += parseFloat(r.payment.amount);
      entry.payments.push({
        id: r.payment.id,
        customerId: r.payment.customerId,
        customerName: r.customer?.name ?? "",
        amount: parseFloat(r.payment.amount),
        mode: r.payment.mode,
        paymentDate: r.payment.paymentDate,
        notes: r.payment.notes,
        createdAt: r.payment.createdAt.toISOString(),
      });
    }

    const customerSummaries = Array.from(customerMap.values()).filter(s => s.totalJars > 0 || s.totalPaid > 0);
    customerSummaries.forEach(s => { s.balance = s.totalAmount - s.totalPaid; });

    const totalJars = customerSummaries.reduce((s, c) => s + c.totalJars, 0);
    const totalAmount = customerSummaries.reduce((s, c) => s + c.totalAmount, 0);
    const totalCollected = customerSummaries.reduce((s, c) => s + c.totalPaid, 0);
    const totalOutstanding = customerSummaries.reduce((s, c) => s + c.balance, 0);

    res.json({
      month,
      year,
      totalJars,
      totalAmount,
      totalCollected,
      totalOutstanding,
      totalCustomers: customerSummaries.length,
      customerSummaries,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Outstanding report
router.get("/outstanding", async (req, res) => {
  try {
    const customers = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.active, true), gt(sql`CAST(${customersTable.balance} AS NUMERIC)`, 0)))
      .orderBy(desc(sql`CAST(${customersTable.balance} AS NUMERIC)`));

    res.json(
      customers.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        balance: parseFloat(c.balance),
        mobile: c.mobile,
        whatsapp: c.whatsapp,
        lastDeliveryDate: c.lastDeliveryDate,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
