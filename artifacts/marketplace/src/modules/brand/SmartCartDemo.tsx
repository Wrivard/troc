import { useId, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { SmartCartComparison } from "@workspace/troc-design-system/components/ui/marketplace-compositions";

/** Isolated illustrative walkthrough. Never reads or writes a buyer's cart. */
export function SmartCartDemo({
  locale,
  catalogHref,
}: {
  locale: "en" | "fr";
  catalogHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const id = useId();
  const fr = locale === "fr";
  const c = (en: string, french: string) => (fr ? french : en);
  const steps = [
    {
      title: c("1. Original basket", "1. Panier initial"),
      text: c(
        "Three sellers, three shipments. In this example, $6.75 in cards plus $7.50 in shipping totals $14.25 before tax.",
        "Trois vendeurs, trois envois. Dans cet exemple, 6,75 $ de cartes et 7,50 $ de livraison donnent un total de 14,25 $ avant taxes.",
      ),
    },
    {
      title: c("2. Consolidated example", "2. Exemple regroupé"),
      text: c(
        "One seller ships the selection together. Cards cost $0.47 more, but shipping costs $3.50 less: the total falls by $3.03 to $11.22 before tax.",
        "Un vendeur expédie la sélection ensemble. Les cartes coûtent 0,47 $ de plus, mais la livraison coûte 3,50 $ de moins : le total baisse de 3,03 $, à 11,22 $ avant taxes.",
      ),
    },
    {
      title: c("3. Review the tradeoffs", "3. Vérifier les compromis"),
      text: c(
        "A real proposal requires reviewing each seller, card printing, language, condition and quantity, as well as seller minimums and shipping. This illustration contains no specific offers or condition substitutions. You choose whether to apply a real proposal; savings are not guaranteed.",
        "Une vraie proposition exige de vérifier chaque vendeur, l’impression, la langue, l’état et la quantité des cartes, ainsi que les minimums et la livraison. Cette illustration ne contient aucune offre précise ni substitution d’état. Vous choisissez d’appliquer ou non une vraie proposition; les économies ne sont pas garanties.",
      ),
    },
  ];
  return (
    <section
      className="troc-smart-demo grid gap-6"
      aria-labelledby={`${id}-title`}
    >
      <div className="grid gap-3">
        <p className="troc-editorial-eyebrow">
          {c("ILLUSTRATIVE EXAMPLE · CAD", "EXEMPLE ILLUSTRATIF · CAD")}
        </p>
        <h2 id={`${id}-title`} className="text-2xl font-semibold">
          {c(
            "See how a better total comes together.",
            "Découvrez comment réduire le total.",
          )}
        </h2>
        <p className="text-muted-foreground">
          {c(
            "Explore a sample comparison before choosing your cards. These are illustrative amounts, before tax, not current offers. Your cart stays unchanged.",
            "Explorez une comparaison avant de choisir vos cartes. Les montants sont illustratifs, avant taxes, et ne sont pas des offres actuelles. Votre panier reste inchangé.",
          )}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            aria-expanded={open}
            aria-controls={`${id}-example`}
            onClick={() => setOpen(!open)}
          >
            {open
              ? c("Close example", "Fermer l’exemple")
              : c("Explore an example", "Explorer un exemple")}
          </Button>
          <Button variant="outline" asChild>
            <a href={catalogHref}>
              {c("Browse cards", "Magasiner des cartes")}
            </a>
          </Button>
        </div>
      </div>
      <div id={`${id}-example`} hidden={!open}>
        {open && (
          <div className="grid gap-6">
            <SmartCartComparison
              before={{ cards: 675, shipping: 750, sellers: 3 }}
              after={{ cards: 722, shipping: 400, sellers: 1 }}
              locale={locale}
              labels={{
                before: c("ORIGINAL BASKET", "PANIER INITIAL"),
                after: c("CONSOLIDATED EXAMPLE", "EXEMPLE REGROUPÉ"),
                cards: c("Cards", "Cartes"),
                shipping: c("Shipping", "Livraison"),
                sellers: c("seller(s)", "vendeur(s)"),
                save: c(
                  "ILLUSTRATED TOTAL SAVING",
                  "ÉCONOMIE TOTALE ILLUSTRÉE",
                ),
                explanation: c(
                  "Cards +$0.47 · shipping −$3.50. Compare the total, not just card prices.",
                  "Cartes +0,47 $ · livraison −3,50 $. Comparez le total, pas seulement le prix des cartes.",
                ),
              }}
              note={c(
                "Before tax. Assumes the same quantities can be grouped with one seller at the illustrated costs; availability and eligibility are not checked in this example.",
                "Avant taxes. On suppose que les mêmes quantités peuvent être regroupées chez un vendeur aux coûts illustrés; la disponibilité et l’admissibilité ne sont pas vérifiées dans cet exemple.",
              )}
            />
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={c(
                "Explore the comparison",
                "Explorer la comparaison",
              )}
            >
              {steps.map((item, index) => (
                <Button
                  key={index}
                  variant={step === index ? "default" : "outline"}
                  aria-pressed={step === index}
                  aria-controls={`${id}-explanation`}
                  onClick={() => setStep(index)}
                >
                  {item.title}
                </Button>
              ))}
            </div>
            <div
              id={`${id}-explanation`}
              className="grid gap-2"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <h3 className="text-lg font-semibold">{steps[step].title}</h3>
              <p className="text-muted-foreground">{steps[step].text}</p>
            </div>
            <div>
              <Button variant="outline" onClick={() => setStep(0)}>
                {c("Reset example", "Réinitialiser l’exemple")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
