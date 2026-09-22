import { Progress } from "../../components/ui/progress";
import { usePreferences } from "../../hooks/use-preferences";
import { useSellerFoundationMessages } from "../../lib/messages-seller-foundations";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function ProgressDemo() {
  usePreferences();
  const { ts } = useSellerFoundationMessages();

  return (
    <>
      <PageHeader eyebrow={ts("eyebrow")} title={ts("progressTitle")} description={ts("progressIntro")} />

      <Section title={ts("determinate")}>
        <DemoPanel>
          <Stack>
            <Progress value={1.42} max={5} tone="accent" label={ts("sellerMinimumLabel")} valueLabel={ts("sellerMinimumValue")} />
            <p className="ds-helper">{ts("sellerMinimumHelp")}</p>
            <Progress value={36.5} max={50} tone="positive" label={ts("freeShippingLabel")} valueLabel={ts("freeShippingValue")} />
            <Progress value={2} max={5} tone="accent" label={ts("promotionLabel")} valueLabel={ts("promotionValue")} />
            <p className="ds-helper">{ts("promotionHelp")}</p>
          </Stack>
        </DemoPanel>
      </Section>

      <Section title={ts("states")}>
        <DemoPanel>
          <Stack>
            <Progress value={0} max={100} label={ts("zero")} valueLabel="0%" />
            <Progress value={45} max={100} tone="accent" label={ts("partial")} valueLabel="45%" />
            <Progress value={100} max={100} tone="positive" label={ts("complete")} valueLabel="100%" />
            <Progress value={null} label={ts("indeterminate")} valueLabel={ts("loadingLabel")} />
          </Stack>
        </DemoPanel>
      </Section>

      <Section title={ts("sizes")}>
        <DemoPanel>
          <Stack>
            <Progress size="default" value={62} max={100} tone="accent" label={ts("standard")} valueLabel="62%" />
            <Progress size="compact" value={62} max={100} tone="accent" label={ts("compact")} valueLabel="62%" />
          </Stack>
          <p className="ds-helper" style={{ marginTop: 16 }}>{ts("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: ts("progressDo") }, { kind: "dont", text: ts("progressDont") }]} />
    </>
  );
}
