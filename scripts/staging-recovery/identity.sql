-- Run separately against each endpoint immediately before an approved exercise.
BEGIN READ ONLY;
SET LOCAL statement_timeout='5s';
SET LOCAL lock_timeout='2s';
SELECT jsonb_build_object(
 'database',current_database(),'user',current_user,
 'systemIdentifier',(SELECT system_identifier::text FROM pg_catalog.pg_control_system()),
 'serverMajor',current_setting('server_version_num')::int / 10000,
 'ssl',COALESCE((SELECT ssl FROM pg_catalog.pg_stat_ssl WHERE pid=pg_backend_pid()),false),
 'bypassRls',(SELECT rolsuper OR rolbypassrls FROM pg_catalog.pg_roles WHERE rolname=current_user),
 'applicationObjects',(SELECT count(*) FROM pg_catalog.pg_namespace WHERE nspname='troc') + (SELECT count(*) FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname='troc_migrations')
);
ROLLBACK;
