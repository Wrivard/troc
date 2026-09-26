import { useOrderPage } from "./use-order-page";
import { SellerLoading } from "./SellerLoading";
import { useEffect, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  useSellerCopy,
  OperationsPage,
  Choice,
  Product,
  Status,
  exportOrders,
  statusLabel,
} from "./operations-ui";
export function SellerOrders() {
  const { t } = useSellerCopy();
  return (
    <OperationsPage
      title={t("Orders", "Commandes")}
      description={t(
        "Manage, fulfil and track your store's orders.",
        "Gérez, préparez et suivez les commandes de votre boutique.",
      )}
    >
      <Orders />
    </OperationsPage>
  );
}
function Orders() {
  const { t, fr, date, money, href, locale } = useSellerCopy();
  const readFilters = () => {
    const params = new URLSearchParams(
      typeof window === "undefined" ? "" : window.location.search,
    );
    const status = params.get("status") || "all";
    return {
      q: (params.get("q") ?? "").slice(0, 100),
      status: [
        "all",
        "awaiting_shipment",
        "shipped",
        "delivered",
        "completed",
        "issue",
        "cancelled",
        "refunded",
        "partially_refunded",
        "simulated_paid",
      ].includes(status)
        ? status
        : "all",
      period: ["7", "30", "90"].includes(params.get("period") ?? "")
        ? params.get("period")!
        : "all",
      sort: ["old", "total"].includes(params.get("sort") ?? "")
        ? params.get("sort")!
        : "new",
    };
  };
  const [initial] = useState(readFilters);
  const [q, setQ] = useState(initial.q),
    [status, setStatus] = useState(initial.status),
    [period, setPeriod] = useState(initial.period),
    [sort, setSort] = useState(initial.sort);
  const state = useOrderPage({ q, status, period, sort, lang: locale });
  const { data, summary, page, setPage } = state;
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value, defaultValue] of [
      ["q", q, ""],
      ["status", status, "all"],
      ["period", period, "all"],
      ["sort", sort, "new"],
    ]) {
      if (value === defaultValue) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState(window.history.state, "", url);
  }, [q, status, period, sort]);
  useEffect(() => {
    const restore = () => {
      const filters = readFilters();
      setQ(filters.q);
      setStatus(filters.status);
      setPeriod(filters.period);
      setSort(filters.sort);
      setPage(0);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  const groups: [string, string][] = [
    ["all", t("All orders", "Toutes")],
    ["awaiting_shipment", t("To ship", "À expédier")],
    ["shipped", t("Shipped", "Expédiées")],
    ["issue", t("Needs attention", "À vérifier")],
    ["refunded", t("Refunded", "Remboursées")],
  ];
  const rows = data?.orders ?? [];
  const current = page;
  return (
    <>
      <div className="ops-priorities">
        {[
          [
            "awaiting_shipment",
            t("Ready to ship", "À expédier"),
            t("Prepare these orders next", "À préparer en priorité"),
          ],
          [
            "issue",
            t("Needs your attention", "Votre attention requise"),
            t("Review and resolve", "Vérifier et résoudre"),
          ],
          [
            "shipped",
            t("On their way", "En route"),
            t("Track shipped orders", "Suivre les expéditions"),
          ],
        ].map(([v, label, note]) => (
          <button
            key={v}
            aria-pressed={status === v}
            onClick={() => {
              setStatus(v);
              setPage(0);
            }}
          >
            <span>{label}</span>
            <strong>{summary ? (summary.priorities[v] ?? 0) : "—"}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
      <div className="ops-toolbar">
        <label className="ops-search">
          <span>{t("Search orders", "Rechercher")}</span>
          <Input
            value={q}
            maxLength={100}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder={t(
              "Order number, buyer or card…",
              "Numéro, acheteur ou carte…",
            )}
          />
        </label>
        <Choice
          label={t("Status", "État")}
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          items={[
            ["all", t("All statuses", "Tous les états")],
            ...Array.from(
              new Set([
                ...groups
                  .filter(([value]) => value !== "all")
                  .map(([value]) => value),
                ...(status !== "all" ? [status] : []),
                ..."awaiting_shipment shipped delivered completed issue refunded partially_refunded cancelled simulated_paid".split(
                  " ",
                ),
              ]),
            ).map((s) => [s, statusLabel(s, fr)] as [string, string]),
          ]}
        />
        <Choice
          label={t("Period", "Période")}
          value={period}
          onChange={(v) => {
            setPeriod(v);
            setPage(0);
          }}
          items={[
            ["all", t("All available", "Tout l’historique disponible")],
            ["7", t("Last 7 days", "7 derniers jours")],
            ["30", t("Last 30 days", "30 derniers jours")],
            ["90", t("Last 90 days", "90 derniers jours")],
          ]}
        />
        <Choice
          label={t("Sort by", "Trier par")}
          value={sort}
          onChange={(v) => {
            setSort(v);
            setPage(0);
          }}
          items={[
            ["new", t("Newest first", "Plus récentes")],
            ["old", t("Oldest first", "Plus anciennes")],
            ["total", t("Highest total", "Total décroissant")],
          ]}
        />
        <Button
          variant="secondary"
          disabled={!data || !rows.length}
          onClick={() => exportOrders(rows)}
        >
          {t("Export this page", "Exporter cette page")} ({rows.length})
        </Button>
      </div>
      <div
        className="ops-tabs"
        aria-label={t("Filter orders", "Filtrer les commandes")}
      >
        {groups.map(([v, label]) => (
          <button
            key={v}
            aria-pressed={status === v}
            onClick={() => {
              setStatus(v);
              setPage(0);
            }}
          >
            {label} <span>{summary ? (summary.tabs[v] ?? 0) : "—"}</span>
          </button>
        ))}
      </div>
      <div className="ops-result">
        <strong aria-live="polite">
          {summary ? summary.matchedCount : "—"} {t("orders", "commandes")}
        </strong>
        <span>
          {t("Order totals", "Total des commandes")}{" "}
          <b>{summary ? money(summary.matchedTotalCents) : "—"}</b>
        </span>
      </div>
      {state.summaryError && (
        <div role="alert">
          {t(
            "Order totals could not be loaded.",
            "Les totaux sont indisponibles.",
          )}{" "}
          <Button variant="secondary" onClick={state.retrySummary}>
            {t("Retry totals", "Réessayer les totaux")}
          </Button>
        </div>
      )}
      {!summary && !state.summaryError && (
        <p role="status" className="sr-only">
          {t("Loading totals", "Chargement des totaux")}
        </p>
      )}
      {!data ? (
        state.error ? (
          <div role="alert" className="ops-empty">
            <p>
              {t(
                "Orders could not be loaded.",
                "Impossible de charger les commandes.",
              )}
            </p>
            <Button onClick={state.retry}>
              {t("Retry orders", "Réessayer les commandes")}
            </Button>
          </div>
        ) : (
          <SellerLoading
            view="orders"
            locale={locale}
            heading={false}
            rowsOnly
          />
        )
      ) : (
        <div
          className="ops-table-wrap"
          role="region"
          aria-label={t("Orders table", "Tableau des commandes")}
          tabIndex={0}
        >
          <table className="ops-table">
            <caption className="sr-only">
              {t("Store orders", "Commandes de la boutique")}
            </caption>
            <thead>
              <tr>
                {[
                  t("Next action", "Prochaine action"),
                  t("Order / item", "Commande / article"),
                  t("Quantity", "Quantité"),
                  t("Total (CAD)", "Total (CAD)"),
                  t("Date", "Date"),
                  t("Status", "État"),
                  t("Actions", "Actions"),
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr
                  key={o.id}
                  className={
                    o.status === "awaiting_shipment"
                      ? "ops-order-ready"
                      : undefined
                  }
                >
                  <td className="ops-next-action">
                    <strong>
                      {o.status === "awaiting_shipment"
                        ? t("Ready to ship", "À expédier")
                        : o.status === "issue"
                          ? t("Resolve an issue", "Résoudre un problème")
                          : statusLabel(o.status, fr)}
                    </strong>
                    <a
                      className="ops-action-link"
                      href={href("/seller/orders/" + o.id)}
                    >
                      {o.status === "awaiting_shipment"
                        ? t("Prepare shipment", "Préparer l’expédition")
                        : t("View details", "Voir les détails")}
                    </a>
                    {o.status === "awaiting_shipment" && (
                      <small>
                        {t("Awaiting fulfilment", "En attente de préparation")}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className="ops-order-meta">
                      <a
                        className="ops-order-link"
                        href={href("/seller/orders/" + o.id)}
                      >
                        #{o.id.slice(-4)}
                      </a>
                      <span>{o.buyer}</span>
                    </div>
                    <Product order={o} />
                    {o.demo && (
                      <small>{t("Sample order", "Commande fictive")}</small>
                    )}
                  </td>
                  <td>{o.lines.reduce((n, l) => n + l.quantity, 0)}</td>
                  <td>
                    {money(o.totalCents)}
                    {o.refundedCents > 0 && (
                      <small>
                        {t("Refunded", "Remboursé")} {money(o.refundedCents)}
                      </small>
                    )}
                  </td>
                  <td>{date(o.createdAt)}</td>
                  <td>
                    <Status value={o.status} />
                  </td>
                  <td>
                    <a href={href("/seller/orders/" + o.id)}>
                      {t("View order", "Voir la commande")}
                    </a>
                    {data?.canReply && (
                      <a
                        className="ops-sub-link"
                        href={href("/seller/messages?order=" + o.id)}
                      >
                        {t("Message", "Message")}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <div className="ops-empty">
              <h2>
                {t("No matching orders", "Aucune commande correspondante")}
              </h2>
              <p>
                {t(
                  "Try another card, buyer or status.",
                  "Essayez une autre carte, un acheteur ou un état.",
                )}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setStatus("all");
                  setPeriod("all");
                  setPage(0);
                }}
              >
                {t("Clear filters", "Effacer les filtres")}
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="ops-pagination">
        <span>
          {rows.length ? current * 8 + 1 : 0}–{current * 8 + rows.length}
          {summary ? " / " + summary.matchedCount : ""}
        </span>
        <div>
          <Button
            variant="secondary"
            disabled={!data || current === 0}
            onClick={() => setPage(current - 1)}
          >
            {t("Previous", "Précédent")}
          </Button>
          <span>
            {t("Page", "Page")} {current + 1}
          </span>
          <Button
            variant="secondary"
            disabled={!data?.nextCursor}
            onClick={() => setPage(current + 1)}
          >
            {t("Next", "Suivant")}
          </Button>
        </div>
      </div>
      {rows.some((o) => o.demo) && (
        <p className="ops-scope">
          {t(
            "Includes sample orders for your test store.",
            "Comprend des commandes fictives de votre boutique de test.",
          )}
        </p>
      )}
      <p className="ops-scope">
        {t(
          "Open an order to view shipping, refunds and fulfilment actions. Shipping-label purchasing is not connected.",
          "Ouvrez une commande pour les détails, remboursements et actions d’expédition. L’achat d’étiquettes n’est pas connecté.",
        )}
      </p>
    </>
  );
}
