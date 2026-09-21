# Consuming TROC Design System in web apps

Read `artifacts/troc-design-system/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/troc-design-system/docs/migrating-web.md` before writing UI.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/troc-design-system/styles.css";
```

`styles.css` already imports Tailwind, its plugins, and this package's token
theme. It also registers this package's component sources. Do not add a separate
Tailwind import or a `node_modules` source path in a Tailwind v4 consumer.
Tailwind v3 consumers keep their existing `@tailwind` directives and add
`node_modules/@workspace/troc-design-system/src/components` to `content`.

Do not import `styles.css` again from a component or route.

## Pilot components and helpers

Only five web families are currently shipped: Button, Input, Textarea, Select,
and Combobox. Import them from their `components/ui/*` paths:

```tsx
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/troc-design-system/components/ui/select";
import {
  Combobox,
  type ComboboxOption,
} from "@workspace/troc-design-system/components/ui/combobox";
import { cn } from "@workspace/troc-design-system/lib/utils";
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

Tooltip, Card, Toast/Toaster, `useToast`, and every other family in the future
inventory are not shipped exports yet. Do not import them from this package
until their inventory chunk is approved and implemented.

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

The five components do not require a provider. They accept visible and
accessible labels as props or children. Applications may supply those labels
from `usePreferences().t`, their own i18n system, or other translated content.

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
