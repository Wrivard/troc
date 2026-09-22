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

All 46 inventory families ship as web modules. Rewrite a local import only when
the package family record lists the export your app uses:

- `@/components/ui/<name>` →
  `@workspace/troc-design-system/components/ui/<name>`
- `@/lib/utils` (`cn`) → `@workspace/troc-design-system/lib/utils`
- Local preference logic, when intentionally replaced, →
  `@workspace/troc-design-system/hooks/use-preferences`

Judge component ownership by the imported module, not by the file doing the
import. App-specific components may remain local, but they must import shared
primitives from this package.

There is no generic `Card` export. Migrate trading-card tile/row UI to
`components/ui/product-presentation`; keep unrelated application cards local.
Toast state uses `ToastControllerProvider`, `useToast`, and `Toaster` from
`components/ui/toast`. Do not infer export names: use each family record or the
source module.

## Delete superseded files

- Delete superseded package-provided files from the app's `src/components/ui/`;
  retain app/domain compositions and remove the directory only if it is empty.
- Delete local `src/lib/utils.ts` when it only provided `cn`.
- Remove dependencies used only by the deleted local component library when the
  design-system package already supplies them transitively.

## Verify migration

Grep for `@/components/ui/` imports, `@/lib/utils`, duplicate preference hooks,
and local theme variables. Every remaining component match must be app-specific
or intentionally differ from the package API. Run typecheck and the dev server
after deleting local copies.

Migration is complete when no package-provided primitive, `cn`, preference
hook, or theme token block remains duplicated locally. Keep product data,
routing, state, business logic, and domain compositions in the app.
