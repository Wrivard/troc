import { ArrowRight, ArrowUpRight, Check, Search } from "lucide-react";
import { useState } from "react";
import { tokens } from "../generated/tokens";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Combobox } from "../components/ui/combobox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { usePreferences } from "../hooks/use-preferences";
import { BrandImage, Field, games, Section } from "./parts";
import type { MessageKey } from "../lib/messages";

export function OverviewPage() {
  const { t, formatPrice } = usePreferences();
  const [game, setGame] = useState("pokemon");
  const palette: { name: MessageKey; value: string; light?: boolean }[] = [
    { name: "brandRed", value: tokens.color.dark.accent },
    { name: "charcoal", value: tokens.color.dark.background },
    { name: "surface", value: tokens.color.dark.card },
    { name: "grey", value: tokens.color.dark.secondary },
    { name: "offWhite", value: tokens.color.dark.foreground, light: true },
  ];
  return <>
    <header className="ds-overview-header">
      <div><p className="ds-eyebrow">{t("foundations")}</p><h1>{t("overviewTitle")}</h1><p className="ds-lead">{t("overviewIntro")}</p></div>
      <div className="ds-overview-actions"><Button asChild><a href="#page=buttons">{t("explore")}<ArrowUpRight size={16} /></a></Button><a href="#page=brand" className="ds-text-link">{t("guidelines")}<ArrowRight size={14} /></a></div>
    </header>
    <section className="ds-identity-panel dark" aria-label={t("lockedIdentity")}>
      <div className="ds-identity-top"><span>{t("lockedIdentity")}</span><span>01 — TROC</span></div>
      <div className="ds-identity-main"><div><BrandImage variant="dark" /><p>{t("descriptor")}</p></div>
        <h2>{t("builtHere")}<br />{t("collectors")}<br className="ds-tagline-break" /> <em>{t("here")}</em></h2></div>
      <div className="ds-identity-bottom"><span>{t("collectTrade")}</span><span>CANADA · EN / FR</span></div>
    </section>
    <Section title={t("paletteTitle")} description={t("paletteIntro")} link={{ href: "#page=colours", label: t("allColours") }}>
      <div className="ds-palette-strip">{palette.map((colour) => <div className="ds-palette-item" key={colour.name}>
        <div className="ds-swatch" style={{ background: colour.value }}><span style={{ color: colour.light || colour.name === "brandRed" ? tokens.color.dark.background : tokens.color.dark.foreground }}>{colour.name === "brandRed" ? "01" : ""}</span></div>
        <div className="ds-swatch-caption"><strong>{t(colour.name)}</strong><code>{colour.value.toUpperCase()}</code></div>
      </div>)}</div>
    </Section>
    <Section title={t("primitivesTitle")} description={t("primitivesIntro")}>
      <div className="ds-pilot-grid">
        <div className="ds-pilot-item"><div className="ds-specimen-label"><span>01 / {t("buttons")}</span><a href="#page=buttons" aria-label={t("buttons")}><ArrowUpRight size={16} /></a></div>
          <div className="ds-flex-row"><Button asChild><a href="#page=buttons">{t("primaryAction")}<ArrowRight size={16} /></a></Button><Button variant="outline" asChild><a href="#page=buttons">{t("secondary")}</a></Button><Button size="icon" variant="ghost" aria-label={t("buttons")} asChild><a href="#page=buttons"><ArrowUpRight /></a></Button></div>
        </div>
        <div className="ds-pilot-item"><div className="ds-specimen-label"><span>02 / {t("inputs")}</span><a href="#page=inputs" aria-label={t("inputs")}><ArrowUpRight size={16} /></a></div>
          <Field id="overview-search" label={t("searchInput")}><div className="ds-input-icon"><Search size={16} aria-hidden="true" /><Input id="overview-search" type="search" placeholder={t("searchCards")} /></div></Field>
        </div>
        <div className="ds-pilot-item"><div className="ds-specimen-label"><span>03 / {t("textareas")}</span><a href="#page=textareas" aria-label={t("textareas")}><ArrowUpRight size={16} /></a></div>
          <Field id="overview-description" label={t("descriptionLabel")}><Textarea id="overview-description" placeholder={t("descriptionPlaceholder")} /></Field>
        </div>
        <div className="ds-pilot-item ds-pilot-dual"><div className="ds-specimen-label"><span>04 / {t("selects")}</span><a href="#page=selects" aria-label={t("selects")}><ArrowUpRight size={16} /></a></div>
          <Field id="overview-select" label={t("game")}><Select value={game} onValueChange={setGame}><SelectTrigger id="overview-select"><SelectValue placeholder={t("chooseGame")} /></SelectTrigger><SelectContent>{games.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></Field>
          <div className="ds-specimen-label"><span>05 / {t("comboboxes")}</span><a href="#page=comboboxes" aria-label={t("comboboxes")}><ArrowUpRight size={16} /></a></div>
          <Combobox id="overview-combo" options={games} label={t("game")} placeholder={t("findGame")} toggleLabel={t("toggleOptions")} emptyLabel={t("emptyOptions")} loadingLabel={t("loadingOptions")} />
        </div>
      </div>
    </Section>
    <section className="ds-type-preview">
      <div className="ds-aa">Aa<span>01—09</span></div>
      <div><p className="ds-eyebrow">PLUS JAKARTA SANS</p><h2>{t("typeIntro")}</h2><p>{t("typeBody")}</p><a className="ds-text-link" href="#page=typography">{t("viewType")}<ArrowUpRight size={14} /></a></div>
      <div className="ds-price-preview"><strong>{formatPrice(.06)}<small>CAD</small></strong><span>{t("nativePrice")}</span><span className="ds-helper">{t("demoOnly")}</span></div>
    </section>
    <aside className="ds-review-note"><Check size={18} aria-hidden="true" /><div><strong>{t("reviewLabel")}</strong><p>{t("reviewNote")}</p></div></aside>
  </>;
}