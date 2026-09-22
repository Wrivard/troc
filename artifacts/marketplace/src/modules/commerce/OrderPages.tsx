import { PremiumEmptyState } from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { useEffect, useState } from "react";
import type { OrderView, OrderStatus } from "@workspace/commerce";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import { OrderTotals } from "@workspace/troc-design-system/components/ui/order-totals";
import { api } from "../../api";
import {
  commerceMessages,
  orderStatuses,
  type CommerceMessage,
} from "./messages";
export function OrderPages({
  path,
  locale,
}: {
  path: string;
  locale: "en" | "fr";
}) {
  const t = (k: CommerceMessage) =>
    commerceMessages[k][locale === "en" ? 0 : 1];
  const state = (s: string) =>
    s in orderStatuses
      ? orderStatuses[s as OrderStatus][locale === "en" ? 0 : 1]
      : s;
  const money = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n / 100);
  const seller = path.startsWith("/seller"),
    id = path.split("/")[3];
  const [cursors, setCursors] = useState<string[]>([]);
  const [list, setList] = useState<
      { id: string; status: string; createdAt: string; totalCents: number }[]
    >([]),
    [order, setOrder] = useState<OrderView | null>(null),
    [error, setError] = useState<CommerceMessage | null>(null),
    [busy, setBusy] = useState(true);
  const load = async () => {
    setBusy(true);
    try {
      const route = "/commerce/" + (seller ? "seller/" : "") + "orders";
      if (id) setOrder(await api<OrderView>(route + "/" + id));
      else
        setList(
          await api(
            route +
              (cursors.length ? "?cursor=" + cursors[cursors.length - 1] : ""),
          ),
        );
    } catch (e) {
      setError(
        e instanceof Error && e.message in commerceMessages
          ? (e.message as CommerceMessage)
          : "error",
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [id, seller, cursors]);
  async function action(group: string, action: string, extra: object = {}) {
    setBusy(true);
    setError(null);
    try {
      await api("/commerce/seller-orders/" + group + "/actions", "POST", {
        action,
        idempotencyKey: crypto.randomUUID(),
        ...extra,
      });
      await load();
    } catch (e) {
      setError(
        e instanceof Error && e.message in commerceMessages
          ? (e.message as CommerceMessage)
          : "error",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">
        {t(seller ? "fulfillment" : "orders")}
      </h1>
      {busy && <p role="status">{t("loading")}</p>}
      {error && (
        <p role="alert">
          {t(error)}{" "}
          <a className="underline" href={`/sign-in?lang=${locale}`}>
            {t("signIn")}
          </a>
        </p>
      )}
      {!id && (
        <>
          {!busy && !error && list.length === 0 && (
            <PremiumEmptyState
              title={
                locale === "fr"
                  ? "Vos commandes apparaîtront ici."
                  : "Your orders will appear here."
              }
              description={
                locale === "fr"
                  ? "Retrouvez les articles, les statuts et les messages de chaque vendeur au même endroit."
                  : "Find items, status updates and seller messages together in one place."
              }
              actions={
                <Button asChild variant="secondary">
                  <a href={`/search?lang=${locale}`}>
                    {locale === "fr" ? "Explorer les cartes" : "Explore cards"}
                  </a>
                </Button>
              }
            />
          )}
          <ul className="grid gap-4">
            {list.map((o) => (
              <li
                key={o.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <a
                  className="flex flex-wrap gap-2 font-semibold underline"
                  href={`${seller ? "/seller" : "/account"}/orders/${o.id}?lang=${locale}`}
                >
                  {o.id.slice(0, 8)} ·{" "}
                  {new Date(o.createdAt).toLocaleDateString(
                    locale === "en" ? "en-CA" : "fr-CA",
                  )}{" "}
                  · {state(o.status)} · {money(o.totalCents)}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              disabled={busy || !cursors.length}
              onClick={() => setCursors(cursors.slice(0, -1))}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              disabled={busy || list.length < 50}
              onClick={() => setCursors([...cursors, list[list.length - 1].id])}
            >
              {t("next")}
            </Button>
          </div>
        </>
      )}
      {order && (
        <>
          <p>
            {order.id} · {state(order.status)} · {money(order.totalCents)}
          </p>
          <p>
            {order.address.recipient}
            <br />
            {order.address.line1} {order.address.line2}
            <br />
            {order.address.city}, {order.address.province}{" "}
            {order.address.postalCode} · CA
          </p>
          {!seller && (
            <p>
              {t("credit")}: {money(order.creditCents)} · {t("reward")}:{" "}
              {money(order.rewardCents)}
            </p>
          )}
          {seller && (
            <Button
              variant="outline"
              className="print:hidden"
              onClick={() => {
                const details = [...document.querySelectorAll("details")];
                const states = details.map((d) => d.open);
                details.forEach((d) => {
                  d.open = true;
                });
                window.addEventListener(
                  "afterprint",
                  () =>
                    details.forEach((d, i) => {
                      d.open = states[i];
                    }),
                  { once: true },
                );
                window.print();
              }}
            >
              {t("print")}
            </Button>
          )}
          {order.groups.map((g) => (
            <section
              key={g.id}
              className="grid gap-4 border-t border-border pt-6"
            >
              <h2 className="text-xl font-bold">
                {g.quote.seller.name} · {state(g.status)}
              </h2>
              <details open={g.quote.lines.length <= 10}>
                <summary className="cursor-pointer">
                  {t("show")} · {g.quote.cards} {t("cards")}
                </summary>
                <ul className="grid gap-2 py-4">
                  {g.quote.lines.map((l) => (
                    <li key={l.listingId}>
                      {l.quantity} × {l.listing.name[locale]} ·{" "}
                      {l.listing.language.toUpperCase()} · {l.listing.condition}{" "}
                      · {money(l.totalCents)}
                    </li>
                  ))}
                </ul>
              </details>
              <p>
                {t("shipping")}: {money(g.quote.shipping.cents)} ·{" "}
                {t("refunded")}: {money(g.refundedCents)}
              </p>
              {g.tracking && (
                <p>
                  {t("tracking")}: {g.tracking}
                </p>
              )}
              {seller && (
                <OrderTotals
                  className="print:hidden"
                  locale={locale}
                  lines={[
                    {
                      id: "commission",
                      label: t("commission"),
                      amount: g.fee.commissionCents / 100,
                    },
                    {
                      id: "processing",
                      label: t("processing"),
                      amount: g.fee.processingCents / 100,
                    },
                    {
                      id: "promoted",
                      label: t("promoted"),
                      amount: g.fee.promotedCents / 100,
                    },
                  ]}
                  totalLabel={t("net")}
                  total={g.fee.netCents / 100}
                />
              )}
              <div className="flex flex-wrap gap-3 print:hidden">
                {!seller && g.status === "shipped" && (
                  <Button
                    disabled={busy}
                    onClick={() => action(g.id, "delivered")}
                  >
                    {t("delivered")}
                  </Button>
                )}
                {!seller && g.status === "delivered" && (
                  <Button
                    disabled={busy}
                    onClick={() => action(g.id, "completed")}
                  >
                    {t("complete")}
                  </Button>
                )}
                {!seller &&
                  !["cancelled", "refunded", "issue"].includes(g.status) && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => action(g.id, "issue")}
                    >
                      {t("issue")}
                    </Button>
                  )}
                {seller && g.status === "awaiting_shipment" && (
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => action(g.id, "cancelled")}
                  >
                    {t("cancel")}
                  </Button>
                )}
              </div>
              {seller &&
                ["awaiting_shipment", "partially_refunded"].includes(
                  g.status,
                ) && (
                  <form
                    className="flex flex-wrap items-end gap-3 print:hidden"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action(g.id, "shipped", {
                        tracking: new FormData(e.currentTarget).get("tracking"),
                      });
                    }}
                  >
                    <label className="grid gap-2">
                      {t("tracking")}
                      <Input
                        name="tracking"
                        maxLength={100}
                        required={g.quote.shipping.tracked}
                      />
                    </label>
                    <Button disabled={busy} type="submit">
                      {t("ship")}
                    </Button>
                  </form>
                )}
              {seller && !["cancelled", "refunded"].includes(g.status) && (
                <form
                  className="flex flex-wrap items-end gap-3 print:hidden"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action(g.id, "refund", {
                      amountCents: Math.round(
                        Number(new FormData(e.currentTarget).get("amount")) *
                          100,
                      ),
                    });
                  }}
                >
                  <label className="grid gap-2">
                    {t("refundAmount")}
                    <Input
                      name="amount"
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </label>
                  <Button disabled={busy} variant="outline" type="submit">
                    {t("refund")}
                  </Button>
                </form>
              )}
              <form
                className="grid max-w-xl gap-3 print:hidden"
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(g.id, "message", {
                    body: new FormData(e.currentTarget).get("body"),
                  });
                  e.currentTarget.reset();
                }}
              >
                <label className="grid gap-2">
                  {t("message")}
                  <Textarea name="body" required maxLength={2000} />
                </label>
                <Button type="submit" variant="outline" disabled={busy}>
                  {t("send")}
                </Button>
              </form>
              <ul className="grid gap-2">
                {order.messages
                  .filter((m) => m.sellerOrderId === g.id)
                  .map((m) => (
                    <li key={m.id}>{m.body}</li>
                  ))}
              </ul>
              <p className="text-sm text-muted-foreground">{t("review")}</p>
            </section>
          ))}
        </>
      )}
    </>
  );
}
