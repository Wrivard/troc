import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Locale } from "@workspace/catalog";
import "./marketplace-activity.css";

const cards = [
  { name: "Charizard ex", cents: 15, slug: "pokemon-charizard-ex-e59ba522", image: "/catalog-art/5e20d2d0f2f49ef6019f-245.webp" },
  { name: "Lightning Bolt", cents: 10, slug: "magic-lightning-bolt-78a3a344", image: "/catalog-art/2fe2e83758204c9014fb-245.webp" },
  { name: "Chaos Command Magician", cents: 1200, slug: "yu-gi-oh-chaos-command-magician-4f1cdce5", image: "/catalog-art/cc6762834385c4c8709f-245.webp" },
];
// Explicit preview events, never a claim of verified transactions or reviews.
export function MarketplaceActivity({ locale, base = "" }: { locale: Locale; base?: string }) {
  const fr = locale === "fr";
  const money = new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", { style: "currency", currency: "CAD", currencyDisplay: "code" });
  const viewport = useRef<HTMLDivElement>(null), sequence = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ repeats: 1, duration: 38 });
  useEffect(() => {
    const measure = () => {
      const width = sequence.current?.getBoundingClientRect().width ?? 0;
      if (!width || !viewport.current) return;
      const repeats = Math.max(1, Math.ceil(viewport.current.clientWidth / width));
      const duration = width * repeats / 52;
      setLayout(old => old.repeats === repeats && Math.abs(old.duration-duration)<.1 ? old : { repeats, duration });
    };
    const observer = new ResizeObserver(measure);
    if (sequence.current) observer.observe(sequence.current);
    if (viewport.current) observer.observe(viewport.current);
    measure();
    return () => observer.disconnect();
  }, [locale]);
  const events = [
    { kind: "listing", card: cards[0] }, { kind: "sale", card: cards[1] },
    { kind: "review", store: "Card Forge TCG", slug: "cartes-du-nord" },
    { kind: "listing", card: cards[2] }, { kind: "sale", card: cards[0] },
    { kind: "review", store: "Piko Trading Cards", slug: "maple-singles" },
    { kind: "listing", card: cards[1] }, { kind: "sale", card: cards[2] },
  ];
  const label = (kind: string) => kind === "listing" ? (fr ? "Nouvelle offre" : "New listing") : kind === "sale" ? (fr ? "Vente conclue" : "Just sold") : (fr ? "Nouvel avis" : "New review");
  return (
    <section className="marketplace-activity" aria-label={fr ? "Aperçu de l’activité" : "Activity preview"}>
      <div ref={viewport} className="marketplace-activity-window" tabIndex={0} role="region" aria-label={fr ? "Événements fictifs de démonstration. Survoler ou sélectionner pour arrêter le défilement." : "Illustrative demo events. Hover or focus to stop scrolling."}>
        <div className="marketplace-activity-track" style={{ "--activity-duration": layout.duration+"s" } as CSSProperties}>
          {[0, 1].map(copy => (
            <div className="marketplace-activity-group" key={copy} aria-hidden={copy === 1 || undefined}>
              {Array.from({ length: layout.repeats }, (_, repeat) => (
                <div className="marketplace-activity-sequence" key={repeat} ref={copy === 0 && repeat === 0 ? sequence : undefined} aria-hidden={repeat > 0 || undefined}>
                  {events.map((event, i) => {
                    const card = event.card;
                    const path = card ? "/product/"+card.slug : "/store/"+event.slug;
                    return (
                      <a key={i} tabIndex={copy || repeat ? -1 : undefined} href={base+path+(path.includes("?")?"&":"?")+"lang="+locale} className="marketplace-activity-event" data-kind={event.kind} title={fr ? "Exemple de présentation, pas une activité réelle" : "Presentation example, not real activity"}>
                        {card ? <img src={base+card.image} alt="" width={25} height={35} decoding="async" /> : <span className="marketplace-activity-avatar" aria-hidden="true">{event.store === "Card Forge TCG" ? "CF" : "PK"}</span>}
                        <span className="marketplace-activity-copy">
                          <span className="marketplace-activity-meta"><i aria-hidden="true" />{label(event.kind)}</span>
                          <strong>{card?.name ?? event.store}</strong>
                        </span>
                        {card && <span className="marketplace-activity-price">{money.format(card.cents / 100)}</span>}
                        <svg viewBox="0 0 16 16" aria-hidden="true" className="marketplace-activity-arrow"><path d="M4 12 12 4M4 4h8v8" /></svg>
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

