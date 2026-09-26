import { promotionActiveAt } from "./promotion-time";
import type {
  CartLine,
  CartQuote,
  CommerceListing,
  CommerceSeller,
  FeeAllocation,
  OrderStatus,
  QuotedLine,
  SellerQuote,
  ShippingQuote,
} from "@workspace/commerce";
import { DomainError } from "../shared/domain";
import { commerceConfig, type CommerceConfig } from "./config";

export function integer(value: number, min = 0, max = 100_000_000): number {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new DomainError("invalid_amount");
  return value;
}
export function percentage(cents: number, bps: number): number {
  integer(cents);
  integer(bps, 0, 10000);
  return Number((BigInt(cents) * BigInt(bps) + 5000n) / 10000n);
}
/** Largest-remainder allocation. Stable input order breaks exact remainder ties. */
export function allocate(cents: number, weights: number[]): number[] {
  integer(cents);
  weights.forEach((w) => integer(w));
  const total = weights.reduce((a, b) => a + b, 0);
  if (!total) {
    if (cents) throw new DomainError("invalid_allocation");
    return weights.map(() => 0);
  }
  const denominator = BigInt(total);
  const fractions = weights.map((w, i) => ({
    i,
    amount: Number((BigInt(cents) * BigInt(w)) / denominator),
    remainder: (BigInt(cents) * BigInt(w)) % denominator,
  }));
  let remaining = cents - fractions.reduce((sum, f) => sum + f.amount, 0);
  for (const f of [...fractions].sort((a, b) =>
    a.remainder === b.remainder
      ? a.i - b.i
      : a.remainder > b.remainder
        ? -1
        : 1,
  )) {
    if (remaining-- > 0) f.amount++;
  }
  return fractions.map((f) => f.amount);
}
export function shipping(
  lines: QuotedLine[],
  seller: CommerceSeller,
  netCents: number,
  config = commerceConfig,
): ShippingQuote {
  const cards = lines.reduce((n, l) => n + l.quantity, 0);
  const grams =
    15 + lines.reduce((n, l) => n + l.quantity * l.listing.grams, 0);
  const thicknessMm =
    2 + lines.reduce((n, l) => n + l.quantity * l.listing.thicknessMm, 0);
  const tracked =
    netCents >= config.trackingThresholdCents ||
    lines.some((l) => l.listing.productType !== "raw_single");
  const service = config.shipping
    .filter(
      (s) =>
        s.maxCards >= cards &&
        s.maxGrams >= grams &&
        s.maxThicknessMm >= thicknessMm &&
        (!tracked || s.tracked),
    )
    .sort((a, b) => a.cents - b.cents || a.id.localeCompare(b.id))[0];
  if (!service) throw new DomainError("shipping_unavailable");
  const free =
    config.freeShippingLevels.includes(seller.level) &&
    seller.freeShippingCents !== null &&
    netCents >= seller.freeShippingCents;
  return {
    serviceId: service.id,
    cents: free ? 0 : service.cents,
    beforeFreeCents: service.cents,
    tracked: service.tracked,
    cards,
    grams,
    thicknessMm,
  };
}
export function quoteCart(
  lines: CartLine[],
  listings: CommerceListing[],
  sellers: CommerceSeller[],
  options: {
    coupon?: string;
    now?: number;
    province?: string;
    creditCents?: number;
    config?: CommerceConfig;
  } = {},
): CartQuote {
  const config = options.config ?? commerceConfig;
  const now = options.now ?? Date.now();
  if (lines.length > config.maxLines) throw new DomainError("cart_too_large");
  const listingMap = new Map(listings.map((l) => [l.id, l]));
  const sellerMap = new Map(sellers.map((s) => [s.id, s]));
  const grouped = new Map<string, QuotedLine[]>();
  const seen = new Set<string>();
  for (const line of lines) {
    integer(line.quantity, 1, config.maxQuantity);
    if (seen.has(line.listingId)) throw new DomainError("duplicate_listing");
    seen.add(line.listingId);
    const listing = listingMap.get(line.listingId);
    if (!listing || !listing.active || listing.quantity < line.quantity)
      throw new DomainError("inventory_unavailable", 409);
    const seller = sellerMap.get(listing.sellerId);
    if (!seller?.active || seller.country !== "CA")
      throw new DomainError("seller_unavailable", 409);
    integer(listing.cents, 1);
    integer(listing.grams, 0, 30000);
    if (!Number.isFinite(listing.thicknessMm) || listing.thicknessMm < 0)
      throw new DomainError("invalid_shipping_dimensions");
    const unitCents =
      listing.saleCents === null
        ? listing.cents
        : integer(listing.saleCents, 1, listing.cents);
    const group = grouped.get(seller.id) ?? [];
    group.push({
      ...line,
      listing,
      unitCents,
      totalCents: integer(unitCents * line.quantity),
    });
    grouped.set(seller.id, group);
  }
  const groups: SellerQuote[] = [...grouped]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, items]) => {
      const seller = sellerMap.get(id)!;
      if (![0, 200, 500, 1000].includes(seller.minimumCents))
        throw new DomainError("invalid_seller_minimum");
      const cards = items.reduce((n, l) => n + l.quantity, 0);
      const merchandiseCents = integer(
        items.reduce((n, l) => n + l.totalCents, 0),
      );
      // Sale-priced lines are excluded from all basket discounts. Exactly one best eligible rule wins.
      const discountable = items
        .filter((l) => l.listing.saleCents === null)
        .reduce((n, l) => n + l.totalCents, 0);
      const rules = seller.promotions.filter(
        (p) => promotionActiveAt(p, now) && (!p.coupon || p.coupon === options.coupon),
      );
      const eligible = rules
        .filter(
          (p) =>
            cards >= (p.minimumCards ?? 0) &&
            merchandiseCents >= (p.minimumCents ?? 0),
        )
        .map((p) => ({ p, discount: percentage(discountable, p.basisPoints) }))
        .sort(
          (a, b) => b.discount - a.discount || a.p.id.localeCompare(b.p.id),
        );
      const discountCents = eligible[0]?.discount ?? 0;
      const net = merchandiseCents - discountCents;
      const delivery = shipping(items, seller, net, config);
      return {
        seller,
        lines: items,
        cards,
        merchandiseCents,
        discountCents,
        promotionId: eligible[0]?.p.id ?? null,
        nextPromotion:
          rules
            .filter(
              (p) =>
                cards < (p.minimumCards ?? 0) ||
                merchandiseCents < (p.minimumCents ?? 0),
            )
            .sort(
              (a, b) =>
                (a.minimumCards ?? 0) - (b.minimumCards ?? 0) ||
                (a.minimumCents ?? 0) - (b.minimumCents ?? 0),
            )[0] ?? null,
        // Seller minimum is pre-promotion merchandise, so earning a discount cannot invalidate an order.
        minimumRemainingCents: Math.max(
          0,
          seller.minimumCents - merchandiseCents,
        ),
        freeShippingRemainingCents:
          config.freeShippingLevels.includes(seller.level) &&
          seller.freeShippingCents !== null
            ? Math.max(0, seller.freeShippingCents - net)
            : null,
        shipping: delivery,
        totalCents: net + delivery.cents,
      };
    });
  const sum = (f: (g: SellerQuote) => number) =>
    integer(groups.reduce((n, g) => n + f(g), 0));
  const merchandiseCents = sum((g) => g.merchandiseCents),
    discountCents = sum((g) => g.discountCents),
    shippingCents = sum((g) => g.shipping.cents);
  const landed = merchandiseCents - discountCents + shippingCents;
  if (options.province && !(options.province in config.taxBps))
    throw new DomainError("invalid_address");
  const taxCents = options.province
    ? percentage(landed, config.taxBps[options.province])
    : 0;
  const creditCents = Math.min(
    integer(options.creditCents ?? 0),
    landed + taxCents,
  );
  return {
    groups,
    cards: sum((g) => g.cards),
    merchandiseCents,
    discountCents,
    shippingCents,
    taxCents,
    creditCents,
    totalCents: integer(landed + taxCents - creditCents),
    eligible:
      groups.length > 0 && groups.every((g) => g.minimumRemainingCents === 0),
    demo: listings.some((l) => seen.has(l.id) && l.demo),
    currency: "CAD",
  };
}
export function fees(
  quote: CartQuote,
  config = commerceConfig,
): { processingCents: number; allocations: FeeAllocation[] } {
  const processingCents = quote.totalCents
    ? percentage(quote.totalCents, config.processingBps) +
      config.processingFixedCents
    : 0;
  const processing = allocate(
    processingCents,
    quote.groups.map((g) => g.totalCents),
  );
  return {
    processingCents,
    allocations: quote.groups.map((g, i) => {
      const net = g.merchandiseCents - g.discountCents;
      const commissionCents = percentage(net, config.commissionBps);
      const shippingCommissionCents = percentage(
        g.shipping.cents,
        config.shippingCommissionBps,
      );
      const discounted = allocate(
        g.discountCents,
        g.lines.map((l) => (l.listing.saleCents === null ? l.totalCents : 0)),
      );
      const promotedCents = percentage(
        g.lines.reduce(
          (n, l, j) =>
            n + (l.listing.promoted ? l.totalCents - discounted[j] : 0),
          0,
        ),
        config.promotedBps,
      );
      return {
        sellerId: g.seller.id,
        commissionCents,
        shippingCommissionCents,
        promotedCents,
        processingCents: processing[i],
        netCents:
          net +
          g.shipping.cents -
          commissionCents -
          shippingCommissionCents -
          promotedCents -
          processing[i],
      };
    }),
  };
}
export function reward(
  quote: CartQuote,
  smart: boolean,
  priorOrders: number,
  config = commerceConfig,
): number {
  // Highest applicable reward wins; no accidental stacking across campaigns.
  return Math.max(
    0,
    ...config.rewards
      .filter(
        (r) =>
          quote.cards >= r.minimumCards &&
          quote.groups.length <= r.maximumSellers &&
          (!r.smartOnly || smart) &&
          priorOrders >= r.minimumPriorOrders,
      )
      .map((r) => r.cents),
  );
}
const transitions: Record<OrderStatus, OrderStatus[]> = {
  simulated_paid: ["awaiting_shipment", "cancelled"],
  awaiting_shipment: [
    "shipped",
    "cancelled",
    "issue",
    "partially_refunded",
    "refunded",
  ],
  shipped: ["delivered", "issue", "partially_refunded", "refunded"],
  delivered: ["completed", "issue", "partially_refunded", "refunded"],
  completed: ["issue", "partially_refunded", "refunded"],
  issue: [
    "awaiting_shipment",
    "shipped",
    "delivered",
    "partially_refunded",
    "refunded",
  ],
  partially_refunded: [
    "shipped",
    "delivered",
    "completed",
    "issue",
    "partially_refunded",
    "refunded",
  ],
  cancelled: [],
  refunded: [],
};
export function transition(from: OrderStatus, to: OrderStatus): void {
  if (!transitions[from]?.includes(to))
    throw new DomainError("invalid_order_transition", 409);
}
