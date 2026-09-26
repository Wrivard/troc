-- Store/buyer pre-sale contact control only; order messaging is outside this table.
CREATE TABLE troc.store_enquiry_controls (
 seller_id uuid NOT NULL REFERENCES troc.seller_accounts(id),
 buyer_id uuid NOT NULL REFERENCES troc.users(id),
 blocked boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 0 CHECK(version>=0),
 changed_by uuid REFERENCES troc.users(id),
 changed_at timestamptz,
 request_key uuid,
 PRIMARY KEY(seller_id,buyer_id)
);
ALTER TABLE troc.store_enquiry_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_enquiry_controls ON troc.store_enquiry_controls TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.store_enquiry_controls FROM PUBLIC;
GRANT SELECT,INSERT ON troc.store_enquiry_controls TO troc_backend;
GRANT UPDATE(blocked,version,changed_by,changed_at,request_key) ON troc.store_enquiry_controls TO troc_backend;
