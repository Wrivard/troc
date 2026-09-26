import { test } from "node:test";
import assert from "node:assert/strict";
import { PgBoss, fromPglite, TestClock } from "pg-boss";
import { PGlite } from "@electric-sql/pglite";
test("pg-boss spike: retries, deduplication, terminal failure and abandoned-job recovery", async () => {
  const db = new PGlite(),
    clock = new TestClock("2026-09-24T00:00:00Z");
  const make = () =>
    new PgBoss({
      backend: "pglite",
      db: fromPglite(db),
      supervise: false,
      schedule: false,
      clock,
    });
  let boss = make();
  const errors: unknown[] = [];
  boss.on("error", (e) => errors.push(e));
  try {
    await boss.start();
    await boss.createQueue("troc-email-spike", {
      policy: "exclusive",
      retryLimit: 1,
      retryDelay: 0,
      expireInSeconds: 10,
    });
    const id = await boss.send(
      "troc-email-spike",
      { outboxId: "fictional-1" },
      { singletonKey: "fictional-1" },
    );
    assert.ok(id);
    assert.equal(
      await boss.send(
        "troc-email-spike",
        { outboxId: "fictional-1" },
        { singletonKey: "fictional-1" },
      ),
      null,
    );
    const [job] = await boss.fetch("troc-email-spike");
    assert.equal(job.id, id);
    assert.equal((await boss.fetch("troc-email-spike")).length, 0);
    await boss.fail("troc-email-spike", job.id, {
      code: "fixture_transient_failure",
    });
    const [retry] = await boss.fetch("troc-email-spike");
    assert.equal(retry.id, id);
    await boss.complete("troc-email-spike", retry.id);
    assert.equal(
      (await boss.findJobs("troc-email-spike", { id: id! }))[0].state,
      "completed",
    );
    // A restarted worker must not steal a live job, but expiry must make it retriable.
    const abandoned = await boss.send(
      "troc-email-spike",
      { outboxId: "fictional-2" },
      { singletonKey: "fictional-2" },
    );
    await boss.fetch("troc-email-spike");
    await boss.stop({ graceful: false });
    boss = make();
    boss.on("error", (e) => errors.push(e));
    await boss.start();
    assert.equal((await boss.fetch("troc-email-spike")).length, 0);
    await clock.tick(11000);
    await boss.supervise("troc-email-spike");
    const [recovered] = await boss.fetch("troc-email-spike");
    assert.equal(recovered.id, abandoned);
    await boss.fail("troc-email-spike", recovered.id, {
      code: "fixture_permanent_failure",
    });
    assert.equal(
      (await boss.findJobs("troc-email-spike", { id: abandoned! }))[0].state,
      "failed",
    );
    assert.equal((await boss.fetch("troc-email-spike")).length, 0);
    assert.deepEqual(errors, []);
  } finally {
    await boss.stop({ graceful: false });
    await db.close();
  }
});
