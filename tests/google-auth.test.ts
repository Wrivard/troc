import { canadianAddress } from "../artifacts/api-server/src/modules/auth/canadian-address";
import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { createRequire } from "node:module";
import { once } from "node:events";
import type { Request, Response, NextFunction } from "express";
import {
  googleAuthRouter,
  googleReturnPath,
} from "../artifacts/api-server/src/modules/auth/google";
import { authClient } from "../artifacts/api-server/src/modules/auth/supabase";
import { DomainError } from "../artifacts/api-server/src/modules/shared/domain";
const require = createRequire(
  new URL("../artifacts/api-server/package.json", import.meta.url),
);
const express = require("express") as typeof import("express");
const cookieParser = require("cookie-parser") as typeof import("cookie-parser");
test("return destinations reject external, encoded, query and fragment redirects", () => {
  for (const path of [
    "//evil.test",
    "https://evil.test",
    "/\\evil.test",
    "/account?next=https://evil.test",
    "/%2f%2fevil.test",
    "/account#x",
    "/store//evil.test",
    "/store/%2f%2fevil.test",
    "/store/cartes-du-nord?next=https://evil.test",
    "/store/../admin",
    null,
  ])
    assert.equal(googleReturnPath(path, "fr"), "/account?lang=fr");
  assert.equal(googleReturnPath("/cart", "en"), "/cart?lang=en");
  assert.equal(googleReturnPath("/store/cartes-du-nord", "fr"), "/store/cartes-du-nord?lang=fr");
  assert.equal(
    googleReturnPath("/early-access", "fr"),
    "/early-access?lang=fr",
  );
});
test("real installed SDK PKCE with simulated provider: browser binding, session staging and failures", async () => {
  const saved = {
    AUTH_FLOW_SECRET: process.env.AUTH_FLOW_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    APP_ORIGIN: process.env.APP_ORIGIN,
    AUTH_GOOGLE_ENABLED: process.env.AUTH_GOOGLE_ENABLED,
  };
  Object.assign(process.env, {
    AUTH_FLOW_SECRET: "test-only-flow-signing-secret-32-characters",
    SUPABASE_URL: "https://oauth-test.example.invalid",
    SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    DATABASE_URL: "postgres://unused.invalid/test",
    NODE_ENV: "test",
  });
  const originalFetch = globalThis.fetch;
  let mode = "ok",
    now = 1000000,
    buyerCalls = 0,
    tokenCalls = 0,
    userCalls = 0,
    origin = "",
    enabled = true,
    secure = false;
  const user = {
    id: "12345678-1234-4234-8234-123456789012",
    aud: "authenticated",
    email: "oauth@example.invalid",
    email_confirmed_at: "2026-09-23T00:00:00Z",
    app_metadata: {},
    user_metadata: {},
    created_at: "2026-09-23T00:00:00Z",
  };
  globalThis.fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    if (url.origin === origin) return originalFetch(input, init);
    assert.equal(
      url.origin,
      "https://oauth-test.example.invalid",
      "no external network permitted",
    );
    if (url.pathname === "/auth/v1/token") {
      tokenCalls++;
      const body = JSON.parse(String(init?.body));
      assert.equal(url.searchParams.get("grant_type"), "pkce");
      assert.equal(body.auth_code, "test-code");
      assert.ok(body.code_verifier.length >= 43);
      if (mode === "exchange")
        return new globalThis.Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description: "private provider detail",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      const token = [
        { alg: "HS256", typ: "JWT" },
        { sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 },
        "test",
      ]
        .map((v) =>
          Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString(
            "base64url",
          ),
        )
        .join(".");
      return new globalThis.Response(
        JSON.stringify({
          access_token: token,
          refresh_token: "test-refresh",
          token_type: "bearer",
          expires_in: 3600,
          user,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.pathname === "/auth/v1/user") {
      userCalls++;
      return new globalThis.Response(
        JSON.stringify(
          mode === "unverified" ? { ...user, email_confirmed_at: null } : user,
        ),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.pathname === "/auth/v1/logout")
      return new globalThis.Response("{}", {
        headers: { "Content-Type": "application/json" },
      });
    throw new Error("unexpected provider request");
  };
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    googleAuthRouter({
      client: authClient,
      prepareDraft: async (req) => {
        canadianAddress(req.body?.address);
        return "test-draft:1";
      },
      verifyDraft: async (_req, binding) => {
        assert.equal(binding, "test-draft:1");
      },
      buyer: async (verified, allowCreate) => {
        assert.equal(allowCreate, mode === "signup");
        buyerCalls++;
        assert.equal(verified.id, user.id);
        if (mode === "buyer" || !verified.email_confirmed_at)
          throw new Error("buyer denied");
      },
      configuration: () => ({
        enabled,
        origin,
        providerUrl: "https://oauth-test.example.invalid",
        secure,
      }),
      now: () => now,
    }),
  );
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) =>
    res.status(error instanceof DomainError ? error.status : 503).json({
      code: error instanceof DomainError ? error.code : "service_unavailable",
    }),
  );
  app.use("/configured", googleAuthRouter());
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  origin = "http://127.0.0.1:" + address.port;
  const begin = async (
    body: unknown = { locale: "fr", intent: "signin", returnTo: "/cart" },
    headerOrigin = origin,
  ) => {
    const r = await fetch(origin + "/auth/google", {
      method: "POST",
      headers: { origin: headerOrigin, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return {
      response: r,
      json: await r.json(),
      cookies: r.headers.getSetCookie(),
    };
  };
  const callback = async (
    flow: string,
    cookies: string[],
    extra = "code=test-code",
  ) =>
    fetch(origin + "/auth/google/callback?flow=" + flow + "&" + extra, {
      headers: { cookie: cookies.map((c) => c.split(";")[0]).join("; ") },
      redirect: "manual",
    });
  try {
    process.env.APP_ORIGIN = origin;
    process.env.AUTH_GOOGLE_ENABLED = "true";
    assert.deepEqual(
      await (await fetch(origin + "/configured/auth/providers")).json(),
      { google: true },
    );
    process.env.APP_ORIGIN = origin + "/unexpected-path";
    assert.deepEqual(
      await (await fetch(origin + "/configured/auth/providers")).json(),
      { google: false },
    );
    process.env.APP_ORIGIN = origin;
    process.env.AUTH_GOOGLE_ENABLED = "false";
    assert.deepEqual(
      await (await fetch(origin + "/configured/auth/providers")).json(),
      { google: false },
    );
    secure = true;
    process.env.NODE_ENV = "production";
    const secureStart = await begin();
    assert.ok(
      secureStart.cookies.some((cookie) =>
        cookie.startsWith("__Host-troc-google="),
      ),
    );
    assert.ok(
      secureStart.cookies.every(
        (cookie) => cookie.includes("Secure") && cookie.includes("HttpOnly"),
      ),
    );
    secure = false;
    process.env.NODE_ENV = "test";

    assert.equal(
      (await begin(undefined, "https://evil.test")).response.status,
      403,
    );
    assert.equal(
      (await begin({ canadaConfirmed: false })).response.status,
      400,
    );
    assert.equal((await begin({ intent: "signup" })).response.status, 400);
    assert.equal(
      (
        await begin({
          intent: "signup",
          address: {
            street: "1 Test Street",
            city: "Ottawa",
            province: "ON",
            postalCode: "90210",
            country: "US",
          },
        })
      ).response.status,
      400,
    );
    enabled = false;
    assert.equal((await begin()).response.status, 503);
    assert.deepEqual(await (await fetch(origin + "/auth/providers")).json(), {
      google: false,
    });
    enabled = true;
    const started = await begin();
    assert.equal(started.response.status, 200);
    assert.equal(started.response.headers.get("cache-control"), "no-store");
    const authUrl = new URL(started.json.url),
      redirect = new URL(authUrl.searchParams.get("redirect_to")!);
    const flow = redirect.searchParams.get("flow")!;
    assert.equal(authUrl.searchParams.get("provider"), "google");
    assert.equal(authUrl.searchParams.get("code_challenge_method"), "s256");
    assert.ok(authUrl.searchParams.get("code_challenge"));
    assert.ok(started.cookies.some((c) => c.includes("code-verifier")));
    assert.ok(
      started.cookies.every(
        (c) => c.includes("HttpOnly") && c.includes("SameSite=Lax"),
      ),
    );
    const tampered = started.cookies.map((cookie) => {
      if (!cookie.startsWith("troc-google=")) return cookie;
      const end = cookie.indexOf(";"),
        context = JSON.parse(
          decodeURIComponent(cookie.slice("troc-google=".length, end)),
        );
      context.intent = "signup";
      return (
        "troc-google=" +
        encodeURIComponent(JSON.stringify(context)) +
        cookie.slice(end)
      );
    });
    assert.match(
      (await callback(flow, tampered)).headers.get("location")!,
      /google_auth_failed/,
    );
    assert.equal(tokenCalls, 0);
    const mismatch = await callback("x".repeat(43), started.cookies);
    assert.equal(mismatch.status, 303);
    assert.match(
      mismatch.headers.get("location")!,
      /authError=google_auth_failed/,
    );
    assert.equal(tokenCalls, 0);
    const missing = await callback(flow, []);
    assert.equal(missing.status, 303);
    assert.equal(tokenCalls, 0);
    const denied = await callback(
      flow,
      started.cookies,
      "error=access_denied&error_description=private-detail",
    );
    assert.match(denied.headers.get("location")!, /google_auth_failed/);
    assert.ok(!denied.headers.get("location")!.includes("private-detail"));
    assert.equal(tokenCalls, 0);
    now += 600001;
    await callback(flow, started.cookies);
    assert.equal(tokenCalls, 0);
    now -= 600001;
    const success = await callback(flow, started.cookies);
    assert.equal(success.headers.get("location"), origin + "/cart?lang=fr");
    assert.equal(success.headers.get("cache-control"), "no-store");
    assert.equal(success.headers.get("referrer-policy"), "no-referrer");
    assert.ok(
      success.headers
        .getSetCookie()
        .some((c) => c.includes("auth-token=") && !c.includes("auth-token=;")),
    );
    assert.equal(buyerCalls, 1);
    assert.equal(userCalls, 1);
    for (const failure of ["exchange", "buyer", "unverified"]) {
      mode = failure;
      const next = await begin({
        intent: "signin",
        returnTo: "https://evil.test",
      });
      const f = new URL(
        new URL(next.json.url).searchParams.get("redirect_to")!,
      ).searchParams.get("flow")!;
      const failed = await callback(f, next.cookies);
      assert.match(failed.headers.get("location")!, /google_auth_failed/);
      assert.ok(
        !failed.headers.getSetCookie().some((c) => /auth-token=[^;]/.test(c)),
        "failed account must not receive staged session",
      );
    }
    mode = "ok";
    const next = await begin({
      intent: "signin",
      returnTo: "//evil.test",
    });
    const f = new URL(
      new URL(next.json.url).searchParams.get("redirect_to")!,
    ).searchParams.get("flow")!;
    assert.equal(
      (await callback(f, next.cookies)).headers.get("location"),
      origin + "/account?lang=en",
    );
    mode = "signup";
    const registration = await begin({
      intent: "signup",
      address: {
        street: "1 Test Street",
        city: "Ottawa",
        province: "ON",
        postalCode: "K1A 0B1",
        country: "CA",
      },
    });
    assert.equal(registration.response.status, 200);
    assert.ok(
      registration.cookies.every(
        (c) => !c.includes("Test") && !c.includes("Ottawa"),
      ),
    );
    const registrationFlow = new URL(
      new URL(registration.json.url).searchParams.get("redirect_to")!,
    ).searchParams.get("flow")!;
    assert.equal(
      (await callback(registrationFlow, registration.cookies)).headers.get(
        "location",
      ),
      origin + "/early-access?lang=en",
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(saved))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});

