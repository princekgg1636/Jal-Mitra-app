import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const router = Router();

function safeUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, mobile: u.mobile, role: u.role, approved: u.approved };
}

router.post("/signup", async (req, res) => {
  try {
    const { name, mobile, password, role } = req.body;
    if (!name || !mobile || !password) {
      res.status(400).json({ error: "Naam, mobile aur password zaroori hain" });
      return;
    }
    if (!["grahak", "delivery_boy", "admin", "shop"].includes(role)) {
      res.status(400).json({ error: "Role galat hai" });
      return;
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.mobile, mobile));
    if (existing) {
      res.status(409).json({ error: "Yeh mobile number pehle se registered hai" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Admin is always auto-approved; others need admin approval
    const approved = role === "admin";

    const [user] = await db
      .insert(usersTable)
      .values({ name, mobile, passwordHash, role, approved })
      .returning();

    (req.session as any).userId = user.id;
    res.status(201).json({ user: safeUser(user) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      res.status(400).json({ error: "Mobile aur password daalo" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.mobile, mobile));
    if (!user) {
      res.status(401).json({ error: "Mobile number registered nahi hai" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Password galat hai" });
      return;
    }

    (req.session as any).userId = user.id;
    res.json({ user: safeUser(user) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const userId = (req.session as any)?.userId;
    if (!userId) { res.status(401).json({ error: "Login nahi hai" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(401).json({ error: "User nahi mila" }); return; }

    res.json(safeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logout ho gaye" });
  });
});

export default router;
