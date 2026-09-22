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
    </>
  );
}
