import { SmartCartFeaturePage } from './SmartCartFeaturePage';
import { SmartCartDemo } from '../SmartCartDemo';
import CollectionExample from '../smart-cart-education/CollectionExample';
export default function SmartCartEducation({locale,catalogHref,cartHref}:{locale:'en'|'fr';catalogHref:string;cartHref:string}) {
return <SmartCartFeaturePage locale={locale} catalogHref={catalogHref} cartHref={cartHref}
comparisonDemo={<SmartCartDemo locale={locale} catalogHref={catalogHref}/>}
collectionExercise={<CollectionExample locale={locale}/>}/>;
}
