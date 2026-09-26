CREATE TABLE troc.seller_promotion_drafts (
 seller_id uuid PRIMARY KEY REFERENCES troc.seller_accounts(id),
 drafts jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(drafts)='array' AND jsonb_array_length(drafts)<=100),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 last_key uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE troc.seller_promotion_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY backend_drafts ON troc.seller_promotion_drafts TO troc_backend USING(true) WITH CHECK(true);
REVOKE ALL ON troc.seller_promotion_drafts FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE ON troc.seller_promotion_drafts TO troc_backend;
-- Planning only. No trigger or connection to seller_settings.promotions / checkout.
