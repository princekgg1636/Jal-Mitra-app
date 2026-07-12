import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import customersRouter from "./customers";
import deliveriesRouter from "./deliveries";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import settingsRouter from "./settings";
import grahakRouter from "./grahak";
import jarRequestsRouter from "./jar-requests";
import partyOrdersRouter from "./party-orders";

const router: IRouter = Router();

// Block unapproved users from all non-auth routes
async function requireApproved(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) { res.status(401).json({ error: "Login zaroori hai" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(401).json({ error: "User nahi mila" }); return; }
  if (!user.approved) { res.status(403).json({ error: "Account approved nahi hai" }); return; }
  next();
}

router.use(healthRouter);
router.use("/auth", authRouter);

// All routes below require an approved, logged-in user
router.use("/admin", requireApproved, adminRouter);
router.use("/grahak", requireApproved, grahakRouter);
router.use("/jar-requests", requireApproved, jarRequestsRouter);
router.use("/party-orders", requireApproved, partyOrdersRouter);
router.use("/customers", requireApproved, customersRouter);
router.use("/deliveries", requireApproved, deliveriesRouter);
router.use("/payments", requireApproved, paymentsRouter);
router.use("/dashboard", requireApproved, dashboardRouter);
router.use("/reports", requireApproved, reportsRouter);
router.use("/settings", requireApproved, settingsRouter);

export default router;
