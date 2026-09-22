import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import type {
  CartLine,
  CommerceListing,
  CommerceSeller,
} from "../lib/commerce/src/index";
import {
  allocate,
  fees,
  quoteCart,
  reward,
  transition,
} from "../artifacts/api-server/src/modules/commerce/calculations";
import { optimizeCart } from "../artifacts/api-server/src/modules/commerce/smart-cart";
import { commerceConfig } from "../artifacts/api-server/src/modules/commerce/config";
import { CartService } from "../artifacts/api-server/src/modules/commerce/service";
import { loadCommerce } from "../artifacts/api-server/src/modules/commerce/data";
import {
  CheckoutService,
  type TransactionStore,
} from "../artifacts/api-server/src/modules/commerce/checkout";
import { SimulatedPaymentProvider } from "../artifacts/api-server/src/modules/commerce/payment";
import { OrderService } from "../artifacts/api-server/src/modules/commerce/orders";
import type { Sql } from "../artifacts/api-server/src/modules/commerce/data";
const seller = (
  id = "a",
  extra: Partial<CommerceSeller> = {},
): CommerceSeller => ({
  id,
  name: id,
  slug: id,
  active: true,
  country: "CA",
  level: "new",
  minimumCents: 0,
  handlingDays: 2,
  reputation: 95,
  badges: [],
  freeShippingCents: null,
  promotions: [],
  ...extra,
});
const listing = (
  id = "1",
  sellerId = "a",
  extra: Partial<CommerceListing> = {},
): CommerceListing => ({
  id,
  sellerId,
  productId: id,
  printingId: id,
  variantId: id,
  language: "en",
  condition: "NM",
  productType: "raw_single",
  name: { en: id, fr: id },
  slug: id,
  setId: "set",
  setSlug: "set",
  special: false,
  imageUrl: null,
  cents: 25,
  saleCents: null,
  quantity: 100,
  active: true,
  grams: 2,
  thicknessMm: 0.3,
  promoted: false,
  demo: true,
  ...extra,
});
const line = (listingId = "1", quantity = 1): CartLine => ({
  listingId,
  quantity,
});
test("low-value singles, minimums, promotions and sale stacking stay exact", () => {
  for (const cents of [5, 10, 25, 50])
    assert.equal(
      quoteCart([line()], [listing("1", "a", { cents })], [seller()])
        .merchandiseCents,
      cents,
    );
  const s = seller("a", {
    minimumCents: 500,
    promotions: [
      { id: "five", minimumCards: 5, basisPoints: 500 },
      { id: "ten", minimumCards: 10, basisPoints: 1000 },
      { id: "twenty", minimumCards: 20, basisPoints: 1500 },
      { id: "coupon", coupon: "TROC", basisPoints: 2000 },
    ],
  });
  assert.equal(
    quoteCart([line()], [listing()], [s]).groups[0].minimumRemainingCents,
    475,
  );
  const q = quoteCart([line("1", 20)], [listing()], [s]);
  assert.equal(q.discountCents, 75);
  assert.equal(q.eligible, true);
  assert.equal(q.groups[0].promotionId, "twenty");
  assert.equal(
    quoteCart([line("1", 20)], [listing()], [s], { coupon: "TROC" })
      .discountCents,
    100,
  );
  assert.equal(
    quoteCart([line("1", 20)], [listing("1", "a", { saleCents: 20 })], [s], {
      coupon: "TROC",
    }).discountCents,
    0,
  );
  assert.throws(
    () => quoteCart([line(), line()], [listing()], [s]),
    /duplicate_listing/,
  );
});
test("shipping aggregates 1/3/10/30 cards, mixed sealed, tracked threshold and level-gated free shipping", () => {
  for (const [quantity, cents] of [
    [1, 150],
    [3, 150],
    [10, 250],
    [30, 400],
  ])
    assert.equal(
      quoteCart([line("1", quantity)], [listing()], [seller()]).shippingCents,
      cents,
    );
  assert.equal(
    quoteCart(
      [line(), line("2")],
      [
        listing(),
        listing("2", "a", {
          productType: "sealed",
          grams: 300,
          thicknessMm: 40,
        }),
      ],
      [seller()],
    ).shippingCents,
    1200,
  );
  assert.equal(
    quoteCart([line()], [listing("1", "a", { cents: 5000 })], [seller()])
      .groups[0].shipping.tracked,
    true,
  );
  assert.equal(
    quoteCart([line()], [listing()], [seller("a", { freeShippingCents: 1 })])
      .shippingCents,
    150,
  );
  assert.equal(
    quoteCart(
      [line()],
      [listing()],
      [seller("a", { freeShippingCents: 25, level: "trusted" })],
    ).shippingCents,
    0,
  );
});
test("processing fixed fee occurs once and pennies allocate exactly; attributable fees and rewards configurable", () => {
  const q = quoteCart(
    [line(), line("2"), line("3")],
    [
      listing("1", "a", { promoted: true }),
      listing("2", "b"),
      listing("3", "c"),
    ],
    [seller(), seller("b"), seller("c")],
  );
  const f = fees(q);
  assert.equal(f.processingCents, 45);
  assert.equal(
    f.allocations.reduce((n, a) => n + a.processingCents, 0),
    45,
  );
  assert.equal(f.allocations[0].commissionCents, 2);
  assert.equal(f.allocations[0].shippingCommissionCents, 0);
  assert.equal(f.allocations[0].promotedCents, 1);
  assert.deepEqual(allocate(2, [1, 1, 1]), [1, 1, 0]);
  for (let n = 0; n < 100; n++)
    assert.equal(
      allocate(n, [7, 13, 29]).reduce((a, b) => a + b, 0),
      n,
    );
  const large = quoteCart([line("1", 20)], [listing()], [seller()]);
  assert.equal(reward(large, true, 0), 50);
  assert.equal(reward(large, false, 0), 25);
});
test("Smart Cart consolidates landed cost and preserves language, printing, condition and locks", () => {
  const offers = [
    listing("a1", "a", {
      variantId: "v1",
      printingId: "p1",
      productId: "p1",
      cents: 25,
    }),
    listing("b1", "b", {
      variantId: "v1",
      printingId: "p1",
      productId: "p1",
      cents: 30,
    }),
    listing("b2", "b", {
      variantId: "v2",
      printingId: "p2",
      productId: "p2",
      cents: 25,
    }),
    listing("a2", "a", {
      variantId: "v2",
      printingId: "p2",
      productId: "p2",
      cents: 30,
    }),
  ];
  const result = optimizeCart([line("a1"), line("b2")], offers, [
    seller(),
    seller("b"),
  ]);
  assert.equal(result.original.totalCents, 350);
  assert.equal(result.optimized.totalCents, 205);
  assert.equal(result.savingsCents, 145);
  assert.equal(result.shippingSavingsCents, 150);
  assert.equal(result.optimized.groups.length, 1);
  for (const change of [
    { language: "ja" as const },
    { condition: "LP" as const },
    { printingId: "other" },
    { variantId: "other" },
    { active: false },
  ]) {
    const changed = offers.map((l) =>
      l.id === "b1" || l.id === "a2" ? { ...l, ...change } : l,
    );
    assert.equal(
      optimizeCart([line("a1"), line("b2")], changed, [seller(), seller("b")])
        .savingsCents,
      0,
    );
  }
  assert.equal(
    optimizeCart(
      [
        { ...line("a1"), lockListing: true },
        { ...line("b2"), lockSeller: true },
      ],
      offers,
      [seller(), seller("b")],
    ).savingsCents,
    0,
  );
});
test("Smart Cart uses promotion and free-shipping thresholds, splits stock and remains bounded for 100 lines", () => {
  const offers = Array.from({ length: 100 }, (_, i) => [
    listing("a" + i, "a", {
      variantId: "v" + i,
      printingId: "p" + i,
      productId: "p" + i,
    }),
    listing("b" + i, "b", {
      variantId: "v" + i,
      printingId: "p" + i,
      productId: "p" + i,
      cents: 30,
    }),
  ]).flat();
  const sellers = [
    seller(),
    seller("b", {
      level: "trusted",
      freeShippingCents: 500,
      promotions: [{ id: "bulk", minimumCards: 20, basisPoints: 1500 }],
    }),
  ];
  const result = optimizeCart(
    Array.from({ length: 20 }, (_, i) => line("a" + i)),
    offers,
    sellers,
  );
  assert.equal(result.original.totalCents, 900);
  assert.equal(result.optimized.totalCents, 510);
  assert.equal(result.savingsCents, 390);
  const hundred = optimizeCart(
    Array.from({ length: 100 }, (_, i) => line("a" + i)),
    offers,
    sellers,
  );
  assert.ok(hundred.evaluated <= commerceConfig.maxEvaluations);
  assert.equal(hundred.optimized.cards, 100);
  const split = optimizeCart(
    [line("a1", 4)],
    [
      listing("a1", "a", { quantity: 4 }),
      listing("b1", "b", {
        productId: "a1",
        printingId: "a1",
        variantId: "a1",
        quantity: 2,
        cents: 1,
      }),
    ],
    [seller(), seller("b")],
  );
  assert.equal(split.optimized.cards, 4);
});
test("order transitions reject jumps and terminal mutations", () => {
  transition("awaiting_shipment", "shipped");
  transition("shipped", "delivered");
  transition("delivered", "completed");
  assert.throws(() => transition("awaiting_shipment", "completed"));
  assert.throws(() => transition("refunded", "shipped"));
});

async function database() {
  const db = new PGlite({ extensions: { pg_trgm } });
  const directory = new URL("../lib/db/migrations/", import.meta.url);
  for (const name of (await readdir(directory))
    .filter((n) => n.endsWith(".sql"))
    .sort())
    await db.exec(await readFile(new URL(name, directory), "utf8"));
  return db;
}
test("PostgreSQL checkout reservations, retries, isolation, refunds and append-only credit", async () => {
  const db = await database();
  const store: TransactionStore = {
    transaction: (work) =>
      db.transaction(async (tx) => {
        await tx.exec("SET LOCAL ROLE troc_backend");
        return work(tx as Sql);
      }),
  };
  const buyer = randomUUID(),
    other = randomUUID(),
    owner = randomUUID(),
    sellerId = randomUUID(),
    game = randomUUID(),
    set = randomUUID(),
    product = randomUUID(),
    printing = randomUUID(),
    variant = randomUUID(),
    offer = randomUUID();
  const principal = { userId: buyer, roles: [], memberships: [] };
  try {
    for (const id of [buyer, other, owner])
      await db.query("INSERT INTO troc.users(id,email) VALUES($1,$2)", [
        id,
        id + "@example.test",
      ]);
    await db.query(
      "INSERT INTO troc.seller_accounts(id,slug,display_name,seller_type,status) VALUES($1,'seller','Seller','individual','active')",
      [sellerId],
    );
    await db.query(
      "INSERT INTO troc.games(id,slug,name_en,name_fr) VALUES($1,'game','Game','Jeu')",
      [game],
    );
    await db.query(
      "INSERT INTO troc.set_releases(id,game_id,slug,name_en,name_fr) VALUES($1,$2,'set','Set','Série')",
      [set, game],
    );
    await db.query(
      "INSERT INTO troc.catalog_products(id,game_id,set_id,slug,name_en,name_fr,product_type) VALUES($1,$2,$3,'card','Card','Carte','raw_single')",
      [product, game, set],
    );
    await db.query(
      "INSERT INTO troc.printings(id,product_id,language,printing_key) VALUES($1,$2,'en','normal')",
      [printing, product],
    );
    await db.query(
      "INSERT INTO troc.variants(id,printing_id,variant_key) VALUES($1,$2,'normal')",
      [variant, printing],
    );
    await db.query(
      "INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status) VALUES($1,$2,$3,'NM',25,1,'active')",
      [offer, sellerId, variant],
    );
    for (const id of [buyer, other])
      await db.query("INSERT INTO troc.carts(buyer_id,lines) VALUES($1,$2)", [
        id,
        JSON.stringify([line(offer)]),
      ]);
    await db.query(
      "INSERT INTO troc.credit_ledger(user_id,kind,cents,idempotency_key) VALUES($1,'promotional',100,'initial')",
      [buyer],
    );
    const input = {
      address: {
        recipient: "Test Buyer",
        line1: "1 Test Street",
        line2: "",
        city: "Toronto",
        province: "ON",
        postalCode: "M5V 1A1",
        country: "CA" as const,
      },
      creditCents: 50,
      idempotencyKey: "checkout_test_001",
    };
    const checkout = new CheckoutService(store);
    const id = await checkout.prepare(principal, input);
    assert.equal(
      (
        await db.query<{ quantity: number }>(
          "SELECT quantity FROM troc.listings WHERE id=$1",
          [offer],
        )
      ).rows[0].quantity,
      1,
    );
    await assert.rejects(
      () =>
        checkout.prepare(
          { ...principal, userId: other },
          { ...input, creditCents: 0, idempotencyKey: "checkout_test_002" },
        ),
      /inventory_unavailable/,
    );
    assert.equal(await checkout.prepare(principal, input), id);
    await assert.rejects(
      () => checkout.prepare(principal, { ...input, creditCents: 0 }),
      /idempotency_conflict/,
    );
    await checkout.finish(principal, id);
    await checkout.finish(principal, id);
    assert.equal(
      (
        await db.query<{ quantity: number }>(
          "SELECT quantity FROM troc.listings WHERE id=$1",
          [offer],
        )
      ).rows[0].quantity,
      0,
    );
    assert.equal(
      (await db.query("SELECT * FROM troc.inventory_events")).rows.length,
      1,
    );
    assert.equal(
      (await db.query("SELECT * FROM troc.fee_ledger")).rows.length,
      4,
    );
    const orders = new OrderService(store);
    assert.deepEqual(
      await new CartService(store, db).repair([line(offer)]),
      [],
    );
    const view = await orders.read(db, principal, id);
    assert.equal(view.status, "awaiting_shipment");
    await assert.rejects(
      () => orders.read(db, { ...principal, userId: other }, id),
      /not_found/,
    );
    const child = view.groups[0].id;
    await assert.rejects(
      () =>
        orders.action(principal, child, {
          action: "shipped",
          idempotencyKey: "buyer_invalid_ship",
        }),
      /forbidden/,
    );
    const ownerPrincipal = {
      userId: owner,
      roles: [],
      memberships: [{ sellerId, role: "owner" as const, active: true }],
    };
    await assert.rejects(
      () =>
        orders.action(ownerPrincipal, child, {
          action: "refunded",
          idempotencyKey: "invalid_direct_refund",
        }),
      /invalid_order_action/,
    );
    await db.query(
      "UPDATE troc.printings SET collector_number='007/100' WHERE id=$1",
      [printing],
    );
    for (const candidates of [false, true]) {
      const loaded = (
        await loadCommerce(db, [offer], candidates)
      ).listings.find((l) => l.id === offer);
      assert.ok(loaded);
      assert.equal(loaded.variantKey, "normal");
      assert.equal(loaded.collectorNumber, "007/100");
    }
    assert.equal(
      (await orders.read(db, ownerPrincipal, child, true)).groups.length,
      1,
    );

    await assert.rejects(
      () =>
        orders.read(db, { ...ownerPrincipal, memberships: [] }, child, true),
      /not_found/,
    );
    await orders.action(ownerPrincipal, child, {
      action: "shipped",
      idempotencyKey: "seller_valid_ship",
    });
    await orders.action(principal, child, {
      action: "delivered",
      idempotencyKey: "buyer_valid_deliver",
    });
    await orders.action(principal, child, {
      action: "completed",
      idempotencyKey: "buyer_valid_complete",
    });
    await orders.action(ownerPrincipal, child, {
      action: "refund",
      amountCents: 10,
      idempotencyKey: "seller_partial_refund",
    });
    await orders.action(ownerPrincipal, child, {
      action: "refund",
      amountCents: 10,
      idempotencyKey: "seller_partial_refund",
    });
    assert.equal(
      (await orders.read(db, principal, id)).groups[0].refundedCents,
      10,
    );
    await assert.rejects(
      () => db.query("UPDATE troc.credit_ledger SET cents=999"),
      /Append-only/,
    );
    await assert.rejects(
      () =>
        db.query(
          "INSERT INTO troc.credit_ledger(user_id,kind,cents,idempotency_key) VALUES($1,'consumption',-999,'overspend')",
          [buyer],
        ),
      /Insufficient credit/,
    );
    // Cancellation of a pending checkout releases the reservation and restores consumed credit.
    await db.query(
      "UPDATE troc.listings SET quantity=1,status='active' WHERE id=$1",
      [offer],
    );
    await db.query("UPDATE troc.carts SET lines=$2 WHERE buyer_id=$1", [
      buyer,
      JSON.stringify([line(offer)]),
    ]);
    const declined = new CheckoutService(
      store,
      new SimulatedPaymentProvider(true),
    );
    const failed = await declined.checkout(principal, {
      ...input,
      idempotencyKey: "checkout_declined_01",
    });
    assert.equal(
      (
        await db.query<{ status: string }>(
          "SELECT status FROM troc.marketplace_orders WHERE id=$1",
          [failed],
        )
      ).rows[0].status,
      "cancelled",
    );
    assert.equal(
      (
        await db.query<{ quantity: number }>(
          "SELECT quantity FROM troc.listings WHERE id=$1",
          [offer],
        )
      ).rows[0].quantity,
      1,
    );
    class FailedSimulation extends SimulatedPaymentProvider {
      override async pay(): Promise<never> {
        throw new Error("simulation_failure");
      }
    }
    const failedProviderId = await new CheckoutService(
      store,
      new FailedSimulation(),
    ).checkout(principal, {
      ...input,
      idempotencyKey: "simulation_exception_01",
    });
    assert.equal(
      (await orders.read(db, principal, failedProviderId)).status,
      "cancelled",
    );
    const pending = await checkout.prepare(principal, {
      ...input,
      idempotencyKey: "checkout_expiry_01",
    });
    await db.query(
      "UPDATE troc.marketplace_orders SET created_at=now()-interval '16 minutes' WHERE id=$1",
      [pending],
    );
    const carts = new CartService(store, db);
    const recovered = await carts.read(principal);
    assert.equal(recovered.creditCents, 60);
    await carts.read(principal);
    assert.equal(
      (
        await db.query(
          "SELECT * FROM troc.credit_ledger WHERE idempotency_key=$1",
          [pending + ":release"],
        )
      ).rows.length,
      1,
    );
    const attempts = await Promise.allSettled([
      checkout.prepare(principal, {
        ...input,
        creditCents: 0,
        idempotencyKey: "concurrent_buyer_01",
      }),
      checkout.prepare(
        { ...principal, userId: other },
        { ...input, creditCents: 0, idempotencyKey: "concurrent_buyer_02" },
      ),
    ]);
    assert.equal(attempts.filter((a) => a.status === "fulfilled").length, 1);
    for (const [index, attempt] of attempts.entries())
      if (attempt.status === "fulfilled")
        await checkout.finish(
          index === 0 ? principal : { ...principal, userId: other },
          attempt.value,
          true,
        );
    await db.query(
      "UPDATE troc.listings SET quantity=100,status='active' WHERE id=$1",
      [offer],
    );
    await db.query("UPDATE troc.carts SET lines=$2 WHERE buyer_id=$1", [
      buyer,
      JSON.stringify([line(offer, 20)]),
    ]);
    const rewardedId = await checkout.checkout(principal, {
      ...input,
      creditCents: 0,
      idempotencyKey: "rewarded_checkout_01",
    });
    const rewarded = await orders.read(db, principal, rewardedId),
      rewardChild = rewarded.groups[0].id;
    await db.query("UPDATE troc.users SET status='suspended' WHERE id=$1", [
      buyer,
    ]);
    await orders.action(ownerPrincipal, rewardChild, {
      action: "shipped",
      idempotencyKey: "ship_suspended_buyer",
    });
    await db.query("UPDATE troc.users SET status='active' WHERE id=$1", [
      buyer,
    ]);
    await orders.action(principal, rewardChild, {
      action: "delivered",
      idempotencyKey: "reward_order_deliver",
    });
    await orders.action(principal, rewardChild, {
      action: "completed",
      idempotencyKey: "reward_order_complete",
    });
    await orders.action(principal, rewardChild, {
      action: "completed",
      idempotencyKey: "reward_order_complete",
    });
    assert.equal(
      (
        await db.query(
          "SELECT * FROM troc.credit_ledger WHERE marketplace_order_id=$1 AND kind='reward'",
          [rewardedId],
        )
      ).rows.length,
      1,
    );
    await assert.rejects(
      () =>
        orders.action(
          {
            ...ownerPrincipal,
            memberships: [{ sellerId, role: "fulfillment", active: true }],
          },
          rewardChild,
          {
            action: "refund",
            amountCents: 1,
            idempotencyKey: "fulfillment_no_refund",
          },
        ),
      /forbidden/,
    );
    await orders.action(ownerPrincipal, rewardChild, {
      action: "refund",
      amountCents: rewarded.totalCents,
      idempotencyKey: "reward_full_refund_01",
    });
    assert.equal(
      (await orders.read(db, principal, rewardedId)).status,
      "refunded",
    );
    assert.equal(
      (
        await db.query<{ cents: number }>(
          "SELECT cents FROM troc.credit_ledger WHERE marketplace_order_id=$1 AND kind='reward_reversal'",
          [rewardedId],
        )
      ).rows[0].cents,
      -25,
    );
    const listed = await orders.list(db, principal);
    assert.equal(
      (await orders.list(db, principal, false, listed[0].id)).some(
        (o) => o.id === listed[0].id,
      ),
      false,
    );
  } finally {
    await db.close();
  }
});

test("three auditable Smart Cart scenarios and a 50-card master-set purchase", async () => {
  const records = [];
  for (const count of [2, 3, 50]) {
    const sellers = Array.from({ length: count === 2 ? 2 : 3 }, (_, i) =>
      seller(String(i), {
        level: count === 50 ? "trusted" : "new",
        freeShippingCents: count === 50 ? 1000 : null,
        promotions: [
          { id: "bulk", minimumCards: 20, basisPoints: 1500 },
          { id: "ten", minimumCards: 10, basisPoints: 1000 },
        ],
      }),
    );
    const offers = Array.from({ length: count }, (_, i) =>
      sellers.map((s, j) =>
        listing(`${i}-${j}`, s.id, {
          productId: "p" + i,
          printingId: "pr" + i,
          variantId: "v" + i,
          cents: j === i % sellers.length ? 25 : 30,
        }),
      ),
    ).flat();
    const original = Array.from({ length: count }, (_, i) =>
      line(`${i}-${i % sellers.length}`, count === 3 ? 10 : 1),
    );
    const result = optimizeCart(original, offers, sellers);
    assert.ok(result.savingsCents > 0);
    assert.equal(result.optimized.cards, count === 3 ? 30 : count);
    records.push({
      cards: result.optimized.cards,
      originalCents: result.original.totalCents,
      naiveCents: result.naive.totalCents,
      optimizedCents: result.optimized.totalCents,
      sellersBefore: result.original.groups.length,
      sellersAfter: result.optimized.groups.length,
      shippingBefore: result.original.shippingCents,
      shippingAfter: result.optimized.shippingCents,
      savingsCents: result.savingsCents,
      evaluated: result.evaluated,
    });
  }
  await writeFile(
    new URL("../verification/smart-cart-scenarios.json", import.meta.url),
    JSON.stringify(records, null, 2),
  );
});
