import sharp from 'sharp';
import {readFileSync,writeFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {retainedRecords} from './catalog/promote-local';
const {records,manifest}=retainedRecords();
const files=new Map<string,{width:number;height:number;originalWidth:number}>();
const missing:any[]=[],faces:any[]=[];
for(const r of records){const images=r.product.images??[];if(!images.length)missing.push({id:r.product.id,provider:r.provider,externalId:r.externalId,name:r.product.name.en});
 for(const image of images){if(image.sources.length<1)throw Error('missing_rendition:'+r.sourceKey);for(const source of image.sources){if(!/^\/catalog-art\/[a-z0-9-]+\.webp$/.test(source.url))throw Error('nonlocal_artwork:'+r.sourceKey);files.set(source.url,{width:source.width,height:image.height,originalWidth:image.width});}}
 if((r.artwork?.length??0)>images.length&&images.length)faces.push({id:r.product.id,expected:r.artwork.length,actual:images.length});
}
let bytes=0,index=0;const entries=[...files];
async function check(){while(index<entries.length){const [url,expected]=entries[index++],file=resolve('artifacts/marketplace/public',url.slice(1));const metadata=await sharp(file).metadata();if(metadata.width!==expected.width||metadata.format!=='webp')throw Error('invalid_rendition:'+url);if(Math.abs(metadata.height!-expected.height*expected.width/expected.originalWidth)>1.1)throw Error('distorted_artwork:'+url);bytes+=statSync(file).size;}}
await Promise.all(Array.from({length:8},()=>check()));
const evidence={checkedAt:new Date().toISOString(),revision:manifest.revision,products:records.length,illustrated:records.length-missing.length,missingCount:missing.length,missing,partialFaces:faces,renditions:files.size,bytes,localOnly:true,allDimensionsValid:true};writeFileSync('docs/evidence/catalog-scale/artwork-coverage.json',JSON.stringify(evidence,null,2));console.log({...evidence,missing:undefined,partialFaces:faces.length});
