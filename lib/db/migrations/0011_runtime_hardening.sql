-- Preserve applied migration history; address staging advisor findings additively.
ALTER FUNCTION troc.reject_audit_mutation() SET search_path = pg_catalog;
ALTER FUNCTION troc.inventory_revision() SET search_path = pg_catalog;

-- pg_trgm indexes retain their operator-class OIDs when the extension moves.
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO troc_backend;

-- 0001 already provides the exact (seller_id,status,id) index.
DROP INDEX troc.inventory_seller_status;
-- The existing ALL backend_access policy also covers this SELECT permission.
DROP POLICY catalog_backend_read ON troc.seller_settings;
