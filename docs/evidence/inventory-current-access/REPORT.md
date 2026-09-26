# Inventory authority evidence

## Inventory authority prerequisite fixed - September25

While preparing UP01attachment authorization, reproduced an existing service-level gap: a previously authorized Principal retained inventory access after its database membership was removed. New adversarial test failed before fix (missing rejection). InventoryService.access now rechecks active user and current owner/manager/inventory membership or current database admin role. For transactional mutations this occurs after the seller lock, shared with team edits. Coarse Principal permission check remains; no new permission granted from client data.

18inventory tests pass, including stale membership removal, downgrade to customer_service, stale admin role and suspended user; denied writes leave inventory version unchanged. Existing stock/reservation/sale/import/export guards pass. Types, lint and APIbuild pass. Logs .local/inventory-access-before.log and inventory-access-after.log retain red/green evidence. Owned localAPI3772replaced by37280; readiness confirmed, actual seller login200/inventory200/foreign-scope403 smoke passes. No persistent team/account/stock changes or migration. Native concurrent suspension timing is not certified.

This prerequisite took priority over new quarantine code. UP01quarantine/attachment orchestration remains NOT implemented. Next: use fresh database authority for staging and attachment; add immutable object hash/owner/listing binding, expiry/replay/scanner-failure tests with fake storage, then bounded request orchestration before routes/UI.146original IDs preserved; existing remote/hosted/source/money holds unchanged.

