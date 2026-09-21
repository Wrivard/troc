import { useState } from "react";
import { Eye, EyeOff, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { usePreferences } from "../../hooks/use-preferences";
import { DemoPanel, Field, Guidelines, PageHeader, Section } from "../parts";

const demoCards = ["Pikachu · 025/198", "Charizard ex · 199/165", "Lightning Bolt · M11", "Monkey D. Luffy · OP05-119", "Blue-Eyes White Dragon · LOB"];
export default function InputDemo() {
  const { t } = usePreferences();
  const [search, setSearch] = useState("");
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [result, setResult] = useState<"valid" | "invalid" | null>(null);
  const matches = demoCards.filter((card) => card.toLowerCase().includes(search.toLowerCase()));
  return <>
    <PageHeader eyebrow={t("forms")} title={t("inputs")} description={t("inputIntro")} />
    <Section title={t("variants")}><DemoPanel><div className="ds-form-grid">
      <Field id="input-normal" label={t("textInput")} helper={t("helper")}><Input id="input-normal" placeholder={t("namePlaceholder")} aria-describedby="input-normal-hint" /></Field>
      <Field id="input-password" label={t("password")}><div className="ds-input-action"><Input id="input-password" type={show ? "text" : "password"} autoComplete="off" placeholder="••••••••••••" /><Button variant="ghost" size="icon" aria-label={show ? t("hidePassword") : t("showPassword")} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></div></Field>
    </div></DemoPanel></Section>
    <Section title={t("searchInput")}><DemoPanel>
      <Field id="input-search" label={t("searchInput")}><div className="ds-input-icon"><Search size={16} aria-hidden="true" /><Input id="input-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchCards")} aria-controls="input-search-results" /></div></Field>
      <div id="input-search-results" aria-live="polite"><p className="ds-helper" style={{ marginTop: 18 }}>{matches.length ? t("searchResult") : t("noResults")}</p><ul className="ds-results">{matches.map((card) => <li key={card}>{card}</li>)}</ul></div>
      <p className="ds-helper" style={{ marginTop: 16 }}>{t("demoOnly")}</p>
    </DemoPanel></Section>
    <Section title={t("states")}><DemoPanel><div className="ds-form-grid">
      <Field id="input-focus" label={t("focus")}><Input id="input-focus" data-preview="focus" placeholder={t("namePlaceholder")} /></Field>
      <Field id="input-filled" label={t("filled")}><Input id="input-filled" defaultValue={t("starterCollection")} /></Field>
      <Field id="input-error" label={t("error")} error={t("requiredName")}><Input id="input-error" aria-invalid="true" aria-describedby="input-error-hint" placeholder={t("namePlaceholder")} /></Field>
      <Field id="input-disabled" label={t("disabled")}><Input id="input-disabled" disabled placeholder={t("namePlaceholder")} /></Field>
    </div></DemoPanel></Section>
    <Section title={t("tryValidation")}><DemoPanel><form noValidate onSubmit={(event) => { event.preventDefault(); setResult(name.trim().length >= 3 ? "valid" : "invalid"); }}>
      <Field id="input-validation" label={t("name")} error={result === "invalid" ? t("invalidName") : undefined} helper={t("helper")}>
        <Input id="input-validation" required value={name} onChange={(event) => { setName(event.target.value); setResult(null); }} aria-invalid={result === "invalid"} aria-describedby="input-validation-hint" placeholder={t("namePlaceholder")} />
      </Field><Button type="submit" style={{ marginTop: 18 }}>{t("validate")}</Button><p className="ds-inline-status" role="status">{result === "valid" ? t("validationOkay") : ""}</p>
    </form></DemoPanel></Section>
    <Guidelines items={[{ kind: "do", text: t("formDo") }, { kind: "dont", text: t("formDont") }]} />
  </>;
}