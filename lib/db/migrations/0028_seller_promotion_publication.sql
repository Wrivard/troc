-- Local candidate: production application remains held.
ALTER TABLE troc.seller_settings ADD COLUMN promotion_version integer NOT NULL DEFAULT 0 CHECK(promotion_version>=0);
GRANT UPDATE(promotions,promotion_version) ON troc.seller_settings TO troc_backend;
CREATE TABLE troc.seller_promotion_commands (
 seller_id uuid NOT NULL REFERENCES troc.seller_accounts(id),
 request_key uuid NOT NULL,
 actor_id uuid NOT NULL REFERENCES troc.users(id),
 request jsonb NOT NULL,
 response jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(seller_id,request_key)
);
ALTER TABLE troc.seller_promotion_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_promotion_commands ON troc.seller_promotion_commands TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.seller_promotion_commands FROM PUBLIC;
GRANT SELECT,INSERT ON troc.seller_promotion_commands TO troc_backend;
CREATE TRIGGER promotion_command_immutable BEFORE UPDATE OR DELETE ON troc.seller_promotion_commands FOR EACH ROW EXECUTE FUNCTION troc.reject_audit_mutation();
