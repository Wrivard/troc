import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import publicSite from "./routes/public-site";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { principal, transactionStore } from "./modules/auth/runtime";
import { prelaunchRouter } from "./routes/prelaunch";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.disable("x-powered-by");
app.use(cookieParser());
// Public lead capture has its own 12 KB parser, origin checks and explicit activation gates.
app.use(
  "/api/prelaunch",
  prelaunchRouter(pool, transactionStore, principal, {
    enabled: process.env.PRELAUNCH_ENABLED === "true",
    databaseReady:
      process.env.PRELAUNCH_SCHEMA_READY === "true" &&
      !!process.env.DATABASE_URL &&
      !!process.env.SUPABASE_URL &&
      !!process.env.SUPABASE_PUBLISHABLE_KEY,
    appOrigin: process.env.APP_ORIGIN,
    signingKey: process.env.PRELAUNCH_SIGNING_KEY,
  }),
);
// Only inventory CSV previews accept larger payloads; other APIs retain 16 KB limits.
app.use(
  /^\/api\/inventory\/[0-9a-f-]{36}\/imports$/,
  express.json({ limit: "5mb" }),
);
app.use(express.json({ limit: "16kb" }));

app.use("/api", router);
app.use(publicSite);

export default app;
