import {
  accountOnboardingRouter,
  accountOnboarding,
  draftToken,
} from "./account-onboarding";
import { googleAuthRouter } from "../modules/auth/google";
import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { requestRateLimit } from "../modules/security/rate-limit";
import { authClient } from "../modules/auth/supabase";
import { ensureBuyer } from "../modules/auth/service";
import { account, savePreferences } from "../modules/users/service";
import { SellerPlatformService } from "../modules/seller-platform/service";
import { sellerPlatformRouter } from "./seller-platform";
import { DomainError } from "../modules/shared/domain";
import { pool } from "@workspace/db";
import { commerceRouter, commerceQuoteRouter } from "./commerce";
import { inventoryRouter } from "./inventory";
import { principal, transactionStore } from "../modules/auth/runtime";
const router = Router();
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.use(
  commerceQuoteRouter(
    pool,
    process.env.CATALOG_MODE === "demo" && !process.env.DATABASE_URL,
  ),
);
router.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const allowed = process.env.APP_ORIGIN;
  if (!allowed) return res.status(503).json({ code: "service_unavailable" });
  if (
    req.headers.origin !== new URL(allowed).origin ||
    req.headers["sec-fetch-site"] === "cross-site"
  )
    return res.status(403).json({ code: "forbidden" });
  return next();
});
router.use(
  "/auth",
  requestRateLimit({namespace:"authentication",windowMs:15 * 60 * 1000,limit: 30}),
);
router.use(accountOnboardingRouter());
router.use(googleAuthRouter());
function credentials(body: unknown) {
  const v = body as Record<string, unknown> | null;
  if (
    !v ||
    typeof v.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) ||
    v.email.length > 254 ||
    typeof v.password !== "string" ||
    v.password.length < 8 ||
    v.password.length > 128
  )
    throw new DomainError("invalid_credentials");
  return { email: v.email.trim(), password: v.password };
}
router.post("/auth/sign-up", async (req, res) => {
  if (req.body?.country !== "CA" || req.body?.canadaConfirmed !== true)
    throw new DomainError("invalid_credentials");
  const draft = await accountOnboarding.ready(draftToken(req));
  const client = authClient(req, res);
  const { error } = await client.auth.signUp({
    ...credentials(req.body),
    options: {
      emailRedirectTo: `${process.env.APP_ORIGIN}/api/auth/callback${req.body?.onboarding === true ? "?onboarding=1" : ""}`,
    },
  });
  if (error) throw new DomainError("auth_failed", 400);
  await accountOnboarding.awaitingEmail(draftToken(req), draft.revision);
  // Do not disclose whether an address is already registered.
  res.status(202).json({ code: "check_email" });
});
router.post("/auth/sign-in", async (req, res) => {
  const client = authClient(req, res);
  const { data, error } = await client.auth.signInWithPassword(
    credentials(req.body),
  );
  if (error || !data.user) throw new DomainError("auth_failed", 401);
  try {
    await ensureBuyer(data.user);
  } catch (error) {
    await client.auth.signOut();
    throw error;
  }
  res.json({ ok: true });
});

function emailAddress(value: unknown) {
  if (
    typeof value !== "string" ||
    value.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  )
    throw new DomainError("invalid_credentials");
  return value.trim();
}
router.post("/auth/resend", async (req, res) => {
  await accountOnboarding.ready(draftToken(req));
  const email = emailAddress(req.body?.email);
  const { error } = await authClient(req, res).auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo:
        process.env.APP_ORIGIN + "/api/auth/callback?onboarding=1",
    },
  });
  if (error) throw new DomainError("auth_failed");
  res.status(202).json({ code: "check_email" });
});
router.post("/auth/recovery/start", async (req, res) => {
  const email = emailAddress(req.body?.email);
  const { error } = await authClient(req, res).auth.resetPasswordForEmail(
    email,
    { redirectTo: process.env.APP_ORIGIN + "/sign-in" },
  );
  if (error) throw new DomainError("auth_failed");
  res.status(202).json({ ok: true });
});
router.post("/auth/recovery/finish", async (req, res) => {
  const email = emailAddress(req.body?.email),
    token = req.body?.token,
    password = req.body?.password;
  if (
    typeof token !== "string" ||
    !/^\d{6,10}$/.test(token) ||
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  )
    throw new DomainError("invalid_credentials");
  const client = authClient(req, res);
  const verified = await client.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });
  if (verified.error || !verified.data.user)
    throw new DomainError("auth_failed");
  const changed = await client.auth.updateUser({ password });
  await client.auth.signOut({ scope: "local" });
  if (changed.error) throw new DomainError("auth_failed");
  res.json({ ok: true });
});
router.post("/auth/sign-out", async (req, res) => {
  const { error } = await authClient(req, res).auth.signOut();
  if (error) throw new DomainError("auth_failed", 400);
  res.json({ ok: true });
});
// PKCE email-confirmation callback; destination is fixed, never a user-controlled redirect.
router.get("/auth/callback", async (req, res) => {
  const destination =
    req.query.onboarding === "1" ? "/early-access" : "/account";
  try {
    if (
      typeof req.query.code !== "string" ||
      !req.query.code ||
      req.query.code.length > 4096
    )
      throw new DomainError("auth_failed");
    const { error } = await authClient(req, res).auth.exchangeCodeForSession(
      req.query.code,
    );
    if (error) throw new DomainError("auth_failed");
    return res.redirect(303, process.env.APP_ORIGIN + destination);
  } catch {
    return res.redirect(
      303,
      process.env.APP_ORIGIN +
        "/sign-in?authError=email_confirmation_failed&returnTo=%2Fearly-access",
    );
  }
});
router.get("/account", async (req, res) =>
  res.json(await account(await principal(req, res))),
);
router.patch("/account/preferences", async (req, res) =>
  res.json(await savePreferences(await principal(req, res), req.body)),
);
const sellerPlatform = new SellerPlatformService(pool, transactionStore);
// Run the shared seller rate limiter before the existing application POST handler.
router.use(sellerPlatformRouter(pool, transactionStore, principal));
router.post("/seller/applications", async (req, res) =>
  res
    .status(201)
    .json(await sellerPlatform.submit(await principal(req, res), req.body)),
);
router.use(inventoryRouter(pool, transactionStore, principal));
router.use(
  commerceRouter(
    pool,
    transactionStore,
    principal,
    process.env.CATALOG_MODE === "demo" && !process.env.DATABASE_URL,
  ),
);
router.use(
  (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof DomainError)
      return res.status(error.status).json({ code: error.code });
    // Do not leak SQL, PII, provider errors, cookies or credentials.
    return res.status(503).json({ code: "service_unavailable" });
  },
);
export default router;
