import { lazy, type ComponentType } from "react";
import type { MessageKey } from "../lib/messages";
import { OverviewPage } from "./foundations";
import { AVAILABLE_GROUPS, STORY_LOADERS } from "./catalog";

export type PreviewEntry = { id: string; title: MessageKey; component: ComponentType; number: string };
export type NavGroup = { title: MessageKey; entries: PreviewEntry[] };
export const DESIGN_SYSTEM = {
  title: "TROC Design System",
  description: "The visual foundation for Canada’s trading card marketplace.",
};
export const OVERVIEW_ENTRY: PreviewEntry = { id: "overview", title: "overview", component: OverviewPage, number: "00" };
export const NAV_GROUPS: NavGroup[] = [
  { title: "brand", entries: [{ id: "brand", title: "identity", component: lazy(() => import("./pages/brand")), number: "01" }] },
  { title: "colours", entries: [{ id: "colours", title: "palette", component: lazy(() => import("./pages/colours")), number: "02" }] },
  { title: "fonts", entries: [{ id: "typography", title: "typeScale", component: lazy(() => import("./pages/typography")), number: "03" }] },
  { title: "layout", entries: [{ id: "layout", title: "spacing", component: lazy(() => import("./pages/layout")), number: "04" }] },
  ...AVAILABLE_GROUPS.map((group) => ({ title: group.title, entries: group.families.map((family) => ({
    id: family.id ?? family.slug, title: family.title,
    component: lazy(STORY_LOADERS[`./demos/${family.slug}.tsx`]), number: "",
  })) })),
  { title: "content", entries: [
    { id: "voice", title: "voice", component: lazy(() => import("./pages/guidance").then((m) => ({ default: m.VoicePage }))), number: "10" },
    { id: "accessibility", title: "accessibility", component: lazy(() => import("./pages/guidance").then((m) => ({ default: m.AccessibilityPage }))), number: "11" },
    { id: "mobile", title: "mobile", component: lazy(() => import("./pages/mobile")), number: "12" },
    { id: "applied", title: "applied", component: lazy(() => import("./pages/applied")), number: "" },
  ] },
];
NAV_GROUPS.flatMap((group) => group.entries).forEach((entry, index) => { entry.number = String(index + 1).padStart(2, "0"); });
export const ALL_ENTRIES = [OVERVIEW_ENTRY, ...NAV_GROUPS.flatMap((group) => group.entries)];
if (new Set(ALL_ENTRIES.map((entry) => entry.id)).size !== ALL_ENTRIES.length) throw new Error("Duplicate design-system page IDs.");