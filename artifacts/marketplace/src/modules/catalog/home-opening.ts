import type {Locale,PublicPage} from '@workspace/catalog';
/** Static home content has no dependency on inventory. No offers/counts are fabricated. */
export function homeOpening(locale:Locale):PublicPage{return {
 kind:'home',path:'/',locale,demo:import.meta.env.DEV,
 filters:{q:'',game:'',set:'',type:'',language:'',variant:'',rarity:'',condition:'',seller:'',min:null,max:null,sort:'name',cursor:'',limit:12},
 games:[],sets:[],sellers:[],results:[],offers:[],prices:[],nextCursor:null,offerPage:1,offerLimit:12,offerSort:'price_asc',nextOfferPage:null
};}

