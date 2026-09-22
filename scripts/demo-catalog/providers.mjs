import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
const cache = new URL("../../tmp/catalog-cache/", import.meta.url);
const allowed = new Set(["api.tcgdex.net","assets.tcgdex.net","api.scryfall.com","cards.scryfall.io","db.ygoprodeck.com","images.ygoprodeck.com"]);
/** Bounded operator-only downloads, cached across reruns. No runtime provider traffic. */
export async function cached(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowed.has(parsed.hostname)) throw new Error("unapproved_provider_host");
  await mkdir(cache,{recursive:true});
  const path = new URL(createHash("sha256").update(url).digest("hex"),cache);
  try { return await readFile(path); } catch(error) { if(error.code!=="ENOENT") throw error; }
  await delay(150); // More conservative than either approved API's request limit.
  const response = await fetch(url,{headers:{"User-Agent":"TROC-DemoDevelopment/1.0 (bounded development sample)",Accept:"application/json,image/*"},signal:AbortSignal.timeout(30000)});
  if(!response.ok) throw new Error(`provider_response_${response.status}: ${url}`);
  const body=Buffer.from(await response.arrayBuffer());
  if(body.length>12_000_000) throw new Error("provider_response_too_large");
  await writeFile(path,body);return body;
}
const json=async url=>JSON.parse((await cached(url)).toString());
export class TcgdexDemoProvider {
  id="tcgdex";game="pokemon";
  async records() {
    const selections=[...Array.from({length:24},(_,i)=>["en",`sv03.5-${String(i+1).padStart(3,"0")}`]),...['173','199','200','201','202'].map(n=>['en',`sv03.5-${n}`]),...Array.from({length:16},(_,i)=>['en',`sv03-${String(i+1).padStart(3,'0')}`]),...['001','004','007','025','006'].map(n=>['ja',`SV2a-${n}`])];
    const result=[];
    for(const [language,id] of selections) {
      const sourceUrl=`https://api.tcgdex.net/v2/${language}/cards/${id}`;
      const card=await json(sourceUrl);if(!card.image) throw new Error('missing_tcgdex_art:'+id);
      result.push({externalId:card.id,name:card.name,language,setId:card.set.id,setName:card.set.name,number:card.localId,rarity:card.rarity??'',artist:card.illustrator??'',releasedOn:null,sourceUrl,
        variants:Object.entries(card.variants??{normal:true}).filter(([key,value])=>value&&['normal','holo','reverse','firstEdition'].includes(key)).map(([key])=>key),
        images:[{side:'front',high:card.image+'/high.webp',low:card.image+'/low.webp'}]});
    }
    return result;
  }
}
export class ScryfallDemoProvider {
  id="scryfall";game="magic";
  async records() {
    const groups=[['set:m11 game:paper lang:en',18],['set:neo game:paper lang:en',17],['(name:"Black Lotus" or name:"Sol Ring" or name:"Lightning Bolt" or name:"Sheoldred, the Apocalypse" or name:"The One Ring" or name:"Fable of the Mirror-Breaker" or name:"Delver of Secrets" or name:"Counterspell" or name:"Birds of Paradise" or name:"Llanowar Elves") game:paper lang:en',10],['set:neo lang:ja game:paper',5]];
    const result=new Map();
    for(const [query,count] of groups) {
      const page=await json('https://api.scryfall.com/cards/search?unique=cards&order=name&q='+encodeURIComponent(query));
      for(const card of page.data.filter(c=>c.image_uris||c.card_faces?.some(f=>f.image_uris)).slice(0,count)) {
        const faces=card.image_uris?[{image_uris:card.image_uris}]:card.card_faces;
        result.set(card.id,{externalId:card.id,name:card.printed_name??card.name,language:card.lang,setId:card.set,setName:card.set_name,number:card.collector_number,rarity:card.rarity,artist:card.artist??'',releasedOn:card.released_at,sourceUrl:card.uri,
          variants:card.finishes.filter(v=>['nonfoil','foil','etched'].includes(v)),images:faces.filter(f=>f.image_uris).map((f,i)=>({side:i?'back':'front',high:f.image_uris.normal}))});
      }
    }
    return [...result.values()].slice(0,60);
  }
}
export class YgoprodeckDemoProvider {
  id="ygoprodeck";game="yu-gi-oh";
  async records() {
    const result=new Map();
    for(const term of ['Dragon','Magician','HERO','Blue-Eyes']) {
      const page=await json('https://db.ygoprodeck.com/api/v7/cardinfo.php?num=15&offset=0&fname='+encodeURIComponent(term));
      for(const card of page.data) {
        const set=card.card_sets?.find(s=>s.set_code.includes('EN'))??card.card_sets?.[0];
        if(!set||!card.card_images?.length) continue;
        result.set(String(card.id),{externalId:String(card.id),name:card.name,language:'en',setId:set.set_name,setName:set.set_name,number:set.set_code,rarity:set.set_rarity,artist:'',releasedOn:null,sourceUrl:card.ygoprodeck_url,
          // Provider images are card-level references, not assertions of exact set-stamp/edition art.
          variants:['standard'],images:[{side:'front',high:card.card_images[0].image_url}],artworkScope:'card-reference'});
      }
    }
    return [...result.values()].slice(0,60);
  }
}
