import { Router, type IRouter } from "express";
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

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/grahak", grahakRouter);
router.use("/jar-requests", jarRequestsRouter);
router.use("/party-orders", partyOrdersRouter);
router.use("/customers", customersRouter);
router.use("/deliveries", deliveriesRouter);
router.use("/payments", paymentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);
router.use("/settings", settingsRouter);

export default router;
