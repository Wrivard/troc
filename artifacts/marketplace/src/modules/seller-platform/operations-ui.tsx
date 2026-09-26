import { SellerLoading } from "./SellerLoading";
import { useEffect, useState, type ReactNode } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import { useSellerWorkspace } from "./SellerShell";
import { api } from "../../api";
import "./seller-operations.css";
export type SellerOrder = {
  id: string;
  status: string;
  createdAt: string;
  buyer: string;
  province: string;
  demo: boolean;
  totalCents: number;
  merchandiseCents: number;
  shippingCents: number;
  refundedCents: number;
  messageCount: number;
  unreadCount?: number;
  lastMessage: string | null;
  messageAt: string | null;
  lines: {
    name: { en: string; fr: string };
    quantity: number;
    unitCents: number;
    totalCents: number;
    variantId: string;
    condition: string;
    imageUrl: string | null;
  }[];
};
export type Operations = {
  sellerId: string;
  canReply: boolean;
  canAnalyze: boolean;
  truncated: boolean;
  orders: SellerOrder[];
};
export function useSellerOperations() {
  const { seller, directoryState, reloadDirectory } = useSellerWorkspace();
  const [data, setData] = useState<Operations | null>(null),
    [error, setError] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setError(false);
    if (seller)
      api<Operations>("/seller/platform/" + seller + "/operations")
        .then((d) => {
          if (active) setData(d);
        })
        .catch(() => {
          if (active) setError(true);
        });
    return () => {
      active = false;
    };
  }, [seller, revision]);
  return {
    data: data?.sellerId === seller ? data : null,
    error: error || directoryState === "error",
    reload: () => { if (directoryState === "error") reloadDirectory(); else setRevision((n) => n + 1); },
  };
}
export function useSellerCopy() {
  const prefs = usePreferences(),
    fr = prefs.locale === "fr";
  return {
    ...prefs,
    fr,
    t: (en: string, frText: string) => (fr ? frText : en),
    money: (c: number) =>
      new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
        style: "currency",
        currency: "CAD",
      }).format(c / 100),
    date: (v: string) =>
      new Date(v).toLocaleDateString(fr ? "fr-CA" : "en-CA", {
        month: "short",
        day: "numeric",
      }),
    href: (v: string) =>
      v + (v.includes("?") ? "&" : "?") + "lang=" + prefs.locale,
  };
}
export function Choice({
  label,
  value,
  onChange,
  items,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  items: [string, string][];
  disabled?: boolean;
}) {
  return (
    <label className="ops-choice">
      <span>{label}</span>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
export function OperationsPage({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { locale, theme, setLocale, setTheme } = useSellerCopy();
  return (
    <>
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main id="main-content" className="seller-operations">
        <header className="seller-page-heading">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {actions && <div className="seller-page-actions">{actions}</div>}
        </header>
        {children}
      </main>
      <MarketplaceFooter locale={locale} />
    </>
  );
}
export function OperationsState({
  error,
  reload,
}: {
  error: boolean;
  reload: () => void;
}) {
  const { t, locale } = useSellerCopy();
  const { seller, directoryState } = useSellerWorkspace();
  if (!error && directoryState === "ready" && !seller) return <section className="ops-empty"><h2>{t("No active store is available.", "Aucune boutique active n’est disponible.")}</h2><p>{t("Choose an active store or check your seller access.", "Choisissez une boutique active ou vérifiez votre accès vendeur.")}</p></section>;
  if (!error) return <SellerLoading locale={locale} view={typeof window === "undefined" ? "orders" : window.location.pathname.split("/")[2]} />;
  return (
    <section className="ops-empty" role={error ? "alert" : "status"}>
      <h2>
        {error
          ? t(
              "We couldn't load your store.",
              "Impossible de charger votre boutique.",
            )
          : t("Loading your workspace…", "Chargement de votre espace…")}
      </h2>
      {error && (
        <Button variant="secondary" onClick={reload}>
          {t("Try again", "Réessayer")}
        </Button>
      )}
    </section>
  );
}
export function ScopeNote({ data }: { data: Operations }) {
  const { t } = useSellerCopy();
  return (
    <p className="ops-scope">
      {data.orders.some((o) => o.demo)
        ? t(
            "Includes sample orders for your test store.",
            "Comprend des commandes fictives de votre boutique de test.",
          )
        : t("Your store's orders.", "Les commandes de votre boutique.")}{" "}
      {data.truncated &&
        t(
          "Showing the latest 200 orders only.",
          "Affichage limité aux 200 dernières commandes.",
        )}
    </p>
  );
}
const statuses: Record<string, [string, string]> = {
  awaiting_shipment: ["To ship", "À expédier"],
  shipped: ["Shipped", "Expédiée"],
  delivered: ["Delivered", "Livrée"],
  completed: ["Completed", "Terminée"],
  issue: ["Needs attention", "À vérifier"],
  partially_refunded: ["Partially refunded", "Remboursement partiel"],
  refunded: ["Refunded", "Remboursée"],
  cancelled: ["Cancelled", "Annulée"],
};
export function statusLabel(s: string, fr: boolean) {
  return statuses[s]?.[fr ? 1 : 0] ?? s;
}
export function Status({ value }: { value: string }) {
  const { fr } = useSellerCopy();
  return (
    <span className={"ops-status ops-status-" + value}>
      {statusLabel(value, fr)}
    </span>
  );
}
export function Product({ order }: { order: Pick<SellerOrder, "lines"> }) {
  const { locale, t } = useSellerCopy();
  const line = order.lines[0];
  return (
    <div className="ops-product">
      {line?.imageUrl ? (
        <img src={line.imageUrl} alt="" width="34" height="48" loading="lazy" />
      ) : (
        <span className="ops-art-placeholder" aria-hidden="true" />
      )}
      <div>
        <strong>{line?.name[locale] ?? t("Order items", "Articles")}</strong>
        <small>
          {order.lines.length > 1
            ? "+" +
              (order.lines.length - 1) +
              " " +
              t("other items", "autres articles")
            : line?.condition}
        </small>
      </div>
    </div>
  );
}
export function exportOrders(
  orders: Pick<SellerOrder, "id" | "createdAt" | "buyer" | "totalCents" | "refundedCents" | "status" | "demo">[],
  filename = "troc-orders.csv",
) {
  const cell = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^(?:\s*[=+@-]|[\t\r])/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const rows = [
    ["Order", "Date", "Buyer", "Total CAD", "Refunded CAD", "Status", "Sample"],
    ...orders.map((o) => [
      o.id,
      o.createdAt,
      o.buyer,
      (o.totalCents / 100).toFixed(2),
      (o.refundedCents / 100).toFixed(2),
      o.status,
      o.demo ? "yes" : "no",
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

