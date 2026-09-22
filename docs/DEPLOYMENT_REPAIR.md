# Deployment repair — 2026-09-21

The original 751d4d1 deployment had no packageManager pin. Vercel selected pnpm 10,
which reads the overrides in pnpm-workspace.yaml. The lockfile had been generated
with pnpm 9 and contained no overrides section. Reproduced the exact
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH with pnpm 10.34.5 before changing the lockfile.
The old pnpm 9 frozen check passed because it did not apply those workspace settings.

The 49a00f0 pin to pnpm 9 fixed installation but did not enforce the intended
workspace overrides. Its Vercel build subsequently failed because the project root
was artifacts/api-server, with the Express framework preset, instead of the repository
root. The frontend built successfully but Vercel searched the wrong output directory.

Fix:
- Pin pnpm 10.34.5, the registry's current pnpm 10 release at diagnosis. This supports
  the workspace overrides, onlyBuiltDependencies and minimumReleaseAge settings.
- Regenerate the lockfile with that exact version. Retain all overrides, including
  esbuild 0.28.2, js-yaml 4.3.2, and the esm-loader-to-tsx substitution. The lockfile
  now records the overrides and excludes the old transitive versions and intentionally
  excluded platform packages. No security override was removed.
- Use Corepack in Vercel install/build commands to honor packageManager even when
  the launching machine's global pnpm is older. Keep --frozen-lockfile.
- Replace the shell-specific preinstall with a Node version guard; it no longer
  deletes unrelated lockfiles and works on Windows and Linux.
- Correct existing Vercel project troc-api-server to repository root / Vite and clear
  dashboard install/build/output overrides so committed vercel.json is authoritative.

Validation: two independent clean source snapshots, each initially without
node_modules, passed pnpm install --frozen-lockfile and pnpm install
--frozen-lockfile --ignore-scripts respectively (pnpm 10.34.5). The scripts-enabled
snapshot passed workspace typecheck, lint, all 36 tests and full pnpm build with
PORT=5173 and BASE_PATH=/ for the existing preview projects.

Use corepack pnpm locally if the globally installed pnpm is not 10.34.5.
The Milestone 2 audit must not start until the pushed deployment is Ready.

Vercel also installs dependencies while tracing the server function. Enabled
ENABLE_EXPERIMENTAL_COREPACK=1 in all existing project environments so this internal
step uses the same pin. Local Vercel validation uses an isolated Corepack shim on PATH
without modifying the globally installed pnpm.
Local Windows CLI note: Vercel produced a child environment with both Path and PATH,
causing spawn cmd.exe ENOENT. Launching the unmodified CLI with a single uppercase
PATH entry resolves that host issue; this does not change the production application.

Vercel also exposed its NodeNext TypeScript recompilation incompatibility with the
workspace bundler configuration. The existing esbuild build now emits a dedicated
serverless.cjs app bundle, loaded by api/index.js. Both local vercel build and the
production serverless SSR/API smoke test pass.
