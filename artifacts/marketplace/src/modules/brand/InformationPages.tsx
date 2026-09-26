import { ConditionInspection } from "./ConditionInspection";
import { DocumentationIndex } from "./DocumentationIndex";
import { DeveloperGuide } from "./DeveloperGuide";
import { RoadmapPage } from "./roadmap/RoadmapPage";
import { CatalogPreview } from "./CatalogPreview";
import { EditorialIntro } from "@workspace/troc-design-system/components/ui/editorial";
import { lazy, Suspense, useEffect } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { MarketplaceFooter, MarketplaceHeader } from "./SiteChrome";

const LiveSellDetails = lazy(() => import("../sell-page/LiveSellDetails"));
const CollectionExample = lazy(() => import("./smart-cart-education/CollectionExample"));

type Pair = readonly [string, string];
type Content = {
  title: Pair;
  lead: Pair;
  sections: { title: Pair; body: Pair }[];
  planned?: boolean;
};
const pages: Record<string, Content> = {
  "/docs": {
    title: ["Your guide to TROC.", "Vos repères sur TROC."],
    lead: [
      "Understand the tools, follow the right steps and know what comes next.",
      "Comprenez les outils, suivez les bonnes étapes et découvrez la suite.",
    ],
    sections: [],
  },
  "/roadmap": {
    title: ["TROC roadmap", "Feuille de route TROC"],
    lead: [
      "A clear vision, one step at a time.",
      "Une vision claire, une étape à la fois.",
    ],
    sections: [],
  },
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
          "Seller onboarding, inventory tools, the dashboard and simulated fulfillment can be explored with authorized local test accounts. Public seller activation and real payments remain unavailable.",
          "L’inscription vendeur, l’inventaire, le tableau de bord et le traitement simulé sont accessibles aux comptes de test locaux autorisés. L’activation publique et les paiements réels restent indisponibles.",
        ],
      },
    ],
  },
  "/founding-sellers": {
    title: ["Help shape the marketplace.", "Façonnez le marché avec nous."],
    lead: [
      "Bring the cards you already sell to a marketplace built around Canadian collectors.",
      "Apportez les cartes que vous vendez déjà à un marché pensé pour les collectionneurs canadiens.",
    ],
    sections: [
      {
        title: ["Tell us about your store", "Présentez votre boutique"],
        body: [
          "Choose seller or buyer and seller in the early-access form. Share your games, approximate inventory, selling channels and inventory tools so we can understand what you need.",
          "Choisissez vendeur ou acheteur et vendeur dans le formulaire d’accès anticipé. Indiquez vos jeux, votre inventaire approximatif, vos canaux de vente et vos outils pour nous aider à comprendre vos besoins.",
        ],
      },
      {
        title: [
          "Your account, while you wait",
          "Votre compte, pendant l’attente",
        ],
        body: [
          "Finish with email or Google when the account provider is configured, then return to your account. Joining early access records your interest; it does not automatically approve seller access or founding benefits. The current preview uses local test accounts.",
          "Terminez par courriel ou Google lorsque le fournisseur de comptes est configuré, puis retrouvez votre compte. L’accès anticipé enregistre votre intérêt; il n’accorde pas automatiquement l’accès vendeur ni les avantages fondateurs. L’aperçu actuel utilise des comptes de test locaux.",
        ],
      },
      {
        title: [
          "Bring inventory, not duplicate work",
          "Apportez vos cartes, pas du travail en double",
        ],
        body: [
          "The seller workspace supports reviewed CSV imports and canonical card listings in local testing. Live connections to your existing inventory tools remain planned. Tell us which tools matter to your store.",
          "L’espace vendeur permet de vérifier les imports CSV et d’utiliser le catalogue de cartes dans les tests locaux. Les connexions en direct à vos outils restent prévues. Indiquez ceux qui comptent pour votre boutique.",
        ],
      },
      {
        title: [
          "A Canadian buying experience",
          "Une expérience d’achat canadienne",
        ],
        body: [
          "CAD prices, bilingual browsing and seller-grouped shipping help collectors understand the full order. Smart Cart compares compatible offers and delivery costs; savings depend on actual inventory and seller rules.",
          "Les prix en CAD, la navigation bilingue et la livraison regroupée par vendeur clarifient la commande. Smart Cart compare les offres compatibles et la livraison; les économies dépendent des stocks et des règles vendeur.",
        ],
      },
      {
        title: [
          "Program terms before promises",
          "Des modalités avant les promesses",
        ],
        body: [
          "Founding eligibility, capacity and benefits will be confirmed before activation. No fee waiver, permanent paid plan or referral reward is granted by this form. Seller applications are reviewed separately.",
          "L’admissibilité, les places et les avantages fondateurs seront confirmés avant activation. Ce formulaire n’accorde aucune exemption de frais, aucun forfait payant permanent ni récompense de parrainage. Les candidatures vendeurs sont examinées séparément.",
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
const plannedAccountCopy: Record<string, Pair> = {
  "/account/notifications": [
    "A place for marketplace updates is planned. No notifications or notification preferences are active on this page.",
    "Un espace de nouvelles du marché est prévu. Aucune notification ni préférence de notification n’est active sur cette page.",
  ],
  "/account/wishlist": [
    "Saving wanted cards is planned. Explore the want-list preview to see the intended experience; no cards are saved here.",
    "L’enregistrement des cartes recherchées est prévu. Explorez l’aperçu des listes de souhaits; aucune carte n’est enregistrée ici.",
  ],
  "/account/price-alerts": [
    "Price alerts are planned. No price target is saved and no alerts are sent from this page.",
    "Les alertes de prix sont prévues. Aucun prix cible n’est enregistré et aucune alerte n’est envoyée depuis cette page.",
  ],
  "/account/following": [
    "Following sellers is planned. You can browse stores today, but no seller is followed or notified from this page.",
    "Le suivi des vendeurs est prévu. Vous pouvez explorer les boutiques, mais aucun vendeur n’est suivi ni avisé depuis cette page.",
  ],
};
function plannedKey(path: string) {
  if (path.startsWith("/collection/")) return "/collection";
  if (path.startsWith("/want-lists/")) return "/want-lists";
  return path;
}
export { isInformationPage } from "./information-routes";

export function InformationPage({ path }: { path: string }) {
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const pair = (value: Pair) => value[locale === "fr" ? 1 : 0];
  const key = plannedKey(path);
  const collector = key === "/collection" || key === "/want-lists";
  const wantList = key === "/want-lists";
  const seller = path.startsWith("/seller");
  const credit = path === "/account/credit";
  const content: Content = pages[path] ?? {
    title: planned[key],
    planned: true,
    lead:
      plannedAccountCopy[path] ??
      (wantList
        ? [
            "Keep track of the cards you want, with the edition and buying preferences that matter to you. Want lists are planned and are not available yet.",
            "Rassemblez les cartes recherchées, leurs éditions et vos préférences d’achat. Les listes de souhaits sont prévues, mais pas encore disponibles.",
          ]
        : collector
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
                ]),
    sections: wantList
      ? [
          {
            title: ["Make each want precise", "Précisez chaque recherche"],
            body: [
              "Planned: keep the card’s edition, quantity, language, condition and maximum price together.",
              "Prévu : réunir l’édition, la quantité, la langue, l’état et le prix maximal de chaque carte.",
            ],
          },
          {
            title: [
              "Find more of your list together",
              "Trouvez plusieurs cartes au même endroit",
            ],
            body: [
              "Planned: see compatible offers and sellers that match several wanted cards. Availability and alerts will depend on actual inventory and your preferences.",
              "Prévu : repérer les offres compatibles et les vendeurs correspondant à plusieurs cartes recherchées. La disponibilité et les alertes dépendront des stocks réels et de vos préférences.",
            ],
          },
        ]
      : collector
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
    if (path === "/help" && window.location.hash === "#demo") {
      const frame = requestAnimationFrame(() => {
        const section = document.getElementById("demo");
        section?.focus({ preventScroll: true });
        section?.scrollIntoView({ block: "start" });
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [path, locale]);
  const href = (url: string) =>
    `${import.meta.env.BASE_URL.replace(/\/$/, "")}${url}?lang=${locale}`;
  if (path === "/roadmap") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <MarketplaceHeader
          locale={locale}
          theme={theme}
          onLocale={setLocale}
          onTheme={setTheme}
        />
        <main id="main-content">
          <RoadmapPage locale={locale} journeyHref={href("/about")} />
        </main>
        <MarketplaceFooter locale={locale} />
      </div>
    );
  }
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
        {path === "/condition-guide" && <ConditionInspection locale={locale} />}
        {path === "/developers" && <DeveloperGuide locale={locale} />}
        {path === "/docs" && <DocumentationIndex locale={locale} />}
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
                "Share your interest through early access.",
                "Faites-nous part de votre intérêt via l’accès anticipé.",
              ])}
            </p>
          </aside>
        )}
        {collector && !wantList && (<Suspense fallback={<p role="status">{locale === "fr" ? "Chargement de l’exemple…" : "Loading example…"}</p>}><CollectionExample locale={locale}/></Suspense>)}
        {collector && wantList && (
          <CatalogPreview
            locale={locale}
            kind={wantList ? "want-list" : "binder"}
          />
        )}
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
                  "Share your inventory and tools",
                  "Présentez votre inventaire et vos outils",
                ],
                ["02", "Create your account", "Créez votre compte"],
                [
                  "03",
                  "Seller access follows review",
                  "L’accès vendeur suit l’examen",
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
        {path !== "/developers" && (
          <div className="troc-info-layout">
            {content.sections.map((section, i) => (
              <section
                id={path === "/help" && i === 3 ? "demo" : undefined}
                tabIndex={path === "/help" && i === 3 ? -1 : undefined}
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
        )}
        {path === "/sell" && <Suspense fallback={<p role="status">{locale === "fr" ? "Chargement…" : "Loading…"}</p>}><LiveSellDetails locale={locale}/></Suspense>}
        {path !== "/sell" && <div className="flex flex-wrap gap-3">
          <Button asChild>
            <a
              href={href(path === "/founding-sellers" ? "/sign-up" : "/search")}
            >
              {pair(
                path === "/founding-sellers"
                  ? ["Join early access", "Rejoindre l’accès anticipé"]
                  : ["Explore cards", "Explorer les cartes"],
              )}
            </a>
          </Button>
          <Button asChild variant="secondary">
            <a
              href={href(
                seller
                  ? "/seller/orders"
                  : path === "/sell"
                    ? "/founding-sellers"
                    : path === "/account/wishlist" ||
                        path === "/account/price-alerts"
                      ? "/want-lists"
                      : wantList
                        ? "/collection"
                        : key === "/collection"
                          ? "/want-lists"
                          : path === "/help"
                            ? "/account/orders"
                            : "/help",
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
                    : path === "/account/wishlist" ||
                        path === "/account/price-alerts"
                      ? ["Want-list preview", "Aperçu des listes de souhaits"]
                      : wantList
                        ? ["Collection preview", "Aperçu de collection"]
                        : key === "/collection"
                          ? [
                              "Want-list preview",
                              "Aperçu des listes de souhaits",
                            ]
                          : path === "/help"
                            ? ["Your orders", "Vos commandes"]
                            : ["Help centre", "Centre d’aide"],
              )}
            </a>
          </Button>
        </div>}
      </main>
      <MarketplaceFooter locale={locale} />
    </div>
  );
}
