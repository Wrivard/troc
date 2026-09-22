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
  const page = { prices };
  const t = (key: CatalogMessage) =>
    catalogMessages[key][locale === "en" ? 0 : 1];
  const format = (cents: number) =>
    new Intl.NumberFormat(locale + "-CA", {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  return (
    <ChartContainer
      label={t("history")}
      state={page.prices.length ? "ready" : "empty"}
      emptySlot={<p>{t("empty")}</p>}
      dataTable={
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
      }
    >
      <LineChart data={page.prices}>
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
  );
}
