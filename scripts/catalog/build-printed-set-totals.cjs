// Rebuild search metadata from retained, hash-verified provider set responses.
// Does not open the live account database, publish a release or change identities.
const fs=require('node:fs'),crypto=require('node:crypto'),{DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('catalog-data/acquisition.sqlite',{readOnly:true});
try {
 const current=JSON.parse(fs.readFileSync('catalog-data/current.json'));
 const records=fs.readFileSync('catalog-data/releases/'+current.revision+'/records.jsonl','utf8').trim().split('\n').map(JSON.parse);
 const totals={};
 for(const record of records.filter(record=>record.provider==='tcgdex')) {
  const lang=record.sourceKey.split(':').at(-1),sid=record.externalId.replace(/-[^-]+$/,'');
  const url='https://api.tcgdex.net/v2/'+lang+'/sets/'+sid;
  if(totals[record.set.id]) {if(totals[record.set.id].sourceUrl!==url)throw Error('ambiguous set identity');continue;}
  const row=db.prepare('select sha256 from responses where url=?').get(url);if(!row)continue;
  const bytes=fs.readFileSync('catalog-data/raw/'+row.sha256);
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==row.sha256)throw Error('source hash mismatch');
  const data=JSON.parse(bytes);
  if(data.id!==sid||!Number.isSafeInteger(data.cardCount?.official)||data.cardCount.official<=0)continue;
  if(!data.cards.some(card=>card.id===record.externalId&&card.localId===record.product.variants[0].number))throw Error('source/card identity mismatch');
  totals[record.set.id]={total:data.cardCount.official,sourceUrl:url,sha256:row.sha256};
 }
 fs.writeFileSync('artifacts/api-server/src/modules/catalog/printed-set-totals.json',JSON.stringify(totals,null,2)+'\n');
 console.log('Verified printed totals:',Object.keys(totals).length);
} finally {db.close();}
