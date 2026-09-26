import type { PGlite } from "@electric-sql/pglite";
import { seedCommerceDemo } from "../artifacts/api-server/src/modules/commerce/seed-demo";
export async function seedWorkspaceFixtures(db: PGlite) {
  if (
    process.env.TROC_LOCAL_ACCOUNTS !== "true" ||
    process.env.NODE_ENV !== "development"
  )
    throw Error("Local fixtures only");
  await db.transaction(async (tx) => {
    await seedCommerceDemo(tx);
    const exists = await tx.query(
      "SELECT id FROM troc.demo_batches WHERE seed_key='local-workspace-ui-v1'",
    );
    if (exists.rows.length) return;
    const batch = (
      await tx.query<{ id: string }>(
        "INSERT INTO troc.demo_batches(seed_key) VALUES('local-workspace-ui-v1') RETURNING id",
      )
    ).rows[0].id;
    const sid = "00000000-0000-4000-8000-000000000010";
    const source = (
      await tx.query<any>(
        "SELECT l.*,p.name_en,p.name_fr,pr.language,p.slug FROM troc.listings l JOIN troc.variants v ON v.id=l.variant_id JOIN troc.printings pr ON pr.id=v.printing_id JOIN troc.catalog_products p ON p.id=pr.product_id WHERE l.seller_id<>$1 ORDER BY l.id LIMIT 18",
        [sid],
      )
    ).rows;
    const ids: string[] = [];
    for (let i = 0; i < source.length; i++) {
      const l = source[i],
        id = "00000000-0000-4000-9000-" + String(1000 + i).padStart(12, "0");
      ids.push(id);
      const status =
        i === 14
          ? "draft"
          : i === 15
            ? "paused"
            : i === 16
              ? "sold_out"
              : i === 17
                ? "archived"
                : "active";
      await tx.query(
        "INSERT INTO troc.listings(id,seller_id,variant_id,condition,unit_price_cents,quantity,status,demo_batch_id,seller_sku,source_platform,sync_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          id,
          sid,
          l.variant_id,
          l.condition,
          l.unit_price_cents,
          status === "sold_out" ? 0 : i % 4 === 0 ? 2 : 6 + i,
          status,
          batch,
          "TROC-DEMO-" + (100 + i),
          i % 2 ? "csv" : "manual",
          "not_connected",
        ],
      );
    }
    const states = [
      "awaiting_shipment",
      "awaiting_shipment",
      "shipped",
      "delivered",
      "completed",
      "issue",
      "partially_refunded",
      "completed",
      "refunded",
      "shipped",
    ];
    for (let i = 0; i < states.length; i++) {
      const external = i >= 8,
        l = source[i % source.length],
        listingId = external ? l.id : ids[i % ids.length],
        sellerId = external ? l.seller_id : sid;
      const buyerId = external
        ? "00000000-0000-4000-8000-000000000002"
        : "00000000-0000-4000-8000-000000000001";
      const sellerName = external
        ? (
            await tx.query<any>(
              "SELECT display_name FROM troc.seller_accounts WHERE id=$1",
              [sellerId],
            )
          ).rows[0].display_name
        : "TROC Test Store";
      const id =
          "00000000-0000-4000-9000-" + String(2000 + i).padStart(12, "0"),
        child = "00000000-0000-4000-9000-" + String(3000 + i).padStart(12, "0"),
        quantity = (i % 3) + 1,
        cents = Number(l.unit_price_cents),
        merch = cents * quantity,
        shipping = 250,
        total = merch + shipping;
      const listing = {
        id: listingId,
        sellerId,
        variantId: l.variant_id,
        name: { en: l.name_en, fr: l.name_fr },
        language: l.language,
        condition: l.condition,
        cents,
        quantity,
        grams: 2,
        thicknessMm: 0.3,
      };
      const group = {
        seller: { id: sellerId, name: sellerName, slug: "local-test-store" },
        lines: [
          { listingId, quantity, listing, unitCents: cents, totalCents: merch },
        ],
        cards: quantity,
        merchandiseCents: merch,
        discountCents: 0,
        shipping: {
          cents: shipping,
          method: "standard",
          label: "Test shipping",
        },
        totalCents: total,
        minimumCents: 0,
        minimumMet: true,
        eligible: true,
        issues: [],
      };
      const quote = {
        currency: "CAD",
        groups: [group],
        totalCents: total,
        merchandiseCents: merch,
        shippingCents: shipping,
        discountCents: 0,
        issues: [],
        eligible: true,
      };
      const address = {
        recipient: "Alex Example — TEST",
        line1: "123 Example Street",
        city: "Ottawa",
        province: "ON",
        postalCode: "K1A 0B1",
        country: "CA",
      };
      const days = i * 2,
        refunded =
          states[i] === "refunded"
            ? total
            : states[i] === "partially_refunded"
              ? Math.min(100, total)
              : 0;
      await tx.query(
        "INSERT INTO troc.marketplace_orders(id,buyer_id,status,total_cents,idempotency_key,payment_id,demo_batch_id,quote,address,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()-($10::int*interval '1 day'))",
        [
          id,
          buyerId,
          states[i],
          total,
          "local-workspace-ui-" + i,
          "sim_local_ui_" + i,
          batch,
          JSON.stringify(quote),
          JSON.stringify(address),
          days,
        ],
      );
      await tx.query(
        "INSERT INTO troc.seller_orders(id,marketplace_order_id,seller_id,merchandise_cents,shipping_cents,status,quote,refunded_cents,tracking,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now()-($10::int*interval '1 day'))",
        [
          child,
          id,
          sellerId,
          merch,
          shipping,
          states[i],
          JSON.stringify(group),
          refunded,
          ["shipped", "delivered", "completed"].includes(states[i])
            ? "TEST-TRACK-" + (1000 + i)
            : null,
          days,
        ],
      );
      await tx.query(
        "INSERT INTO troc.order_items(seller_order_id,seller_id,listing_id,variant_id,quantity,unit_price_cents,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [
          child,
          sellerId,
          listingId,
          l.variant_id,
          quantity,
          cents,
          JSON.stringify(listing),
        ],
      );
      if (i === 0 || i === 5)
        await tx.query(
          "INSERT INTO troc.order_messages(seller_order_id,actor_id,author,body) VALUES($1,$2,'buyer',$3)",
          [
            child,
            buyerId,
            i === 0
              ? "Sample message: could you confirm the language on this card?"
              : "Sample issue: one card appears different from the ordered condition.",
          ],
        );
    }
  });
}
