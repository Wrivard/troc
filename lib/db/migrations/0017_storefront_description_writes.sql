GRANT INSERT (seller_id,story_en,story_fr,updated_at), UPDATE (story_en,story_fr,updated_at) ON troc.seller_public_profiles TO troc_backend;
CREATE POLICY profile_backend_insert ON troc.seller_public_profiles FOR INSERT TO troc_backend WITH CHECK(true);
CREATE POLICY profile_backend_update ON troc.seller_public_profiles FOR UPDATE TO troc_backend USING(true) WITH CHECK(true);
