import { createHash } from "node:crypto";
import type { Principal } from "../auth/permissions";
import type { TransactionStore } from "../commerce/checkout";
import type { Sql } from "../commerce/data";
import { DomainError } from "../shared/domain";
import { uuid, text } from "./domain";
import type { SellerPlatformService } from "./service";
type Invitation = {
  id: string;
  seller_id: string;
  recipient_user_id: string;
  invited_by: string;
  role: string;
  status: string;
  expired: boolean;
};
const fields =
  "id,seller_id,recipient_user_id,invited_by,role,status,expires_at<=clock_timestamp() AS expired";
export class TeamInvitations {
  constructor(
    private store: TransactionStore,
    private service: SellerPlatformService,
  ) {}
  async create(p: Principal, seller: string, input: Record<string, unknown>) {
    const email = text(input.email, 254).toLowerCase(),
      role = input.role;
    if (
      !email.includes("@") ||
      typeof role !== "string" ||
      !["manager", "inventory", "fulfillment", "customer_service"].includes(
        role,
      ) ||
      Object.keys(input).some((k) => !["email", "role"].includes(k))
    )
      throw new DomainError("invalid_input");
    return this.store.transaction(async (db) => {
      await this.service.access(db, p, seller, true, true);
      const recipient = (
        await db.query<{ id: string }>(
          "SELECT id FROM troc.users WHERE lower(email)=$1 AND status='active'",
          [email],
        )
      ).rows[0];
      if (!recipient || recipient.id === p.userId)
        throw new DomainError("member_unavailable", 404);
      if (
        (
          await db.query(
            "SELECT 1 FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",
            [seller, recipient.id],
          )
        ).rows.length
      )
        throw new DomainError("already_member", 409);
      const pending = (
        await db.query<Invitation>(
          "SELECT " +
            fields +
            " FROM troc.seller_team_invitations WHERE seller_id=$1 AND recipient_user_id=$2 AND status='pending' FOR UPDATE",
          [seller, recipient.id],
        )
      ).rows[0];
      if (pending && !pending.expired) {
        if (pending.role !== role || pending.invited_by !== p.userId)
          throw new DomainError("invitation_pending", 409);
        return { id: pending.id, status: pending.status };
      }
      if (pending) await this.finish(db, p, pending, "expired");
      const row = (
        await db.query<{ id: string; status: string }>(
          "INSERT INTO troc.seller_team_invitations(seller_id,recipient_user_id,invited_by,role) VALUES($1,$2,$3,$4) RETURNING id,status",
          [seller, recipient.id, p.userId, role],
        )
      ).rows[0];
      await this.service.audit(
        db,
        p,
        "seller.invitation.created",
        "seller_team_invitation",
        row.id,
        { sellerId: seller, recipientId: recipient.id, role },
      );
      return row;
    });
  }
  async resolve(
    p: Principal,
    seller: string,
    id: string,
    action: "accept" | "decline" | "revoke",
  ) {
    uuid(seller);
    uuid(id);
    if (!["accept", "decline", "revoke"].includes(action))
      throw new DomainError("invalid_input");
    return this.store.transaction(async (db) => {
      // All invitation writes take the same seller -> invitation lock order as member writes.
      if (action === "revoke")
        await this.service.access(db, p, seller, true, true);
      else {
        await this.service.actor(db, p);
        if (
          !(
            await db.query(
              "SELECT id FROM troc.seller_accounts WHERE id=$1 AND status='active' FOR UPDATE",
              [seller],
            )
          ).rows.length
        )
          throw new DomainError("invitation_unavailable", 404);
      }
      const row = (
        await db.query<Invitation>(
          "SELECT " +
            fields +
            " FROM troc.seller_team_invitations WHERE seller_id=$1 AND id=$2 FOR UPDATE",
          [seller, id],
        )
      ).rows[0];
      if (!row || (action !== "revoke" && row.recipient_user_id !== p.userId))
        throw new DomainError("invitation_unavailable", 404);
      const terminal = {
        accept: "accepted",
        decline: "declined",
        revoke: "revoked",
      }[action];
      if (row.status === terminal) return { id: row.id, status: row.status };
      if (row.status !== "pending")
        throw new DomainError("invitation_resolved", 409);
      if (row.expired) {
        await this.finish(db, p, row, "expired");
        return { id: row.id, status: "expired" };
      }
      if (action === "accept") {
        // Recheck inviter against current DB authority, never their historical invitation role.
        await this.service.access(
          db,
          { ...p, userId: row.invited_by },
          seller,
          true,
        );
        if (
          (
            await db.query(
              "SELECT 1 FROM troc.seller_members WHERE seller_id=$1 AND user_id=$2",
              [seller, p.userId],
            )
          ).rows.length
        )
          throw new DomainError("already_member", 409);
        await db.query(
          "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,$3)",
          [seller, p.userId, row.role],
        );
      }
      await this.finish(db, p, row, terminal);
      return { id: row.id, status: terminal };
    });
  }
  async list(
    p: Principal,
    seller: string | null,
    input: Record<string, unknown>,
  ) {
    if (Object.keys(input).some((k) => k !== "cursor"))
      throw new DomainError("invalid_input");
    const scope = createHash("sha256")
      .update(JSON.stringify([p.userId, seller]))
      .digest("hex");
    let after: { at: string; id: string } | undefined;
    if (input.cursor !== undefined) {
      try {
        if (
          typeof input.cursor !== "string" ||
          input.cursor.length > 1024 ||
          !/^[A-Za-z0-9_-]+$/.test(input.cursor)
        )
          throw new Error();
        const decoded = JSON.parse(
          Buffer.from(input.cursor, "base64url").toString("utf8"),
        );
        if (
          decoded.v !== 1 ||
          decoded.scope !== scope ||
          typeof decoded.at !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(decoded.at) ||
          !Number.isFinite(Date.parse(decoded.at))
        )
          throw new Error();
        after = { at: decoded.at, id: uuid(decoded.id) };
      } catch {
        throw new DomainError("invalid_cursor");
      }
    }
    return this.store.transaction(async (db) => {
      if (seller) await this.service.access(db, p, seller, true);
      else await this.service.actor(db, p);
      const args: unknown[] = [seller ?? p.userId];
      let seek = "";
      if (after) {
        args.push(after.at, after.id);
        seek = " AND (i.created_at,i.id)<($2::timestamptz,$3::uuid)";
      }
      const rows = (
        await db.query<{
          id: string;
          createdAt: string;
          [key: string]: unknown;
        }>(
          'SELECT i.id,i.seller_id AS "sellerId",a.display_name AS "storeName",i.recipient_user_id AS "recipientId",u.email AS "recipientEmail",i.invited_by AS "invitedBy",sender.email AS "inviterEmail",i.role,CASE WHEN i.status=\'pending\' AND i.expires_at<=clock_timestamp() THEN \'expired\' ELSE i.status END AS status,to_char(i.created_at AT TIME ZONE \'UTC\',\'YYYY-MM-DD"T"HH24:MI:SS.US"Z"\') AS "createdAt",i.expires_at AS "expiresAt" FROM troc.seller_team_invitations i JOIN troc.seller_accounts a ON a.id=i.seller_id JOIN troc.users u ON u.id=i.recipient_user_id JOIN troc.users sender ON sender.id=i.invited_by WHERE ' +
            (seller ? "i.seller_id=$1" : "i.recipient_user_id=$1") +
            seek +
            " ORDER BY i.created_at DESC,i.id DESC LIMIT 26",
          args,
        )
      ).rows;
      const invitations = rows.slice(0, 25),
        last = invitations.at(-1);
      return {
        invitations,
        nextCursor:
          rows.length > 25 && last
            ? Buffer.from(
                JSON.stringify({
                  v: 1,
                  scope,
                  at: last.createdAt,
                  id: last.id,
                }),
              ).toString("base64url")
            : null,
      };
    });
  }
  private async finish(db: Sql, p: Principal, row: Invitation, status: string) {
    await db.query(
      "UPDATE troc.seller_team_invitations SET status=$2,resolved_at=clock_timestamp() WHERE id=$1",
      [row.id, status],
    );
    await this.service.audit(
      db,
      p,
      "seller.invitation." + status,
      "seller_team_invitation",
      row.id,
      {
        sellerId: row.seller_id,
        recipientId: row.recipient_user_id,
        role: row.role,
      },
    );
  }
}
