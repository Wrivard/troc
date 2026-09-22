import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Chip, ChipGroup } from "../../components/ui/chips";
import { ChartContainer, ChartLegend, ChartTooltip, type ChartSeriesConfig } from "../../components/ui/chart";
import { formatCad } from "../../components/ui/price";
import { usePreferences } from "../../hooks/use-preferences";
import { useDataMessages } from "../../lib/messages-data";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

type ChartState = "ready" | "loading" | "empty" | "error";

export default function ChartDemo() {
  const { locale } = usePreferences();
  const { td } = useDataMessages();
  const [state, setState] = useState<ChartState>("ready");

  const lineData = [
    { week: "W1", low: 172, avg: 188 },
    { week: "W2", low: 168, avg: 191 },
    { week: "W3", low: 180, avg: 197 },
    { week: "W4", low: 176, avg: 194 },
    { week: "W5", low: 184, avg: 201 },
    { week: "W6", low: 190, avg: 205 },
  ];
  const barData = [
    { game: td("gamePokemon"), units: 128 },
    { game: td("gameMagic"), units: 84 },
    { game: td("gameOnePiece"), units: 61 },
  ];

  const lineSeries: ChartSeriesConfig[] = [
    { key: "low", label: td("seriesLow"), color: "var(--text-secondary)", dash: "dashed", symbol: "square" },
    { key: "avg", label: td("seriesAvg"), color: "var(--color-primary)", dash: "solid", symbol: "circle" },
  ];
  const barSeries: ChartSeriesConfig[] = [
    { key: "units", label: td("seriesUnits"), color: "var(--color-primary)", symbol: "square" },
  ];

  const stateChips = (
    <ChipGroup label={td("chartStateLabel")}>
      {([["ready", "stateReady"], ["loading", "stateLoading"], ["empty", "stateEmpty"], ["error", "stateError"]] as const).map(([value, key]) => (
        <Chip key={value} selectable selected={state === value} onSelectedChange={() => setState(value)}>{td(key)}</Chip>
      ))}
    </ChipGroup>
  );

  const lineTable = (
    <table>
      <caption>{td("dataAltCaption")}</caption>
      <thead>
        <tr>
          <th scope="col">{td("colWeek")}</th>
          <th scope="col" data-numeric>{td("seriesLow")}</th>
          <th scope="col" data-numeric>{td("seriesAvg")}</th>
        </tr>
      </thead>
      <tbody>
        {lineData.map((row) => (
          <tr key={row.week}>
            <th scope="row">{row.week}</th>
            <td data-numeric>{formatCad(row.low, locale)}</td>
            <td data-numeric>{formatCad(row.avg, locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const barTable = (
    <table>
      <caption>{td("dataAltCaption")}</caption>
      <thead>
        <tr>
          <th scope="col">{td("colGameName")}</th>
          <th scope="col" data-numeric>{td("seriesUnits")}</th>
        </tr>
      </thead>
      <tbody>
        {barData.map((row) => (
          <tr key={row.game}>
            <th scope="row">{row.game}</th>
            <td data-numeric>{row.units}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <PageHeader eyebrow={td("eyebrow")} title={td("chartTitle")} description={td("chartIntro")} />

      <Section title={td("chartStateLabel")}>
        <DemoPanel>{stateChips}<p className="ds-helper" style={{ marginTop: 12 }}>{td("demoOnly")}</p></DemoPanel>
      </Section>

      <Section title={td("lineTitle")}>
        <DemoPanel>
          <ChartLegend series={lineSeries} style={{ marginBottom: 12 }} />
          <ChartContainer
            label={td("chartLineLabel")}
            state={state}
            loadingSlot={<span role="status">{td("chartLoading")}</span>}
            emptySlot={<span>{td("chartEmpty")}</span>}
            errorSlot={<span>{td("chartError")}</span>}
            dataTable={lineTable}
          >
            <LineChart data={lineData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => formatCad(v as number, locale)} />
              <Tooltip content={<ChartTooltip formatValue={(v) => formatCad(v, locale)} labelForKey={(k) => (k === "low" ? td("seriesLow") : td("seriesAvg"))} />} />
              <Line type="monotone" dataKey="low" name={td("seriesLow")} stroke="var(--text-secondary)" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="avg" name={td("seriesAvg")} stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ChartContainer>
        </DemoPanel>
      </Section>

      <Section title={td("barTitle")}>
        <DemoPanel>
          <ChartLegend series={barSeries} style={{ marginBottom: 12 }} />
          <ChartContainer
            label={td("chartBarLabel")}
            state={state}
            loadingSlot={<span role="status">{td("chartLoading")}</span>}
            emptySlot={<span>{td("chartEmpty")}</span>}
            errorSlot={<span>{td("chartError")}</span>}
            dataTable={barTable}
          >
            <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="game" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={32} />
              <Tooltip cursor={{ fill: "var(--surface-hover)" }} content={<ChartTooltip labelForKey={() => td("seriesUnits")} />} />
              <Bar dataKey="units" name={td("seriesUnits")} fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ChartContainer>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: td("chartDo") }, { kind: "dont", text: td("chartDont") }]} />
    </>
  );
}
