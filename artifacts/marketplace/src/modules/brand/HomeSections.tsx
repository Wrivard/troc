import type { ReactNode } from "react";
import type { PublicPage, ProductResult } from "@workspace/catalog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  CardShowcase,
  CardImage,
} from "@workspace/troc-design-system/components/ui/product-presentation";
import {
  SellerAvatar,
  SellerStorefrontHeader,
} from "@workspace/troc-design-system/components/ui/seller-storefront";
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
  const copy = (en: string, french: string) => (fr ? french : en);
  const illustrated = page.results.filter((r) => r.product.images?.length);
  const products = illustrated.length ? illustrated : page.results;
  // A balanced selection across games; no invented popularity or sales ranking.
  const featured = [
    ...new Map(
      [
        ...page.games.flatMap((g) =>
          products.filter((r) => r.product.gameId === g.id).slice(0, 2),
        ),
        ...products,
      ].map((r) => [r.product.id, r]),
    ).values(),
  ];
  const heroes = page.games
    .flatMap((g) =>
      featured.filter((r) => r.product.gameId === g.id).slice(0, 1),
    )
    .slice(0, 3);
  const link = (url: string, en: string, french: string, secondary = false) => (
    <Button asChild variant={secondary ? "secondary" : "primary"}>
      <a href={href(url)}>{copy(en, french)}</a>
    </Button>
  );
  return (
    <div className="grid gap-16 md:gap-24">
      <section className="grid items-center gap-8 pt-6 lg:grid-cols-2 lg:gap-12 lg:py-8">
        <div className="grid gap-6">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground">
            {copy(
              "CANADA’S TRADING CARD MARKETPLACE",
              "LE MARCHÉ CANADIEN DES CARTES",
            )}
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
            {copy("One search.", "Une recherche.")}
            <br />
            {copy("Every seller.", "Tous les vendeurs.")}
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            {copy(
              "Find your next card. Compare Canadian sellers. All prices in CAD.",
              "Trouvez votre prochaine carte. Comparez les vendeurs canadiens. Tous les prix en dollars canadiens.",
            )}
          </p>
          <form
            role="search"
            aria-label={copy(
              "Find your next card",
              "Trouvez votre prochaine carte",
            )}
            action={href("/search").split("?")[0]}
            className="flex gap-2"
          >
            <input type="hidden" name="lang" value={page.locale} />
            <Input
              name="q"
              maxLength={100}
              aria-label={copy(
                "Card or set name",
                "Nom de carte ou d’extension",
              )}
              placeholder={copy(
                "What are you collecting?",
                "Que collectionnez-vous?",
              )}
              className="min-w-0 flex-1"
            />
            <Button type="submit">{copy("Search", "Chercher")}</Button>
          </form>
          <div className="flex flex-wrap gap-3">
            {link("/search", "Shop cards", "Magasiner les cartes")}
            {link(
              "/founding-sellers",
              "Become a founding seller",
              "Devenir vendeur fondateur",
              true,
            )}
          </div>
        </div>
        <div>
          <CardShowcase
            label={copy(
              "A few cards. Endless possibilities.",
              "Quelques cartes. Tant de possibilités.",
            )}
            cards={heroes.map(({ product }) => {
              const image = imagesForVariant(product, product.variants[0])[0];
              return (
                <CardImage
                  key={product.id}
                  src={image?.url}
                  srcSet={image?.sources
                    .map((s) => `${s.url} ${s.width}w`)
                    .join(", ")}
                  sizes="(min-width: 1024px) 240px, 32vw"
                  width={image?.width}
                  height={image?.height}
                  eager
                  alt={product.name[page.locale]}
                  missingLabel={copy("Artwork coming soon", "Visuel à venir")}
                />
              );
            })}
          />
          <p className="text-center text-xs text-muted-foreground">
            {copy(
              "Real cards. Demo marketplace.",
              "De vraies cartes. Un marché de démonstration.",
            )}
          </p>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-6 border-y border-border py-6 md:grid-cols-4">
        {[
          [
            "Canada-first",
            "Pensé pour le Canada",
            "Canadian sellers, closer to home.",
            "Des vendeurs canadiens, plus près de vous.",
          ],
          [
            "All in CAD",
            "Tout en dollars canadiens",
            "Compare prices in your currency.",
            "Comparez les prix dans votre devise.",
          ],
          [
            "English & français",
            "Français & English",
            "Your hobby. Your language.",
            "Votre passion. Votre langue.",
          ],
          [
            "Every single matters",
            "Chaque carte compte",
            "Built for the cards under $1, too.",
            "Aussi pour les cartes à moins de 1 $.",
          ],
        ].map(([en, french, body, bodyFr]) => (
          <div className="grid gap-2" key={en}>
            <p className="text-sm font-semibold">{copy(en, french)}</p>
            <p className="text-sm text-muted-foreground">
              {copy(body, bodyFr)}
            </p>
          </div>
        ))}
      </div>
      <section id="browse-games" className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {copy("Find your game.", "Trouvez votre jeu.")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {copy("Singles · Sealed · Graded", "À l’unité · Scellés · Gradées")}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {page.games.map((g, index) => (
            <a
              key={g.id}
              href={href(`/games/${g.slug}`)}
              className="grid content-between gap-4 rounded-lg border border-border bg-card p-4 md:gap-6 md:p-6 hover:border-foreground"
            >
              <span className="text-xs text-muted-foreground">
                0{index + 1}
              </span>
              <span className="font-semibold">
                {g.name[page.locale]} <span aria-hidden="true">↗</span>
              </span>
            </a>
          ))}
        </div>
      </section>
      <section className="grid gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy("THE DISCOVERY EDIT", "À DÉCOUVRIR")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">
              {copy("Your next great find.", "Votre prochaine trouvaille.")}
            </h2>
          </div>
          {link(
            "/search",
            "Explore the marketplace",
            "Explorer le marché",
            true,
          )}
        </div>
        {page.demo && (
          <p className="text-sm text-muted-foreground">
            {copy(
              "A curated demo selection. Prices and stock are illustrative.",
              "Une sélection de démonstration. Prix et stocks fictifs.",
            )}
          </p>
        )}
        {cards(featured.slice(0, 4))}
      </section>
      <section className="grid gap-8 border-y border-border py-12">
        <h2 className="text-2xl font-bold tracking-tight">
          {copy(
            "Less searching. More collecting.",
            "Moins chercher. Plus collectionner.",
          )}
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            [
              "01",
              "One catalog",
              "Un catalogue",
              "Find the right card, printing and language without opening a dozen tabs.",
              "Trouvez la bonne carte, l’édition et la langue sans multiplier les onglets.",
            ],
            [
              "02",
              "Compare the whole offer",
              "Comparez l’offre complète",
              "See condition, seller minimums and handling alongside the price.",
              "Consultez l’état, le minimum du vendeur et le délai de traitement avec le prix.",
            ],
            [
              "03",
              "Build a better order",
              "Composez une meilleure commande",
              "Group your cards by seller. Let Smart Cart compare the total, including shipping.",
              "Regroupez vos cartes par vendeur. Smart Cart compare le total, livraison comprise.",
            ],
          ].map(([n, en, french, body, bodyFr]) => (
            <div className="grid content-start gap-3" key={n}>
              <span className="text-sm text-muted-foreground">{n}</span>
              <h3 className="text-lg font-semibold">{copy(en, french)}</h3>
              <p className="leading-relaxed text-muted-foreground">
                {copy(body, bodyFr)}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div className="grid gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            SMART CART
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {copy(
              "More cards. Less shipping.",
              "Plus de cartes. Moins de frais.",
            )}
          </h2>
          <p className="max-w-lg leading-relaxed text-muted-foreground">
            {copy(
              "A 25¢ card deserves a place in your order. Compare sellers, reach minimums and combine shipping—without losing sight of the cards you actually want.",
              "Une carte à 25 ¢ mérite sa place dans votre commande. Comparez les vendeurs, atteignez leurs minimums et regroupez la livraison, tout en gardant les cartes que vous voulez.",
            )}
          </p>
          <div>
            {link("/smart-cart", "Explore Smart Cart", "Découvrir Smart Cart")}
          </div>
        </div>
        <div className="grid gap-6 rounded-lg border border-border bg-card p-6 md:p-8">
          <p className="text-sm font-semibold">
            {copy(
              "30 cards. A smarter total.",
              "30 cartes. Un meilleur total.",
            )}
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                {copy("Before", "Avant")}
              </p>
              <p className="text-3xl font-bold">{fr ? "14,25 $" : "$14.25"}</p>
              <p className="text-sm text-muted-foreground">
                {copy(
                  "3 sellers · $7.50 shipping",
                  "3 vendeurs · 7,50 $ de livraison",
                )}
              </p>
            </div>
            <div className="grid gap-2 border-l border-border pl-6">
              <p className="text-sm font-semibold">
                {copy("Consolidated", "Regroupé")}
              </p>
              <p className="text-3xl font-bold">{fr ? "11,22 $" : "$11.22"}</p>
              <p className="text-sm text-muted-foreground">
                {copy(
                  "1 seller · $4.00 shipping",
                  "1 vendeur · 4,00 $ de livraison",
                )}
              </p>
            </div>
          </div>
          <p className="border-t border-border pt-4 text-sm">
            {copy(
              "$3.03 saved in this demo scenario.",
              "3,03 $ économisés dans cet exemple.",
            )}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {copy(
              "Illustrative tested basket, before tax. Card prices can change between sellers. Your savings depend on available offers, minimums and shipping.",
              "Panier de démonstration testé, avant taxes. Le prix des cartes varie selon le vendeur. Vos économies dépendent des offres, des minimums et de la livraison.",
            )}
          </p>
        </div>
      </section>
      <section className="grid gap-6">
        <div className="flex flex-wrap justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {copy(
              "Small prices. Big possibilities.",
              "Petits prix. Grandes possibilités.",
            )}
          </h2>
          <a
            className="text-sm underline"
            href={href("/search", { max: "99", sort: "price" })}
          >
            {copy("Browse cards under $1", "Voir les cartes à moins de 1 $")}
          </a>
        </div>
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
      <section className="grid gap-8 rounded-lg bg-card p-6 md:grid-cols-2 md:p-12">
        <div className="grid content-start gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {copy("OUR HOME. OUR HOBBY.", "NOTRE PASSION, ICI.")}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {copy("Built here.", "D’ici.")}
            <br />
            {copy("For collectors here.", "Pour les collectionneurs d’ici.")}
          </h2>
        </div>
        <div className="grid content-start gap-5">
          <p className="text-lg leading-relaxed">
            {copy(
              "Canadian owned and operated. Created for the way Canadians actually buy cards.",
              "Une entreprise canadienne. Créée pour la façon dont on achète des cartes ici.",
            )}
          </p>
          <p className="leading-relaxed text-muted-foreground">
            {copy(
              "From the last common in your set to the card you’ve been chasing for years. TROC brings Canadian sellers, CAD pricing and English and French together in one place.",
              "De la dernière carte commune de votre extension à celle que vous cherchez depuis des années. TROC réunit les vendeurs canadiens, les prix en dollars canadiens et les deux langues, au même endroit.",
            )}
          </p>
          <a className="font-semibold underline" href={href("/about")}>
            {copy("The story behind TROC", "L’histoire de TROC")}
          </a>
        </div>
      </section>
      <section className="grid gap-6">
        <div className="grid gap-3">
          <h2 className="text-2xl font-bold tracking-tight">
            {copy(
              "Behind every card, a community.",
              "Derrière chaque carte, une communauté.",
            )}
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            {copy(
              "Independent collectors, online sellers and local hobby shops. Discover the people who keep the hobby moving.",
              "Collectionneurs indépendants, vendeurs en ligne et boutiques locales. Découvrez ceux qui font vivre la passion.",
            )}
          </p>
          {page.demo && (
            <p className="text-xs text-muted-foreground">
              {copy(
                "Illustrative stores—not live sellers or endorsements.",
                "Boutiques fictives : ni vendeurs actifs ni recommandations.",
              )}
            </p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {page.sellers.slice(0, 3).map((s) => (
            <SellerStorefrontHeader
              key={s.id}
              name={s.name}
              avatar={<SellerAvatar name={s.name} src={s.logoUrl} />}
              tagline={`${s.city}, ${s.province}`}
              compact
              actions={
                <Button asChild variant="secondary">
                  <a href={href(`/store/${s.slug}`)}>
                    {copy("Explore store", "Voir la boutique")}
                  </a>
                </Button>
              }
            />
          ))}
        </div>
      </section>
      <section className="grid gap-6 border-t border-border py-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          {copy(
            "Make room for your next find.",
            "Faites place à votre prochaine trouvaille.",
          )}
        </h2>
        <p className="text-muted-foreground">
          {copy(
            "Build your next deck. Complete that set. Find your people.",
            "Préparez votre prochain deck. Complétez votre extension. Trouvez votre communauté.",
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {link("/search", "Start exploring", "Commencer à explorer")}
          {link(
            "/founding-sellers",
            "Sell with TROC",
            "Vendre avec TROC",
            true,
          )}
        </div>
      </section>
    </div>
  );
}
