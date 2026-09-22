# Consuming TROC Design System in Expo apps

Read `artifacts/troc-design-system/docs/AGENTS.md` first. React Native does
not consume the web CSS, hooks, or DOM components. It can import portable
tokens; native theme/hooks and components require a separate future
implementation. If
the Expo app still contains scaffolded or existing local theme/hooks/components,
also read `artifacts/troc-design-system/docs/migrating-expo.md`.

> **Current availability:** all 46 component families are web-only under
> `components/ui/*`. No `components/native/*`, native theme, or native font
> hooks are shipped. The only supported Expo import is the portable token
> object shown below.

## Portable tokens

Import the generated, hex-based object:

```tsx
import { tokens } from "@workspace/troc-design-system/tokens";

export const nativeTheme = {
  dark: {
    background: tokens.color.dark.background,
    foreground: tokens.color.dark.foreground,
    primary: tokens.color.dark.primary,
  },
  light: {
    background: tokens.color.light.background,
    foreground: tokens.color.light.foreground,
    primary: tokens.color.light.primary,
  },
  spacing: Number.parseFloat(tokens.spacing) * 16,
  radius: Number.parseFloat(tokens.radius) * 16,
} as const;
```

The object also contains `semantic`, `foundation`, `typeScale`, and font-family
values. CSS lengths remain strings; convert them once at the native theme
boundary. Do not copy literal token values into the Expo app.

## Native theme and fonts

No native theme or font-loader export is available. A future native chunk
should add documented color/font hooks and return font loading/error state. Do
not guess import paths before those exports ship.

A future shared font hook must preserve the root layout's existing SplashScreen
gating around its font loading/error result.

## Native components

For a future native chunk, first inventory the app's visual building blocks,
then add only authorized product-agnostic families under
`src/components/native/`.

When `src/components/ui/` has a web counterpart, match its family exports, prop
names, variants, sizes, defaults, and state semantics wherever React Native
supports them. Implement with native primitives and document platform-required
differences in the base `AGENTS.md` inventory.

After native families ship, use only their announced package paths. Web-family
availability never implies a React Native implementation.

Keep product data, navigation, state, and domain compositions in Expo. Once
native primitives ship, app-owned compositions may use those approved exports.

## Dependencies and assets

When native package source imports `react-native`, Expo modules, or font
packages, declare compatible versions in this package's peer and development
dependencies and in the consuming Expo artifact's dependencies.

Metro resolves the workspace package through pnpm symlinks. Do not copy source
or token values. Loose binary assets may still need copying into Expo because
Metro does not watch sibling artifact folders by default.

Set `app.json`'s literal `splash.backgroundColor` from
`tokens.color.light.background` and keep it synchronized when that token changes.

## Verify

Do not migrate an Expo app to unshipped native exports. Once a native chunk is
approved and present, verify one announced native primitive, the native theme,
and font hook before broader screen work.
