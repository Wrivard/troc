import { catalogBrowseHref } from "@workspace/catalog";
import type {
  CatalogSuggestions,
  Locale,
  SuggestionKind,
} from "@workspace/catalog";
import type { SearchPresentationGroup } from "./GlobalSearchPresentation";
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const uuid = (value: unknown) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const text = (value: unknown) =>
  typeof value === "string" && value.length > 0 && value.length <= 500;
const translated = (value: unknown) =>
  record(value) && text(value.en) && text(value.fr);
const caps: Record<SuggestionKind, number> = {
  cards: 4,
  sets: 2,
  products: 2,
  sellers: 2,
  games: 2,
};
export function validateSuggestions(
  value: unknown,
  query: string,
  locale: Locale,
): asserts value is CatalogSuggestions {
  if (
    !record(value) ||
    value.query !== query.trim() ||
    value.locale !== locale ||
    !Array.isArray(value.groups) ||
    value.groups.length > 5
  )
    throw new Error("invalid_suggestions");
  const kinds = new Set<string>();
  for (const group of value.groups) {
    if (
      !record(group) ||
      typeof group.kind !== "string" ||
      !Object.hasOwn(caps, group.kind) ||
      kinds.has(group.kind) ||
      !Array.isArray(group.results) ||
      group.results.length > caps[group.kind as SuggestionKind]
    )
      throw new Error("invalid_suggestions");
    kinds.add(group.kind);
    const ids = new Set<string>();
    for (const row of group.results) {
      if (
        !record(row) ||
        !uuid(row.id) ||
        ids.has(String(row.id)) ||
        typeof row.slug !== "string" ||
        !/^[a-z0-9-]{1,200}$/.test(row.slug) ||
        !translated(row.name) ||
        typeof row.demo !== "boolean" ||
        ((group.kind === "cards" || group.kind === "products") &&
          !uuid(row.variantId)) ||
        (row.collectorNumber !== undefined &&
          (typeof row.collectorNumber !== "string" ||
            row.collectorNumber.length > 100)) ||
        (row.subtitle !== undefined && !translated(row.subtitle)) ||
        (row.lowestCents !== undefined &&
          row.lowestCents !== null &&
          (!Number.isSafeInteger(row.lowestCents) ||
            Number(row.lowestCents) < 0)) ||
        (row.sellerCount !== undefined &&
          (!Number.isSafeInteger(row.sellerCount) ||
            Number(row.sellerCount) < 0))
      )
        throw new Error("invalid_suggestions");
      if (row.imageUrl !== null && row.imageUrl !== undefined) {
        if (typeof row.imageUrl !== "string" || row.imageUrl.length > 2000)
          throw new Error("invalid_suggestions");
        const image = new URL(row.imageUrl, "https://local.invalid");
        if (
          image.protocol !== "https:" ||
          image.username ||
          image.password ||
          row.imageUrl.startsWith("//")
        )
          throw new Error("invalid_suggestions");
      }
      ids.add(String(row.id));
    }
  }
}
export function searchHref(base: string, locale: Locale, query: string) {
  return base + "/search?" + new URLSearchParams({ q: query, lang: locale });
}
export function presentationGroups(
  result: CatalogSuggestions,
  base: string,
): SearchPresentationGroup[] {
  return result.groups.map((group) => ({
    kind: group.kind,
    results: group.results.map((row) => {
      const product = group.kind === "cards" || group.kind === "products";
      const path = product
        ? "/product/"
        : group.kind === "sets"
          ? "/sets/"
          : group.kind === "games"
            ? "/games/"
            : "/store/";
      const params = new URLSearchParams({ lang: result.locale });
      if (product && row.variantId) params.set("variantId", row.variantId);
      return {
        id: row.id,
        href: base + catalogBrowseHref(path + row.slug, params),
        title: row.name[result.locale],
        subtitle: row.subtitle?.[result.locale],
        detail: [
          row.collectorNumber ? "#" + row.collectorNumber : "",
          row.demo ? (result.locale === "fr" ? "Démonstration" : "Demo") : "",
        ]
          .filter(Boolean)
          .join(" · "),
        imageUrl: row.imageUrl,
        lowestCents: row.lowestCents,
        sellerCount: row.sellerCount,
      };
    }),
  }));
}
/** One transport at a time; queued intermediate queries never reach the server. */
export function suggestionRequests(fetcher: typeof fetch = fetch, apiBase = "/api") {
  let sequence = 0;
  let inFlight: Promise<CatalogSuggestions> | undefined;
  const cancel = () => { sequence++; };
  return {
    cancel,
    async load(query: string, locale: Locale): Promise<{data: CatalogSuggestions; error:false} | {error:true} | null> {
      cancel();
      const current = sequence;
      // Aborting fetch does not reliably cancel a database query. Finish the bounded
      // current request, suppress its result, then send only the latest query.
      if (inFlight) { try { await inFlight; } catch { /* The next query can retry. */ } }
      if (current !== sequence) return null;
      const task = (async () => {
        const response = await fetcher(apiBase + "/catalog/suggest?" + new URLSearchParams({q:query,lang:locale}), {signal:AbortSignal.timeout(5000)});
        if (!response.ok) throw new Error("unavailable");
        const value: unknown = await response.json();
        validateSuggestions(value,query,locale);
        return value;
      })();
      inFlight = task;
      try { const data=await task; return current === sequence ? {data,error:false} : null; }
      catch { return current === sequence ? {error:true} : null; }
      finally { if (inFlight === task) inFlight=undefined; }
    },
  };
}
