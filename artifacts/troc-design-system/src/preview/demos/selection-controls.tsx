import { useMemo, useState } from "react";
import { Checkbox, RadioGroup, RadioGroupItem, Switch } from "../../components/ui/selection-controls";
import { usePreferences } from "../../hooks/use-preferences";
import { useControlsMessages } from "../../lib/messages-controls";
import { DemoPanel, Guidelines, PageHeader, Section } from "../parts";

const conditions = ["nearMint", "lightlyPlayed", "moderatelyPlayed"] as const;

export default function SelectionControlsDemo() {
  usePreferences();
  const { tc } = useControlsMessages();
  const [emails, setEmails] = useState(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({ nearMint: true, lightlyPlayed: false, moderatelyPlayed: false });
  const [condition, setCondition] = useState("nearMint");
  const [foils, setFoils] = useState(false);
  const anyChecked = Object.values(checked).some(Boolean);
  const allChecked = Object.values(checked).every(Boolean);
  const parent: boolean | "indeterminate" = allChecked ? true : anyChecked ? "indeterminate" : false;
  const setAll = (next: boolean) => setChecked({ nearMint: next, lightlyPlayed: next, moderatelyPlayed: next });

  return <>
    <PageHeader eyebrow={tc("selectionEyebrow")} title={tc("selectionTitle")} description={tc("selectionIntro")} />

    <Section title={tc("checkbox")}><DemoPanel>
      <label className="troc-choice">
        <Checkbox checked={parent} onCheckedChange={(value) => setAll(value === true)} aria-label={tc("selectAll")} />
        <span className="troc-choice-label">{tc("selectAll")}<span className="troc-choice-label-hint">{parent === "indeterminate" ? tc("indeterminate") : parent ? tc("checked") : tc("unchecked")}</span></span>
      </label>
      <div style={{ marginTop: 8 }}>
        {conditions.map((key) => (
          <label className="troc-choice" key={key} style={{ display: "flex", paddingLeft: 20 }}>
            <Checkbox checked={checked[key]} onCheckedChange={(value) => setChecked((prev) => ({ ...prev, [key]: value === true }))} aria-label={tc(key)} />
            <span className="troc-choice-label">{tc(key)}</span>
          </label>
        ))}
      </div>
      <p className="ds-inline-status" role="status">{anyChecked ? "" : tc("selectionError")}</p>
    </DemoPanel></Section>

    <Section title={tc("radioGroup")}><DemoPanel>
      <RadioGroup value={condition} onValueChange={setCondition} aria-label={tc("chooseCondition")}>
        {conditions.map((key) => (
          <label className="troc-choice" key={key}>
            <RadioGroupItem value={key} id={`radio-${key}`} aria-label={tc(key)} />
            <span className="troc-choice-label">{tc(key)}</span>
          </label>
        ))}
      </RadioGroup>
      <p className="ds-helper" style={{ marginTop: 12 }}>{tc("keyboardHint")}</p>
    </DemoPanel></Section>

    <Section title={tc("switch")}><DemoPanel>
      <label className="troc-choice">
        <Switch checked={emails} onCheckedChange={setEmails} aria-label={tc("emailUpdates")} />
        <span className="troc-choice-label">{tc("emailUpdates")}<span className="troc-choice-label-hint">{tc("emailUpdatesHint")}</span></span>
      </label>
      <label className="troc-choice">
        <Switch checked={foils} onCheckedChange={setFoils} aria-label={tc("showFoil")} />
        <span className="troc-choice-label">{tc("showFoil")}</span>
      </label>
      <p className="ds-inline-status" role="status">{emails ? tc("checked") : tc("unchecked")}</p>
    </DemoPanel></Section>

    <Section title={tc("states")}><DemoPanel><div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
      <label className="troc-choice"><Checkbox defaultChecked aria-label={tc("checked")} /><span className="troc-choice-label">{tc("checked")}</span></label>
      <label className="troc-choice" data-preview="focus"><Checkbox aria-label={tc("focus")} /><span className="troc-choice-label">{tc("focus")}</span></label>
      <label className="troc-choice" data-disabled="true"><Checkbox disabled aria-label={tc("disabled")} /><span className="troc-choice-label">{tc("disabled")}</span></label>
      <label className="troc-choice" data-invalid="true"><Checkbox aria-label={tc("error")} aria-invalid="true" /><span className="troc-choice-label">{tc("error")}</span></label>
      <label className="troc-choice"><Switch defaultChecked aria-label={tc("checked")} /><span className="troc-choice-label">{tc("checked")}</span></label>
      <label className="troc-choice" data-disabled="true"><Switch disabled defaultChecked aria-label={tc("disabled")} /><span className="troc-choice-label">{tc("disabled")}</span></label>
    </div></DemoPanel></Section>

    <Guidelines items={[{ kind: "do", text: tc("selectionDo") }, { kind: "dont", text: tc("selectionDont") }]} />
  </>;
}
