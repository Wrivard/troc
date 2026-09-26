import type { Sql } from "../modules/commerce/data";
import type { Principal } from "../modules/auth/permissions";
import { Router, json, type Request, type Response } from "express";
import { requestRateLimit } from "../modules/security/rate-limit";
import { pool } from "@workspace/db";
import { principal, transactionStore } from "../modules/auth/runtime";
import { AccountOnboarding } from "../modules/prelaunch/account-onboarding";
import { DomainError } from "../modules/shared/domain";
export const accountOnboarding = new AccountOnboarding(pool, transactionStore);
const name = () =>
  process.env.NODE_ENV === "production" ? "__Host-troc-draft" : "troc-draft";
export const draftToken = (req: Request) => req.cookies?.[name()];
const setCookie = (res: Response, token: string) =>
  res.cookie(name(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400000,
  });
export function accountOnboardingRouter(
  options: {
    db?: Sql;
    service?: AccountOnboarding;
    authenticate?: (req: Request, res: Response) => Promise<Principal>;
    enabled?: boolean;
  } = {},
) {
  const db = options.db || pool,
    service = options.service || accountOnboarding,
    authenticate = options.authenticate || principal;
  const r = Router();
  r.use(
    "/onboarding",
    json({ limit: "16kb" }),
    requestRateLimit({namespace:"account-onboarding",windowMs:60000,limit:60}),
    (_req, res, next) => {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      if (!(options.enabled ?? !!process.env.DATABASE_URL))
        return res.status(503).json({ code: "onboarding_unavailable" });
      return next();
    },
  );
  r.get("/onboarding/draft", async (req, res) => {
    if (!draftToken(req)) return res.json({ draft: null });
    const row = await service.read(draftToken(req));
    if (
      (row.owner_id || row.completed_by) &&
      (await authenticate(req, res)).userId !==
        (row.owner_id || row.completed_by)
    )
      throw new DomainError("forbidden", 403);
    if (
      row.completed_by &&
      (await service.profile(row.completed_by))?.status !== "waitlisted"
    )
      return res.json({ redirectToAccount: true });
    return res.json({
      draft: {
        payload: row.payload,
        revision: row.revision,
        ready: row.ready,
        completed: !!row.completed_by,
        awaitingEmail: row.awaiting_email,
      },
    });
  });
  r.put("/onboarding/draft", async (req, res) => {
    let owner: string | null = null;
    if (draftToken(req)) {
      const row = await service.read(draftToken(req));
      if (row.owner_id) owner = (await authenticate(req, res)).userId;
    }
    const saved = await service.save(
      draftToken(req),
      req.body?.payload,
      req.body?.revision,
      req.body?.ready === true,
      owner,
    );
    setCookie(res, saved.token);
    res.json({ revision: saved.revision, saved: true });
  });
  r.delete("/onboarding/draft", async (req, res) => {
    if (draftToken(req)) {
      try {
        const row = await service.read(draftToken(req));
        if (
          row.owner_id &&
          (await authenticate(req, res)).userId !== row.owner_id
        )
          throw new DomainError("forbidden", 403);
        await db.query("DELETE FROM troc.onboarding_drafts WHERE id=$1", [
          row.id,
        ]);
      } catch (e) {
        if (!(e instanceof DomainError && e.code === "draft_expired")) throw e;
      }
    }
    res.clearCookie(name(), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ ok: true });
  });
  r.post("/onboarding/finalize", async (req, res) =>
    res.json(
      await service.finalize(
        draftToken(req),
        (await authenticate(req, res)).userId,
      ),
    ),
  );
  r.get("/onboarding/profile", async (req, res) =>
    res.json({
      profile: await service.profile((await authenticate(req, res)).userId),
    }),
  );
  r.post("/onboarding/edit", async (req, res) => {
    const p = await authenticate(req, res),
      profile = await service.profile(p.userId);
    if (!profile) throw new DomainError("not_found", 404);
    const saved = await service.save(
      null,
      {
        ...profile.payload,
        checks: { ...profile.payload.checks, consent: false },
        step: "review",
      },
      0,
      false,
      p.userId,
    );
    setCookie(res, saved.token);
    res.json({ ok: true });
  });
  r.post("/onboarding/withdraw", async (req, res) => {
    await service.withdraw((await authenticate(req, res)).userId);
    res.json({ ok: true });
  });
  r.get("/onboarding/admin/summary", async (req, res) => {
    const p = await authenticate(req, res);
    if (!p.roles.includes("admin")) throw new DomainError("forbidden", 403);
    const counts = await db.query(
      "SELECT payload->>'intent' AS intent,count(*)::int AS people FROM troc.onboarding_profiles WHERE status='waitlisted' GROUP BY payload->>'intent'",
    );
    const regions = await db.query(
      "SELECT payload->'values'->>'province' AS province,count(*)::int AS people FROM troc.onboarding_profiles WHERE status='waitlisted' GROUP BY payload->'values'->>'province'",
    );
    await db.query(
      "INSERT INTO troc.audit_events(actor_id,action,entity_type) VALUES($1,'onboarding.summary_read','onboarding_profiles')",
      [p.userId],
    );
    res.json({
      segments: counts.rows,
      regions: regions.rows,
      unit: "verified_account",
      answers: "self_reported",
      inventory: "hypothetical_not_confirmed",
      status: "completed_waitlisted",
    });
  });
  r.get("/onboarding/admin/profiles", async (req, res) => {
    const p = await authenticate(req, res);
    if (!p.roles.includes("admin")) throw new DomainError("forbidden", 403);
    const offset = Number(req.query.offset || 0);
    if (!Number.isInteger(offset) || offset < 0 || offset > 10000)
      throw new DomainError("invalid_input");
    const intent = String(req.query.intent || "all"),
      status = String(req.query.status || "all"),
      province = String(req.query.province || "all"),
      q = String(req.query.q || "").trim();
    if (
      !["all", "buyer", "seller", "both"].includes(intent) ||
      !["all", "waitlisted", "withdrawn"].includes(status) ||
      ![
        "all",
        "AB",
        "BC",
        "MB",
        "NB",
        "NL",
        "NS",
        "NT",
        "NU",
        "ON",
        "PE",
        "QC",
        "SK",
        "YT",
      ].includes(province) ||
      q.length > 100
    )
      throw new DomainError("invalid_input");
    const rows = await db.query(
      "SELECT o.user_id,u.email,o.status,o.revision,o.created_at,o.updated_at,o.payload->>'intent' AS intent,o.payload->>'locale' AS locale,(o.payload->'values')-'street'-'postalCode'-'unit' AS answers,o.payload->'sets' AS selections,o.payload->'checks' AS confirmations FROM troc.onboarding_profiles o JOIN troc.users u ON u.id=o.user_id WHERE ($2='all' OR o.payload->>'intent'=$2) AND ($3='all' OR o.status=$3) AND ($4='all' OR o.payload->'values'->>'province'=$4) AND ($5='' OR strpos(lower(coalesce(o.payload->'values'->>'contact','')||' '||coalesce(o.payload->'values'->>'city','')||' '||u.email),lower($5))>0) ORDER BY o.created_at,o.user_id LIMIT 51 OFFSET $1",
      [offset, intent, status, province, q],
    );
    await db.query(
      "INSERT INTO troc.audit_events(actor_id,action,entity_type) VALUES($1,'onboarding.profiles_read','onboarding_profiles')",
      [p.userId],
    );
    res.json({ items: rows.rows.slice(0, 50), hasMore: rows.rows.length > 50 });
  });
  return r;
}
