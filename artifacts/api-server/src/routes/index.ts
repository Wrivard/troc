import sellerFeesRouter from "./seller-fees";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import foundationRouter from "./foundation";
import catalogRouter from "./catalog";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sellerFeesRouter);
router.use(catalogRouter);
router.use(foundationRouter);

export default router;
