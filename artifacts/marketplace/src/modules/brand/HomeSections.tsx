import { InteractiveCardStack } from "@workspace/troc-design-system/components/ui/interactive-card-stack";
import {
  GameTile,
  MarketplaceJourney,
  MarketplaceStats,
  MarketplacePrinciples,
  SellerPreviewCard,
  SmartCartComparison,
} from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import type { ReactNode } from "react";
import type { PublicPage, ProductResult, Product } from "@workspace/catalog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { CardImage } from "@workspace/troc-design-system/components/ui/product-presentation";
import {
  EditorialIntro,
  EditorialIcon,
  EditorialPanel,
} from "@workspace/troc-design-system/components/ui/editorial";
import { SellerAvatar } from "@workspace/troc-design-system/components/ui/seller-storefront";
import { TrocLogo } from "@workspace/troc-design-system/components/ui/logo";
import { imagesForVariant } from "../catalog/images";

export function HomeSections({
  page,
  cards,
  href,
}: {
  page: PublicPage;
  cards: (items: ProductResult[]) => ReactNode;
  href: (path: string, params?: Record<string, string>) => string;
}) {
  const fr = page.locale === "fr";
  const c = (en: string, french: string) => (fr ? french : en);
  const products = page.results.filter((r) => r.product.images?.length);
  const games = [...page.games].sort(
    (a, b) => Number(b.slug === "pokemon") - Number(a.slug === "pokemon"),
  );
  const pokemon = games.find((g) => g.slug === "pokemon");
  const lead =
    products.find(
      (r) =>
        r.product.gameId === pokemon?.id &&
        /bulbasaur/i.test(r.product.name.en),
    ) ?? products.find((r) => r.product.gameId === pokemon?.id);
  const heroes = [
    lead,
    ...games
      .filter((g) => g.slug !== "pokemon")
      .map((g) => products.find((r) => r.product.gameId === g.id)),
  ]
    .filter((r): r is ProductResult => Boolean(r))
    .slice(0, 3);
  const featured = [
    ...new Map(
      [
        ...games.flatMap((g) =>
          products.filter((r) => r.product.gameId === g.id).slice(0, 1),
        ),
        ...products,
      ].map((r) => [r.product.id, r]),
    ).values(),
  ];
  const art = (p: Product, eager = false) => {
    const i = imagesForVariant(p, p.variants[0])[0];
    return (
      <CardImage
        src={i?.url}
        srcSet={i?.sources.map((s) => `${s.url} ${s.width}w`).join(", ")}
        sizes={
          eager
            ? "(min-width: 1024px) 300px, 45vw"
            : "(min-width: 1024px) 220px, 40vw"
        }
        width={i?.width}
        height={i?.height}
        eager={eager}
        alt={p.name[page.locale]}
        missingLabel={c("Artwork coming soon", "Visuel à venir")}
      />
    );
  };
  const action = (
    url: string,
    en: string,
    french: string,
    secondary = false,
  ) => (
    <Button asChild variant={secondary ? "secondary" : "primary"}>
      <a href={href(url)}>
        {c(en, french)}
        <EditorialIcon name="arrow" />
      </a>
    </Button>
  );
  return (
    <div className="troc-home-editorial">
      <section className="troc-home-hero">
        <div className="troc-hero-copy">
          <p className="troc-editorial-eyebrow">
            {c(
              "THE HOBBY HAS A HOME. CANADA.",
              "LA PASSION A SON ADRESSE. AU CANADA.",
            )}
          </p>
          <h1>
            {c("One search.", "Une recherche.")}
            <br />
            <span>{c("Every seller.", "Tous les vendeurs.")}</span>
          </h1>
          <p className="troc-hero-lead">
            {c(
              "The next card. The last piece of your set. Find it here.",
              "La prochaine carte. La dernière de votre extension. Trouvez-la ici.",
            )}
          </p>
          <p className="troc-hero-support">
            {c(
              "Compare Canadian sellers in one place. Singles, sealed and graded. All in CAD.",
              "Comparez les vendeurs canadiens au même endroit. Cartes à l’unité, scellées et gradées. Tout en CAD.",
            )}
          </p>
          <form
            role="search"
            aria-label={c(
              "Find your next card",
              "Trouvez votre prochaine carte",
            )}
            action={href("/search").split("?")[0]}
            className="troc-hero-search"
          >
            <input type="hidden" name="lang" value={page.locale} />
            <EditorialIcon name="search" />
            <Input
              name="q"
              maxLength={100}
              aria-label={c("Card or set name", "Nom de carte ou d’extension")}
              placeholder={c(
                "Your next find starts here…",
                "Votre prochaine trouvaille…",
              )}
            />
            <Button type="submit">{c("Search", "Chercher")}</Button>
          </form>
          <div className="troc-hero-actions">
            {action("/search", "Explore cards", "Explorer les cartes")}
            <a
              className="troc-editorial-text-link"
              href={href("/founding-sellers")}
            >
              {c("Sell with TROC", "Vendre avec TROC")}
              <EditorialIcon name="arrow" />
            </a>
          </div>
          <p className="troc-hero-signature">
            <span aria-hidden="true" />{" "}
            {c(
              "Canadian sellers. Prices in CAD.",
              "Vendeurs canadiens. Prix en CAD.",
            )}
          </p>
        </div>
        <div className="troc-hero-display">
          <div className="troc-hero-display-label">
            <span>01 / {c("THE COLLECTION", "LA COLLECTION")}</span>
            <span>{c("YOUR NEXT FIND", "VOTRE PROCHAINE TROUVAILLE")}</span>
          </div>
          <InteractiveCardStack
            label={c("Pokémon leads the collection", "Pokémon au premier plan")}
            caption={
              <>
                <span>{lead?.product.name[page.locale] ?? "Pokémon"}</span>
                <span aria-hidden="true">/</span>
                <span>
                  {c(
                    "A little card. A whole world.",
                    "Une petite carte. Tout un univers.",
                  )}
                </span>
              </>
            }
            cards={heroes.map((r) => art(r.product, true))}
          />
          <p className="troc-art-note">
            {c("Demo marketplace", "Marché de démonstration")}
          </p>
        </div>
      </section>
      <MarketplaceStats
        label={c("TROC in numbers", "TROC en chiffres")}
        scope={c(
          "Marketplace figures · not yet available",
          "Les chiffres du marché · bientôt disponibles",
        )}
        source={c(
          "Verified totals are not connected yet. This preview does not represent live marketplace activity.",
          "Les totaux vérifiés ne sont pas encore reliés. Cet aperçu ne représente pas l’activité réelle du marché.",
        )}
        unavailableLabel={c("Not available", "Indisponible")}
        items={[
          {
            id: "products",
            value: null,
            label: c("Catalog products", "Produits du catalogue"),
            detail: c(
              "Distinct canonical products",
              "Produits canoniques distincts",
            ),
          },
          {
            id: "listings",
            value: null,
            label: c("Seller listings", "Offres des vendeurs"),
            detail: c(
              "Active offers, across sellers",
              "Offres actives, tous vendeurs confondus",
            ),
          },
          {
            id: "units",
            value: null,
            label: c("Available units", "Exemplaires disponibles"),
            detail: c(
              "Quantities across active listings",
              "Quantités des offres actives",
            ),
          },
          {
            id: "sellers",
            value: null,
            label: c("Active sellers", "Vendeurs actifs"),
            detail: c(
              "Sellers with available offers",
              "Vendeurs proposant des offres disponibles",
            ),
          },
        ]}
      />
      <section className="troc-home-section">
        <EditorialIntro
          eyebrow={c("FIVE GAMES. ONE PLACE.", "CINQ JEUX. UN SEUL ENDROIT.")}
          title={c("Find your world.", "Trouvez votre univers.")}
          description={c(
            "A new deck. A familiar favourite. Follow what you collect.",
            "Un nouveau deck. Un grand favori. Suivez votre passion.",
          )}
        />
        <div className="troc-game-edit">
          {games.map((g, index) => {
            const p = products.find((r) => r.product.gameId === g.id)?.product;
            return (
              <GameTile
                key={g.id}
                href={href(`/games/${g.slug}`)}
                index={String(index + 1).padStart(2, "0")}
                name={g.name[page.locale]}
                description={c(
                  "Singles · Sealed · Graded",
                  "Unités · Scellées · Gradées",
                )}
                art={p ? art(p) : undefined}
              />
            );
          })}
        </div>
      </section>
      <section className="troc-home-section troc-discovery-edit">
        <EditorialIntro
          eyebrow={c("THE DISCOVERY EDIT / 01", "LA SÉLECTION / 01")}
          title={c(
            "A place for your next obsession.",
            "Votre prochaine passion commence ici.",
          )}
          description={c(
            "Familiar favourites and unexpected finds. A small window into a much bigger hobby.",
            "Des favoris familiers et des trouvailles inattendues. Un aperçu d’une grande passion.",
          )}
          aside={
            <a className="troc-editorial-text-link" href={href("/search")}>
              {c("View all cards", "Toutes les cartes")}
              <EditorialIcon name="arrow" />
            </a>
          }
        />
        {cards(featured.slice(0, 4))}
        <p className="troc-art-note">
          {c(
            "Curated demo selection. Prices, stock and sellers are illustrative.",
            "Sélection de démonstration. Prix, stocks et vendeurs fictifs.",
          )}
        </p>
      </section>
      <section className="troc-how-edit">
        <EditorialIntro
          eyebrow={c(
            "LESS FRICTION. MORE HOBBY.",
            "MOINS D’EFFORT. PLUS DE PASSION.",
          )}
          title={
            <>
              {c("The card is the beginning.", "La carte, c’est le début.")}
              <br />
              {c("The whole order matters.", "La commande complète compte.")}
            </>
          }
          description={c(
            "TROC brings the details together, so you can get back to the cards.",
            "TROC réunit les détails pour vous laisser profiter des cartes.",
          )}
        />
        <MarketplaceJourney
          steps={(
            [
              [
                "search",
                "Find your card",
                "Trouvez votre carte",
                "Find the right card, printing and language.",
                "Trouvez la bonne carte, l’édition et la langue.",
              ],
              [
                "layers",
                "Choose your seller",
                "Choisissez votre vendeur",
                "See the condition, seller minimum and handling—not just the sticker price.",
                "Consultez l’état, le minimum vendeur et le délai avec le prix.",
              ],
              [
                "package",
                "Compare the delivered total",
                "Comparez le total livré",
                "Combine cards from the same seller. Compare the total with shipping.",
                "Regroupez les cartes d’un vendeur. Comparez le total avec la livraison.",
              ],
            ] as const
          ).map(([icon, en, french, body, bodyFr], i) => ({
            id: icon,
            title: c(en, french),
            description: c(body, bodyFr),
            illustration: (
              <div className="troc-product-example">
                {i === 0 ? (
                  <>
                    <div className="troc-example-result">
                      {lead && art(lead.product)}
                      <span>
                        {lead?.product.name[page.locale]}
                        <small>
                          {c(
                            "One card. All available offers.",
                            "Une carte. Toutes les offres disponibles.",
                          )}
                        </small>
                      </span>
                    </div>
                  </>
                ) : i === 1 ? (
                  page.sellers.slice(0, 2).map((seller) => (
                    <div className="troc-example-seller" key={seller.id}>
                      <SellerAvatar name={seller.name} src={seller.logoUrl} />
                      <span>
                        {seller.name}
                        <small>
                          {seller.city}, {seller.province}
                        </small>
                      </span>
                      <span>
                        {seller.handlingDays}{" "}
                        {c(
                          seller.handlingDays === 1 ? "day" : "days",
                          seller.handlingDays === 1 ? "jour" : "jours",
                        )}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="troc-example-seller">
                      <EditorialIcon name="package" />
                      <strong>
                        {c("30 cards. One seller.", "30 cartes. Un vendeur.")}
                      </strong>
                    </div>
                    <div className="troc-example-order">
                      <span>{c("Cards", "Cartes")}</span>
                      <span>{fr ? "7,22 $" : "$7.22"}</span>
                      <span>
                        {c("Combined shipping", "Livraison regroupée")}
                      </span>
                      <span>{fr ? "4,00 $" : "$4.00"}</span>
                      <strong>
                        {c("Total before tax", "Total avant taxes")}
                      </strong>
                      <strong>{fr ? "11,22 $" : "$11.22"}</strong>
                    </div>
                  </>
                )}
              </div>
            ),
          }))}
        />
        <p className="troc-art-note">
          {c(
            "Illustrative journey. Demo sellers and basket; all amounts in CAD before tax.",
            "Parcours illustratif. Vendeurs et panier de démonstration; montants en CAD avant taxes.",
          )}
        </p>
      </section>
      <EditorialPanel className="troc-smart-edit">
        <div className="troc-smart-story">
          <EditorialIntro
            eyebrow="TROC / SMART CART"
            title={
              <>
                {c("Love the cards.", "Aimez les cartes.")}
                <br />
                {c("Lose the extra shipping.", "Réduisez la livraison.")}
              </>
            }
            description={c(
              "A 25¢ card shouldn’t get left behind. Let Smart Cart compare compatible offers, seller minimums and combined shipping.",
              "Une carte à 25 ¢ ne devrait pas être oubliée. Smart Cart compare les offres compatibles, les minimums et la livraison regroupée.",
            )}
          />
          {action(
            "/smart-cart",
            "Find a smarter total",
            "Trouver un meilleur total",
          )}
        </div>
        <SmartCartComparison
          before={{ cards: 675, shipping: 750, sellers: 3 }}
          after={{ cards: 722, shipping: 400, sellers: 1 }}
          locale={page.locale}
          labels={{
            before: c("SEPARATE ORDERS", "COMMANDES SÉPARÉES"),
            after: "SMART CART",
            cards: c("Cards", "Cartes"),
            shipping: c("Shipping", "Livraison"),
            sellers: c("seller(s)", "vendeur(s)"),
            save: c("SAVE", "ÉCONOMISEZ"),
            explanation: c(
              "+$0.47 in cards. −$3.50 in shipping. The same 30-card list, a better total.",
              "+0,47 $ en cartes. −3,50 $ en livraison. Les mêmes 30 cartes, un meilleur total.",
            ),
          }}
          note={c(
            "Tested demo basket, before tax. Actual savings depend on available offers.",
            "Panier de démonstration testé, avant taxes. Les économies dépendent des offres disponibles.",
          )}
        />
      </EditorialPanel>
      <section className="troc-home-section troc-small-edit">
        <EditorialIntro
          eyebrow={c(
            "SMALL CHANGE. REAL JOY.",
            "PETITE MONNAIE. GRAND PLAISIR.",
          )}
          title={c(
            "The little finds count, too.",
            "Les petites trouvailles comptent aussi.",
          )}
          description={c(
            "The common that finishes a set. The playset that makes a deck. Good collecting isn’t always expensive.",
            "La commune qui complète une extension. Le carré qui complète un deck. Collectionner ne coûte pas toujours cher.",
          )}
          aside={
            <a
              className="troc-editorial-text-link"
              href={href("/search", { max: "99", sort: "price" })}
            >
              {c("Cards under $1", "Cartes à moins de 1 $")}
              <EditorialIcon name="arrow" />
            </a>
          }
        />
        {cards(
          products
            .filter(
              (r) =>
                r.lowestCents !== null &&
                r.lowestCents < 100 &&
                !featured
                  .slice(0, 4)
                  .some((f) => f.product.id === r.product.id),
            )
            .slice(0, 4),
        )}
      </section>
      <section
        className="troc-home-section troc-about-home"
        aria-labelledby="troc-about-title"
      >
        <div className="troc-about-intro">
          <p className="troc-editorial-eyebrow">
            {c("ABOUT TROC", "À PROPOS DE TROC")}
          </p>
          <h2 id="troc-about-title">
            {c(
              "A home for the way we collect.",
              "Une place pour notre façon de collectionner.",
            )}
          </h2>
          <p>
            {c(
              "TROC starts with a simple idea: finding a card in Canada should make sense for the whole order, even when the card costs just a few cents.",
              "TROC part d’une idée simple : trouver une carte au Canada devrait avoir du sens pour la commande entière, même quand la carte ne coûte que quelques sous.",
            )}
          </p>
          <p>
            {c(
              "We’re building a marketplace that brings collectors, independent sellers and local shops together around the details that matter: the right card, a clear price and the cost of getting it home.",
              "Nous bâtissons un marché qui réunit collectionneurs, vendeurs indépendants et boutiques autour de l’essentiel : la bonne carte, un prix clair et le coût pour la recevoir.",
            )}
          </p>
          <a className="troc-editorial-text-link" href={href("/about")}>
            {c(
              "Discover the idea behind TROC",
              "Découvrir l’idée derrière TROC",
            )}
            <EditorialIcon name="arrow" />
          </a>
        </div>
        <MarketplacePrinciples
          items={[
            {
              id: "canada",
              icon: <EditorialIcon name="globe" />,
              title: c("Canada-first", "Pensé pour le Canada"),
              description: c(
                "A Canadian starting point for a worldwide hobby. Find offers from sellers here, with shipping and seller minimums visible before you decide.",
                "Un point de départ canadien pour une passion mondiale. Retrouvez des offres de vendeurs d’ici, avec la livraison et les minimums visibles avant de choisir.",
              ),
            },
            {
              id: "cad",
              icon: <EditorialIcon name="coin" />,
              title: c("All in CAD", "Tout en CAD"),
              description: c(
                "Compare in the currency you use. Card prices and order estimates are shown in Canadian dollars, so the complete cost is easier to understand.",
                "Comparez dans votre devise. Les prix des cartes et les estimations de commande sont en dollars canadiens, pour mieux comprendre le coût complet.",
              ),
            },
            {
              id: "languages",
              icon: <EditorialIcon name="language" />,
              title: c("English & français", "Français & English"),
              description: c(
                "Choose the language that feels natural, from discovering cards to reviewing your basket. Card language stays a separate choice, because the printing matters too.",
                "Choisissez la langue qui vous convient, de la découverte au panier. La langue de la carte reste un choix distinct : l’impression compte aussi.",
              ),
            },
            {
              id: "singles",
              icon: <EditorialIcon name="layers" />,
              title: c("Every single matters", "Chaque carte compte"),
              description: c(
                "The common that completes a set deserves a place beside the chase card. TROC is built around buying several cards and combining shipping from the same seller.",
                "La commune qui complète une extension a sa place à côté de la carte convoitée. TROC est pensé pour acheter plusieurs cartes et regrouper la livraison d’un même vendeur.",
              ),
            },
          ]}
        />
      </section>
      <section className="troc-home-section">
        <EditorialIntro
          eyebrow={c(
            "THE PEOPLE BEHIND THE CARDS",
            "LES GENS DERRIÈRE LES CARTES",
          )}
          title={c("A hobby is better together.", "La passion se partage.")}
          description={c(
            "Collectors, online sellers and local hobby shops. Different stories. The same love for the cards.",
            "Collectionneurs, vendeurs en ligne et boutiques locales. Des histoires différentes. Le même amour des cartes.",
          )}
        />
        <div className="troc-community-grid">
          {page.sellers.slice(0, 3).map((seller, i) => (
            <SellerPreviewCard
              key={seller.id}
              href={href(`/store/${seller.slug}`)}
              name={seller.name}
              location={`${seller.city}, ${seller.province}`}
              avatar={<SellerAvatar name={seller.name} src={seller.logoUrl} />}
              typeLabel={c(
                "Canadian demo store",
                "Boutique canadienne fictive",
              )}
              banner={
                seller.bannerUrl ? (
                  <img src={seller.bannerUrl} alt="" loading="lazy" />
                ) : (
                  products[i] && art(products[i].product)
                )
              }
              thumbnails={products.slice(i, i + 3).map((r) => (
                <div key={r.product.id}>{art(r.product)}</div>
              ))}
              detail={c(
                `Ships in ${seller.handlingDays} ${seller.handlingDays === 1 ? "day" : "days"} · Sample cards`,
                `Expédition en ${seller.handlingDays} ${seller.handlingDays === 1 ? "jour" : "jours"} · Exemples de cartes`,
              )}
              actionLabel={c("Explore store", "Explorer la boutique")}
            />
          ))}
        </div>
        <p className="troc-art-note">
          {c(
            "Illustrative stores. No live seller activity or endorsement is implied.",
            "Boutiques fictives. Aucune activité réelle ni affiliation n’est revendiquée.",
          )}
        </p>
      </section>
      <section className="troc-final-edit">
        <div className="troc-final-mark" aria-hidden="true">
          <TrocLogo variant="compact" height={96} />
        </div>
        <EditorialIntro
          eyebrow={c("BUILD TROC WITH US", "BÂTISSONS TROC ENSEMBLE")}
          title={c(
            "Your cards. Your store. On TROC.",
            "Vos cartes. Votre boutique. Sur TROC.",
          )}
          description={c(
            "A shared catalog. Prices in CAD. Combined shipping. Our goal: welcome 250 founding sellers to help build Canada’s card marketplace.",
            "Un catalogue commun. Des prix en CAD. La livraison regroupée. Notre objectif : accueillir 250 vendeurs fondateurs pour bâtir le marché canadien des cartes.",
          )}
        />
        <div className="troc-hero-actions">
          {action(
            "/founding-sellers",
            "Become a founding seller",
            "Devenir vendeur fondateur",
          )}
          {action(
            "/sell",
            "Explore selling on TROC",
            "Découvrir la vente sur TROC",
            true,
          )}
        </div>
      </section>
    </div>
  );
}
