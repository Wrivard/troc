import { useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { helpArticles } from "./help-content";
import "./help-guide.css";

const scenarios = [
  [
    "compare-offers",
    "I want to compare seller offers",
    "Je veux comparer les offres",
  ],
  [
    "account-access",
    "I need help accessing my account",
    "J’ai besoin d’aide pour accéder à mon compte",
  ],
  [
    "buyer-order-help",
    "I have a purchase or card question",
    "J’ai une question sur un achat ou une carte",
  ],
  [
    "csv",
    "My inventory import needs attention",
    "Mon importation demande une vérification",
  ],
  ["shipping", "I need to ship an order", "Je dois expédier une commande"],
  ["payout-timing", "Where is my payout?", "Où est mon versement ?"],
  [
    "draft-recovery",
    "I could not save my changes",
    "Je n’ai pas pu enregistrer mes changements",
  ],
] as const;

export function HelpGuide({
  fr,
  openArticle,
}: {
  fr: boolean;
  openArticle: (id: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const index = fr ? 1 : 0;
  const scenario = scenarios.find(([id]) => id === selected);
  const article = helpArticles.find(({ id }) => id === selected);
  return (
    <section className="help-guide" aria-labelledby="help-guide-title">
      <div>
        <p className="ops-scope">
          {fr
            ? "Assistant simulé · démonstration"
            : "Simulated assistant · demo"}
        </p>
        <h2 id="help-guide-title">
          {fr ? "Trouvons votre prochaine étape" : "Find your next step"}
        </h2>
        <p>
          {fr
            ? "Choisissez une situation. Ce guide utilise des réponses prédéfinies tirées de nos articles; aucun message n’est envoyé et aucune donnée de compte n’est consultée."
            : "Choose a situation. This guide uses preset answers from our articles; no message is sent and no account data is accessed."}
        </p>
      </div>
      <div
        className="help-guide-choices"
        aria-label={fr ? "Situations" : "Scenarios"}
      >
        {scenarios.map(([id, en, french]) => (
          <Button
            key={id}
            variant="secondary"
            aria-pressed={selected === id}
            onClick={() => setSelected(id)}
          >
            {fr ? french : en}
          </Button>
        ))}
      </div>
      <div aria-live="polite" aria-atomic="true">
        {article && scenario ? (
          <div className="help-guide-conversation">
            <p className="help-guide-question">
              <strong>{fr ? "Votre situation" : "Your situation"}</strong>
              {scenario[fr ? 2 : 1]}
            </p>
            <div className="help-guide-answer">
              <p className="ops-scope">
                {fr ? "Réponse prédéfinie" : "Preset response"}
              </p>
              <h3>{article.title[index]}</h3>
              <p>{article.summary[index]}</p>
              <ol>
                {article.steps.slice(0, 2).map((step, n) => (
                  <li key={n}>{step[index]}</li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <p className="ops-scope">
            {fr
              ? "Sélectionnez une situation pour commencer."
              : "Select a situation to begin."}
          </p>
        )}
      </div>
      {article && (
        <div className="help-guide-actions">
          <Button onClick={() => openArticle(article.id)}>
            {fr ? "Lire le guide complet" : "Read the full guide"}
          </Button>
          <Button variant="ghost" onClick={() => setSelected("")}>
            {fr ? "Recommencer" : "Start again"}
          </Button>
        </div>
      )}
    </section>
  );
}
