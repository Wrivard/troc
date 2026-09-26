import { SmartCartCollectionExercise } from './SmartCartCollectionExercise';
import examples from '../smart-cart-feature/example-cards.json';
export default function CollectionExample({locale}:{locale:'en'|'fr'}) {return <SmartCartCollectionExercise locale={locale} setTitle={examples.setTitle[locale]} cards={examples.cards.map(card=>({...card,name:card.name[locale]}))}/>;}
