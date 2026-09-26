import type { Principal } from "../auth/permissions";
import { can } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { SellerPlatformService } from "./service";
import { DomainError } from "../shared/domain";
import { orderListConditions, orderListInput } from "./order-list";

function safeCount(value: bigint) {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER))
    throw new DomainError("summary_out_of_range");
  return Number(value);
}
export async function sellerOrderSummary(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  await service.access(db, p, seller);
  if (!can(p, "orders:fulfill", seller) && !can(p, "messages:reply", seller))
    throw new DomainError("forbidden", 403);
  if (input.cursor !== undefined) throw new DomainError("invalid_input");
  const f = orderListInput(seller, input);
  const { args, where } = orderListConditions(seller, f, false);
  const searchJoin = f.q
    ? " LEFT JOIN troc.seller_order_search search ON search.order_id=so.id AND search.seller_id=so.seller_id "
    : " ";
  if (f.q) {
    // Keep global priorities even if a projection row is missing; only filtered
    // results use its text. Source joins still own status, amounts and cutoff.
    where[where.length - 1] =
      "(search." +
      (f.lang === "fr" ? "fr" : "en") +
      " LIKE $" +
      (args.length - 1) +
      " AND $" +
      args.length +
      "::text IN ('en','fr'))";
  }

  // Per-status aggregates retain global priorities independently of selected filters.
  const rows = (
    await db.query<{
      status: string;
      global_count: string;
      filtered_count: string;
      filtered_total: string;
      contains_demo: boolean;
    }>(
      // Projected text avoids repeatedly decoding quote lines; exact totals still scan.
      "WITH scoped AS " +
        (f.q ? "MATERIALIZED" : "NOT MATERIALIZED") +
        " (SELECT so.status,COALESCE((so.quote->>'totalCents')::bigint,0) AS total," +
        "(mo.demo_batch_id IS NOT NULL) AS demo,(" +
        where.join(" AND ") +
        ") AS matches FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id " +
        searchJoin +
        "WHERE so.seller_id=$1 AND mo.status<>'pending' AND so.created_at<=$2::timestamptz) " +
        "SELECT status,count(*)::text AS global_count," +
        "count(*) FILTER (WHERE matches)::text AS filtered_count," +
        "COALESCE(sum(total) FILTER (WHERE matches),0)::text AS filtered_total," +
        "COALESCE(bool_or(demo) FILTER (WHERE matches),false) AS contains_demo " +
        "FROM scoped GROUP BY status",
      args,
    )
  ).rows;
  const priorities: Record<string, number> = {};
  const tabs: Record<string, number> = {};
  let all = 0n,
    matched = 0n,
    total = 0n,
    refunded = 0n,
    containsDemo = false;
  for (const row of rows) {
    const count = BigInt(row.filtered_count);
    priorities[row.status] = safeCount(BigInt(row.global_count));
    tabs[row.status] = safeCount(count);
    all += count;
    if (["refunded", "partially_refunded"].includes(row.status))
      refunded += count;
    if (
      f.status === "all" ||
      row.status === f.status ||
      (f.status === "refunded" && row.status === "partially_refunded")
    ) {
      matched += count;
      total += BigInt(row.filtered_total);
      containsDemo ||= row.contains_demo;
    }
  }
  tabs.all = safeCount(all);
  tabs.refunded = safeCount(refunded);
  return {
    sellerId: seller,
    asOf: f.asOf,
    appliedFilters: {
      q: f.q,
      lang: f.lang,
      status: f.status,
      period: f.period,
    },
    priorities,
    tabs,
    matchedCount: safeCount(matched),
    matchedTotalCents: safeCount(total),
    containsDemo,
  };
}
