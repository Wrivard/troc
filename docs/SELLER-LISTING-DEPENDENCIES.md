# Remaining seller listing dependencies

E4.3 reuses delivered inventory search/manual/CSV/edit/bulk/export, storage location and sale controls. Do not recreate them. The manual form already explains that raw singles are supported, photo-required listings remain drafts, and graded/sealed have later workflows.

UP01 is not just a missing hosted environment: the existing PublicListingPhotoStorage implements readUrl only. Upload routes, byte validation and decoding, ownership binding, quarantine and publish lifecycle are not implemented by it. Preserve this distinction when reporting blockers. The configured public URL adapter does not prove that an uploaded image belongs to the seller or is safe to publish.

Before exposing a photo-required publish flow, provide a storage-provider contract and isolated tests for size/decode limits, authorization, staged ownership, failure cleanup and activation gating. Canonical catalogue artwork is separate from seller listing photos. Never use one to satisfy the other. Draft listing protection must remain authoritative on the server.

Negotiated offers depend on confirmed photo/graded/high-value eligibility and a separate offer acceptance/expiry lifecycle. Messaging does not establish an accepted price; no auctions in MVP. Do not add an active offers toggle until the acceptance/payment/stock authority contract is ready.

Promoted campaigns are separate again: seller participation and fee percentage are consent, while attributable conversion is server evidence. Existing global fee behavior is unchanged. See PROMOTED-LISTING-CONTROL-CONTRACT.md.
