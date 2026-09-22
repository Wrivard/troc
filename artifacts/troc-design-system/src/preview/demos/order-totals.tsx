import { OrderTotals } from "../../components/ui/order-totals";
import { usePreferences } from "../../hooks/use-preferences";
import { useCartMessages } from "../../lib/messages-cart";
import { DemoPanel, Guidelines, PageHeader, Row, Section, Stack } from "../parts";

export default function OrderTotalsDemo() {
  const { locale } = usePreferences();
  const { tc } = useCartMessages();

  const baseLines = [
    { id: "cards", label: tc("lineCards"), amount: 24.87, hint: tc("lineCardsHint") },
    { id: "shipping", label: tc("lineShipping"), amount: 7.44 },
    { id: "discount", label: tc("lineDiscount"), amount: 2.49, credit: true },
  ];

  return (
    <>
      <PageHeader eyebrow={tc("eyebrow")} title={tc("totalsTitle")} description={tc("totalsIntro")} />

      <Section title={tc("variants")}>
        <DemoPanel>
          <Row>
            <Stack label={tc("totalsFull")}>
              <div style={{ maxWidth: 360 }}>
                <OrderTotals
                  layout="full"
                  locale={locale}
                  lines={baseLines}
                  totalLabel={tc("lineTotal")}
                  total={29.82}
                />
              </div>
            </Stack>
            <Stack label={tc("totalsCompact")}>
              <div style={{ maxWidth: 280 }}>
                <OrderTotals
                  layout="compact"
                  locale={locale}
                  lines={baseLines}
                  totalLabel={tc("lineTotal")}
                  total={29.82}
                />
              </div>
            </Stack>
          </Row>
        </DemoPanel>
      </Section>

      <Section title={tc("totalsWithSavings")}>
        <DemoPanel>
          <div style={{ maxWidth: 360 }}>
            <OrderTotals
              layout="full"
              locale={locale}
              lines={[
                { id: "cards", label: tc("lineCards"), amount: 24.87, hint: tc("lineCardsHint") },
                { id: "shipping", label: tc("lineShipping"), amount: 7.44 },
              ]}
              totalLabel={tc("lineTotal")}
              total={32.31}
              savingsLabel={tc("savingsLabel")}
              savings={9.92}
            />
          </div>
          <p className="ds-helper" style={{ marginTop: 12 }}>{tc("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: tc("cartDo") }, { kind: "dont", text: tc("cartDont") }]} />
    </>
  );
}
