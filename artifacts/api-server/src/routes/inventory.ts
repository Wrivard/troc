import { Router, type Request, type Response } from "express";
import { requestRateLimit } from "../modules/security/rate-limit";
import type { Principal } from "../modules/auth/permissions";
import type { Sql } from "../modules/commerce/data";
import type { TransactionStore } from "../modules/commerce/checkout";
import { InventoryService } from "../modules/inventory/service";

export function inventoryRouter(
  db: Sql,
  store: TransactionStore,
  principal: (req: Request, res: Response) => Promise<Principal>,
  limit = 60,
) {
  const router = Router(),
    service = new InventoryService(db, store);
  router.use(
    "/inventory",
    requestRateLimit({namespace:"inventory",windowMs:60000,limit}),
  );
  router.get("/inventory/sellers", async (req, res) =>
    res.json(await service.sellers(await principal(req, res))),
  );
  router.get("/inventory/:seller/export", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await service.export(await principal(req, res), req.params.seller, req.query));
  });
  router.get("/inventory/:seller/sources", async (req, res) => {
    await service.access(db, await principal(req, res), req.params.seller);
    res.json(await service.sources());
  });
  router.get("/inventory/:seller/catalog", async (req, res) =>
    res.json(
      await service.catalog(
        await principal(req, res),
        req.params.seller,
        String(req.query.q ?? ""),
      ),
    ),
  );
  router.get("/inventory/:seller/summary", async (req, res) =>
    res.json(
      await service.summary(await principal(req, res), req.params.seller),
    ),
  );
  router.get("/inventory/:seller/listings", async (req, res) =>
    res.json(
      await service.list(
        await principal(req, res),
        req.params.seller,
        req.query,
      ),
    ),
  );
  router.get("/inventory/:seller/mappings", async (req, res) =>
    res.json(
      await service.mappings(await principal(req, res), req.params.seller),
    ),
  );
  router.post("/inventory/:seller/listings", async (req, res) =>
    res
      .status(201)
      .json(
        await service.create(
          await principal(req, res),
          req.params.seller,
          req.body ?? {},
        ),
      ),
  );
  router.post("/inventory/:seller/bulk", async (req, res) =>
    res.json(
      await service.bulk(
        await principal(req, res),
        req.params.seller,
        req.body?.changes,
      ),
    ),
  );
  router.post("/inventory/:seller/imports", async (req, res) =>
    res
      .status(201)
      .json(
        await service.preview(
          await principal(req, res),
          req.params.seller,
          req.body ?? {},
        ),
      ),
  );
  router.get("/inventory/:seller/imports/:id", async (req, res) =>
    res.json(
      await service.review(
        await principal(req, res),
        req.params.seller,
        req.params.id,
        Number(req.query.page ?? 0),
      ),
    ),
  );
  router.post("/inventory/:seller/imports/:id/publish", async (req, res) =>
    res.json(
      await service.publish(
        await principal(req, res),
        req.params.seller,
        req.params.id,
      ),
    ),
  );
  return router;
}
