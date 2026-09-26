import { useId, useState, type ReactNode } from "react";
import "./smart-cart-feature.css";

/** Educational page only. Real optimizer and comparison remain caller-owned. */
export function SmartCartFeaturePage({
  locale,
  catalogHref,
  cartHref,
  comparisonDemo,
  collectionExercise,
  children,
}: {
  locale: "en" | "fr";
  catalogHref: string;
  cartHref: string;
  comparisonDemo: ReactNode;
  collectionExercise?: ReactNode;
  children?: ReactNode;
}) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const id = useId();
  const [scenario, setScenario] = useState("basket");
  const [budget, setBudget] = useState(12);
  const money = (cents: number) =>
    new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  const steps = [
    [
      c("Choose the cards.", "Choisissez vos cartes."),
      c(
        "Start with the printing, language, condition and quantity you want. Lock a listing when that exact offer matters.",
        "Choisissez l’impression, la langue, l’état et la quantité. Verrouillez une annonce si vous tenez à cette offre précise.",
      ),
    ],
    [
      c("Compare the whole order.", "Comparez la commande complète."),
      c(
        "Card prices are only part of the total. Grouping cards with a seller can change shipping costs; seller minimums still apply.",
        "Le prix des cartes ne fait pas tout. Regrouper les cartes chez un vendeur peut modifier la livraison; les minimums vendeur restent applicables.",
      ),
    ],
    [
      c("Review. Then decide.", "Vérifiez. Puis décidez."),
      c(
        "Check the proposed sellers, quantities and any condition tradeoffs before applying a result. A better total is not guaranteed.",
        "Vérifiez les vendeurs, les quantités et les compromis d’état avant d’appliquer un résultat. Un meilleur total n’est pas garanti.",
      ),
    ],
  ];
  return (
    <div className="troc-scf">
      <header className="troc-scf-hero">
        <div>
          <p className="troc-scf-kicker">TROC / SMART CART</p>
          <h1>
            {c(
              "The cards you want. The whole order in view.",
              "Vos cartes. La commande complète en vue.",
            )}
          </h1>
          <p className="troc-scf-lead">
            {c(
              "A cheaper card can mean a more expensive basket. Compare cards and shipping together, then choose the tradeoffs that work for you.",
              "Une carte moins chère peut coûter plus cher au panier. Comparez les cartes et la livraison ensemble, puis choisissez les compromis qui vous conviennent.",
            )}
          </p>
          <div className="troc-scf-links">
            <a className="troc-scf-primary" href="#smart-cart-explore">
              {c("Explore the example", "Explorer l’exemple")}{" "}
              <span aria-hidden="true">↓</span>
            </a>
            <a href={catalogHref}>
              {c("Browse cards", "Magasiner des cartes")}{" "}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
        <figure className="troc-scf-map">
          <figcaption>
            {c(
              "ILLUSTRATED ORDER · NOT LIVE OFFERS",
              "COMMANDE ILLUSTRÉE · AUCUNE OFFRE RÉELLE",
            )}
          </figcaption>
          <div className="troc-scf-parcels" aria-hidden="true">
            {["01", "02", "03"].map((n) => (
              <div key={n}>
                <span>▱</span>
                <b>{n}</b>
              </div>
            ))}
          </div>
          <div className="troc-scf-map-line" aria-hidden="true">
            ↓
          </div>
          <div className="troc-scf-parcel" aria-hidden="true">
            <span>▱ ▱ ▱</span>
            <b>TROC</b>
          </div>
          <p>
            {c(
              "Three shipments → one grouped order",
              "Trois envois → une commande regroupée",
            )}
          </p>
          <small>
            {c(
              "Illustrative consolidation. Actual stock and seller rules determine what can be grouped.",
              "Regroupement illustratif. Les stocks et les règles vendeur déterminent les possibilités.",
            )}
          </small>
        </figure>
      </header>
      <section className="troc-scf-process" aria-labelledby={`${id}-process`}>
        <div className="troc-scf-section-heading">
          <p className="troc-scf-kicker">
            01 / {c("HOW IT WORKS", "COMMENT ÇA MARCHE")}
          </p>
          <h2 id={`${id}-process`}>
            {c(
              "Every part of the total matters.",
              "Chaque partie du total compte.",
            )}
          </h2>
        </div>
        <ol>
          {steps.map(([title, body], i) => (
            <li key={title}>
              <span className="troc-scf-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section
        id="smart-cart-explore"
        tabIndex={-1}
        className="troc-scf-explore"
        aria-labelledby={`${id}-explore`}
      >
        <p className="troc-scf-kicker">
          02 / {c("TRY THE IDEA", "EXPLOREZ LE PRINCIPE")}
        </p>
        <h2 id={`${id}-explore`}>
          {c(
            "Same cards. A different total.",
            "Les mêmes cartes. Un autre total.",
          )}
        </h2>
        {comparisonDemo}
      </section>
      <section
        className="troc-scf-scenarios"
        aria-labelledby={`${id}-scenarios`}
      >
        <div>
          <p className="troc-scf-kicker">
            03 / {c("YOUR NEXT FEW CARDS", "VOS PROCHAINES CARTES")}
          </p>
          <h2 id={`${id}-scenarios`}>
            {c("Make room for what matters.", "Faites place à l’essentiel.")}
          </h2>
          <p>
            {c(
              "Explore a budget or a collection goal using the same illustrative basket. This exercise never changes your cart or buys a card.",
              "Explorez un budget ou un objectif de collection avec le même panier illustratif. Cet exercice ne modifie jamais votre panier et n’achète aucune carte.",
            )}
          </p>
          <div
            className="troc-scf-choice"
            role="group"
            aria-label={c("Example scenario", "Scénario illustratif")}
          >
            {[
              ["basket", c("A basket", "Un panier")],
              ["collection", c("A collection", "Une collection")],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={scenario === value}
                onClick={() => setScenario(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="troc-scf-scenario-copy">
            {scenario === "collection"
              ? c(
                  "Imagine choosing the missing cards for a set, then comparing compatible offers together. Automatic collection completion and budget-driven card selection are concepts here, not active features.",
                  "Imaginez choisir les cartes manquantes d’une extension, puis comparer les offres compatibles ensemble. Compléter automatiquement une collection et sélectionner des cartes selon un budget sont ici des concepts, pas des fonctions actives.",
                )
              : c(
                  "You have chosen your cards. The example compares the same selection with three shipments or one grouped shipment; it does not add or remove cards.",
                  "Vous avez choisi vos cartes. L’exemple compare la même sélection en trois envois ou en un seul; il n’ajoute ni ne retire de cartes.",
                )}
          </p>
        </div>
        <div className="troc-scf-budget">
          <p className="troc-scf-kicker">
            {c("SIMULATED BUDGET · BEFORE TAX", "BUDGET SIMULÉ · AVANT TAXES")}
          </p>
          <label htmlFor={`${id}-budget`}>
            {c("Example budget (CAD)", "Budget illustratif (CAD)")}
            <output htmlFor={`${id}-budget`}>{money(budget * 100)}</output>
          </label>
          <input
            id={`${id}-budget`}
            type="range"
            min="8"
            max="20"
            step="1"
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
          <dl>
            <div>
              <dt>{c("Original · 3 sellers", "Initial · 3 vendeurs")}</dt>
              <dd>{money(1425)}</dd>
            </div>
            <div>
              <dt>{c("Grouped · 1 seller", "Regroupé · 1 vendeur")}</dt>
              <dd>{money(1122)}</dd>
            </div>
          </dl>
          <p role="status" aria-atomic="true">
            {budget * 100 < 1122
              ? c(
                  "Neither illustrated total fits this budget.",
                  "Aucun total illustré ne respecte ce budget.",
                )
              : budget * 100 < 1425
                ? c(
                    "Only the grouped example fits before tax.",
                    "Seul l’exemple regroupé respecte le budget avant taxes.",
                  )
                : c(
                    "Both examples fit before tax. Review the seller and shipping tradeoffs.",
                    "Les deux exemples respectent le budget avant taxes. Vérifiez les compromis de vendeur et de livraison.",
                  )}
          </p>
          <small>
            {c(
              "Fixed example: $6.75 + $7.50 versus $7.22 + $4.00. Taxes are excluded. No inventory, eligibility or delivery quote is checked.",
              "Exemple fixe : 6,75 $ + 7,50 $ contre 7,22 $ + 4,00 $. Taxes exclues. Aucun stock, critère d’admissibilité ou devis de livraison n’est vérifié.",
            )}
          </small>
          <button
            className="troc-scf-reset"
            type="button"
            onClick={() => {
              setBudget(12);
              setScenario("basket");
            }}
          >
            {c("Reset exercise", "Réinitialiser l’exercice")}
          </button>
        </div>
      </section>
      {collectionExercise}
      <section className="troc-scf-review" aria-labelledby={`${id}-review`}>
        <div>
          <p className="troc-scf-kicker">
            04 / {c("YOU KEEP THE LAST WORD", "VOUS AVEZ LE DERNIER MOT")}
          </p>
          <h2 id={`${id}-review`}>
            {c("A proposal, not a purchase.", "Une proposition, pas un achat.")}
          </h2>
          <p>
            {c(
              "Review the complete result before applying it. Smart Cart does not purchase automatically, and availability can change. When no better eligible total is found, keeping your current selection is a valid result.",
              "Vérifiez le résultat complet avant de l’appliquer. Smart Cart n’achète pas automatiquement et la disponibilité peut changer. Si aucun meilleur total admissible n’est trouvé, conserver votre sélection reste un résultat valable.",
            )}
          </p>
          <a className="troc-scf-primary" href={cartHref}>
            {c("Review my cart", "Vérifier mon panier")}{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
        <ul>
          {[
            c("Printing, language and condition", "Impression, langue et état"),
            c(
              "Quantities and available stock",
              "Quantités et stocks disponibles",
            ),
            c("Seller minimums and shipping", "Minimums vendeur et livraison"),
            c(
              "Locked listings and substitutions",
              "Annonces verrouillées et substitutions",
            ),
          ].map((label) => (
            <li key={label}>
              <span aria-hidden="true">✓</span>
              {label}
            </li>
          ))}
        </ul>
      </section>
      {children && <div className="troc-scf-live">{children}</div>}
    </div>
  );
}
