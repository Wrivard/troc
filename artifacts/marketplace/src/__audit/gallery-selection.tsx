import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import type { CatalogImage, Product, Variant } from "@workspace/catalog";
import { CatalogArtwork } from "../modules/catalog/CatalogArtwork";
import "@workspace/troc-design-system/styles.css";

const image = (id: string, side: CatalogImage["side"]): CatalogImage => ({
  id, side, url: "/gallery-fixture/" + id + ".svg", sources: [], width: 300, height: 420,
  provenance: { provider: "Isolated QA fixture", externalId: id, sourceUrl: "", license: "QA", capturedAt: "" },
});
const front = image("front", "front"), back = image("back", "back"), detail = image("detail", "detail");
const base: Product = { id: "qa-product", slug: "qa", name: { en: "QA card", fr: "Carte QA" }, gameId: "qa", setId: "qa", type: "raw_single", variants: [], aliases: [], imageUrl: null, images: [front, back, detail] };
const variant: Variant = { id: "qa-variant", printingId: "qa", language: "en", key: "qa", attributes: {}, number: "", rarity: "", artist: "", images: [image("variant-front", "front"), image("variant-back", "back")] };
function Audit() {
  const [product, setProduct] = useState(base);
  const [selectedVariant, setVariant] = useState<Variant>();
  const locale = new URLSearchParams(location.search).get("lang") === "fr" ? "fr" : "en";
  return <main style={{ maxWidth: 380, padding: 20 }}>
    <nav>{["reset", "shrink", "reorder", "product", "variant", "empty"].map(action => <button key={action} onClick={() => {
      if (action === "reset") { setProduct(base); setVariant(undefined); }
      if (action === "shrink") setProduct({ ...base, images: [front, back] });
      if (action === "reorder") setProduct({ ...base, images: [detail, front, back] });
      if (action === "product") setProduct({ ...base, id: "qa-other" });
      if (action === "variant") setVariant(variant);
      if (action === "empty") { setVariant(undefined); setProduct({ ...base, images: [] }); }
    }}>{action}</button>)}</nav>
    <CatalogArtwork product={product} variant={selectedVariant} locale={locale} gallery />
  </main>;
}
createRoot(document.getElementById("root")!).render(<Audit />);
