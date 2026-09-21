# Migrating web UI to TROC Design System

Read `artifacts/troc-design-system/docs/AGENTS.md` and
`artifacts/troc-design-system/docs/consuming-web.md` first. Use this guide
when a web app, including a fresh scaffold, already has local theme or component
copies.

## Replace the local theme

Replace the app's Tailwind/theme setup with the package import from the web
consumption guide.

- Remove the app's own `@import "tailwindcss"`, plugin imports, and generated
  `:root` / `.dark` token definitions.
- Keep app-specific CSS that is not a theme or package-provided primitive.
- Keep Tailwind v3 directives and configure its package component source as
  described in the web consumption guide.

## Rewrite imports

Only Button, Input, Textarea, Select, and Combobox are currently shipped web
component families. Rewrite local imports only for those five modules:

- `@/components/ui/<name>` →
  `@workspace/troc-design-system/components/ui/<name>`
- `@/lib/utils` (`cn`) → `@workspace/troc-design-system/lib/utils`
- Local preference logic, when intentionally replaced, →
  `@workspace/troc-design-system/hooks/use-preferences`

Judge component ownership by the imported module, not by the file doing the
import. App-specific components may remain local, but they must import shared
primitives from this package.

Do not rewrite Card, Tooltip, Toast/Toaster, `useToast`, or any other
inventory-only family to this package: those exports are not shipped yet.

## Delete superseded files

- Delete package-provided files from the app's `src/components/ui/`; remove the
  directory if it becomes empty.
- Delete local `src/lib/utils.ts` when it only provided `cn`.
- Remove dependencies used only by the deleted local component library when the
  design-system package already supplies them transitively.

## Verify migration

Grep for pilot `@/components/ui/` imports and `@/lib/utils`. Every
remaining match must refer to an app-specific module or export the package does
not provide. Run typecheck and the dev server after deleting local copies.

Migration is complete when no shipped pilot component, `cn`, preference hook,
or theme token block remains duplicated locally. Keep local implementations for
families the package has not shipped.
