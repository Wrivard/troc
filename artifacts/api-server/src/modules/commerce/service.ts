import type { CartLine, CartQuote, SmartResult } from "@workspace/commerce";
import type { Principal } from "../auth/permissions";
import { DomainError } from "../shared/domain";
import { quoteCart, integer } from "./calculations";
import {
  balance,
  event,
  expireCheckouts,
  lockBuyer,
  type TransactionStore,
} from "./checkout";
import { demoCommerce, loadCommerce, type Sql } from "./data";
import { optimizeCart } from "./smart-cart";
export function cartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value) || value.length > 100)
    throw new DomainError("invalid_cart");
  return value.map((v: unknown) => {
    if (!v || typeof v !== "object") throw new DomainError("invalid_cart");
    const l = v as Record<string, unknown>;
    if (
      typeof l.listingId !== "string" ||
      !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
        l.listingId,
      )
    )
      throw new DomainError("invalid_cart");
    return {
      listingId: l.listingId,
      quantity: integer(Number(l.quantity), 1, 100),
      lockListing: l.lockListing === true,
      lockSeller: l.lockSeller === true,
    };
  });
}
export class CartService {
  constructor(
    private readonly store: TransactionStore,
    private readonly db: Sql,
    private readonly demo = false,
  ) {}
  async quote(
    lines: CartLine[],
    coupon = "",
    province?: string,
  ): Promise<CartQuote> {
    if (coupon.length > 40) throw new DomainError("invalid_coupon");
    const data = this.demo
      ? demoCommerce()
      : await loadCommerce(
          this.db,
          lines.map((l) => l.listingId),
        );
    return quoteCart(lines, data.listings, data.sellers, { coupon, province });
  }
  async repair(lines: CartLine[]): Promise<CartLine[]> {
    const data = this.demo
      ? demoCommerce()
      : await loadCommerce(
          this.db,
          lines.map((l) => l.listingId),
        );
    const sellers = new Set(
      data.sellers
        .filter((s) => s.active && s.country === "CA")
        .map((s) => s.id),
    );
    const available = new Map(
      data.listings
        .filter((l) => l.active && l.quantity > 0 && sellers.has(l.sellerId))
        .map((l) => [l.id, l.quantity]),
    );
    return lines.flatMap((l) =>
      available.has(l.listingId)
        ? [
            {
              ...l,
              quantity: Math.min(l.quantity, available.get(l.listingId)!),
            },
          ]
        : [],
    );
  }
  async optimize(lines: CartLine[], coupon = ""): Promise<SmartResult> {
    const data = this.demo
      ? demoCommerce()
      : await loadCommerce(
          this.db,
          lines.map((l) => l.listingId),
          true,
        );
    return optimizeCart(lines, data.listings, data.sellers, coupon);
  }
  async read(p: Principal) {
    await this.store.transaction(async (db) => {
      await lockBuyer(db, p.userId);
      await expireCheckouts(db, p.userId);
    });
    const cart = (
      await this.db.query<{ lines: CartLine[]; coupon: string }>(
        "SELECT lines,coupon FROM troc.carts WHERE buyer_id=$1",
        [p.userId],
      )
    ).rows[0] ?? { lines: [], coupon: "" };
    return { ...cart, creditCents: await balance(this.db, p.userId) };
  }
  async save(p: Principal, lines: CartLine[], coupon = "", smart = false) {
    const quote = await this.quote(lines, coupon);
    await this.store.transaction(async (db) => {
      await lockBuyer(db, p.userId);
      const old =
        (
          await db.query<{ lines: CartLine[] }>(
            "SELECT lines FROM troc.carts WHERE buyer_id=$1 FOR UPDATE",
            [p.userId],
          )
        ).rows[0]?.lines ?? [];
      await db.query(
        "INSERT INTO troc.carts(buyer_id,lines,coupon,smart) VALUES($1,$2,$3,$4) ON CONFLICT(buyer_id) DO UPDATE SET smart=CASE WHEN carts.lines=excluded.lines AND carts.coupon=excluded.coupon THEN carts.smart OR excluded.smart ELSE excluded.smart END,lines=excluded.lines,coupon=excluded.coupon,updated_at=now()",
        [p.userId, JSON.stringify(lines), coupon, smart],
      );
      const previous = new Map(old.map((l) => [l.listingId, l.quantity]));
      const next = new Map(lines.map((l) => [l.listingId, l.quantity]));
      for (const id of new Set([...previous.keys(), ...next.keys()])) {
        const delta = (next.get(id) ?? 0) - (previous.get(id) ?? 0);
        if (delta)
          await event(
            db,
            p.userId,
            delta > 0 ? "add_to_cart" : "remove_from_cart",
            { listingId: id, quantity: Math.abs(delta) },
            quote.demo,
          );
      }
      await event(
        db,
        p.userId,
        "cart_updated",
        {
          cards: quote.cards,
          groups: quote.groups.map((g) => ({
            sellerId: g.seller.id,
            minimumRemainingCents: g.minimumRemainingCents,
            promotionId: g.promotionId,
          })),
        },
        quote.demo,
      );
      for (const group of quote.groups)
        if (group.promotionId)
          await event(
            db,
            p.userId,
            "promotion_threshold_hit",
            { sellerId: group.seller.id, promotionId: group.promotionId },
            quote.demo,
          );
    });
    return quote;
  }
  async applySmart(p: Principal, lines: CartLine[], coupon = "") {
    const result = await this.optimize(lines, coupon);
    await this.save(p, result.lines, coupon, true);
    await event(
      this.db,
      p.userId,
      "smart_cart_completed",
      {
        savingsCents: result.savingsCents,
        sellersBefore: result.original.groups.length,
        sellersAfter: result.optimized.groups.length,
      },
      result.optimized.demo,
    );
    return result;
  }
}
