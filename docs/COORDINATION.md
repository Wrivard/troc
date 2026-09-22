# TROC concurrent task coordination

Updated 2026-09-22.

## Ownership and workspaces

- **Milestone 3.5 / task 01a0c994-3aa1-7700-9d47-040948c4bdfa:** works in `Troc-Milestone-3-5/`, an isolated Git worktree based on `9b45877`. Owns inventory schema/domain/API/imports/tests/docs and new seller inventory functionality. Stop before Milestone 4.
- **Design / task 01a0c68d-0c6c-7141-b324-bb4a6f618553:** uses `Troc-Brand-System/`. Owns existing-page design, CSS, style-guide components and visual assets. Its initial pass is complete; the user subsequently authorized another meticulous design pass, which is active. It has acknowledged the split and will send its verified final commit before milestone integration.

## Integration rules

- Communicate before changing shared routing, shared types/translations, package/lock files, implementation status or deployment configuration.
- Each task stages only its own changes. Preserve unrelated edits and never force-push.
- Separate worktrees prevent file overwrites, but shared database changes and main deployments still need coordination. Use local test databases for development.
- Design task deploys its newly authorized pass first. Milestone task then coordinates integration and deployment after tests/builds and relevant browser checks pass against the combined changes. Both tasks have agreed to serialize main pushes.
- Check current task status before integration; this record can become stale. Record file/contract changes and communicate them directly when another task is active.

## Confirmed baseline

Design implementation `1d14f16` and evidence commit `9b45877` were reported deployed and verified by the design task. Details: `Troc-Brand-System/docs/WORLD_CLASS_DESIGN_REFINEMENT.md`.
