// Development entry point only. Never imported by the production server.
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFile, readdir, mkdir } from "node:fs/promises";
import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { resolve } from "node:path";
async function main() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_URL
  )
    throw new Error(
      "Local accounts require an isolated shell with no hosted database/auth configuration.",
    );
  process.env.NODE_ENV = "development";
  process.env.TROC_LOCAL_ACCOUNTS = "true";
  process.env.APP_ORIGIN = "http://127.0.0.1:4313";
  process.env.CATALOG_MODE = "postgres";
  process.env.AUTH_GOOGLE_ENABLED = "false";
  process.env.PRELAUNCH_ENABLED = "false";
  const root = resolve(".local/test-accounts");
  await mkdir(root, { recursive: true });
  const db = new PGlite(resolve(root, "database"), { extensions: { pg_trgm } });
  await db.exec(
    "CREATE TABLE IF NOT EXISTS public.local_migrations(name text PRIMARY KEY, checksum text NOT NULL)",
  );
  for (const name of (await readdir("lib/db/migrations"))
    .filter((n) => n.endsWith(".sql"))
    .sort()) {
    const sql = await readFile("lib/db/migrations/" + name, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const prior = await db.query<{ checksum: string }>(
      "SELECT checksum FROM public.local_migrations WHERE name=$1",
      [name],
    );
    if (prior.rows.length) {
      if (prior.rows[0].checksum !== checksum)
        throw new Error("Changed migration: " + name);
      continue;
    }
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("INSERT INTO public.local_migrations VALUES($1,$2)", [
        name,
        checksum,
      ]);
    });
  }
  const { pool } = await import("../lib/db/src/index");
  // Serialize the embedded database, including the entire BEGIN/COMMIT lease.
  let tail = Promise.resolve();
  async function lease() {
    let release!: () => void;
    const previous = tail;
    tail = new Promise<void>((r) => (release = r));
    await previous;
    return release;
  }
  async function query(sql: string, params?: unknown[]) {
    const result = await db.query(sql, params);
    return { ...result, rowCount: result.affectedRows ?? result.rows.length };
  }
  Object.assign(pool, {
    query: async (sql: string, params?: unknown[]) => {
      const release = await lease();
      try {
        return await query(sql, params);
      } finally {
        release();
      }
    },
    connect: async () => {
      const release = await lease();
      let done = false;
      return {
        query,
        release: () => {
          if (!done) {
            done = true;
            release();
          }
        },
      };
    },
  });
  // Non-network marker enables existing onboarding handlers; the real pg pool is never used.
  process.env.DATABASE_URL = "local-embedded-test-database";
  const { ensureBuyer } =
    await import("../artifacts/api-server/src/modules/auth/service");
  const { localTestIdentity } =
    await import("../artifacts/api-server/src/modules/auth/local-test-context");
  const accounts = ["buyer", "seller", "admin"].map((role, i) => ({
    role,
    id: `00000000-0000-4000-8000-00000000000${i + 1}`,
    email: role + "@troc.test",
    email_confirmed_at: "2026-01-01T00:00:00Z",
  }));
  for (const account of accounts) await ensureBuyer(account);
  await db.query(
    "INSERT INTO troc.user_roles(user_id,role) VALUES($1,'admin') ON CONFLICT DO NOTHING",
    [accounts[2].id],
  );
  const sellerId = "00000000-0000-4000-8000-000000000010";
  await db.query(
    "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'local-test-store','TROC Test Store','individual','active') ON CONFLICT(id) DO NOTHING",
    [sellerId],
  );
  await db.query(
    "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner') ON CONFLICT DO NOTHING",
    [sellerId, accounts[1].id],
  );
  const { seedWorkspaceFixtures } = await import("./local-workspace-fixtures");
  await seedWorkspaceFixtures(db);
  const {addWorkspaceCardArt}=await import("./local-workspace-card-art");
  await addWorkspaceCardArt(db);
  const {promoteRetainedCatalog}=await import("./catalog/promote-local");
  console.log("Retained catalogue",await promoteRetainedCatalog(db));
  const {promoteRetainedArtwork}=await import("./catalog/promote-artwork");
  console.log("Retained artwork",await promoteRetainedArtwork(db));
  const {promoteLocalThumbnails}=await import("./catalog/promote-thumbnails");
  console.log("Local thumbnails",await promoteLocalThumbnails(db));
  console.log("Search thumbnails",await promoteLocalThumbnails(db,96));
  const {seedRetainedListingFixtures}=await import("./catalog/seed-local-listings");
  console.log("Simulated catalogue listings",await seedRetainedListingFixtures(db));
  const {refreshLocalCatalogStatistics}=await import("./catalog/refresh-statistics");
  console.log("Catalogue planner statistics",await refreshLocalCatalogStatistics(db));
  if (process.argv.includes("--profile-artwork")) {
    const { profileLocalArtwork } = await import("./catalog/profile-local-artwork");
    await profileLocalArtwork(db);
  }
  await db.exec("SET ROLE troc_backend");
  const { default: express } =
    await import("../artifacts/api-server/node_modules/express/index.js");
  const { default: cookieParser } =
    await import("../artifacts/api-server/node_modules/cookie-parser/index.js");
  const { default: app } = await import("../artifacts/api-server/src/app");
  const server = express();
  server.disable("x-powered-by");
  server.use(cookieParser());
  server.use(express.json({ limit: "16kb" }));
  const sessions = new Map<string, { role: string; expires: number }>();
  server.use((req, res, next) => {
    if (
      req.headers.host !== "127.0.0.1:5313" &&
      req.headers.host !== "127.0.0.1:4313"
    )
      return res.sendStatus(403);
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      (req.headers.origin !== process.env.APP_ORIGIN ||
        req.headers["sec-fetch-site"] === "cross-site")
    )
      return res.sendStatus(403);
    res.setHeader("Cache-Control", "no-store");
    for (const [key, value] of sessions)
      if (value.expires < Date.now()) sessions.delete(key);
    const session = sessions.get(req.cookies["troc-local-session"]);
    const identity = accounts.find((a) => a.role === session?.role);
    if (identity) return localTestIdentity.run(identity, next);
    next();
  });
  server.get("/api/dev/accounts", (req, res) =>
    res.json({
      local: true,
      current: localTestIdentity.getStore()?.email ?? null,
      accounts: accounts.map(({ role, email }) => ({ role, email })),
    }),
  );
  const credentials = JSON.parse(
    await readFile(resolve(root, "credentials.json"), "utf8"),
  );
  const attempts = new Map<string, { count: number; until: number }>();
  server.post("/api/auth/sign-in", (req, res) => {
    const key = req.socket.remoteAddress ?? "loopback";
    let attempt = attempts.get(key);
    if (!attempt || attempt.until < Date.now()) {
      attempt = { count: 0, until: Date.now() + 60000 };
      attempts.set(key, attempt);
    }
    if (++attempt.count > 15)
      return res.status(429).json({ code: "rate_limited" });
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" ? req.body.password : "";
    if (password.length > 128)
      return res.status(401).json({ code: "auth_failed" });
    const account = accounts.find((a) => a.email === email);
    const stored = credentials[account?.role ?? "buyer"];
    const valid = timingSafeEqual(
      scryptSync(password, stored.salt, 32),
      Buffer.from(stored.hash, "hex"),
    );
    if (!account || !valid)
      return res.status(401).json({ code: "auth_failed" });
    sessions.delete(req.cookies["troc-local-session"]);
    const token = randomBytes(32).toString("hex");
    sessions.set(token, {
      role: account.role,
      expires: Date.now() + 8 * 3600000,
    });
    res.cookie("troc-local-session", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 3600000,
    });
    res.json({ ok: true });
  });
  server.post("/api/dev/session", (req, res) => {
    const account = accounts.find((a) => a.role === req.body?.role);
    if (!account) return res.status(400).json({ code: "invalid_role" });
    sessions.delete(req.cookies["troc-local-session"]);
    const token = randomBytes(32).toString("hex");
    sessions.set(token, {
      role: account.role,
      expires: Date.now() + 8 * 3600000,
    });
    res.cookie("troc-local-session", token, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 3600000,
    });
    res.json({ ok: true });
  });
  server.post("/api/auth/sign-out", (req, res) => {
    sessions.delete(req.cookies["troc-local-session"]);
    res.clearCookie("troc-local-session", { path: "/" });
    res.json({ ok: true });
  });
  server.use("/api/auth", (req, res, next) =>
    req.method === "POST"
      ? res.status(503).json({ code: "local_test_accounts_only" })
      : next(),
  );
  server.get("/api/dev/seller-hub", async (req, res) => {
    const identity = localTestIdentity.getStore();
    if (!identity) return res.status(401).json({ code: "unauthorized" });
    const actor = await ensureBuyer(identity);
    const seller = String(req.query.seller || "");
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        seller,
      )
    )
      return res.status(400).json({ code: "invalid_seller" });
    if (
      !actor.roles.includes("admin") &&
      !actor.memberships.some((m) => m.active && m.sellerId === seller)
    )
      return res.status(403).json({ code: "forbidden" });
    const inventory = await pool.query(
      "SELECT status,count(*)::int AS count,sum(quantity)::int AS units,coalesce(sum(quantity*unit_price_cents),0)::text AS value FROM troc.listings WHERE seller_id=$1 AND demo_batch_id IS NOT NULL GROUP BY status",
      [seller],
    );
    const orders = await pool.query(
      "SELECT s.id,s.status,s.created_at,s.merchandise_cents::int,s.shipping_cents,s.refunded_cents,s.quote->'lines' AS lines FROM troc.seller_orders s JOIN troc.marketplace_orders m ON m.id=s.marketplace_order_id WHERE s.seller_id=$1 AND m.demo_batch_id IS NOT NULL ORDER BY s.created_at DESC LIMIT 50",
      [seller],
    );
    const messages = await pool.query(
      "SELECT count(*)::int AS count FROM troc.order_messages m JOIN troc.seller_orders s ON s.id=m.seller_order_id WHERE s.seller_id=$1",
      [seller],
    );
    res.json({
      demo: true,
      inventory: inventory.rows,
      orders: orders.rows,
      messages: messages.rows[0].count,
    });
  });

  server.use(app);
  server.listen(5313, "127.0.0.1", () =>
    console.log(
      "LOCAL TEST ACCOUNTS ready: UI 4313 / API 5313. Persistent isolated database; no Google or emails.",
    ),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
