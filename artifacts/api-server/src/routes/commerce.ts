import { Router, type Request, type Response } from "express";
import { requestRateLimit } from "../modules/security/rate-limit";
import type { Principal } from "../modules/auth/permissions";
import { CartService, cartLines } from "../modules/commerce/service";
import {
  CheckoutService,
  event,
  type TransactionStore,
} from "../modules/commerce/checkout";
import { OrderService } from "../modules/commerce/orders";
import type { Sql } from "../modules/commerce/data";
import { DomainError } from "../modules/shared/domain";
type Identity = (req: Request, res: Response) => Promise<Principal>;
/** Read-only calculations; no identity, persistence or CSRF-sensitive action. */
export function commerceQuoteRouter(db: Sql, demo = false, limit = 120) {
  const router = Router();
  const cart = new CartService(
    { transaction: async (work) => work(db) },
    db,
    demo,
  );
  router.use(
    "/commerce",
    requestRateLimit({namespace:"commerce-quotes",windowMs:60_000,limit,}),
  );
  const coupon = (value: unknown) =>
    typeof value === "string" && value.length <= 40 ? value : "";
  router.post("/commerce/repair", async (req, res) =>
    res.json({ lines: await cart.repair(cartLines(req.body?.lines)) }),
  );
  router.post("/commerce/quote", async (req, res) =>
    res.json(
      await cart.quote(
        cartLines(req.body?.lines),
        coupon(req.body?.coupon),
        typeof req.body?.province === "string" ? req.body.province : undefined,
      ),
    ),
  );
  router.post("/commerce/smart", async (req, res) =>
    res.json(
      await cart.optimize(cartLines(req.body?.lines), coupon(req.body?.coupon)),
    ),
  );
  return router;
}
export function commerceRouter(
  db: Sql,
  store: TransactionStore,
  principal: Identity,
  demo = false,
  limit = 120,
) {
  const router = Router(),
    cart = new CartService(store, db, demo),
    checkout = new CheckoutService(store),
    orders = new OrderService(store);
  router.use(
    "/commerce",
    requestRateLimit({namespace:"commerce-account",windowMs:60_000,limit,}),
  );
  const coupon = (value: unknown) =>
    typeof value === "string" && value.length <= 40 ? value : "";
  router.post("/commerce/events", async (req, res) => {
    const events: unknown = req.body?.events;
    if (!Array.isArray(events) || events.length > 100)
      throw new DomainError("invalid_event");
    await store.transaction(async (tx) => {
      for (const value of events) {
        if (!value || typeof value !== "object")
          throw new DomainError("invalid_event");
        const e = value as { id: unknown; event: unknown; data: unknown };
        if (
          ![
            "add_to_cart",
            "remove_from_cart",
            "cart_view",
            "smart_cart_started",
            "smart_cart_completed",
          ].includes(String(e.event))
        )
          throw new DomainError("invalid_event");
        const clientId = id(e.id);
        if (!e.data || typeof e.data !== "object" || Array.isArray(e.data))
          throw new DomainError("invalid_event");
        const data: Record<string, number | string> = { source: "browser" };
        for (const [name, value] of Object.entries(e.data)) {
          if (
            ![
              "quantity",
              "cards",
              "sellersBefore",
              "sellersAfter",
              "savingsCents",
              "minimumRemainingCents",
            ].includes(name) ||
            typeof value !== "number" ||
            !Number.isFinite(value) ||
            Math.abs(value) > 100000000
          )
            throw new DomainError("invalid_event");
          data[name] = value;
        }
        await tx.query(
          "INSERT INTO troc.commerce_events(event,data,demo,client_event_id) VALUES($1,$2,true,$3) ON CONFLICT(client_event_id) DO NOTHING",
          [e.event, JSON.stringify(data), clientId],
        );
      }
    });
    res.json({ ok: true });
  });
  const id = (value: unknown) => {
    if (
      typeof value !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)
    )
      throw new DomainError("not_found", 404);
    return value;
  };
  router.get("/commerce/cart", async (req, res) =>
    res.json(await cart.read(await principal(req, res))),
  );
  router.put("/commerce/cart", async (req, res) =>
    res.json(
      await cart.save(
        await principal(req, res),
        cartLines(req.body?.lines),
        coupon(req.body?.coupon),
      ),
    ),
  );
  router.post("/commerce/smart/apply", async (req, res) => {
    const p = await principal(req, res);
    await event(db, p.userId, "smart_cart_started", {});
    res.json(
      await cart.applySmart(
        p,
        cartLines(req.body?.lines),
        coupon(req.body?.coupon),
      ),
    );
  });
  router.post("/commerce/checkout", async (req, res) =>
    res.json({
      id: await checkout.checkout(await principal(req, res), {
        address: req.body?.address,
        creditCents: req.body?.creditCents,
        idempotencyKey: req.body?.idempotencyKey,
      }),
    }),
  );
  router.post("/commerce/checkout/:id/cancel", async (req, res) =>
    res.json({
      id: await checkout.finish(
        await principal(req, res),
        id(req.params.id),
        true,
      ),
    }),
  );
  for (const seller of [false, true]) {
    const path = seller ? "/commerce/seller/orders" : "/commerce/orders";
    router.get(path, async (req, res) =>
      res.json(
        await orders.list(
          db,
          await principal(req, res),
          seller,
          req.query.cursor ? id(req.query.cursor) : null,
        ),
      ),
    );
    router.get(path + "/:id/messages",async(req,res)=>res.json(await orders.messagePage(db,await principal(req,res),id(req.params.id),seller,req.query.before?id(req.query.before):undefined)));
    router.post(path + "/:id/messages/read",async(req,res)=>res.json(await orders.markMessagesRead(await principal(req,res),id(req.params.id),seller)));
    router.get(path + "/:id", async (req, res) =>
      res.json(
        await orders.read(
          db,
          await principal(req, res),
          id(req.params.id),
          seller,
        ),
      ),
    );
  }
  router.post("/commerce/seller-orders/:id/actions", async (req, res) => {
    await orders.action(await principal(req, res), id(req.params.id), req.body);
    res.json({ ok: true });
  });
  return router;
}
