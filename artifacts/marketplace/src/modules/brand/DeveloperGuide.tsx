import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@workspace/troc-design-system/components/ui/accordion";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import "./developer-guide.css";
export function DeveloperGuide({ locale }: { locale: "en" | "fr" }) {
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);
  const href = (path: string) => path + "?lang=" + locale;
  const capabilities = [
    [
      t("Canonical cards", "Cartes canoniques"),
      t(
        "One card identity, many seller offers. Printing, language, finish and condition stay distinct.",
        "Une identité de carte, plusieurs offres. Édition, langue, finition et état restent distincts.",
      ),
    ],
    [
      t("Seller inventory", "Inventaire vendeur"),
      t(
        "Keep seller SKUs and external source identifiers attached to your listings. Stock and price belong to the seller offer.",
        "Conservez vos SKU et identifiants de source avec vos annonces. Stock et prix appartiennent à l’offre du vendeur.",
      ),
    ],
    [
      t("Import and review", "Importer et vérifier"),
      t(
        "Map CSV columns, review matches and resolve ambiguous or invalid rows before publishing. A source label does not create a live connection.",
        "Associez les colonnes CSV, vérifiez les correspondances et résolvez les lignes ambiguës ou invalides avant publication. Une source indiquée n’est pas une connexion active.",
      ),
    ],
  ];
  const planned = [
    [
      t("Scoped access", "Accès limité"),
      t(
        "Revocable seller credentials, with explicit resource permissions.",
        "Des identifiants révocables et des autorisations explicites par ressource.",
      ),
    ],
    [
      t("Safe updates", "Mises à jour fiables"),
      t(
        "Versioned contracts, bounded batches and repeatable requests without duplicate changes.",
        "Des contrats versionnés, des lots limités et des requêtes répétables sans changements en double.",
      ),
    ],
    [
      t("Order events", "Événements de commande"),
      t(
        "Signed events, delivery history, retries and visible failures.",
        "Des événements signés, un historique de livraison, des reprises et des échecs visibles.",
      ),
    ],
    [
      t("Sync health", "État de synchronisation"),
      t(
        "Last successful sync, pending updates and conflicts that need your attention.",
        "Dernière synchronisation réussie, mises à jour en attente et conflits à résoudre.",
      ),
    ],
  ];
  return (
    <div className="developer-guide">
      <aside className="developer-status">
        <span className="troc-editorial-eyebrow">
          {t("Availability", "Disponibilité")}
        </span>
        <h2>
          {t(
            "Seller tools first. Public API next.",
            "Les outils vendeurs d’abord. L’API publique ensuite.",
          )}
        </h2>
        <p>
          {t(
            "Inventory import is available in the local test workspace. A public API, integration credentials and live connectors are not available yet. No launch date is committed.",
            "L’import d’inventaire est disponible dans l’espace de test local. L’API publique, les identifiants d’intégration et les connecteurs en direct ne sont pas encore disponibles. Aucune date de lancement n’est annoncée.",
          )}
        </p>
        <Button asChild variant="secondary">
          <a href={href("/roadmap")}>
            {t("View the roadmap", "Voir la feuille de route")}
          </a>
        </Button>
      </aside>
      <section aria-labelledby="developer-foundation">
        <div className="developer-heading">
          <span className="troc-editorial-eyebrow">
            01 / {t("Foundation", "Fondations")}
          </span>
          <h2 id="developer-foundation">
            {t(
              "Bring your inventory. Keep its identity.",
              "Apportez votre inventaire. Gardez ses repères.",
            )}
          </h2>
          <p>
            {t(
              "The goal: manage inventory once and add TROC as another Canadian sales channel.",
              "L’objectif : gérer l’inventaire une seule fois et ajouter TROC comme canal de vente canadien.",
            )}
          </p>
        </div>
        <div className="developer-grid">
          {capabilities.map(([title, body], i) => (
            <article key={title}>
              <span className="developer-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="developer-flow">
        <div className="developer-heading">
          <h2 id="developer-flow">
            {t(
              "Start with a reviewed import",
              "Commencez par un import vérifié",
            )}
          </h2>
          <p>
            {t(
              "The current path uses a CSV export. It does not continuously sync with the original tool.",
              "Le parcours actuel utilise un export CSV. Il ne synchronise pas les modifications avec l’outil d’origine.",
            )}
          </p>
        </div>
        <ol className="developer-flow">
          {[
            t("Export your inventory", "Exportez votre inventaire"),
            t("Map and match cards", "Associez colonnes et cartes"),
            t("Review every exception", "Vérifiez les exceptions"),
            t("Publish approved rows", "Publiez les lignes approuvées"),
          ].map((label, i) => (
            <li key={label}>
              <span>{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
        <p className="developer-note">
          {t(
            "Keep original SKUs and identify printing, language, condition, quantity and CAD price. Ambiguous matches need a decision; they should never silently become a different card.",
            "Conservez les SKU d’origine et précisez l’édition, la langue, l’état, la quantité et le prix en CAD. Une correspondance ambiguë exige une décision; elle ne doit jamais devenir une autre carte sans vérification.",
          )}
        </p>
      </section>
      <section aria-labelledby="developer-planned">
        <div className="developer-heading">
          <span className="troc-editorial-eyebrow">
            {t("Planned · seller API", "Prévu · API vendeur")}
          </span>
          <h2 id="developer-planned">
            {t(
              "A connection you can rely on",
              "Une connexion sur laquelle compter",
            )}
          </h2>
        </div>
        <div className="developer-grid developer-grid-two">
          {planned.map(([title, body]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section aria-labelledby="developer-questions">
        <h2 id="developer-questions">
          {t(
            "Before you plan an integration",
            "Avant de préparer une intégration",
          )}
        </h2>
        <Accordion type="single" collapsible>
          <AccordionItem value="tools">
            <AccordionTrigger>
              {t(
                "Will my inventory tool work with TROC?",
                "Mon outil d’inventaire sera-t-il compatible ?",
              )}
            </AccordionTrigger>
            <AccordionContent>
              {t(
                "SortSwift, CardUploader, eBay, Shopify and TCGplayer exports are compatibility targets, not announced partnerships or working live connectors. Formats, provider permissions and stock reconciliation must be verified for each integration.",
                "SortSwift, CardUploader, eBay, Shopify et les exports TCGplayer sont des cibles de compatibilité, pas des partenariats annoncés ni des connecteurs actifs. Formats, autorisations et rapprochement des stocks doivent être vérifiés pour chaque intégration.",
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="keys">
            <AccordionTrigger>
              {t(
                "Can I request an API key now?",
                "Puis-je obtenir une clé API maintenant ?",
              )}
            </AccordionTrigger>
            <AccordionContent>
              {t(
                "Not yet. No public credentials or production API contract are offered. Use the roadmap to follow progress; do not build against internal browser requests as a supported partner API.",
                "Pas encore. Aucune clé publique ni contrat d’API de production n’est offert. Consultez la feuille de route; les requêtes internes du navigateur ne constituent pas une API partenaire prise en charge.",
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="errors">
            <AccordionTrigger>
              {t(
                "Where are the error codes and request limits?",
                "Où trouver les codes d’erreur et les limites de requêtes ?",
              )}
            </AccordionTrigger>
            <AccordionContent>
              {t(
                "The public error contract, rate limits and batch sizes have not been published. Limits used by the preview are not a partner service guarantee. Future documentation must explain validation, permissions, conflicts, retry timing and how to check an uncertain write before repeating it.",
                "Le contrat public d’erreurs, les limites de requêtes et les tailles de lots ne sont pas publiés. Les limites de l’aperçu ne constituent pas une garantie de service partenaire. La future documentation devra expliquer validation, permissions, conflits, délais de reprise et vérification d’une écriture incertaine avant répétition.",
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="versions">
            <AccordionTrigger>
              {t(
                "Which API version and webhooks can I build against?",
                "Quelle version d’API et quels webhooks puis-je utiliser ?",
              )}
            </AccordionTrigger>
            <AccordionContent>
              {t(
                "No public API version or webhook subscription is available yet. Versioned resources, signed events, duplicate handling and a changelog are planned. Event names on the roadmap are design targets, not active subscriptions; no compatibility or deprecation window is committed.",
                "Aucune version publique d’API ni souscription aux webhooks n’est disponible. Ressources versionnées, événements signés, gestion des doublons et journal des changements sont prévus. Les événements de la feuille de route sont des objectifs, pas des abonnements actifs; aucune période de compatibilité ou de retrait n’est engagée.",
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="rights">
            <AccordionTrigger>
              {t(
                "Can catalog images be reused outside TROC?",
                "Puis-je réutiliser les images du catalogue ?",
              )}
            </AccordionTrigger>
            <AccordionContent>
              {t(
                "Catalog and image permissions depend on their sources. Access to a development sample does not grant redistribution rights. Any wider catalog or export requires approved sources and terms.",
                "Les autorisations dépendent des sources du catalogue et des images. Un échantillon de développement n’accorde aucun droit de redistribution. Un catalogue ou export élargi exige des sources et modalités approuvées.",
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
