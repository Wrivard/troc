import { lazy, type ComponentType } from "react";
import type { MessageKey } from "../lib/messages";
import { OverviewPage } from "./foundations";

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
  { title: "actions", entries: [{ id: "buttons", title: "buttons", component: lazy(() => import("./demos/button")), number: "05" }] },
  { title: "forms", entries: [
    { id: "inputs", title: "inputs", component: lazy(() => import("./demos/input")), number: "06" },
    { id: "textareas", title: "textareas", component: lazy(() => import("./demos/textarea")), number: "07" },
    { id: "selects", title: "selects", component: lazy(() => import("./demos/select")), number: "08" },
    { id: "comboboxes", title: "comboboxes", component: lazy(() => import("./demos/combobox")), number: "09" },
  ] },
  { title: "content", entries: [
    { id: "voice", title: "voice", component: lazy(() => import("./pages/guidance").then((m) => ({ default: m.VoicePage }))), number: "10" },
    { id: "accessibility", title: "accessibility", component: lazy(() => import("./pages/guidance").then((m) => ({ default: m.AccessibilityPage }))), number: "11" },
    { id: "mobile", title: "mobile", component: lazy(() => import("./pages/mobile")), number: "12" },
  ] },
];
export const ALL_ENTRIES = [OVERVIEW_ENTRY, ...NAV_GROUPS.flatMap((group) => group.entries)];
if (new Set(ALL_ENTRIES.map((entry) => entry.id)).size !== ALL_ENTRIES.length) throw new Error("Duplicate design-system page IDs.");