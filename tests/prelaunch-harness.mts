// Local-only harness: never imported by production entrypoints.
import express from "../artifacts/api-server/node_modules/express/index.js";
import { createServer } from "../artifacts/marketplace/node_modules/vite/dist/node/index.js";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { prelaunchRouter } from "../artifacts/api-server/src/routes/prelaunch";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
const apiPort = Number(process.env.PRELAUNCH_API_PORT || 4312);
const uiPort = Number(process.env.PRELAUNCH_UI_PORT || 5312);
const db = new PGlite({ extensions: { pg_trgm } }),
  dir = new URL("../lib/db/migrations/", import.meta.url);
for (const f of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort())
  await db.exec(await readFile(new URL(f, dir), "utf8"));
const user = "00000000-0000-0000-0000-000000000065";
await db.query(
  `INSERT INTO troc.users(id,email) VALUES($1,'prelaunch-admin@example.test')`,
  [user],
);
const store = {
  transaction: <T,>(work: (sql: Sql) => Promise<T>) =>
    db.transaction(async (tx) => {
      await tx.exec("SET LOCAL ROLE troc_backend");
      return work(tx as Sql);
    }),
};
const sql: Sql = {
  query: (query, params) => store.transaction((tx) => tx.query(query, params)),
};
const app = express();
app.set("trust proxy", "loopback"); // Test-only browser contexts use distinct local fixture IPs.
app.use(
  "/api/prelaunch",
  prelaunchRouter(
    sql,
    store,
    async () => ({ userId: user, roles: ["admin"], memberships: [] }),
    {
      enabled: true,
      databaseReady: true,
      appOrigin: `http://127.0.0.1:${uiPort}`,
      signingKey: "local-harness-only-not-a-production-secret",
    },
  ),
);
const server = app.listen(apiPort, "127.0.0.1");
const entry = fileURLToPath(
  new URL(
    "../artifacts/marketplace/src/modules/prelaunch/harness-entry.tsx",
    import.meta.url,
  ),
).replaceAll("\\", "/");
const vite = await createServer({
  root: fileURLToPath(new URL("../artifacts/marketplace/", import.meta.url)),
  server: {
    host: "127.0.0.1",
    port: uiPort,
    strictPort: true,
    proxy: { "/api": `http://127.0.0.1:${apiPort}` },
  },
  plugins:
    process.env.PRELAUNCH_INTEGRATED === "1"
      ? []
      : [
          {
            name: "prelaunch-isolated-harness",
            configureServer(server) {
              server.middlewares.use(async (req, res, next) => {
                if (!req.url?.startsWith("/early-access")) return next();
                res.setHeader("Content-Type", "text/html");
                res.end(
                  await server.transformIndexHtml(
                    req.url,
                    `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>TROC early access test</title></head><body><div id="root"></div><script type="module" src="/@fs/${entry}"></script></body></html>`,
                  ),
                );
              });
            },
          },
        ],
});
await vite.listen();
console.log(
  `Prelaunch local-only preview: http://127.0.0.1:${uiPort}/early-access`,
);
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, async () => {
    await vite.close();
    server.close();
    await db.close();
    process.exit(0);
  });
