# Consuming TROC Design System in web apps

Read `artifacts/troc-design-system/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/troc-design-system/docs/migrating-web.md` before writing UI.

## Workspace dependency

Add the package to the consuming web app's `dependencies`:

```json
{
  "dependencies": {
    "@workspace/troc-design-system": "workspace:*"
  }
}
```

Run the workspace install after editing the manifest. Do not copy package
source, tokens, fonts, or assets into the app.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/troc-design-system/styles.css";
```

`styles.css` already imports Tailwind, its plugins, the generated token theme,
the bundled font, and all reusable family styles. It also registers this
package's component sources. Do not add a second Tailwind import or a
`node_modules` source path in a Tailwind v4 consumer. This generated CSS input
targets Tailwind v4; upgrade a Tailwind v3 app before adopting it rather than
mixing v3 directives with this stylesheet.

Do not import `styles.css` again from a component or route.

## Components and helpers

The package ships one web module for each family in the
[46-family inventory](references/component-inventory.md). Import a family from
its exact `components/ui/<family>` path; there is no component barrel:

```tsx
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { PriceBlock } from "@workspace/troc-design-system/components/ui/price";
import {
  CardImage,
  CardMetadata,
  CardTitle,
  ProductCard,
} from "@workspace/troc-design-system/components/ui/product-presentation";
import { cn } from "@workspace/troc-design-system/lib/utils";

export function CardExample({ imageUrl }: { imageUrl: string }) {
  return (
    <ProductCard
      image={
        <CardImage
          src={imageUrl}
          alt="Pikachu, Scarlet & Violet—151"
          missingLabel="Image unavailable"
        />
      }
      title={<CardTitle>Pikachu</CardTitle>}
      metadata={<CardMetadata items={["Scarlet & Violet—151", "173/165"]} />}
      price={<PriceBlock amount={2.1} locale="en" label="Lowest available" />}
      actions={<Button size="sm">View offers</Button>}
    />
  );
}
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

The family records list the exact runtime exports, dependencies, and required
translated labels. `Card` is not a standalone export: product tile/row
presentation is provided by `product-presentation`. Static style-guide card art
is not a product-data source; consumers pass their own image URL to `CardImage`.

For toasts, mount both state and visual providers:

```tsx
import {
  ToastControllerProvider,
  Toaster,
  useToast,
} from "@workspace/troc-design-system/components/ui/toast";

function SaveButton() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast({ title: "Saved" })}>
      Save
    </button>
  );
}

export function ToastExample() {
  return (
    <ToastControllerProvider>
      <SaveButton />
      <Toaster closeLabel="Close notification" />
    </ToastControllerProvider>
  );
}
```

Supply visible and accessibility copy through the app's i18n layer. In
particular, Dialog, Drawer, and Toaster close labels and removable Chip labels
are translated caller contracts.

## Preferences and messages

The optional preference hook provides persistent TROC Dark/TROC Light and
English/French preferences. TROC Dark is the default. A saved language wins;
otherwise the initial locale follows the browser (`fr*` selects French and all
other values select English). Explicit user choices persist locally.

```tsx
import {
  PreferencesProvider,
  usePreferences,
} from "@workspace/troc-design-system/hooks/use-preferences";
import {
  messages,
  type Locale,
  type MessageKey,
} from "@workspace/troc-design-system/lib/messages";
```

Wrap the app in `PreferencesProvider` only when it calls `usePreferences`.
`usePreferences` returns `theme`, `setTheme`, `locale`, `setLocale`, `t`, and
locale-aware CAD `formatPrice`. The `messages` object is keyed by `MessageKey`
and stores English/French pairs; `Locale` is `"en" | "fr"`.

Components do not require `PreferencesProvider`; only `usePreferences` and the
package message hooks do. Components accept visible/accessibility labels as
props or children. Applications may supply those labels from
`usePreferences().t`, their own i18n system, or other translated content.

Additional bilingual demo-copy modules are public under exact paths such as
`lib/messages-navigation`, `lib/messages-overlays`,
`lib/messages-market-cards`, `lib/messages-market-economics`,
`lib/messages-seller-foundations`, `lib/messages-cart`,
`lib/messages-controls`, `lib/messages-feedback`, and
`lib/messages-data`, and `lib/messages-examples`. They are optional style-guide
copy helpers, not a requirement for using a component.

## Verify

After wiring the workspace dependency, import and render
`@workspace/troc-design-system/components/ui/button`. Run the app's typecheck
and dev server. The import must resolve and the Button must use this package's
theme before broader UI work begins.

## Ongoing rules

- Keep one source of theme variables.
- Import `styles.css` exactly once.
- Import package-provided primitives and helpers from the package path.
- Add reusable product-agnostic components to this package first.
- For a non-shadcn app, use the tokens as the source of truth and adapt existing
  components to the token CSS variables without copying token values.
