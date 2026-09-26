# TRO-5 CI pilot

This candidate adds `.github/workflows/ci.yml` and this runbook.
The integration also adds the pilot branch deployment exclusion and aligns
React development types after the first clean CI run exposed the existing
19.2.0/19.3.0 duplicate React type identity. Workspace overrides pin
`@types/react` and `@types/react-dom` to the existing 19.2.0 baseline; the lockfile
is regenerated with the declared pnpm 10.34.5. Runtime React stays unchanged.
Two standalone presentation harness entrypoints also imported unpublished local
`baseline/` copies. They now import the existing committed components directly,
so a clean checkout can typecheck without reconstructing private local files.
No application route or component implementation changes.

The broader first local validation also exposed existing lint failures in
standalone browser probes and two TypeScript test failures (catalog search
fixture contract and recovery snapshot table-count assertion). These are not
suppressed or excluded. This PR stays draft until all required checks pass;
successful typechecking/builds alone do not close the gate.
The workflow is named **CI**. It runs for pull requests targeting `main`, pushes
to `main`, and manual `workflow_dispatch` events, without path filters.

## Required check

The job ID is `checks`; its explicit check job name for branch protection is
**CI checks** (shown under workflow **CI**). Keep this name stable. Branch
protection configuration is outside this candidate and has not been changed.
No PR merge is authorized.

## Execution

One `ubuntu-latest` job has a 20-minute timeout. New runs cancel older runs for
the same workflow, event type, and ref. Token permissions are limited to
`contents: read`, and checkout does not persist credentials.

The workflow uses `actions/checkout@v6`, `actions/setup-node@v6`, and
`pnpm/action-setup@v4`, pinned to commit SHAs resolved from their upstream GitHub
tag references on 2026-09-26. These pins must be reviewed when updated.
Node.js is set to 24. The pnpm action reads the existing root `packageManager`
value, `pnpm@10.34.5`; automatic install and setup-node caching are disabled.

Commands run sequentially from the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm typecheck
pnpm lint
pnpm test
node --test tests/staging-concurrency.test.mjs
pnpm --filter @workspace/api-server build
pnpm --filter @workspace/marketplace build
```

The install flags match the existing deployment install policy. Root scripts
provide the existing workspace typecheck, ESLint, and `tsx --test tests/*.test.ts`
suite. The separate `.test.mjs` command covers the staging harness contracts
with test doubles; it does not execute a hosted staging exercise. The API build
invokes `node ./build.mjs`, producing the server and
serverless bundles. The marketplace build invokes
`vite build && vite build --ssr src/entry-server.tsx --outDir dist-server`, so both
the client production build and configured SSR build are required.

Failures stop the job; there are no suppressions or `continue-on-error` steps.
The workflow configures no secrets, database services, migrations, deployment,
or `pull_request_target` trigger. Existing tests may use local in-process test
fixtures; this workflow provisions no hosted database.

## Evidence and limits

- The original base checkout does not include other uncommitted work. CI checks
  the source selected by the event, not dirty work in another checkout.
- Local or CI success does not certify the hosted beta, hosted authentication,
  database readiness, browser journeys, or operational readiness.
- No commit, push, merge, deployment, or provider/account/model change is
  authorized by this candidate. Application failures must be reported without
  broadening this bounded implementation into application fixes.
- `vercel.json` sets `git.deploymentEnabled["codex/ralph-*"]` to false, using
  Vercel's documented minimatch branch policy. It prevents automatic Git
  deployments of pilot branches; other branches retain their existing default.
  Always retain this policy in the first published pilot-branch commit. The
  policy does not disable manual deployments, which remain unauthorized.
- Offline structural checks can validate the candidate's shape and commands.
  They cannot verify current upstream Action tag support or substitute for a
  GitHub Actions run. Network access and dependency installation are excluded
  from this implementation step.
