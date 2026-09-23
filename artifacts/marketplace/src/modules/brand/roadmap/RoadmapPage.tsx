import { Button } from "@workspace/troc-design-system/components/ui/button";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import { roadmapPhases } from "./roadmap-content";
import greyLeaf from "./assets/grey-leaf.webp";
import redLeaf from "./assets/small-red-leaf.webp";
import "./roadmap.css";
export function RoadmapPage({
  locale,
  journeyHref,
}: {
  locale: "en" | "fr";
  journeyHref: string;
}) {
  const fr = locale === "fr",
    language = fr ? 1 : 0;
  const status = {
    local: fr ? "Réalisé localement" : "Implemented locally",
    current: fr ? "En développement" : "In development",
    planned: fr ? "Prévu" : "Planned",
  };
  return (
    <div className="troc-roadmap-page" lang={`${locale}-CA`}>
      <img
        className="troc-roadmap-leaf"
        src={greyLeaf}
        alt=""
        aria-hidden="true"
        width={960}
        height={960}
      />
      <header className="troc-roadmap-opening">
        <p className="troc-roadmap-eyebrow">
          {fr ? "NOTRE FEUILLE DE ROUTE" : "OUR ROADMAP"}
        </p>
        <h1>
          {fr
            ? "Bâtir l’avenir des cartes au "
            : "Building the future of TCG in "}
          <span>Canada</span>
        </h1>
        <p className="troc-roadmap-lead">
          {fr
            ? "Une vision claire, une étape à la fois. Nous construisons une place de marché pensée pour les collectionneurs d’ici."
            : "A clear vision, one step at a time. We’re building a marketplace around the way Canadians collect."}
        </p>
        <p className="troc-roadmap-status-note">
          {fr
            ? "État au 23 septembre 2026 · Les réalisations locales ne signifient pas une mise en service. Aucune date de lancement annoncée."
            : "Status as of September 23, 2026 · Local implementation does not mean live availability. No launch date announced."}
        </p>
      </header>
      <ol
        className="troc-roadmap-timeline"
        aria-label={fr ? "Phases de la feuille de route" : "Roadmap phases"}
      >
        {roadmapPhases.map((phase, index) => (
          <li
            key={phase.milestones}
            data-state={phase.status}
            aria-current={phase.status === "current" ? "step" : undefined}
          >
            <span className="troc-roadmap-marker" aria-hidden="true" />
            <article className="troc-roadmap-card">
              <p className="troc-roadmap-phase">PHASE {index + 1}</p>
              <h2>{phase.title[language]}</h2>
              <span className="troc-roadmap-status">
                {status[phase.status]}
              </span>
              <p className="troc-roadmap-description">
                {phase.description[language]}
              </p>
              <ul>
                {phase.items.map((item) => (
                  <li key={item.label[0]}>
                    <span
                      className="troc-roadmap-check"
                      data-local={item.local}
                      aria-hidden="true"
                    >
                      {item.local ? "✓" : ""}
                    </span>
                    <span>
                      <span className="sr-only">
                        {item.local
                          ? fr
                            ? "Réalisé localement : "
                            : "Implemented locally: "
                          : fr
                            ? "À compléter : "
                            : "Pending: "}
                      </span>
                      {item.label[language]}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="troc-roadmap-source">
                {fr ? "Jalons" : "Milestones"} {phase.milestones}
              </p>
            </article>
          </li>
        ))}
        <li className="troc-roadmap-more">
          <span className="troc-roadmap-marker" aria-hidden="true" />
          <article className="troc-roadmap-card">
            <span className="troc-roadmap-plus" aria-hidden="true">
              +
            </span>
            <h2>{fr ? "Et la suite" : "More to come"}</h2>
            <p>
              {fr
                ? "Les prochaines priorités suivront les besoins de la communauté et les validations du produit."
                : "Future priorities will follow community needs and what we learn from the product."}
            </p>
          </article>
        </li>
      </ol>
      <footer className="troc-roadmap-closing">
        <Button asChild className="troc-roadmap-journey">
          <a href={journeyHref}>
            {fr ? "Suivre notre parcours" : "Follow our journey"}
            <EditorialIcon name="forward" />
          </a>
        </Button>
        <p className="troc-roadmap-journey-hint">
          {fr
            ? "Découvrez l’histoire de TROC."
            : "Discover the story behind TROC."}
        </p>
        <p className="troc-roadmap-signature">
          <img src={redLeaf} width={26} height={23} alt="" aria-hidden="true" />
          <span>
            {fr
              ? "POUR LES CANADIENS, PAR DES CANADIENS."
              : "BUILT FOR CANADIANS, BY CANADIANS."}
          </span>
        </p>
      </footer>
    </div>
  );
}
