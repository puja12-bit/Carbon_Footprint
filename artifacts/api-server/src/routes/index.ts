import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import carbonRouter from "./carbon.js";
import profileRouter from "./profile.js";
import scoresRouter from "./scores.js";
import achievementsRouter from "./achievements.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carbonRouter);
router.use(profileRouter);
router.use(scoresRouter);
router.use(achievementsRouter);

export default router;
