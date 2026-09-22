SET search_path TO troc, public;
CREATE TABLE inventory_sources (id text PRIMARY KEY, label text NOT NULL);
INSERT INTO inventory_sources VALUES ('manual','TROC manual'),('csv','CSV'),('carduploader','CardUploader'),('sortswift','SortSwift'),('ebay','eBay'),('shopify','Shopify'),('tcgplayer','TCGplayer');
ALTER TABLE listings
 ADD COLUMN source_platform text NOT NULL DEFAULT 'manual' REFERENCES inventory_sources(id),
 ADD COLUMN external_sku text,
 ADD COLUMN external_listing_id text,
 ADD COLUMN sync_status text NOT NULL DEFAULT 'not_connected' CHECK(sync_status IN ('not_connected','pending','synced','error','conflict')),
 ADD COLUMN last_synced_at timestamptz,
 ADD COLUMN sync_error text,
 ADD COLUMN inventory_version integer NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX listing_external_identity ON listings(seller_id,source_platform,external_listing_id) WHERE external_listing_id IS NOT NULL;
CREATE INDEX inventory_seller_page ON listings(seller_id,id);
CREATE INDEX inventory_seller_status ON listings(seller_id,status,id);
CREATE INDEX inventory_seller_source ON listings(seller_id,source_platform,id);
CREATE INDEX inventory_seller_sync ON listings(seller_id,sync_status,id);
CREATE INDEX inventory_catalog_name_en ON catalog_products(lower(name_en));
CREATE INDEX inventory_catalog_name_fr ON catalog_products(lower(name_fr));
CREATE TABLE inventory_imports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES seller_accounts(id),
 actor_id uuid NOT NULL REFERENCES users(id), request_key text NOT NULL,
 request_hash text NOT NULL, status text NOT NULL DEFAULT 'preview' CHECK(status IN ('preview','published')),
 rows jsonb NOT NULL, summary jsonb NOT NULL, published_count integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
 UNIQUE(seller_id,request_key)
);
CREATE INDEX inventory_import_seller ON inventory_imports(seller_id,created_at DESC);
CREATE TABLE inventory_mappings (
 seller_id uuid NOT NULL REFERENCES seller_accounts(id), name text NOT NULL,
 mapping jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(seller_id,name)
);
-- Events describe committed listing state, including changes made by checkout and restock.
-- No external delivery/integration is implied. Delivery workers belong to milestone 4.5.
CREATE TABLE inventory_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES seller_accounts(id),
 listing_id uuid NOT NULL REFERENCES listings(id), version integer NOT NULL, event text NOT NULL,
 payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(listing_id,version,event)
);
CREATE INDEX inventory_outbox_seller ON inventory_outbox(seller_id,created_at,id);
CREATE FUNCTION inventory_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 NEW.inventory_version := OLD.inventory_version + 1;
 NEW.updated_at := now();
 RETURN NEW;
END $$;
CREATE TRIGGER inventory_revision BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION inventory_revision();
CREATE FUNCTION inventory_change_events() RETURNS trigger LANGUAGE plpgsql SET search_path=troc,pg_temp AS $$
DECLARE events text[]; event_name text;
BEGIN
 IF TG_OP='INSERT' THEN events := ARRAY['inventory.created','listing.created'];
 ELSE
  events := ARRAY['inventory.updated','listing.updated'];
  IF NEW.quantity<>OLD.quantity THEN events := array_append(events,'inventory.quantity_changed'); END IF;
  IF NEW.quantity=0 AND OLD.quantity>0 THEN events := array_append(events,'inventory.sold_out'); END IF;
  IF NEW.status='archived' AND OLD.status<>'archived' THEN events := array_append(events,'listing.removed'); END IF;
 END IF;
 FOREACH event_name IN ARRAY events LOOP
  INSERT INTO inventory_outbox(seller_id,listing_id,version,event,payload)
  VALUES(NEW.seller_id,NEW.id,NEW.inventory_version,event_name,jsonb_build_object('listingId',NEW.id,'variantId',NEW.variant_id,'quantity',NEW.quantity,'priceCents',NEW.unit_price_cents,'status',NEW.status,'source',NEW.source_platform));
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER inventory_change_events AFTER INSERT OR UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION inventory_change_events();
CREATE TRIGGER inventory_outbox_immutable BEFORE UPDATE OR DELETE ON inventory_outbox FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['inventory_sources','inventory_imports','inventory_mappings','inventory_outbox'] LOOP
  EXECUTE format('ALTER TABLE troc.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY backend_access ON troc.%I TO troc_backend USING(true) WITH CHECK(true)',t);
 END LOOP;
END $$;
GRANT SELECT ON inventory_sources TO troc_backend;
GRANT SELECT ON platform_settings TO troc_backend;
CREATE POLICY inventory_settings_read ON platform_settings FOR SELECT TO troc_backend USING(true);
GRANT SELECT ON external_catalog_mappings TO troc_backend;
CREATE POLICY inventory_mapping_read ON external_catalog_mappings FOR SELECT TO troc_backend USING(true);
-- SELECT FOR UPDATE needs an UPDATE privilege; restrict it to the timestamp.
GRANT UPDATE(updated_at) ON seller_accounts TO troc_backend;
GRANT SELECT,INSERT,UPDATE ON inventory_imports,inventory_mappings TO troc_backend;
GRANT SELECT,INSERT ON inventory_outbox TO troc_backend;
GRANT INSERT ON listings TO troc_backend;
CREATE POLICY inventory_listing_insert ON listings FOR INSERT TO troc_backend WITH CHECK(true);
GRANT UPDATE(unit_price_cents,seller_sku,external_sku,external_listing_id,source_platform,inventory_version) ON listings TO troc_backend;
REVOKE ALL ON FUNCTION inventory_revision(),inventory_change_events() FROM PUBLIC;
