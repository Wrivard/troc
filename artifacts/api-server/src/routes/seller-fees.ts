import { Router } from "express";
import { commerceConfig } from "../modules/commerce/config";
import { requestRateLimit } from "../modules/security/rate-limit";
const router = Router();
router.get(
  "/public/seller-fees",
  (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  },
  requestRateLimit({
    namespace: "public-seller-fees",
    windowMs: 60000,
    limit: 120,
  }),
  (_req, res) => {
    // An explicit allowlist of simulation settings; never expose the whole configuration.
    const {
      commissionBps,
      shippingCommissionBps,
      promotedBps,
      processingBps,
      processingFixedCents,
    } = commerceConfig;
    res.json({
      mode: "demo",
      commissionBps,
      shippingCommissionBps,
      promotedBps,
      processingBps,
      processingFixedCents,
    });
  },
);
export default router;
