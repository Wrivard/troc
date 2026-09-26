import {
  enquiryCreateSchema,
  enquiryReplySchema,
  enquiryReportSchema,
  enquiryBlockSchema,
  enquiryReportReviewSchema,
} from "@workspace/api-zod";
import type { Principal, SellerRole } from "../auth/permissions";
import { can } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { TransactionStore } from "../commerce/checkout";
import { DomainError } from "../shared/domain";
import { uuid } from "./domain";
import { SellerPlatformService } from "./service";
type Thread = {
  id: string;
  seller_id: string;
  buyer_id: string;
  subject: string;
};
export class StoreEnquiries {
  constructor(
    private db: Sql,
    private store: TransactionStore,
    private service: SellerPlatformService,
  ) {}
  private async contactControl(
    db: Sql,
    seller: string,
    buyer: string,
    lock = false,
  ) {
    if (lock)
      await db.query(
        "INSERT INTO troc.store_enquiry_controls(seller_id,buyer_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
        [seller, buyer],
      );
    const row = (
      await db.query<{
        blocked: boolean;
        version: number;
        changed_by: string | null;
        request_key: string | null;
      }>(
        "SELECT blocked,version,changed_by,request_key FROM troc.store_enquiry_controls WHERE seller_id=$1 AND buyer_id=$2" +
          (lock ? " FOR UPDATE" : ""),
        [seller, buyer],
      )
    ).rows[0];
    return (
      row ?? { blocked: false, version: 0, changed_by: null, request_key: null }
    );
  }
  async setBlocked(p: Principal, seller: string, id: string, input: unknown) {
    const parsed = enquiryBlockSchema.safeParse(input);
    if (!parsed.success) throw new DomainError("invalid_enquiry_block");
    const { key, blocked, version } = parsed.data;
    return this.store.transaction(async (db) => {
      await this.service.access(db, p, seller, true);
      const thread = await this.thread(db, p, seller, id);
      const current = await this.contactControl(
        db,
        seller,
        thread.buyer_id,
        true,
      );
      if (current.request_key === key) {
        if (
          current.changed_by !== p.userId ||
          current.blocked !== blocked ||
          current.version !== version + 1
        )
          throw new DomainError("idempotency_conflict", 409);
        return { blocked: current.blocked, version: current.version };
      }
      if (current.version !== version)
        throw new DomainError("version_conflict", 409);
      await db.query(
        "UPDATE troc.store_enquiry_controls SET blocked=$3,version=version+1,changed_by=$4,changed_at=now(),request_key=$5 WHERE seller_id=$1 AND buyer_id=$2",
        [seller, thread.buyer_id, blocked, p.userId, key],
      );
      await this.service.audit(
        db,
        p,
        "enquiry.contact_control",
        "seller",
        seller,
        { buyerId: thread.buyer_id, blocked, version: version + 1 },
      );
      return { blocked, version: version + 1 };
    });
  }
  async seller(db: Sql, p: Principal, seller: string) {
    const account = await this.service.access(db, p, seller);
    // Derive permissions from the checked database role, not stale session claims.
    const current: Principal = {
      userId: p.userId,
      roles: account.role === "admin" ? ["admin"] : [],
      memberships:
        account.role === "admin"
          ? []
          : [
              {
                sellerId: seller,
                role: account.role as SellerRole,
                active: true,
              },
            ],
    };
    if (!can(current, "messages:reply", seller))
      throw new DomainError("forbidden", 403);
  }
  async list(p: Principal, seller: string) {
    return (await this.listPage(p, seller)).items;
  }
  async listPage(p: Principal, seller: string, before?: string) {
    await this.seller(this.db, p, seller);
    if (before) {
      uuid(before);
      if (
        !(
          await this.db.query(
            "SELECT id FROM troc.store_enquiries WHERE id=$1 AND seller_id=$2",
            [before, seller],
          )
        ).rows.length
      )
        throw new DomainError("invalid_cursor");
    }
    const rows = (
      await this.db.query(
        `SELECT e.id,e.subject,e.created_at,'Collector '||right(e.buyer_id::text,4) AS buyer,
      (SELECT body FROM troc.store_enquiry_messages WHERE enquiry_id=e.id ORDER BY created_at DESC,id DESC LIMIT 1) AS preview,
      (SELECT count(*)::int FROM troc.store_enquiry_messages m WHERE m.enquiry_id=e.id AND m.actor_id<>$2 AND NOT EXISTS(SELECT 1 FROM troc.store_enquiry_reads r WHERE r.user_id=$2 AND r.message_id=m.id)) AS unread_count
      FROM troc.store_enquiries e WHERE seller_id=$1 AND ($3::uuid IS NULL OR (e.created_at,e.id)<(SELECT created_at,id FROM troc.store_enquiries WHERE id=$3 AND seller_id=$1))
      ORDER BY e.created_at DESC,e.id DESC LIMIT 51`,
        [seller, p.userId, before ?? null],
      )
    ).rows;
    return {
      items: rows.slice(0, 50),
      nextBefore: rows.length > 50 ? rows[49].id : null,
    };
  }
  async thread(db: Sql, p: Principal, seller: string, id: string) {
    uuid(seller);
    uuid(id);
    await this.service.actor(db, p);
    const thread = (
      await db.query<Thread>(
        "SELECT id,seller_id,buyer_id,subject FROM troc.store_enquiries WHERE id=$1 AND seller_id=$2",
        [id, seller],
      )
    ).rows[0];
    if (!thread) throw new DomainError("not_found", 404);
    if (thread.buyer_id !== p.userId) await this.seller(db, p, seller);
    return thread;
  }
  async read(p: Principal, seller: string, id: string, before?: string) {
    const thread = await this.thread(this.db, p, seller, id);
    if (before) {
      uuid(before);
      if (
        !(
          await this.db.query(
            "SELECT id FROM troc.store_enquiry_messages WHERE id=$1 AND enquiry_id=$2",
            [before, id],
          )
        ).rows.length
      )
        throw new DomainError("invalid_cursor");
    }
    const messages = (
      await this.db.query(
        `SELECT id,author,body,created_at FROM troc.store_enquiry_messages
       WHERE enquiry_id=$1 AND ($2::uuid IS NULL OR (created_at,id) <
         (SELECT created_at,id FROM troc.store_enquiry_messages WHERE id=$2 AND enquiry_id=$1))
       ORDER BY created_at DESC,id DESC LIMIT 101`,
        [id, before ?? null],
      )
    ).rows;
    const control = await this.contactControl(this.db, seller, thread.buyer_id);
    const canManageBlock =
      thread.buyer_id !== p.userId &&
      ["owner", "admin"].includes(
        String((await this.service.access(this.db, p, seller)).role),
      );
    const hasMore = messages.length > 100;
    const page = messages.slice(0, 100);
    return {
      ...thread,
      contactControl: {
        blocked: control.blocked,
        version: control.version,
        canManageBlock,
      },
      messages: page.reverse(),
      nextBefore: hasMore ? page[0].id : null,
    };
  }
  async markRead(p: Principal, seller: string, id: string) {
    return this.store.transaction(async (db) => {
      await this.thread(db, p, seller, id);
      await db.query(
        "INSERT INTO troc.store_enquiry_reads(user_id,message_id) SELECT $1,id FROM troc.store_enquiry_messages WHERE enquiry_id=$2 ON CONFLICT DO NOTHING",
        [p.userId, id],
      );
      return { ok: true };
    });
  }
  async reply(p: Principal, seller: string, id: string, input: unknown) {
    const parsed = enquiryReplySchema.safeParse(input);
    if (!parsed.success)
      throw new DomainError(
        parsed.error.issues.some((i) => i.path[0] === "key")
          ? "invalid_id"
          : "invalid_message",
      );
    const { key, body } = parsed.data;
    return this.store.transaction(async (db) => {
      const thread = await this.thread(db, p, seller, id);
      const control = await this.contactControl(
        db,
        seller,
        thread.buyer_id,
        true,
      );
      await db.query("SELECT id FROM troc.users WHERE id=$1 FOR UPDATE", [
        p.userId,
      ]);
      const old = (
        await db.query<{ enquiry_id: string; body: string }>(
          "SELECT enquiry_id,body FROM troc.store_enquiry_messages WHERE actor_id=$1 AND request_key=$2",
          [p.userId, key],
        )
      ).rows[0];
      if (old) {
        if (old.enquiry_id !== id || old.body !== body)
          throw new DomainError("idempotency_conflict", 409);
        return { ok: true };
      }
      if (control.blocked) throw new DomainError("enquiry_blocked", 403);
      await db.query(
        "INSERT INTO troc.store_enquiry_messages(enquiry_id,actor_id,author,body,request_key) VALUES($1,$2,$3,$4,$5)",
        [
          id,
          p.userId,
          thread.buyer_id === p.userId ? "buyer" : "seller",
          body,
          key,
        ],
      );
      return { ok: true };
    });
  }
  async reviewReport(p: Principal, id: string, input: unknown) {
    uuid(id);
    const parsed = enquiryReportReviewSchema.safeParse(input);
    if (!parsed.success) throw new DomainError("invalid_report_review");
    const { key, decision, note } = parsed.data;
    return this.store.transaction(async (db) => {
      await this.service.admin(db, p);
      const row = (
        await db.query<{
          state: string;
          review_key: string | null;
          reviewed_by: string | null;
          review_note: string | null;
        }>(
          "SELECT state,review_key,reviewed_by,review_note FROM troc.store_enquiry_reports WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!row) throw new DomainError("not_found", 404);
      if (row.state !== "open") {
        if (
          row.review_key === key &&
          row.reviewed_by === p.userId &&
          row.state === decision &&
          row.review_note === note
        )
          return { id, status: row.state };
        throw new DomainError("report_already_reviewed", 409);
      }
      await db.query(
        "UPDATE troc.store_enquiry_reports SET state=$2,review_key=$3,reviewed_by=$4,review_note=$5,reviewed_at=now() WHERE id=$1",
        [id, decision, key, p.userId, note],
      );
      await this.service.audit(
        db,
        p,
        "enquiry.report_reviewed",
        "enquiry_report",
        id,
        { decision },
      );
      return { id, status: decision };
    });
  }
  async reports(p: Principal, before?: string) {
    if (before) uuid(before);
    return this.store.transaction(async (db) => {
      await this.service.admin(db, p);
      if (
        before &&
        !(
          await db.query(
            "SELECT id FROM troc.store_enquiry_reports WHERE id=$1",
            [before],
          )
        ).rows.length
      )
        throw new DomainError("invalid_cursor");
      const rows = (
        await db.query(
          `SELECT r.id,r.reason,r.details,r.state,r.created_at,r.reporter_id,r.message_id,r.review_note,r.reviewed_by,r.reviewed_at,
          m.body AS message_body,m.actor_id,e.id AS enquiry_id,e.seller_id,e.subject
          FROM troc.store_enquiry_reports r
          JOIN troc.store_enquiry_messages m ON m.id=r.message_id
          JOIN troc.store_enquiries e ON e.id=m.enquiry_id
          WHERE ($1::uuid IS NULL OR (r.created_at,r.id)<(SELECT created_at,id FROM troc.store_enquiry_reports WHERE id=$1))
          ORDER BY r.created_at DESC,r.id DESC LIMIT 51`,
          [before ?? null],
        )
      ).rows;
      const items = rows.slice(0, 50);
      if (items.length)
        await this.service.audit(
          db,
          p,
          "enquiry.reports_read",
          "enquiry_report",
          String(items[0].id),
          { count: items.length },
        );
      return { items, nextBefore: rows.length > 50 ? rows[49].id : null };
    });
  }
  async report(p: Principal, seller: string, id: string, input: unknown) {
    const parsed = enquiryReportSchema.safeParse(input);
    if (!parsed.success) throw new DomainError("invalid_report");
    const { key, messageId, reason, details } = parsed.data;
    return this.store.transaction(async (db) => {
      await this.thread(db, p, seller, id);
      await db.query("SELECT id FROM troc.users WHERE id=$1 FOR UPDATE", [
        p.userId,
      ]);
      const message = (
        await db.query<{ actor_id: string }>(
          "SELECT actor_id FROM troc.store_enquiry_messages WHERE id=$1 AND enquiry_id=$2",
          [messageId, id],
        )
      ).rows[0];
      if (!message) throw new DomainError("not_found", 404);
      if (message.actor_id === p.userId)
        throw new DomainError("cannot_report_own_message");
      const existing = (
        await db.query<{
          id: string;
          message_id: string;
          reason: string;
          details: string;
          state: string;
        }>(
          "SELECT id,message_id,reason,details,state FROM troc.store_enquiry_reports WHERE reporter_id=$1 AND (request_key=$2 OR message_id=$3)",
          [p.userId, key, messageId],
        )
      ).rows;
      if (existing.length) {
        if (
          existing.length !== 1 ||
          existing[0].message_id !== messageId ||
          existing[0].reason !== reason ||
          existing[0].details !== details
        )
          throw new DomainError("idempotency_conflict", 409);
        return { id: existing[0].id, status: existing[0].state };
      }
      const row = (
        await db.query<{ id: string; state: string }>(
          "INSERT INTO troc.store_enquiry_reports(message_id,reporter_id,reason,details,request_key) VALUES($1,$2,$3,$4,$5) RETURNING id,state",
          [messageId, p.userId, reason, details, key],
        )
      ).rows[0];
      await this.service.audit(
        db,
        p,
        "enquiry.reported",
        "enquiry_report",
        row.id,
        { messageId, reason },
      );
      return { id: row.id, status: row.state };
    });
  }
  async create(p: Principal, seller: string, input: unknown) {
    uuid(seller);
    const parsed = enquiryCreateSchema.safeParse(input);
    if (!parsed.success)
      throw new DomainError(
        parsed.error.issues.some((i) => i.path[0] === "key")
          ? "invalid_id"
          : "invalid_enquiry",
      );
    const { key, subject, body } = parsed.data;
    return this.store.transaction(async (db) => {
      await this.service.actor(db, p);

      if (
        !(
          await db.query(
            "SELECT id FROM troc.seller_accounts WHERE id=$1 AND status='active'",
            [seller],
          )
        ).rows.length
      )
        throw new DomainError("not_found", 404);
      const control = await this.contactControl(db, seller, p.userId, true);
      await db.query("SELECT id FROM troc.users WHERE id=$1 FOR UPDATE", [
        p.userId,
      ]);
      const old = (
        await db.query<Thread>(
          "SELECT * FROM troc.store_enquiries WHERE buyer_id=$1 AND request_key=$2",
          [p.userId, key],
        )
      ).rows[0];
      if (old) {
        const first = (
          await db.query<{ body: string }>(
            "SELECT body FROM troc.store_enquiry_messages WHERE enquiry_id=$1 AND request_key=$2",
            [old.id, key],
          )
        ).rows[0];
        if (
          old.seller_id !== seller ||
          old.subject !== subject ||
          first?.body !== body
        )
          throw new DomainError("idempotency_conflict", 409);
        return { id: old.id };
      }
      if (control.blocked) throw new DomainError("enquiry_blocked", 403);
      const r = (
        await db.query<{ id: string }>(
          "INSERT INTO troc.store_enquiries(seller_id,buyer_id,subject,request_key) VALUES($1,$2,$3,$4) RETURNING id",
          [seller, p.userId, subject, key],
        )
      ).rows[0];
      await db.query(
        "INSERT INTO troc.store_enquiry_messages(enquiry_id,actor_id,author,body,request_key) VALUES($1,$2,'buyer',$3,$4)",
        [r.id, p.userId, body, key],
      );
      return r;
    });
  }
}
