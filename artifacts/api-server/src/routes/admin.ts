import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ne, desc } from "drizzle-orm";

const router = Router();

// Middleware — only admin can access these routes
async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Login zaroori hai" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "admin") { res.status(403).json({ error: "Sirf admin access kar sakta hai" }); return; }
  next();
}

// GET /api/admin/users — list all non-admin users
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(ne(usersTable.role, "admin"))
      .orderBy(desc(usersTable.createdAt));

    res.json(users.map(u => ({
      id: u.id, name: u.name, mobile: u.mobile,
      role: u.role, approved: u.approved, createdAt: u.createdAt,
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/users/:id/approve
router.patch("/users/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db
      .update(usersTable)
      .set({ approved: true })
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) { res.status(404).json({ error: "User nahi mila" }); return; }
    res.json({ id: user.id, name: user.name, mobile: user.mobile, role: user.role, approved: user.approved });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/users/:id/reject
router.patch("/users/:id/reject", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [user] = await db
      .update(usersTable)
      .set({ approved: false })
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) { res.status(404).json({ error: "User nahi mila" }); return; }
    res.json({ id: user.id, name: user.name, mobile: user.mobile, role: user.role, approved: user.approved });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
