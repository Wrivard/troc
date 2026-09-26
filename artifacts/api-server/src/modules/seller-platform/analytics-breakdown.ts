import { createHash } from "node:crypto";
import type { Sql } from "../commerce/data";
import type { Principal } from "../auth/permissions";
import type { SellerPlatformService } from "./service";
import {
  sellerAnalyticsScope,
  safeAnalyticsInteger,
} from "./analytics-summary";
import { DomainError } from "../shared/domain";
import { PostgresCatalogAssetProvider } from "../catalog/assets";

export async function sellerAnalyticsProducts(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  // A cursor pins asOf; still validate through the shared input/authorization path.
  let decoded:
    | {
        v?: unknown;
        scope?: unknown;
        asOf?: unknown;
        cents?: unknown;
        id?: unknown;
      }
    | undefined;
  if (input.cursor !== undefined) {
    try {
      if (
        typeof input.cursor !== "string" ||
        input.cursor.length > 2048 ||
        !/^[A-Za-z0-9_-]+$/.test(input.cursor)
      )
        throw new Error();
      decoded = JSON.parse(
        Buffer.from(input.cursor, "base64url").toString("utf8"),
      );
      if (
        !decoded ||
        typeof decoded !== "object" ||
        decoded.v !== 1 ||
        typeof decoded.asOf !== "string" ||
        !Number.isSafeInteger(decoded.cents) ||
        Number(decoded.cents) < 0 ||
        typeof decoded.id !== "string" ||
        !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(decoded.id)
      )
        throw new Error();
      if (input.asOf !== undefined && input.asOf !== decoded.asOf)
        throw new Error();
    } catch {
      throw new DomainError("invalid_cursor");
    }
  }
  const f = await sellerAnalyticsScope(db, service, p, seller, {
    ...input,
    asOf: decoded?.asOf ?? input.asOf,
  });
  const rawLimit = input.limit ?? "25";
  if (
    typeof rawLimit !== "string" ||
    !/^[0-9]{1,2}$/.test(rawLimit) ||
    Number(rawLimit) < 1 ||
    Number(rawLimit) > 50
  )
    throw new DomainError("invalid_input");
  const limit = Number(rawLimit);
  const scope = createHash("sha256")
    .update(JSON.stringify([seller, f.period, f.dataset, limit]))
    .digest("hex");
  if (decoded && decoded.scope !== scope)
    throw new DomainError("invalid_cursor");
  const args: unknown[] = [
    seller,
    f.dataset === "sample",
    new Date(f.start).toISOString(),
    new Date(f.end).toISOString(),
  ];
  let after = "";
  if (decoded) {
    args.push(decoded.cents, decoded.id);
    after = " WHERE (cents,variant_id)<($5::numeric,$6::uuid)";
  }
  args.push(limit + 1);
  const rows = (
    await db.query<{
      variant_id: string;
      quantity: string;
      cents: string;
      name: { en: string; fr: string };
    }>(
      "WITH lines AS MATERIALIZED (SELECT (line->'listing'->>'variantId')::uuid AS variant_id,(line->>'quantity')::bigint AS quantity,(line->>'totalCents')::bigint AS cents,line->'listing'->'name' AS name,so.created_at,so.id AS order_id,position FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id CROSS JOIN LATERAL jsonb_array_elements(so.quote->'lines') WITH ORDINALITY AS item(line,position) WHERE so.seller_id=$1 AND mo.status<>'pending' AND so.status<>'cancelled' AND (mo.demo_batch_id IS NOT NULL)=$2::boolean AND so.created_at >= $3::timestamptz AND so.created_at < $4::timestamptz), totals AS (SELECT variant_id,sum(quantity) AS quantity,sum(cents) AS cents FROM lines GROUP BY variant_id), page AS MATERIALIZED (SELECT * FROM totals" +
        after +
        " ORDER BY cents DESC,variant_id DESC LIMIT $" +
        args.length +
        "), names AS (SELECT DISTINCT ON(l.variant_id) l.variant_id,l.name FROM lines l JOIN page p ON p.variant_id=l.variant_id ORDER BY l.variant_id,l.created_at DESC,l.order_id DESC,l.position ASC) SELECT p.variant_id,p.quantity::text,p.cents::text,n.name FROM page p JOIN names n ON n.variant_id=p.variant_id ORDER BY p.cents DESC,p.variant_id DESC",
      args,
    )
  ).rows;
  const page = rows.slice(0, limit);
  const values = page.map((r) => ({
    variantId: r.variant_id,
    name: r.name,
    quantity: safeAnalyticsInteger(BigInt(r.quantity)),
    cents: safeAnalyticsInteger(BigInt(r.cents)),
  }));
  const assets = await new PostgresCatalogAssetProvider(db).thumbnails(
    values.map((r) => r.variantId),
  );
  const last = values.at(-1);
  return {
    sellerId: seller,
    asOf: f.asOf,
    period: f.days,
    dataset: f.dataset,
    products: values.map((r) => ({
      ...r,
      imageUrl: assets.get(r.variantId) ?? null,
    })),
    nextCursor:
      rows.length > limit && last
        ? Buffer.from(
            JSON.stringify({
              v: 1,
              scope,
              asOf: f.asOf,
              cents: last.cents,
              id: last.variantId,
            }),
          ).toString("base64url")
        : null,
  };
}

export async function sellerAnalyticsBreakdown(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  const f = await sellerAnalyticsScope(db, service, p, seller, input);
  // Inline eligibility so province dates reach the seek index and availability EXISTS can stop early.
  const row = (
    await db.query<{
      provinces: { province: string; count: string }[];
      province_groups: string;
      live: boolean;
      sample: boolean;
    }>(
      "WITH eligible AS NOT MATERIALIZED (SELECT so.created_at,mo.address->>'province' AS province,(mo.demo_batch_id IS NOT NULL) AS demo FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.seller_id=$1 AND mo.status<>'pending' AND so.status<>'cancelled' AND so.created_at<$4::timestamptz), provinces AS (SELECT COALESCE(NULLIF(province,''),'—') AS province,count(*) AS count FROM eligible WHERE demo=$2::boolean AND created_at>=$3::timestamptz GROUP BY 1), page AS (SELECT province,count::text FROM provinces ORDER BY provinces.count DESC,province LIMIT 50) SELECT COALESCE((SELECT jsonb_agg(page ORDER BY page.count::bigint DESC,page.province) FROM page),'[]'::jsonb) AS provinces,(SELECT count(*)::text FROM provinces) AS province_groups,EXISTS(SELECT 1 FROM eligible WHERE NOT demo) AS live,EXISTS(SELECT 1 FROM eligible WHERE demo) AS sample",
      [
        seller,
        f.dataset === "sample",
        new Date(f.start).toISOString(),
        new Date(f.end).toISOString(),
      ],
    )
  ).rows[0];
  return {
    sellerId: seller,
    asOf: f.asOf,
    period: f.days,
    dataset: f.dataset,
    provinces: row.provinces.map((r) => ({
      province: r.province,
      count: safeAnalyticsInteger(BigInt(r.count)),
    })),
    provincesTruncated: BigInt(row.province_groups) > 50n,
    datasets: { live: row.live, sample: row.sample },
  };
}
