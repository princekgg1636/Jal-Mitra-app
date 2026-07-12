import { Router } from "express";
import { db } from "@workspace/db";
import { jarRequestsTable, customersTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(jarRequestsTable).orderBy(desc(jarRequestsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) { res.status(401).json({ error: "Login zaroori hai" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user || user.role !== "grahak") { res.status(403).json({ error: "Sirf grahak request kar sakta hai" }); return; }

    const [customer] = await db.select().from(customersTable).where(eq(customersTable.mobile, user.mobile));
    if (!customer) { res.status(404).json({ error: "Aapka account customer list mein nahi hai. Admin se contact karein." }); return; }

    const { jarCount, notes } = req.body;
    if (!jarCount || jarCount < 1) { res.status(400).json({ error: "Jar count sahi daalo" }); return; }

    const today = new Date().toISOString().split("T")[0];
    const [request] = await db.insert(jarRequestsTable).values({
      customerId: customer.id,
      customerName: customer.name,
      jarCount: parseInt(jarCount),
      requestDate: today,
      notes,
    }).returning();

    res.status(201).json(request);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const [updated] = await db.update(jarRequestsTable).set({ status }).where(eq(jarRequestsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
