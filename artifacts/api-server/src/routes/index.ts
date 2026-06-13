import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carbonRouter from "./carbon";
import profileRouter from "./profile";
import scoresRouter from "./scores";
import achievementsRouter from "./achievements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carbonRouter);
router.use(profileRouter);
router.use(scoresRouter);
router.use(achievementsRouter);

export default router;
