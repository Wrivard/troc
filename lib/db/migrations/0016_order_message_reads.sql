CREATE TABLE troc.order_message_reads (
 user_id uuid NOT NULL REFERENCES troc.users(id),
 message_id uuid NOT NULL REFERENCES troc.order_messages(id),
 read_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(user_id,message_id)
);
ALTER TABLE troc.order_message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_access ON troc.order_message_reads TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.order_message_reads FROM PUBLIC;
GRANT SELECT,INSERT ON troc.order_message_reads TO troc_backend;
