-- An unprivileged group role: deployment grants this role to a dedicated LOGIN.
-- Migration credentials must never be used by the HTTP process.
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='troc_backend') THEN
  CREATE ROLE troc_backend NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
 END IF;
END $$;
GRANT USAGE ON SCHEMA troc TO troc_backend;
GRANT SELECT,INSERT ON troc.users,troc.user_profiles,troc.user_preferences,troc.seller_applications TO troc_backend;
GRANT UPDATE(locale,theme,updated_at) ON troc.user_preferences TO troc_backend;
GRANT SELECT ON troc.user_roles,troc.seller_members,troc.seller_accounts TO troc_backend;
GRANT INSERT ON troc.audit_events TO troc_backend;
DO $$ DECLARE table_name text; BEGIN
 FOREACH table_name IN ARRAY ARRAY['users','user_profiles','user_preferences','seller_applications','user_roles','seller_members','seller_accounts','audit_events'] LOOP
  EXECUTE format('CREATE POLICY backend_access ON troc.%I TO troc_backend USING (true) WITH CHECK (true)',table_name);
 END LOOP;
END $$;
-- New application tables remain inaccessible until a migration grants access.
ALTER DEFAULT PRIVILEGES IN SCHEMA troc REVOKE ALL ON TABLES FROM PUBLIC;
