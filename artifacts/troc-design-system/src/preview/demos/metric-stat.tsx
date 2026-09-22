import { DollarSign, Eye, PackageOpen, Star } from "lucide-react";
import { KpiBlock, MetricStat } from "../../components/ui/metric-stat";
import { usePreferences } from "../../hooks/use-preferences";
import { useDataMessages } from "../../lib/messages-data";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

export default function MetricStatDemo() {
  usePreferences();
  const { td } = useDataMessages();

  return (
    <>
      <PageHeader eyebrow={td("eyebrow")} title={td("metricTitle")} description={td("metricIntro")} />

      <Section title={td("kpiTitle")}>
        <DemoPanel>
          <KpiBlock label={td("kpiTitle")}>
            <MetricStat icon={<DollarSign />} label={td("metricSales")} value={td("metricSalesValue")} trend="up" changeLabel={td("metricSalesChange")} meta={td("sampleLabel")} />
            <MetricStat icon={<Eye />} label={td("metricViews")} value={td("metricViewsValue")} trend="up" changeLabel={td("metricViewsChange")} />
            <MetricStat icon={<PackageOpen />} label={td("metricOrders")} value={td("metricOrdersValue")} trend="down" changeLabel={td("metricOrdersChange")} />
            <MetricStat icon={<Star />} label={td("metricRating")} value={td("metricRatingValue")} trend="neutral" changeLabel={td("metricRatingChange")} />
          </KpiBlock>
          <p className="ds-helper" style={{ marginTop: 16 }}>{td("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={td("compactTitle")}>
        <DemoPanel>
          <KpiBlock dense>
            <MetricStat density="compact" label={td("metricListed")} value={td("metricListedValue")} />
            <MetricStat density="compact" label={td("metricShipTime")} value={td("metricShipTimeValue")} />
            <MetricStat density="compact" label={td("metricRating")} value={td("metricRatingValue")} trend="neutral" changeLabel={td("metricRatingChange")} />
          </KpiBlock>
        </DemoPanel>
      </Section>

      <Section title={td("denseTitle")}>
        <DemoPanel>
          <KpiBlock dense>
            <MetricStat density="compact" label={td("metricSales")} value={td("metricSalesValue")} trend="up" changeLabel={td("metricSalesChange")} />
            <MetricStat density="compact" label={td("metricViews")} value={td("metricViewsValue")} trend="up" changeLabel={td("metricViewsChange")} />
            <MetricStat density="compact" label={td("metricOrders")} value={td("metricOrdersValue")} trend="down" changeLabel={td("metricOrdersChange")} />
            <MetricStat density="compact" label={td("metricListed")} value={td("metricListedValue")} />
          </KpiBlock>
        </DemoPanel>
      </Section>

      <Section title={td("loadingTitle")}>
        <DemoPanel>
          <KpiBlock>
            <MetricStat loading label={td("metricSales")} value="" />
            <MetricStat loading label={td("metricViews")} value="" />
            <MetricStat loading label={td("metricOrders")} value="" />
          </KpiBlock>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: td("metricDo") }, { kind: "dont", text: td("metricDont") }]} />
    </>
  );
}
