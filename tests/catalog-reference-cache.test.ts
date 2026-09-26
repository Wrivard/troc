import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ReferenceCache,
  invalidateCatalogReferences,
} from "../artifacts/api-server/src/modules/catalog/reference-cache";
test("reference cache coalesces reads, expires and bounds retained keys", async () => {
  let time = 0,
    calls = 0;
  const cache = new ReferenceCache<number>(2, 30, () => time);
  const load = async () => ++calls;
  const first = cache.get("a", load);
  assert.equal(first, cache.get("a", load));
  assert.equal(await first, 1);
  time = 31;
  assert.equal(await cache.get("a", load), 2);
  await cache.get("b", load);
  await cache.get("c", load);
  assert.equal(await cache.get("a", load), 5);
});
test("failed reference reads are retryable and cannot erase a newer entry", async () => {
  let time = 0,
    reject: (e: Error) => void = () => {};
  const cache = new ReferenceCache<number>(2, 10, () => time);
  const old = cache.get("a", () => new Promise((_, r) => (reject = r)));
  await Promise.resolve();
  time = 11;
  const fresh = cache.get("a", async () => 42);
  reject(new Error("failed"));
  await assert.rejects(old);
  assert.equal(await fresh, 42);
  assert.equal(await cache.get("a", async () => 99), 42);
  const bad = cache.get("b", async () => {
    throw Error("offline");
  });
  await assert.rejects(bad);
  assert.equal(await cache.get("b", async () => 7), 7);
});

test("publication invalidates all clients and pending reads cannot restore old data", async () => {
  const a = new ReferenceCache<number>(),
    b = new ReferenceCache<number>();
  let resolve!: (n: number) => void;
  const old = a.get("sets", () => new Promise<number>((r) => (resolve = r)));
  await Promise.resolve();
  await b.get("sets", async () => 1);
  invalidateCatalogReferences();
  assert.equal(await a.get("sets", async () => 2), 2);
  assert.equal(await b.get("sets", async () => 2), 2);
  resolve(1);
  await old;
  assert.equal(await a.get("sets", async () => 3), 2);
});
