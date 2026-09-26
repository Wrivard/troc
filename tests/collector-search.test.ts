import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {collectorMatches,collectorSql} from '../artifacts/api-server/src/modules/catalog/collector-search';
test('collector search preserves numerator, denominator, prefixes and known set identity in JS and SQL',async()=>{
 const db=new PGlite();
 const set='31ccbd06-4f93-5eac-8ba6-f86601133590';
 const cases:[string,string,string,boolean][]=[['076',set,'76/86',true],['076',set,'#076/086',true],['076',set,'76 / 86',true],['076',set,'76/87',false],['176',set,'76/86',false],['076','unknown','76/86',false],['076',set,'76',true],['TG01/TG30','unknown','TG01/TG30',true],['076/086','unknown','76/86',true],['106',set,'76/86',false]];
 try{for(const [number,id,q,want] of cases){assert.equal(collectorMatches(number,id,q),want,q);const result=await db.query<{matches:boolean}>('SELECT '+collectorSql('$1','$2','$3')+' AS matches',[number,id,q]);assert.equal(result.rows[0].matches,want,q);}}finally{await db.close();}
});
