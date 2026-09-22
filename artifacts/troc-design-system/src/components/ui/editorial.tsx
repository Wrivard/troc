import type { ReactNode, HTMLAttributes } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Globe2,
  Languages,
  Coins,
  Layers3,
  Search,
  Package,
  Store,
  MapPin,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

const icons = {
  arrow: ArrowUpRight,
  forward: ArrowRight,
  globe: Globe2,
  language: Languages,
  coin: Coins,
  layers: Layers3,
  search: Search,
  package: Package,
  store: Store,
  pin: MapPin,
  check: Check,
  sparkle: Sparkles,
};
/** One restrained icon treatment for editorial content. Decorative; labels belong to the caller. */
export function EditorialIcon({
  name,
  className,
}: {
  name: keyof typeof icons;
  className?: string;
}) {
  const Icon = icons[name];
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={1.5}
      className={cn("troc-editorial-icon", className)}
    />
  );
}
export function EditorialIntro({
  eyebrow,
  title,
  description,
  aside,
  level = 2,
  compact = false,
  className,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, "title"> & {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  level?: 1 | 2;
  compact?: boolean;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header
      className={cn(
        "troc-editorial-intro",
        compact && "troc-editorial-intro--compact",
        className,
      )}
      {...props}
    >
      <div className="troc-editorial-intro-copy">
        {eyebrow && <p className="troc-editorial-eyebrow">{eyebrow}</p>}
        <Heading>{title}</Heading>
        {description && (
          <div className="troc-editorial-description">{description}</div>
        )}
      </div>
      {aside && <div className="troc-editorial-intro-aside">{aside}</div>}
    </header>
  );
}
/** Optional image is decorative, never presented as seller/location evidence. */
export function EditorialPanel({
  children,
  image,
  tone = "quiet",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  image?: ReactNode;
  tone?: "quiet" | "contrast";
}) {
  return (
    <section
      className={cn("troc-editorial-panel", className)}
      data-tone={tone}
      {...props}
    >
      {image && (
        <div className="troc-editorial-panel-image" aria-hidden="true">
          {image}
        </div>
      )}
      <div className="troc-editorial-panel-content">{children}</div>
    </section>
  );
}

export function EditorialCatalogGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("troc-editorial-catalog", className)} {...props} />;
}
