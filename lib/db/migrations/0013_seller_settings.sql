-- Owner/admin-authorized settings API; no grants to browser roles.
GRANT UPDATE(display_name,updated_at) ON troc.seller_accounts TO troc_backend;
GRANT UPDATE(minimum_order_cents,handling_days,updated_at) ON troc.seller_settings TO troc_backend;
