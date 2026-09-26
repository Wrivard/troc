import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Sql } from "../commerce/data";
import type { TransactionStore } from "../commerce/checkout";
import { DomainError } from "../shared/domain";
import { canadianAddress } from "../auth/canadian-address";
import { onboardingSignup } from "./onboarding";
import { object } from "./validation";
export const profileConsent = "account-waitlist-2026-09-v3";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const valueKeys = [
  "contactLanguage",
  "contact",
  "street",
  "city",
  "province",
  "postalCode",
  "frequency",
  "monthlySpend",
  "frustrations",
  "wishlist",
  "sellerType",
  "inventory",
  "initialListings",
  "readiness",
  "storeName",
  "storeUrl",
  "website",
];
const setKeys = [
  "games",
  "buyerChannels",
  "sellerChannels",
  "desiredFeatures",
  "software",
];
const checkKeys = ["canada", "adult", "consent", "marketing"];
const stages = [
  "intent",
  "contact",
  "location",
  "interests",
  "buyer",
  "seller",
  "review",
  "account",
];
export function draftPayload(input: unknown) {
  const v = object(input),
    values = object(v.values),
    sets = object(v.sets),
    checks = object(v.checks);
  if (
    !["buyer", "seller", "both", ""].includes(String(v.intent)) ||
    !["en", "fr"].includes(String(v.locale)) ||
    !stages.includes(String(v.step))
  )
    throw new DomainError("invalid_input");
  const cleanValues: Record<string, string> = {},
    cleanSets: Record<string, string[]> = {},
    cleanChecks: Record<string, boolean> = {};
  for (const key of valueKeys)
    if (values[key] !== undefined) {
      if (
        typeof values[key] !== "string" ||
        values[key].length >
          (key === "wishlist" ? 1000 : key === "frustrations" ? 500 : 300) ||
        [...values[key]].some(
          (c) =>
            c.charCodeAt(0) < 32 &&
            !(
              ["frustrations", "wishlist"].includes(key) &&
              [9, 10, 13].includes(c.charCodeAt(0))
            ),
        )
      )
        throw new DomainError("invalid_input");
      cleanValues[key] = values[key];
    }
  for (const key of setKeys)
    if (sets[key] !== undefined) {
      if (
        !Array.isArray(sets[key]) ||
        sets[key].length > 12 ||
        sets[key].some((x) => typeof x !== "string" || x.length > 60)
      )
        throw new DomainError("invalid_input");
      cleanSets[key] = [...new Set(sets[key] as string[])];
    }
  for (const key of checkKeys)
    if (checks[key] !== undefined) {
      if (typeof checks[key] !== "boolean")
        throw new DomainError("invalid_input");
      cleanChecks[key] = checks[key];
    }
  const source = [
    "direct",
    "newsletter",
    "social",
    "event",
    "partner",
  ].includes(String(v.source))
    ? String(v.source)
    : "direct";
  const referral =
    typeof v.referral === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(v.referral)
      ? v.referral
      : "";
  return {
    schemaVersion: 3,
    source,
    referral,
    intent: String(v.intent),
    locale: String(v.locale),
    step: String(v.step),
    values: cleanValues,
    sets: cleanSets,
    checks: cleanChecks,
  };
}
export type DraftPayload = ReturnType<typeof draftPayload>;
export function validateComplete(payload: DraftPayload) {
  const { values: v, sets: s, checks: c, intent, locale } = payload;
  if (!c.canada || !c.consent) throw new DomainError("consent_required");
  const address = canadianAddress({ ...v, country: "CA" });
  if (s.software?.includes("none") && s.software.length > 1)
    throw new DomainError("invalid_input");
  const answers = onboardingSignup({
    email: "validation@example.invalid",
    token: "",
    withdrawal: "a".repeat(43),
    consentVersion: "prelaunch-2026-09-v2",
    consent: true,
    marketingConsent: c.marketing === true,
    country: "CA",
    locale,
    intent,
    contact: v.contact,
    province: address.province,
    games: s.games,
    website: v.website || "",
    ...(intent !== "seller"
      ? {
          buyer: {
            frequency: v.frequency || "not_specified",
            monthlySpend: v.monthlySpend || "not_specified",
            channels: s.buyerChannels || [],
            desiredFeatures: s.desiredFeatures || [],
            frustrations: v.frustrations || "",
            wishlist: v.wishlist || "",
          },
        }
      : {}),
    ...(intent !== "buyer"
      ? {
          seller: {
            adult: c.adult === true,
            sellerType: v.sellerType,
            inventory: v.inventory,
            initialListings: v.initialListings,
            initialListingsScenario: "one_click_if_available",
            readiness: v.readiness,
            channels: s.sellerChannels || [],
            software: s.software || [],
            storeName: v.storeName || "",
            storeUrl: v.storeUrl || "",
          },
        }
      : {}),
  });
  return { address, answers };
}
type Row = {
  id: string;
  revision: number;
  payload: DraftPayload;
  ready: boolean;
  owner_id: string | null;
  completed_by: string | null;
  profile_revision: number | null;
  awaiting_email: boolean;
};
export class AccountOnboarding {
  constructor(
    private db: Sql,
    private store: TransactionStore,
  ) {}
  private token(token: unknown) {
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.[A-Za-z0-9_-]{43}$/.test(
        token,
      )
    )
      throw new DomainError("draft_expired", 410);
    const [id, secret] = token.split(".");
    return { id, digest: hash(secret) };
  }
  async read(token: unknown, db: Sql = this.db, lock = false) {
    const { id, digest } = this.token(token);
    const row = (
      await db.query<Row>(
        "SELECT id,revision,payload,ready,owner_id,completed_by,profile_revision,awaiting_email FROM troc.onboarding_drafts WHERE id=$1 AND secret_hash=$2 AND expires_at>now()" +
          (lock ? " FOR UPDATE" : ""),
        [id, digest],
      )
    ).rows[0];
    if (!row) throw new DomainError("draft_expired", 410);
    return row;
  }
  async save(
    token: unknown,
    input: unknown,
    revision: unknown,
    ready: boolean,
    owner: string | null = null,
  ) {
    const payload = draftPayload(input);
    if (ready) validateComplete(payload);
    return this.store.transaction(async (db) => {
      // Bounded request-driven purge; deployments also schedule this cleanup.
      await db.query(
        "DELETE FROM troc.onboarding_drafts WHERE id IN (SELECT id FROM troc.onboarding_drafts WHERE expires_at<=now() LIMIT 100)",
      );
      if (token) {
        const row = await this.read(token, db, true);
        if (row.completed_by) throw new DomainError("draft_completed", 409);
        if (row.owner_id && row.owner_id !== owner)
          throw new DomainError("forbidden", 403);
        if (!Number.isInteger(revision) || revision !== row.revision)
          throw new DomainError("draft_conflict", 409);
        await db.query(
          "UPDATE troc.onboarding_drafts SET payload=$2,ready=$3,revision=revision+1,updated_at=now() WHERE id=$1",
          [row.id, JSON.stringify(payload), ready],
        );
        return { revision: row.revision + 1, token: String(token) };
      }
      if (revision !== 0) throw new DomainError("draft_conflict", 409);
      const id = randomUUID(),
        secret = randomBytes(32).toString("base64url");
      const version = owner
        ? (
            await db.query<{ revision: number }>(
              "SELECT revision FROM troc.onboarding_profiles WHERE user_id=$1",
              [owner],
            )
          ).rows[0]?.revision
        : null;
      await db.query(
        "INSERT INTO troc.onboarding_drafts(id,secret_hash,payload,ready,owner_id,profile_revision) VALUES($1,$2,$3::jsonb,$4,$5,$6)",
        [
          id,
          hash(secret),
          JSON.stringify(payload),
          ready,
          owner,
          version || null,
        ],
      );
      return { revision: 1, token: id + "." + secret };
    });
  }
  async ready(token: unknown) {
    const row = await this.read(token);
    if (row.completed_by) throw new DomainError("draft_completed", 409);
    if (!row.ready) throw new DomainError("onboarding_required", 409);
    validateComplete(row.payload);
    return row;
  }
  async awaitingEmail(token: unknown, revision: number) {
    const row = await this.ready(token);
    const saved = await this.db.query(
      "UPDATE troc.onboarding_drafts SET awaiting_email=true WHERE id=$1 AND revision=$2 RETURNING id",
      [row.id, revision],
    );
    if (!saved.rows.length) throw new DomainError("draft_conflict", 409);
  }
  async finalize(token: unknown, userId: string) {
    return this.store.transaction(async (db) => {
      const row = await this.read(token, db, true);
      if (
        (row.completed_by && row.completed_by !== userId) ||
        (row.owner_id && row.owner_id !== userId)
      )
        throw new DomainError("forbidden", 403);
      if (row.completed_by === userId) {
        const existing = (
          await db.query<{ status: string }>(
            "SELECT status FROM troc.onboarding_profiles WHERE user_id=$1",
            [userId],
          )
        ).rows[0];
        if (existing?.status !== "waitlisted")
          throw new DomainError("profile_withdrawn", 409);
        return { status: "waitlisted", completed: true };
      }
      if (!row.ready) throw new DomainError("onboarding_required", 409);
      validateComplete(row.payload);
      await db.query("SELECT id FROM troc.users WHERE id=$1 FOR UPDATE", [
        userId,
      ]);
      const existing = (
        await db.query<{ user_id: string; revision: number }>(
          "SELECT user_id,revision FROM troc.onboarding_profiles WHERE user_id=$1",
          [userId],
        )
      ).rows[0];
      // Existing profiles are updated only through a draft explicitly created from that signed-in account.
      if (existing && row.owner_id !== userId)
        throw new DomainError("profile_exists", 409);
      if (existing && existing.revision !== row.profile_revision)
        throw new DomainError("profile_conflict", 409);
      await db.query(
        "INSERT INTO troc.onboarding_profiles(user_id,payload,consent_version) VALUES($1,$2::jsonb,$3) ON CONFLICT(user_id) DO UPDATE SET payload=EXCLUDED.payload,status='waitlisted',revision=onboarding_profiles.revision+1,consent_version=EXCLUDED.consent_version,consented_at=now(),updated_at=now()",
        [userId, JSON.stringify(row.payload), profileConsent],
      );
      await db.query(
        "UPDATE troc.user_profiles SET display_name=$2,updated_at=now() WHERE user_id=$1",
        [userId, row.payload.values.contact.trim()],
      );
      await db.query(
        "UPDATE troc.onboarding_drafts SET completed_by=$2 WHERE id=$1",
        [row.id, userId],
      );
      await db.query(
        "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'onboarding.completed','user',$1,$2::jsonb)",
        [
          userId,
          JSON.stringify({
            consentVersion: profileConsent,
            marketing: row.payload.checks.marketing === true,
          }),
        ],
      );
      return { status: "waitlisted", completed: true };
    });
  }
  async profile(userId: string) {
    return (
      (
        await this.db.query<{
          payload: DraftPayload;
          status: string;
          revision: number;
        }>(
          "SELECT payload,status,revision,created_at,updated_at FROM troc.onboarding_profiles WHERE user_id=$1",
          [userId],
        )
      ).rows[0] || null
    );
  }
  async withdraw(userId: string) {
    return this.store.transaction(async (db) => {
      await db.query(
        "UPDATE troc.onboarding_profiles SET status='withdrawn',payload=jsonb_set(payload,'{checks,marketing}','false'::jsonb),revision=revision+1,updated_at=now() WHERE user_id=$1",
        [userId],
      );
      await db.query(
        "INSERT INTO troc.audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'onboarding.withdrawn','user',$1)",
        [userId],
      );
    });
  }
}
