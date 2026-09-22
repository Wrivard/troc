import { CatalogPreview } from "./CatalogPreview";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { useEffect } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { MarketplaceFooter, MarketplaceHeader } from "./SiteChrome";

type Pair = readonly [string, string];
type Content = {
  title: Pair;
  lead: Pair;
  sections: { title: Pair; body: Pair }[];
  planned?: boolean;
};
const pages: Record<string, Content> = {
  "/about": {
    title: [
      "Built here. For collectors here.",
      "D’ici. Pour les collectionneurs d’ici.",
    ],
    lead: [
      "Canadian owned and operated. A marketplace designed around our sellers, our shipping and our community.",
      "Une entreprise canadienne. Un marché pensé pour nos vendeurs, notre livraison et notre communauté.",
    ],
    sections: [
      {
        title: [
          "A better place for the everyday collector",
          "Une meilleure expérience au quotidien",
        ],
        body: [
          "Finishing a set should not mean comparing dozens of tabs or paying more to ship a common than to buy it. TROC brings catalog discovery, seller offers and order consolidation together.",
          "Compléter une extension ne devrait pas exiger des dizaines d’onglets ni coûter plus cher en livraison qu’en cartes. TROC réunit la recherche, les offres et le regroupement des commandes.",
        ],
      },
      {
        title: ["Canadian by design", "Canadien, dès le départ"],
        body: [
          "Prices in CAD. English and French. Canadian sellers and shipping. These are the starting point, not settings you have to hunt for.",
          "Prix en dollars canadiens. Français et anglais. Vendeurs et livraison au Canada. C’est notre point de départ, pas des réglages à chercher.",
        ],
      },
      {
        title: ["Every part of the hobby", "Toutes les facettes de la passion"],
        body: [
          "A first deck, a well-loved binder, a local shop. TROC is being built for collectors and sellers of every size, with room for low-value singles alongside standout finds.",
          "Un premier deck, un cartable bien rempli, une boutique de quartier. TROC se construit pour les collectionneurs et vendeurs de toutes tailles, des petites cartes aux grandes trouvailles.",
        ],
      },
    ],
  },
  "/sell": {
    title: [
      "Your cards. A Canadian audience.",
      "Vos cartes. Un public canadien.",
    ],
    lead: [
      "For individual collectors, online sellers and local hobby shops. Help build a marketplace that understands the way you sell.",
      "Pour les collectionneurs, les vendeurs en ligne et les boutiques locales. Participez à un marché qui comprend votre réalité.",
    ],
    sections: [
      {
        title: ["Make small orders work", "Rentabilisez les petites commandes"],
        body: [
          "Seller minimums, combined shipping and multi-card buying are at the centre of TROC. Smart Cart compares complete orders, including shipping.",
          "Minimums vendeur, livraison regroupée et achats de plusieurs cartes sont au cœur de TROC. Smart Cart compare les commandes complètes, livraison comprise.",
        ],
      },
      {
        title: [
          "A storefront with your identity",
          "Une boutique à votre image",
        ],
        body: [
          "Show buyers where you are, what you sell and how you handle orders. Explore our demo stores to see the direction.",
          "Montrez où vous êtes, ce que vous vendez et comment vous traitez les commandes. Nos boutiques de démonstration illustrent cette direction.",
        ],
      },
      {
        title: [
          "Seller tools are being built",
          "Les outils vendeur prennent forme",
        ],
        body: [
          "Simulated order fulfillment is available in the development environment. Seller onboarding, inventory tools and the full dashboard are not open yet.",
          "Le traitement simulé des commandes est disponible dans l’environnement de développement. L’inscription vendeur, les outils d’inventaire et le tableau de bord complet ne sont pas encore ouverts.",
        ],
      },
    ],
  },
  "/founding-sellers": {
    title: ["Help shape the marketplace.", "Façonnez le marché avec nous."],
    lead: [
      "The founding seller program is for the collectors and shops who want to help TROC start strong.",
      "Le programme des vendeurs fondateurs s’adresse aux collectionneurs et boutiques qui veulent contribuer aux débuts de TROC.",
    ],
    sections: [
      {
        title: ["Build with TROC", "Bâtissez avec TROC"],
        body: [
          "Help shape the seller experience from the start. Seller approval requires a review; creating a buyer account does not approve you as a seller or grant program benefits.",
          "Contribuez à façonner l’expérience vendeur dès le départ. Une candidature doit être examinée; créer un compte acheteur ne vous approuve pas comme vendeur et ne donne aucun avantage du programme.",
        ],
      },
      {
        title: [
          "Applications are not open yet",
          "Les candidatures ne sont pas encore ouvertes",
        ],
        body: [
          "The program and seller application flow are planned. There is no application submission or waiting-list form in this demo.",
          "Le programme et le parcours de candidature sont prévus. Cette démo ne permet pas d’envoyer une candidature ni de s’inscrire à une liste d’attente.",
        ],
      },
    ],
  },
  "/developers": {
    title: ["Built for what comes next.", "Pensé pour la suite."],
    lead: [
      "A clear catalog and reliable marketplace foundations come first. Developer access is on the roadmap.",
      "Un catalogue clair et des bases fiables d’abord. L’accès développeur fait partie de la feuille de route.",
    ],
    sections: [
      {
        title: ["Public API · planned", "API publique · prévue"],
        body: [
          "TROC does not offer a public developer API, API keys or integration access yet. No release date is committed.",
          "TROC n’offre pas encore d’API publique, de clés API ni d’accès aux intégrations. Aucune date de lancement n’est annoncée.",
        ],
      },
      {
        title: [
          "Responsible catalog data",
          "Des données de catalogue responsables",
        ],
        body: [
          "The current catalog is a bounded development sample. Broader catalog use depends on approved sources and licensing; demo access does not grant redistribution rights.",
          "Le catalogue actuel est un échantillon de développement limité. Son élargissement dépend des sources et licences approuvées; l’accès à la démo n’accorde aucun droit de redistribution.",
        ],
      },
    ],
  },
  "/help": {
    title: [
      "A little clarity goes a long way.",
      "Des réponses pour mieux choisir.",
    ],
    lead: [
      "Understand the offers, build your cart and know what this demo can do.",
      "Comprenez les offres, composez votre panier et découvrez les possibilités de cette démo.",
    ],
    sections: [
      {
        title: [
          "Reference price or lowest available?",
          "Prix de référence ou plus bas prix?",
        ],
        body: [
          "A reference price is a comparison point, not a seller’s offer. Lowest available is the cheapest matching offer before shipping. Check the printing, language and condition before adding a card.",
          "Le prix de référence est un repère, pas une offre. Le plus bas prix correspond à l’offre compatible la moins chère, avant livraison. Vérifiez l’édition, la langue et l’état avant d’ajouter une carte.",
        ],
      },
      {
        title: [
          "Why is there a seller minimum?",
          "Pourquoi un minimum vendeur?",
        ],
        body: [
          "Some sellers require a minimum merchandise subtotal. Your cart shows the amount still needed. Cards from the same seller share a shipping quote; orders from different sellers ship separately.",
          "Certains vendeurs exigent un sous-total minimum de cartes. Le panier indique le montant restant. Les cartes d’un même vendeur partagent un tarif de livraison; les commandes de vendeurs différents sont expédiées séparément.",
        ],
      },
      {
        title: ["How does Smart Cart help?", "Comment Smart Cart aide-t-il?"],
        body: [
          "Smart Cart compares compatible offers and shipping totals. Review substitutions before applying a result. Lock a listing to keep that exact offer. Savings depend on available stock and seller rules.",
          "Smart Cart compare les offres compatibles et les frais de livraison. Vérifiez les substitutions avant d’appliquer le résultat. Verrouillez une annonce pour conserver cette offre précise. Les économies dépendent des stocks et des règles vendeur.",
        ],
      },
      {
        title: ["About this demo", "À propos de cette démo"],
        body: [
          "Card images come from approved development samples. Sellers, stock and prices are fictional. Payments, taxes and shipping are simulated. Hosted account checkout awaits activation. No real purchase or delivery occurs.",
          "Les visuels proviennent d’échantillons de développement approuvés. Vendeurs, stocks et prix sont fictifs. Paiement, taxes et livraison sont simulés. Le paiement avec compte sur le site attend son activation. Aucun achat ni envoi réel n’a lieu.",
        ],
      },
      {
        title: ["Orders and help", "Commandes et aide"],
        body: [
          "In an activated test account, open an order to view its status, message the seller or report an issue. Live customer support and final marketplace legal policies are not published in this demo.",
          "Dans un compte de test activé, ouvrez une commande pour voir son statut, écrire au vendeur ou signaler un problème. Le service à la clientèle et les politiques juridiques finales ne sont pas publiés dans cette démo.",
        ],
      },
    ],
  },
  "/condition-guide": {
    title: [
      "Know the card you’re buying.",
      "Sachez quelle carte vous achetez.",
    ],
    lead: [
      "Condition describes wear. Printing, language and finish describe the edition. Check both when comparing offers.",
      "L’état décrit l’usure. L’édition, la langue et la finition identifient la version. Vérifiez les deux pour comparer les offres.",
    ],
    sections: [
      {
        title: ["NM · Near mint", "NM · Presque neuf"],
        body: [
          "Minimal visible wear. Inspect edges, corners and surface when photos are provided.",
          "Très peu d’usure visible. Examinez les bords, les coins et la surface lorsque des photos sont disponibles.",
        ],
      },
      {
        title: ["LP · Lightly played", "LP · Légèrement joué"],
        body: [
          "Light wear from handling or play, such as small edge or surface marks.",
          "Légère usure due à la manipulation ou au jeu, comme de petites marques sur les bords ou la surface.",
        ],
      },
      {
        title: ["MP · Moderately played", "MP · Modérément joué"],
        body: [
          "Noticeable wear in multiple areas. Review the seller’s description and any photos carefully.",
          "Usure visible à plusieurs endroits. Consultez attentivement la description et les photos du vendeur.",
        ],
      },
      {
        title: ["HP · Heavily played", "HP · Très joué"],
        body: [
          "Significant wear. Appearance and structural condition can vary substantially.",
          "Usure importante. L’apparence et l’intégrité physique peuvent varier considérablement.",
        ],
      },
      {
        title: ["DMG · Damaged", "DMG · Endommagé"],
        body: [
          "Major damage such as creasing or other substantial defects. Read the specific listing before buying.",
          "Dommages majeurs, comme des plis ou d’autres défauts importants. Lisez l’annonce précise avant d’acheter.",
        ],
      },
      {
        title: [
          "Graded cards and listing photos",
          "Cartes gradées et photos d’annonce",
        ],
        body: [
          "For graded cards, review the grading company, grade and certificate details. Catalog artwork is a card reference, not a photo of the seller’s actual copy. This overview is not a grading guarantee.",
          "Pour les cartes gradées, vérifiez l’entreprise, la note et le certificat. Un visuel de catalogue n’est pas une photo de l’exemplaire vendu. Ce guide ne constitue pas une garantie d’évaluation.",
        ],
      },
    ],
  },
};
const planned: Record<string, Pair> = {
  "/account/messages": ["Your conversations", "Vos conversations"],
  "/account/notifications": ["Your updates", "Vos notifications"],
  "/account/wishlist": [
    "Cards worth keeping an eye on.",
    "Les cartes à garder en vue.",
  ],
  "/account/price-alerts": [
    "The right card. The right price.",
    "La bonne carte. Le bon prix.",
  ],
  "/account/following": ["Your favourite sellers", "Vos vendeurs favoris"],
  "/account/credit": ["Your TROC credit", "Votre crédit TROC"],
  "/collection": ["Every card has its place.", "Chaque carte a sa place."],
  "/want-lists": [
    "Your next finds, together.",
    "Vos prochaines trouvailles, réunies.",
  ],
  "/seller": ["Your seller workspace", "Votre espace vendeur"],
  "/seller/apply": ["Bring your cards to TROC.", "Vendez vos cartes sur TROC."],
  "/seller/inventory": ["Your inventory", "Votre inventaire"],
  "/seller/promotions": [
    "Promotions that fit your store",
    "Des promotions pour votre boutique",
  ],
  "/seller/offers": ["Your offers", "Vos offres"],
  "/seller/analytics": [
    "Your store at a glance",
    "Votre boutique en un coup d’œil",
  ],
  "/seller/storefront": ["Your storefront", "Votre vitrine"],
  "/seller/team": ["Your team", "Votre équipe"],
  "/seller/settings": ["Seller settings", "Paramètres vendeur"],
  "/seller/plan": ["Your seller plan", "Votre forfait vendeur"],
  "/seller/buylist": ["Your buylist", "Votre liste d’achat"],
};
function plannedKey(path: string) {
  if (path.startsWith("/collection/")) return "/collection";
  if (path.startsWith("/want-lists/")) return "/want-lists";
  return path;
}
export function isInformationPage(path: string) {
  return Boolean(pages[path] || planned[plannedKey(path)]);
}

export function InformationPage({ path }: { path: string }) {
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const pair = (value: Pair) => value[locale === "fr" ? 1 : 0];
  const key = plannedKey(path);
  const collector = key === "/collection" || key === "/want-lists";
  const seller = path.startsWith("/seller");
  const credit = path === "/account/credit";
  const content: Content = pages[path] ?? {
    title: planned[key],
    planned: true,
    lead: collector
      ? [
          "A home for your collection, set progress and the cards you still want. This workspace is planned and is not available yet.",
          "Un espace pour votre collection, votre progression et les cartes recherchées. Cet espace est prévu, mais pas encore disponible.",
        ]
      : credit
        ? [
            "A dedicated credit history is planned. In an activated test account, available credit appears in your cart and checkout. No balance is displayed here.",
            "L’historique détaillé du crédit est prévu. Dans un compte de test activé, le crédit disponible apparaît dans le panier et au paiement. Aucun solde n’est affiché ici.",
          ]
        : seller
          ? [
              "This seller tool is planned. It is not active in the current demo. You can explore the marketplace or access existing test orders.",
              "Cet outil vendeur est prévu. Il n’est pas actif dans la démo actuelle. Vous pouvez explorer le marché ou consulter les commandes de test existantes.",
            ]
          : [
              "This account workspace is planned. It is not active in the current demo. Order-specific messages remain available inside activated test orders.",
              "Cet espace du compte est prévu. Il n’est pas actif dans la démo actuelle. Les messages liés aux commandes restent disponibles dans les commandes de test activées.",
            ],
    sections: collector
      ? [
          {
            title: [
              "Organize by game and set",
              "Classez par jeu et par extension",
            ],
            body: [
              "Planned: a clear view of owned and missing cards, without mixing catalog editions.",
              "Prévu : une vue claire des cartes possédées et manquantes, sans mélanger les éditions.",
            ],
          },
          {
            title: [
              "Turn a gap into your next find",
              "Trouvez les cartes qui vous manquent",
            ],
            body: [
              "Planned: match your missing cards and want lists to marketplace offers. Browse the current catalog while these tools are being built.",
              "Prévu : relier vos cartes manquantes et listes de souhaits aux offres du marché. Explorez le catalogue pendant la préparation de ces outils.",
            ],
          },
        ]
      : [],
  };
  useEffect(() => {
    document.title = `${pair(content.title)} · TROC`;
  }, [path, locale]);
  const href = (url: string) =>
    `${import.meta.env.BASE_URL.replace(/\/$/, "")}${url}?lang=${locale}`;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
      />
      <main
        id="main-content"
        className="mx-auto grid min-h-[60vh] max-w-screen-xl content-start gap-12 px-4 py-12 md:px-8 md:py-16"
      >
        <EditorialIntro
          level={1}
          className="troc-page-opening"
          eyebrow={
            content.planned
              ? pair(["On the roadmap", "À venir"])
              : "TROC · CANADA"
          }
          title={pair(content.title)}
          description={pair(content.lead)}
        />
        {path === "/founding-sellers" && (
          <aside className="troc-founder-callout">
            <strong>
              {pair(["Build", "Bâtir"])}{" "}
              <span>{pair(["together.", "ensemble."])}</span>
            </strong>
            <h2>{pair(["Shape what comes next.", "Façonnez la suite."])}</h2>
            <p>
              {pair([
                "An invitation to help shape TROC’s seller experience. Program terms and any benefits remain to be confirmed.",
                "Une invitation à façonner l’expérience vendeur TROC. Les modalités du programme et les avantages éventuels restent à confirmer.",
              ])}
            </p>
            <p className="text-sm text-muted-foreground">
              {pair([
                "Applications are not open yet.",
                "Les candidatures ne sont pas encore ouvertes.",
              ])}
            </p>
          </aside>
        )}
        {collector && <CatalogPreview locale={locale} kind="binder" />}
        {path === "/sell" && <CatalogPreview locale={locale} kind="store" />}
        {path === "/founding-sellers" && (
          <section className="troc-founder-process">
            <h2>
              {pair([
                "A considered start. A lasting place.",
                "Un départ réfléchi. Une place durable.",
              ])}
            </h2>
            <div>
              {[
                [
                  "01",
                  "Apply when applications open",
                  "Postulez à l’ouverture des candidatures",
                ],
                [
                  "02",
                  "TROC reviews your application",
                  "TROC examine votre candidature",
                ],
                [
                  "03",
                  "Seller access follows approval",
                  "L’accès vendeur suit l’approbation",
                ],
              ].map(([n, en, fr]) => (
                <div key={n}>
                  <span className="troc-editorial-eyebrow">{n}</span>
                  <h3>{pair([en, fr])}</h3>
                </div>
              ))}
            </div>
          </section>
        )}
        <div className="troc-info-layout">
          {content.sections.map((section, i) => (
            <section
              id={path === "/help" && i === 3 ? "demo" : undefined}
              key={section.title[0]}
              className="grid content-start gap-4 border-t border-border pt-6"
            >
              <span className="troc-info-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-xl font-semibold">{pair(section.title)}</h2>
              <p className="max-w-prose leading-relaxed text-muted-foreground">
                {pair(section.body)}
              </p>
            </section>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a href={href("/search")}>
              {pair(["Explore cards", "Explorer les cartes"])}
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a
              href={href(
                seller
                  ? "/seller/orders"
                  : path === "/sell"
                    ? "/founding-sellers"
                    : "/account/orders",
              )}
            >
              {pair(
                seller
                  ? ["Test orders", "Commandes de test"]
                  : path === "/sell"
                    ? [
                        "Founding seller program",
                        "Programme des vendeurs fondateurs",
                      ]
                    : ["Your orders", "Vos commandes"],
              )}
            </a>
          </Button>
        </div>
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}
