-- Rebuildable search-only projection. No authority over identities, stock or money.
CREATE FUNCTION troc.search_fold(value text) RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
 SELECT trim(regexp_replace(regexp_replace(lower(normalize(COALESCE(value,''), NFD)), '[̀-ͯ]', '', 'g'), '[[:space:]]+', ' ', 'g'))
$$;
CREATE TABLE troc.catalog_search_variants (
 variant_id uuid PRIMARY KEY,
 product_id uuid NOT NULL REFERENCES troc.catalog_products(id) ON DELETE CASCADE,
 names text[] NOT NULL,
 number text NOT NULL,
 collector_key text NOT NULL,
 hay text NOT NULL
);
CREATE INDEX catalog_search_variants_product ON troc.catalog_search_variants(product_id);
CREATE INDEX catalog_search_variants_number ON troc.catalog_search_variants(collector_key,product_id);
CREATE INDEX catalog_search_variants_hay ON troc.catalog_search_variants USING gin(hay extensions.gin_trgm_ops);
ALTER TABLE troc.catalog_search_variants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON troc.catalog_search_variants TO troc_backend;
CREATE POLICY catalog_search_backend ON troc.catalog_search_variants FOR SELECT TO troc_backend USING(true);
CREATE FUNCTION troc.refresh_catalog_search(target uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
BEGIN
 DELETE FROM troc.catalog_search_variants WHERE product_id=target;
 INSERT INTO troc.catalog_search_variants(variant_id,product_id,names,number,collector_key,hay)
 SELECT (v->>'id')::uuid,p.id,n.names,troc.search_fold(v->>'number'),regexp_replace(lower(split_part(COALESCE(v->>'number',''),'/',1)), '^0+([0-9])', '\1'),array_to_string(n.names,' ')||' '||troc.search_fold(v->>'number')
 FROM troc.catalog_documents d JOIN troc.catalog_products p ON p.id=d.product_id JOIN troc.games g ON g.id=p.game_id JOIN troc.set_releases s ON s.id=p.set_id
 CROSS JOIN LATERAL jsonb_array_elements(d.document->'variants')v
 CROSS JOIN LATERAL (SELECT ARRAY(SELECT troc.search_fold(x) FROM unnest(ARRAY[p.name_en,p.name_fr,g.name_en,g.name_fr,s.name_en,s.name_fr,COALESCE(v->>'key',''),COALESCE(v->>'artist',''),COALESCE(v->>'rarity','')]||ARRAY(SELECT jsonb_array_elements_text(COALESCE(d.document->'aliases','[]'))))x) AS names)n
 WHERE p.id=target;
END $$;
REVOKE ALL ON FUNCTION troc.refresh_catalog_search(uuid) FROM PUBLIC;
CREATE FUNCTION troc.catalog_search_document_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
BEGIN
 IF TG_OP='DELETE' THEN DELETE FROM troc.catalog_search_variants WHERE product_id=OLD.product_id; RETURN OLD; END IF;
 PERFORM troc.refresh_catalog_search(NEW.product_id); RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION troc.catalog_search_document_changed() FROM PUBLIC;
CREATE TRIGGER catalog_search_document AFTER INSERT OR UPDATE OR DELETE ON troc.catalog_documents FOR EACH ROW EXECUTE FUNCTION troc.catalog_search_document_changed();
CREATE FUNCTION troc.catalog_search_names_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
DECLARE target uuid;
BEGIN
 FOR target IN SELECT p.id FROM troc.catalog_products p WHERE (TG_TABLE_NAME='games' AND p.game_id=NEW.id) OR (TG_TABLE_NAME='set_releases' AND p.set_id=NEW.id) OR (TG_TABLE_NAME='catalog_products' AND p.id=NEW.id) LOOP
 PERFORM troc.refresh_catalog_search(target);
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION troc.catalog_search_names_changed() FROM PUBLIC;
CREATE TRIGGER catalog_search_game AFTER UPDATE OF name_en,name_fr ON troc.games FOR EACH ROW WHEN (OLD.name_en IS DISTINCT FROM NEW.name_en OR OLD.name_fr IS DISTINCT FROM NEW.name_fr) EXECUTE FUNCTION troc.catalog_search_names_changed();
CREATE TRIGGER catalog_search_set AFTER UPDATE OF name_en,name_fr ON troc.set_releases FOR EACH ROW WHEN (OLD.name_en IS DISTINCT FROM NEW.name_en OR OLD.name_fr IS DISTINCT FROM NEW.name_fr) EXECUTE FUNCTION troc.catalog_search_names_changed();
CREATE TRIGGER catalog_search_product AFTER UPDATE OF name_en,name_fr,game_id,set_id ON troc.catalog_products FOR EACH ROW EXECUTE FUNCTION troc.catalog_search_names_changed();
SELECT troc.refresh_catalog_search(product_id) FROM troc.catalog_documents;
ANALYZE troc.catalog_search_variants;
