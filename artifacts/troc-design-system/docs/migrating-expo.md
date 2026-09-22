# Migrating Expo UI to TROC Design System

Read `artifacts/troc-design-system/docs/AGENTS.md` and
`artifacts/troc-design-system/docs/consuming-expo.md` first. Use this guide
when an Expo app, including a fresh scaffold, has local theme, hooks, fonts, or
product-agnostic component implementations.

> **Token-only today:** the package ships portable tokens plus 46 web/DOM
> families. It does not ship native components, native theme helpers, or native
> font hooks. Do not import `components/ui/*` into Expo or delete native
> implementations until exact native replacements exist.

## Rewrite theme and font imports

The steps in this section are the future migration plan, not a statement that
the listed exports are currently available.

Apps may replace duplicated literal colors with values imported from
`@workspace/troc-design-system/tokens` now, while preserving their existing
native theme API. When native exports ship, grep the Expo artifact for hooks,
`useFonts` calls, and direct font imports. Read every matching scaffold and app
file before changing it. Rewrite only to exact paths announced by that approved
native chunk, preserve SplashScreen gating, and delete local files only after
every caller resolves to a shipped replacement.

## Replace product-agnostic UI

Inventory inline and app-local styled controls before migrating screens.

- Once corresponding native exports ship, replace product-agnostic Buttons,
  typography, Inputs, Textareas, Fields,
  Cards, Badges, Toggles, Empty states, Spinners, and Skeletons with package
  native components.
- Keep domain-specific compositions local, but rewrite their internals to
  compose package primitives.
- Delete app-local product-agnostic components after all imports are rewritten.
- Do not import web `components/ui/*`, `styles.css`, or DOM/Tailwind code into
  React Native.

## Clean dependencies and verify

- Once native exports ship, keep the design-system workspace package and its
  announced native peer dependencies in Expo `dependencies`.
- Remove dependencies only after shipped replacements make them unused.
- Grep for old local import paths and resolve every migrated hit.
- Verify the shipped native theme, fonts, and one package primitive before
  presenting the app.

Until native exports ship, only token consolidation is possible. Afterwards,
migration is complete when Expo imports each authorized
shared primitive, theme, and hook from its documented path and retains only
product-specific UI compositions locally.
