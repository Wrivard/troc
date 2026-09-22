import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('platform helper migration revokes anonymous/authenticated execution and is repeatable',async()=>{
 const db=new PGlite();try{
 const sql=await readFile(new URL('../lib/db/migrations/0004_platform_function_access.sql',import.meta.url),'utf8');
 await db.exec(sql);
 await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN NULL; END $$; GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO anon,authenticated;");
 await db.exec(sql);await db.exec(sql);
 const result=await db.query<{anonymous:boolean;signed_in:boolean}>("SELECT has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') AS anonymous,has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE') AS signed_in");
 assert.deepEqual(result.rows,[{anonymous:false,signed_in:false}]);
 }finally{await db.close();}
});
