SET search_path TO troc,public;
ALTER TABLE seller_accounts ADD COLUMN reputation_score integer NOT NULL DEFAULT 0 CHECK(reputation_score BETWEEN 0 AND 100);
INSERT INTO demo_batches(seed_key) VALUES('commerce-simulation') ON CONFLICT(seed_key) DO NOTHING;
-- Trigger-only provenance writer; fixed search_path is defined in migration 0001.
ALTER FUNCTION track_demo_provenance() SECURITY DEFINER;
REVOKE ALL ON FUNCTION track_demo_provenance() FROM PUBLIC;
GRANT SELECT ON demo_batches TO troc_backend;
CREATE POLICY commerce_batch_read ON demo_batches FOR SELECT TO troc_backend USING(seed_key='commerce-simulation');
CREATE TABLE carts (buyer_id uuid PRIMARY KEY REFERENCES users(id), lines jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(lines)='array' AND jsonb_array_length(lines)<=100), coupon text NOT NULL DEFAULT '', smart boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE seller_settings ADD COLUMN promotions jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(promotions)='array' AND jsonb_array_length(promotions)<=20);
ALTER TABLE listings ADD COLUMN sale_cents integer CHECK(sale_cents>0 AND sale_cents<=unit_price_cents), ADD COLUMN grams integer NOT NULL DEFAULT 2 CHECK(grams BETWEEN 0 AND 30000), ADD COLUMN thickness_mm numeric(8,2) NOT NULL DEFAULT 0.3 CHECK(thickness_mm>=0), ADD COLUMN promoted_attributable boolean NOT NULL DEFAULT false;
ALTER TABLE marketplace_orders ADD COLUMN quote jsonb NOT NULL DEFAULT '{}', ADD COLUMN address jsonb NOT NULL DEFAULT '{}', ADD COLUMN request_fingerprint text NOT NULL DEFAULT '', ADD COLUMN credit_cents integer NOT NULL DEFAULT 0 CHECK(credit_cents>=0), ADD COLUMN reward_cents integer NOT NULL DEFAULT 0 CHECK(reward_cents>=0), ADD COLUMN payment_id text, ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE seller_orders ADD COLUMN status text NOT NULL DEFAULT 'awaiting_shipment' CHECK(status IN ('simulated_paid','awaiting_shipment','shipped','delivered','completed','issue','cancelled','partially_refunded','refunded')), ADD COLUMN quote jsonb NOT NULL DEFAULT '{}', ADD COLUMN tracking text, ADD COLUMN refunded_cents integer NOT NULL DEFAULT 0 CHECK(refunded_cents>=0), ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE inventory_reservations ADD COLUMN marketplace_order_id uuid REFERENCES marketplace_orders(id), ADD COLUMN state text NOT NULL DEFAULT 'reserved' CHECK(state IN ('reserved','committed','released'));
CREATE INDEX reservations_active_order ON inventory_reservations(marketplace_order_id) WHERE state='reserved';
CREATE INDEX reservations_active_listing ON inventory_reservations(listing_id,expires_at) WHERE state='reserved';
CREATE INDEX order_items_order ON order_items(seller_order_id,id);
CREATE TABLE fee_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), marketplace_order_id uuid NOT NULL REFERENCES marketplace_orders(id), seller_order_id uuid NOT NULL REFERENCES seller_orders(id), kind text NOT NULL CHECK(kind IN ('commission','shipping_commission','promotion','processing')), cents integer NOT NULL CHECK(cents>=0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(seller_order_id,kind));
CREATE TABLE credit_ledger (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), marketplace_order_id uuid REFERENCES marketplace_orders(id), seller_order_id uuid REFERENCES seller_orders(id), kind text NOT NULL CHECK(kind IN ('promotional','reward','refund','consumption','release','reward_reversal')), cents integer NOT NULL CHECK(cents<>0), idempotency_key text NOT NULL UNIQUE, demo boolean NOT NULL DEFAULT true CHECK(demo), created_at timestamptz NOT NULL DEFAULT now(), CHECK((kind IN ('consumption','reward_reversal') AND cents<0) OR (kind NOT IN ('consumption','reward_reversal') AND cents>0)));
CREATE INDEX credit_ledger_user ON credit_ledger(user_id,created_at,id);
CREATE INDEX credit_ledger_order ON credit_ledger(marketplace_order_id,kind);
CREATE INDEX credit_ledger_seller_order ON credit_ledger(seller_order_id);
CREATE INDEX fee_ledger_marketplace_order ON fee_ledger(marketplace_order_id);
CREATE TABLE order_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), marketplace_order_id uuid NOT NULL REFERENCES marketplace_orders(id), seller_order_id uuid REFERENCES seller_orders(id), actor_id uuid NOT NULL REFERENCES users(id), action text NOT NULL, details jsonb NOT NULL DEFAULT '{}', idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX order_events_order ON order_events(marketplace_order_id,created_at,id);
CREATE INDEX order_events_seller_action ON order_events(seller_order_id,action);
CREATE TABLE order_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_order_id uuid NOT NULL REFERENCES seller_orders(id), actor_id uuid NOT NULL REFERENCES users(id), author text NOT NULL CHECK(author IN ('buyer','seller')), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 2000), created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX order_messages_order ON order_messages(seller_order_id,created_at,id);
CREATE TABLE commerce_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid REFERENCES users(id), event text NOT NULL, demo boolean NOT NULL DEFAULT true, data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX commerce_events_created ON commerce_events(created_at,event);
CREATE INDEX commerce_events_buyer ON commerce_events(buyer_id,created_at);
ALTER TABLE commerce_events ADD COLUMN client_event_id uuid UNIQUE;
CREATE TABLE notification_outbox (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), marketplace_order_id uuid NOT NULL REFERENCES marketplace_orders(id), template text NOT NULL, idempotency_key text NOT NULL UNIQUE, state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','simulated_sent')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TRIGGER fee_ledger_immutable BEFORE UPDATE OR DELETE ON fee_ledger FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER credit_ledger_immutable BEFORE UPDATE OR DELETE ON credit_ledger FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER order_events_immutable BEFORE UPDATE OR DELETE ON order_events FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
-- A user-row lock serializes credit writes, including future promotional grant adapters.
CREATE FUNCTION guard_credit_balance() RETURNS trigger LANGUAGE plpgsql SET search_path=troc,pg_temp AS $$
DECLARE balance bigint;
BEGIN
 PERFORM id FROM users WHERE id=NEW.user_id FOR UPDATE;
 SELECT COALESCE(sum(cents),0) INTO balance FROM credit_ledger WHERE user_id=NEW.user_id;
 IF balance+NEW.cents<0 THEN RAISE EXCEPTION 'Insufficient credit'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER credit_balance BEFORE INSERT ON credit_ledger FOR EACH ROW EXECUTE FUNCTION guard_credit_balance();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['carts','fee_ledger','credit_ledger','order_events','order_messages','commerce_events','notification_outbox'] LOOP
  EXECUTE format('ALTER TABLE troc.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY backend_access ON troc.%I TO troc_backend USING(true) WITH CHECK(true)',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['marketplace_orders','seller_orders','order_items','inventory_reservations','inventory_events','seller_settings'] LOOP
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='troc' AND tablename=t AND policyname='backend_access') THEN
   EXECUTE format('CREATE POLICY backend_access ON troc.%I TO troc_backend USING(true) WITH CHECK(true)',t);
  END IF;
 END LOOP;
END $$;
GRANT SELECT,INSERT,UPDATE ON carts,marketplace_orders,seller_orders,inventory_reservations TO troc_backend;
GRANT SELECT,INSERT ON order_items,inventory_events,fee_ledger,credit_ledger,order_events,order_messages,commerce_events,notification_outbox TO troc_backend;
GRANT SELECT ON seller_settings,seller_levels TO troc_backend;
GRANT UPDATE(quantity,status,updated_at) ON listings TO troc_backend;
-- PostgreSQL row locks require UPDATE privilege; identity is never changed by services.
GRANT UPDATE(id) ON users TO troc_backend;
CREATE POLICY commerce_inventory_update ON listings FOR UPDATE TO troc_backend USING(true) WITH CHECK(true);
CREATE POLICY commerce_levels_read ON seller_levels FOR SELECT TO troc_backend USING(true);
REVOKE ALL ON carts,fee_ledger,credit_ledger,order_events,order_messages,commerce_events,notification_outbox FROM PUBLIC;
