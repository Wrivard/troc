import type { PGlite } from "@electric-sql/pglite";
import { sampleProducts } from "../artifacts/api-server/src/modules/catalog/sample/data";
export async function addWorkspaceCardArt(db: PGlite) {
  if (
    process.env.TROC_LOCAL_ACCOUNTS !== "true" ||
    process.env.NODE_ENV !== "development"
  )
    throw Error("Local fixture only");
  await db.transaction(async (tx) => {
    if (
      (
        await tx.query(
          "SELECT id FROM troc.demo_batches WHERE seed_key='local-workspace-card-art-v2'",
        )
      ).rows.length
    )
      return;
    const products = sampleProducts.filter(
      (p) => p.type === "raw_single" && p.variants[0]?.images?.length,
    );
    const preferred = [
      "Charizard ex",
      "Pikachu",
      "Bulbasaur",
      "Mewtwo",
      "Venusaur ex",
      "Blastoise ex",
    ];
    products.sort((a, b) => {
      const aa = preferred.indexOf(a.name.en),
        bb = preferred.indexOf(b.name.en);
      return (aa < 0 ? 99 : aa) - (bb < 0 ? 99 : bb);
    });
    for (let i = 0; i < 18; i++) {
      const p = products[i % products.length],
        v = p.variants[0],
        id = "00000000-0000-4000-9000-" + String(1000 + i).padStart(12, "0");
      await tx.query(
        "UPDATE troc.listings SET variant_id=$2 WHERE id=$1 AND seller_sku=$3 AND demo_batch_id IN(SELECT id FROM troc.demo_batches WHERE seed_key='local-workspace-ui-v1')",
        [id, v.id, "TROC-DEMO-" + (100 + i)],
      );
      if (i < 8) {
        const oid =
          "00000000-0000-4000-9000-" + String(3000 + i).padStart(12, "0");
        const row = (
          await tx.query<{ quote: any; marketplace_order_id: string }>(
            "SELECT quote,marketplace_order_id FROM troc.seller_orders WHERE id=$1",
            [oid],
          )
        ).rows[0];
        if (!row) continue;
        const group = row.quote;
        for (const line of group.lines) {
          line.listing = {
            ...line.listing,
            name: p.name,
            variantId: v.id,
            language: v.language,
            imageUrl: v.images?.[0]?.url,
          };
        }
        await tx.query("UPDATE troc.seller_orders SET quote=$2 WHERE id=$1", [
          oid,
          JSON.stringify(group),
        ]);
        await tx.query(
          "UPDATE troc.order_items SET variant_id=$2,snapshot=$3 WHERE seller_order_id=$1",
          [oid, v.id, JSON.stringify(group.lines[0].listing)],
        );
        const parent = (
          await tx.query<{ quote: any }>(
            "SELECT quote FROM troc.marketplace_orders WHERE id=$1",
            [row.marketplace_order_id],
          )
        ).rows[0].quote;
        parent.groups = [group];
        await tx.query(
          "UPDATE troc.marketplace_orders SET quote=$2 WHERE id=$1",
          [row.marketplace_order_id, JSON.stringify(parent)],
        );
      }
    }
    await tx.query(
      "INSERT INTO troc.demo_batches(seed_key) VALUES('local-workspace-card-art-v2')",
    );
  });
}
