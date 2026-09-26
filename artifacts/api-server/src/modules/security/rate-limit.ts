import { createHmac } from "node:crypto";
import type { RequestHandler } from "express";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Decision = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  reason?: string;
  pending?: Promise<unknown>;
};
export type LimitEngine = { limit(key: string): Promise<Decision> };
type Policy = { namespace: string; limit: number; windowMs: number };
type Configuration = {
  backend?: string;
  production?: boolean;
  url?: string;
  token?: string;
  keySecret?: string;
};
const unavailable: RequestHandler = (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Retry-After", "5");
  res.status(503).json({ code: "rate_limit_unavailable" });
};

export function requestRateLimit(
  policy: Policy,
  configuration: Configuration = {
    backend: process.env.RATE_LIMIT_BACKEND,
    production: process.env.NODE_ENV === "production",
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    keySecret: process.env.RATE_LIMIT_KEY_SECRET,
  },
  injected?: LimitEngine,
): RequestHandler {
  if (
    !/^[a-z0-9-]{1,48}$/.test(policy.namespace) ||
    !Number.isSafeInteger(policy.limit) ||
    policy.limit < 1 ||
    !Number.isSafeInteger(policy.windowMs) ||
    policy.windowMs < 1000
  )
    throw Error("invalid_rate_limit_policy");
  if (!configuration.backend && !configuration.production && !injected)
    return rateLimit({
      windowMs: policy.windowMs,
      limit: policy.limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { code: "rate_limited" },
    });
  // Production never silently falls back to independent in-memory counters.
  if (
    configuration.backend !== "upstash" ||
    !configuration.keySecret ||
    configuration.keySecret.length < 32
  )
    return unavailable;
  let engine = injected;
  if (!engine) {
    try {
      const url = new URL(configuration.url ?? "");
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        !configuration.token
      )
        return unavailable;
      engine = new Ratelimit({
        redis: new Redis({
          url: url.origin,
          token: configuration.token,
          retry: false,
        }),
        limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowMs} ms`),
        prefix: "troc:limit:" + policy.namespace,
        analytics: false,
        ephemeralCache: false,
        timeout: 1500,
      });
    } catch {
      return unavailable;
    }
  }
  const configuredEngine = engine,
    secret = configuration.keySecret;
  return async (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!req.ip) {
      unavailable(req, res, next);
      return;
    }
    // req.ip uses Express's reviewed trust-proxy setting; never consume raw forwarded headers.
    const key = createHmac("sha256", secret)
      .update(policy.namespace + ":" + ipKeyGenerator(req.ip))
      .digest("hex");
    try {
      const result = await configuredEngine.limit(key);
      void result.pending?.catch(() => undefined);
      if (
        result.reason === "timeout" ||
        !Number.isFinite(result.reset) ||
        !Number.isFinite(result.remaining) ||
        !Number.isFinite(result.limit)
      ) {
        unavailable(req, res, next);
        return;
      }
      const seconds = Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000),
      );
      res.setHeader("RateLimit-Limit", String(result.limit));
      res.setHeader(
        "RateLimit-Remaining",
        String(Math.max(0, result.remaining)),
      );
      res.setHeader("RateLimit-Reset", String(seconds));
      if (!result.success) {
        res.setHeader("Retry-After", String(seconds));
        res.status(429).json({ code: "rate_limited" });
        return;
      }
      next();
    } catch {
      unavailable(req, res, next);
    }
  };
}
