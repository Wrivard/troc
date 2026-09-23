import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  const timeline = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{
    width: number;
    height: number;
    paths: { d: string; points: number[][] }[];
  }>({ width: 1, height: 1, paths: [] });
  useEffect(() => {
    const element = timeline.current;
    if (!element) return;
    let frame = 0,
      disposed = false;
    const measure = () => {
      const box = element.getBoundingClientRect();
      const items = Array.from(
        element.querySelectorAll<HTMLElement>(".troc-roadmap-timeline > li"),
      ).map((item) => {
        const marker = item
          .querySelector<HTMLElement>(".troc-roadmap-marker")!
          .getBoundingClientRect();
        const card = item
          .querySelector<HTMLElement>("article")!
          .getBoundingClientRect();
        return {
          x: marker.x + marker.width / 2 - box.x,
          y: marker.y + marker.height / 2 - box.y,
          bottom: card.bottom - box.y,
        };
      });
      const single = items.every((item) => Math.abs(item.x - items[0].x) < 1);
      const paths = items.slice(0, -1).map((item, index) => {
        const next = items[index + 1];
        const points =
          single || Math.abs(item.y - next.y) < 1
            ? [
                [item.x, item.y],
                [next.x, next.y],
              ]
            : [
                [item.x, item.y],
                [item.x > box.width / 2 ? box.width - 4 : 4, item.y],
                [item.x > box.width / 2 ? box.width - 4 : 4, next.y],
                [next.x, next.y],
              ];
        return {
          points,
          d: points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" "),
        };
      });
      const next = { width: box.width, height: box.height, paths };
      setConnections((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    element
      .querySelectorAll("article")
      .forEach((item) => observer.observe(item));
    schedule();
    void document.fonts.ready.then(() => {
      if (!disposed) schedule();
    });
    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [locale]);
  const placement = (index: number): CSSProperties => {
    const position = (columns: number) => {
      const row = Math.floor(index / columns);
      return {
        row: row + 1,
        column: row % 2 ? columns - (index % columns) : (index % columns) + 1,
      };
    };
    const wide = position(4),
      medium = position(2);
    return {
      "--roadmap-column-wide": wide.column,
      "--roadmap-row-wide": wide.row,
      "--roadmap-column-medium": medium.column,
      "--roadmap-row-medium": medium.row,
    } as CSSProperties;
  };
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
      <div className="troc-roadmap-timeline-wrap" ref={timeline}>
        <svg
          className="troc-roadmap-connections"
          aria-hidden="true"
          focusable="false"
          viewBox={`0 0 ${connections.width} ${connections.height}`}
          preserveAspectRatio="none"
        >
          {connections.paths.map((path, index) => (
            <path
              key={index}
              d={path.d}
              data-connection={index}
              data-points={JSON.stringify(path.points)}
              data-current={index === 1}
              data-final={index === 5}
            />
          ))}
        </svg>
        <ol
          className="troc-roadmap-timeline"
          aria-label={fr ? "Phases de la feuille de route" : "Roadmap phases"}
        >
          {roadmapPhases.map((phase, index) => (
            <li
              key={phase.milestones}
              style={placement(index)}
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
          <li className="troc-roadmap-more" style={placement(6)}>
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
      </div>
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
