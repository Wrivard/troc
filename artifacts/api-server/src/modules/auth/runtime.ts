import { localTestIdentity, localTestMode } from "./local-test-context";
import type { Request, Response } from "express";
import { pool } from "@workspace/db";
import { authClient } from "./supabase";
import { ensureBuyer } from "./service";
import { DomainError } from "../shared/domain";
import type { TransactionStore } from "../commerce/checkout";

/** Every protected request resolves verified identity and current database roles. */
export async function principal(req: Request, res: Response) {
  const local = localTestMode() ? localTestIdentity.getStore() : undefined;
  if (local) return ensureBuyer(local);
  if (localTestMode()) throw new DomainError("unauthorized", 401);
  const { data, error } = await authClient(req, res).auth.getUser();
  if (error || !data.user) throw new DomainError("unauthorized", 401);
  return ensureBuyer(data.user);
}

export const transactionStore: TransactionStore = {
  transaction: async (work) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },
};
