-- Per-user read state records observed messages rather than a timestamp watermark.
-- Late commits and tied timestamps cannot silently disappear behind a cursor.
CREATE TABLE troc.store_enquiry_reads (
 user_id uuid NOT NULL REFERENCES troc.users(id),
 message_id uuid NOT NULL REFERENCES troc.store_enquiry_messages(id),
 read_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(user_id,message_id)
);
ALTER TABLE troc.store_enquiry_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_access ON troc.store_enquiry_reads TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.store_enquiry_reads FROM PUBLIC;
GRANT SELECT,INSERT ON troc.store_enquiry_reads TO troc_backend;
