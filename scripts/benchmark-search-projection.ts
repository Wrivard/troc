import {PGlite} from '@electric-sql/pglite';
import {pg_trgm} from '@electric-sql/pglite/contrib/pg_trgm';
import {writeFile} from 'node:fs/promises';
// ISOLATED generated index workload; never connected to live catalogue or inventory.
const db=new PGlite({extensions:{pg_trgm}});const evidence:any[]=[];
try {
 await db.exec('CREATE EXTENSION pg_trgm; CREATE TABLE search_scale(id integer PRIMARY KEY,hay text NOT NULL,collector_key text NOT NULL); CREATE INDEX search_scale_hay ON search_scale USING gin(hay gin_trgm_ops); CREATE INDEX search_scale_number ON search_scale(collector_key,id);');
 let previous=0;
 for(const count of [100000,250000,1000000]){
  const start=performance.now();
  await db.query("INSERT INTO search_scale SELECT i,CASE WHEN i%1000=0 THEN 'pikachu special pokemon' WHEN i%3=0 THEN 'magic printed card '||md5(i::text) ELSE 'pokemon printed card '||md5(i::text) END,(i%1000)::text FROM generate_series($1::int,$2::int)i",[previous+1,count]);
  await db.exec("SELECT gin_clean_pending_list('search_scale_hay'::regclass); ANALYZE search_scale");previous=count;
  console.log('Indexed',count,'rows in',Math.round(performance.now()-start),'ms');
  for(const [label,sql,values] of [
   ['selective-text',"SELECT id FROM search_scale WHERE hay LIKE $1 ORDER BY id LIMIT 4",['%pikachu%']],
   ['broad-text',"SELECT id FROM search_scale WHERE hay LIKE $1 ORDER BY id LIMIT 4",['%magic%']],
   ['short-text',"SELECT id FROM search_scale WHERE hay LIKE $1 ORDER BY id LIMIT 4",['%pi%']],
   ['collector',"SELECT id FROM search_scale WHERE collector_key=$1 ORDER BY id LIMIT 4",['76']],
   ['no-match',"SELECT id FROM search_scale WHERE hay LIKE $1 ORDER BY id LIMIT 4",['%zznomatch%']],
   ['broad-ranked',"SELECT id FROM search_scale WHERE hay LIKE $1 ORDER BY CASE WHEN hay=$2 THEN 0 WHEN hay LIKE $3 THEN 1 ELSE 2 END,hay,id LIMIT 4",['%magic%','magic','magic%']],
  ] as const){
   const runs=[];let plan:any;
   for(let i=0;i<3;i++){const t=performance.now();const r=await db.query('EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) '+sql,[...values]);runs.push(Math.round(performance.now()-t));plan=r.rows;}
   evidence.push({count,label,ms:runs,plan});console.log(count,label,runs);
  }
 }
 await writeFile('docs/evidence/performance/search-million-projection.json',JSON.stringify({environment:'Isolated generated SQL projection workload in embedded PostgreSQL; not live cards, full API or hosted concurrency certification',evidence},null,2));
}finally{await db.close();}
