import type { ReactNode, CSSProperties, HTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { EditorialIcon } from "./editorial";
import { InteractiveCardStack } from "./interactive-card-stack";
import { MetricStat } from "./metric-stat";

/** Display-only metrics. Callers disclose provenance and format values. */
export function MarketplaceStats({
  label,
  scope,
  source,
  unavailableLabel,
  decoration,
  items,
}: {
  label: string;
  scope: string;
  source: string;
  unavailableLabel: string;
  decoration?: ReactNode;
  items: { id: string; label: string; value: string | null; detail: string }[];
}) {
  return (
    <section className="troc-marketplace-stats" aria-label={label}>
      {decoration && (
        <div className="troc-stats-decoration" aria-hidden="true">
          {decoration}
        </div>
      )}
      <p className="troc-editorial-eyebrow">{label}</p>
      <p className="troc-stats-scope">{scope}</p>
      <div className="troc-stats-grid">
        {items.map((item, index) => (
          <MetricStat
            key={item.id}
            data-index={String(index + 1).padStart(2, "0")}
            label={item.label}
            value={item.value ?? <span aria-label={unavailableLabel}>—</span>}
            meta={item.detail}
          />
        ))}
      </div>
      <p className="troc-stats-source">{source}</p>
    </section>
  );
}

/** Values with explicit explanations; icons supplement the visible headings. */
export function MarketplacePrinciples({
  items,
}: {
  items: { id: string; title: string; description: string; icon: ReactNode }[];
}) {
  return (
    <div className="troc-marketplace-principles">
      {items.map((item) => (
        <article key={item.id}>
          <span className="troc-principle-icon" aria-hidden="true">
            {item.icon}
          </span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </div>
  );
}
export function MarketplaceProductCard({
  href,
  image,
  name,
  metadata,
  price,
  fromLabel,
  availability,
  reference,
  className,
}: {
  href: string;
  image: ReactNode;
  name: string;
  metadata: ReactNode;
  price: ReactNode;
  fromLabel: string;
  availability: ReactNode;
  reference?: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} className={cn("troc-market-card", className)}>
      <div className="troc-market-card-art" aria-hidden="true">
        {image}
      </div>
      <div className="troc-market-card-copy">
        <h3>{name}</h3>
        <div className="troc-market-card-meta">{metadata}</div>
        <div className="troc-market-card-price">
          <span>{fromLabel}</span>
          <strong>{price}</strong>
        </div>
        <div className="troc-market-card-availability">
          <span>{availability}</span>
          <EditorialIcon name="forward" />
        </div>
        {reference && (
          <div className="troc-market-card-reference">{reference}</div>
        )}
      </div>
    </a>
  );
}
export function GameTile({
  href,
  index,
  name,
  description,
  art,
  backgroundSrc,
}: {
  href: string;
  index: string;
  name: string;
  description: string;
  art?: ReactNode;
  backgroundSrc?: string;
}) {
  return (
    <a
      className={cn(
        "troc-destination",
        backgroundSrc && "troc-destination--themed",
      )}
      href={href}
    >
      {backgroundSrc && (
        <img
          className="troc-destination-background"
          src={backgroundSrc}
          alt=""
          loading="lazy"
        />
      )}
      <span className="troc-destination-index">{index}</span>
      <div className="troc-destination-art" aria-hidden="true">
        {art === null
          ? null
          : (art ?? (
              <div className="troc-card-back">
                <EditorialIcon name="layers" />
              </div>
            ))}
      </div>
      <div className="troc-destination-copy">
        <h3>{name}</h3>
        <p>{description}</p>
        <EditorialIcon name="arrow" />
      </div>
    </a>
  );
}
export function GameHero({
  title,
  eyebrow,
  description,
  cards,
  shortcuts,
  action,
  level = 1,
}: {
  title: string;
  eyebrow: string;
  description: string;
  cards: ReactNode[];
  level?: 1 | 2;
  shortcuts?: ReactNode;
  action?: ReactNode;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section className="troc-game-hero" data-has-art={cards.length > 0}>
      <div>
        <p className="troc-editorial-eyebrow">{eyebrow}</p>
        <Heading>{title}</Heading>
        <p className="troc-game-hero-description">{description}</p>
        <div className="troc-game-hero-shortcuts">{shortcuts}</div>
        {action}
      </div>
      {cards.length > 0 && (
        <div className="troc-game-hero-art" aria-hidden="true">
          <InteractiveCardStack compact cards={cards} label={title} />
        </div>
      )}
    </section>
  );
}
export function StoreHero({
  name,
  eyebrow,
  location,
  avatar,
  banner,
  bannerSrc,
  bannerFit = "cover",
  level = 1,
  focalPoint = "50% 50%",
  badges,
  details,
  actions,
}: {
  name: string;
  eyebrow: string;
  location: string;
  level?: 1 | 2;
  avatar: ReactNode;
  banner?: ReactNode;
  bannerSrc?: string | null;
  bannerFit?: "cover" | "contain";
  focalPoint?: string;
  badges?: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section className="troc-store-hero">
      <div
        className={cn("troc-store-cover", bannerFit === "contain" && "dark")}
        data-fit={bannerFit}
        style={{ "--store-focal": focalPoint } as CSSProperties}
        aria-hidden="true"
      >
        {bannerSrc ? <img src={bannerSrc} alt="" /> : banner}
        {!bannerSrc && (
          <span className="troc-store-cover-word">{location}</span>
        )}
      </div>
      <div className="troc-store-profile">
        <div className="troc-store-profile-avatar">{avatar}</div>
        <div className="troc-store-profile-copy">
          <p className="troc-editorial-eyebrow">{eyebrow}</p>
          <Heading>{name}</Heading>
          <p>{location}</p>
          {badges && <div className="troc-store-profile-badges">{badges}</div>}
          {details && (
            <div className="troc-store-profile-details">{details}</div>
          )}
        </div>
        {actions && <div className="troc-store-profile-actions">{actions}</div>}
      </div>
    </section>
  );
}
export function SellerPreviewCard({
  focalPoint = "50% 50%",
  href,
  name,
  location,
  avatar,
  banner,
  thumbnails,
  typeLabel,
  detail,
  actionLabel,
}: {
  href: string;
  name: string;
  location: string;
  avatar: ReactNode;
  banner?: ReactNode;
  thumbnails?: ReactNode;
  typeLabel: string;
  detail?: ReactNode;
  actionLabel: string;
  focalPoint?: string;
}) {
  return (
    <a className="troc-seller-preview" href={href}>
      <div
        className="troc-seller-preview-cover"
        style={{ "--store-focal": focalPoint } as CSSProperties}
        aria-hidden="true"
      >
        {banner}
        <span>{location}</span>
      </div>
      <div className="troc-seller-preview-identity">
        {avatar}
        <div>
          <h3>{name}</h3>
          <p>{typeLabel}</p>
        </div>
      </div>
      {detail && <p className="troc-seller-preview-detail">{detail}</p>}
      <div className="troc-seller-preview-stock" aria-hidden="true">
        {thumbnails}
      </div>
      <span className="troc-seller-preview-action">
        {actionLabel}
        <EditorialIcon name="arrow" />
      </span>
    </a>
  );
}
export function PremiumEmptyState({
  title,
  level = 2,
  description,
  actions,
  visual,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title: string;
  level?: 1 | 2;
  description: ReactNode;
  actions?: ReactNode;
  visual?: ReactNode;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section className={cn("troc-premium-empty", className)} {...props}>
      <div className="troc-premium-empty-visual" aria-hidden="true">
        {visual ?? (
          <>
            <span className="troc-card-back" />
            <span className="troc-card-back">
              <EditorialIcon name="layers" />
            </span>
          </>
        )}
      </div>
      <div>
        <Heading>{title}</Heading>
        <p>{description}</p>
        {actions && <div className="troc-premium-empty-actions">{actions}</div>}
      </div>
    </section>
  );
}
export function SmartCartComparison({
  before,
  after,
  locale,
  labels,
  note,
}: {
  before: { cards: number; shipping: number; sellers: number };
  after: { cards: number; shipping: number; sellers: number };
  locale: "en" | "fr";
  labels: {
    before: string;
    after: string;
    cards: string;
    shipping: string;
    sellers: string;
    save: string;
    explanation: string;
  };
  note?: ReactNode;
}) {
  const money = (n: number) =>
    new Intl.NumberFormat(locale + "-CA", {
      style: "currency",
      currency: "CAD",
    }).format(n / 100);
  const saving = before.cards + before.shipping - after.cards - after.shipping;
  return (
    <div className="troc-consolidation">
      <div className="troc-consolidation-flow">
        {[before, after].map((side, i) => (
          <div
            className="troc-consolidation-side"
            data-after={i === 1 || undefined}
            key={i}
          >
            <p className="troc-editorial-eyebrow">
              {i ? labels.after : labels.before}
            </p>
            <div className="troc-consolidation-parcels" aria-hidden="true">
              {Array.from({ length: Math.min(side.sellers, 4) }, (_, j) => (
                <EditorialIcon key={j} name="package" />
              ))}
            </div>
            <span>
              {side.sellers} {labels.sellers}
            </span>
            <dl>
              <div>
                <dt>{labels.cards}</dt>
                <dd>{money(side.cards)}</dd>
              </div>
              <div>
                <dt>{labels.shipping}</dt>
                <dd>{money(side.shipping)}</dd>
              </div>
            </dl>
            <strong className="troc-consolidation-total">
              {money(side.cards + side.shipping)}
            </strong>
          </div>
        ))}
        <span className="troc-consolidation-arrow" aria-hidden="true">
          <EditorialIcon name="forward" />
        </span>
      </div>
      <div className="troc-consolidation-result">
        <span>{labels.save}</span>
        <strong>{money(saving)}</strong>
        <p>{labels.explanation}</p>
      </div>
      {note && <p className="troc-consolidation-note">{note}</p>}
    </div>
  );
}

/** Available purchase price and explicit progression to seller selection. No implicit offer selection. */
export function ProductPurchaseSummary({
  price,
  printing,
  selection,
  availability,
  action,
  note,
}: {
  price: ReactNode;
  printing: ReactNode;
  selection?: ReactNode;
  availability: ReactNode;
  action: ReactNode;
  note: ReactNode;
}) {
  return (
    <section className="troc-purchase-summary">
      <div className="troc-purchase-summary-printing">{printing}</div>
      {selection}
      <div className="troc-purchase-summary-row">
        <div>
          {price}
          <p>{availability}</p>
        </div>
        <div className="troc-purchase-summary-action">{action}</div>
      </div>
      <p className="troc-purchase-summary-note">{note}</p>
    </section>
  );
}

/** A readable progression of decisions, with one supporting illustration per step. */
export function MarketplaceJourney({
  steps,
}: {
  steps: {
    id: string;
    title: ReactNode;
    description: ReactNode;
    illustration: ReactNode;
  }[];
}) {
  return (
    <ol className="troc-marketplace-journey">
      {steps.map((step, index) => (
        <li key={step.id}>
          <div className="troc-journey-heading">
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
          </div>
          <p>{step.description}</p>
          <div className="troc-journey-illustration">{step.illustration}</div>
        </li>
      ))}
    </ol>
  );
}

/** Group optional canonical attributes without punctuation-only missing fields. */
export function ProductFacts({
  title,
  items,
  level = 3,
}: {
  title: string;
  level?: 2 | 3;
  items: { label: string; value?: ReactNode }[];
}) {
  const available = items.filter(
    (item) =>
      item.value !== null &&
      item.value !== undefined &&
      item.value !== "" &&
      item.value !== false,
  );
  if (!available.length) return null;
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section className="troc-product-facts">
      <Heading>{title}</Heading>
      <dl>
        {available.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
