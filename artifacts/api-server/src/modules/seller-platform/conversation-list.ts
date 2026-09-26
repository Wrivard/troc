import { createHash } from "node:crypto";
import type { Principal } from "../auth/permissions";
import { can } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { SellerPlatformService } from "./service";
import { DomainError } from "../shared/domain";
import { orderListInput } from "./order-list";

export async function sellerConversationList(
  db: Sql,
  service: SellerPlatformService,
  p: Principal,
  seller: string,
  input: Record<string, unknown>,
) {
  await service.access(db, p, seller);
  if (!can(p, "orders:fulfill", seller) && !can(p, "messages:reply", seller))
    throw new DomainError("forbidden", 403);
  const f = orderListInput(seller, { q: input.q, limit: input.limit ?? "20" });
  const filter = input.filter ?? "conversations";
  if (filter !== "conversations" && filter !== "all")
    throw new DomainError("invalid_input");
  const scope = createHash("sha256")
    .update(JSON.stringify([seller, f.q, filter, f.limit]))
    .digest("hex");
  const args: unknown[] = [seller, p.userId];
  const bind = (v: unknown) => {
    args.push(v);
    return "$" + args.length;
  };
  const where = ["so.seller_id=$1", "mo.status<>'pending'"];
  if (filter === "conversations") where.push("latest.id IS NOT NULL");
  if (f.q) {
    const escaped = f.q.toLowerCase().replace(/[\\%_]/g, (v) => "\\" + v);
    where.push(
      "lower(so.id::text||' '||COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer')||' '||COALESCE(latest.body,'')) LIKE " +
        bind("%" + escaped + "%"),
    );
  }
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
        typeof c.at !== "string" ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(c.at) ||
        !Number.isFinite(Date.parse(c.at)) ||
        new Date(c.at).toISOString().slice(0, 19) !== c.at.slice(0, 19) ||
        typeof c.id !== "string" ||
        !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(c.id)
      )
        throw new Error();
      where.push(
        "(COALESCE(latest.created_at,so.created_at),so.id)<(" +
          bind(c.at) +
          "::timestamptz," +
          bind(c.id) +
          "::uuid)",
      );
    } catch {
      throw new DomainError("invalid_cursor");
    }
  }
  const limit = bind(f.limit + 1);
  const rows = (
    await db.query<{
      id: string;
      status: string;
      created_at: string;
      buyer: string;
      demo: boolean;
      last_message: string | null;
      message_at: string | null;
      has_messages: boolean;
      cursor_at: string;
      unread_count: number;
    }>(
      "WITH page AS MATERIALIZED (SELECT so.id,so.status,so.created_at,COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer') AS buyer,(mo.demo_batch_id IS NOT NULL) AS demo,latest.body AS last_message,latest.created_at AS message_at,(latest.id IS NOT NULL) AS has_messages," +
        "to_char(COALESCE(latest.created_at,so.created_at) AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"') AS cursor_at,COALESCE(latest.created_at,so.created_at) AS activity_at " +
        "FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id LEFT JOIN LATERAL (SELECT m.id,m.body,m.created_at FROM troc.order_messages m WHERE m.seller_order_id=so.id ORDER BY m.created_at DESC,m.id DESC LIMIT 1) latest ON true WHERE " +
        where.join(" AND ") +
        " ORDER BY activity_at DESC,so.id DESC LIMIT " +
        limit +
        ") SELECT page.*,(SELECT count(*)::int FROM troc.order_messages m WHERE m.seller_order_id=page.id AND m.actor_id<>$2 AND NOT EXISTS(SELECT 1 FROM troc.order_message_reads r WHERE r.user_id=$2 AND r.message_id=m.id)) AS unread_count FROM page ORDER BY activity_at DESC,id DESC",
      args,
    )
  ).rows;
  const page = rows.slice(0, f.limit),
    last = page.at(-1);
  return {
    sellerId: seller,
    canReply: can(p, "messages:reply", seller),
    appliedFilters: { q: f.q, filter, limit: f.limit },
    nextCursor:
      rows.length > f.limit && last
        ? Buffer.from(
            JSON.stringify({ v: 1, scope, at: last.cursor_at, id: last.id }),
          ).toString("base64url")
        : null,
    conversations: page.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      buyer: r.buyer,
      demo: r.demo,
      lastMessage: r.last_message,
      messageAt: r.message_at ? new Date(r.message_at).toISOString() : null,
      hasMessages: r.has_messages,
      unreadCount: r.unread_count,
    })),
  };
}
