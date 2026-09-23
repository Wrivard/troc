import { AboutTrocSection } from "./home-community/AboutTrocSection";
import { SellerCommunitySection } from "./home-community/SellerCommunitySection";
import { SellerCtaSection } from "./home-community/SellerCtaSection";
import { InteractiveCardStack } from "@workspace/troc-design-system/components/ui/interactive-card-stack";
import {
  GameTile,
  MarketplaceJourney,
  MarketplaceStats,
  SmartCartComparison,
} from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import type { CSSProperties, ReactNode } from "react";
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
import { imagesForVariant } from "../catalog/images";

// Structural presentation input for A's CatalogStats projection (a8865e8).
// Optional so the component also renders safely before that server projection is integrated.
type HomeStats = {
  status: "available" | "unavailable";
  source: "demo_snapshot" | "database";
  scope: "demo_catalog" | "non_demo_catalog";
  measuredAt: string | null;
  catalogProducts: number | null;
  activeListings: number | null;
  listedUnits: number | null;
  activeSellers: number | null;
};

export function HomeSections({
  page,
  cards,
  href,
}: {
  page: PublicPage & { stats?: HomeStats };
  cards: (items: ProductResult[], presentation?: "shelf") => ReactNode;
  href: (path: string, params?: Record<string, string>) => string;
}) {
  const fr = page.locale === "fr";
  const c = (en: string, french: string) => (fr ? french : en);
  const stats = page.stats;
  const demoStats = page.demo;
  // Approved fictional presentation preset. Never a live-data fallback or server metric.
  const illustrative = new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const categoryBackgrounds: Record<string, string> = {
    pokemon: "pokemon-card-bg-category",
    magic: "magic-card-bg-category",
    "yu-gi-oh": "yu-gi-yo-card-bg-category",
    "one-piece": "one-piece-bg-category",
    riftbound: "riftbound-bg-category",
  };
  const metric = (
    key: "catalogProducts" | "activeListings" | "listedUnits" | "activeSellers",
  ) => {
    const value = stats?.[key];
    return stats?.status === "available" &&
      typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value >= 0
      ? new Intl.NumberFormat(fr ? "fr-CA" : "en-CA").format(value)
      : null;
  };
  const measuredAt = stats?.measuredAt ? new Date(stats.measuredAt) : null;
  const measuredLabel =
    measuredAt && Number.isFinite(measuredAt.getTime())
      ? `${c("Snapshot", "Instantané")} · ${new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(measuredAt)} UTC. `
      : "";
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
      <section
        className="troc-home-hero troc-cinematic-hero dark"
        lang={page.locale}
        style={
          {
            "--hero-image": `url("${import.meta.env.BASE_URL}hero/canadian-marketplace-2x-v1.webp")`,
          } as CSSProperties
        }
      >
        {page.demo && (
          <p className="troc-hero-demo-note" role="note">
            {c(
              "Demo marketplace · Fictional sellers, prices and inventory. No purchases available.",
              "Marché de démonstration · Vendeurs, prix et stocks fictifs. Aucun achat offert.",
            )}
          </p>
        )}
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
              "Compare Canadian sellers in one place. Singles, sealed and graded.",
              "Comparez les vendeurs canadiens au même endroit. Cartes à l’unité, scellées et gradées.",
            )}
            <br />
            {c("All in CAD.", "Tout en CAD.")}
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
            <Button asChild>
              <a href={href("/search")}>
                {c("Explore cards", "Explorer les cartes")}
                <EditorialIcon name="forward" />
              </a>
            </Button>
            <a
              className="troc-editorial-text-link"
              href={href("/founding-sellers")}
            >
              {c("Sell with TROC", "Vendre avec TROC")}
              <EditorialIcon name="arrow" />
            </a>
          </div>
        </div>
        <div className="troc-hero-display">
          <span className="sr-only">
            {c(
              "Built for Canadians, by Canadians.",
              "Pensé pour les Canadiens, par des Canadiens.",
            )}
          </span>
          <InteractiveCardStack
            label={c("Pokémon leads the collection", "Pokémon au premier plan")}
            cards={heroes.map((r) => art(r.product, true))}
          />
        </div>
        <div className="troc-hero-benefits">
          {(
            [
              [
                "globe",
                "Canada-first",
                "Pensé pour le Canada",
                "Canadian sellers. Prices in CAD.",
                "Vendeurs canadiens. Prix en CAD.",
              ],
              [
                "coin",
                "All in CAD",
                "Tout en CAD",
                "No surprises at checkout.",
                "Sans surprise au paiement.",
              ],
              [
                "language",
                "English & français",
                "Français & English",
                "A marketplace for everyone.",
                "Un marché pour tout le monde.",
              ],
              [
                "layers",
                "Every single matters",
                "Chaque carte compte",
                "From commons to chase cards.",
                "Des communes aux cartes convoitées.",
              ],
            ] as const
          ).map(([icon, en, french, body, bodyFr]) => (
            <div key={icon}>
              <span className="troc-hero-benefit-icon" aria-hidden="true">
                <EditorialIcon name={icon} />
              </span>
              <div>
                <strong>{c(en, french)}</strong>
                <p>{c(body, bodyFr)}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="troc-hero-closing">
          {c("COLLECTING MADE EASIER", "COLLECTIONNER, SIMPLEMENT")}
        </p>
      </section>
      <MarketplaceStats
        label={c("MARKETPLACE AT A GLANCE", "LE MARCHÉ EN UN COUP D’ŒIL")}
        decoration={
          <img
            src={`${import.meta.env.BASE_URL}home-editorial/maple-leaf.webp`}
            alt=""
            loading="lazy"
          />
        }
        scope={
          demoStats
            ? c(
                "Illustrative demo figures · CAD",
                "Chiffres fictifs de démonstration · CAD",
              )
            : stats?.status === "available"
              ? c(
                  "TROC catalog · published products and active listings",
                  "Catalogue TROC · produits publiés et offres actives",
                )
              : c(
                  "Marketplace figures · currently unavailable",
                  "Les chiffres du marché · indisponibles pour le moment",
                )
        }
        source={
          demoStats
            ? c(
                "Fictional figures for this design preview. They do not represent real marketplace activity, sellers or transactions.",
                "Chiffres fictifs pour cet aperçu visuel. Ils ne représentent aucune activité, aucun vendeur ni aucune transaction réels.",
              )
            : stats?.status !== "available"
              ? c(
                  "Totals are currently unavailable. Missing data is not a zero count.",
                  "Les totaux sont indisponibles pour le moment. Une donnée manquante ne signifie pas zéro.",
                )
              : measuredLabel +
                c(
                  "Source: published catalog and qualifying active Canadian seller listings. Listed quantities can change and are not reserved stock.",
                  "Source : catalogue publié et offres actives admissibles de vendeurs canadiens. Les quantités affichées peuvent changer et ne sont pas réservées.",
                )
        }
        unavailableLabel={c("Not available", "Indisponible")}
        items={[
          {
            id: demoStats ? "monthly-volume" : "products",
            value: demoStats
              ? `${illustrative.format(575000)} CAD`
              : metric("catalogProducts"),
            label: demoStats
              ? c("Monthly volume", "Volume mensuel")
              : c("Catalog products", "Produits du catalogue"),
            detail: demoStats
              ? c("Illustrative monthly total", "Total mensuel fictif")
              : c(
                  "Distinct canonical products",
                  "Produits canoniques distincts",
                ),
          },
          {
            id: "listings",
            value: demoStats
              ? illustrative.format(3500000)
              : metric("activeListings"),
            label: c("Seller listings", "Offres des vendeurs"),
            detail: c(
              "Active offers, across sellers",
              "Offres actives, tous vendeurs confondus",
            ),
          },
          {
            id: "units",
            value: demoStats
              ? illustrative.format(8200000)
              : metric("listedUnits"),
            label: c("Listed units", "Exemplaires en vente"),
            detail: c(
              "Quantities across active listings",
              "Quantités des offres actives",
            ),
          },
          {
            id: "sellers",
            value: demoStats
              ? illustrative.format(2400)
              : metric("activeSellers"),
            label: c("Active sellers", "Vendeurs actifs"),
            detail: c(
              "Sellers with available offers",
              "Vendeurs proposant des offres disponibles",
            ),
          },
        ]}
      />
      <section className="troc-home-section troc-category-section">
        <div className="troc-category-heading">
          <EditorialIntro
            eyebrow={c("FIVE GAMES. ONE PLACE.", "CINQ JEUX. UN SEUL ENDROIT.")}
            title={
              <>
                {c("Find your world", "Trouvez votre univers")}
                <span className="troc-heading-period">.</span>
              </>
            }
            description={c(
              "A new deck. A familiar favourite. Follow what you collect.",
              "Un nouveau deck. Un grand favori. Suivez votre passion.",
            )}
          />
          <p className="troc-category-aside">
            {c("CARDS", "CARTES")}
            <br />
            {c("PEOPLE", "PASSION")}
            <br />
            {c("COMMUNITY", "COMMUNAUTÉ")}
            <br />
            CANADA
          </p>
        </div>
        <div className="troc-game-edit">
          {games.map((g, index) => {
            return (
              <GameTile
                key={g.id}
                href={href(`/games/${g.slug}`)}
                index={String(index + 1).padStart(2, "0")}
                name={g.name[page.locale]}
                description={
                  g.slug === "riftbound"
                    ? c(
                        "Card-back artwork coming soon",
                        "Visuel du dos à venir",
                      )
                    : c(
                        "Singles · Sealed · Graded",
                        "Unités · Scellées · Gradées",
                      )
                }
                backgroundSrc={
                  categoryBackgrounds[g.slug]
                    ? `${import.meta.env.BASE_URL}home-editorial/${categoryBackgrounds[g.slug]}.webp`
                    : undefined
                }
                art={
                  g.slug !== "riftbound" && categoryBackgrounds[g.slug] ? (
                    <img
                      src={`${import.meta.env.BASE_URL}home-editorial/${g.slug}-back.webp`}
                      alt=""
                      loading="lazy"
                    />
                  ) : null
                }
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
              <span className="troc-journey-headline-secondary">
                {c("The whole order matters.", "La commande complète compte.")}
              </span>
            </>
          }
          aside={
            <span className="troc-journey-editorial-detail">
              {c("CARDS", "CARTES")}
              <br />
              {c("PEOPLE", "PASSION")}
              <br />
              {c("TOGETHER", "ENSEMBLE")}
            </span>
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
          variant="panels"
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
          "shelf",
        )}
      </section>
      <AboutTrocSection locale={page.locale} href={href} />
      <SellerCommunitySection page={page} href={href} art={art} />
      <SellerCtaSection locale={page.locale} href={href} demo={page.demo} />
    </div>
  );
}
