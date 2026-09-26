import { createHash } from "node:crypto";
import type { Principal } from "../auth/permissions";
import { can } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { SellerQuote } from "@workspace/commerce";
import { PostgresCatalogAssetProvider } from "../catalog/assets";
import { DomainError } from "../shared/domain";
import type { SellerPlatformService } from "./service";

const statuses = [
  "all",
  "simulated_paid",
  "awaiting_shipment",
  "shipped",
  "delivered",
  "completed",
  "issue",
  "cancelled",
  "partially_refunded",
  "refunded",
];
const stamp =
  /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}[.][0-9]{3,6}Z$/;
const validTime = (v: unknown): v is string =>
  typeof v === "string" &&
  stamp.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString().slice(0, 19) === v.slice(0, 19);
type Boundary = { id: string; at: string; total: number };
export function orderListInput(
  seller: string,
  input: Record<string, unknown>,
  now = new Date(),
) {
  const value = (key: string, fallback: string) => {
    const v = input[key];
    if (v === undefined) return fallback;
    if (typeof v !== "string") throw new DomainError("invalid_input");
    return v;
  };
  const q = value("q", ""),
    lang = value("lang", "en"),
    status = value("status", "all"),
    period = value("period", "all"),
    sort = value("sort", "new"),
    rawLimit = value("limit", "8");
  if (
    q.length > 100 ||
    !["en", "fr"].includes(lang) ||
    !statuses.includes(status) ||
    !["all", "7", "30", "90"].includes(period) ||
    !["new", "old", "total"].includes(sort) ||
    !/^[0-9]{1,2}$/.test(rawLimit) ||
    Number(rawLimit) < 1 ||
    Number(rawLimit) > 50
  )
    throw new DomainError("invalid_input");
  const filters = { q, lang, status, period, sort, limit: Number(rawLimit) };
  const scope = createHash("sha256")
    .update(JSON.stringify([seller, filters]))
    .digest("hex");
  if (
    input.asOf !== undefined &&
    (!validTime(input.asOf) || Date.parse(input.asOf) > now.getTime())
  )
    throw new DomainError("invalid_input");
  let asOf = typeof input.asOf === "string" ? input.asOf : now.toISOString(),
    after: Boundary | null = null;
  if (input.cursor !== undefined) {
    try {
      if (
        typeof input.cursor !== "string" ||
        input.cursor.length > 2048 ||
        !/^[A-Za-z0-9_-]+$/.test(input.cursor)
      )
        throw new Error();
      const c = JSON.parse(
        Buffer.from(input.cursor, "base64url").toString("utf8"),
      );
      if (
        c.v !== 1 ||
        c.scope !== scope ||
        (input.asOf !== undefined && input.asOf !== c.asOf) ||
        !validTime(c.asOf) ||
        Date.parse(c.asOf) > now.getTime() ||
        !validTime(c.after?.at) ||
        Date.parse(c.after.at) > Date.parse(c.asOf) ||
        typeof c.after.id !== "string" ||
        !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(c.after.id) ||
        !Number.isSafeInteger(c.after.total) ||
        c.after.total < 0
      )
        throw new Error();
      asOf = c.asOf;
      after = c.after;
    } catch {
      throw new DomainError("invalid_cursor");
    }
  }
  return { ...filters, scope, asOf, after };
}
export function orderListConditions(
  seller: string,
  f: ReturnType<typeof orderListInput>,
  includeStatus = true,
) {
  const args: unknown[] = [seller, f.asOf];
  const bind = (value: unknown) => {
    args.push(value);
    return "$" + args.length;
  };
  const where = [
    "so.seller_id=$1",
    "mo.status<>'pending'",
    "so.created_at<=$2::timestamptz",
  ];
  if (f.period !== "all")
    where.push(
      "so.created_at >= $2::timestamptz - (" +
        bind(Number(f.period)) +
        "::int * interval '1 day')",
    );
  if (includeStatus && f.status === "refunded")
    where.push("so.status IN ('refunded','partially_refunded')");
  else if (includeStatus && f.status !== "all")
    where.push("so.status=" + bind(f.status));
  if (f.q) {
    const literal = f.q
      .toLowerCase()
      .split(String.fromCharCode(92))
      .join(String.fromCharCode(92, 92))
      .replaceAll("%", String.fromCharCode(92) + "%")
      .replaceAll("_", String.fromCharCode(92) + "_");
    const pattern = bind("%" + literal + "%"),
      language = bind(f.lang);
    where.push(
      "(lower(so.id::text || ' ' || COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer') || ' ' || COALESCE((SELECT string_agg(line->'listing'->'name'->>" +
        language +
        ", ' ') FROM jsonb_array_elements(so.quote->'lines') line),'')) LIKE " +
        pattern +
        ")",
    );
  }
  return { args, bind, where };
}
export async function sellerOrderList(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  await service.access(db, p, seller);
  if (!can(p, "orders:fulfill", seller) && !can(p, "messages:reply", seller))
    throw new DomainError("forbidden", 403);
  const f = orderListInput(seller, input);
  const { args, bind, where } = orderListConditions(seller, f);
  // One statement chooses an indexed candidate list or an ordered broad scan.
  // The cap chooses the plan only; it must never truncate matching orders.
  const searchPattern = "$" + (args.length - 1);
  const searchLanguage = "$" + args.length;
  if (f.q) where.pop();

  const total = "COALESCE((so.quote->>'totalCents')::bigint,0)";
  if (f.after) {
    const at = bind(f.after.at) + "::timestamptz",
      id = bind(f.after.id) + "::uuid";
    where.push(
      f.sort === "total"
        ? "(" +
            total +
            ",so.created_at,so.id)<(" +
            bind(f.after.total) +
            "::bigint," +
            at +
            "," +
            id +
            ")"
        : "(so.created_at,so.id)" +
            (f.sort === "old" ? ">" : "<") +
            "(" +
            at +
            "," +
            id +
            ")",
    );
  }
  const order =
    f.sort === "old"
      ? "so.created_at ASC,so.id ASC"
      : f.sort === "total"
        ? total + " DESC,so.created_at DESC,so.id DESC"
        : "so.created_at DESC,so.id DESC";
  const limit = bind(f.limit + 1);
  const select =
    "SELECT so.id,so.status,so.created_at,so.quote,so.refunded_cents,COALESCE((so.quote->>'totalCents')::bigint,0) AS search_total," +
    "to_char(so.created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS cursor_at," +
    "COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer') AS buyer," +
    "mo.address->>'province' AS province,(mo.demo_batch_id IS NOT NULL) AS demo " +
    "FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id ";
  const base = select + " WHERE " + where.join(" AND ");
  const suffix = " ORDER BY " + order + " LIMIT " + limit;
  const column = f.lang === "fr" ? "fr" : "en";
  const outerOrder =
    f.sort === "old"
      ? "created_at ASC,id ASC"
      : f.sort === "total"
        ? "search_total DESC,created_at DESC,id DESC"
        : "created_at DESC,id DESC";
  const query = f.q
    ? "WITH candidates AS MATERIALIZED (SELECT order_id FROM troc.seller_order_search WHERE seller_id=$1 AND " +
      column +
      " LIKE " +
      searchPattern +
      " AND " +
      searchLanguage +
      "::text IN ('en','fr') LIMIT 257) (" +
      base +
      " AND (SELECT count(*) FROM candidates)<=256 AND so.id=ANY(ARRAY(SELECT order_id FROM candidates))" +
      suffix +
      ") UNION ALL (" +
      base +
      " AND (SELECT count(*) FROM candidates)>256 AND EXISTS(SELECT 1 FROM troc.seller_order_search search WHERE search.order_id=so.id AND search.seller_id=so.seller_id AND search." +
      column +
      " LIKE " +
      searchPattern +
      " OFFSET 0)" +
      suffix +
      ") ORDER BY " +
      outerOrder
    : base + suffix;
  const rows = (
    await db.query<{
      id: string;
      status: string;
      created_at: string;
      cursor_at: string;
      quote: SellerQuote;
      refunded_cents: number;
      buyer: string;
      province: string;
      demo: boolean;
    }>(query, args)
  ).rows;
  const page = rows.slice(0, f.limit);
  const assets = await new PostgresCatalogAssetProvider(db).thumbnails(
    page.flatMap((r) => r.quote.lines.map((l) => l.listing.variantId)),
  );
  const last = page.at(-1);
  const nextCursor =
    rows.length > f.limit && last
      ? Buffer.from(
          JSON.stringify({
            v: 1,
            scope: f.scope,
            asOf: f.asOf,
            after: {
              id: last.id,
              at: last.cursor_at,
              total: last.quote.totalCents,
            },
          }),
        ).toString("base64url")
      : null;
  return {
    sellerId: seller,
    canReply: can(p, "messages:reply", seller),
    asOf: f.asOf,
    appliedFilters: {
      q: f.q,
      lang: f.lang,
      status: f.status,
      period: f.period,
      sort: f.sort,
      limit: f.limit,
    },
    nextCursor,
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
