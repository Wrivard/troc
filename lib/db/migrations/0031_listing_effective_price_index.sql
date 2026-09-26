-- Effective-price offer ordering must include sale prices, matching catalogue reads.
-- Keep the regular-price index for existing consumers; no table rewrite.
CREATE INDEX listings_available_effective_price
ON troc.listings(variant_id,(COALESCE(sale_cents,unit_price_cents)),id)
WHERE status='active' AND quantity>0;
