import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { rateLimit } from "express-rate-limit";
import { authClient } from "../modules/auth/supabase";
import { ensureBuyer } from "../modules/auth/service";
import { account, savePreferences } from "../modules/users/service";
import { submitApplication } from "../modules/sellers/service";
import { DomainError } from "../modules/shared/domain";
const router = Router();
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
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
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { code: "rate_limited" },
  }),
);
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
  const client = authClient(req, res);
  const { error } = await client.auth.signUp({
    ...credentials(req.body),
    options: { emailRedirectTo: `${process.env.APP_ORIGIN}/api/auth/callback` },
  });
  if (error) throw new DomainError("auth_failed", 400);
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
router.post("/auth/sign-out", async (req, res) => {
  const { error } = await authClient(req, res).auth.signOut();
  if (error) throw new DomainError("auth_failed", 400);
  res.json({ ok: true });
});
// PKCE email-confirmation callback; destination is fixed, never a user-controlled redirect.
router.get("/auth/callback", async (req, res) => {
  if (typeof req.query.code !== "string") throw new DomainError("auth_failed");
  const { error } = await authClient(req, res).auth.exchangeCodeForSession(
    req.query.code,
  );
  if (error) throw new DomainError("auth_failed");
  res.redirect(`${process.env.APP_ORIGIN}/account`);
});
async function principal(req: Request, res: Response) {
  const { data, error } = await authClient(req, res).auth.getUser();
  if (error || !data.user) throw new DomainError("unauthorized", 401);
  return ensureBuyer(data.user);
}
router.get("/account", async (req, res) =>
  res.json(await account(await principal(req, res))),
);
router.patch("/account/preferences", async (req, res) =>
  res.json(await savePreferences(await principal(req, res), req.body)),
);
router.post("/seller/applications", async (req, res) =>
  res
    .status(201)
    .json(await submitApplication(await principal(req, res), req.body)),
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
