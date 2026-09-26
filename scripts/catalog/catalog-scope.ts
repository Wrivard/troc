export function physicalCatalogueRecord(record:{provider:string;sourceUrl?:string}) {
 if(record.provider!=='tcgdex')return true;
 try{return !decodeURIComponent(record.sourceUrl??'').includes('/Pokémon TCG Pocket/');}catch{return false;}
}
