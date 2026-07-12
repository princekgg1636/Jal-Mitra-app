import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, ne, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

const ALL_PERMISSIONS = [
  "approve_users",
  "manage_customers",
  "manage_deliveries",
  "manage_payments",
  "manage_party_orders",
  "view_reports",
  "manage_settings",
];

async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Login zaroori hai" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Sirf admin access kar sakta hai" }); return;
  }
  next();
}

function safeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id, name: u.name, mobile: u.mobile,
    role: u.role, approved: u.approved,
    permissions: u.permissions ?? null,
    createdAt: u.createdAt,
  };
}

// GET /api/admin/users — all non-admin users
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(usersTable)
      .where(ne(usersTable.role, "admin"))
      .orderBy(desc(usersTable.createdAt));
    res.json(users.map(safeUser));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/admin/permissions — list of all available permission keys
router.get("/permissions", requireAdmin, async (req, res) => {
  res.json(ALL_PERMISSIONS);
});

// POST /api/admin/create-user — admin directly creates a user
router.post("/create-user", requireAdmin, async (req, res) => {
  try {
    const { name, mobile, password, role } = req.body;
    if (!name || !mobile || !password || !role) {
      res.status(400).json({ error: "Naam, mobile, password aur role zaroori hain" }); return;
    }
    if (!["grahak", "delivery_boy", "shop", "co_admin"].includes(role)) {
      res.status(400).json({ error: "Role galat hai" }); return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.mobile, mobile));
    if (existing) {
      res.status(409).json({ error: "Yeh mobile number pehle se registered hai" }); return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    // Admin-created accounts are auto-approved
    const [user] = await db.insert(usersTable)
      .values({ name, mobile, passwordHash, role, approved: true, permissions: null })
      .returning();
    res.status(201).json(safeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/users/:id/approve — approve + optionally set co_admin permissions
router.patch("/users/:id/approve", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { permissions } = req.body; // only relevant for co_admin

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    if (!existing) { res.status(404).json({ error: "User nahi mila" }); return; }

    const perms = existing.role === "co_admin" && Array.isArray(permissions)
      ? permissions.filter((p: string) => ALL_PERMISSIONS.includes(p))
      : existing.permissions;

    const [user] = await db
      .update(usersTable)
      .set({ approved: true, permissions: perms })
      .where(eq(usersTable.id, id))
      .returning();
    res.json(safeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/admin/users/:id/permissions — update co_admin permissions
router.patch("/users/:id/permissions", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      res.status(400).json({ error: "Permissions array chahiye" }); return;
    }
    const validPerms = permissions.filter((p: string) => ALL_PERMISSIONS.includes(p));
    const [user] = await db
      .update(usersTable)
      .set({ permissions: validPerms })
      .where(eq(usersTable.id, id))
      .returning();
    if (!user) { res.status(404).json({ error: "User nahi mila" }); return; }
    res.json(safeUser(user));
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
    res.json(safeUser(user));
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
