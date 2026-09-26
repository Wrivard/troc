-- This read-heavy projection prioritizes predictable interactive latency.
-- Bulk backfills should populate then rebuild indexes in a maintenance window.
ALTER INDEX troc.catalog_search_variants_hay SET (fastupdate = off);
SELECT pg_catalog.gin_clean_pending_list('troc.catalog_search_variants_hay'::regclass);
ANALYZE troc.catalog_search_variants;
