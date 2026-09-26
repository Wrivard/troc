import { randomBytes, timingSafeEqual, createHmac } from "node:crypto";
import { pool } from "@workspace/db";
import { accountOnboarding, draftToken } from "../../routes/account-onboarding";
import { Router, type Request, type CookieOptions } from "express";
import type { User } from "@supabase/supabase-js";
import { authClient, type AuthCookieTarget } from "./supabase";
import { ensureBuyer } from "./service";
import { DomainError } from "../shared/domain";

type Client = {
  auth: Pick<
    ReturnType<typeof authClient>["auth"],
    "signInWithOAuth" | "exchangeCodeForSession" | "getUser" | "signOut"
  >;
};
export type GoogleAuthDependencies = {
  client: (req: Request, cookies: AuthCookieTarget) => Client;
  buyer: (user: User, allowCreate: boolean) => Promise<unknown>;
  configuration: () => {
    enabled: boolean;
    origin: string;
    providerUrl: string;
    secure: boolean;
  };
  now: () => number;
  prepareDraft?: (req: Request) => Promise<string>;
  verifyDraft?: (req: Request, binding: string) => Promise<void>;
};
function configuration() {
  const origin = process.env.APP_ORIGIN || "";
  const providerUrl = process.env.SUPABASE_URL || "";
  const secure = process.env.NODE_ENV === "production";
  let valid = false;
  try {
    const site = new URL(origin),
      provider = new URL(providerUrl);
    valid =
      site.origin === origin &&
      !site.username &&
      !site.password &&
      (site.protocol === "https:" ||
        (!secure &&
          site.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(site.hostname))) &&
      provider.protocol === "https:" &&
      !provider.username &&
      !provider.password &&
      provider.pathname === "/" &&
      !provider.search &&
      !provider.hash;
  } catch {
    /* Fail closed until exact origins are configured. */
  }
  return {
    origin,
    providerUrl,
    secure,
    enabled:
      valid &&
      process.env.AUTH_GOOGLE_ENABLED === "true" &&
      !!process.env.SUPABASE_PUBLISHABLE_KEY &&
      !!process.env.DATABASE_URL &&
      (!secure || (process.env.AUTH_FLOW_SECRET?.length ?? 0) >= 32),
  };
}
const defaults: GoogleAuthDependencies = {
  client: authClient,
  buyer: async (user, allowCreate) => {
    if (!allowCreate) {
      const existing = await pool.query(
        "SELECT id FROM troc.users WHERE id=$1",
        [user.id],
      );
      if (!existing.rows.length) throw new DomainError("signup_required", 403);
    }
    return ensureBuyer(user);
  },
  configuration,
  now: Date.now,
  prepareDraft: async (req) => {
    const d = await accountOnboarding.ready(draftToken(req));
    return d.id + ":" + d.revision;
  },
  verifyDraft: async (req, binding) => {
    const d = await accountOnboarding.ready(draftToken(req));
    if (d.id + ":" + d.revision !== binding)
      throw new DomainError("draft_conflict", 409);
  },
};
const returnPaths = new Set([
  "/early-access",
  "/account",
  "/account/settings",
  "/account/orders",
  "/seller/dashboard",
  "/seller/inventory",
  "/seller/team",
  "/seller/orders",
  "/admin/waitlist",
  "/admin/seller-applications",
  "/cart",
  "/checkout",
  "/smart-cart",
]);
export function googleReturnPath(value: unknown, locale: "en" | "fr") {
  // An explicit path allowlist discards arbitrary query strings, fragments and encoded redirects.
  return (
    (typeof value === "string" &&
    (returnPaths.has(value) || /^[/]store[/][a-z0-9][a-z0-9-]{0,119}$/.test(value) ||
      /^\/(?:account|seller)\/orders\/[a-f0-9-]{36}$/.test(value))
      ? value
      : "/account") +
    "?lang=" +
    locale
  );
}
export function googleAuthRouter(deps: GoogleAuthDependencies = defaults) {
  // Shared secret is required across production instances; development restart fails closed.
  const flowKey =
    process.env.AUTH_FLOW_SECRET || randomBytes(32).toString("hex");
  const sign = (
    flow: string,
    intent: string,
    binding = "",
    createdAt = 0,
    locale = "en",
    returnTo = "",
  ) =>
    createHmac("sha256", flowKey)
      .update(
        JSON.stringify({ flow, intent, binding, createdAt, locale, returnTo }),
      )
      .digest("hex");
  const router = Router();
  router.get("/auth/providers", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ google: deps.configuration().enabled });
  });
  router.post("/auth/google", async (req, res) => {
    const config = deps.configuration();
    res.setHeader("Cache-Control", "no-store");
    if (!config.enabled) throw new DomainError("service_unavailable", 503);
    if (
      req.headers.origin !== config.origin ||
      req.headers["sec-fetch-site"] === "cross-site"
    )
      throw new DomainError("forbidden", 403);
    if (config.secure && (process.env.AUTH_FLOW_SECRET?.length ?? 0) < 32)
      throw new DomainError("service_unavailable", 503);
    const intent = req.body?.intent;
    if (intent !== "signin" && intent !== "signup")
      throw new DomainError("invalid_credentials");
    const binding =
      intent === "signup" && deps.prepareDraft
        ? await deps.prepareDraft(req)
        : "";
    const locale = req.body?.locale === "fr" ? "fr" : "en";
    const flow = randomBytes(32).toString("base64url");
    const callback = config.origin + "/api/auth/google/callback?flow=" + flow;
    const client = deps.client(req, res);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new DomainError("google_auth_failed", 503);
    const provider = new URL(data.url),
      expected = new URL(config.providerUrl);
    if (
      provider.origin !== expected.origin ||
      provider.username ||
      provider.password ||
      provider.pathname !== "/auth/v1/authorize" ||
      provider.searchParams.get("provider") !== "google" ||
      provider.searchParams.get("redirect_to") !== callback
    )
      throw new DomainError("google_auth_failed", 503);
    const createdAt = deps.now(),
      returnTo = googleReturnPath(req.body?.returnTo, locale);
    res.cookie(
      config.secure ? "__Host-troc-google" : "troc-google",
      JSON.stringify({
        flow,
        intent,
        binding,
        signature: sign(flow, intent, binding, createdAt, locale, returnTo),
        locale,
        returnTo,
        createdAt,
      }),
      {
        httpOnly: true,
        secure: config.secure,
        sameSite: "lax",
        path: "/",
        maxAge: 600000,
      },
    );
    res.json({ url: provider.href });
  });
  router.get("/auth/google/callback", async (req, res) => {
    const config = deps.configuration();
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    let locale: "en" | "fr" = "en";
    if (!config.enabled)
      return res.status(503).json({ code: "service_unavailable" });
    const cookieName = config.secure ? "__Host-troc-google" : "troc-google";
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: config.secure,
      sameSite: "lax",
      path: "/",
    };
    let client: Client | undefined;
    try {
      const raw: unknown = req.cookies?.[cookieName];
      if (typeof raw !== "string" || raw.length > 1024)
        throw new Error("invalid_flow");
      const context = JSON.parse(raw);
      const flow = req.query.flow;
      if (
        !context ||
        typeof context.flow !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(context.flow) ||
        typeof flow !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(flow) ||
        !timingSafeEqual(Buffer.from(flow), Buffer.from(context.flow)) ||
        !Number.isFinite(context.createdAt) ||
        deps.now() - context.createdAt < 0 ||
        deps.now() - context.createdAt > 600000
      )
        throw new Error("invalid_flow");
      if (
        !["signin", "signup"].includes(context.intent) ||
        typeof context.signature !== "string" ||
        !/^[a-f0-9]{64}$/.test(context.signature) ||
        !timingSafeEqual(
          Buffer.from(context.signature),
          Buffer.from(
            sign(
              context.flow,
              context.intent,
              context.binding || "",
              context.createdAt,
              context.locale,
              context.returnTo,
            ),
          ),
        )
      )
        throw new Error("invalid_flow");
      locale = context.locale === "fr" ? "fr" : "en";
      res.clearCookie(cookieName, cookieOptions);
      if (
        req.query.error ||
        typeof req.query.code !== "string" ||
        !req.query.code ||
        req.query.code.length > 4096
      )
        throw new Error("invalid_code");
      // Never commit a newly issued provider session until our own verified buyer policy passes.
      const pending: { name: string; value: string; options: CookieOptions }[] =
        [];
      client = deps.client(req, {
        cookie: (name, value, options) =>
          pending.push({ name, value, options }),
      });
      const exchanged = await client.auth.exchangeCodeForSession(
        req.query.code,
      );
      if (exchanged.error || !exchanged.data.session)
        throw new Error("exchange_failed");
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data.user)
        throw new Error("unverified_user");
      if (context.intent === "signup" && deps.verifyDraft)
        await deps.verifyDraft(req, context.binding);
      await deps.buyer(verified.data.user, context.intent === "signup");
      for (const cookie of pending)
        res.cookie(cookie.name, cookie.value, cookie.options);
      const returnTo =
        typeof context.returnTo === "string"
          ? context.returnTo.split("?")[0]
          : undefined;
      return res.redirect(
        303,
        config.origin +
          googleReturnPath(
            context.intent === "signup" ? "/early-access" : returnTo,
            locale,
          ),
      );
    } catch {
      if (client) {
        try {
          await client.auth.signOut({ scope: "local" });
        } catch {
          /* No staged session cookie is committed on failure. */
        }
      }
      return res.redirect(
        303,
        config.origin +
          "/sign-in?lang=" +
          locale +
          "&authError=google_auth_failed",
      );
    }
  });
  return router;
}


