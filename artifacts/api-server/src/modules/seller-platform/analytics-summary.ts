import type { Principal } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { SellerPlatformService } from "./service";
import { DomainError } from "../shared/domain";
import { orderListInput } from "./order-list";
export function safeAnalyticsInteger(value: bigint) {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new DomainError("summary_out_of_range");
  return Number(value);
}
export async function sellerAnalyticsScope(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  const access = await service.access(db, p, seller);
  if (!["owner", "manager", "admin"].includes(String(access.role)))
    throw new DomainError("forbidden", 403);
  const period = input.period ?? "30",
    dataset = input.dataset ?? "live";
  if (
    typeof period !== "string" ||
    !["7", "30", "90"].includes(period) ||
    !["live", "sample"].includes(String(dataset)) ||
    typeof dataset !== "string"
  )
    throw new DomainError("invalid_input");
  const asOf = orderListInput(seller, { asOf: input.asOf }).asOf;
  const days = Number(period),
    dayMs = 86400000,
    end = Math.floor(Date.parse(asOf) / dayMs) * dayMs + dayMs,
    start = end - days * dayMs,
    previousStart = start - days * dayMs;
  return { period, dataset, asOf, days, end, start, previousStart };
}
export async function sellerAnalyticsSummary(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  const { dataset, asOf, days, end, start, previousStart } =
    await sellerAnalyticsScope(db, service, p, seller, input);
  const dayMs = 86400000;
  const rows = (
    await db.query<{
      day: string;
      orders: string;
      total: string;
      refunds: string;
      refund_orders: string;
      units: string;
    }>(
      "SELECT to_char(so.created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day,count(*)::text AS orders,COALESCE(sum((so.quote->>'totalCents')::bigint),0)::text AS total,COALESCE(sum(so.refunded_cents::bigint),0)::text AS refunds,count(*) FILTER(WHERE so.refunded_cents>0)::text AS refund_orders,COALESCE(sum((SELECT COALESCE(sum((line->>'quantity')::bigint),0) FROM jsonb_array_elements(so.quote->'lines')line)),0)::text AS units FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.seller_id=$1 AND mo.status<>'pending' AND so.status<>'cancelled' AND (mo.demo_batch_id IS NOT NULL)=$2::boolean AND so.created_at >= $3::timestamptz AND so.created_at < $4::timestamptz GROUP BY day ORDER BY day",
      [
        seller,
        dataset === "sample",
        new Date(previousStart).toISOString(),
        new Date(end).toISOString(),
      ],
    )
  ).rows;
  const buckets = new Map(rows.map((r) => [r.day, r]));
  let total = 0n,
    previousTotal = 0n,
    orders = 0n,
    refunds = 0n,
    refundOrders = 0n,
    units = 0n;
  const series = Array.from({ length: days }, (_, i) => {
    const day = new Date(start + i * dayMs).toISOString().slice(0, 10),
      prior = new Date(previousStart + i * dayMs).toISOString().slice(0, 10),
      c = buckets.get(day),
      p = buckets.get(prior);
    const amount = BigInt(c?.total ?? 0),
      previous = BigInt(p?.total ?? 0),
      count = BigInt(c?.orders ?? 0);
    total += amount;
    previousTotal += previous;
    orders += count;
    refunds += BigInt(c?.refunds ?? 0);
    refundOrders += BigInt(c?.refund_orders ?? 0);
    units += BigInt(c?.units ?? 0);
    return {
      day,
      totalCents: safeAnalyticsInteger(amount),
      orders: safeAnalyticsInteger(count),
      previousTotalCents: safeAnalyticsInteger(previous),
      previousOrders: safeAnalyticsInteger(BigInt(p?.orders ?? 0)),
    };
  });
  return {
    sellerId: seller,
    asOf,
    period: days,
    dataset,
    start: new Date(start).toISOString(),
    endExclusive: new Date(end).toISOString(),
    orderCount: safeAnalyticsInteger(orders),
    totalCents: safeAnalyticsInteger(total),
    previousTotalCents: safeAnalyticsInteger(previousTotal),
    refundCents: safeAnalyticsInteger(refunds),
    refundOrderCount: safeAnalyticsInteger(refundOrders),
    units: safeAnalyticsInteger(units),
    series,
  };
}
