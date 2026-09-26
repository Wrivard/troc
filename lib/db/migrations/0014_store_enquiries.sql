
CREATE TABLE troc.store_enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),seller_id uuid NOT NULL REFERENCES troc.seller_accounts(id),
 buyer_id uuid NOT NULL REFERENCES troc.users(id),subject text NOT NULL CHECK(length(subject) BETWEEN 1 AND 120),
 request_key uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(buyer_id,request_key)
);
CREATE INDEX store_enquiries_seller ON troc.store_enquiries(seller_id,created_at DESC,id);
CREATE TABLE troc.store_enquiry_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),enquiry_id uuid NOT NULL REFERENCES troc.store_enquiries(id),
 actor_id uuid NOT NULL REFERENCES troc.users(id),author text NOT NULL CHECK(author IN('buyer','seller')),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),request_key uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(actor_id,request_key)
);
CREATE INDEX store_enquiry_messages_thread ON troc.store_enquiry_messages(enquiry_id,created_at,id);
ALTER TABLE troc.store_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE troc.store_enquiry_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_access ON troc.store_enquiries TO troc_backend USING(true) WITH CHECK(true);
CREATE POLICY backend_access ON troc.store_enquiry_messages TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.store_enquiries,troc.store_enquiry_messages FROM PUBLIC;
GRANT SELECT,INSERT ON troc.store_enquiries,troc.store_enquiry_messages TO troc_backend;
