import { Router, type IRouter } from "express";
import healthRouter from "./health";
import customersRouter from "./customers";
import deliveriesRouter from "./deliveries";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import settingsRouter from "./settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/customers", customersRouter);
router.use("/deliveries", deliveriesRouter);
router.use("/payments", paymentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/reports", reportsRouter);
router.use("/settings", settingsRouter);

export default router;
