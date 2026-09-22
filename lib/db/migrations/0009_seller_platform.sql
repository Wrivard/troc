ALTER TABLE troc.seller_applications ADD COLUMN profile jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(profile)='object'), ADD COLUMN review_note text CHECK(length(review_note)<=2000);
GRANT UPDATE(status,seller_id,reviewed_by,reviewed_at,review_note,updated_at) ON troc.seller_applications TO troc_backend;
GRANT INSERT ON troc.seller_accounts,troc.seller_members,troc.seller_settings,troc.seller_verification_status TO troc_backend;
GRANT UPDATE(role),DELETE ON troc.seller_members TO troc_backend;
GRANT SELECT ON troc.seller_verification_status TO troc_backend;
CREATE POLICY backend_access ON troc.seller_verification_status TO troc_backend USING(true) WITH CHECK(true);
CREATE INDEX seller_application_review_queue ON troc.seller_applications(status,created_at,id);
