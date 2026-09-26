import type { Principal } from "../auth/permissions";
import { can } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { SellerQuote } from "@workspace/commerce";
import { PostgresCatalogAssetProvider } from "../catalog/assets";
import { DomainError } from "../shared/domain";
import { SellerPlatformService } from "./service";

async function readSellerOperations(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  orderId?: string,
) {
  const access = await service.access(db, p, seller);
  if (!can(p, "orders:fulfill", seller) && !can(p, "messages:reply", seller))
    throw new DomainError("forbidden", 403);
  const rows = (
    await db.query<{
      id: string;
      status: string;
      created_at: string;
      quote: SellerQuote;
      refunded_cents: number;
      buyer: string;
      province: string;
      demo: boolean;
      message_count: number;
      unread_count: number;
      last_message: string | null;
      message_at: string | null;
    }>(
      `SELECT so.id,so.status,so.created_at,so.quote,so.refunded_cents,
    COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer') AS buyer,
    mo.address->>'province' AS province,(mo.demo_batch_id IS NOT NULL) AS demo,
    (SELECT count(*)::int FROM troc.order_messages m WHERE m.seller_order_id=so.id) AS message_count,
    (SELECT count(*)::int FROM troc.order_messages m WHERE m.seller_order_id=so.id AND m.actor_id<>$2 AND NOT EXISTS(SELECT 1 FROM troc.order_message_reads r WHERE r.user_id=$2 AND r.message_id=m.id)) AS unread_count,
    (SELECT body FROM troc.order_messages m WHERE m.seller_order_id=so.id ORDER BY created_at DESC,id DESC LIMIT 1) AS last_message,
    (SELECT max(created_at) FROM troc.order_messages m WHERE m.seller_order_id=so.id) AS message_at
    FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id
    WHERE so.seller_id=$1 AND mo.status<>'pending'
    ${orderId ? "AND so.id=$3" : "ORDER BY so.created_at DESC,so.id DESC LIMIT 201"}`,
      orderId ? [seller, p.userId, orderId] : [seller, p.userId],
    )
  ).rows;
  const page = rows.slice(0, 200);
  const assets = await new PostgresCatalogAssetProvider(db).thumbnails(
    page.flatMap((r) => r.quote.lines.map((l) => l.listing.variantId)),
  );
  return {
    sellerId: seller,
    canReply: can(p, "messages:reply", seller),
    canAnalyze: ["owner", "manager", "admin"].includes(String(access.role)),
    truncated: rows.length > 200,
    orders: page.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      buyer: r.buyer,
      province: r.province,
      demo: r.demo,
      totalCents: r.quote.totalCents,
      merchandiseCents: r.quote.merchandiseCents,
      shippingCents: r.quote.shipping.cents,
      refundedCents: r.refunded_cents,
      messageCount: r.message_count,
      unreadCount: r.unread_count,
      lastMessage: r.last_message,
      messageAt: r.message_at ? new Date(r.message_at).toISOString() : null,
      lines: r.quote.lines.map((l) => ({
        name: l.listing.name,
        quantity: l.quantity,
        unitCents: l.unitCents,
        totalCents: l.totalCents,
        variantId: l.listing.variantId,
        condition: l.listing.condition,
        imageUrl: assets.get(l.listing.variantId) || null,
      })),
    })),
  };
}

export function sellerOperations(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
) {
  return readSellerOperations(db, service, p, seller);
}

// Reuse the existing authorized order/context mapping, selecting one exact order.
// This endpoint neither fetches nor marks its message history as read.
export async function sellerConversationContext(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  orderId: string,
) {
  if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(orderId))
    throw new DomainError("invalid_input");
  const result = await readSellerOperations(db, service, p, seller, orderId);
  const order = result.orders[0];
  if (!order) throw new DomainError("not_found", 404);
  return { sellerId: seller, canReply: result.canReply, order };
}
