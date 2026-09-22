import { randomUUID } from "node:crypto";
import type { Principal } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { TransactionStore } from "../commerce/checkout";
import { DomainError } from "../shared/domain";
import { application, roles, text, uuid } from "./domain";
export class SellerPlatformService {
  constructor(
    private db: Sql,
    private store: TransactionStore,
  ) {}
  async actor(db: Sql, p: Principal) {
    if (
      !p?.userId ||
      !(
        await db.query(
          "SELECT id FROM troc.users WHERE id=$1 AND status='active'",
          [p.userId],
        )
      ).rows.length
    )
      throw new DomainError("unauthorized", 401);
  }
  async admin(db: Sql, p: Principal) {
    await this.actor(db, p);
    if (
      !(
        await db.query(
          "SELECT 1 FROM troc.user_roles WHERE user_id=$1 AND role='admin'",
          [p.userId],
        )
      ).rows.length
    )
      throw new DomainError("forbidden", 403);
  }
  async access(
    db: Sql,
    p: Principal,
    seller: string,
    owner = false,
    lock = false,
  ) {
    await this.actor(db, p);
    uuid(seller);
    const account = (
      await db.query(
        "SELECT id,display_name,status,level_id,plan_id FROM troc.seller_accounts WHERE id=$1 AND status='active'" +
          (lock ? " FOR UPDATE" : ""),
        [seller],
      )
    ).rows[0];
    const member = (
      await db.query<{ role: string }>(
        "SELECT role FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",
        [seller, p.userId],
      )
    ).rows[0];
    if (!account || !member || (owner && member.role !== "owner"))
      throw new DomainError("forbidden", 403);
    return { ...account, role: member.role };
  }
  async audit(
    db: Sql,
    p: Principal,
    action: string,
    entity: string,
    id: string,
    metadata: unknown = {},
  ) {
    await db.query(
      "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,$3,$4,$5)",
      [p.userId, action, entity, id, JSON.stringify(metadata)],
    );
  }
  async submit(p: Principal, input: unknown) {
    const v = application(input);
    return this.store.transaction(async (db) => {
      await this.actor(db, p);
      await db.query("SELECT id FROM troc.users WHERE id=$1 FOR UPDATE", [
        p.userId,
      ]);
      if (
        (
          await db.query(
            "SELECT 1 FROM troc.seller_applications WHERE applicant_id=$1 AND status IN ('submitted','approved')",
            [p.userId],
          )
        ).rows.length
      )
        throw new DomainError("application_exists", 409);
      const row = (
        await db.query(
          "INSERT INTO troc.seller_applications(applicant_id,contact_name,country,province,seller_type,adult_confirmed,profile) VALUES($1,$2,'CA',$3,$4,true,$5) RETURNING id,status,created_at",
          [
            p.userId,
            v.contactName,
            v.province,
            v.sellerType,
            JSON.stringify(v.profile),
          ],
        )
      ).rows[0];
      await this.audit(
        db,
        p,
        "seller.application.submitted",
        "seller_application",
        String(row.id),
      );
      return row;
    });
  }
  async applications(p: Principal, admin = false, page = 0) {
    if (!Number.isSafeInteger(page) || page < 0 || page > 10000)
      throw new DomainError("invalid_page");
    if (admin) await this.admin(this.db, p);
    else await this.actor(this.db, p);
    return (
      await this.db.query(
        "SELECT id,applicant_id,contact_name,province,seller_type,status,seller_id,profile,review_note,reviewed_at,created_at FROM troc.seller_applications WHERE ($1::boolean OR applicant_id=$2) ORDER BY created_at DESC,id LIMIT 50 OFFSET $3",
        [admin, p.userId, page * 50],
      )
    ).rows;
  }
  async review(p: Principal, id: string, input: Record<string, unknown>) {
    uuid(id);
    const decision = input.decision,
      note = text(input.note, 2000);
    if (decision !== "approved" && decision !== "rejected")
      throw new DomainError("invalid_decision");
    return this.store.transaction(async (db) => {
      await this.admin(db, p);
      const row = (
        await db.query(
          "SELECT * FROM troc.seller_applications WHERE id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!row) throw new DomainError("not_found", 404);
      if (row.status !== "submitted")
        throw new DomainError("application_already_reviewed", 409);
      if (row.applicant_id === p.userId)
        throw new DomainError("self_approval_forbidden", 403);
      let sellerId: string | null = null;
      if (decision === "approved") {
        if (
          !(
            await db.query(
              "SELECT id FROM troc.users WHERE id=$1 AND status='active' FOR UPDATE",
              [row.applicant_id],
            )
          ).rows.length
        )
          throw new DomainError("applicant_inactive", 409);
        sellerId = randomUUID();
        // Requested verified categories confer no badge, KYC or payout verification.
        const displayName = text(
          input.displayName ??
            (row.profile as Record<string, unknown>).displayName ??
            row.contact_name,
        );
        await db.query(
          "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,$2,$3,$4,'active')",
          [sellerId, "seller-" + sellerId, displayName, row.seller_type],
        );
        await db.query(
          "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
          [sellerId, row.applicant_id],
        );
        await db.query(
          "INSERT INTO troc.seller_settings(seller_id) VALUES($1)",
          [sellerId],
        );
        await db.query(
          "INSERT INTO troc.seller_verification_status(seller_id) VALUES($1)",
          [sellerId],
        );
      }
      await db.query(
        "UPDATE troc.seller_applications SET status=$2,seller_id=$3,reviewed_by=$4,reviewed_at=now(),review_note=$5,updated_at=now() WHERE id=$1",
        [id, decision, sellerId, p.userId, note],
      );
      await this.audit(
        db,
        p,
        "seller.application." + decision,
        "seller_application",
        id,
        { sellerId, note, previousStatus: row.status },
      );
      return { id, status: decision, sellerId };
    });
  }
  async sellers(p: Principal) {
    await this.actor(this.db, p);
    return (
      await this.db.query(
        "SELECT s.id,s.display_name,s.status,m.role FROM troc.seller_accounts s JOIN troc.seller_members m ON m.seller_id=s.id WHERE m.user_id=$1 ORDER BY s.display_name,s.id",
        [p.userId],
      )
    ).rows;
  }
  async team(p: Principal, seller: string) {
    await this.access(this.db, p, seller, true);
    return (
      await this.db.query(
        "SELECT m.user_id,m.role,u.email,u.status FROM troc.seller_members m JOIN troc.users u ON u.id=m.user_id WHERE seller_id=$1 ORDER BY m.created_at,m.user_id",
        [seller],
      )
    ).rows;
  }
  async member(p: Principal, seller: string, input: Record<string, unknown>) {
    const user = uuid(input.userId),
      role = input.role;
    if (role !== null && !roles.includes(role as (typeof roles)[number]))
      throw new DomainError("invalid_role");
    return this.store.transaction(async (db) => {
      await this.access(db, p, seller, true, true);
      const old = (
        await db.query<{ role: string }>(
          "SELECT role FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",
          [seller, user],
        )
      ).rows[0];
      if (
        old?.role === "owner" &&
        role !== "owner" &&
        Number(
          (
            await db.query(
              "SELECT count(*) AS n FROM troc.seller_members m JOIN troc.users u ON u.id=m.user_id WHERE seller_id=$1 AND role='owner' AND u.status='active'",
              [seller],
            )
          ).rows[0].n,
        ) <= 1
      )
        throw new DomainError("last_owner", 409);
      if (role === null)
        await db.query(
          "DELETE FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",
          [seller, user],
        );
      else {
        if (
          !(
            await db.query(
              "SELECT id FROM troc.users WHERE id=$1 AND status='active'",
              [user],
            )
          ).rows.length
        )
          throw new DomainError("member_unavailable", 404);
        await db.query(
          "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT(seller_id,user_id) DO UPDATE SET role=excluded.role",
          [seller, user, role],
        );
      }
      await this.audit(
        db,
        p,
        "seller.member.changed",
        "seller_account",
        seller,
        { userId: user, previousRole: old?.role ?? null, role },
      );
      return { ok: true };
    });
  }
  async dashboard(p: Principal, seller: string) {
    const account = await this.access(this.db, p, seller);
    const inventory = (
      await this.db.query(
        "SELECT count(*) FILTER(WHERE status='active' AND quantity>0)::int AS active_listings, COALESCE(sum(quantity) FILTER(WHERE status='active'),0)::text AS units, COALESCE(sum(quantity::bigint*COALESCE(sale_cents,unit_price_cents)) FILTER(WHERE status='active'),0)::text AS asking_value_cents FROM troc.listings WHERE seller_id=$1 AND demo_batch_id IS NULL",
        [seller],
      )
    ).rows[0];
    const sales = (
      await this.db.query(
        "SELECT count(*)::int AS completed_orders,COALESCE(sum(s.merchandise_cents-s.discount_cents),0)::text AS merchandise_cents FROM troc.seller_orders s JOIN troc.marketplace_orders m ON m.id=s.marketplace_order_id WHERE s.seller_id=$1 AND s.status='completed' AND m.status='completed' AND m.demo_batch_id IS NULL AND m.payment_id IS NOT NULL AND m.payment_id NOT LIKE 'sim%' AND s.refunded_cents=0",
        [seller],
      )
    ).rows[0];
    return {
      account,
      inventory,
      sales,
      currency: "CAD",
      methodology: "completed_non_demo_non_simulated_orders_excluding_refunds",
      analyticsAvailable: false,
    };
  }
}
