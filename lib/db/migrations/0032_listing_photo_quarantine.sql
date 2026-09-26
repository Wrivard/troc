-- Private staging only; no listing photo association or public read grant.
CREATE TABLE troc.listing_photo_uploads (
 id uuid PRIMARY KEY,
 seller_id uuid NOT NULL REFERENCES troc.seller_accounts(id),
 listing_id uuid NOT NULL REFERENCES troc.listings(id),
 actor_id uuid NOT NULL REFERENCES troc.users(id),
 request_key uuid NOT NULL,
 listing_version integer NOT NULL CHECK(listing_version>0),
 input_sha256 text NOT NULL CHECK(input_sha256 ~ '^[0-9a-f]{64}$'),
 content_type text NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','ready','rejected','attached','expired','removed')),
 object_sha256 text CHECK(object_sha256 ~ '^[0-9a-f]{64}$'),
 removed_version integer CHECK(removed_version>0),
 removal_from_version integer CHECK(removal_from_version>0),
 attached_version integer CHECK(attached_version>0),
 output_sha256 text CHECK(output_sha256 ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '1 hour',
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(seller_id,request_key),
 CHECK(state NOT IN ('ready','attached') OR output_sha256 IS NOT NULL),
 CHECK((state IN ('attached','removed'))=(attached_version IS NOT NULL)),
 CHECK((state='removed')=(removed_version IS NOT NULL)),
 CHECK((state='removed')=(removal_from_version IS NOT NULL))
);
CREATE INDEX listing_photo_upload_seller_expiry ON troc.listing_photo_uploads(seller_id,expires_at);
CREATE INDEX listing_photo_upload_expiry ON troc.listing_photo_uploads(expires_at);
ALTER TABLE troc.listing_photo_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON troc.listing_photo_uploads FROM PUBLIC;
GRANT SELECT,INSERT ON troc.listing_photo_uploads TO troc_backend;
GRANT UPDATE(state,output_sha256,object_sha256,attached_version,removed_version,removal_from_version) ON troc.listing_photo_uploads TO troc_backend;
CREATE POLICY backend_photo_uploads ON troc.listing_photo_uploads TO troc_backend USING(true) WITH CHECK(true);
