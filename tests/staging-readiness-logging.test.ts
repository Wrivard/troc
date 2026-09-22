import { test } from "node:test";
import assert from "node:assert/strict";
import {
  requestSummary,
  errorSummary,
} from "../artifacts/api-server/src/lib/safe-logging";
test("request diagnostics retain bounded surface without path identifiers or query secrets", () => {
  assert.deepEqual(
    requestSummary({
      method: "POST",
      url: "/api/prelaunch/withdraw/personal@example.test?token=SECRET",
    }),
    { method: "POST", surface: "prelaunch" },
  );
  assert.deepEqual(
    requestSummary({ method: "SECRET", url: "/personal@example.test" }),
    { method: "OTHER", surface: "public_or_unknown" },
  );
});
test("error diagnostics omit driver messages, stacks, SQL and arbitrary codes", () => {
  assert.deepEqual(
    errorSummary(
      Object.assign(new Error("postgres://SECRET personal@example.test"), {
        code: "28P01",
        query: "private SQL",
      }),
    ),
    { type: "request_error", category: "28P01" },
  );
  assert.deepEqual(errorSummary({ code: "SECRET" }), {
    type: "request_error",
    category: "unclassified",
  });
});
