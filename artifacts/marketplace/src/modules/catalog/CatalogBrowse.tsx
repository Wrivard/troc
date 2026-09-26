import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/troc-design-system/components/ui/tooltip";
import { priceInputCents, priceInputValue } from "./price-input";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CATALOG_PAGE_SIZES, type PublicPage } from "@workspace/catalog";
import { EditorialIcon } from "@workspace/troc-design-system/components/ui/editorial";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/troc-design-system/components/ui/selection-controls";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/troc-design-system/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@workspace/troc-design-system/components/ui/drawer";
import { PremiumEmptyState } from "@workspace/troc-design-system/components/ui/marketplace-compositions";
import { catalogMessages, type CatalogMessage } from "./messages";
import "./catalog-browse.css";

type View = "large" | "compact" | "list";
const fields = [
  "game",
  "set",
  "condition",
  "min",
  "max",
  "type",
  "language",
  "variant",
  "rarity",
  "seller",
] as const;
type Field = (typeof fields)[number];

/** Search-route composition. Only presentation drafts live here; submitted filters remain URL-owned. */
export function CatalogBrowse({
  page,
  base,
  chips,
  children,
  pagination,
}: {
  page: PublicPage;
  base: string;
  chips: ReactNode;
  children: ReactNode;
  pagination: ReactNode;
}) {
  const fr = page.locale === "fr";
  const t = (key: CatalogMessage) => catalogMessages[key][fr ? 1 : 0];
  const [draft, setDraft] = useState<Record<Field, string>>(
    () =>
      Object.fromEntries(
        fields.map((key) => [
          key,
          key === "min" || key === "max"
            ? priceInputValue(page.filters[key])
            : String(page.filters[key] ?? ""),
        ]),
      ) as Record<Field, string>,
  );
  const form = useRef<HTMLFormElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const composing = useRef(false);
  const typingSubmit = useRef(false);
  const queueSearch = () => {
    clearTimeout(typingTimer.current);
    if (composing.current) return;
    typingTimer.current = setTimeout(() => { typingSubmit.current = true; form.current?.requestSubmit(); typingSubmit.current = false; }, 100);
  };
  useEffect(() => {
    const sync = () => {
      clearTimeout(typingTimer.current);
      const value = new URLSearchParams(window.location.search).get("q") ?? "";
      if (query.current && query.current.value !== value) query.current.value = value;
    };
    window.addEventListener("popstate", sync);
    return () => { clearTimeout(typingTimer.current); window.removeEventListener("popstate", sync); };
  }, []);
  const filterKey = JSON.stringify(fields.map(key => page.filters[key]));
  useEffect(() => {
    setDraft(Object.fromEntries(fields.map(key => [key, key === "min" || key === "max" ? priceInputValue(page.filters[key]) : String(page.filters[key] ?? "")])) as Record<Field, string>);
  }, [filterKey]);
  useEffect(() => { setSetOptions({game: page.filters.game, sets: page.sets}); }, [page.sets, page.filters.game]);
  const automatic = useRef(false);
  const autoSubmit = (force = false) => {
    if (!force && window.matchMedia("(max-width: 1023px)").matches) return;
    requestAnimationFrame(() => form.current?.requestSubmit());
  };
  useEffect(() => { if (automatic.current) { automatic.current = false; autoSubmit(); } }, [draft]);
  const [priceError, setPriceError] = useState("");
  const invalidPriceField = useRef("max");
  const [view, setView] = useState<View>("large");
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [setQuery, setSetQuery] = useState("");
  const [moreSets, setMoreSets] = useState(false);
  const [fullNames, setFullNames] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => Object.fromEntries(fields.map(key => [key, key === "game" || Boolean(page.filters[key])])));
  const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase(page.locale);
  const [setOptions, setSetOptions] = useState({ game: page.filters.game, sets: page.sets });
  const [setError, setSetError] = useState(false);
  const [setRevision, setSetRevision] = useState(0);
  useEffect(() => {
    if (draft.game === setOptions.game || !window.matchMedia("(max-width: 1023px)").matches) return;
    const controller = new AbortController();
    setSetError(false);
    const params = new URLSearchParams({ game: draft.game, lang: page.locale });
    fetch(base + "/api/catalog/facets?" + params, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) })
      .then(async (response) => {
        if (!response.ok) throw new Error("sets_unavailable");
        const result = await response.json() as Pick<PublicPage, "sets">;
        if (!controller.signal.aborted) setSetOptions({ game: draft.game, sets: result.sets });
      })
      .catch(() => { if (!controller.signal.aborted) setSetError(true); });
    return () => controller.abort();
  }, [draft.game, page.locale, base, setOptions.game, setRevision]);
  const trigger = useRef<HTMLButtonElement>(null);
  const query = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1023px)");
    const update = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    update();
    media.addEventListener("change", update);
    try {
      const saved = localStorage.getItem("troc.catalog.view");
      if (saved === "large" || saved === "compact" || saved === "list")
        setView(saved);
    } catch {
      /* Storage is optional. */
    }
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!priceError) return;
    const frame = requestAnimationFrame(() =>
      document
        .getElementById("browse-price-" + invalidPriceField.current)
        ?.focus(),
    );
    return () => cancelAnimationFrame(frame);
  }, [priceError, open]);
  const chooseView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem("troc.catalog.view", next);
    } catch {
      /* Storage is optional. */
    }
  };
  const change = (key: Field, value: string) => {
    automatic.current = key !== "min" && key !== "max";
    if (key === "game") { setSetQuery(""); setMoreSets(false); }
    setDraft((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "game" ? { set: "" } : {}),
    }));
  };
  const reset = `${base}${page.path}?lang=${page.locale}&limit=${page.filters.limit}`;
  const game = page.games.find((item) => item.slug === draft.game);
  const setsLoading = draft.game !== setOptions.game;
  const sets = (setsLoading ? [] : setOptions.sets).filter(
    (item) =>
      (!game || item.gameId === game.id) &&
      fold(item.name[page.locale]).includes(fold(setQuery)),
  );
  const options = (
    key: Field,
    label: string,
    values: { value: string; label: string }[],
    extra?: ReactNode,
    footer?: ReactNode,
  ) => (
    <details
      className="troc-browse-group"
      open={Boolean(expanded[key])}
    >
      <summary onClick={(event) => { event.preventDefault(); setExpanded(previous => ({ ...previous, [key]: !previous[key] })); }}>
        {label}{draft[key] && <span className="troc-filter-selected" aria-label={fr ? "Filtre sélectionné" : "Filter selected"} />}
      </summary>
      {extra}
      <RadioGroup
        aria-label={label}
        value={draft[key] || "__all"}
        onValueChange={(value) => change(key, value === "__all" ? "" : value)}
      >
        {[{ value: "__all", label: t("all") }, ...values].map((option) => (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <label className="troc-browse-option" data-full-names={key === "set" && fullNames ? "true" : undefined}>
                <RadioGroupItem id={`catalog-filter-${key}-${option.value}`} value={option.value} aria-label={option.label} />
                <span className="troc-filter-option-label">{option.label}</span>
              </label>
            </TooltipTrigger>
            <TooltipContent side="right" className="troc-filter-tooltip">{option.label}</TooltipContent>
          </Tooltip>
        ))}
      </RadioGroup>
      {footer}
    </details>
  );
  const variantOptions = (key: "variant" | "rarity") =>
    [
      ...new Set([
        draft[key],
        ...page.results.flatMap((result) =>
          result.product.variants.map((variant) =>
            key === "variant" ? variant.key : variant.rarity,
          ),
        ),
      ]),
    ]
      .filter(Boolean)
      .map((value) => ({
        value,
        label: value in catalogMessages ? t(value as CatalogMessage) : value,
      }));
  const panel = (
    <TooltipProvider delayDuration={350}><div className="troc-browse-panel">
      <div className="troc-browse-filter-heading">
        <strong>{fr ? "Filtres" : "Filters"}</strong>
        <a href={reset}>{fr ? "Tout effacer" : "Clear all"}</a>
      </div>
      {chips}
      <div className="troc-browse-groups">
        {options(
          "game",
          t("game"),
          page.games.map((item) => ({
            value: item.slug,
            label: item.name[page.locale],
          })),
        )}
        {options(
          "set",
          t("set"),
          (moreSets || fold(setQuery)
            ? sets
            : sets.filter((item, index) => index < 7 || item.slug === draft.set)
          ).map((item) => ({
            value: item.slug,
            label: item.name[page.locale],
          })),
          <div className="troc-browse-set-search">
            <Input
              value={setQuery}
              onChange={(event) => setSetQuery(event.target.value)}
              aria-label={fr ? "Rechercher une extension" : "Search sets"}
              placeholder={fr ? "Rechercher une extension…" : "Search sets…"}
            />
            <div className="troc-set-tools">
              <span aria-live="polite">{setsLoading ? "" : sets.length + (fr ? " extensions" : " sets")}</span>
              <button type="button" aria-pressed={fullNames} onClick={() => setFullNames(value => !value)}>{fr ? "Noms complets" : "Full names"}</button>
            </div>
            {setsLoading && (
              <p role={setError ? "alert" : "status"}>
                {setError ? (fr ? "Extensions indisponibles." : "Sets unavailable.") : (fr ? "Chargement des extensions…" : "Loading sets…")}
                {setError && <Button type="button" variant="ghost" onClick={() => setSetRevision((value) => value + 1)}>{fr ? "Réessayer" : "Retry"}</Button>}
              </p>
            )}
            {!setsLoading && !sets.length && (
              <div><p>{fr ? "Aucune extension trouvée." : "No sets found."}</p>{setQuery && <Button type="button" variant="ghost" size="sm" onClick={() => setSetQuery("")}>{fr ? "Effacer la recherche" : "Clear set search"}</Button>}</div>
            )}
          </div>,
          !fold(setQuery) && sets.length > 7 ? <Button type="button" variant="ghost" size="sm" className="troc-set-more" aria-expanded={moreSets} onClick={() => setMoreSets(value => !value)}>{moreSets ? (fr ? "Voir moins" : "Show less") : (fr ? "Voir toutes les extensions" : "Show all sets")}</Button> : null,
        )}
        {options(
          "condition",
          t("condition"),
          ["NM", "LP", "MP", "HP", "DMG"].map((value, index) => ({
            value,
            label: (fr
              ? [
                  "Près de neuf",
                  "Légèrement jouée",
                  "Modérément jouée",
                  "Très jouée",
                  "Endommagée",
                ]
              : [
                  "Near Mint",
                  "Lightly Played",
                  "Moderately Played",
                  "Heavily Played",
                  "Damaged",
                ])[index],
          })),
        )}
        <details
          className="troc-browse-group"
          open={Boolean(draft.min || draft.max)}
        >
          <summary>{fr ? "Prix (CAD)" : "Price (CAD)"}</summary>
          <div className="troc-browse-prices" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) autoSubmit(); }}>
            {(["min", "max"] as const).map((key) => (
              <label key={key}>
                {key === "min" ? "Min (CAD)" : "Max (CAD)"}
                <Input
                  id={"browse-price-" + key}
                  type="text"
                  inputMode="decimal"
                  maxLength={14}
                  aria-invalid={Boolean(priceError)}
                  form="catalog-browse-form"
                  value={draft[key]}
                  onChange={(event) => {
                    setPriceError("");
                    change(key, event.target.value);
                  }}
                  aria-describedby={
                    priceError
                      ? "browse-price-help browse-price-error"
                      : "browse-price-help"
                  }
                />
              </label>
            ))}
          </div>
          <p id="browse-price-help">
            {fr
              ? "Prix en dollars canadiens, avant livraison."
              : "Canadian dollars, before shipping."}
          </p>
          {priceError && (
            <p id="browse-price-error" role="alert">
              {priceError}
            </p>
          )}
        </details>
        {options(
          "type",
          t("type"),
          ["raw_single", "graded_card", "sealed"].map((value) => ({
            value,
            label: t(value as CatalogMessage),
          })),
        )}
        {options("rarity", t("rarity"), variantOptions("rarity"))}
        {options("language", t("language"), [
          { value: "en", label: t("english") },
          { value: "ja", label: t("japanese") },
        ])}
        {options("variant", t("variant"), variantOptions("variant"))}
      </div>

    </div></TooltipProvider>
  );
  return (
    <form
      ref={form}
      id="catalog-browse-form"
      className="troc-browse"
      action={`${base}${page.path}`}
      data-view={view}
      onSubmit={(event) => {
        event.preventDefault();
        if (composing.current) return;
        clearTimeout(typingTimer.current);
        const min = priceInputCents(draft.min),
          max = priceInputCents(draft.max);
        if (
          min === undefined ||
          max === undefined ||
          (min !== null && max !== null && min > max)
        ) {
          invalidPriceField.current = min === undefined ? "min" : "max";
          setPriceError(
            min === undefined || max === undefined
              ? fr
                ? "Entrez un montant valide, avec au plus deux décimales."
                : "Enter a valid amount with up to two decimal places."
              : fr
                ? "Le maximum doit être supérieur ou égal au minimum."
                : "Maximum must be at least the minimum.",
          );
          if (mobile) setOpen(true);
          return;
        }
        const values = new URLSearchParams();
        new FormData(event.currentTarget).forEach((value, key) => {
          if (value && value !== "__all") values.set(key, String(value));
        });
        for (const [key, amount] of [
          ["min", min],
          ["max", max],
        ] as const) {
          if (amount === null) values.delete(key);
          else values.set(key, String(amount));
        }
        const destination = `${base}${page.path}?${values}`;
        if (page.path === "/search") {
          setOpen(false);
          const activeId = document.activeElement?.id;
          window.history[typingSubmit.current && window.history.state?.trocTypingSearch ? "replaceState" : "pushState"]({ ...window.history.state, trocTypingSearch: typingSubmit.current, ...(activeId?.startsWith("catalog-filter-") ? {trocCatalogFocus: activeId} : {}) }, "", destination);
          window.dispatchEvent(new PopStateEvent("popstate"));
        } else window.location.assign(destination);
      }}
    >
      <input type="hidden" name="lang" value={page.locale} />
      <input type="hidden" name="limit" value={page.filters.limit} />
      {fields.map((key) => (
        <input key={key} type="hidden" name={key} value={draft[key]} />
      ))}
      <div className="troc-browse-toolbar">
        <div className="troc-browse-search">
          <label className="sr-only" htmlFor="catalog-browse-query">
            {t("searchLabel")}
          </label>
          <EditorialIcon name="search" />
          <Input
            id="catalog-browse-query"
            ref={query}
            name="q"
            defaultValue={page.filters.q}
            onChange={queueSearch}
            onCompositionStart={() => { composing.current = true; clearTimeout(typingTimer.current); }}
            onCompositionEnd={() => { composing.current = false; queueSearch(); }}
            maxLength={100}
            placeholder={
              fr ? "Rechercher dans le catalogue…" : "Search the catalog…"
            }
          />
          <Button
            type="submit"
            variant="secondary"
            aria-label={t("searchLabel")}
          >
            <EditorialIcon name="search" />
          </Button>
        </div>
        <div className="troc-browse-tools">
          {mobile && (
            <Button
              ref={trigger}
              type="button"
              variant="secondary"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
            >
              <EditorialIcon name="filter" />
              {fr ? "Filtres" : "Filters"}
            </Button>
          )}
          <label className="troc-browse-sort">
            <span>{t("sort")}</span>
            <Select key={page.filters.sort} name="sort" defaultValue={page.filters.sort} onValueChange={() => autoSubmit(true)}>
              <SelectTrigger aria-label={t("sort")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["name", "price", "newest"].map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(value as CatalogMessage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div
            className="troc-browse-views"
            role="group"
            aria-label={fr ? "Affichage des résultats" : "Results view"}
          >
            {(
              [
                ["large", "grid", fr ? "Grande grille" : "Large grid"],
                ["compact", "compact", fr ? "Grille compacte" : "Compact grid"],
                ["list", "list", fr ? "Liste" : "List view"],
              ] as const
            ).map(([value, icon, label]) => (
              <Button
                key={value}
                type="button"
                variant="ghost"
                aria-label={label}
                title={label}
                aria-pressed={view === value}
                onClick={() => chooseView(value)}
              >
                <EditorialIcon name={icon} />
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div className="troc-browse-layout">
        {!mobile && (
          <aside aria-label={fr ? "Filtres du catalogue" : "Catalog filters"}>
            {panel}
          </aside>
        )}
        <section className="troc-browse-results" aria-label={t("results")}>
          <div className="troc-browse-results-heading">
          <p id="catalog-results" tabIndex={-1}>
            {page.results.length}{" "}
            {fr
              ? `${page.results.length <= 1 ? "produit" : "produits"} sur cette page`
              : `product${page.results.length === 1 ? "" : "s"} on this page`}
          </p>
          <div className="troc-browse-page-size">
            <label id="catalog-page-size-label" htmlFor="catalog-page-size">{fr ? "Par page" : "Per page"}</label>
            <Select value={String(page.filters.limit)} onValueChange={(value) => {
              const url = new URL(window.location.href);
              url.searchParams.set("limit", value);
              url.searchParams.delete("cursor");
              window.history.pushState({ ...window.history.state, trocCatalogFocus: "catalog-page-size" }, "", url);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}>
              <SelectTrigger id="catalog-page-size" aria-labelledby="catalog-page-size-label"><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set<number>([...CATALOG_PAGE_SIZES, page.filters.limit])].sort((a,b)=>a-b).map(size => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          </div>
          {mobile && chips}
          {page.results.length ? (
            children
          ) : (
            <PremiumEmptyState
              title={
                fr ? "Aucune carte trouvée" : "No cards match these filters"
              }
              description={
                fr
                  ? "Retirez un filtre ou recherchez une autre extension."
                  : "Try removing a filter or searching another set."
              }
              actions={
                <>
                  <Button type="button" onClick={() => query.current?.focus()}>
                    {fr ? "Modifier la recherche" : "Edit search"}
                  </Button>
                  <Button asChild variant="secondary">
                    <a href={reset}>{t("reset")}</a>
                  </Button>
                </>
              }
            />
          )}
          <nav
            className="troc-browse-pagination"
            aria-label={fr ? "Pages du catalogue" : "Catalog pages"}
          >
            {pagination}
          </nav>
        </section>
      </div>
      {mobile && (
        <Drawer direction="right" open={open} onOpenChange={setOpen}>
          <DrawerContent
            side="right"
            className="troc-browse-drawer"
            closeLabel={fr ? "Fermer les filtres" : "Close filters"}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <DrawerHeader>
              <DrawerTitle>
                {fr ? "Affiner les résultats" : "Refine your results"}
              </DrawerTitle>
              <DrawerDescription>
                {fr
                  ? "Appliquez vos choix pour actualiser le catalogue."
                  : "Apply your choices to update the catalog."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="troc-browse-drawer-scroll">{panel}</div>
            <div className="troc-browse-drawer-footer">
              <Button type="submit" form="catalog-browse-form">{t("apply")}</Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </form>
  );
}

export { CatalogLoading } from "./CatalogLoading";
