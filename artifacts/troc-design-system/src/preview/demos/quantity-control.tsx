import { useState } from "react";
import { QuantityControl } from "../../components/ui/quantity-control";
import { usePreferences } from "../../hooks/use-preferences";
import { useControlsMessages } from "../../lib/messages-controls";
import { DemoPanel, Field, Guidelines, PageHeader, Section } from "../parts";

export default function QuantityControlDemo() {
  usePreferences();
  const { tc } = useControlsMessages();
  const [qty, setQty] = useState(2);
  const [cartQty, setCartQty] = useState(1);
  const MIN = 1;
  const MAX = 10;
  const boundary = qty <= MIN ? tc("atMin") : qty >= MAX ? tc("atMax") : "";

  return <>
    <PageHeader eyebrow={tc("quantityEyebrow")} title={tc("quantityTitle")} description={tc("quantityIntro")} />

    <Section title={tc("default")}><DemoPanel>
      <Field id="qty-main" label={`${tc("quantityLabel")} · ${tc("minMax")}`} helper={tc("editHint")}>
        <QuantityControl
          id="qty-main"
          label={tc("quantityLabel")}
          decrementLabel={tc("decrease")}
          incrementLabel={tc("increase")}
          min={MIN}
          max={MAX}
          value={qty}
          onValueChange={setQty}
          aria-describedby="qty-main-hint"
        />
      </Field>
      <p className="ds-inline-status" role="status">{tc("quantityValue")}: {qty}{boundary ? ` · ${boundary}` : ""}</p>
    </DemoPanel></Section>

    <Section title={tc("compactCart")}><DemoPanel>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <span className="troc-choice-label">{tc("inStock")}</span>
        <QuantityControl
          compact
          label={tc("quantityLabel")}
          decrementLabel={tc("decrease")}
          incrementLabel={tc("increase")}
          min={1}
          max={4}
          value={cartQty}
          onValueChange={setCartQty}
        />
      </div>
      <p className="ds-helper" style={{ marginTop: 12 }}>{tc("demoOnly")}</p>
    </DemoPanel></Section>

    <Section title={tc("states")}><DemoPanel><div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
      <Field id="qty-min" label={tc("atMin")}>
        <QuantityControl id="qty-min" label={tc("quantityLabel")} decrementLabel={tc("decrease")} incrementLabel={tc("increase")} min={1} max={10} defaultValue={1} />
      </Field>
      <Field id="qty-max" label={tc("atMax")}>
        <QuantityControl id="qty-max" label={tc("quantityLabel")} decrementLabel={tc("decrease")} incrementLabel={tc("increase")} min={1} max={3} defaultValue={3} />
      </Field>
      <Field id="qty-error" label={tc("error")}>
        <QuantityControl id="qty-error" invalid label={tc("quantityLabel")} decrementLabel={tc("decrease")} incrementLabel={tc("increase")} min={1} max={10} defaultValue={2} />
      </Field>
      <Field id="qty-disabled" label={tc("disabled")}>
        <QuantityControl id="qty-disabled" disabled label={tc("quantityLabel")} decrementLabel={tc("decrease")} incrementLabel={tc("increase")} min={1} max={10} defaultValue={2} />
      </Field>
    </div></DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tc("quantityDo") }, { kind: "dont", text: tc("quantityDont") }]} />
  </>;
}
