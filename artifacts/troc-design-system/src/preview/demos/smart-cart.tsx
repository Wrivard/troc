import { useState } from "react";
import { SmartCartComparison, type SmartCartColumn } from "../../components/ui/smart-cart";
import { Button } from "../../components/ui/button";
import { usePreferences } from "../../hooks/use-preferences";
import { useCartMessages } from "../../lib/messages-cart";
import { DemoPanel, Guidelines, PageHeader, Section, Stack } from "../parts";

export default function SmartCartDemo() {
  const { locale } = usePreferences();
  const { tc } = useCartMessages();
  const [applied, setApplied] = useState(false);

  // Exact supplied source figures (visual only).
  const columns: [SmartCartColumn, SmartCartColumn] = [
    {
      heading: tc("smartOriginal"),
      sellersLabel: tc("smartSellers8"),
      lines: [
        { id: "cards", label: tc("smartCards"), amount: 22.41 },
        { id: "shipping", label: tc("smartShipping"), amount: 19.82 },
      ],
      totalLabel: tc("smartTotalLabel"),
      total: 42.23,
    },
    {
      heading: tc("smartTroc"),
      sellersLabel: tc("smartSellers3"),
      lines: [
        { id: "cards", label: tc("smartCards"), amount: 24.87 },
        { id: "shipping", label: tc("smartShipping"), amount: 7.44 },
      ],
      totalLabel: tc("smartTotalLabel"),
      total: 32.31,
      recommended: true,
    },
  ];

  return (
    <>
      <PageHeader eyebrow={tc("eyebrow")} title={tc("smartTitle")} description={tc("smartIntro")} />

      <Section title={tc("variants")}>
        <DemoPanel>
          <SmartCartComparison
            locale={locale}
            columns={columns}
            sellersRowLabel={tc("smartSellersRow")}
            savings={{ label: tc("smartSave"), amount: 9.92 }}
            explanation={tc("smartExplanation")}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <Button variant={applied ? "outline" : "primary"} size="sm" onClick={() => setApplied((v) => !v)}>
              {tc("smartApply")}
            </Button>
            <span className="ds-helper" role="status">{tc("visualPreviewOnly")}</span>
          </div>
          <p className="ds-helper" style={{ marginTop: 12 }}>{tc("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Section title={tc("states")}>
        <DemoPanel>
          <Stack label={tc("loading")}>
            <SmartCartComparison
              locale={locale}
              columns={columns}
              sellersRowLabel={tc("smartSellersRow")}
              loading
              loadingLabel={tc("smartLoading")}
            />
          </Stack>
          <Stack label={tc("emptyCart")}>
            <SmartCartComparison
              locale={locale}
              columns={columns}
              sellersRowLabel={tc("smartSellersRow")}
              empty
              emptyLabel={tc("smartEmpty")}
            />
          </Stack>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tc("smartDo") }, { kind: "dont", text: tc("smartDont") }]} />
    </>
  );
}
