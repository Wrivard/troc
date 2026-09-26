# Coherent Team lifecycle batch

Real local UI/API: check-team-invitations-lifecycle.cjs signs isolated browser contexts into synthetic seller@troc.test and buyer@troc.test, preserving user browser/session and Codex accounts. Preconditions refuse existing buyer membership or pending invite. Creates invitation through owner UI; confirms no membership before acceptance; recipient FR390accepts; actual settings read200/inventory membership appears; owner UI removes membership; recipient403and replay acceptance does not regrant. Fixture membership restored absent; audit and terminal invitation records retained. Initial failed run cleaned membership through authorized local API.

Bug found: Select options portalled to body used dropdown layer below dialog overlay; real mouse selection of Remove store access was intercepted. Shared Select portal layer now overlay+1. Existing modal behavior unchanged. check-select-modal-layer.cjs covers actual click, first Escape closes Select while keeping dialog, second closes dialog, ordinary Settings Select works; EN1440/FR390, FR screenshot inspected. No forced clicks or mocked removal in final lifecycle pass.

Second defect: last-owner guard treated suspended former owner as active, blocking removal after a valid admin recovery grant. Joined target user status and check active before applying last-active-owner count guard. Existing seller lock/admin authority preserved. Expanded regression reproduces failure then passes recovered-owner removal while sole active owner remains protected.22seller-platform/invitation tests pass; APItypes/scoped lint/build and client+SSR builds pass.

No native multi-connection concurrency certification or global suspension lifecycle guarantee. Account suspension in this test exists only in disposable DB; real test account membership grant/removal is local QA only. No external mail, production migration, remote release or model/account changes. New-account invitation delivery remains unavailable.

Next batch: current remaining buyer journey checks and original inventory gaps, preserving completed work and hosted gates.

Local runtime note: ownedAPI54576replaced by60720after backend fix; ready log verified. No new migrations.
