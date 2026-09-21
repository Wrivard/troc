import { useState } from "react";
import { Combobox } from "../../components/ui/combobox";
import { usePreferences } from "../../hooks/use-preferences";
import { DemoPanel, Field, games, Guidelines, PageHeader, Section } from "../parts";

export default function ComboboxDemo() {
  const { t } = usePreferences();
  const [selected, setSelected] = useState("");
  const shared = { options: games, label: t("game"), placeholder: t("findGame"), toggleLabel: t("toggleOptions"), emptyLabel: t("emptyOptions"), loadingLabel: t("loadingOptions") };
  return <>
    <PageHeader eyebrow={t("forms")} title={t("comboboxes")} description={t("comboIntro")} />
    <Section title={t("default")}><DemoPanel>
      <Field id="combo-demo" label={t("game")} helper={t("gameHelper")}><Combobox {...shared} id="combo-demo" value={selected} onValueChange={setSelected} describedBy="combo-demo-hint" /></Field>
      <p className="ds-inline-status" role="status">{selected ? `${t("selected")}: ${games.find((game) => game.value === selected)?.label}` : t("previewOnly")}</p>
    </DemoPanel></Section>
    <Section title={t("states")}><DemoPanel><div className="ds-form-grid">
      <Field id="combo-filled" label={t("filled")}><Combobox {...shared} id="combo-filled" defaultValue="magic" /></Field>
      <Field id="combo-disabled" label={t("disabled")}><Combobox {...shared} id="combo-disabled" defaultValue="pokemon" disabled /></Field>
      <Field id="combo-error" label={t("error")} error={t("gameError")}><Combobox {...shared} id="combo-error" invalid describedBy="combo-error-hint" /></Field>
      <Field id="combo-loading" label={t("loading")}><Combobox {...shared} id="combo-loading" loading /></Field>
    </div></DemoPanel></Section>
    <Section title={t("keyboard")}><DemoPanel><p className="ds-helper">{t("comboKeyboard")}</p></DemoPanel></Section>
    <Guidelines items={[{ kind: "do", text: t("formDo") }, { kind: "dont", text: t("formDont") }]} />
  </>;
}