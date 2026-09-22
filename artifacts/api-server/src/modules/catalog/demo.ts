import type { CatalogSnapshot, ImportRecord } from "@workspace/catalog";
import type { CatalogProvider } from "../providers/contracts";
const id = (group: number, item: number) =>
  `00000000-0000-4000-8${String(group).padStart(3, "0")}-${String(item).padStart(12, "0")}`;
export function demoCatalog(): CatalogSnapshot {
  const games = [
    "Pokémon",
    "Magic: The Gathering",
    "Yu-Gi-Oh!",
    "One Piece",
    "Riftbound",
  ].map((name, i) => ({
    id: id(1, i),
    slug: ["pokemon", "magic", "yu-gi-oh", "one-piece", "riftbound"][i],
    name: { en: name, fr: name },
  }));
  const sets = games.map((game, i) => ({
    id: id(2, i),
    gameId: game.id,
    slug: `${game.slug}-demo-set`,
    name: {
      en: "Northern Lights — demo set",
      fr: "Aurores boréales — série démo",
    },
    releasedOn: "2026-09-01",
  }));
  const products = games.flatMap((game, i) =>
    [0, 1, 2].map((j) => {
      const n = i * 3 + j;
      return {
        id: id(3, n),
        slug: `${game.slug}-${["northern-spark", "collectors-box", "graded-spark"][j]}`,
        gameId: game.id,
        setId: sets[i].id,
        name: {
          en: ["Northern Spark", "Collector’s Box", "Northern Spark · Graded"][
            j
          ],
          fr: [
            "Étincelle boréale",
            "Coffret de collection",
            "Étincelle boréale · Certifiée",
          ][j],
        },
        type: (["raw_single", "sealed", "graded_card"] as const)[j],
        aliases: [`demo ${game.slug}`, "northern light"],
        imageUrl: null,
        variants: (j === 0 ? [0, 1, 2] : [0]).map((v) => ({
          id: id(4, n * 3 + v),
          printingId: id(5, n * 3 + (v === 2 ? 1 : 0)),
          language: v === 2 ? ("ja" as const) : ("en" as const),
          key: v === 1 ? "foil" : "standard",
          attributes: v === 1 ? { finish: "foil" } : { finish: "standard" },
          number: String(n + 1).padStart(3, "0"),
          rarity: j === 0 ? "common" : "special",
          artist: "TROC demo fixture",
        })),
      };
    }),
  );
  const sellers = [
    {
      name: "Cartes du Nord",
      slug: "cartes-du-nord",
      city: "Montréal",
      province: "QC",
    },
    {
      name: "Maple Singles",
      slug: "maple-singles",
      city: "Toronto",
      province: "ON",
    },
    {
      name: "West Coast Cards",
      slug: "west-coast-cards",
      city: "Vancouver",
      province: "BC",
    },
  ].map((s, i) => ({
    ...s,
    id: id(6, i),
    story: {
      en: "A fictional Canadian seller for exploring the TROC marketplace. No orders or customer reviews have been generated.",
      fr: "Un vendeur canadien fictif pour explorer TROC. Aucune commande ni aucun avis client n’a été généré.",
    },
    level: ["new", "established", "trusted"][i],
    minimumCents: [0, 200, 500][i],
    handlingDays: i + 1,
    demo: true,
    logoUrl: null,
    bannerUrl: null,
    verifiedShop: false,
  }));
  const offers = products.flatMap((p, n) =>
    p.variants.flatMap((v, k) =>
      sellers.map((s, i) => ({
        id: id(7, n * 20 + k * 3 + i),
        variantId: v.id,
        sellerId: s.id,
        condition:
          p.type === "sealed" ? null : (["NM", "LP", "NM"] as const)[i],
        cents:
          p.type === "raw_single"
            ? [1, 15, 25][i] + n * 5 + k * 30
            : p.type === "sealed"
              ? 4500 + n * 100 + i * 100
              : 6500 + n * 100 + i * 200,
        quantity: p.type === "graded_card" ? 1 : 10 + i * 3,
        grade: p.type === "graded_card" ? "9" : null,
        photos: [],
        demo: true,
      })),
    ),
  );
  const prices = products.flatMap((p, n) =>
    p.variants.flatMap((v, k) =>
      [0, 1, 2, 3, 4, 5].map((day) => ({
        variantId: v.id,
        cents:
          p.type === "raw_single"
            ? 25 + n * 5 + k * 30 + day * 2
            : p.type === "sealed"
              ? 4900 + n * 100 + day * 50
              : 7000 + n * 100 + day * 50,
        capturedAt: `2026-09-${String(day + 10).padStart(2, "0")}T12:00:00Z`,
        provider: "TROC fictional demo",
        providerProductId: `fixture:${v.id}`,
        condition: p.type === "raw_single" ? ("NM" as const) : null,
        grade: p.type === "graded_card" ? "9" : null,
        sourceCurrency: "CAD",
        sourceMinorUnits:
          p.type === "raw_single"
            ? 25 + n * 5 + k * 30 + day * 2
            : p.type === "sealed"
              ? 4900 + n * 100 + day * 50
              : 7000 + n * 100 + day * 50,
        fxRate: "1",
        fxDate: `2026-09-${String(day + 10).padStart(2, "0")}`,
        providerUpdatedAt: `2026-09-${String(day + 10).padStart(2, "0")}T12:00:00Z`,
        demo: true,
      })),
    ),
  );
  return { games, sets, products, sellers, offers, prices, demo: true };
}
export class DemoCatalogProvider implements CatalogProvider {
  readonly id = "troc-fixture";
  async records({ cursor, limit }: { cursor?: string; limit: number }) {
    const data = demoCatalog();
    const records: ImportRecord[] = data.products.flatMap((p) =>
      p.variants.map((v) => {
        const game = data.games.find((g) => g.id === p.gameId)!;
        const set = data.sets.find((s) => s.id === p.setId)!;
        return {
          externalId: `${p.slug}:${v.language}:${v.key}`,
          game: { key: game.slug, name: game.name },
          set: { key: set.slug, name: set.name, releasedOn: set.releasedOn },
          product: {
            key: p.slug,
            name: p.name,
            type: p.type,
            aliases: p.aliases,
          },
          printing: {
            key: v.language,
            language: v.language,
            number: v.number,
            rarity: v.rarity,
            artist: v.artist,
          },
          variant: { key: v.key, attributes: v.attributes },
          image: null,
        };
      }),
    );
    const offset = Number(cursor || 0);
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 200
    )
      throw new Error("invalid_page");
    return {
      items: records.slice(offset, offset + limit),
      nextCursor:
        offset + limit < records.length ? String(offset + limit) : undefined,
    };
  }
}
