import { Button } from "@workspace/troc-design-system/components/ui/button";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import "./sell-page-details.css";
export interface SellerFeePresentation {
  commissionBps: number;
  shippingCommissionBps: number;
  promotedBps: number;
  processingBps: number;
  processingFixedCents: number;
  mode: "demo";
}
/** No fee calculation or source-of-truth configuration lives in this presentation. */
export function SellPageDetails({
  locale,
  fees,
  foundingHref,
  smartCartHref,
}: {
  locale: "en" | "fr";
  fees: SellerFeePresentation;
  foundingHref: string;
  smartCartHref: string;
}) {
  const fr = locale === "fr";
  const percent = (bps: number) =>
    new Intl.NumberFormat(`${locale}-CA`, {
      style: "percent",
      maximumFractionDigits: 2,
    }).format(bps / 10000);
  const cad = (cents: number) =>
    new Intl.NumberFormat(`${locale}-CA`, {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  return (
    <div className="troc-sell-details">
      <section className="troc-sell-canada" aria-labelledby="sell-canada">
        <div>
          <p className="troc-sell-eyebrow">
            {fr ? "PENSÉ POUR LE CANADA" : "BUILT AROUND CANADA"}
          </p>
          <h2 id="sell-canada">
            {fr
              ? "Vos cartes, plus près des collectionneurs."
              : "Your cards, closer to collectors."}
          </h2>
          <p>
            {fr
              ? "Des prix en dollars canadiens, une expérience en français et en anglais, et une livraison entre vendeurs et acheteurs au Canada. Les petites cartes ont leur place dans un panier de plusieurs cartes."
              : "Prices in Canadian dollars, an English and French experience, and shipping between sellers and buyers in Canada. Everyday singles have a place in a multi-card basket."}
          </p>
          <Button asChild variant="secondary">
            <a href={smartCartHref}>
              {fr ? "Comprendre Smart Cart" : "Understand Smart Cart"}
              <EditorialIcon name="forward" />
            </a>
          </Button>
        </div>
        <ul>
          <li>
            <EditorialIcon name="coin" />
            <div>
              <strong>CAD</strong>
              <span>
                {fr
                  ? "Une devise commune pour les prix et les commandes."
                  : "One currency for prices and orders."}
              </span>
            </div>
          </li>
          <li>
            <EditorialIcon name="language" />
            <div>
              <strong>
                {fr ? "Français et anglais" : "English and French"}
              </strong>
              <span>
                {fr
                  ? "La langue d’une carte reste un choix distinct."
                  : "A card’s language remains a separate choice."}
              </span>
            </div>
          </li>
          <li>
            <EditorialIcon name="package" />
            <div>
              <strong>
                {fr
                  ? "Plusieurs cartes, un envoi vendeur"
                  : "More cards, one seller shipment"}
              </strong>
              <span>
                {fr
                  ? "Le regroupement respecte le stock, les critères et les minimums applicables; aucune vente n’est garantie."
                  : "Consolidation respects stock, preferences and applicable minimums; sales are never guaranteed."}
              </span>
            </div>
          </li>
        </ul>
      </section>
      <section className="troc-sell-process" aria-labelledby="sell-process">
        <p className="troc-sell-eyebrow">
          {fr ? "LE PARCOURS VENDEUR" : "THE SELLER JOURNEY"}
        </p>
        <h2 id="sell-process">
          {fr
            ? "Une boutique se construit étape par étape."
            : "Build your store, step by step."}
        </h2>
        <p>
          {fr
            ? "Ce parcours décrit le fonctionnement prévu. L’accès dépend de l’examen de votre candidature et de l’ouverture des fonctions concernées."
            : "This describes the intended flow. Access depends on application review and availability of the relevant features."}
        </p>
        <ol>
          {[
            [
              fr ? "Présentez votre activité" : "Introduce your business",
              fr
                ? "Préparez les renseignements de votre boutique. Un compte acheteur ne donne pas automatiquement le droit de vendre."
                : "Prepare your store details. A buyer account does not automatically grant permission to sell.",
            ],
            [
              fr ? "Préparez votre inventaire" : "Prepare your inventory",
              fr
                ? "Associez chaque carte au catalogue, puis vérifiez quantité, langue, état et prix. La publication exige les permissions vendeur."
                : "Match each card to the catalog, then review quantity, language, condition and price. Publishing requires seller permissions.",
            ],
            [
              fr ? "Préparez vos commandes" : "Fulfil your orders",
              fr
                ? "Vérifiez les cartes commandées et les consignes de livraison avant l’envoi. Les outils de démonstration ne déclenchent aucun paiement réel."
                : "Check ordered cards and shipping instructions before dispatch. Demo tools do not trigger real payments.",
            ],
          ].map(([title, body], i) => (
            <li key={title}>
              <span className="troc-sell-step">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="troc-sell-fees" aria-labelledby="sell-fees">
        <div>
          <p className="troc-sell-eyebrow">
            {fr ? "CONFIGURATION DE DÉMONSTRATION" : "DEMO CONFIGURATION"}
          </p>
          <h2 id="sell-fees">
            {fr
              ? "Comprendre ce qui est facturé."
              : "Understand what gets charged."}
          </h2>
          <p>
            {fr
              ? "Ces taux reflètent la configuration actuelle de la démonstration. Aucun paiement réel n’est traité ici. Les frais de traitement sont présentés séparément."
              : "These rates reflect the current demo configuration. No real payment is processed here. Processing fees are shown separately."}
          </p>
        </div>
        <dl>
          <div>
            <dt>
              {fr ? "Commission sur les cartes" : "Commission on cards"}
              <small>
                {fr
                  ? "Sur les marchandises après remises."
                  : "On merchandise after discounts."}
              </small>
            </dt>
            <dd data-fee="commission">{percent(fees.commissionBps)}</dd>
          </div>
          <div>
            <dt>
              {fr ? "Commission sur la livraison" : "Commission on shipping"}
            </dt>
            <dd data-fee="shipping">{percent(fees.shippingCommissionBps)}</dd>
          </div>
          <div>
            <dt>
              {fr
                ? "Annonce promue (facultative)"
                : "Promoted listing (optional)"}
              <small>
                {fr
                  ? "Supplément sur les marchandises promues après remises."
                  : "Additional commission on promoted merchandise after discounts."}
              </small>
            </dt>
            <dd data-fee="promoted">+{percent(fees.promotedBps)}</dd>
          </div>
          <div>
            <dt>
              {fr
                ? "Traitement du paiement (simulation)"
                : "Payment processing (simulation)"}
              <small>
                {fr
                  ? "Sur le total du paiement, réparti entre les commandes vendeur. La part fixe ne s’applique pas à chaque carte."
                  : "On the checkout total, allocated across seller orders. The fixed part is not charged per card."}
              </small>
            </dt>
            <dd data-fee="processing">
              {percent(fees.processingBps)} + {cad(fees.processingFixedCents)}
            </dd>
          </div>
        </dl>
        <p className="troc-sell-fee-note">
          {fr
            ? "Le modèle prévu ne facture ni la création d’une annonce ni des frais de service acheteur. Les modalités de traitement et les taxes applicables devront être confirmées avant l’activation des paiements réels."
            : "The planned model has no listing fee or buyer service fee. Processing terms and applicable taxes must be confirmed before real payments are activated."}
        </p>
      </section>
      <section className="troc-sell-founder" aria-labelledby="sell-founder">
        <div>
          <p className="troc-sell-eyebrow">
            {fr ? "VENDEURS FONDATEURS" : "FOUNDING SELLERS"}
          </p>
          <h2 id="sell-founder">
            {fr
              ? "Participez aux débuts de TROC."
              : "Help shape the start of TROC."}
          </h2>
          <p>
            {fr
              ? "Découvrez le programme, son statut et le parcours de candidature. Consulter le programme ne vous inscrit pas et ne garantit pas votre approbation."
              : "Explore the program, its status and the application path. Viewing the program does not enrol you or guarantee approval."}
          </p>
        </div>
        <Button asChild>
          <a href={foundingHref}>
            {fr ? "Découvrir le programme" : "Explore the program"}
            <EditorialIcon name="arrow" />
          </a>
        </Button>
      </section>
    </div>
  );
}
