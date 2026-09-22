import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { usePreferences } from "../../hooks/use-preferences";
import { useOverlaysMessages } from "../../lib/messages-overlays";
import { DemoPanel, Field, Guidelines, PageHeader, Section } from "../parts";

export default function PopoverDemo() {
  usePreferences();
  const { to } = useOverlaysMessages();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("120");
  const [saved, setSaved] = useState<string | null>(null);

  const save = () => {
    setSaved(value);
    setOpen(false);
  };

  return (
    <>
      <PageHeader eyebrow={to("overlaysEyebrow")} title={to("popoverTitle")} description={to("popoverIntro")} />

      <Section title={to("popoverBasic")}>
        <DemoPanel>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">{to("popoverTrigger")}</Button>
            </PopoverTrigger>
            <PopoverContent>
              <h3 className="ds-small-heading" style={{ marginTop: 0 }}>{to("popoverHeading")}</h3>
              <p className="ds-helper" style={{ margin: 0 }}>{to("popoverBody")}</p>
            </PopoverContent>
          </Popover>
        </DemoPanel>
      </Section>

      <Section title={to("popoverForm")}>
        <DemoPanel>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button>{to("popoverFormTrigger")}</Button>
              </PopoverTrigger>
              <PopoverContent>
                <h3 className="ds-small-heading" style={{ marginTop: 0 }}>{to("popoverFormHeading")}</h3>
                <Field id="popover-price" label={to("popoverFormLabel")} helper={to("popoverFormHelper")}>
                  <Input
                    id="popover-price"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </Field>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>{to("cancel")}</Button>
                  <Button size="sm" onClick={save}>{to("popoverFormSave")}</Button>
                </div>
              </PopoverContent>
            </Popover>
            {saved && <p className="ds-inline-status" role="status" style={{ margin: 0 }}>{to("popoverSaved", { value: saved })}</p>}
          </div>
          <p className="ds-helper" style={{ marginTop: 16 }}>{to("demoOnly")}</p>
        </DemoPanel>
      </Section>

      <Guidelines items={[{ kind: "do", text: to("popoverDo") }, { kind: "dont", text: to("popoverDont") }]} />
    </>
  );
}
