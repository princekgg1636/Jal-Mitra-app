import { Router } from "express";
import { db } from "@workspace/db";
import { deliveriesTable, paymentsTable, customersTable } from "@workspace/db";
import { eq, sql, gt, and, gte, lte, desc } from "drizzle-orm";

const router = Router();

// Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-31`;

    const [todayDeliveries] = await db
      .select({ count: sql<number>`COUNT(*)`, totalJars: sql<number>`COALESCE(SUM(${deliveriesTable.jarCount}), 0)` })
      .from(deliveriesTable)
      .where(eq(deliveriesTable.deliveryDate, today));

    const [todayCash] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${deliveriesTable.amount} AS NUMERIC)), 0)` })
      .from(deliveriesTable)
      .where(and(eq(deliveriesTable.deliveryDate, today), eq(deliveriesTable.isPaid, true)));

    const [todayUdhar] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${deliveriesTable.amount} AS NUMERIC)), 0)` })
      .from(deliveriesTable)
      .where(and(eq(deliveriesTable.deliveryDate, today), eq(deliveriesTable.isPaid, false)));

    const [monthlyDeliveries] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${deliveriesTable.amount} AS NUMERIC)), 0)` })
      .from(deliveriesTable)
      .where(
        and(
          gte(deliveriesTable.deliveryDate, monthStart),
          lte(deliveriesTable.deliveryDate, monthEnd),
          eq(deliveriesTable.isPaid, true)
        )
      );

    const [monthlyUdhar] = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(${deliveriesTable.amount} AS NUMERIC)), 0)` })
      .from(deliveriesTable)
      .where(
        and(
          gte(deliveriesTable.deliveryDate, monthStart),
          lte(deliveriesTable.deliveryDate, monthEnd),
          eq(deliveriesTable.isPaid, false)
        )
      );

    const [activeCustomers] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customersTable)
      .where(eq(customersTable.active, true));

    const [pendingPayments] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customersTable)
      .where(and(eq(customersTable.active, true), gt(sql`CAST(${customersTable.balance} AS NUMERIC)`, 0)));

    res.json({
      todayDeliveries: Number(todayDeliveries?.count ?? 0),
      todayJars: Number(todayDeliveries?.totalJars ?? 0),
      todayCash: Number(todayCash?.total ?? 0),
      todayUdhar: Number(todayUdhar?.total ?? 0),
      monthlyIncome: Number(monthlyDeliveries?.total ?? 0),
      monthlyUdhar: Number(monthlyUdhar?.total ?? 0),
      activeCustomers: Number(activeCustomers?.count ?? 0),
      pendingPaymentsCount: Number(pendingPayments?.count ?? 0),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Top 10 outstanding customers
router.get("/top-outstanding", async (req, res) => {
  try {
    const customers = await db
      .select()
      .from(customersTable)
      .where(and(eq(customersTable.active, true), gt(sql`CAST(${customersTable.balance} AS NUMERIC)`, 0)))
      .orderBy(desc(sql`CAST(${customersTable.balance} AS NUMERIC)`))
      .limit(10);

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

// Today's deliveries
router.get("/today-deliveries", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const rows = await db
      .select({ delivery: deliveriesTable, customer: customersTable })
      .from(deliveriesTable)
      .leftJoin(customersTable, eq(deliveriesTable.customerId, customersTable.id))
      .where(eq(deliveriesTable.deliveryDate, today))
      .orderBy(desc(deliveriesTable.createdAt));

    res.json(
      rows.map(r => ({
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
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
