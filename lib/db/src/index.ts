import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Lazy connections keep health/UI available before provisioning. Protected handlers
// explicitly require configuration and never fall back to a mock identity.
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
export const db = drizzle(pool, { schema });

export * from "./schema";
