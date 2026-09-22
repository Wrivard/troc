import { ArrowUpRight } from "lucide-react";
import type { ComponentType } from "react";
import type { MessageKey } from "../lib/messages";
import { usePreferences } from "../hooks/use-preferences";
import { Section } from "./parts";

type Family = { slug: string; title: MessageKey; id?: string };
type FamilyGroup = { title: MessageKey; families: Family[] };

/** One catalog entry per normalized family. Only shipped stories are navigable. */
export const FAMILY_GROUPS: FamilyGroup[] = [
  { title: "actions", families: [
    { slug: "button", title: "buttons", id: "buttons" },
  ] },
  { title: "forms", families: [
    { slug: "input", title: "inputs", id: "inputs" },
    { slug: "textarea", title: "textareas", id: "textareas" },
    { slug: "select", title: "selects", id: "selects" },
    { slug: "combobox", title: "comboboxes", id: "comboboxes" },
    { slug: "selection-controls", title: "selectionControls" },
    { slug: "quantity-control", title: "quantityControl" },
    { slug: "chips", title: "chips" },
    { slug: "badge-status", title: "badgeStatus" },
  ] },
  { title: "navigationGroup", families: [
    { slug: "tabs", title: "tabs" },
    { slug: "breadcrumbs", title: "breadcrumbs" },
    { slug: "logo", title: "logoComponent" },
    { slug: "global-search", title: "globalSearch" },
    { slug: "site-navigation", title: "siteNavigation" },
    { slug: "locale-switcher", title: "localeSwitcher" },
    { slug: "theme-switcher", title: "themeSwitcher" },
    { slug: "pagination", title: "pagination" },
  ] },
  { title: "feedbackGroup", families: [
    { slug: "tooltip", title: "tooltip" },
    { slug: "popover", title: "popover" },
    { slug: "dropdown-menu", title: "dropdownMenu" },
    { slug: "dialog", title: "dialog" },
    { slug: "drawer", title: "drawer" },
    { slug: "toast", title: "toast" },
    { slug: "alert", title: "alert" },
    { slug: "skeleton", title: "skeleton" },
    { slug: "state-feedback", title: "stateFeedback" },
  ] },
  { title: "marketplaceGroup", families: [
    { slug: "product-presentation", title: "productPresentation" },
    { slug: "price", title: "price" },
    { slug: "marketplace-badges", title: "marketplaceBadges" },
    { slug: "seller-offer", title: "sellerOffer" },
    { slug: "seller-badges", title: "sellerBadges" },
    { slug: "promotion", title: "promotion" },
    { slug: "marketplace-progress", title: "marketplaceProgress" },
    { slug: "recently-sold", title: "recentlySold" },
    { slug: "notification-item", title: "notificationItem" },
    { slug: "collection-progress", title: "collectionProgress" },
  ] },
  { title: "sellerCartGroup", families: [
    { slug: "seller-storefront", title: "sellerStorefront" },
    { slug: "seller-reputation", title: "sellerReputation" },
    { slug: "cart-seller-group", title: "cartSellerGroup" },
    { slug: "order-totals", title: "orderTotals" },
    { slug: "smart-cart", title: "smartCart" },
  ] },
  { title: "dataGroup", families: [
    { slug: "data-table", title: "dataTable" },
    { slug: "metric-stat", title: "metricStat" },
    { slug: "progress", title: "progress" },
    { slug: "chart", title: "chart" },
    { slug: "data-controls", title: "dataControls" },
  ] },
];

export const STORY_LOADERS = import.meta.glob<{ default: ComponentType }>("./demos/*.tsx");
export const AVAILABLE_GROUPS = FAMILY_GROUPS.map((group) => ({
  ...group,
  families: group.families.filter((family) => Boolean(STORY_LOADERS[`./demos/${family.slug}.tsx`])),
})).filter((group) => group.families.length > 0);

export function ComponentDirectory() {
  const { t } = usePreferences();
  const count = AVAILABLE_GROUPS.reduce((sum, group) => sum + group.families.length, 0);
  return <div id="component-catalog">
    <Section title={t("catalogTitle")} description={`${count} ${t("catalogIntro")}`}>
      <div className="ds-component-directory">
        {AVAILABLE_GROUPS.map((group) => <section key={group.title} className="ds-directory-group">
          <h3>{t(group.title)}<span>{group.families.length.toString().padStart(2, "0")}</span></h3>
          <ul>{group.families.map((family) => <li key={family.slug}>
            <a href={`#page=${family.id ?? family.slug}`}>{t(family.title)}<ArrowUpRight size={14} aria-hidden="true" /></a>
          </li>)}</ul>
        </section>)}
      </div>
    </Section>
  </div>;
}