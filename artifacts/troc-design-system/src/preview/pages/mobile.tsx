import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Combobox } from "../../components/ui/combobox";
import { usePreferences } from "../../hooks/use-preferences";
import { BrandImage, Field, games, PageHeader } from "../parts";

export default function MobilePage() {
  const { t } = usePreferences();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"valid" | "invalid" | null>(null);
  return <>
    <PageHeader eyebrow={t("layout")} title={t("mobile")} description={t("mobileIntro")} />
    <div className="ds-phone-stage"><div className="ds-phone">
      <div className="ds-phone-top">9:41<span aria-hidden="true" />TROC</div>
      <div className="ds-phone-content"><BrandImage /><h2>{t("demoForm")}</h2><p>{t("demoFormIntro")}</p>
        <form onSubmit={(event) => { event.preventDefault(); setStatus(name.trim().length >= 3 ? "valid" : "invalid"); }} noValidate>
          <Field id="mobile-name" label={t("name")} error={status === "invalid" ? t("invalidName") : undefined}>
            <Input id="mobile-name" value={name} onChange={(event) => { setName(event.target.value); setStatus(null); }}
              placeholder={t("namePlaceholder")} required aria-invalid={status === "invalid"} aria-describedby={status === "invalid" ? "mobile-name-hint" : undefined} />
          </Field>
          <Field id="mobile-game" label={t("game")}><Combobox id="mobile-game" options={games} placeholder={t("findGame")} label={t("game")} toggleLabel={t("toggleOptions")} emptyLabel={t("emptyOptions")} loadingLabel={t("loadingOptions")} /></Field>
          <Field id="mobile-description" label={t("descriptionLabel")}><Textarea id="mobile-description" maxLength={240} placeholder={t("descriptionPlaceholder")} /></Field>
          <Button type="submit">{t("validate")}<ArrowRight size={16} /></Button>
          <p role="status" className="ds-helper">{status === "valid" ? t("validationOkay") : t("previewOnly")}</p>
        </form>
      </div>
    </div></div>
    <p className="ds-helper" style={{ textAlign: "center" }}>{t("mobileNote")}</p>
  </>;
}