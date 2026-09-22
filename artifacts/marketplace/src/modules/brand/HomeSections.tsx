import type { ReactNode } from "react";
import type { PublicPage, ProductResult, Product } from "@workspace/catalog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  CardShowcase,
  CardImage,
} from "@workspace/troc-design-system/components/ui/product-presentation";
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
              "Built here. For collectors here.",
              "D’ici. Pour les collectionneurs d’ici.",
            )}
          </p>
        </div>
        <div className="troc-hero-display">
          <div className="troc-hero-display-label">
            <span>01 / {c("THE COLLECTION", "LA COLLECTION")}</span>
            <span>{c("YOUR NEXT FIND", "VOTRE PROCHAINE TROUVAILLE")}</span>
          </div>
          <CardShowcase
            variant="showroom"
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
            {c(
              "Approved card imagery · Demo marketplace",
              "Visuels approuvés · Marché de démonstration",
            )}
          </p>
        </div>
      </section>
      <div className="troc-value-rail">
        {(
          [
            [
              "globe",
              "Canada-first",
              "Pensé pour le Canada",
              "Closer to your next find.",
              "Plus près de votre prochaine trouvaille.",
            ],
            [
              "coin",
              "All in CAD",
              "Tout en CAD",
              "Your currency. Clearer comparisons.",
              "Votre devise. Des comparaisons claires.",
            ],
            [
              "language",
              "English & français",
              "Français & English",
              "The hobby, in your language.",
              "La passion, dans votre langue.",
            ],
            [
              "layers",
              "Every single matters",
              "Chaque carte compte",
              "Yes, even the 25¢ ones.",
              "Oui, même celles à 25 ¢.",
            ],
          ] as const
        ).map(([icon, en, french, body, bodyFr]) => (
          <div key={icon}>
            <EditorialIcon name={icon} />
            <div>
              <strong>{c(en, french)}</strong>
              <p>{c(body, bodyFr)}</p>
            </div>
          </div>
        ))}
      </div>
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
              <a
                key={g.id}
                href={href(`/games/${g.slug}`)}
                className="troc-game-tile"
                data-featured={index === 0 || undefined}
              >
                <span className="troc-game-number">0{index + 1}</span>
                {p ? (
                  <div className="troc-game-art" aria-hidden="true">
                    {art(p)}
                  </div>
                ) : (
                  <div className="troc-game-fallback" aria-hidden="true">
                    <EditorialIcon name="layers" />
                  </div>
                )}
                <div className="troc-game-tile-copy">
                  <span>{g.name[page.locale]}</span>
                  <EditorialIcon name="arrow" />
                </div>
                <span className="troc-game-subtitle">
                  {c(
                    p ? "Explore the edit" : "Explore the demo",
                    p ? "Découvrir la sélection" : "Explorer la démo",
                  )}
                </span>
              </a>
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
        <div className="troc-how-steps">
          {(
            [
              [
                "search",
                "One catalog",
                "Un catalogue",
                "Find the right card, printing and language.",
                "Trouvez la bonne carte, l’édition et la langue.",
              ],
              [
                "layers",
                "Compare the whole offer",
                "Comparez l’offre complète",
                "See the condition, seller minimum and handling—not just the sticker price.",
                "Consultez l’état, le minimum vendeur et le délai avec le prix.",
              ],
              [
                "package",
                "Build a better order",
                "Composez une meilleure commande",
                "Combine cards from the same seller. Compare the total with shipping.",
                "Regroupez les cartes d’un vendeur. Comparez le total avec la livraison.",
              ],
            ] as const
          ).map(([icon, en, french, body, bodyFr], i) => (
            <div key={icon}>
              <span className="troc-step-index">0{i + 1}</span>
              <EditorialIcon name={icon} />
              <div>
                <h3>{c(en, french)}</h3>
                <p>{c(body, bodyFr)}</p>
              </div>
            </div>
          ))}
        </div>
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
        <div className="troc-smart-proof">
          <p className="troc-editorial-eyebrow">
            {c(
              "SAME 30-CARD LIST. DIFFERENT TOTAL.",
              "MÊME LISTE DE 30 CARTES. AUTRE TOTAL.",
            )}
          </p>
          <div className="troc-smart-proof-columns">
            <div>
              <p>{c("Separate orders", "Commandes séparées")}</p>
              <div className="troc-parcels" aria-hidden="true">
                <EditorialIcon name="package" />
                <EditorialIcon name="package" />
                <EditorialIcon name="package" />
              </div>
              <span className="troc-proof-total">
                {fr ? "14,25 $" : "$14.25"}
              </span>
              <p>
                {c(
                  "3 sellers · $7.50 shipping",
                  "3 vendeurs · 7,50 $ de livraison",
                )}
              </p>
            </div>
            <div className="troc-smart-proof-after">
              <p>{c("Consolidated", "Regroupées")}</p>
              <div className="troc-parcels" aria-hidden="true">
                <EditorialIcon name="package" />
              </div>
              <span className="troc-proof-total">
                {fr ? "11,22 $" : "$11.22"}
              </span>
              <p>
                {c(
                  "1 seller · $4.00 shipping",
                  "1 vendeur · 4,00 $ de livraison",
                )}
              </p>
            </div>
          </div>
          <div className="troc-proof-saving">
            <EditorialIcon name="check" />
            <span>
              {c("$3.50 less shipping", "3,50 $ de moins en livraison")}
            </span>
            <strong>
              {c("$3.03 saved overall", "3,03 $ économisés au total")}
            </strong>
          </div>
          <p className="troc-art-note">
            {c(
              "Tested demo basket, before tax. Card prices vary between sellers. Actual savings depend on the available offers.",
              "Panier de démonstration testé, avant taxes. Le prix des cartes varie selon le vendeur. Les économies dépendent des offres disponibles.",
            )}
          </p>
        </div>
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
      <EditorialPanel
        tone="contrast"
        className="troc-canada-edit"
        image={heroes[0] && art(heroes[0].product)}
      >
        <div className="troc-canada-heading">
          <p className="troc-editorial-eyebrow">
            {c("CANADIAN OWNED & OPERATED", "ENTREPRISE CANADIENNE")}
          </p>
          <h2>
            {c("Built here.", "D’ici.")}
            <br />
            <span>
              {c("For collectors here.", "Pour les collectionneurs d’ici.")}
            </span>
          </h2>
          <TrocLogo variant="compact" height={32} />
        </div>
        <div className="troc-canada-copy">
          <p>
            {c(
              "For the way we actually collect.",
              "Pour notre façon de collectionner.",
            )}
          </p>
          <p>
            {c(
              "From a shop in Montréal to a binder in Vancouver. Our hobby crosses the country. Buying cards should feel a little closer to home.",
              "D’une boutique à Montréal à un cartable à Vancouver. Notre passion traverse le pays. Acheter des cartes devrait nous rapprocher.",
            )}
          </p>
          <p>
            {c(
              "CAD from the start. English and French. Canadian sellers. Room for every part of your collection.",
              "Le CAD dès le départ. Le français et l’anglais. Des vendeurs canadiens. Une place pour chaque carte de votre collection.",
            )}
          </p>
          <a className="troc-editorial-text-link" href={href("/about")}>
            {c("Why we’re building TROC", "Pourquoi nous créons TROC")}
            <EditorialIcon name="arrow" />
          </a>
        </div>
        <div className="troc-canada-foot">
          CANADA <span>CAD / EN + FR</span>
        </div>
      </EditorialPanel>
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
          {page.sellers.slice(0, 3).map((s, i) => (
            <article className="troc-community-store" key={s.id}>
              <div className="troc-community-location">
                <EditorialIcon name="pin" />
                <span>
                  {s.city}, {s.province}
                </span>
                <span className="troc-community-code" aria-hidden="true">
                  {s.province}
                </span>
              </div>
              <div className="troc-community-identity">
                <SellerAvatar name={s.name} src={s.logoUrl} />
                <div>
                  <h3>{s.name}</h3>
                  <p>
                    {c("Canadian demo store", "Boutique canadienne fictive")}
                  </p>
                </div>
              </div>
              <p className="troc-community-story">{s.story[page.locale]}</p>
              <a
                className="troc-editorial-text-link"
                href={href(`/store/${s.slug}`)}
              >
                {c("Step inside", "Entrer dans la boutique")}
                <EditorialIcon name="arrow" />
              </a>
              <span className="troc-art-note">
                0{i + 1} / {c("DEMO STORE", "BOUTIQUE DÉMO")}
              </span>
            </article>
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
          eyebrow={c(
            "YOUR NEXT CHAPTER STARTS HERE",
            "VOTRE PROCHAIN CHAPITRE COMMENCE ICI",
          )}
          title={c(
            "Make room for a new favourite.",
            "Faites place à un nouveau favori.",
          )}
          description={c(
            "Find the card. Meet the seller. Keep the hobby going.",
            "Trouvez la carte. Découvrez le vendeur. Faites vivre la passion.",
          )}
        />
        <div className="troc-hero-actions">
          {action(
            "/search",
            "Find your next card",
            "Trouver votre prochaine carte",
          )}
          {action(
            "/founding-sellers",
            "Become a founding seller",
            "Devenir vendeur fondateur",
            true,
          )}
        </div>
      </section>
    </div>
  );
}
