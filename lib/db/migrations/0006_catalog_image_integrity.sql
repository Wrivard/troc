SET search_path TO troc, public;
ALTER TABLE asset_provenance ADD COLUMN legacy_image boolean NOT NULL DEFAULT true;
-- Source identity cannot be borrowed from an unrelated canonical product.
CREATE FUNCTION validate_catalog_image_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = troc, pg_temp AS $$
DECLARE image_product uuid; source_variant uuid; source_product uuid;
BEGIN
 IF NEW.variant_id IS NOT NULL THEN
  SELECT p.product_id INTO image_product FROM variants v JOIN printings p ON p.id=v.printing_id WHERE v.id=NEW.variant_id;
  IF image_product IS DISTINCT FROM NEW.product_id THEN RAISE EXCEPTION 'image_variant_product_mismatch'; END IF;
 END IF;
 SELECT ap.variant_id,p.product_id INTO source_variant,source_product
 FROM asset_provenance ap LEFT JOIN variants v ON v.id=ap.variant_id LEFT JOIN printings p ON p.id=v.printing_id WHERE ap.id=NEW.provenance_id;
 IF source_variant IS NOT NULL AND (source_product IS DISTINCT FROM NEW.product_id OR (NEW.variant_id IS NOT NULL AND NEW.variant_id IS DISTINCT FROM source_variant)) THEN
  RAISE EXCEPTION 'image_provenance_mismatch';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION validate_catalog_image_identity() FROM PUBLIC;
CREATE TRIGGER catalog_image_identity BEFORE INSERT OR UPDATE ON catalog_images
 FOR EACH ROW EXECUTE FUNCTION validate_catalog_image_identity();
-- Validate retained rows as well as future writes; a bad existing link blocks migration.
UPDATE catalog_images SET product_id=product_id;
-- Canonical identity is immutable for provenance already used by images.
CREATE FUNCTION protect_image_provenance_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path = troc, pg_temp AS $$
BEGIN
 IF NEW.variant_id IS DISTINCT FROM OLD.variant_id AND EXISTS(SELECT 1 FROM catalog_images WHERE provenance_id=OLD.id) THEN
  RAISE EXCEPTION 'image_provenance_identity_immutable';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION protect_image_provenance_identity() FROM PUBLIC;
CREATE TRIGGER image_provenance_identity BEFORE UPDATE OF variant_id ON asset_provenance
 FOR EACH ROW EXECUTE FUNCTION protect_image_provenance_identity();
