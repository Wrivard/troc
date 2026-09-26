import type { Sql } from "../commerce/data";
import type { Principal } from "../auth/permissions";
import type { SellerPlatformService } from "./service";
import {
  sellerAnalyticsScope,
  safeAnalyticsInteger,
} from "./analytics-summary";
import { DomainError } from "../shared/domain";

const maxOrders = 10000;
const cell = (value: string) =>
  '"' +
  value.replace(/^(?:\s*[=+@-]|[\t\r])/, "'$&").replaceAll('"', '""') +
  '"';
const cad = (value: string) => {
  const cents = BigInt(value);
  safeAnalyticsInteger(cents);
  return (
    (cents / 100n).toString() + "." + (cents % 100n).toString().padStart(2, "0")
  );
};
export async function sellerAnalyticsExport(
  db: Sql,
  service: SellerPlatformService,
  principal: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  const scope = await sellerAnalyticsScope(
    db,
    service,
    principal,
    seller,
    input,
  );
  // One SELECT supplies a consistent statement snapshot. Reject overflow before any file is sent.
  const rows = (
    await db.query<{
      id: string;
      created_at: string;
      buyer: string;
      total: string;
      refunded: string;
      status: string;
    }>(
      "SELECT so.id,to_char(so.created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS created_at,COALESCE(mo.address->>'recipient','') AS buyer,(so.quote->>'totalCents')::bigint::text AS total,so.refunded_cents::text AS refunded,so.status FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.seller_id=$1 AND mo.status<>'pending' AND so.status<>'cancelled' AND (mo.demo_batch_id IS NOT NULL)=$2::boolean AND so.created_at >= $3::timestamptz AND so.created_at < $4::timestamptz ORDER BY so.created_at DESC,so.id DESC LIMIT $5",
      [
        seller,
        scope.dataset === "sample",
        new Date(scope.start).toISOString(),
        new Date(scope.end).toISOString(),
        maxOrders + 1,
      ],
    )
  ).rows;
  if (rows.length > maxOrders) throw new DomainError("export_too_large", 422);
  const lines = ["Order,Date UTC,Buyer,Total CAD,Refunded CAD,Status,Sample"];
  let bytes = Buffer.byteLength(lines[0]) + 3;
  for (const row of rows) {
    const line = [
      row.id,
      row.created_at,
      row.buyer,
      cad(row.total),
      cad(row.refunded),
      row.status,
      scope.dataset === "sample" ? "yes" : "no",
    ]
      .map(cell)
      .join(",");
    bytes += Buffer.byteLength(line) + 2;
    if (bytes > 5 * 1024 * 1024) throw new DomainError("export_too_large", 422);
    lines.push(line);
  }
  return {
    csv: "\uFEFF" + lines.join("\r\n"),
    filename: `troc-orders-${scope.dataset}-${scope.period}-days.csv`,
    rows: rows.length,
    asOf: scope.asOf,
  };
}
