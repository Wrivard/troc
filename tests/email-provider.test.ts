import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import {
  createTransactionalEmailProvider,
  renderTransactionalEmail,
  type EmailTransport,
} from "../artifacts/api-server/src/modules/providers/email";
const input = {
  template: "order_update",
  locale: "en" as const,
  recipient: "collector@example.test",
  parameters: { displayName: "Alex <script>alert(1)</script>" },
  idempotencyKey: "outbox:123",
};
test("email rendering escapes text and creates bilingual fixed application links", async () => {
  for (const locale of ["en", "fr"] as const)
    for (const template of ["order_update", "enquiry_received"]) {
      const result = await renderTransactionalEmail(
        { ...input, locale, template },
        "https://troc.example.test",
      );
      assert.ok(!result.html.includes("<script>"));
      assert.match(result.html, /&lt;script&gt;/);
      assert.match(result.html, new RegExp('lang="' + locale + '"'));
      assert.ok(result.text.includes("https://troc.example.test/"));
      assert.ok(!result.text.includes("<html"));
      assert.ok(result.subject.length > 0);
    }
  await assert.rejects(
    renderTransactionalEmail(
      { ...input, template: "arbitrary" },
      "https://troc.example.test",
    ),
    /unsupported/,
  );
  await assert.rejects(
    renderTransactionalEmail(
      { ...input, parameters: { url: "https://evil.test" } },
      "https://troc.example.test",
    ),
    /parameters/,
  );
  for (const origin of [
    "javascript:alert(1)",
    "https://user:password@troc.test",
    "https://troc.test/path",
    "http://external.test",
  ]) {
    await assert.rejects(renderTransactionalEmail(input, origin));
  }
});
test("disabled delivery never touches transport; live configuration fails closed", async () => {
  let calls = 0;
  const transport: EmailTransport = async () => {
    calls++;
    return { id: "test" };
  };
  const provider = createTransactionalEmailProvider(
    { appOrigin: "https://troc.example.test" },
    transport,
  );
  await assert.rejects(provider.send(input), /disabled/);
  assert.equal(calls, 0);
  assert.throws(
    () =>
      createTransactionalEmailProvider(
        {
          enabled: true,
          appOrigin: "https://troc.example.test",
          from: "service@troc.example.test",
        },
        transport,
      ),
    /configuration/,
  );
  assert.throws(
    () =>
      createTransactionalEmailProvider(
        {
          enabled: true,
          appOrigin: "http://localhost",
          from: "service@troc.example.test",
          apiKey: "fixture",
        },
        transport,
      ),
    /origin/,
  );
});
test("transport receives stable idempotency and sanitized errors, never false success", async () => {
  const config = {
    enabled: true,
    appOrigin: "https://troc.example.test",
    from: "service@troc.example.test",
    apiKey: "fixture-not-real",
  };
  const calls: string[] = [];
  const provider = createTransactionalEmailProvider(
    config,
    async (payload, key) => {
      calls.push(key);
      assert.equal(payload.to, input.recipient);
      assert.ok(payload.html && payload.text);
      return { id: "provider-receipt" };
    },
  );
  assert.deepEqual(await provider.send(input), {
    messageId: "provider-receipt",
  });
  await provider.send(input);
  assert.deepEqual(calls, ["outbox:123", "outbox:123"]);
  await assert.rejects(
    provider.send({
      ...input,
      recipient: "a@b.test\r\nBcc: victim@example.test",
    }),
  );
  await assert.rejects(
    provider.send({ ...input, idempotencyKey: "unsafe key" }),
  );
  assert.equal(calls.length, 2);
  const failing = createTransactionalEmailProvider(config, async () => {
    throw Error("secret-key-and-recipient");
  });
  await assert.rejects(failing.send(input), {
    message: "email_delivery_failed",
  });
  const empty = createTransactionalEmailProvider(config, async () => ({
    id: "",
  }));
  await assert.rejects(empty.send(input), /delivery_failed/);
});
test("save EN/FR review artifacts with fictional content and no delivery", async () => {
  const dir = new URL("../docs/evidence/email/", import.meta.url);
  await mkdir(dir, { recursive: true });
  for (const locale of ["en", "fr"] as const) {
    const result = await renderTransactionalEmail(
      { ...input, locale, parameters: { displayName: "Alex" } },
      "https://troc.example.test",
    );
    await writeFile(new URL(locale + ".html", dir), result.html);
    await writeFile(new URL(locale + ".txt", dir), result.text);
  }
});
