import type {
  CartLine,
  CartQuote,
  CommerceListing,
  CommerceSeller,
  SmartResult,
} from "@workspace/commerce";
import { DomainError } from "../shared/domain";
import { quoteCart } from "./calculations";
import { commerceConfig } from "./config";

const conditions = ["NM", "LP", "MP", "HP", "DMG"];
const price = (l: CommerceListing) => l.saleCents ?? l.cents;
const key = (lines: CartLine[]) =>
  [...lines]
    .sort((a, b) => a.listingId.localeCompare(b.listingId))
    .map((l) => `${l.listingId}:${l.quantity}`)
    .join("|");
function merge(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const l of lines) {
    const old = map.get(l.listingId);
    map.set(l.listingId, {
      ...l,
      quantity: l.quantity + (old?.quantity ?? 0),
      lockListing: l.lockListing || old?.lockListing,
      lockSeller: l.lockSeller || old?.lockSeller,
    });
  }
  return [...map.values()];
}
function compare(a: CartQuote, b: CartQuote): number {
  return (
    Number(b.eligible) - Number(a.eligible) ||
    a.totalCents - b.totalCents ||
    a.groups.length - b.groups.length ||
    b.groups.reduce((n, g) => n + g.seller.reputation, 0) -
      a.groups.reduce((n, g) => n + g.seller.reputation, 0) ||
    a.groups.reduce((n, g) => n + g.seller.handlingDays, 0) -
      b.groups.reduce((n, g) => n + g.seller.handlingDays, 0)
  );
}
/** Bounded beam + whole-seller consolidation; always reports actual landed-cost quotes. */
export function optimizeCart(
  originalLines: CartLine[],
  listings: CommerceListing[],
  sellers: CommerceSeller[],
  coupon?: string,
): SmartResult {
  const original = quoteCart(originalLines, listings, sellers, { coupon });
  if (!originalLines.length) throw new DomainError("empty_cart");
  const byId = new Map(listings.map((l) => [l.id, l]));
  const eligibleSellers = new Set(
    sellers.filter((s) => s.active && s.country === "CA").map((s) => s.id),
  );
  const candidates = originalLines.map((line) => {
    const requested = byId.get(line.listingId)!;
    return listings
      .filter(
        (l) =>
          l.active &&
          (!l.special || l.id === line.listingId) &&
          l.quantity > 0 &&
          eligibleSellers.has(l.sellerId) &&
          l.productId === requested.productId &&
          l.printingId === requested.printingId &&
          l.variantId === requested.variantId &&
          l.language === requested.language &&
          l.productType === requested.productType &&
          (requested.condition === null
            ? l.condition === null
            : l.condition !== null &&
              conditions.indexOf(l.condition) <=
                conditions.indexOf(requested.condition)) &&
          (!(
            line.lockListing ||
            requested.special ||
            requested.productType !== "raw_single"
          ) ||
            l.id === line.listingId) &&
          (!line.lockSeller || l.sellerId === requested.sellerId),
      )
      .sort((a, b) => price(a) - price(b) || a.id.localeCompare(b.id))
      .slice(0, commerceConfig.candidateLimit);
  });
  const overlaps = new Map<string, number>();
  for (const list of candidates)
    for (const id of new Set(list.map((l) => l.sellerId)))
      overlaps.set(id, (overlaps.get(id) ?? 0) + 1);
  const dominant = [...overlaps]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, commerceConfig.beamWidth)
    .map(([id]) => id);
  let evaluated = 0;
  const evaluate = (lines: CartLine[]) => {
    if (evaluated >= commerceConfig.maxEvaluations) return null;
    evaluated++;
    try {
      return {
        lines: merge(lines),
        quote: quoteCart(merge(lines), listings, sellers, { coupon }),
      };
    } catch (error) {
      if (error instanceof DomainError) return null;
      throw error;
    }
  };
  // Allocate a requested quantity over bounded candidates; existing allocations consume availability.
  const fill = (
    index: number,
    prior: CartLine[],
    preferred?: string,
  ): CartLine[] | null => {
    let remaining = originalLines[index].quantity;
    const added: CartLine[] = [];
    const used = new Map(prior.map((l) => [l.listingId, l.quantity]));
    const options = [...candidates[index]].sort(
      (a, b) =>
        Number(b.sellerId === preferred) - Number(a.sellerId === preferred) ||
        price(a) - price(b) ||
        a.id.localeCompare(b.id),
    );
    for (const l of options) {
      const quantity = Math.min(
        remaining,
        l.quantity - (used.get(l.id) ?? 0),
        commerceConfig.maxQuantity - (used.get(l.id) ?? 0),
      );
      if (quantity > 0) {
        added.push({ ...originalLines[index], listingId: l.id, quantity });
        remaining -= quantity;
      }
      if (!remaining) break;
    }
    return remaining ? null : merge([...prior, ...added]);
  };
  const construct = (preferred?: string) => {
    let lines: CartLine[] = [];
    for (let i = 0; i < originalLines.length; i++) {
      const next = fill(i, lines, preferred);
      if (!next) return null;
      lines = next;
    }
    return evaluate(lines);
  };
  const naive = construct();
  let best = { lines: originalLines, quote: original };
  const consider = (value: ReturnType<typeof evaluate>) => {
    if (value && compare(value.quote, best.quote) < 0) best = value;
  };
  consider(naive);
  for (const id of dominant) consider(construct(id));
  let beam: { lines: CartLine[]; quote: CartQuote }[] = [
    { lines: [], quote: quoteCart([], listings, sellers, { coupon }) },
  ];
  for (
    let i = 0;
    i < originalLines.length && evaluated < commerceConfig.maxEvaluations;
    i++
  ) {
    const next = new Map<string, { lines: CartLine[]; quote: CartQuote }>();
    for (const state of beam)
      for (const id of [
        undefined,
        ...new Set(candidates[i].map((l) => l.sellerId)),
      ]) {
        const lines = fill(i, state.lines, id);
        const value = lines ? evaluate(lines) : null;
        if (value) next.set(key(value.lines), value);
      }
    // Keep partially assembled carts even below minimum; full-cart constraints are evaluated at completion.
    beam = [...next.values()]
      .sort(
        (a, b) =>
          a.quote.totalCents +
            a.quote.groups.reduce((n, g) => n + g.minimumRemainingCents, 0) -
            (b.quote.totalCents +
              b.quote.groups.reduce(
                (n, g) => n + g.minimumRemainingCents,
                0,
              )) ||
          compare(a.quote, b.quote) ||
          key(a.lines).localeCompare(key(b.lines)),
      )
      .slice(0, commerceConfig.beamWidth);
    if (i === originalLines.length - 1)
      for (const value of beam) consider(value);
  }
  if (!best.quote.eligible) throw new DomainError("no_valid_smart_cart", 409);
  const remaining = new Map(best.lines.map((l) => [l.listingId, l.quantity]));
  for (const line of originalLines) {
    const same = Math.min(line.quantity, remaining.get(line.listingId) ?? 0);
    remaining.set(line.listingId, (remaining.get(line.listingId) ?? 0) - same);
  }
  const substitutions: SmartResult["substitutions"] = [];
  for (const old of originalLines) {
    let missing =
      old.quantity -
      Math.min(
        old.quantity,
        best.lines.find((l) => l.listingId === old.listingId)?.quantity ?? 0,
      );
    const source = byId.get(old.listingId)!;
    for (const [id, quantity] of remaining) {
      const target = byId.get(id)!;
      if (!missing) break;
      if (quantity && target.variantId === source.variantId) {
        const moved = Math.min(missing, quantity);
        substitutions.push({
          fromListingId: old.listingId,
          toListingId: id,
          quantity: moved,
          merchandiseDifferenceCents: (price(target) - price(source)) * moved,
        });
        remaining.set(id, quantity - moved);
        missing -= moved;
      }
    }
  }
  return {
    original,
    optimized: best.quote,
    naive: naive?.quote ?? original,
    lines: best.lines,
    savingsCents: original.totalCents - best.quote.totalCents,
    shippingSavingsCents: original.shippingCents - best.quote.shippingCents,
    evaluated,
    substitutions,
  };
}
