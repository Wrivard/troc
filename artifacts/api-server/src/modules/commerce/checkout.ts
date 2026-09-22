import { createHash, randomUUID } from "node:crypto";
import type { Address, CartLine, CartQuote } from "@workspace/commerce";
import type { Principal } from "../auth/permissions";
import type { PaymentProvider } from "../providers/contracts";
import { DomainError, money } from "../shared/domain";
import { fees, integer, quoteCart, reward } from "./calculations";
import { commerceConfig } from "./config";
import { loadCommerce, type Sql } from "./data";
import { SimulatedPaymentProvider } from "./payment";
export interface TransactionStore {
  transaction<T>(work: (db: Sql) => Promise<T>): Promise<T>;
}
export interface CheckoutInput {
  address: Address;
  creditCents: number;
  idempotencyKey: string;
}
export function validateAddress(value: unknown): Address {
  if (!value || typeof value !== "object")
    throw new DomainError("invalid_address");
  const v = value as Record<string, unknown>;
  for (const key of ["recipient", "line1", "city", "province", "postalCode"])
    if (
      typeof v[key] !== "string" ||
      !(v[key] as string).trim() ||
      (v[key] as string).length > 150
    )
      throw new DomainError("invalid_address");
  if (
    v.country !== "CA" ||
    !Object.hasOwn(commerceConfig.taxBps, String(v.province)) ||
    !/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(
      String(v.postalCode),
    )
  )
    throw new DomainError("invalid_address");
  return {
    recipient: String(v.recipient).trim(),
    line1: String(v.line1).trim(),
    line2: typeof v.line2 === "string" ? v.line2.trim().slice(0, 150) : "",
    city: String(v.city).trim(),
    province: String(v.province),
    postalCode: String(v.postalCode).toUpperCase().replace(/\s/g, ""),
    country: "CA",
  };
}
export function requestKey(value: unknown): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{16,100}$/.test(value))
    throw new DomainError("invalid_idempotency_key");
  return value;
}
export async function lockBuyer(
  db: Sql,
  buyerId: string,
  requireActive = true,
) {
  const { rows } = await db.query(
    "SELECT id FROM troc.users WHERE id=$1 AND (NOT $2::boolean OR status='active') FOR UPDATE",
    [buyerId, requireActive],
  );
  if (!rows.length) throw new DomainError("unauthorized", 401);
}
export async function balance(db: Sql, buyerId: string): Promise<number> {
  return Number(
    (
      await db.query<{ cents: string }>(
        "SELECT COALESCE(sum(cents),0)::text AS cents FROM troc.credit_ledger WHERE user_id=$1",
        [buyerId],
      )
    ).rows[0].cents,
  );
}
/** Call under the buyer lock. Reconciles abandoned sessions without a browser callback. */
export async function expireCheckouts(db: Sql, buyerId: string) {
  const expired = (
    await db.query<{ id: string; credit_cents: number }>(
      "SELECT id,credit_cents FROM troc.marketplace_orders WHERE buyer_id=$1 AND status='pending' AND created_at<now()-interval '15 minutes' ORDER BY id FOR UPDATE",
      [buyerId],
    )
  ).rows;
  for (const order of expired) {
    await db.query(
      "UPDATE troc.inventory_reservations SET state='released' WHERE marketplace_order_id=$1 AND state='reserved'",
      [order.id],
    );
    await db.query(
      "UPDATE troc.marketplace_orders SET status='cancelled',updated_at=now() WHERE id=$1",
      [order.id],
    );
    await db.query(
      "UPDATE troc.seller_orders SET status='cancelled',updated_at=now() WHERE marketplace_order_id=$1",
      [order.id],
    );
    await db.query(
      "INSERT INTO troc.order_events(marketplace_order_id,actor_id,action,idempotency_key) VALUES($1,$2,'reservation_expired',$3) ON CONFLICT(idempotency_key) DO NOTHING",
      [order.id, buyerId, order.id + ":expired"],
    );
    if (order.credit_cents)
      await db.query(
        "INSERT INTO troc.credit_ledger(user_id,marketplace_order_id,kind,cents,idempotency_key) VALUES($1,$2,'release',$3,$4) ON CONFLICT(idempotency_key) DO NOTHING",
        [buyerId, order.id, order.credit_cents, order.id + ":release"],
      );
  }
}
export async function event(
  db: Sql,
  buyerId: string,
  name: string,
  data: object,
  demo = true,
) {
  await db.query(
    "INSERT INTO troc.commerce_events(buyer_id,event,data,demo) VALUES($1,$2,$3,$4)",
    [buyerId, name, JSON.stringify(data), demo],
  );
}
type Pending = {
  id: string;
  buyer_id: string;
  status: string;
  quote: CartQuote;
  request_fingerprint: string;
  credit_cents: number;
  reward_cents: number;
  payment_id: string | null;
};
export class CheckoutService {
  constructor(
    private readonly store: TransactionStore,
    private readonly payment: PaymentProvider = new SimulatedPaymentProvider(),
  ) {}
  async prepare(principal: Principal, input: CheckoutInput): Promise<string> {
    const address = validateAddress(input.address);
    integer(input.creditCents);
    requestKey(input.idempotencyKey);
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ address, credit: input.creditCents }))
      .digest("hex");
    const key = principal.userId + ":" + input.idempotencyKey;
    return this.store.transaction(async (db) => {
      await lockBuyer(db, principal.userId);
      await expireCheckouts(db, principal.userId);
      const previous = (
        await db.query<Pending>(
          "SELECT * FROM troc.marketplace_orders WHERE idempotency_key=$1",
          [key],
        )
      ).rows[0];
      if (previous) {
        if (previous.request_fingerprint !== fingerprint)
          throw new DomainError("idempotency_conflict", 409);
        return previous.id;
      }
      const cart = (
        await db.query<{ lines: CartLine[]; coupon: string; smart: boolean }>(
          "SELECT lines,coupon,smart FROM troc.carts WHERE buyer_id=$1 FOR UPDATE",
          [principal.userId],
        )
      ).rows[0];
      if (!cart?.lines.length) throw new DomainError("empty_cart");
      const ids = cart.lines.map((l) => l.listingId).sort();
      // Stable lock ordering + active reservation sum prevents two buyers reserving the same stock.
      await db.query(
        "SELECT id FROM troc.listings WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",
        [ids],
      );
      const { listings, sellers } = await loadCommerce(db, ids);
      if (input.creditCents > (await balance(db, principal.userId)))
        throw new DomainError("insufficient_credit", 409);
      const quote = quoteCart(cart.lines, listings, sellers, {
        coupon: cart.coupon,
        province: address.province,
        creditCents: input.creditCents,
      });
      if (!quote.eligible) throw new DomainError("seller_minimum_not_met", 409);
      const prior = Number(
        (
          await db.query<{ count: string }>(
            "SELECT count(*)::text FROM troc.marketplace_orders WHERE buyer_id=$1 AND status='completed'",
            [principal.userId],
          )
        ).rows[0].count,
      );
      const rewardCents = reward(quote, cart.smart, prior),
        fee = fees(quote),
        id = randomUUID();
      // All commerce is explicitly simulated, including authenticated non-demo buyer accounts.
      await db.query(
        "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,processing_fixed_cents,idempotency_key,quote,address,request_fingerprint,credit_cents,reward_cents,demo_batch_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,(SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation'))",
        [
          id,
          principal.userId,
          quote.totalCents,
          quote.totalCents ? commerceConfig.processingFixedCents : 0,
          key,
          JSON.stringify(quote),
          JSON.stringify(address),
          fingerprint,
          quote.creditCents,
          rewardCents,
        ],
      );
      for (const group of quote.groups) {
        const sellerOrderId = randomUUID();
        await db.query(
          "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,discount_cents,quote) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [
            sellerOrderId,
            id,
            group.seller.id,
            group.merchandiseCents,
            group.shipping.cents,
            group.discountCents,
            JSON.stringify(group),
          ],
        );
        for (const line of group.lines) {
          await db.query(
            "INSERT INTO troc.order_items(seller_order_id,seller_id,listing_id,variant_id,quantity,unit_price_cents,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [
              sellerOrderId,
              group.seller.id,
              line.listingId,
              line.listing.variantId,
              line.quantity,
              line.unitCents,
              JSON.stringify(line),
            ],
          );
          await db.query(
            "INSERT INTO troc.inventory_reservations(listing_id,buyer_id,quantity,expires_at,idempotency_key,marketplace_order_id) VALUES($1,$2,$3,now()+interval '15 minutes',$4,$5)",
            [
              line.listingId,
              principal.userId,
              line.quantity,
              id + ":" + line.listingId,
              id,
            ],
          );
        }
        const allocation = fee.allocations.find(
          (f) => f.sellerId === group.seller.id,
        )!;
        for (const [kind, cents] of [
          ["commission", allocation.commissionCents],
          ["shipping_commission", allocation.shippingCommissionCents],
          ["promotion", allocation.promotedCents],
          ["processing", allocation.processingCents],
        ])
          await db.query(
            "INSERT INTO troc.fee_ledger(marketplace_order_id,seller_order_id,kind,cents) VALUES($1,$2,$3,$4)",
            [id, sellerOrderId, kind, cents],
          );
      }
      if (quote.creditCents)
        await db.query(
          "INSERT INTO troc.credit_ledger(user_id,marketplace_order_id,kind,cents,idempotency_key) VALUES($1,$2,'consumption',$3,$4)",
          [principal.userId, id, -quote.creditCents, id + ":consume"],
        );
      await event(
        db,
        principal.userId,
        "checkout_started",
        { orderId: id, cards: quote.cards, sellers: quote.groups.length },
        quote.demo,
      );
      return id;
    });
  }
  async finish(
    principal: Principal,
    id: string,
    cancel = false,
  ): Promise<string> {
    return this.store.transaction(async (db) => {
      await lockBuyer(db, principal.userId);
      const order = (
        await db.query<Pending>(
          "SELECT * FROM troc.marketplace_orders WHERE id=$1 AND buyer_id=$2 FOR UPDATE",
          [id, principal.userId],
        )
      ).rows[0];
      if (!order) throw new DomainError("not_found", 404);
      if (order.status !== "pending") return id;
      const reservations = (
        await db.query<{
          id: string;
          listing_id: string;
          quantity: number;
          valid: boolean;
        }>(
          "SELECT id,listing_id,quantity,(expires_at>now()) AS valid FROM troc.inventory_reservations WHERE marketplace_order_id=$1 AND state='reserved' ORDER BY listing_id FOR UPDATE",
          [id],
        )
      ).rows;
      await db.query(
        "SELECT id FROM troc.listings WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE",
        [reservations.map((r) => r.listing_id)],
      );
      const paid =
        cancel || !reservations.length || reservations.some((r) => !r.valid)
          ? null
          : await this.payment
              .pay({
                marketplaceOrderId: id,
                total: money(order.quote.totalCents),
                idempotencyKey: id,
              })
              .catch(() => null); // Simulation failure releases the persisted reservation and credit below.
      if (!paid || paid.status === "declined") {
        await db.query(
          "UPDATE troc.inventory_reservations SET state='released' WHERE marketplace_order_id=$1 AND state='reserved'",
          [id],
        );
        await db.query(
          "UPDATE troc.marketplace_orders SET status='cancelled',updated_at=now() WHERE id=$1",
          [id],
        );
        await db.query(
          "UPDATE troc.seller_orders SET status='cancelled',updated_at=now() WHERE marketplace_order_id=$1",
          [id],
        );
        await db.query(
          "INSERT INTO troc.order_events(marketplace_order_id,actor_id,action,idempotency_key) VALUES($1,$2,$3,$4)",
          [
            id,
            principal.userId,
            cancel ? "checkout_cancelled" : "simulated_payment_failed",
            id + ":cancelled",
          ],
        );
        if (order.credit_cents)
          await db.query(
            "INSERT INTO troc.credit_ledger(user_id,marketplace_order_id,kind,cents,idempotency_key) VALUES($1,$2,'release',$3,$4)",
            [principal.userId, id, order.credit_cents, id + ":release"],
          );
        return id;
      }
      for (const r of reservations) {
        const updated = await db.query(
          "UPDATE troc.listings SET quantity=quantity-$2,status=CASE WHEN quantity=$2 THEN 'sold_out' ELSE status END,updated_at=now() WHERE id=$1 AND quantity>=$2 RETURNING id",
          [r.listing_id, r.quantity],
        );
        if (!updated.rows.length)
          throw new DomainError("inventory_unavailable", 409);
        await db.query(
          "INSERT INTO troc.inventory_events(listing_id,quantity_delta,reason,actor_id,idempotency_key) VALUES($1,$2,'simulated_checkout',$3,$4)",
          [
            r.listing_id,
            -r.quantity,
            principal.userId,
            id + ":" + r.listing_id,
          ],
        );
      }
      await db.query(
        "UPDATE troc.inventory_reservations SET state='committed' WHERE marketplace_order_id=$1 AND state='reserved'",
        [id],
      );
      await db.query(
        "UPDATE troc.marketplace_orders SET status='awaiting_shipment',payment_id=$2,updated_at=now() WHERE id=$1",
        [id, paid.paymentId],
      );
      await db.query(
        "INSERT INTO troc.order_events(marketplace_order_id,actor_id,action,details,idempotency_key) VALUES($1,$2,'simulated_paid',$3,$4)",
        [
          id,
          principal.userId,
          JSON.stringify({
            next: "awaiting_shipment",
            paymentId: paid.paymentId,
          }),
          id + ":paid",
        ],
      );
      // Only remove purchased quantities; preserve items added after preparation.
      const cart = (
        await db.query<{ lines: CartLine[] }>(
          "SELECT lines FROM troc.carts WHERE buyer_id=$1 FOR UPDATE",
          [principal.userId],
        )
      ).rows[0];
      const bought = new Map(
        reservations.map((r) => [r.listing_id, r.quantity]),
      );
      if (cart)
        await db.query(
          "UPDATE troc.carts SET lines=$2,smart=false,updated_at=now() WHERE buyer_id=$1",
          [
            principal.userId,
            JSON.stringify(
              cart.lines
                .map((l) => ({
                  ...l,
                  quantity: Math.max(
                    0,
                    l.quantity - (bought.get(l.listingId) ?? 0),
                  ),
                }))
                .filter((l) => l.quantity),
            ),
          ],
        );
      await db.query(
        "INSERT INTO troc.notification_outbox(user_id,marketplace_order_id,template,idempotency_key) VALUES($1,$2,'simulated_order_confirmation',$3)",
        [principal.userId, id, id + ":confirmation"],
      );
      await event(
        db,
        principal.userId,
        "checkout_completed",
        {
          orderId: id,
          aovCents: order.quote.totalCents,
          cards: order.quote.cards,
          sellers: order.quote.groups.length,
          shippingCents: order.quote.shippingCents,
          shippingPerCardCents: order.quote.shippingCents / order.quote.cards,
        },
        order.quote.demo,
      );
      return id;
    });
  }
  async checkout(principal: Principal, input: CheckoutInput) {
    const id = await this.prepare(principal, input);
    return this.finish(principal, id);
  }
}
