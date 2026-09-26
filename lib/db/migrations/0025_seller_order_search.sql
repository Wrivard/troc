-- Rebuildable private order-search projection; never stock or money authority.
-- Deployment/backfill locking and multi-connection contention remain release gates.
LOCK TABLE troc.marketplace_orders, troc.seller_orders IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE troc.seller_order_search (
 order_id uuid PRIMARY KEY REFERENCES troc.seller_orders(id) ON DELETE CASCADE,
 seller_id uuid NOT NULL REFERENCES troc.seller_accounts(id),
 en text NOT NULL,
 fr text NOT NULL
);
CREATE INDEX seller_order_search_seller ON troc.seller_order_search(seller_id,order_id);
CREATE INDEX seller_order_search_en ON troc.seller_order_search USING gin(en extensions.gin_trgm_ops);
CREATE INDEX seller_order_search_fr ON troc.seller_order_search USING gin(fr extensions.gin_trgm_ops);
ALTER TABLE troc.seller_order_search ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON troc.seller_order_search FROM PUBLIC;
GRANT SELECT ON troc.seller_order_search TO troc_backend;
CREATE POLICY seller_order_search_backend ON troc.seller_order_search FOR SELECT TO troc_backend USING(true);

CREATE FUNCTION troc.refresh_seller_order_search(target uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
 INSERT INTO troc.seller_order_search(order_id,seller_id,en,fr)
 SELECT so.id,so.seller_id,
 lower(so.id::text||' '||COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer')||' '||COALESCE((SELECT string_agg(line->'listing'->'name'->>'en',' ') FROM jsonb_array_elements(so.quote->'lines') line),'')),
 lower(so.id::text||' '||COALESCE(NULLIF(mo.address->>'recipient',''),'Buyer')||' '||COALESCE((SELECT string_agg(line->'listing'->'name'->>'fr',' ') FROM jsonb_array_elements(so.quote->'lines') line),''))
 FROM troc.seller_orders so JOIN troc.marketplace_orders mo ON mo.id=so.marketplace_order_id WHERE so.id=target
 ON CONFLICT(order_id) DO UPDATE SET seller_id=EXCLUDED.seller_id,en=EXCLUDED.en,fr=EXCLUDED.fr;
$$;
REVOKE ALL ON FUNCTION troc.refresh_seller_order_search(uuid) FROM PUBLIC;

-- Serialize source changes on parent order rows before touching the projection.
CREATE FUNCTION troc.lock_order_search_parent() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  PERFORM id FROM troc.marketplace_orders WHERE id IN (OLD.marketplace_order_id,NEW.marketplace_order_id) ORDER BY id FOR UPDATE;
 ELSE
  PERFORM id FROM troc.marketplace_orders WHERE id=NEW.marketplace_order_id FOR UPDATE;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION troc.lock_order_search_parent() FROM PUBLIC;
CREATE TRIGGER order_search_parent_lock BEFORE INSERT OR UPDATE OF quote,marketplace_order_id,seller_id ON troc.seller_orders FOR EACH ROW EXECUTE FUNCTION troc.lock_order_search_parent();

CREATE FUNCTION troc.seller_order_search_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
BEGIN
 PERFORM troc.refresh_seller_order_search(NEW.id);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION troc.seller_order_search_changed() FROM PUBLIC;
CREATE TRIGGER seller_order_search_changed AFTER INSERT OR UPDATE OF quote,marketplace_order_id,seller_id ON troc.seller_orders FOR EACH ROW EXECUTE FUNCTION troc.seller_order_search_changed();

CREATE FUNCTION troc.order_search_recipient_changed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,troc AS $$
DECLARE target uuid;
BEGIN
 FOR target IN SELECT id FROM troc.seller_orders WHERE marketplace_order_id=NEW.id ORDER BY id LOOP
  PERFORM troc.refresh_seller_order_search(target);
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION troc.order_search_recipient_changed() FROM PUBLIC;
CREATE TRIGGER order_search_recipient_changed AFTER UPDATE OF address ON troc.marketplace_orders FOR EACH ROW WHEN (OLD.address IS DISTINCT FROM NEW.address) EXECUTE FUNCTION troc.order_search_recipient_changed();
SELECT troc.refresh_seller_order_search(id) FROM troc.seller_orders;
ANALYZE troc.seller_order_search;
