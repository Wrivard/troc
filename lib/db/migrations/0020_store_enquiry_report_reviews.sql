-- A report decision is internal triage, never a suspension or order action.
ALTER TABLE troc.store_enquiry_reports
 ADD COLUMN review_key uuid,
 ADD COLUMN reviewed_by uuid REFERENCES troc.users(id),
 ADD COLUMN review_note text CHECK(char_length(review_note) BETWEEN 1 AND 1000),
 ADD COLUMN reviewed_at timestamptz,
 ADD CONSTRAINT report_review_complete CHECK (
 (state='open' AND review_key IS NULL AND reviewed_by IS NULL AND review_note IS NULL AND reviewed_at IS NULL)
 OR (state IN ('resolved','dismissed') AND review_key IS NOT NULL AND reviewed_by IS NOT NULL AND review_note IS NOT NULL AND reviewed_at IS NOT NULL)
 );
GRANT UPDATE(state,review_key,reviewed_by,review_note,reviewed_at) ON troc.store_enquiry_reports TO troc_backend;
-- Original message, reporter, reason and report notes remain immutable for the backend role.
