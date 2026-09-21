import { useState } from "react";
import { Textarea } from "../../components/ui/textarea";
import { usePreferences } from "../../hooks/use-preferences";
import { DemoPanel, Field, Guidelines, PageHeader, Section } from "../parts";

export default function TextareaDemo() {
  const { t } = usePreferences();
  const [description, setDescription] = useState("");
  return <>
    <PageHeader eyebrow={t("forms")} title={t("textareas")} description={t("textareaIntro")} />
    <Section title={t("default")}><DemoPanel><Field id="textarea-demo" label={t("descriptionLabel")} helper={t("descriptionHelper")}>
      <Textarea id="textarea-demo" placeholder={t("descriptionPlaceholder")} value={description} onChange={(event) => setDescription(event.target.value)} maxLength={240} aria-describedby="textarea-demo-hint textarea-count" />
    </Field><p className="ds-helper ds-numbers" id="textarea-count" style={{ textAlign: "right", marginTop: 8 }}>{description.length} / 240 {t("characters")}</p></DemoPanel></Section>
    <Section title={t("states")}><DemoPanel><div className="ds-form-grid">
      <Field id="textarea-focus" label={t("focus")}><Textarea id="textarea-focus" data-preview="focus" placeholder={t("descriptionPlaceholder")} /></Field>
      <Field id="textarea-filled" label={t("filled")}><Textarea id="textarea-filled" defaultValue={t("descriptionDemo")} /></Field>
      <Field id="textarea-error" label={t("error")} error={t("descriptionError")}><Textarea id="textarea-error" aria-invalid="true" aria-describedby="textarea-error-hint" placeholder={t("descriptionPlaceholder")} /></Field>
      <Field id="textarea-disabled" label={t("disabled")}><Textarea id="textarea-disabled" disabled placeholder={t("descriptionPlaceholder")} /></Field>
    </div></DemoPanel></Section>
    <Guidelines items={[{ kind: "do", text: t("formDo") }, { kind: "dont", text: t("formDont") }]} />
  </>;
}