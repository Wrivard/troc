import { AnalyticsExport } from "./AnalyticsExport";
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import {
  useSellerCopy,
  OperationsPage,
  OperationsState,
  Choice,
} from "./operations-ui";
import { useSellerWorkspace } from "./SellerShell";
import { SellerLoading } from "./SellerLoading";
import { useAnalyticsPage, dailyAnalyticsCsv } from "./use-analytics-page";
export function SellerAnalytics() {
  const { seller, directoryState, reloadDirectory } = useSellerWorkspace(),
    { t } = useSellerCopy();
  return (
    <OperationsPage
      title={t("Analytics", "Statistiques")}
      description={t(
        "Understand your orders, products and buyer activity.",
        "Comprenez vos commandes, vos produits et l’activité de vos acheteurs.",
      )}
    >
      {seller && directoryState === "ready" ? (
        <Analytics key={seller} seller={seller} />
      ) : (
        <OperationsState
          error={directoryState === "error"}
          reload={reloadDirectory}
        />
      )}
    </OperationsPage>
  );
}
function ReadState({ error, retry }: { error?: string; retry: () => void }) {
  const { t, locale } = useSellerCopy();
  if (!error)
    return <SellerLoading view="analytics" locale={locale} rowsOnly />;
  return (
    <div className="ops-empty" role="alert">
      <p>
        {error === "forbidden"
          ? t("Store management access required", "Accès de gestion requis")
          : t(
              "Unable to load these statistics.",
              "Impossible de charger ces statistiques.",
            )}
      </p>
      {error !== "forbidden" && (
        <Button variant="secondary" onClick={retry}>
          {t("Retry", "Réessayer")}
        </Button>
      )}
    </div>
  );
}
function Analytics({ seller }: { seller: string }) {
  const { t, money, locale, date } = useSellerCopy(),
    [period, setPeriod] = useState("30"),
    [selection, setDataset] = useState<string | null>(null);
  const state = useAnalyticsPage(seller, period, selection);
  const { summary, breakdown, products, dataset } = state;
  if (!state.initial.data)
    return (
      <ReadState error={state.initial.error} retry={state.initial.retry} />
    );
  const report = {
    total: summary.data?.totalCents ?? 0,
    previousTotal: summary.data?.previousTotalCents ?? 0,
    orderCount: summary.data?.orderCount ?? 0,
    refunds: summary.data?.refundCents ?? 0,
    refundOrderCount: summary.data?.refundOrderCount ?? 0,
    units: summary.data?.units ?? 0,
    series:
      summary.data?.series.map((row) => ({
        ...row,
        value: row.totalCents / 100,
        previous: row.previousTotalCents / 100,
      })) ?? [],
    products: products.data?.products ?? [],
    provinces: breakdown.data?.provinces ?? [],
  };
  const previous = report.previousTotal;
  const delta = previous ? ((report.total - previous) / previous) * 100 : null;
  const metrics = [
    [
      t("Order value", "Valeur des commandes"),
      money(report.total),
      t(
        "Before refunds; shipping included",
        "Avant remboursements, livraison incluse",
      ),
    ],
    [
      t("Orders", "Commandes"),
      String(report.orderCount),
      t("Excluding cancelled orders", "Hors commandes annulées"),
    ],
    [
      t("Average order", "Commande moyenne"),
      money(
        report.orderCount ? Math.round(report.total / report.orderCount) : 0,
      ),
      t("Order value ÷ orders", "Valeur ÷ commandes"),
    ],
    [
      t("Items ordered", "Articles commandés"),
      String(report.units),
      t("Quantity across order lines", "Quantités des lignes de commande"),
    ],
    [
      t("Refunds recorded", "Remboursements enregistrés"),
      money(report.refunds),
      t(
        "For orders placed in this period",
        "Commandes passées durant la période",
      ),
    ],
    [
      t("Orders with refunds", "Commandes remboursées"),
      String(report.refundOrderCount),
      t("Partial and full refunds", "Remboursements partiels et complets"),
    ],
  ];
  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    color: "var(--text-primary)",
    fontSize: 12,
  };
  return (
    <>
      <div className="ops-analytics-toolbar">
        <Choice
          label={t("Period", "Période")}
          value={period}
          onChange={setPeriod}
          items={[
            ["7", t("Last 7 days", "7 derniers jours")],
            ["30", t("Last 30 days", "30 derniers jours")],
            ["90", t("Last 90 days", "90 derniers jours")],
          ]}
        />
        <Choice
          label={t("Data", "Données")}
          value={dataset}
          onChange={setDataset}
          items={[
            ["sample", t("Sample orders", "Commandes fictives")],
            ["live", t("Real orders", "Commandes réelles")],
          ]}
        />
        <div className="ops-comparison">
          <span>{t("Compared with", "Comparaison")}</span>
          <strong>
            {t("Previous", "Les")} {period} {t("days", "jours précédents")}
          </strong>
        </div>
        <Button
          variant="secondary"
          disabled={!summary.data || !report.orderCount}
          onClick={() => {
            if (!summary.data) return;
            const url = URL.createObjectURL(
              new Blob([dailyAnalyticsCsv(summary.data)], {
                type: "text/csv;charset=utf-8",
              }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `troc-analytics-${dataset}-${period}-days.csv`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          {t("Export daily totals", "Exporter les totaux quotidiens")}
        </Button>
      </div>
      <AnalyticsExport
        key={seller + period + dataset}
        seller={seller}
        period={period}
        dataset={dataset}
        asOf={state.asOf}
      />
      {!summary.data ? (
        <ReadState error={summary.error} retry={summary.retry} />
      ) : (
        <>
          <div className="ops-metrics">
            {metrics.map(([label, value, note]) => (
              <section key={label}>
                <h2>{label}</h2>
                <strong>{value}</strong>
                <p>{note}</p>
              </section>
            ))}
          </div>
          {!report.orderCount && (
            <div className="ops-empty">
              <h2>
                {t(
                  "No orders in this period",
                  "Aucune commande dans cette période",
                )}
              </h2>
              <p>
                {t(
                  "Try a wider period or switch between sample and real orders.",
                  "Essayez une période plus longue ou changez de jeu de données.",
                )}
              </p>
            </div>
          )}
          <div className="ops-charts">
            <section className="ops-panel">
              <div className="ops-panel-head">
                <div>
                  <h2>
                    {t(
                      "Order value over time",
                      "Valeur des commandes dans le temps",
                    )}
                  </h2>
                  <strong className="ops-chart-total">
                    {money(report.total)}
                  </strong>{" "}
                  <span className="ops-scope">
                    {delta === null
                      ? t(
                          "No previous-period baseline",
                          "Aucune référence pour la période précédente",
                        )
                      : (delta >= 0 ? "+" : "") +
                        delta.toFixed(1) +
                        "% " +
                        t("vs previous period", "vs période précédente")}
                  </span>
                </div>
              </div>
              <div className="ops-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={report.series} accessibilityLayer>
                    <defs>
                      <linearGradient
                        id="seller-sales-fill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--focus)"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--focus)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border-strong)"
                    />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => date(v + "T12:00:00Z")}
                      minTickGap={45}
                      tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      width={48}
                      tickFormatter={(v) => money(v * 100)}
                      tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(v) => date(String(v) + "T12:00:00Z")}
                    />
                    <Area
                      name={t("Previous (CAD)", "Précédent (CAD)")}
                      dataKey="previous"
                      stroke="var(--text-secondary)"
                      fill="transparent"
                      strokeDasharray="4 4"
                      isAnimationActive={false}
                    />
                    <Area
                      name={t("This period (CAD)", "Période actuelle (CAD)")}
                      dataKey="value"
                      stroke="var(--focus)"
                      strokeWidth={2}
                      fill="url(#seller-sales-fill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="ops-chart-legend">
                <i />
                {t("This period", "Cette période")} <i className="previous" />
                {t("Previous period", "Période précédente")}
              </p>
            </section>
            <section className="ops-panel">
              <h2>{t("Orders over time", "Commandes dans le temps")}</h2>
              <strong className="ops-chart-total">{report.orderCount}</strong>
              <div className="ops-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.series} accessibilityLayer>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border-strong)"
                    />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => date(v + "T12:00:00Z")}
                      minTickGap={50}
                      tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      width={25}
                      allowDecimals={false}
                      tick={{ fill: "var(--text-secondary)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar
                      name={t("Previous orders", "Commandes précédentes")}
                      dataKey="previousOrders"
                      fill="var(--text-secondary)"
                      opacity={0.4}
                      isAnimationActive={false}
                    />
                    <Bar
                      name={t("Orders", "Commandes")}
                      dataKey="orders"
                      fill="var(--focus)"
                      radius={[2, 2, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </>
      )}
      <div className="ops-insights">
        <section className="ops-panel">
          <h2>{t("Orders by province", "Commandes par province")}</h2>
          <p>
            {t(
              "Based on the delivery province.",
              "Selon la province de livraison.",
            )}
          </p>
          {!breakdown.data ? (
            <ReadState error={breakdown.error} retry={breakdown.retry} />
          ) : (
            <>
              {breakdown.data.provincesTruncated && (
                <p>
                  {t(
                    "Showing the top 50 regions.",
                    "Affichage des 50 premières régions.",
                  )}
                </p>
              )}
              <div className="ops-bars">
                {report.provinces.map(({ province, count }) => (
                  <div key={province}>
                    <span>{province}</span>
                    <span className="ops-bar">
                      <i
                        style={{
                          width: summary.data
                            ? (report.orderCount
                                ? (count / report.orderCount) * 100
                                : 0) + "%"
                            : undefined,
                        }}
                      />
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
        <section className="ops-panel">
          <h2>{t("What these numbers mean", "Comprendre ces chiffres")}</h2>
          <p>
            {t(
              "Order value includes shipping and discounts, before refunds. It is not your profit or payout balance. Refunds are attributed to the original order date.",
              "La valeur inclut livraison et rabais, avant remboursements. Ce n’est ni votre bénéfice ni votre solde de versement. Les remboursements sont rattachés à la date de commande.",
            )}
          </p>
          <p className="ops-scope">
            {t(
              "Daily buckets use UTC. Traffic, conversion and marketplace price tracking will appear when their data sources are connected.",
              "Les journées utilisent UTC. Trafic, conversion et prix du marché seront ajoutés lorsque leurs sources seront connectées.",
            )}
          </p>
        </section>
      </div>
      <section
        className="ops-panel ops-top-products"
        aria-busy={!products.data && !products.error}
      >
        <h2>{t("Top products", "Produits les plus commandés")}</h2>
        <p>
          {t(
            "Ranked by merchandise value, before refunds and order-level discounts.",
            "Classés par valeur des articles, avant remboursements et rabais de commande.",
          )}
        </p>
        {!products.data ? (
          <ReadState error={products.error} retry={products.retry} />
        ) : (
          <>
            <div
              className="ops-table-wrap"
              tabIndex={0}
              role="region"
              aria-label={t("Top products", "Produits populaires")}
            >
              <table className="ops-table">
                <caption className="sr-only">
                  {t("Product performance", "Résultats par produit")}
                </caption>
                <thead>
                  <tr>
                    {[
                      "#",
                      t("Card / product", "Carte / produit"),
                      t("Units", "Quantité"),
                      t("Merchandise CAD", "Articles CAD"),
                      t("Average unit price", "Prix unitaire moyen"),
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.products.map((p, i) => (
                    <tr key={p.variantId}>
                      <td>{state.page * 25 + i + 1}</td>
                      <td>
                        <div className="ops-product">
                          {p.imageUrl && (
                            <img
                              src={p.imageUrl}
                              alt=""
                              width="34"
                              height="48"
                            />
                          )}
                          <strong>{p.name[locale]}</strong>
                        </div>
                      </td>
                      <td>{p.quantity}</td>
                      <td>{money(p.cents)}</td>
                      <td>
                        {money(
                          p.quantity ? Math.round(p.cents / p.quantity) : 0,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!report.products.length && (
              <p>
                {t(
                  "No products in this period.",
                  "Aucun produit dans cette période.",
                )}
              </p>
            )}
            <div className="ops-analytics-toolbar">
              <Button
                variant="secondary"
                disabled={state.page === 0}
                onClick={() => state.navigate(state.page - 1)}
              >
                {t("Previous", "Précédent")}
              </Button>
              <span role="status">
                {t("Page", "Page")} {state.page + 1}
              </span>
              <Button
                variant="secondary"
                disabled={!products.data.nextCursor}
                onClick={() => state.navigate(state.page + 1)}
              >
                {t("Next", "Suivant")}
              </Button>
            </div>
          </>
        )}
      </section>
      {summary.data && (
        <details className="ops-data-table">
          <summary>
            {t(
              "View chart data as a table",
              "Voir les données des graphiques en tableau",
            )}
          </summary>
          <div
            className="ops-table-wrap"
            tabIndex={0}
            role="region"
            aria-label={t("Daily chart data", "Données quotidiennes")}
          >
            <table className="ops-table">
              <thead>
                <tr>
                  {[
                    t("Date (UTC)", "Date (UTC)"),
                    t("Value CAD", "Valeur CAD"),
                    t("Orders", "Commandes"),
                    t("Previous value CAD", "Valeur précédente CAD"),
                    t("Previous orders", "Commandes précédentes"),
                  ].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.series.map((r) => (
                  <tr key={r.day}>
                    <td>{r.day}</td>
                    <td>{money(Math.round(r.value * 100))}</td>
                    <td>{r.orders}</td>
                    <td>{money(Math.round(r.previous * 100))}</td>
                    <td>{r.previousOrders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      <p className="ops-scope">
        {t(
          "Totals cover the selected period. CSV contains daily aggregates, not individual orders. Product rankings are paginated.",
          "Les totaux couvrent la période choisie. Le CSV contient les agrégats quotidiens, pas les commandes individuelles. Les produits sont paginés.",
        )}
      </p>
    </>
  );
}
