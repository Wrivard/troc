import { useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import type { PublicPage, Locale } from "@workspace/catalog";
import {
  ChartContainer,
  ChartTooltip,
} from "@workspace/troc-design-system/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { catalogMessages, type CatalogMessage } from "./messages";
export default function PriceHistory({
  prices,
  locale,
}: {
  prices: PublicPage["prices"];
  locale: Locale;
}) {
  const [days, setDays] = useState(30);
  const latest = prices.length
    ? Math.max(...prices.map((p) => Date.parse(p.capturedAt)))
    : 0;
  const page = {
    prices: prices.filter(
      (p) => Date.parse(p.capturedAt) >= latest - days * 86400000,
    ),
  };
  const last = [...page.prices]
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    .at(-1);
  const t = (key: CatalogMessage) =>
    catalogMessages[key][locale === "en" ? 0 : 1];
  const format = (cents: number) =>
    new Intl.NumberFormat(locale + "-CA", {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  return (
    <div className="troc-history-compact">
      <div className="troc-history-summary">
        <div>
          <p>{locale === "fr" ? "Dernière référence" : "Latest reference"}</p>
          <strong>{last ? format(last.cents) : "—"}</strong>
        </div>
        <div
          role="group"
          aria-label={
            locale === "fr" ? "Période de référence" : "Reference period"
          }
        >
          {[7, 30, 90].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={days === value ? "secondary" : "ghost"}
              aria-pressed={days === value}
              onClick={() => setDays(value)}
            >
              {value}
              {locale === "fr" ? " J" : "D"}
            </Button>
          ))}
        </div>
      </div>
      <ChartContainer
        height={180}
        label={t("history")}
        state={page.prices.length ? "ready" : "empty"}
        emptySlot={<p>{locale === "fr" ? "Aucun relevé de prix disponible pour cette sélection." : "No price snapshots are available for this selection."}</p>}
        dataTable={
          <details className="troc-history-values">
            <summary>{locale === "fr" ? "Voir les relevés de prix" : "View price snapshots"}</summary>
          <table>
            <caption>{t("history")}</caption>
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("reference")}</th>
              </tr>
            </thead>
            <tbody>
              {page.prices.map((p, i) => (
                <tr key={i}>
                  <td>{p.capturedAt.slice(0, 10)}</td>
                  <td>{format(p.cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </details>
        }
      >
        <LineChart data={page.prices} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="capturedAt"
            tickFormatter={(v) => String(v).slice(5, 10)}
          />
          <YAxis tickFormatter={(v) => format(Number(v))} />
          <Tooltip content={<ChartTooltip formatValue={format} />} />
          <Line
            dataKey="cents"
            name={t("reference")}
            stroke="var(--color-primary)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
      <p className="text-xs text-muted-foreground">
        {locale === "fr"
          ? "Période terminant au dernier relevé disponible. Référence externe ou de démonstration; aucune transaction TROC n’est représentée."
          : "Window ends at the latest available snapshot. External or demo reference; no TROC transactions are represented."}
      </p>
    </div>
  );
}
