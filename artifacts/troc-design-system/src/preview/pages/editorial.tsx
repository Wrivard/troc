import {
  InteractiveCardStack,
  ProductArtworkPanel,
} from "../../components/ui/interactive-card-stack";
import {
  MarketplaceProductCard,
  ProductPurchaseSummary,
  GameTile,
  GameHero,
  StoreHero,
  SellerPreviewCard,
  SmartCartComparison,
  PremiumEmptyState,
} from "../../components/ui/marketplace-compositions";
import { SellerAvatar } from "../../components/ui/seller-storefront";
import { Button } from "../../components/ui/button";
import {
  EditorialIntro,
  EditorialCatalogGrid,
  EditorialPanel,
  EditorialIcon,
} from "../../components/ui/editorial";
import {
  CardShowcase,
  ProductCard,
  CardTitle,
  CardImage,
} from "../../components/ui/product-presentation";
import { usePreferences } from "../../hooks/use-preferences";
import { demoArtwork } from "../demo-assets";
import { PageHeader, Section } from "../parts";
export default function EditorialPage() {
  const { locale } = usePreferences();
  const fr = locale === "fr";
  const art = (src: string, name: string) => (
    <CardImage
      src={src}
      alt={name}
      missingLabel={fr ? "Visuel indisponible" : "Artwork unavailable"}
    />
  );
  const pieces = [
    art(demoArtwork.pikachu, "Pikachu"),
    art(demoArtwork.lightningBolt, "Lightning Bolt"),
    art(demoArtwork.luffy, "Luffy"),
  ];
  return (
    <>
      <PageHeader
        title={fr ? "Compositions éditoriales" : "Editorial compositions"}
        description={
          fr
            ? "Hiérarchie, contraste et profondeur avec les tokens approuvés."
            : "Hierarchy, contrast and depth using the approved tokens."
        }
      />
      <Section title={fr ? "Ouverture de page" : "Page opening"}>
        <EditorialIntro
          eyebrow="TROC · CANADA"
          title={fr ? "Chaque carte a sa place." : "Every card has its place."}
          description={
            fr
              ? "Une introduction claire, un contexte utile et une action principale."
              : "One clear introduction, useful context and a primary action."
          }
          aside={<EditorialIcon name="layers" />}
        />
      </Section>
      <Section title={fr ? "Surfaces éditoriales" : "Editorial surfaces"}>
        {(["quiet", "contrast"] as const).map((tone) => (
          <EditorialPanel key={tone} tone={tone}>
            <EditorialIntro
              compact
              eyebrow="TROC · CAD · EN / FR"
              title={
                fr
                  ? "D’ici. Pour les collectionneurs d’ici."
                  : "Built here. For collectors here."
              }
              description={
                fr
                  ? "Réserver le contraste fort aux moments de marque. Les images de fond restent décoratives."
                  : "Reserve strong contrast for brand moments. Background images remain decorative."
              }
            />
          </EditorialPanel>
        ))}
      </Section>
      <Section
        title={fr ? "Présentation en profondeur" : "Showroom presentation"}
        description={
          fr
            ? "La première carte mène. Inclinaison légère à la souris; aucune boucle. Le mouvement réduit désactive les transitions et le parallaxe."
            : "The first card leads. Gentle mouse tilt; no animation loop. Reduced motion disables transitions and parallax."
        }
      >
        <CardShowcase
          variant="showroom"
          label={fr ? "Exemple de présentation" : "Presentation example"}
          cards={[
            demoArtwork.pikachu,
            demoArtwork.lightningBolt,
            demoArtwork.luffy,
          ].map((src, i) => (
            <CardImage
              missingLabel={fr ? "Image indisponible" : "Image unavailable"}
              key={src}
              src={src}
              alt={["Pikachu", "Lightning Bolt", "Luffy"][i]}
            />
          ))}
        />
      </Section>
      <Section
        title={fr ? "Catalogue éditorial" : "Editorial catalog"}
        description={
          fr
            ? "Une grille légère autour du composant ProductCard approuvé."
            : "An open grid around the approved ProductCard component."
        }
      >
        <EditorialCatalogGrid>
          {[demoArtwork.pikachu, demoArtwork.lightningBolt].map((src, i) => (
            <ProductCard
              key={src}
              image={
                <CardImage
                  src={src}
                  alt={["Pikachu", "Lightning Bolt"][i]}
                  missingLabel={fr ? "Image indisponible" : "Image unavailable"}
                />
              }
              title={<CardTitle>{["Pikachu", "Lightning Bolt"][i]}</CardTitle>}
            />
          ))}
        </EditorialCatalogGrid>
      </Section>
      <Section
        title="InteractiveCardStack"
        description={
          fr
            ? "Profondeur DOM réelle, mouvement lissé par animation frame, retour au repos. Souris uniquement; mouvement réduit et pause hors écran."
            : "Real DOM depth, frame-batched easing and return to rest. Mouse only; reduced-motion and offscreen pause."
        }
      >
        <InteractiveCardStack
          cards={pieces}
          label={fr ? "Cartes interactives" : "Interactive cards"}
        />
      </Section>
      <Section title="MarketplaceProductCard">
        <EditorialCatalogGrid>
          <MarketplaceProductCard
            href="#page=editorial"
            name="Pikachu"
            image={pieces[0]}
            metadata="Pokémon · Demo · 025"
            fromLabel={fr ? "Dès" : "From"}
            price={fr ? "0,05 $" : "$0.05"}
            availability={
              fr ? "3 vendeurs · 180 disponibles" : "3 sellers · 180 available"
            }
            reference={fr ? "Référence 0,15 $" : "Reference $0.15"}
          />
          <MarketplaceProductCard
            href="#page=editorial"
            name="Lightning Bolt"
            image={pieces[1]}
            metadata="Magic · Demo"
            fromLabel={fr ? "Dès" : "From"}
            price="—"
            availability={fr ? "Aucune offre" : "No offers"}
          />
        </EditorialCatalogGrid>
      </Section>
      <Section title="GameTile">
        <div className="grid gap-4 sm:grid-cols-2">
          <GameTile
            href="#page=editorial"
            index="01"
            name="Pokémon"
            description={
              fr ? "Unités · Scellées · Gradées" : "Singles · Sealed · Graded"
            }
            art={pieces[0]}
          />
          <GameTile
            href="#page=editorial"
            index="02"
            name={fr ? "Sans visuel approuvé" : "No approved artwork"}
            description={fr ? "État de remplacement" : "Fallback state"}
          />
        </div>
      </Section>
      <Section title="GameHero">
        <GameHero
          level={2}
          title="Pokémon"
          eyebrow="TROC · DEMO"
          description={
            fr
              ? "Un espace compact pour explorer votre jeu."
              : "A compact destination for your game."
          }
          cards={pieces.slice(0, 1)}
        />
      </Section>
      <Section
        title={fr ? "GameHero · sans visuel" : "GameHero · without artwork"}
      >
        <GameHero
          level={2}
          title="Riftbound"
          eyebrow="TROC · DEMO"
          description={
            fr
              ? "La navigation reste accessible sans réserver une zone d’image vide."
              : "Navigation stays available without reserving an empty artwork area."
          }
          cards={[]}
        />
      </Section>
      <Section title="SmartCartComparison">
        <SmartCartComparison
          before={{ cards: 675, shipping: 750, sellers: 3 }}
          after={{ cards: 722, shipping: 400, sellers: 1 }}
          locale={fr ? "fr" : "en"}
          labels={{
            before: fr ? "AVANT" : "BEFORE",
            after: "SMART CART",
            cards: fr ? "Cartes" : "Cards",
            shipping: fr ? "Livraison" : "Shipping",
            sellers: fr ? "vendeur(s)" : "seller(s)",
            save: fr ? "ÉCONOMISEZ" : "SAVE",
            explanation: fr
              ? "+0,47 $ en cartes. −3,50 $ en livraison."
              : "+$0.47 in cards. −$3.50 in shipping.",
          }}
          note={
            fr
              ? "Exemple de démonstration, avant taxes."
              : "Demo example, before tax."
          }
        />
      </Section>
      <Section
        title="StoreHero"
        description={
          fr
            ? "L’avatar vit hors du recadrage de la couverture. Aucun avis ni volume de ventes inventé."
            : "The avatar lives outside the cover clipping context. No invented reviews or sales volume."
        }
      >
        <StoreHero
          level={2}
          name="Cartes du Nord"
          eyebrow="TROC · DEMO"
          location="Montréal, QC"
          avatar={<SellerAvatar name="Cartes du Nord" />}
          banner={
            <div className="flex h-full justify-end gap-6">
              {pieces.map((p, i) => (
                <div className="w-32" key={i}>
                  {p}
                </div>
              ))}
            </div>
          }
          actions={
            <Button disabled>
              {fr ? "Suivre · à venir" : "Follow · planned"}
            </Button>
          }
        />
      </Section>
      <Section title="SellerPreviewCard">
        <div className="max-w-sm">
          <SellerPreviewCard
            href="#page=editorial"
            name="Cartes du Nord"
            location="Montréal, QC"
            avatar={<SellerAvatar name="Cartes du Nord" />}
            typeLabel={fr ? "Boutique fictive" : "Demo store"}
            banner={pieces[0]}
            thumbnails={pieces.map((p, i) => (
              <div key={i}>{p}</div>
            ))}
            actionLabel={fr ? "Explorer la boutique" : "Explore store"}
          />
        </div>
      </Section>

      <Section title="ProductPurchaseSummary">
        <ProductPurchaseSummary
          selection={
            <div
              className="troc-purchase-summary-options"
              role="group"
              aria-label={fr ? "Langue et finition" : "Language and finish"}
            >
              <Button variant="secondary" aria-current="true">
                {fr ? "Français · Standard" : "English · Standard"}
              </Button>
              <Button variant="secondary">
                {fr
                  ? "Français · Holographique inversée"
                  : "English · Reverse holo"}
              </Button>
            </div>
          }
          printing={
            fr
              ? "Français · Édition démo · #001"
              : "English · Demo printing · #001"
          }
          price={
            <strong>
              {fr ? "À partir de 0,05 $ CAD / carte" : "From $0.05 CAD / card"}
            </strong>
          }
          availability={fr ? "3 vendeurs · exemple" : "3 sellers · example"}
          action={
            <Button asChild>
              <a href="#page=seller-offer">
                {fr ? "Choisir une offre" : "View offers"}
              </a>
            </Button>
          }
          note={
            fr
              ? "Hors livraison. Livraison regroupée simulée au panier."
              : "Shipping excluded. Combined shipping is simulated in your cart."
          }
        />
      </Section>
      <Section title="ProductArtworkPanel">
        <div className="max-w-sm">
          <ProductArtworkPanel>{pieces[0]}</ProductArtworkPanel>
        </div>
      </Section>
      <Section title="PremiumEmptyState">
        <PremiumEmptyState
          title={
            fr
              ? "Votre panier attend sa première carte."
              : "Your cart is ready for its first card."
          }
          description={
            fr
              ? "Une action utile, un visuel discret et aucune activité inventée."
              : "A useful action, a quiet visual and no invented activity."
          }
          actions={
            <Button asChild>
              <a href="#page=editorial">
                {fr ? "Explorer les cartes" : "Browse cards"}
              </a>
            </Button>
          }
        />
      </Section>
    </>
  );
}
