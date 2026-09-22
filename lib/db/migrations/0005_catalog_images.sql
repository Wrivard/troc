SET search_path TO troc, public;
-- Separate canonical image IDs from provider mappings and individual renditions.
CREATE TABLE catalog_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 product_id uuid NOT NULL REFERENCES catalog_products(id),
 variant_id uuid REFERENCES variants(id),
 provenance_id uuid NOT NULL REFERENCES asset_provenance(id),
 external_id text NOT NULL,
 side text NOT NULL CHECK(side IN ('front','back','detail')),
 position smallint NOT NULL DEFAULT 0 CHECK(position BETWEEN 0 AND 11),
 width integer NOT NULL CHECK(width BETWEEN 1 AND 12000),
 height integer NOT NULL CHECK(height BETWEEN 1 AND 12000),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(provenance_id,external_id),
 UNIQUE NULLS NOT DISTINCT(product_id,variant_id,position)
);
CREATE INDEX catalog_images_product ON catalog_images(product_id,variant_id,position,id);
CREATE TABLE catalog_image_renditions (
 image_id uuid NOT NULL REFERENCES catalog_images(id) ON DELETE CASCADE,
 width integer NOT NULL CHECK(width BETWEEN 1 AND 12000),
 url text NOT NULL CHECK(url LIKE 'https://%' OR url LIKE '/catalog-art/%'),
 PRIMARY KEY(image_id,width)
);
ALTER TABLE catalog_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_image_renditions ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON catalog_images,catalog_image_renditions TO troc_backend;
CREATE POLICY backend_read ON catalog_images FOR SELECT TO troc_backend USING(true);
CREATE POLICY backend_read ON catalog_image_renditions FOR SELECT TO troc_backend USING(true);
-- Only the privileged, audited catalog import process writes; no client grants.
