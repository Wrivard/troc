# Consuming TROC Design System in Expo apps

Read `artifacts/troc-design-system/docs/AGENTS.md` first. React Native does
not consume the web CSS or DOM components. It can import portable tokens now;
native theme/hooks and components require a future approved implementation. If
the Expo app still contains scaffolded or existing local theme/hooks/components,
also read `artifacts/troc-design-system/docs/migrating-expo.md`.

> **Current availability:** the shipped pilot is web-only: Button, Input,
> Textarea, Select, and Combobox under `components/ui/*`. No
> `components/native/*`, native theme, or native font hooks are shipped yet.
> Everything below describes the future integration shape; do not use the
> example paths as available exports.

## Native theme and fonts

No native theme or font-loader export is currently available. A future approved
native chunk should build the shared light/dark palette, numeric radius and
spacing conversion, and registered typography names inside this package. It
should convert CSS lengths once from the portable token export:

```tsx
import { tokens } from "@workspace/troc-design-system/tokens";

const radius = tokens.radius.endsWith("rem")
  ? Number.parseFloat(tokens.radius) * 16
  : Number.parseFloat(tokens.radius);
```

That future chunk should add documented native color and font hooks and return
font loading/error state. Do not guess import paths before those exports ship.

A future shared font hook must preserve the root layout's existing SplashScreen
gating around its font loading/error result.

## Native components

For a future native chunk, first inventory the app's visual building blocks,
then add only approved product-agnostic families under
`src/components/native/`.

When `src/components/ui/` has a web counterpart, match its family exports, prop
names, variants, sizes, defaults, and state semantics wherever React Native
supports them. Implement with native primitives and document platform-required
differences in the base `AGENTS.md` inventory.

After native families ship, use only their announced package paths. Do not infer
availability from a family appearing in the reference inventory.

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
