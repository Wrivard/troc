// Disposable feasibility probe: never creates a production search projection.
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  orderListInput,
  orderListConditions,
} from "../artifacts/api-server/src/modules/seller-platform/order-list";
const db = new PGlite({ extensions: { pg_trgm } });
try {
  const dir = new URL("../lib/db/migrations/", import.meta.url);
  for (const f of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort())
    await db.exec(await readFile(new URL(f, dir), "utf8"));
  const owner = randomUUID(),
    foreign = randomUUID(),
    seller = randomUUID();
  for (const id of [owner, foreign])
    await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
      id,
      id + "@example.test",
    ]);
  await db.query(
    "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'cursor-store','Cursor','individual','active')",
    [seller],
  );
  await db.query(
    "INSERT INTO troc.seller_members(seller_id,user_id,role) VALUES($1,$2,'owner')",
    [seller, owner],
  );
  await db.query(
    "INSERT INTO troc.marketplace_orders(id,buyer_id,total_cents,idempotency_key,status,address,demo_batch_id) SELECT md5('cursor-mo-'||g)::uuid,$1,100,'cursor-'||g,CASE WHEN g=20000 THEN 'pending' ELSE 'simulated_paid' END,jsonb_build_object('recipient',CASE WHEN g=1 THEN 'Literal 50%_buyer' ELSE 'Buyer '||g END,'province','ON'),CASE WHEN g=1 THEN (SELECT id FROM troc.demo_batches WHERE seed_key='commerce-simulation') ELSE NULL END FROM generate_series(1,20000)g",
    [owner],
  );
  await db.query(
    "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,created_at,quote) SELECT md5('cursor-so-'||g)::uuid,md5('cursor-mo-'||g)::uuid,$1,100,0,CASE WHEN g%3=0 THEN 'refunded' WHEN g%3=1 THEN 'partially_refunded' ELSE 'awaiting_shipment' END,'2026-01-01T00:00:00Z'::timestamptz + (g%5)*interval '1 microsecond',jsonb_build_object('totalCents',g%11,'merchandiseCents',g%11,'shipping',jsonb_build_object('cents',0),'lines',jsonb_build_array(jsonb_build_object('quantity',1,'unitCents',g%11,'totalCents',g%11,'listing',jsonb_build_object('variantId',md5('cursor-variant-'||g)::uuid,'name',jsonb_build_object('en','English card','fr','Carte française'),'condition','NM')))) FROM generate_series(1,20000)g",
    [seller],
  );

  // Include literal punctuation, accents, absent language and multiple lines.
  await db.query(
    "UPDATE troc.marketplace_orders SET address=jsonb_build_object('recipient',$1::text) WHERE id=md5('cursor-mo-1')::uuid",
    ["Literal 50%_buyer \\ AZ's"],
  );
  await db.exec(
    `UPDATE troc.seller_orders SET quote=jsonb_set(quote,'{lines}', '[{"listing":{"name":{"en":"Alpha","fr":"Étoile"}}},{"listing":{"name":{"en":"Beta"}}}]') WHERE id=md5('cursor-so-1')::uuid`,
  );
  const textFor = (lang: string) =>
    "lower(so.id::text || ' ' || COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer') || ' ' || COALESCE((SELECT string_agg(line->'listing'->'name'->>'" +
    lang +
    "', ' ') FROM jsonb_array_elements(so.quote->'lines') line),''))";
  // Candidate duplicates only existing order text. It contains private buyer data.
  await db.exec(
    "CREATE TABLE troc.probe_order_search AS SELECT so.id,so.seller_id," +
      textFor("en") +
      " AS en," +
      textFor("fr") +
      " AS fr FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id; CREATE UNIQUE INDEX probe_search_id ON troc.probe_order_search(seller_id,id); CREATE INDEX probe_search_en ON troc.probe_order_search USING gin(en extensions.gin_trgm_ops); CREATE INDEX probe_search_fr ON troc.probe_order_search USING gin(fr extensions.gin_trgm_ops); GRANT SELECT ON troc.probe_order_search TO troc_backend; ANALYZE troc.probe_order_search; ANALYZE troc.seller_orders; ANALYZE troc.marketplace_orders",
  );
  const run = (q: string, p: unknown[]) =>
    db.transaction(async (tx) => {
      await tx.exec("SET LOCAL ROLE troc_backend");
      return tx.query<{ id: string }>(q, p);
    });
  const results: unknown[] = [];
  async function compare(q: string, lang: string, scope = seller) {
    const f = orderListInput(scope, { q, lang });
    const { args, where } = orderListConditions(scope, f);
    // Freeze the pre-projection predicate for reproducible baseline comparisons.
    if (args.length === 3) args.push(lang);
    where[where.length - 1] =
      "(" + textFor(lang) + " LIKE $3 AND $4::text IN ('en','fr'))";
    const from =
      " FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id ";
    const baseline =
      "SELECT so.id" +
      from +
      "WHERE " +
      where.join(" AND ") +
      " ORDER BY so.id";
    const candidateWhere = [...where];
    candidateWhere[candidateWhere.length - 1] =
      "search." +
      (lang === "fr" ? "fr" : "en") +
      " LIKE $3 AND $4::text IN ('en','fr')";
    const candidate =
      "SELECT so.id" +
      from +
      "JOIN troc.probe_order_search search ON search.id=so.id AND search.seller_id=so.seller_id WHERE " +
      candidateWhere.join(" AND ") +
      " ORDER BY so.id";
    const a = await run(baseline, args),
      b = await run(candidate, args);
    assert.deepEqual(b.rows, a.rows);
    const plans = [];
    for (const [kind, query] of [
      ["baseline", baseline],
      ["projection", candidate],
    ])
      plans.push({
        kind,
        plan: (
          await run("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + query, args)
        ).rows,
      });
    results.push({
      q,
      lang,
      foreignScope: scope !== seller,
      matches: a.rows.length,
      plans,
    });
    return { baseline, candidate, args };
  }
  for (const lang of ["en", "fr"])
    for (const q of [
      "English",
      "Carte",
      "absent",
      "50%_",
      "\\",
      "AZ's",
      "Alpha Beta",
      "Étoile",
      "a",
      "50",
      "%",
      "_",
    ])
      await compare(q, lang);
  await compare("English", "en", randomUUID());
  // A materialized projection is stale without source write hooks: prove the risk.
  const probe = await compare("Fresh recipient", "en");
  await db.exec(
    "UPDATE troc.marketplace_orders SET address=jsonb_build_object('recipient','Fresh recipient') WHERE id=md5('cursor-mo-1')::uuid",
  );
  assert.equal((await run(probe.baseline, probe.args)).rows.length, 1);
  assert.equal((await run(probe.candidate, probe.args)).rows.length, 0);
  const evidenceDir = new URL(
    "../docs/evidence/seller-order-search-probe/",
    import.meta.url,
  );
  await mkdir(evidenceDir, { recursive: true });
  await writeFile(
    new URL("plans.json", evidenceDir),
    JSON.stringify(
      {
        environment:
          "Disposable PGlite; 20000 generated orders; full matching ID parity, not page or hosted latency",
        results,
        staleProjectionAfterRecipientEdit:
          "reproduced; no production integration",
      },
      null,
      2,
    ),
  );
  console.log(
    results.length,
    "EN/FR/scope comparisons passed; stale recipient update reproduced; disposable DB closes.",
  );
} finally {
  await db.close();
}
