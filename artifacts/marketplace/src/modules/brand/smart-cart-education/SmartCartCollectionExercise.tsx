import { useId, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Checkbox } from "@workspace/troc-design-system/components/ui/selection-controls";
import { CardImage } from "@workspace/troc-design-system/components/ui/product-presentation";
import "./smart-cart-collection-exercise.css";
export interface CollectionExerciseCard {
  id: string;
  name: string;
  number: string;
  imageUrl: string;
  exampleCents: number;
}
/** Educational local state only. No cart, collection, offer or optimizer access. */
export function SmartCartCollectionExercise({
  locale,
  setTitle,
  cards,
}: {
  locale: "en" | "fr";
  setTitle: string;
  cards: readonly CollectionExerciseCard[];
}) {
  const fr = locale === "fr",
    id = useId();
  const [budget, setBudget] = useState(450),
    [selected, setSelected] = useState<string[]>([]),
    [chosen, setChosen] = useState(false);
  const sample = cards.slice(0, 4),
    owned = sample[0]?.id,
    missing = sample.filter((card) => card.id !== owned);
  const selectedCards = missing.filter((card) => selected.includes(card.id));
  const subtotal = selectedCards.reduce(
      (sum, card) => sum + card.exampleCents,
      0,
    ),
    shipping = selectedCards.length ? 400 : 0,
    total = subtotal + shipping;
  const money = (cents: number) =>
    new Intl.NumberFormat(`${locale}-CA`, {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  const choose = () => {
    let remaining = budget - 400;
    const next: string[] = [];
    for (const card of [...missing].sort(
      (a, b) => a.exampleCents - b.exampleCents,
    )) {
      if (card.exampleCents <= remaining) {
        next.push(card.id);
        remaining -= card.exampleCents;
      }
    }
    setSelected(next);
    setChosen(true);
  };
  return (
    <section
      className="troc-collection-exercise"
      aria-labelledby={`${id}-title`}
    >
      <header>
        <p className="troc-collection-exercise-kicker">
          {fr
            ? "AUTRE EXEMPLE · COLLECTION SIMULÉE"
            : "ANOTHER EXAMPLE · SIMULATED COLLECTION"}
        </p>
        <h2 id={`${id}-title`}>
          {fr
            ? "Choisir quelques cartes manquantes."
            : "Choose a few missing cards."}
        </h2>
        <p>
          {fr
            ? "Explorez un extrait de quatre cartes avec une carte déjà possédée dans l’exemple. Cette simulation est distincte de la comparaison ci-dessus; elle ne lit ni ne modifie votre collection ou votre panier."
            : "Explore a four-card excerpt with one card already owned in the example. This simulation is separate from the comparison above; it never reads or changes your collection or cart."}
        </p>
      </header>
      <div className="troc-collection-exercise-layout">
        <div>
          <p className="troc-collection-exercise-set">
            {setTitle}{" "}
            <span>
              ·{" "}
              {fr
                ? "Extrait, pas l’extension complète"
                : "Excerpt, not the complete set"}
            </span>
          </p>
          <div className="troc-collection-exercise-cards">
            {sample.map((card) => {
              const isOwned = card.id === owned,
                isSelected = selected.includes(card.id);
              return (
                <label
                  key={card.id}
                  className="troc-collection-exercise-card"
                  data-missing={!isOwned && !isSelected}
                  data-selected={isSelected}
                >
                  <span
                    className="troc-collection-exercise-art"
                    aria-hidden="true"
                  >
                    <CardImage
                      src={card.imageUrl}
                      alt=""
                      missingLabel={
                        fr ? "Visuel indisponible" : "Artwork unavailable"
                      }
                    />
                  </span>
                  <strong>{card.name}</strong>
                  <small>#{card.number}</small>
                  <span className="troc-collection-exercise-card-status">
                    {isOwned
                      ? fr
                        ? "Possédée dans l’exemple"
                        : "Owned in example"
                      : isSelected
                        ? fr
                          ? "Sélectionnée"
                          : "Selected"
                        : fr
                          ? "Manquante"
                          : "Missing"}
                  </span>
                  <span className="troc-collection-exercise-check">
                    <Checkbox
                      checked={isOwned || isSelected}
                      disabled={isOwned}
                      onCheckedChange={(value) => {
                        setChosen(false);
                        setSelected((previous) =>
                          value === true
                            ? [
                                ...previous.filter((item) => item !== card.id),
                                card.id,
                              ]
                            : previous.filter((item) => item !== card.id),
                        );
                      }}
                      aria-label={`${fr ? "Sélectionner" : "Select"} ${card.name}`}
                    />
                    <span>
                      {isOwned
                        ? fr
                          ? "Déjà possédée"
                          : "Already owned"
                        : money(card.exampleCents)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="troc-collection-exercise-budget">
          <label htmlFor={`${id}-budget`}>
            {fr ? "Budget de l’exemple (CAD)" : "Example budget (CAD)"}
            <output>{money(budget)}</output>
          </label>
          <input
            id={`${id}-budget`}
            type="range"
            min={0}
            max={800}
            step={25}
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
            aria-valuetext={money(budget)}
          />
          <Button type="button" variant="secondary" onClick={choose}>
            {fr
              ? "Choisir un exemple adapté au budget"
              : "Choose an example within budget"}
          </Button>
          <p className="troc-collection-exercise-note">
            {fr
              ? "L’exemple choisit les cartes manquantes affichées les moins chères après une livraison fixe de 4 $. Ce n’est pas un résultat de Smart Cart."
              : "This example chooses the cheapest shown missing cards after a fixed $4 delivery allowance. This is not a Smart Cart result."}
          </p>
          <dl>
            <div>
              <dt>
                {fr ? "Cartes sélectionnées" : "Selected cards"} (
                {selectedCards.length})
              </dt>
              <dd data-exercise-subtotal>{money(subtotal)}</dd>
            </div>
            <div>
              <dt>{fr ? "Livraison illustrée" : "Illustrated shipping"}</dt>
              <dd>{money(shipping)}</dd>
            </div>
            <div>
              <dt>{fr ? "Total avant taxes" : "Total before tax"}</dt>
              <dd data-exercise-total>{money(total)}</dd>
            </div>
          </dl>
          <p
            role="status"
            aria-atomic="true"
            className="troc-collection-exercise-result"
          >
            {!selectedCards.length
              ? chosen
                ? fr
                  ? "Aucune carte de cet exemple ne respecte le budget après livraison."
                  : "No cards in this example fit the budget after shipping."
                : fr
                  ? "Sélectionnez des cartes manquantes ou essayez le budget."
                  : "Select missing cards or try the budget."
              : total > budget
                ? fr
                  ? `Le total dépasse le budget de ${money(total - budget)}. Retirez une carte ou ajustez le budget.`
                  : `The total is ${money(total - budget)} over budget. Remove a card or adjust the budget.`
                : fr
                  ? `${selectedCards.length} carte(s) sélectionnée(s); ${money(budget - total)} restant avant taxes.`
                  : `${selectedCards.length} selected; ${money(budget - total)} remaining before tax.`}
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setBudget(450);
              setSelected([]);
              setChosen(false);
            }}
          >
            {fr ? "Réinitialiser cet exemple" : "Reset this example"}
          </Button>
        </div>
      </div>
      <p className="troc-collection-exercise-limit">
        {fr
          ? "Prix et propriété fictifs. Aucun stock, minimum vendeur, état, devis ou taxe n’est vérifié. Une vraie proposition doit respecter vos critères et peut ne rien améliorer. Rien n’est acheté ni ajouté au panier. Les alertes et l’achat automatique ne font pas partie de cette démonstration."
          : "Fictional prices and ownership. No stock, seller minimum, condition, quote or tax is checked. A real proposal must respect your criteria and may offer no improvement. Nothing is purchased or added to the cart. Alerts and automatic purchasing are not part of this demonstration."}
      </p>
    </section>
  );
}
