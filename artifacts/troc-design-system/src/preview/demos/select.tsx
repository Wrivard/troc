import { useState } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "../../components/ui/select";
import { usePreferences } from "../../hooks/use-preferences";
import { DemoPanel, Field, games, Guidelines, PageHeader, Section } from "../parts";

export default function SelectDemo() {
  const { t } = usePreferences();
  const [selected, setSelected] = useState("");
  const control = (id: string, props: { disabled?: boolean; invalid?: boolean; filled?: boolean; focus?: boolean } = {}) =>
    <Select disabled={props.disabled} defaultValue={props.filled ? "magic" : undefined}>
      <SelectTrigger id={id} aria-invalid={props.invalid || undefined} aria-describedby={props.invalid ? `${id}-hint` : undefined} data-preview={props.focus ? "focus" : undefined}><SelectValue placeholder={t("chooseGame")} /></SelectTrigger>
      <SelectContent><SelectGroup><SelectLabel>{t("game")}</SelectLabel>{games.map((game) => <SelectItem key={game.value} value={game.value}>{game.label}</SelectItem>)}</SelectGroup></SelectContent>
    </Select>;
  return <>
    <PageHeader eyebrow={t("forms")} title={t("selects")} description={t("selectIntro")} />
    <Section title={t("default")}><DemoPanel><div className="ds-form-grid">
      <Field id="select-demo" label={t("game")} helper={t("gameHelper")}>
        <Select value={selected} onValueChange={setSelected}><SelectTrigger id="select-demo" aria-describedby="select-demo-hint"><SelectValue placeholder={t("chooseGame")} /></SelectTrigger>
          <SelectContent><SelectGroup><SelectLabel>{t("game")}</SelectLabel>{games.slice(0, 3).map((game) => <SelectItem key={game.value} value={game.value}>{game.label}</SelectItem>)}
            <SelectSeparator />{games.slice(3).map((game) => <SelectItem key={game.value} value={game.value}>{game.label}</SelectItem>)}</SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field id="select-condition" label={t("condition")}><Select defaultValue="NM"><SelectTrigger id="select-condition"><SelectValue placeholder={t("chooseCondition")} /></SelectTrigger><SelectContent>
        {(["nearMint", "lightlyPlayed", "moderatelyPlayed", "heavilyPlayed", "damaged"] as const).map((key, index) => <SelectItem key={key} value={["NM", "LP", "MP", "HP", "DMG"][index]}>{t(key)}</SelectItem>)}
      </SelectContent></Select></Field>
    </div><p className="ds-inline-status" role="status">{selected ? `${t("selected")}: ${games.find((game) => game.value === selected)?.label}` : t("keyboardHint")}</p></DemoPanel></Section>
    <Section title={t("states")}><DemoPanel><div className="ds-form-grid">
      <Field id="select-focus" label={t("focus")}>{control("select-focus", { focus: true })}</Field>
      <Field id="select-filled" label={t("filled")}>{control("select-filled", { filled: true })}</Field>
      <Field id="select-error" label={t("error")} error={t("gameError")}>{control("select-error", { invalid: true })}</Field>
      <Field id="select-disabled" label={t("disabled")}>{control("select-disabled", { disabled: true, filled: true })}</Field>
    </div></DemoPanel></Section>
    <Guidelines items={[{ kind: "do", text: t("formDo") }, { kind: "dont", text: t("formDont") }]} />
  </>;
}