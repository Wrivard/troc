import { promotionDraftSchema } from "@workspace/api-zod";
import type { Promotion } from "@workspace/commerce";
import type { Principal } from "../auth/permissions";
import type { Sql } from "../commerce/data";
import type { TransactionStore } from "../commerce/checkout";
import { DomainError } from "../shared/domain";
import { uuid } from "./domain";
import type { SellerPlatformService } from "./service";

/** Explicit UTC calendar-day conversion; no inference from province or browser zone. */
export function publishableRule(
  draft: unknown,
  calendarTimeZone: unknown,
): Promotion {
  if (calendarTimeZone !== "UTC")
    throw new DomainError("explicit_promotion_timezone_required");
  const parsed = promotionDraftSchema.safeParse(draft);
  if (!parsed.success) throw new DomainError("invalid_promotion_draft");
  const d = parsed.data;
  return {
    id: d.id,
    minimumCards: d.minimum,
    ...(d.minimumCents !== undefined ? {minimumCents:d.minimumCents} : {}),
    basisPoints: d.percent * 100,
    ...(d.coupon ? { coupon: d.coupon } : {}),
    startsAt: d.start + "T00:00:00.000Z",
    endsAt: new Date(
      Date.parse(d.end + "T00:00:00.000Z") + 86400000,
    ).toISOString(),
  };
}
const version = (value: unknown) => {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < 0 ||
    Number(value) > 2147483646
  )
    throw new DomainError("invalid_promotion_version");
  return Number(value);
};
export class PromotionPublication {
  constructor(
    private db: Sql,
    private store: TransactionStore,
    private access: SellerPlatformService,
  ) {}
  async read(p: Principal, seller: string) {
    await this.access.access(this.db, p, seller, true);
    const row = (
      await this.db.query(
        "SELECT s.promotions,s.promotion_version AS version,COALESCE(d.drafts,'[]'::jsonb) AS drafts,COALESCE(d.version,0) AS \"draftVersion\" FROM troc.seller_settings s LEFT JOIN troc.seller_promotion_drafts d ON d.seller_id=s.seller_id WHERE s.seller_id=$1",
        [seller],
      )
    ).rows[0];
    if (!row) throw new DomainError("seller_settings_unavailable", 409);
    return row;
  }
  async command(p: Principal, seller: string, input: Record<string, unknown>) {
    const allowed = [
      "key",
      "version",
      "action",
      "draftId",
      "draftVersion",
      "calendarTimeZone",
    ];
    if (
      Object.keys(input).some((k) => !allowed.includes(k)) ||
      !["publish", "unpublish"].includes(String(input.action))
    )
      throw new DomainError("invalid_promotion_command");
    const request = {
      action: input.action,
      id: uuid(input.draftId),
      version: version(input.version),
      draftVersion:
        input.action === "publish" ? version(input.draftVersion) : null,
      calendarTimeZone:
        input.action === "publish" ? input.calendarTimeZone : null,
    };
    if (request.action === "publish" && request.calendarTimeZone !== "UTC")
      throw new DomainError("explicit_promotion_timezone_required");
    const key = uuid(input.key);
    return this.store.transaction(async (db) => {
      await this.access.access(db, p, seller, true, true);
      const receipt = (
        await db.query<{
          actor_id: string;
          request: unknown;
          response: unknown;
        }>(
          "SELECT actor_id,request,response FROM troc.seller_promotion_commands WHERE seller_id=$1 AND request_key=$2",
          [seller, key],
        )
      ).rows[0];
      if (receipt) {
        if (
          receipt.actor_id !== p.userId ||
          Object.entries(request).some(
            ([k, v]) => (receipt.request as Record<string, unknown>)[k] !== v,
          )
        )
          throw new DomainError("idempotency_conflict", 409);
        return receipt.response;
      }
      const settings = (
        await db.query<{ promotions: Promotion[]; version: number }>(
          "SELECT promotions,promotion_version AS version FROM troc.seller_settings WHERE seller_id=$1 FOR UPDATE",
          [seller],
        )
      ).rows[0];
      if (!settings) throw new DomainError("seller_settings_unavailable", 409);
      if (settings.version !== request.version)
        throw new DomainError("promotions_changed", 409);
      let rules = settings.promotions.filter((r) => r.id !== request.id);
      if (request.action === "publish") {
        const drafts = (
          await db.query<{ drafts: unknown[]; version: number }>(
            "SELECT drafts,version FROM troc.seller_promotion_drafts WHERE seller_id=$1 FOR UPDATE",
            [seller],
          )
        ).rows[0];
        if (!drafts || drafts.version !== request.draftVersion)
          throw new DomainError("settings_changed", 409);
        const rule = publishableRule(
          drafts.drafts.find((d) => (d as { id: string }).id === request.id),
          request.calendarTimeZone,
        );
        if (rules.length >= 20) throw new DomainError("promotion_limit", 409);
        if (rule.coupon && rules.some((r) => r.coupon === rule.coupon))
          throw new DomainError("duplicate_coupon", 409);
        rules = [...rules, rule];
      }
      const response = { promotions: rules, version: settings.version + 1 };
      await db.query(
        "UPDATE troc.seller_settings SET promotions=$2,promotion_version=$3 WHERE seller_id=$1",
        [seller, JSON.stringify(rules), response.version],
      );
      await this.access.audit(
        db,
        p,
        "seller.promotion." + request.action,
        "seller_account",
        seller,
        { promotionId: request.id, version: response.version },
      );
      await db.query(
        "INSERT INTO troc.seller_promotion_commands(seller_id,request_key,actor_id,request,response) VALUES($1,$2,$3,$4,$5)",
        [
          seller,
          key,
          p.userId,
          JSON.stringify(request),
          JSON.stringify(response),
        ],
      );
      return response;
    });
  }
}
