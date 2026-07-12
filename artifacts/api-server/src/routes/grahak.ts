import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, deliveriesTable, paymentsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.get("/me", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) { res.status(401).json({ error: "Login zaroori hai" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(401).json({ error: "User nahi mila" }); return; }

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.mobile, user.mobile));
    if (!customer) {
      res.json({ linked: false, message: "Aapka account abhi customer list mein add nahi hua hai. Admin se contact karein." });
      return;
    }

    const deliveries = await db.select().from(deliveriesTable)
      .where(eq(deliveriesTable.customerId, customer.id))
      .orderBy(desc(deliveriesTable.deliveryDate))
      .limit(20);

    const payments = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.customerId, customer.id))
      .orderBy(desc(paymentsTable.paymentDate))
      .limit(10);

    res.json({
      linked: true,
      customer: {
        id: customer.id,
        name: customer.name,
        type: customer.type,
        mobile: customer.mobile,
        jarRate: parseFloat(customer.jarRate),
        balance: parseFloat(customer.balance),
        lastDeliveryDate: customer.lastDeliveryDate,
      },
      deliveries: deliveries.map(d => ({
        id: d.id,
        deliveryDate: d.deliveryDate,
        jarCount: d.jarCount,
        amount: parseFloat(d.amount),
        isPaid: d.isPaid,
      })),
      payments: payments.map(p => ({
        id: p.id,
        paymentDate: p.paymentDate,
        amount: parseFloat(p.amount),
        mode: p.mode,
      })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
