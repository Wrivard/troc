CREATE EXTENSION IF NOT EXISTS pg_trgm;
SET search_path TO troc, public;
CREATE TABLE catalog_providers (
 id text PRIMARY KEY, license text NOT NULL, catalog_approved boolean NOT NULL DEFAULT false,
 images_approved boolean NOT NULL DEFAULT false, approval_evidence text, approved_by uuid REFERENCES users(id),
 approved_at timestamptz, demo boolean NOT NULL DEFAULT false,
 CHECK(NOT catalog_approved OR (approved_at IS NOT NULL AND approval_evidence IS NOT NULL))
);
INSERT INTO catalog_providers(id,license,catalog_approved,approval_evidence,approved_at,demo)
 VALUES('troc-fixture','Original fictional test fixture',true,'Locally authored representative fixtures only',now(),true);
CREATE TABLE catalog_source_entities (
 provider text NOT NULL REFERENCES catalog_providers(id), kind text NOT NULL CHECK(kind IN ('game','set','product','printing')),
 external_key text NOT NULL, game_id uuid REFERENCES games(id), set_id uuid REFERENCES set_releases(id), product_id uuid REFERENCES catalog_products(id), printing_id uuid REFERENCES printings(id),
 PRIMARY KEY(provider,kind,external_key),
 CHECK(num_nonnulls(game_id,set_id,product_id,printing_id)=1),
 CHECK((kind='game' AND game_id IS NOT NULL) OR (kind='set' AND set_id IS NOT NULL) OR (kind='product' AND product_id IS NOT NULL) OR (kind='printing' AND printing_id IS NOT NULL))
);
CREATE TABLE catalog_import_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL REFERENCES catalog_providers(id), idempotency_key text NOT NULL,
 actor_id uuid REFERENCES users(id), status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','partial','failed')),
 processed integer NOT NULL DEFAULT 0, succeeded integer NOT NULL DEFAULT 0, failed integer NOT NULL DEFAULT 0,
 cursor text, started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz, UNIQUE(provider,idempotency_key)
);
CREATE TABLE catalog_import_failures (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), run_id uuid NOT NULL REFERENCES catalog_import_runs(id), external_id text, error_code text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX catalog_import_failures_run ON catalog_import_failures(run_id,id);
CREATE TABLE catalog_documents (
 product_id uuid PRIMARY KEY REFERENCES catalog_products(id), search_text text NOT NULL, document jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_documents_trgm ON catalog_documents USING gin(search_text gin_trgm_ops);
CREATE INDEX catalog_products_name_page ON catalog_products(name_en,id);
CREATE INDEX variants_printing_page ON variants(printing_id,id);
CREATE TABLE seller_public_profiles (
 seller_id uuid PRIMARY KEY REFERENCES seller_accounts(id), city text NOT NULL DEFAULT '', province text NOT NULL DEFAULT '',
 story_en text NOT NULL DEFAULT '', story_fr text NOT NULL DEFAULT '', logo_url text, banner_url text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE external_catalog_mappings ADD COLUMN last_seen_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE reference_prices ADD COLUMN demo_batch_id uuid REFERENCES demo_batches(id) ON DELETE RESTRICT;
CREATE INDEX listing_photos_listing ON listing_photos(listing_id);
CREATE UNIQUE INDEX asset_provenance_dedupe ON asset_provenance(source_id,variant_id,source_url);
-- Public discovery reads only its explicit projection and approved public fields.
GRANT SELECT ON games,set_releases,catalog_products,printings,variants,catalog_aliases,catalog_documents,listings,listing_photos,seller_public_profiles,seller_settings,seller_badge_assignments,reference_prices,fx_rates,asset_provenance,asset_sources TO troc_backend;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['catalog_providers','catalog_source_entities','catalog_import_runs','catalog_import_failures','catalog_documents','seller_public_profiles'] LOOP
  EXECUTE format('ALTER TABLE troc.%I ENABLE ROW LEVEL SECURITY',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['games','set_releases','catalog_products','printings','variants','catalog_aliases','catalog_documents','listings','listing_photos','seller_public_profiles','seller_settings','seller_badge_assignments','reference_prices','fx_rates','asset_provenance','asset_sources'] LOOP
  EXECUTE format('CREATE POLICY catalog_backend_read ON troc.%I FOR SELECT TO troc_backend USING (true)',t);
 END LOOP;
END $$;
