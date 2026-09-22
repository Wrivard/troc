import { ArrowUpRight, Check, X } from "lucide-react";
import type { ReactNode } from "react";
import { usePreferences } from "../hooks/use-preferences";
import { cn } from "../lib/utils";
import { TrocLogo, type TrocLogoVariant } from "../components/ui/logo";

/**
 * Brand image helper for the style-guide pages. It now renders the reusable
 * package logo (TrocLogo) and its bundled asset instead of maintaining a
 * separate public-file <img>, so the guide consumes the real primitive. The
 * helper API, `ds-brand-image` sizing class, and variants are preserved: the
 * width-based `.ds-brand-image` rules govern the rendered size and the logo's
 * `max-width: 100%` keeps proportions.
 */
export function BrandImage({ variant, className = "" }: { variant?: "dark" | "light" | "mono" | "wordmark" | "leaf"; className?: string }) {
  const { theme } = usePreferences();
  // Map the helper's variants onto the logo's variant set; the leaf crop maps
  // to the logo's compact leaf mark, and an unspecified variant follows the
  // current theme (dark artwork on dark, light artwork on light).
  const logoVariant: TrocLogoVariant =
    variant === "leaf" ? "compact" : variant ?? (theme === "light" ? "light" : "dark");
  return (
    <TrocLogo
      variant={logoVariant}
      label="TROC"
      className={cn("ds-brand-image", "ds-brand-logo", className)}
    />
  );
}
export function PageHeader({ title, description, eyebrow }: { title: string; description: string; eyebrow?: string }) {
  return <header className="ds-page-header">
    {eyebrow && <p className="ds-eyebrow">{eyebrow}</p>}
    <h1>{title}</h1><p className="ds-lead">{description}</p>
  </header>;
}
export function Section({ title, description, children, link, id, className }: { title: string; description?: string; children: ReactNode; link?: { href: string; label: string }; id?: string; className?: string }) {
  return <section id={id} className={cn("ds-section", className)}>
    <header className="ds-section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>
      {link && <a className="ds-text-link" href={link.href}>{link.label}<ArrowUpRight size={14} aria-hidden="true" /></a>}
    </header>{children}
  </section>;
}
export function Row({ label, children }: { label?: string; children: ReactNode }) {
  return <div className="ds-row-group">{label && <h3 className="ds-small-heading">{label}</h3>}<div className="ds-flex-row">{children}</div></div>;
}
export function Stack({ label, children }: { label?: string; children: ReactNode }) {
  return <div className="ds-stack">{label && <h3 className="ds-small-heading">{label}</h3>}{children}</div>;
}
export function Field({ id, label, helper, error, children, className }: { id: string; label: string; helper?: string; error?: string; children: ReactNode; className?: string }) {
  return <div className={cn("ds-field-group", className)}>
    <label htmlFor={id}>{label}</label>{children}
    {error ? <p id={`${id}-hint`} className="ds-field-error" role="alert">{error}</p>
      : helper ? <p id={`${id}-hint`} className="ds-helper">{helper}</p> : null}
  </div>;
}
export function Guidelines({ items }: { items: Array<{ kind: "do" | "dont"; text: string }> }) {
  const { t } = usePreferences();
  return <div className="ds-guidelines">{items.map((item) => <div key={item.kind + item.text}>
    <div className="ds-guideline-title">{item.kind === "do" ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" />}<h3>{t(item.kind)}</h3></div>
    <p>{item.text}</p>
  </div>)}</div>;
}
export function DemoPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("ds-demo-panel", className)}>{children}</div>;
}
export const games = [
  { value: "pokemon", label: "Pokémon" },
  { value: "magic", label: "Magic: The Gathering" },
  { value: "yugioh", label: "Yu-Gi-Oh!" },
  { value: "onepiece", label: "One Piece" },
  { value: "riftbound", label: "Riftbound" },
];