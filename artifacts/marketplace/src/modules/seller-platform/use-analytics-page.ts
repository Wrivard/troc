import { useEffect, useState } from "react";
import { api } from "../../api";
export type AnalyticsSummary = {
  orderCount: number;
  totalCents: number;
  previousTotalCents: number;
  refundCents: number;
  refundOrderCount: number;
  units: number;
  series: {
    day: string;
    totalCents: number;
    orders: number;
    previousTotalCents: number;
    previousOrders: number;
  }[];
};
export type AnalyticsBreakdown = {
  provinces: { province: string; count: number }[];
  provincesTruncated: boolean;
  datasets: { live: boolean; sample: boolean };
};
export type AnalyticsProducts = {
  products: {
    variantId: string;
    name: { en: string; fr: string };
    quantity: number;
    cents: number;
    imageUrl: string | null;
  }[];
  nextCursor: string | null;
};
// A response is visible only for its exact scope, even before effect cleanup runs.
export function useAnalyticsRead<T>(path: string | null) {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([path, revision]);
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    if (!path) return;
    let active = true;
    api<T>(path)
      .then((data) => {
        if (active) setResult({ key, data });
      })
      .catch((error) => {
        if (active)
          setResult({
            key,
            error:
              error instanceof Error ? error.message : "service_unavailable",
          });
      });
    return () => {
      active = false;
    };
  }, [path, key]);
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    retry: () => setRevision((value) => value + 1),
  };
}
export function useAnalyticsPage(
  seller: string,
  period: string,
  selection: string | null,
) {
  const [asOf] = useState(() => new Date().toISOString());
  const base = "/seller/platform/" + seller;
  const initial = useAnalyticsRead<AnalyticsBreakdown>(
    base +
      "/analytics-breakdown?" +
      new URLSearchParams({ period: "30", dataset: "live", asOf }),
  );
  const dataset =
    selection ?? (initial.data?.datasets.sample ? "sample" : "live");
  const scope = new URLSearchParams({ period, dataset, asOf }).toString();
  const enabled = !!initial.data;
  const summary = useAnalyticsRead<AnalyticsSummary>(
    enabled ? base + "/analytics-summary?" + scope : null,
  );
  const breakdown = useAnalyticsRead<AnalyticsBreakdown>(
    enabled ? base + "/analytics-breakdown?" + scope : null,
  );
  const [navigation, setNavigation] = useState({
    scope,
    page: 0,
    cursors: [""],
  });
  useEffect(() => {
    setNavigation({ scope, page: 0, cursors: [""] });
  }, [scope]);
  const nav =
    navigation.scope === scope ? navigation : { scope, page: 0, cursors: [""] };
  const products = useAnalyticsRead<AnalyticsProducts>(
    enabled
      ? base +
          "/analytics-products?" +
          scope +
          "&limit=25" +
          (nav.cursors[nav.page]
            ? "&cursor=" + encodeURIComponent(nav.cursors[nav.page])
            : "")
      : null,
  );
  return {
    asOf,
    initial,
    summary,
    breakdown,
    products,
    dataset,
    page: nav.page,
    navigate: (page: number) => {
      if (!products.data || page < 0) return;
      const cursors = [...nav.cursors];
      if (page === nav.page + 1 && products.data.nextCursor)
        cursors[page] = products.data.nextCursor;
      if (page > 0 && !cursors[page]) return;
      setNavigation({ scope, page, cursors });
    },
  };
}
export function dailyAnalyticsCsv(summary: AnalyticsSummary) {
  return [
    "date_utc,order_value_cad,orders,previous_order_value_cad,previous_orders",
    ...summary.series.map((row) =>
      [
        row.day,
        (row.totalCents / 100).toFixed(2),
        row.orders,
        (row.previousTotalCents / 100).toFixed(2),
        row.previousOrders,
      ].join(","),
    ),
  ].join("\r\n");
}
