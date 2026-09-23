import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import type { Locale } from "@workspace/catalog";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import { Skeleton } from "@workspace/troc-design-system/components/ui/skeleton";
import { CardImage } from "@workspace/troc-design-system/components/ui/product-presentation";
import "./global-search-presentation.css";

export type SearchGroupKind =
  "cards" | "sets" | "products" | "sellers" | "games";
export interface SearchPresentationResult {
  /** Stable canonical identity, not the row index. */
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  detail?: string;
  imageUrl?: string | null;
  /** CAD minor units; omitted/null means no offer price is available. */
  lowestCents?: number | null;
  sellerCount?: number;
}
export interface SearchPresentationGroup {
  kind: SearchGroupKind;
  results: readonly SearchPresentationResult[];
  /** Supply only when the adapter has a real destination for this group. */
  seeAllHref?: string;
  /** Authoritative total only. Never inferred from a truncated result array. */
  total?: number;
}
export interface GlobalSearchPresentationProps {
  locale: Locale;
  query: string;
  groups: readonly SearchPresentationGroup[];
  loading?: boolean;
  /** Localized, user-safe error text supplied by the adapter. */
  error?: string | null;
  disabled?: boolean;
  /** Existing catalogue URL including correctly encoded query and locale. */
  searchAllHref: string;
  onQueryChange: (query: string) => void;
  /** Optional router callback. Modified clicks retain native anchor behavior. */
  onNavigate?: (href: string) => void;
}
const labels = {
  cards: ["Cards", "Cartes"],
  sets: ["Sets", "Extensions"],
  products: ["Products", "Produits"],
  sellers: ["Sellers", "Vendeurs"],
  games: ["Games", "Jeux"],
} as const;
const caps: Record<SearchGroupKind, number> = {
  cards: 4,
  sets: 2,
  products: 2,
  sellers: 2,
  games: 2,
};

/** Controlled, input-anchored presentation only. Fetch, debounce, ranking and routing belong to the host. */
export function GlobalSearchPresentation({
  locale,
  query,
  groups,
  loading = false,
  error,
  disabled = false,
  searchAllHref,
  onQueryChange,
  onNavigate,
}: GlobalSearchPresentationProps) {
  const fr = locale === "fr";
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const suppressFocusOpen = useRef(false);
  const id = useId();
  const listId = `${id}-results`;
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<{
    key: string;
    query: string;
  } | null>(null);
  const [height, setHeight] = useState(480);
  const hasQuery = Boolean(query.trim());
  const visible =
    hasQuery && !loading && !error
      ? groups
          .filter((group) => group.results.length > 0)
          .map((group) => ({
            ...group,
            results: group.results.slice(0, caps[group.kind]),
          }))
      : [];
  const options = [
    { key: "all", href: searchAllHref },
    ...visible.flatMap((group) => [
      ...(group.seeAllHref
        ? [{ key: `${group.kind}:all`, href: group.seeAllHref }]
        : []),
      ...group.results.map((result) => ({
        key: `${group.kind}:${result.id}`,
        href: result.href,
      })),
    ]),
  ];
  const active =
    open && selection?.query === query
      ? options.findIndex((option) => option.key === selection.key)
      : -1;
  const show = open && !disabled;
  const optionId = (key: string) =>
    `${listId}-${options.findIndex((option) => option.key === key)}`;
  useEffect(() => {
    if (!show) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
        setSelection(null);
      }
    };
    const measure = () => {
      const rect = input.current?.getBoundingClientRect();
      const viewport = window.visualViewport;
      if (rect)
        setHeight(
          Math.max(
            100,
            Math.min(
              480,
              (viewport?.height ?? innerHeight) +
                (viewport?.offsetTop ?? 0) -
                rect.bottom -
                20,
            ),
          ),
        );
    };
    measure();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [show]);
  useEffect(() => {
    if (show && active >= 0)
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [show, active, listId]);
  const close = () => {
    setOpen(false);
    setSelection(null);
  };
  const navigate = (href: string) => {
    close();
    if (onNavigate) onNavigate(href);
    else window.location.assign(href);
  };
  const click = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    close();
    if (onNavigate) {
      event.preventDefault();
      onNavigate(href);
    }
  };
  const optionProps = (key: string, href: string) => ({
    id: optionId(key),
    href,
    role: "option" as const,
    "aria-selected": active >= 0 && options[active].key === key,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => click(event, href),
    onPointerMove: () => setSelection({ key, query }),
  });
  const amount = (cents: number) =>
    new Intl.NumberFormat(`${locale}-CA`, {
      style: "currency",
      currency: "CAD",
    }).format(cents / 100);
  return (
    <div
      ref={root}
      className="troc-search-presentation"
      role="search"
      aria-label={fr ? "Recherche TROC" : "TROC search"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && show && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          close();
          if (document.activeElement !== input.current) {
            suppressFocusOpen.current = true;
            input.current?.focus();
          }
        }
      }}
    >
      <div className="troc-search-presentation-control">
        <EditorialIcon name="search" />
        <Input
          ref={input}
          role="combobox"
          aria-label={fr ? "Rechercher dans TROC" : "Search TROC"}
          aria-expanded={show}
          aria-controls={show ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            show && active >= 0 ? `${listId}-${active}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder={
            fr ? "Cartes, extensions, vendeurs…" : "Cards, sets, sellers…"
          }
          disabled={disabled}
          value={query}
          maxLength={100}
          onFocus={() => {
            if (suppressFocusOpen.current) {
              suppressFocusOpen.current = false;
              return;
            }
            setOpen(true);
            setSelection(null);
          }}
          onChange={(event) => {
            setSelection(null);
            setOpen(true);
            onQueryChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              const next =
                event.key === "ArrowDown"
                  ? (active + 1) % options.length
                  : active < 0
                    ? options.length - 1
                    : (active - 1 + options.length) % options.length;
              setSelection({ key: options[next].key, query });
            } else if (event.key === "Enter") {
              event.preventDefault();
              navigate(options[active >= 0 ? active : 0].href);
            }
          }}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="troc-search-presentation-clear"
            aria-label={fr ? "Effacer la recherche" : "Clear search"}
            disabled={disabled}
            onClick={() => {
              onQueryChange("");
              setSelection(null);
              input.current?.focus();
              setOpen(true);
            }}
          >
            <span aria-hidden="true">×</span>
          </Button>
        )}
      </div>
      {show && (
        <div
          className="troc-search-presentation-popup"
          style={{ maxHeight: height }}
        >
          <div
            id={listId}
            role="listbox"
            aria-label={fr ? "Suggestions de recherche" : "Search suggestions"}
          >
            <a
              {...optionProps("all", searchAllHref)}
              className="troc-search-presentation-all"
            >
              <span>
                <strong>
                  {hasQuery
                    ? fr
                      ? `Rechercher « ${query} »`
                      : `Search for “${query}”`
                    : fr
                      ? "Explorer le catalogue"
                      : "Explore the catalog"}
                </strong>
                <small>
                  {fr
                    ? "Cartes, extensions, produits et vendeurs"
                    : "Cards, sets, products and sellers"}
                </small>
              </span>
              <span aria-hidden="true">↵</span>
            </a>
            {visible.map((group) => (
              <div
                role="group"
                aria-labelledby={`${id}-${group.kind}`}
                key={group.kind}
                className="troc-search-presentation-group"
              >
                <div className="troc-search-presentation-heading">
                  <span id={`${id}-${group.kind}`}>
                    {labels[group.kind][fr ? 1 : 0]}
                  </span>
                  {group.seeAllHref && (
                    <a
                      {...optionProps(`${group.kind}:all`, group.seeAllHref)}
                      aria-label={`${fr ? "Voir tout" : "See all"} · ${labels[group.kind][fr ? 1 : 0]}`}
                    >
                      <span>
                        {fr ? "Voir tout" : "See all"}
                        {group.total !== undefined ? ` (${group.total})` : ""}
                      </span>
                      <EditorialIcon name="forward" />
                    </a>
                  )}
                </div>
                {group.results.map((result) => (
                  <a
                    key={result.id}
                    {...optionProps(`${group.kind}:${result.id}`, result.href)}
                    className="troc-search-presentation-result"
                  >
                    <span
                      className="troc-search-presentation-thumb"
                      aria-hidden="true"
                    >
                      {result.imageUrl ? (
                        <CardImage
                          src={result.imageUrl}
                          alt=""
                          eager
                          missingLabel={
                            fr ? "Visuel indisponible" : "Artwork unavailable"
                          }
                        />
                      ) : (
                        <EditorialIcon
                          name={
                            group.kind === "sellers"
                              ? "store"
                              : group.kind === "sets"
                                ? "layers"
                                : "package"
                          }
                        />
                      )}
                    </span>
                    <span className="troc-search-presentation-copy">
                      <strong>{result.title}</strong>
                      {result.subtitle && <small>{result.subtitle}</small>}
                      {result.detail && <small>{result.detail}</small>}
                    </span>
                    {(result.lowestCents != null ||
                      result.sellerCount !== undefined) && (
                      <span className="troc-search-presentation-price">
                        {result.lowestCents != null && (
                          <>
                            <small>{fr ? "Dès" : "From"}</small>
                            <strong>{amount(result.lowestCents)}</strong>
                          </>
                        )}
                        {result.sellerCount !== undefined && (
                          <small>
                            {result.sellerCount}{" "}
                            {fr
                              ? result.sellerCount > 1
                                ? "vendeurs"
                                : "vendeur"
                              : result.sellerCount === 1
                                ? "seller"
                                : "sellers"}
                          </small>
                        )}
                      </span>
                    )}
                    <EditorialIcon name="forward" />
                  </a>
                ))}
              </div>
            ))}
          </div>
          {loading ? (
            <div role="status" className="troc-search-presentation-state">
              <span className="sr-only">
                {fr ? "Chargement des suggestions…" : "Loading suggestions…"}
              </span>
              <Skeleton shape="row" />
              <Skeleton shape="row" />
            </div>
          ) : error ? (
            <div role="alert" className="troc-search-presentation-state">
              <strong>
                {fr ? "Suggestions indisponibles" : "Suggestions unavailable"}
              </strong>
              <p>{error}</p>
            </div>
          ) : !hasQuery ? (
            <p className="troc-search-presentation-state">
              {fr
                ? "Essayez un nom de carte, une extension ou un numéro de collection."
                : "Try a card name, set or collector number."}
            </p>
          ) : !visible.length ? (
            <div role="status" className="troc-search-presentation-state">
              <strong>
                {fr
                  ? `Aucun résultat pour « ${query} »`
                  : `No results for “${query}”`}
              </strong>
              <p>
                {fr
                  ? "Essayez un nom, une extension ou un numéro comme 123/167."
                  : "Try a name, set or collector number like 123/167."}
              </p>
            </div>
          ) : null}
          <div className="troc-search-presentation-hints" aria-hidden="true">
            <span>↑ ↓ {fr ? "Parcourir" : "Navigate"}</span>
            <span>↵ {fr ? "Choisir" : "Select"}</span>
            <span>Esc {fr ? "Fermer" : "Close"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
