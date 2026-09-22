import { randomUUID } from "node:crypto";
import type {
  Address,
  CartQuote,
  OrderStatus,
  OrderView,
  SellerQuote,
} from "@workspace/commerce";
import { authorize, can, type Principal } from "../auth/permissions";
import { DomainError } from "../shared/domain";
import { allocate, integer, transition } from "./calculations";
import { lockBuyer, requestKey, type TransactionStore } from "./checkout";
import type { Sql } from "./data";
type Parent = {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  created_at: Date | string;
  quote: CartQuote;
  address: Address;
  credit_cents: number;
  reward_cents: number;
};
type Child = {
  id: string;
  marketplace_order_id: string;
  seller_id: string;
  status: OrderStatus;
  quote: SellerQuote;
  tracking: string | null;
  refunded_cents: number;
};
export class OrderService {
  constructor(private readonly store: TransactionStore) {}
  async list(
    db: Sql,
    p: Principal,
    seller = false,
    cursor: string | null = null,
  ): Promise<
    { id: string; status: string; createdAt: string; totalCents: number }[]
  > {
    const ids = p.memberships
      .filter(
        (m) =>
          m.active &&
          (can(p, "orders:fulfill", m.sellerId) ||
            can(p, "messages:reply", m.sellerId)),
      )
      .map((m) => m.sellerId);
    const rows = seller
      ? (
          await db.query<{
            id: string;
            status: string;
            created_at: string;
            total_cents: string;
          }>(
            "SELECT so.id,so.status,so.created_at,(so.merchandise_cents-so.discount_cents+so.shipping_cents)::text AS total_cents FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.seller_id=ANY($1::uuid[]) AND mo.status<>'pending' AND ($2::uuid IS NULL OR (so.created_at,so.id)<(SELECT created_at,id FROM troc.seller_orders WHERE id=$2 AND seller_id=ANY($1::uuid[]))) ORDER BY so.created_at DESC,so.id DESC LIMIT 50",
            [ids, cursor],
          )
        ).rows
      : (
          await db.query<{
            id: string;
            status: string;
            created_at: string;
            total_cents: string;
          }>(
            "SELECT id,status,created_at,total_cents::text FROM troc.marketplace_orders WHERE buyer_id=$1 AND status<>'pending' AND ($2::uuid IS NULL OR (created_at,id)<(SELECT created_at,id FROM troc.marketplace_orders WHERE id=$2 AND buyer_id=$1)) ORDER BY created_at DESC,id DESC LIMIT 50",
            [p.userId, cursor],
          )
        ).rows;
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      totalCents: Number(r.total_cents),
    }));
  }
  async read(
    db: Sql,
    p: Principal,
    id: string,
    seller = false,
  ): Promise<OrderView> {
    let child: Child | undefined;
    if (seller) {
      child = (
        await db.query<Child>("SELECT * FROM troc.seller_orders WHERE id=$1", [
          id,
        ])
      ).rows[0];
      if (
        !child ||
        (!can(p, "orders:fulfill", child.seller_id) &&
          !can(p, "messages:reply", child.seller_id))
      )
        throw new DomainError("not_found", 404);
    }
    const parent = (
      await db.query<Parent>(
        "SELECT * FROM troc.marketplace_orders WHERE id=$1",
        [child?.marketplace_order_id ?? id],
      )
    ).rows[0];
    if (
      !parent ||
      parent.status === ("pending" as string) ||
      (!seller && parent.buyer_id !== p.userId)
    )
      throw new DomainError("not_found", 404);
    const children = child
      ? [child]
      : (
          await db.query<Child>(
            "SELECT * FROM troc.seller_orders WHERE marketplace_order_id=$1 ORDER BY id",
            [id],
          )
        ).rows;
    const childIds = children.map((c) => c.id);
    const ledger = (
      await db.query<{ seller_order_id: string; kind: string; cents: number }>(
        "SELECT seller_order_id,kind,cents FROM troc.fee_ledger WHERE seller_order_id=ANY($1::uuid[])",
        [childIds],
      )
    ).rows;
    const messages = (
      await db.query<{
        id: string;
        sellerOrderId: string;
        body: string;
        createdAt: string;
        author: "buyer" | "seller";
      }>(
        `SELECT id,seller_order_id AS "sellerOrderId",body,created_at AS "createdAt",author FROM troc.order_messages WHERE seller_order_id=ANY($1::uuid[]) ORDER BY created_at DESC,id LIMIT 100`,
        [childIds],
      )
    ).rows;
    return {
      id: seller ? child!.id : parent.id,
      createdAt: new Date(parent.created_at).toISOString(),
      status: seller ? child!.status : parent.status,
      totalCents: seller ? child!.quote.totalCents : parent.quote.totalCents,
      creditCents: seller ? 0 : parent.credit_cents,
      rewardCents: seller ? 0 : parent.reward_cents,
      demo: true,
      address: parent.address,
      messages,
      groups: children.map((c) => {
        const amount = (kind: string) =>
          ledger.find((l) => l.seller_order_id === c.id && l.kind === kind)
            ?.cents ?? 0;
        return {
          id: c.id,
          status: c.status,
          quote: c.quote,
          tracking: c.tracking,
          refundedCents: c.refunded_cents,
          fee: {
            sellerId: c.seller_id,
            commissionCents: amount("commission"),
            shippingCommissionCents: amount("shipping_commission"),
            promotedCents: amount("promotion"),
            processingCents: amount("processing"),
            netCents:
              c.quote.totalCents -
              ledger
                .filter((l) => l.seller_order_id === c.id)
                .reduce((n, l) => n + l.cents, 0),
          },
        };
      }),
    };
  }
  async action(
    p: Principal,
    id: string,
    input: {
      action: string;
      idempotencyKey: string;
      tracking?: string;
      amountCents?: number;
      body?: string;
    },
  ) {
    if (
      !input ||
      ![
        "message",
        "issue",
        "shipped",
        "delivered",
        "completed",
        "refund",
        "cancelled",
      ].includes(input.action)
    )
      throw new DomainError("invalid_order_action");
    requestKey(input.idempotencyKey);
    return this.store.transaction(async (db) => {
      // Resolve ownership before locking; lock buyer first to share checkout/credit lock order.
      const located = (
        await db.query<{ buyer_id: string; marketplace_order_id: string }>(
          "SELECT mo.buyer_id,so.marketplace_order_id FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.id=$1",
          [id],
        )
      ).rows[0];
      if (!located) throw new DomainError("not_found", 404);
      await lockBuyer(db, located.buyer_id, located.buyer_id === p.userId);
      const parent = (
        await db.query<Parent>(
          "SELECT * FROM troc.marketplace_orders WHERE id=$1 FOR UPDATE",
          [located.marketplace_order_id],
        )
      ).rows[0];
      const child = (
        await db.query<Child>(
          "SELECT * FROM troc.seller_orders WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      const buyer = parent.buyer_id === p.userId;
      if (input.action === "message") {
        if (!buyer) authorize(p, "messages:reply", child.seller_id);
      } else if (
        input.action === "issue" ||
        input.action === "delivered" ||
        input.action === "completed"
      ) {
        if (!buyer) throw new DomainError("forbidden", 403);
      } else
        authorize(
          p,
          input.action === "refund" || input.action === "cancelled"
            ? "orders:refund"
            : "orders:fulfill",
          child.seller_id,
        );
      const key = p.userId + ":" + input.idempotencyKey;
      const previous = (
        await db.query<{ details: typeof input; seller_order_id: string }>(
          "SELECT details,seller_order_id FROM troc.order_events WHERE idempotency_key=$1",
          [key],
        )
      ).rows[0];
      if (previous) {
        if (
          previous.seller_order_id !== id ||
          JSON.stringify(previous.details) !==
            JSON.stringify(JSON.parse(JSON.stringify(input)))
        ) {
          // JSONB key ordering is not significant; compare normalized action fields.
          if (
            previous.seller_order_id !== id ||
            ["action", "tracking", "amountCents", "body"].some(
              (k) =>
                previous.details[k as keyof typeof input] !==
                input[k as keyof typeof input],
            )
          )
            throw new DomainError("idempotency_conflict", 409);
        }
        return;
      }
      if (
        parent.status === "cancelled" ||
        parent.status === ("pending" as string)
      )
        throw new DomainError("invalid_order_transition", 409);
      if (input.action === "message") {
        if (
          typeof input.body !== "string" ||
          !input.body.trim() ||
          input.body.length > 2000
        )
          throw new DomainError("invalid_message");
        await db.query(
          "INSERT INTO troc.order_messages(seller_order_id,actor_id,author,body) VALUES($1,$2,$3,$4)",
          [id, p.userId, buyer ? "buyer" : "seller", input.body.trim()],
        );
      } else if (input.action === "refund" || input.action === "cancelled") {
        if (input.action === "cancelled") {
          transition(child.status, "cancelled");
          const shipped = (
            await db.query(
              "SELECT id FROM troc.order_events WHERE seller_order_id=$1 AND action='shipped' LIMIT 1",
              [id],
            )
          ).rows.length;
          if (shipped) throw new DomainError("invalid_order_transition", 409);
        }
        const weights = parent.quote.groups.map((g) => g.totalCents);
        const tax = allocate(parent.quote.taxCents, weights)[
          parent.quote.groups.findIndex((g) => g.seller.id === child.seller_id)
        ];
        const ceiling = child.quote.totalCents + tax;
        const amount =
          input.action === "cancelled"
            ? ceiling - child.refunded_cents
            : integer(
                input.amountCents ?? 0,
                1,
                ceiling - child.refunded_cents,
              );
        const status =
          input.action === "cancelled"
            ? "cancelled"
            : amount + child.refunded_cents === ceiling
              ? "refunded"
              : "partially_refunded";
        if (input.action !== "cancelled") transition(child.status, status);
        await db.query(
          "INSERT INTO troc.credit_ledger(user_id,marketplace_order_id,seller_order_id,kind,cents,idempotency_key) VALUES($1,$2,$3,'refund',$4,$5)",
          [parent.buyer_id, parent.id, id, amount, key + ":refund"],
        );
        await db.query(
          "UPDATE troc.seller_orders SET status=$2,refunded_cents=refunded_cents+$3,updated_at=now() WHERE id=$1",
          [id, status, amount],
        );
        // Unshipped cancellation returns stock once. Refunds do not imply a physical return.
        if (input.action === "cancelled")
          for (const line of [...child.quote.lines].sort((a, b) =>
            a.listingId.localeCompare(b.listingId),
          )) {
            await db.query(
              "UPDATE troc.listings SET quantity=quantity+$2,status=CASE WHEN status='sold_out' THEN 'active' ELSE status END,updated_at=now() WHERE id=$1",
              [line.listingId, line.quantity],
            );
            await db.query(
              "INSERT INTO troc.inventory_events(listing_id,quantity_delta,reason,actor_id,idempotency_key) VALUES($1,$2,'unshipped_cancellation',$3,$4)",
              [
                line.listingId,
                line.quantity,
                p.userId,
                id + ":return:" + line.listingId,
              ],
            );
          }
      } else {
        const next = input.action as OrderStatus;
        transition(child.status, next);
        if (
          next === "shipped" &&
          child.quote.shipping.tracked &&
          (!input.tracking || !input.tracking.trim())
        )
          throw new DomainError("tracking_required");
        if (input.tracking && input.tracking.length > 100)
          throw new DomainError("invalid_tracking");
        await db.query(
          "UPDATE troc.seller_orders SET status=$2,tracking=COALESCE($3,tracking),updated_at=now() WHERE id=$1",
          [id, next, input.tracking?.trim() || null],
        );
      }
      await db.query(
        "INSERT INTO troc.order_events(id,marketplace_order_id,seller_order_id,actor_id,action,details,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          randomUUID(),
          parent.id,
          id,
          p.userId,
          input.action,
          JSON.stringify(input),
          key,
        ],
      );
      const statuses = (
        await db.query<{ status: OrderStatus; refunded_cents: number }>(
          "SELECT status,refunded_cents FROM troc.seller_orders WHERE marketplace_order_id=$1",
          [parent.id],
        )
      ).rows;
      const refunded = statuses.reduce((n, s) => n + s.refunded_cents, 0);
      const gross = parent.quote.totalCents + parent.quote.creditCents;
      const next: OrderStatus =
        refunded >= gross
          ? "refunded"
          : refunded > 0
            ? "partially_refunded"
            : statuses.every((s) => s.status === "completed")
              ? "completed"
              : statuses.some((s) => s.status === "issue")
                ? "issue"
                : statuses.every((s) =>
                      ["delivered", "completed"].includes(s.status),
                    )
                  ? "delivered"
                  : statuses.every((s) =>
                        ["shipped", "delivered", "completed"].includes(
                          s.status,
                        ),
                      )
                    ? "shipped"
                    : "awaiting_shipment";
      await db.query(
        "UPDATE troc.marketplace_orders SET status=$2,updated_at=now() WHERE id=$1",
        [parent.id, next],
      );
      if (next === "completed" && parent.reward_cents)
        await db.query(
          "INSERT INTO troc.credit_ledger(user_id,marketplace_order_id,kind,cents,idempotency_key) VALUES($1,$2,'reward',$3,$4) ON CONFLICT(idempotency_key) DO NOTHING",
          [
            parent.buyer_id,
            parent.id,
            parent.reward_cents,
            parent.id + ":reward",
          ],
        );
      // Reverse earned reward on the first subsequent refund. The refund supplies sufficient balance.
      if (refunded > 0) {
        const earned = (
          await db.query<{ cents: number }>(
            "SELECT cents FROM troc.credit_ledger WHERE idempotency_key=$1",
            [parent.id + ":reward"],
          )
        ).rows[0];
        if (earned) {
          const already = Number(
            (
              await db.query<{ cents: string }>(
                "SELECT COALESCE(-sum(cents),0)::text AS cents FROM troc.credit_ledger WHERE marketplace_order_id=$1 AND kind='reward_reversal'",
                [parent.id],
              )
            ).rows[0].cents,
          );
          const reverse = Math.min(
            earned.cents - already,
            Math.max(0, refunded - already),
          );
          if (reverse > 0)
            await db.query(
              "INSERT INTO troc.credit_ledger(user_id,marketplace_order_id,kind,cents,idempotency_key) VALUES($1,$2,'reward_reversal',$3,$4)",
              [parent.buyer_id, parent.id, -reverse, key + ":reward-reversal"],
            );
        }
      }
    });
  }
}
