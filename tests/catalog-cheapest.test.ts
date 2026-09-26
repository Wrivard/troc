import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import {
  demoCatalog,
  DemoCatalogProvider,
} from "../artifacts/api-server/src/modules/catalog/demo";
import {
  DemoCatalogRepository,
  PostgresCatalogRepository,
} from "../artifacts/api-server/src/modules/catalog/repository";
import { cheapestOffer } from "../artifacts/api-server/src/modules/catalog/cheapest";
import { publicPage } from "../artifacts/api-server/src/modules/catalog/service";
import {
  runImport,
  type CatalogSqlClient,
} from "../artifacts/api-server/src/modules/catalog/importer";
import { filtersFrom } from "../artifacts/api-server/src/modules/catalog/search";

test("fresh qty-one chooses global matching minimum with deterministic ties and cart capacity", async () => {
  const data = demoCatalog(),
    product = data.products[0],
    variant = product.variants[0].id;
  const template = data.offers[0];
  data.offers = [
    {
      ...template,
      id: "a",
      variantId: variant,
      cents: 1,
      quantity: 1,
      condition: "NM",
    },
    {
      ...template,
      id: "b",
      variantId: variant,
      cents: 2,
      quantity: 3,
      condition: "NM",
    },
    {
      ...template,
      id: "c",
      variantId: variant,
      cents: 2,
      quantity: 200,
      condition: "NM",
    },
    {
      ...template,
      id: "empty",
      variantId: variant,
      cents: 0,
      quantity: 0,
      condition: "NM",
    },
    {
      ...template,
      id: "lp",
      variantId: variant,
      cents: 0,
      quantity: 3,
      condition: "LP",
    },
    {
      ...template,
      id: "wrong",
      variantId: "another",
      cents: 0,
      quantity: 3,
      condition: "NM",
    },
  ];
  const repo = new DemoCatalogRepository(data);
  const input = {
    path: "/product/" + product.slug,
    selection:
      "variantId=" +
      variant +
      "&condition=NM&offerPage=999&offerSort=price_desc",
    cart: [] as { listingId: string; quantity: number }[],
  };
  assert.equal((await cheapestOffer(input, repo)).offer?.id, "a");
  input.cart = [{ listingId: "a", quantity: 1 }];
  assert.equal((await cheapestOffer(input, repo)).offer?.id, "b");
  input.cart.push({ listingId: "b", quantity: 3 });
  assert.equal((await cheapestOffer(input, repo)).offer?.id, "c");
  input.cart.push({ listingId: "c", quantity: 100 });
  assert.equal((await cheapestOffer(input, repo)).offer, null);
  const full = Array.from({ length: 100 }, (_, i) => ({
    listingId: "line-" + i,
    quantity: 1,
  }));
  assert.equal(
    (await cheapestOffer({ ...input, cart: full }, repo)).offer,
    null,
  );
  full[0] = { listingId: "b", quantity: 1 };
  assert.equal(
    (await cheapestOffer({ ...input, cart: full }, repo)).offer?.id,
    "b",
  );
  assert.equal(
    (
      await cheapestOffer(
        {
          ...input,
          selection: "variantId=" + variant + "&condition=LP",
          cart: [],
        },
        repo,
      )
    ).offer?.id,
    "lp",
  );
  assert.equal(
    (
      await cheapestOffer(
        { ...input, selection: "variantId=" + variant + "&min=3", cart: [] },
        repo,
      )
    ).offer,
    null,
  );
  data.sellers[0].minimumCents = 999999;
  assert.equal(
    (await cheapestOffer({ ...input, cart: [] }, repo)).offer?.id,
    "a",
  );
  const display = await publicPage(
    input.path,
    new URLSearchParams(
      "variantId=" + variant + "&condition=NM&offerPage=2&offerLimit=1",
    ),
    repo,
  );
  assert.equal(display.offers[0].id, "b");
  assert.equal(display.results[0].lowestCents, 1);
  for (const bad of [
    null,
    {},
    { ...input, cart: [{ listingId: "a", quantity: 0 }] },
    {
      ...input,
      cart: [
        { listingId: "a", quantity: 1 },
        { listingId: "a", quantity: 1 },
      ],
    },
    { ...input, cart: Array(101).fill({ listingId: "a", quantity: 1 }) },
    { ...input, selection: "variantId=wrong" },
    { ...input, selection: "x".repeat(2001) },
  ])
    await assert.rejects(cheapestOffer(bad, repo));
});

test("PostgreSQL selection applies remaining stock and active Canadian seller rules across all pages", async () => {
  const db = new PGlite({ extensions: { pg_trgm } });
  const sql: CatalogSqlClient = {
    query: async (text, values) => db.query(text, values),
  };
  try {
    for (const file of (await readdir("lib/db/migrations")).filter(f=>f.endsWith(".sql")).sort()) await db.exec(await readFile("lib/db/migrations/"+file,"utf8"));
    const user = "12345678-1234-4234-8234-123456789012";
    await db.query(
      "INSERT INTO troc.users(id,email) VALUES($1,'cheapest@example.invalid')",
      [user],
    );
    await runImport(
      sql,
      new DemoCatalogProvider(),
      { userId: user, roles: ["catalog_moderator"], memberships: [] },
      "cheapest-test",
    );
    const repo = new PostgresCatalogRepository(sql);
    const product = (await repo.search(filtersFrom(new URLSearchParams())))
      .items[0].product;
    const variant = product.variants[0].id;
    const seller = (
      await db.query<{ id: string }>(
        "INSERT INTO troc.seller_accounts(slug,display_name,seller_type,status) VALUES('cheapest','Cheapest test','individual','active') RETURNING id",
      )
    ).rows[0].id;
    const ids = [
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002",
      "00000000-0000-4000-8000-000000000003",
    ];
    for (const [i, id] of ids.entries())
      await db.query(
        "INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,$3,'NM',$4,$5,'active')",
        [id, seller, variant, i ? 2 : 1, i ? 200 : 1],
      );
    const input = {
      path: "/product/" + product.slug,
      selection:
        "variantId=" +
        variant +
        "&condition=NM&offerSort=price_desc&offerPage=3",
      cart: [] as { listingId: string; quantity: number }[],
    };
    assert.equal((await cheapestOffer(input, repo)).offer?.id, ids[0]);
    input.cart = [{ listingId: ids[0], quantity: 1 }];
    assert.equal((await cheapestOffer(input, repo)).offer?.id, ids[1]);
    input.cart.push({ listingId: ids[1], quantity: 100 });
    assert.equal((await cheapestOffer(input, repo)).offer?.id, ids[2]);
    const full = Array.from({ length: 100 }, (_, i) => ({
      listingId: "line-" + i,
      quantity: 1,
    }));
    assert.equal(
      (await cheapestOffer({ ...input, cart: full }, repo)).offer,
      null,
    );
    full[0] = { listingId: ids[2], quantity: 1 };
    assert.equal(
      (await cheapestOffer({ ...input, cart: full }, repo)).offer?.id,
      ids[2],
    );
    await assert.rejects(
      db.query("UPDATE troc.seller_accounts SET country='US' WHERE id=$1", [
        seller,
      ]),
    );
    await db.query(
      "UPDATE troc.seller_accounts SET country='CA',status='suspended' WHERE id=$1",
      [seller],
    );
    assert.equal(
      (await cheapestOffer({ ...input, cart: [] }, repo)).offer,
      null,
    );
  } finally {
    await db.close();
  }
});
