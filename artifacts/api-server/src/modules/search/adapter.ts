import type { SearchProvider } from "../providers/contracts";
import { filtersFrom } from "../catalog/search";
import {
  catalogRepository,
  type CatalogRepository,
} from "../catalog/repository";
export class CanonicalSearchProvider implements SearchProvider {
  constructor(
    private readonly repository: CatalogRepository = catalogRepository(),
  ) {}
  async search(input: Parameters<SearchProvider["search"]>[0]) {
    const params = new URLSearchParams({
      q: input.query,
      limit: String(input.limit),
      cursor: input.cursor || "",
    });
    for (const [key, values] of Object.entries(input.filters)) {
      if (values.length > 1)
        throw new Error("Only one value per filter is supported");
      if (values[0]) params.set(key, values[0]);
    }
    const result = await this.repository.search(filtersFrom(params));
    return {
      items: result.items.map((r) => ({
        productId: r.product.id,
        variantIds: r.product.variants.map((v) => v.id),
      })),
      nextCursor: result.nextCursor ?? undefined,
    };
  }
}
