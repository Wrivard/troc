import {
  Router,
  json,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type { Principal } from "../modules/auth/permissions";
import type { Sql } from "../modules/commerce/data";
import type { TransactionStore } from "../modules/commerce/checkout";
import { DomainError } from "../modules/shared/domain";
import { PrelaunchService } from "../modules/prelaunch/service";

import { onboardingContract } from "../modules/prelaunch/onboarding";

export type PrelaunchConfig = {
  enabled: boolean;
  databaseReady: boolean;
  appOrigin?: string;
  signingKey?: string;
};
/** Unmounted. Principal MUST use existing verified server-side authentication. */
export function prelaunchRouter(
  db: Sql,
  store: TransactionStore,
  principal: (req: Request, res: Response) => Promise<Principal>,
  config: PrelaunchConfig,
) {
  const router = Router();
  const ready =
    config.enabled &&
    config.databaseReady &&
    !!config.appOrigin &&
    (config.signingKey?.length ?? 0) >= 32;
  const service = ready
    ? new PrelaunchService(db, store, config.signingKey!)
    : null;
  let origin = "";
  try {
    const configured = new URL(config.appOrigin ?? "");
    if (
      ["http:", "https:"].includes(configured.protocol) &&
      !configured.username &&
      !configured.password
    )
      origin = configured.origin;
  } catch {
    /* fail closed below */
  }
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  router.use((req, res, next) => {
    if (!service || !origin)
      return res.status(503).json({ code: "prelaunch_unavailable" });
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.headers.origin !== origin ||
        req.headers["sec-fetch-site"] === "cross-site")
    )
      return res.status(403).json({ code: "forbidden" });
    return next();
  });
  router.use(json({ limit: "12kb" }));
  router.use(async (req, _res, next) => {
    await service!.throttle(
      req.ip ?? req.socket.remoteAddress ?? "unknown",
      req.path === "/withdraw" ? "withdrawal" : "acquisition",
    );
    next();
  });
  router.post("/sessions", async (req, res) =>
    res.status(201).json(await service!.session(req.body)),
  );
  router.post("/events", async (req, res) => {
    await service!.observe(req.body);
    res.status(202).json({ ok: true });
  });
  router.post("/session-preferences", async (req, res) => {
    await service!.sessionPreferences(req.body);
    res.json({ ok: true });
  });
  router.get("/onboarding/contract", (_req, res) =>
    res.json(onboardingContract),
  );
  router.post("/onboarding/leads", async (req, res) => {
    res.status(202).json(await service!.captureOnboarding(req.body));
  });
  router.get("/admin/onboarding-summary", async (req, res) =>
    res.json(
      await service!.onboardingSummary(await principal(req, res), req.query),
    ),
  );
  router.post("/leads", async (req, res) => {
    await service!.capture(req.body);
    res.status(202).json({ ok: true });
  });
  router.post("/withdraw", async (req, res) => {
    await service!.withdraw(req.body);
    res.status(202).json({ ok: true });
  });
  router.get("/admin/leads", async (req, res) =>
    res.json(await service!.list(await principal(req, res), req.query)),
  );
  router.patch("/admin/leads/:kind/:id", async (req, res) => {
    await service!.update(
      await principal(req, res),
      req.params.kind,
      req.params.id,
      req.body,
    );
    res.json({ ok: true });
  });
  router.post("/admin/referrals", async (req, res) =>
    res
      .status(201)
      .json(await service!.referral(await principal(req, res), req.body)),
  );
  router.get("/admin/metrics", async (req, res) =>
    res.json(await service!.metrics(await principal(req, res))),
  );
  router.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof DomainError)
        return res.status(error.status).json({ code: error.code });
      const parsed = error as { type?: string };
      if (parsed?.type === "entity.too.large")
        return res.status(413).json({ code: "payload_too_large" });
      if (
        parsed?.type === "entity.parse.failed" ||
        parsed?.type === "request.aborted"
      )
        return res.status(400).json({ code: "invalid_input" });
      return res.status(503).json({ code: "prelaunch_unavailable" });
    },
  );
  return router;
}
