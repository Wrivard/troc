# Team directory recovery

Reproduced empty directory leaving Team permanently loading: browser assertion for no-active-store state failed before fix. Team now uses shared OperationsState for loading/error/empty directory and keys existing content by seller UUID to reset local page/modal/form state on seller changes. No permissions or member writes changed.

check-team-directory.cjs passes EN1440/FR390: directory503, retry returns empty directory, explicit empty state/no skeleton, zero team reads without seller, then real local member list and modal open/Escape-close. No membership POST. FR screenshot inspected. Typecheck/scoped lint passed.

Seller-key remount established in source; direct browser switch matrix remains unverified because Team shell currently has no store selector. Do not treat this as broad tenant-isolation certification. Existing server authority remains essential.

Next independent task: private in-app invitation service per docs/SELLER-TEAM-INVITATIONS-CONTRACT.md. No email dispatch or production changes authorized.

Client+SSR builds passed (.local/team-directory-build.log).
