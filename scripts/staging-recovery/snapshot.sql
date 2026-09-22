-- Operator-run read-only evidence. psql -X -qAt -v ON_ERROR_STOP=1 -f snapshot.sql
-- Capture under a quiesced source window; source snapshot must describe the dump.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '2s';
SET LOCAL timezone = 'UTC';
SET LOCAL datestyle = 'ISO, YMD';
SET LOCAL extra_float_digits = 3;
SET LOCAL search_path = pg_catalog;
SELECT jsonb_build_object('kind','identity','value',jsonb_build_object(
  'database',current_database(),'user',current_user,
  'systemIdentifier',(SELECT system_identifier::text FROM pg_control_system()),
  'serverMajor',current_setting('server_version_num')::int / 10000,
  'ssl',COALESCE((SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()),false),
  'bypassRls',(SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname=current_user)));

SELECT jsonb_build_object('kind','schema','value',jsonb_build_object(
 'tables',(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'forceRls',c.relforcerowsecurity) ORDER BY c.relname) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='troc' AND c.relkind='r'),
 'columns',(SELECT jsonb_agg(to_jsonb(x) ORDER BY table_name,ordinal_position) FROM (SELECT table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='troc') x),
 'constraints',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tab,name) FROM (SELECT c.relname tab,k.conname name,k.convalidated validated,pg_get_constraintdef(k.oid) definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='troc') x),
 'indexes',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tablename,indexname) FROM (SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='troc') x),
 'triggers',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tab,name) FROM (SELECT c.relname tab,t.tgname name,t.tgenabled enabled,pg_get_triggerdef(t.oid) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='troc' AND NOT t.tgisinternal) x),
 'functions',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name,definition) FROM (SELECT p.proname name,pg_get_functiondef(p.oid) definition,p.proacl::text acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='troc') x),
 'policies',(SELECT jsonb_agg(to_jsonb(x) ORDER BY tablename,policyname) FROM (SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='troc') x),
 'grants',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name) FROM (SELECT c.relname name,c.relacl::text acl,pg_get_userbyid(c.relowner) owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='troc' AND c.relkind IN ('r','S') UNION ALL SELECT c.relname||'.'||a.attname,a.attacl::text,pg_get_userbyid(c.relowner) FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='troc' AND a.attnum>0 AND NOT a.attisdropped) x),
 'security',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name) FROM (SELECT 'schema:'||nspname name,jsonb_build_object('acl',nspacl::text,'owner',pg_get_userbyid(nspowner)) value FROM pg_namespace WHERE nspname IN ('troc','extensions') UNION ALL SELECT 'role:'||rolname,jsonb_build_object('super',rolsuper,'login',rolcanlogin,'bypass',rolbypassrls,'createDb',rolcreatedb,'createRole',rolcreaterole) FROM pg_roles WHERE rolname IN ('troc_backend','anon','authenticated') UNION ALL SELECT 'extension:'||extname,jsonb_build_object('schema',n.nspname,'version',e.extversion) FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm') x)
));
SELECT jsonb_build_object('kind','ledger','value',(SELECT jsonb_agg(to_jsonb(x) ORDER BY name) FROM (SELECT name,checksum FROM public.troc_migrations) x));
SELECT jsonb_build_object('kind','invariants','value',jsonb_build_object(
 'ownerlessActiveSellers',(SELECT count(*) FROM troc.seller_accounts a WHERE a.status='active' AND NOT EXISTS(SELECT 1 FROM troc.seller_members m WHERE m.seller_id=a.id AND m.role='owner')),
 'negativeInventory',(SELECT count(*) FROM troc.listings WHERE quantity<0),
 'invalidConstraints',(SELECT count(*) FROM pg_constraint k JOIN pg_namespace n ON n.oid=k.connamespace WHERE n.nspname='troc' AND NOT k.convalidated)
));
-- Order-independent content fingerprints, without exporting individual rows/PII.
-- Two signed 64-bit sums are corruption checks, not a cryptographic backup proof.
SELECT format('SELECT jsonb_build_object(''kind'',''row'',''value'',jsonb_build_object(''table'',%L,''count'',count(*)::text,''hash1'',COALESCE(sum((''x''||substr(h,1,16))::bit(64)::bigint),0)::text,''hash2'',COALESCE(sum((''x''||substr(h,17,16))::bit(64)::bigint),0)::text)) FROM (SELECT md5(to_jsonb(t)::text) h FROM %I.%I t) s;',c.relname,n.nspname,c.relname)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='troc' AND c.relkind='r' ORDER BY c.relname
\gexec
ROLLBACK;
