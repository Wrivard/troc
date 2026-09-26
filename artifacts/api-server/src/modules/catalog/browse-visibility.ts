import hidden from './temporary-hidden-products.json';
/** Local preview discovery only. Direct records, orders, stock and identity baselines remain intact. */
export function browseVisibilitySql(alias='p'){
 if(!/^[a-z]+$/.test(alias))throw Error('invalid_sql_alias');
 if(process.env.TROC_LOCAL_ACCOUNTS!=='true'||process.env.TROC_SHOW_MISSING_ARTWORK==='true')return 'true';
 if(hidden.productIds.some(id=>!/^[-a-f0-9]{36}$/.test(id)))throw Error('invalid_visibility_manifest');
 return alias+".id <> ALL(ARRAY["+hidden.productIds.map(id=>"'"+id+"'").join(',')+"]::uuid[])";
}
