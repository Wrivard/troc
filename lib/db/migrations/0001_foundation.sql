-- PostgreSQL 15+ / Supabase. Application tables are private to the backend.
CREATE SCHEMA IF NOT EXISTS troc;
SET search_path TO troc, public;
CREATE TABLE demo_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seed_key text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), purged_at timestamptz
);
CREATE TABLE users (
 id uuid PRIMARY KEY, email text NOT NULL, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deleted')),
 demo_batch_id uuid REFERENCES demo_batches(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email ON users(lower(email));
CREATE TABLE user_profiles (
 user_id uuid PRIMARY KEY REFERENCES users(id), display_name text NOT NULL DEFAULT '', country text NOT NULL DEFAULT 'CA' CHECK(country='CA'),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_preferences (
 user_id uuid PRIMARY KEY REFERENCES users(id), locale text NOT NULL DEFAULT 'en' CHECK(locale IN ('en','fr')),
 theme text NOT NULL DEFAULT 'dark' CHECK(theme IN ('dark','light')), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 recipient text NOT NULL, line1 text NOT NULL, line2 text, city text NOT NULL,
 province text NOT NULL CHECK(province IN ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
 postal_code text NOT NULL, country text NOT NULL DEFAULT 'CA' CHECK(country='CA'), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX addresses_user ON addresses(user_id);
CREATE TABLE user_roles (
 user_id uuid NOT NULL REFERENCES users(id), role text NOT NULL CHECK(role IN ('admin','support','catalog_moderator')),
 granted_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,role)
);
CREATE TABLE seller_levels (id text PRIMARY KEY, free_shipping_eligible boolean NOT NULL DEFAULT false);
INSERT INTO seller_levels VALUES ('new',false),('established',true),('trusted',true),('elite',true);
CREATE TABLE seller_plans (id text PRIMARY KEY);
INSERT INTO seller_plans VALUES ('free'),('pro'),('business');
CREATE TABLE seller_plan_entitlements (plan_id text REFERENCES seller_plans(id), feature text NOT NULL, configuration jsonb NOT NULL DEFAULT '{}', PRIMARY KEY(plan_id,feature));
CREATE TABLE seller_accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE CHECK(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), display_name text NOT NULL,
 seller_type text NOT NULL CHECK(seller_type IN ('individual','professional','verified_online','verified_hobby_shop')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended','closed')),
 country text NOT NULL DEFAULT 'CA' CHECK(country='CA'), level_id text NOT NULL DEFAULT 'new' REFERENCES seller_levels(id),
 plan_id text NOT NULL DEFAULT 'free' REFERENCES seller_plans(id), pro_lifetime boolean NOT NULL DEFAULT false,
 founding_number integer UNIQUE CHECK(founding_number BETWEEN 1 AND 250),
 demo_batch_id uuid REFERENCES demo_batches(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(founding_number IS NULL OR pro_lifetime)
);
CREATE TABLE seller_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), applicant_id uuid NOT NULL REFERENCES users(id), contact_name text NOT NULL,
 country text NOT NULL CHECK(country='CA'), province text NOT NULL CHECK(province IN ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
 seller_type text NOT NULL CHECK(seller_type IN ('individual','professional','verified_online','verified_hobby_shop')),
 adult_confirmed boolean NOT NULL CHECK(adult_confirmed),
 status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','approved','rejected','withdrawn')),
 seller_id uuid REFERENCES seller_accounts(id), reviewed_by uuid REFERENCES users(id), reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX seller_application_open ON seller_applications(applicant_id) WHERE status='submitted';
CREATE TABLE seller_member_roles (id text PRIMARY KEY);
INSERT INTO seller_member_roles VALUES ('owner'),('manager'),('inventory'),('fulfillment'),('customer_service');
CREATE TABLE seller_members (
 seller_id uuid REFERENCES seller_accounts(id), user_id uuid REFERENCES users(id), role text NOT NULL REFERENCES seller_member_roles(id),
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(seller_id,user_id)
);
CREATE INDEX seller_members_user ON seller_members(user_id,seller_id);
CREATE TABLE seller_settings (
 seller_id uuid PRIMARY KEY REFERENCES seller_accounts(id), minimum_order_cents integer NOT NULL DEFAULT 0 CHECK(minimum_order_cents IN (0,200,500,1000)),
 handling_days integer NOT NULL DEFAULT 2 CHECK(handling_days BETWEEN 0 AND 30), free_shipping_threshold_cents integer CHECK(free_shipping_threshold_cents>=0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE seller_verification_status (
 seller_id uuid PRIMARY KEY REFERENCES seller_accounts(id), kyc_status text NOT NULL DEFAULT 'not_started' CHECK(kyc_status IN ('not_started','pending','verified','rejected')),
 payout_status text NOT NULL DEFAULT 'not_connected' CHECK(payout_status IN ('not_connected','pending','enabled','restricted')),
 tax_registration_reference text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE seller_badges (id text PRIMARY KEY);
INSERT INTO seller_badges VALUES ('identity_verified'),('top_seller'),('verified_hobby_shop'),('founding_seller');
CREATE TABLE seller_badge_assignments (seller_id uuid REFERENCES seller_accounts(id), badge_id text REFERENCES seller_badges(id), granted_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(seller_id,badge_id));
CREATE TABLE games (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, name_en text NOT NULL, name_fr text NOT NULL);
CREATE TABLE set_releases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), game_id uuid NOT NULL REFERENCES games(id), slug text NOT NULL UNIQUE, name_en text NOT NULL, name_fr text NOT NULL, released_on date, UNIQUE(id,game_id));
CREATE INDEX set_releases_game ON set_releases(game_id,released_on,id);
CREATE TABLE catalog_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), game_id uuid NOT NULL REFERENCES games(id), set_id uuid NOT NULL,
 slug text NOT NULL UNIQUE, name_en text NOT NULL, name_fr text NOT NULL,
 product_type text NOT NULL CHECK(product_type IN ('raw_single','graded_card','sealed')),
 created_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(set_id,game_id) REFERENCES set_releases(id,game_id)
);
CREATE INDEX catalog_products_set ON catalog_products(set_id,id);
CREATE TABLE printings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES catalog_products(id), language text NOT NULL CHECK(language IN ('en','ja')), collector_number text, rarity text, artist text, printing_key text NOT NULL, UNIQUE(product_id,language,printing_key));
CREATE TABLE variants (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), printing_id uuid NOT NULL REFERENCES printings(id), variant_key text NOT NULL, attributes jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(attributes)='object'), UNIQUE(printing_id,variant_key));
CREATE TABLE catalog_aliases (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES catalog_products(id), locale text NOT NULL CHECK(locale IN ('en','fr','ja')), alias text NOT NULL, UNIQUE(product_id,locale,alias));
CREATE INDEX catalog_alias_lookup ON catalog_aliases(lower(alias));
CREATE TABLE external_catalog_mappings (provider text NOT NULL, external_id text NOT NULL, variant_id uuid NOT NULL REFERENCES variants(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(provider,external_id));
CREATE INDEX external_mapping_variant ON external_catalog_mappings(variant_id);
CREATE TABLE asset_sources (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, license text NOT NULL, approved_at timestamptz, approved_by uuid REFERENCES users(id));
CREATE TABLE asset_provenance (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL REFERENCES asset_sources(id), variant_id uuid REFERENCES variants(id), source_url text NOT NULL, storage_key text, captured_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE grading_companies (id text PRIMARY KEY, display_name text NOT NULL);
CREATE TABLE listings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_id uuid NOT NULL REFERENCES seller_accounts(id), variant_id uuid NOT NULL REFERENCES variants(id),
 condition text CHECK(condition IN ('NM','LP','MP','HP','DMG')), unit_price_cents integer NOT NULL CHECK(unit_price_cents>=1),
 currency text NOT NULL DEFAULT 'CAD' CHECK(currency='CAD'), quantity integer NOT NULL CHECK(quantity>=0),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','sold_out','archived')),
 seller_sku text, storage_location text, grading_company_id text REFERENCES grading_companies(id), grade text, certificate_number text,
 special_listing boolean NOT NULL DEFAULT false, demo_batch_id uuid REFERENCES demo_batches(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(seller_id,seller_sku), UNIQUE(id,seller_id), CHECK((grading_company_id IS NULL AND grade IS NULL) OR (grading_company_id IS NOT NULL AND grade IS NOT NULL))
);
CREATE INDEX listings_available_variant ON listings(variant_id,unit_price_cents,id) WHERE status='active' AND quantity>0;
CREATE INDEX listings_seller ON listings(seller_id,status,id);
CREATE TABLE listing_photos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES listings(id), storage_key text NOT NULL, position integer NOT NULL CHECK(position>=0), UNIQUE(listing_id,position));
CREATE TABLE inventory_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES listings(id), quantity_delta integer NOT NULL, reason text NOT NULL, actor_id uuid REFERENCES users(id), idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE inventory_reservations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), listing_id uuid NOT NULL REFERENCES listings(id), buyer_id uuid NOT NULL REFERENCES users(id), quantity integer NOT NULL CHECK(quantity>0), expires_at timestamptz NOT NULL, idempotency_key text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX inventory_reservations_listing ON inventory_reservations(listing_id,expires_at);
CREATE TABLE fx_rates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, source_currency text NOT NULL, target_currency text NOT NULL DEFAULT 'CAD' CHECK(target_currency='CAD'), rate numeric(24,12) NOT NULL CHECK(rate>0), rate_date date NOT NULL, UNIQUE(provider,source_currency,target_currency,rate_date));
CREATE TABLE reference_prices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), variant_id uuid NOT NULL REFERENCES variants(id), provider text NOT NULL, provider_product_id text NOT NULL,
 source_currency text NOT NULL, source_price_minor_units bigint NOT NULL CHECK(source_price_minor_units>=0),
 condition text CHECK(condition IN ('NM','LP','MP','HP','DMG')), grade text, provider_updated_at timestamptz NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT now(), fx_rate_id uuid NOT NULL REFERENCES fx_rates(id), converted_cad_cents bigint NOT NULL CHECK(converted_cad_cents>=0)
);
CREATE INDEX reference_prices_variant ON reference_prices(variant_id,captured_at DESC,id);
-- Structural support only: checkout and ledger workflows belong to Milestone 3.
CREATE TABLE marketplace_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), buyer_id uuid NOT NULL REFERENCES users(id), currency text NOT NULL DEFAULT 'CAD' CHECK(currency='CAD'),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','simulated_paid','awaiting_shipment','shipped','delivered','completed','issue','cancelled','partially_refunded','refunded')),
 total_cents bigint NOT NULL CHECK(total_cents>=0), processing_fixed_cents integer NOT NULL DEFAULT 0 CHECK(processing_fixed_cents>=0),
 idempotency_key text NOT NULL UNIQUE, demo_batch_id uuid REFERENCES demo_batches(id) ON DELETE RESTRICT, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketplace_orders_buyer ON marketplace_orders(buyer_id,created_at DESC,id);
CREATE TABLE seller_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), marketplace_order_id uuid NOT NULL REFERENCES marketplace_orders(id), seller_id uuid NOT NULL REFERENCES seller_accounts(id),
 merchandise_cents bigint NOT NULL CHECK(merchandise_cents>=0), shipping_cents integer NOT NULL CHECK(shipping_cents>=0),
 discount_cents bigint NOT NULL DEFAULT 0 CHECK(discount_cents>=0 AND discount_cents<=merchandise_cents), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(marketplace_order_id,seller_id), UNIQUE(id,seller_id)
);
CREATE INDEX seller_orders_seller ON seller_orders(seller_id,created_at DESC,id);
CREATE TABLE order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), seller_order_id uuid NOT NULL, seller_id uuid NOT NULL, listing_id uuid NOT NULL,
 variant_id uuid NOT NULL REFERENCES variants(id), quantity integer NOT NULL CHECK(quantity>0), unit_price_cents integer NOT NULL CHECK(unit_price_cents>=1), snapshot jsonb NOT NULL,
 FOREIGN KEY(seller_order_id,seller_id) REFERENCES seller_orders(id,seller_id), FOREIGN KEY(listing_id,seller_id) REFERENCES listings(id,seller_id)
);
CREATE TABLE audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES users(id), action text NOT NULL, entity_type text NOT NULL, entity_id uuid, metadata jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX audit_events_entity ON audit_events(entity_type,entity_id,created_at DESC);
CREATE TABLE demo_provenance (batch_id uuid NOT NULL REFERENCES demo_batches(id) ON DELETE RESTRICT, entity_type text NOT NULL CHECK(entity_type IN ('users','seller_accounts','listings','marketplace_orders')), entity_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(entity_type,entity_id));
-- Real leads intentionally have no demo batch FK or purge membership.
CREATE TABLE buyer_waitlist (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, locale text NOT NULL CHECK(locale IN ('en','fr')), consent_version text NOT NULL, consented_at timestamptz NOT NULL, unsubscribed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE founding_seller_leads (LIKE buyer_waitlist INCLUDING ALL);
CREATE TABLE lgs_partner_leads (LIKE buyer_waitlist INCLUDING ALL);
CREATE TABLE partner_investor_leads (LIKE buyer_waitlist INCLUDING ALL);
CREATE TABLE consent_records (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), purpose text NOT NULL, version text NOT NULL, granted boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE platform_settings (key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
INSERT INTO platform_settings VALUES ('commerce','{"currency":"CAD","commissionBasisPoints":800,"shippingCommissionBasisPoints":0,"photoThresholdCents":5000,"trackedThresholdCents":5000,"sellerMinimumsCents":[0,200,500,1000],"foundingSellerLimit":250}',now());
CREATE FUNCTION reject_audit_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Append-only record'; END $$;
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE TRIGGER inventory_events_immutable BEFORE UPDATE OR DELETE ON inventory_events FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
CREATE FUNCTION track_demo_provenance() RETURNS trigger LANGUAGE plpgsql SET search_path = troc, pg_temp AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.demo_batch_id IS DISTINCT FROM OLD.demo_batch_id THEN RAISE EXCEPTION 'Demo provenance is immutable'; END IF;
 IF NEW.demo_batch_id IS NOT NULL THEN
  INSERT INTO demo_provenance(batch_id,entity_type,entity_id) VALUES(NEW.demo_batch_id,TG_TABLE_NAME,NEW.id) ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER users_demo AFTER INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION track_demo_provenance();
CREATE TRIGGER sellers_demo AFTER INSERT OR UPDATE ON seller_accounts FOR EACH ROW EXECUTE FUNCTION track_demo_provenance();
CREATE TRIGGER listings_demo AFTER INSERT OR UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION track_demo_provenance();
CREATE TRIGGER orders_demo AFTER INSERT OR UPDATE ON marketplace_orders FOR EACH ROW EXECUTE FUNCTION track_demo_provenance();
-- Defense in depth: browser roles get no table access; all access uses thin API controllers.
REVOKE ALL ON SCHEMA troc FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA troc FROM PUBLIC;
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='troc' LOOP
  EXECUTE format('ALTER TABLE troc.%I ENABLE ROW LEVEL SECURITY',t.tablename);
 END LOOP;
END $$;
