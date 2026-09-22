import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { Sql } from "../commerce/data";
import type { TransactionStore } from "../commerce/checkout";
import type { Principal } from "../auth/permissions";
import { DomainError } from "../shared/domain";
import {
  choice,
  cohorts,
  consentVersion,
  id,
  kind,
  object,
  secret,
  signup,
  statuses,
  text,
  type Kind,
} from "./validation";

const tables = {
  collector: "troc.buyer_waitlist",
  seller: "troc.founding_seller_leads",
};
type Session = {
  id: string;
  kind: Kind | "landing";
  source: string;
  referral_code: string | null;
  analytics_consent: boolean;
};
export function admin(p: Principal | null): asserts p is Principal {
  if (!p) throw new DomainError("unauthorized", 401);
  if (!p.roles.includes("admin")) throw new DomainError("forbidden", 403);
}
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
export class PrelaunchService {
  constructor(
    private db: Sql,
    private store: TransactionStore,
    private signingKey: string,
  ) {
    if (signingKey.length < 32) throw new Error("prelaunch_secret_required");
  }
  private sign(v: string) {
    return createHmac("sha256", this.signingKey).update(v).digest("base64url");
  }
  async throttle(
    address: string,
    scope: "acquisition" | "withdrawal" = "acquisition",
  ) {
    const window = Math.floor(Date.now() / 900000);
    const key = this.sign(`${scope}:${window}:${address}`);
    const row = (
      await this.db.query<{ hits: number }>(
        `INSERT INTO troc.prelaunch_rate_windows(key,hits,expires_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=prelaunch_rate_windows.hits+1 RETURNING hits`,
        [key],
      )
    ).rows[0];
    if (row.hits > 40) throw new DomainError("rate_limited", 429);
  }
  async session(value: unknown) {
    const v = object(value),
      audience = choice(v.kind, ["landing", "collector", "seller"]);
    const source = choice(v.source ?? "direct", [
      "direct",
      "newsletter",
      "social",
      "event",
      "partner",
    ]);
    if (typeof v.analyticsConsent !== "boolean")
      throw new DomainError("invalid_input");
    const referral = text(v.referral ?? "", 64);
    const valid =
      referral &&
      (
        await this.db.query(
          `SELECT code FROM troc.prelaunch_referrals WHERE code=$1 AND active`,
          [referral],
        )
      ).rows.length;
    const sessionId = randomUUID();
    await this.db.query(
      `INSERT INTO troc.prelaunch_sessions(id,kind,source,referral_code,analytics_consent,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '24 hours')`,
      [
        sessionId,
        audience,
        source,
        valid ? referral : null,
        v.analyticsConsent,
      ],
    );
    return { token: `${sessionId}.${this.sign(sessionId)}`, consentVersion };
  }
  private async sessionFor(db: Sql, token: unknown) {
    const parts = text(token, 100).split(".");
    const sessionId = id(parts[0]),
      supplied = Buffer.from(parts[1] ?? ""),
      expected = Buffer.from(this.sign(sessionId));
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      throw new DomainError("invalid_session", 403);
    const s = (
      await db.query<Session>(
        `SELECT * FROM troc.prelaunch_sessions WHERE id=$1 AND expires_at>now()`,
        [sessionId],
      )
    ).rows[0];
    if (!s) throw new DomainError("session_expired", 400);
    return s;
  }
  private async event(db: Sql, s: Session, name: string, provenance: string) {
    if (s.analytics_consent)
      await db.query(
        `INSERT INTO troc.prelaunch_events(session_id,name,provenance) VALUES($1,$2,$3) ON CONFLICT(session_id,name) DO NOTHING`,
        [s.id, name, provenance],
      );
  }
  async sessionPreferences(value: unknown) {
    const v = object(value);
    if (typeof v.analyticsConsent !== "boolean")
      throw new DomainError("invalid_input");
    await this.store.transaction(async (db) => {
      const s = await this.sessionFor(db, v.token),
        next =
          v.kind === undefined
            ? s.kind
            : choice(v.kind, ["landing", "collector", "seller"]);
      // Audience may be chosen once; source/referrer never change. Consent toggles preserve dedup identity.
      const result = await db.query(
        `UPDATE troc.prelaunch_sessions SET analytics_consent=$2,kind=$3 WHERE id=$1 AND (kind='landing' OR kind=$3) RETURNING id`,
        [s.id, v.analyticsConsent, next],
      );
      if (!result.rows.length) throw new DomainError("session_conflict", 409);
    });
  }
  async observe(value: unknown) {
    const v = object(value),
      s = await this.sessionFor(this.db, v.token);
    await this.event(
      this.db,
      s,
      choice(v.name, ["landing_visit", "cta", "form_start"]),
      "client_observed",
    );
  }
  async capture(value: unknown) {
    const v = object(value);
    return this.store.transaction(async (db) => {
      const s = await this.sessionFor(db, v.token),
        audience = kind(s.kind),
        data = signup(v, audience),
        table = tables[audience];
      // Serializes retries and differently-cased submissions without deleting legacy duplicates.
      await db.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
        `${s.kind}:${data.email}`,
      ]);
      const prior = await db.query(
        `SELECT id FROM ${table} WHERE lower(btrim(email))=$1 LIMIT 1`,
        [data.email],
      );
      if (prior.rows.length) return; // Never disclose, overwrite attribution, or re-consent by email alone.
      const referral =
        (s.referral_code &&
          (
            await db.query<{ code: string }>(
              `SELECT r.code FROM troc.prelaunch_referrals r LEFT JOIN troc.buyer_waitlist b ON b.id=r.collector_lead_id LEFT JOIN troc.founding_seller_leads f ON f.id=r.seller_lead_id WHERE r.code=$1 AND r.active AND (b.id IS NULL OR (b.unsubscribed_at IS NULL AND lower(btrim(b.email))<>$2)) AND (f.id IS NULL OR (f.unsubscribed_at IS NULL AND lower(btrim(f.email))<>$2))`,
              [s.referral_code, data.email],
            )
          ).rows[0]?.code) ||
        null;
      const lead = (
        await db.query<{ id: string }>(
          `INSERT INTO ${table}(email,locale,consent_version,consented_at,details,acquisition,withdrawal_hash) VALUES($1,$2,$3,now(),$4::jsonb,$5::jsonb,$6) RETURNING id`,
          [
            data.email,
            data.locale,
            consentVersion,
            JSON.stringify(data.details),
            JSON.stringify({
              source: s.source,
              referral,
              provenance: "unverified_acquisition",
              sessionId: s.id,
            }),
            hash(data.withdrawal),
          ],
        )
      ).rows[0];
      await db.query(
        `INSERT INTO troc.audit_events(action,entity_type,entity_id,metadata) VALUES('prelaunch.consent_granted',$1,$2,$3::jsonb)`,
        [
          s.kind === "collector" ? "buyer_waitlist" : "founding_seller_leads",
          lead.id,
          JSON.stringify({
            version: consentVersion,
            purpose: "prelaunch_updates",
            emailVerified: false,
          }),
        ],
      );
      await this.event(db, s, "completion", "server_recorded");
      if (referral) await this.event(db, s, "referral", "server_recorded");
    });
  }
  async withdraw(value: unknown) {
    const v = object(value),
      audience = kind(v.kind),
      digest = hash(secret(v.withdrawal));
    await this.store.transaction(async (db) => {
      const rows = (
        await db.query<{ id: string }>(
          `UPDATE ${tables[audience]} SET unsubscribed_at=now(),cohort='unassigned',revision=revision+1 WHERE withdrawal_hash=$1 AND unsubscribed_at IS NULL RETURNING id`,
          [digest],
        )
      ).rows;
      for (const row of rows)
        await db.query(
          `INSERT INTO troc.audit_events(action,entity_type,entity_id) VALUES('prelaunch.consent_withdrawn',$1,$2)`,
          [
            audience === "collector"
              ? "buyer_waitlist"
              : "founding_seller_leads",
            row.id,
          ],
        );
    });
  }
  async list(p: Principal | null, value: unknown) {
    admin(p);
    const v = object(value),
      audience = kind(v.kind),
      filter: Record<string, string> = {};
    for (const field of ["province", "inventory", "experience", "sellerType"])
      if (v[field]) filter[field] = text(v[field], 50);
    for (const field of ["games", "software", "channels"])
      if (v[field]) Object.assign(filter, { [field]: [text(v[field], 50)] });
    const cohort = v.cohort ? choice(v.cohort, cohorts) : null,
      status = v.status ? choice(v.status, statuses) : null;
    const page = Number(v.page ?? 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > 10000)
      throw new DomainError("invalid_input");
    const rows = (
      await this.db.query(
        `SELECT id,email,locale,details,acquisition,cohort,lead_status,consented_at,unsubscribed_at,created_at,revision FROM ${tables[audience]} WHERE details @> $1::jsonb AND ($2::text IS NULL OR cohort=$2) AND ($3::text IS NULL OR lead_status=$3) ORDER BY created_at DESC,id LIMIT 51 OFFSET $4`,
        [JSON.stringify(filter), cohort, status, page * 50],
      )
    ).rows;
    await this.db.query(
      `INSERT INTO troc.audit_events(actor_id,action,entity_type,metadata) VALUES($1,'prelaunch.leads_read',$2,$3::jsonb)`,
      [
        p.userId,
        tables[audience].replace("troc.", ""),
        JSON.stringify({ page, count: rows.length }),
      ],
    );
    return rows;
  }
  async update(
    p: Principal | null,
    audience: unknown,
    lead: unknown,
    value: unknown,
  ) {
    admin(p);
    const table = tables[kind(audience)],
      leadId = id(lead),
      v = object(value);
    const cohort = choice(v.cohort, cohorts),
      status = choice(v.status, statuses);
    if (!Number.isSafeInteger(v.revision) || Number(v.revision) < 1)
      throw new DomainError("invalid_input");
    await this.store.transaction(async (db) => {
      const result = await db.query(
        `UPDATE ${table} SET cohort=$1,lead_status=$2,revision=revision+1 WHERE id=$3 AND revision=$4 AND (unsubscribed_at IS NULL OR $1='unassigned') RETURNING id`,
        [cohort, status, leadId, v.revision],
      );
      if (!result.rows.length) throw new DomainError("lead_conflict", 409);
      await db.query(
        `INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'prelaunch.review',$2,$3,$4::jsonb)`,
        [
          p.userId,
          table.replace("troc.", ""),
          leadId,
          JSON.stringify({ cohort, status, revision: v.revision }),
        ],
      );
    });
  }
  async referral(p: Principal | null, value: unknown = {}) {
    admin(p);
    const v = object(value),
      audience = v.kind === undefined ? null : kind(v.kind),
      leadId = audience ? id(v.leadId) : null;
    const code = randomBytes(12).toString("base64url");
    await this.store.transaction(async (db) => {
      if (
        audience &&
        !(
          await db.query(
            `SELECT id FROM ${tables[audience]} WHERE id=$1 AND unsubscribed_at IS NULL FOR UPDATE`,
            [leadId],
          )
        ).rows.length
      )
        throw new DomainError("lead_unavailable", 409);
      await db.query(
        "INSERT INTO troc.prelaunch_referrals(code,created_by,collector_lead_id,seller_lead_id) VALUES($1,$2,$3,$4)",
        [
          code,
          p.userId,
          audience === "collector" ? leadId : null,
          audience === "seller" ? leadId : null,
        ],
      );
      await db.query(
        `INSERT INTO troc.audit_events(actor_id,action,entity_type,metadata) VALUES($1,'prelaunch.referral_created','prelaunch_referrals',$2::jsonb)`,
        [p.userId, JSON.stringify({ code })],
      );
    });
    return { code };
  }
  async metrics(p: Principal | null) {
    admin(p);
    const events = (
      await this.db.query(
        `SELECT s.kind,e.name,e.provenance,count(*)::integer AS count FROM troc.prelaunch_events e JOIN troc.prelaunch_sessions s ON s.id=e.session_id GROUP BY s.kind,e.name,e.provenance ORDER BY s.kind,e.name`,
      )
    ).rows;
    return {
      events,
      coverage: "consenting_sessions_only",
      notInstrumented: [
        "invitation",
        "account_activation",
        "seller_activation",
        "first_inventory",
        "first_transaction",
      ],
    };
  }
}
