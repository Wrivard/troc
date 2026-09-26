-- Read-only order pagination support. No change to stock, money or grants.
-- Production application remains subject to deployment approval and lock review.
CREATE INDEX seller_orders_seek ON troc.seller_orders
  (seller_id, created_at DESC, id DESC);
CREATE INDEX seller_orders_total_seek ON troc.seller_orders
  (seller_id, (COALESCE((quote->>'totalCents')::bigint,0)) DESC, created_at DESC, id DESC);
