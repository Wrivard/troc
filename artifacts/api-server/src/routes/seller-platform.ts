import { Router, type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import type { Principal } from "../modules/auth/permissions";
import type { Sql } from "../modules/commerce/data";
import type { TransactionStore } from "../modules/commerce/checkout";
import { SellerPlatformService } from "../modules/seller-platform/service";
export function sellerPlatformRouter(
  db: Sql,
  store: TransactionStore,
  principal: (req: Request, res: Response) => Promise<Principal>,
) {
  const router = Router(),
    service = new SellerPlatformService(db, store);
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  router.use(
    ["/seller/applications", "/seller/platform", "/admin/seller-applications"],
    rateLimit({
      windowMs: 60000,
      limit: 60,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { code: "rate_limited" },
    }),
  );
  // POST /seller/applications remains in foundation.ts; integration replaces its service only.
  router.get("/seller/applications", async (req, res) =>
    res.json(await service.applications(await principal(req, res))),
  );
  router.get("/admin/seller-applications", async (req, res) =>
    res.json(
      await service.applications(
        await principal(req, res),
        true,
        Number(req.query.page ?? 0),
      ),
    ),
  );
  router.post("/admin/seller-applications/:id/review", async (req, res) =>
    res.json(
      await service.review(
        await principal(req, res),
        req.params.id,
        req.body ?? {},
      ),
    ),
  );
  router.get("/seller/platform/sellers", async (req, res) =>
    res.json(await service.sellers(await principal(req, res))),
  );
  router.get("/seller/platform/:seller/dashboard", async (req, res) =>
    res.json(
      await service.dashboard(await principal(req, res), req.params.seller),
    ),
  );
  router.get("/seller/platform/:seller/team", async (req, res) =>
    res.json(await service.team(await principal(req, res), req.params.seller)),
  );
  router.post("/seller/platform/:seller/team", async (req, res) =>
    res.json(
      await service.member(
        await principal(req, res),
        req.params.seller,
        req.body ?? {},
      ),
    ),
  );
  return router;
}
