import { createServerClient } from "@supabase/ssr";
import type { Request, Response } from "express";
import { DomainError } from "../shared/domain";
export function authClient(req: Request, res: Response) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !process.env.DATABASE_URL)
    throw new DomainError("service_unavailable", 503);
  return createServerClient(url, key, {
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () =>
        Object.entries(req.cookies ?? {}).map(([name, value]) => ({
          name,
          value: String(value),
        })),
      setAll: (values) => {
        for (const { name, value, options } of values)
          res.cookie(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
      },
    },
  });
}
