import { useEffect, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import {
  Package,
  TriangleAlert,
  Boxes,
  MessageSquare,
} from "@workspace/troc-design-system/components/ui/seller-icons";
import "./seller-hub.css";
type Order = {
  id: string;
  status: string;
  created_at: string;
  merchandise_cents: number;
  shipping_cents: number;
  refunded_cents: number;
  lines: { listing: { imageUrl?:string; name: { en: string; fr: string } }; quantity: number }[];
};
type Sample = {
  demo: true;
  inventory: { status: string; count: number; units: number; value: string }[];
  orders: Order[];
  messages: number;
};
type Dashboard = {
  account: { display_name: string };
  inventory: {
    active_listings: number;
    units: string;
    asking_value_cents: string;
  };
  sales: { completed_orders: number; merchandise_cents: string };
};
export function SellerHub({
  seller,
  dashboard,
  locale,
}: {
  seller: string;
  dashboard: Dashboard;
  locale: "en" | "fr";
}) {
  const fr = locale === "fr",
    t = (en: string, french: string) => (fr ? french : en),
    href = (p: string) => p + (p.includes("?") ? "&" : "?") + "lang=" + locale;
  const [sample, setSample] = useState<Sample | null>(null),
    [filter, setFilter] = useState("all"),
    [days, setDays] = useState("30"),
    [failure, setFailure] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    setSample(null);
    setFailure(false);
    setFilter("all");
    fetch("/api/dev/seller-hub?seller=" + encodeURIComponent(seller), {
      signal: c.signal,
    })
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((v) => {
        if (!c.signal.aborted && v?.demo) setSample(v);
      })
      .catch(() => {
        if (!c.signal.aborted) setFailure(true);
      });
    return () => c.abort();
  }, [seller, retry]);
  const money = (v: number | string) =>
    new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(Number(v) / 100);
  const labels: Record<string, string> = {
    awaiting_shipment: t("To ship", "À expédier"),
    shipped: t("Shipped", "Expédiée"),
    delivered: t("Delivered", "Livrée"),
    completed: t("Completed", "Terminée"),
    issue: t("Needs attention", "À examiner"),
    partially_refunded: t("Partially refunded", "Remboursée en partie"),
    refunded: t("Refunded", "Remboursée"),
    active: t("Active listings", "Annonces actives"),
    draft: t("Drafts", "Brouillons"),
    paused: t("Paused", "En pause"),
    sold_out: t("Sold out", "Épuisées"),
    archived: t("Archived", "Archivées"),
  };
  const count = (s: string) =>
      sample?.orders.filter((o) => o.status === s).length ?? 0,
    active = sample?.inventory.find((i) => i.status === "active");
  const orders =
    sample?.orders.filter((o) => filter === "all" || o.status === filter) ?? [];
  const period =
      sample?.orders.filter(
        (o) => Date.now() - Date.parse(o.created_at) <= Number(days) * 86400000,
      ) ?? [],
    gross = period.reduce((n, o) => n + o.merchandise_cents, 0),
    units = period.reduce(
      (n, o) => n + o.lines.reduce((x, l) => x + l.quantity, 0),
      0,
    );
  return (
    <div className="seller-hub hub-reference">
      <header className="seller-page-heading">
        <div>
          <h1>{t("Welcome back", "Bon retour")}</h1>
          <p>
            {t(
              "Here’s what’s happening with your store today.",
              "Voici ce qui se passe dans votre boutique aujourd’hui.",
            )}
          </p>
        </div>
        <div className="seller-page-actions">
          <Button asChild variant="outline">
            <a href={href("/seller/storefront")}>
              {t("Edit storefront", "Modifier la boutique")}
            </a>
          </Button>
          <Button asChild>
            <a href={href("/seller/inventory")}>
              {t("Manage listings", "Gérer les annonces")}
            </a>
          </Button>
        </div>
      </header>
      {sample && (
        <p className="hub-demo">
          {t(
            "Local sample data · No real sales or payments.",
            "Données de test locales · Aucune vente ni paiement réel.",
          )}
        </p>
      )}
      {failure && (
        <p role="alert">
          {t("Sample data unavailable.", "Exemples indisponibles.")}{" "}
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            {t("Retry", "Réessayer")}
          </Button>
        </p>
      )}
      <section
        className="hub-tasks"
        aria-label={t("Priority tasks", "Tâches prioritaires")}
      >
        {[
          [
            t("Ready to ship", "À expédier"),
            "awaiting_shipment",
            Package,
            t("Orders waiting for shipment", "Commandes à préparer"),
          ],
          [
            t("Resolve an issue", "Résoudre un problème"),
            "issue",
            TriangleAlert,
            t("Needs your attention", "À examiner"),
          ],
        ].map(([label, status, Icon, desc]) => {
          const I = Icon as typeof Package;
          return (
            <a
              key={String(status)}
              href={sample ? "#hub-orders" : href("/seller/orders?status=" + String(status))}
              onClick={() => setFilter(String(status))}
            >
              <I size={24} />
              <div>
                <span>{String(label)}</span>
                <strong>{sample ? count(String(status)) : "—"}</strong>
                <small>{String(desc)}</small>
              </div>
            </a>
          );
        })}
        <a href={href("/seller/inventory?status=active")}>
          <Boxes size={24} />
          <div>
            <span>{t("Active listings", "Annonces actives")}</span>
            <strong>
              {active?.count ?? dashboard.inventory.active_listings}
            </strong>
            <small>
              {t("Available in your inventory", "Dans votre inventaire")}
            </small>
          </div>
        </a>
        <a href={href("/seller/messages")}>
          <MessageSquare size={24} />
          <div>
            <span>{t("Order messages", "Messages de commande")}</span>
            <strong>{sample ? sample.messages : "—"}</strong>
            <small>
              {t(
                "Open your order conversations",
                "Ouvrir vos conversations de commande",
              )}
            </small>
          </div>
        </a>
      </section>
      <div className="hub-grid">
        <section className="hub-panel hub-sales">
          <div className="hub-panel-heading">
            <div>
              <h2>{t("Sales overview", "Aperçu des ventes")}</h2>
              <p>
                {sample
                  ? t(
                      "Sample orders, before refunds.",
                      "Commandes fictives, avant remboursements.",
                    )
                  : t(
                      "Eligible completed sales · all time.",
                      "Ventes terminées admissibles · depuis le début.",
                    )}
              </p>
            </div>
            {sample && (
              <Select value={days} onValueChange={setDays}>
                <SelectTrigger
                  className="hub-filter"
                  aria-label={t("Sales period", "Période des ventes")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["7", "30", "90"].map((n) => (
                    <SelectItem value={n} key={n}>
                      {t("Last " + n + " days", n + " derniers jours")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="hub-summary">
            {[
              [
                t("Merchandise ordered", "Marchandises commandées"),
                money(sample ? gross : dashboard.sales.merchandise_cents),
              ],
              [
                t("Orders", "Commandes"),
                sample ? period.length : dashboard.sales.completed_orders,
              ],
              [
                t(
                  "Average merchandise / order",
                  "Marchandises moyennes / commande",
                ),
                sample
                  ? period.length
                    ? money(gross / period.length)
                    : "—"
                  : "—",
              ],
              [t("Cards ordered", "Cartes commandées"), sample ? units : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="hub-panel hub-activity">
          <div className="hub-panel-heading">
            <div>
              <h2>{t("Order activity", "Activité des commandes")}</h2>
              <p>
                {t("All orders by status.", "Toutes les commandes par état.")}
              </p>
            </div>
            <a href={href("/seller/orders")}>
              {t("View orders", "Voir les commandes")} →
            </a>
          </div>
          {sample ? (
            <div className="hub-bars">
              {Object.keys(labels)
                .slice(0, 7)
                .map((s) => (
                  <div key={s}>
                    <span>{labels[s]}</span>
                    <div>
                      <i
                        style={{
                          width:
                            Math.max(
                              0,
                              (count(s) / Math.max(sample.orders.length, 1)) *
                                100,
                            ) + "%",
                        }}
                      />
                    </div>
                    <b>{count(s)}</b>
                  </div>
                ))}
            </div>
          ) : (
            <p>
              {t(
                "Open orders to view current activity.",
                "Ouvrez vos commandes pour consulter l’activité.",
              )}
            </p>
          )}
        </section>
        <section className="hub-panel hub-stock">
          <div className="hub-panel-heading">
            <div>
              <h2>{t("Inventory at a glance", "Votre inventaire en bref")}</h2>
              <p>
                {t(
                  "Listings and stock across your store.",
                  "Annonces et stock de votre boutique.",
                )}
              </p>
            </div>
            <a href={href("/seller/inventory")}>
              {t("Manage inventory", "Gérer l’inventaire")} →
            </a>
          </div>
          <div className="hub-summary hub-stock-grid">
            {[
              [
                labels.active,
                active?.count ?? dashboard.inventory.active_listings,
              ],
              [
                t("Available cards", "Cartes disponibles"),
                active?.units ?? dashboard.inventory.units,
              ],
              ...["archived", "draft", "paused", "sold_out"].map((s) => [
                labels[s],
                sample?.inventory.find((i) => i.status === s)?.count ?? "—",
              ]),
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="hub-panel hub-value-panel">
          <h2>{t("Inventory asking value", "Valeur demandée du stock")}</h2>
          <p>
            {t(
              "Active quantity × your listing price. Not market value or revenue.",
              "Quantité active × votre prix demandé. Ce n’est ni une valeur de marché ni un revenu.",
            )}
          </p>
          <strong className="hub-revenue">
            {money(active?.value ?? dashboard.inventory.asking_value_cents)}
          </strong>
          <div className="seller-page-actions">
            <Button asChild>
              <a href={href("/seller/inventory?tab=manual")}>
                {t("Add cards", "Ajouter des cartes")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={href("/seller/inventory?tab=import")}>
                {t("Import CSV", "Importer un CSV")}
              </a>
            </Button>
          </div>
        </section>
        <section className="hub-panel hub-orders" id="hub-orders">
          <div className="hub-panel-heading">
            <div>
              <h2>{t("Recent orders", "Commandes récentes")}</h2>
              <p>
                {t(
                  "Products, totals and status — open an order to manage it.",
                  "Produits, montants et état — ouvrez une commande pour la gérer.",
                )}
              </p>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger
                aria-label={t("Filter orders", "Filtrer les commandes")}
                className="hub-filter"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("All statuses", "Tous les états")}
                </SelectItem>
                {Object.keys(labels)
                  .slice(0, 7)
                  .map((s) => (
                    <SelectItem value={s} key={s}>
                      {labels[s]}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {sample ? (
            <>
              <div className="hub-table-scroll">
                <table>
                  <caption className="sr-only">
                    {t("Sample seller orders", "Commandes vendeur fictives")}
                  </caption>
                  <thead>
                    <tr>
                      {[
                        t("Order / card", "Commande / carte"),
                        t("Date", "Date"),
                        t("Items", "Articles"),
                        t("Total CAD", "Total CAD"),
                        t("Status", "État"),
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div className="seller-order-product">{o.lines?.[0]?.listing?.imageUrl && <img className="seller-card-image" src={o.lines[0].listing.imageUrl} alt="" loading="lazy" />}<div><a href={href("/seller/orders/" + o.id)}>
                            #{o.id.slice(-4)}
                          </a>
                          <small>{o.lines?.[0]?.listing?.name?.[locale]}</small></div></div>
                        </td>
                        <td>
                          {new Date(o.created_at).toLocaleDateString(
                            fr ? "fr-CA" : "en-CA",
                            { month: "short", day: "numeric" },
                          )}
                        </td>
                        <td>{o.lines.reduce((n, l) => n + l.quantity, 0)}</td>
                        <td>{money(o.merchandise_cents + o.shipping_cents)}</td>
                        <td>
                          <span className={"hub-status hub-status-" + o.status}>
                            {labels[o.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!orders.length && (
                <p role="status">
                  {t(
                    "No orders match this status.",
                    "Aucune commande pour cet état.",
                  )}
                </p>
              )}
            </>
          ) : (
            <a href={href("/seller/orders")}>
              {t("Open orders", "Ouvrir les commandes")} →
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
