# Integration strategy

Status: **Planned** external adapters; **In development** generic inventory import.

TROC owns its canonical catalog and seller inventory contract. Existing inventory systems should eventually publish to TROC without sellers maintaining a second independent inventory. The 3.5 CSV mapping system preserves source identities without writing adapter-specific logic into canonical catalog records.

SortSwift, CardUploader, eBay, Shopify and TCGplayer exports are future compatibility targets, not confirmed partnerships or supported live connectors. Each real adapter needs provider authorization/terms review, explicit mapping tests, reliable stock semantics, credentials, failure visibility and reconciliation before it can be labeled Beta or Live. Document each separately when that work begins.
