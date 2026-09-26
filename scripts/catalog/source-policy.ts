export type SourcePolicy={sources:Record<string,{metadata:{local:boolean;production:boolean;evidence:string[]};artwork:{local:boolean;production:boolean;evidence?:string[]};attribution?:string}>};
export function assertSources(records:readonly {provider:string;product:{images?:unknown[]}}[],policy:SourcePolicy,environment:'local'|'production',includeImages:boolean){
 for(const record of records){const rule=policy.sources[record.provider];if(!rule?.metadata?.[environment]||!rule.metadata.evidence?.length)throw Error('metadata_source_unapproved:'+record.provider);if(includeImages&&record.product.images?.length&&(!rule.artwork?.[environment]||!rule.artwork.evidence?.length))throw Error('artwork_source_unapproved:'+record.provider);}
}
