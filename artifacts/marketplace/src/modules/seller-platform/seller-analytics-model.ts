import type { SellerOrder } from "./operations-ui";
export function analytics(
  source: SellerOrder[],
  days: number,
  now = Date.now(),
) {
  const end = Math.floor(now / 86400000) * 86400000 + 86400000,
    start = end - days * 86400000,
    previousStart = start - days * 86400000;
  const available = source.filter(
    (o) => o.status !== "cancelled" && Date.parse(o.createdAt) < end,
  );
  const orders = available.filter((o) => Date.parse(o.createdAt) >= start);
  const previous = available.filter(
    (o) =>
      Date.parse(o.createdAt) >= previousStart &&
      Date.parse(o.createdAt) < start,
  );
  const productMap = new Map<
    string,
    {
      variantId: string;
      name: { en: string; fr: string };
      imageUrl: string | null;
      quantity: number;
      cents: number;
    }
  >();
  const provinces = new Map<string, number>();
  for (const o of orders) {
    provinces.set(
      o.province || "—",
      (provinces.get(o.province || "—") || 0) + 1,
    );
    for (const l of o.lines) {
      const p = productMap.get(l.variantId) || {
        variantId: l.variantId,
        name: l.name,
        imageUrl: l.imageUrl,
        quantity: 0,
        cents: 0,
      };
      p.quantity += l.quantity;
      p.cents += l.totalCents;
      productMap.set(l.variantId, p);
    }
  }
  const series = Array.from({ length: days }, (_, i) => {
    const begin = start + i * 86400000,
      prior = previousStart + i * 86400000,
      c = orders.filter(
        (o) =>
          Date.parse(o.createdAt) >= begin &&
          Date.parse(o.createdAt) < begin + 86400000,
      ),
      p = previous.filter(
        (o) =>
          Date.parse(o.createdAt) >= prior &&
          Date.parse(o.createdAt) < prior + 86400000,
      );
    return {
      day: new Date(begin).toISOString().slice(0, 10),
      value: c.reduce((n, o) => n + o.totalCents, 0) / 100,
      orders: c.length,
      previous: p.reduce((n, o) => n + o.totalCents, 0) / 100,
      previousOrders: p.length,
    };
  });
  return {
    orders,
    series,
    total: orders.reduce((n, o) => n + o.totalCents, 0),
    previousTotal: previous.reduce((n, o) => n + o.totalCents, 0),
    refunds: orders.reduce((n, o) => n + o.refundedCents, 0),
    units: orders.reduce(
      (n, o) => n + o.lines.reduce((a, l) => a + l.quantity, 0),
      0,
    ),
    products: [...productMap.values()].sort((a, b) => b.cents - a.cents),
    provinces: [...provinces.entries()].sort((a, b) => b[1] - a[1]),
  };
}
