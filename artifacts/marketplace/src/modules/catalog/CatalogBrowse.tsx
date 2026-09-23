import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PublicPage } from "@workspace/catalog";
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
import { Skeleton } from "@workspace/troc-design-system/components/ui/skeleton";
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
        fields.map((key) => [key, String(page.filters[key] ?? "")]),
      ) as Record<Field, string>,
  );
  const [view, setView] = useState<View>("large");
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [setQuery, setSetQuery] = useState("");
  const [moreSets, setMoreSets] = useState(false);
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
  const chooseView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem("troc.catalog.view", next);
    } catch {
      /* Storage is optional. */
    }
  };
  const change = (key: Field, value: string) =>
    setDraft((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "game" ? { set: "" } : {}),
    }));
  const reset = `${base}${page.path}?lang=${page.locale}`;
  const game = page.games.find((item) => item.slug === draft.game);
  const sets = page.sets.filter(
    (item) =>
      (!game || item.gameId === game.id) &&
      item.name[page.locale]
        .toLocaleLowerCase(page.locale)
        .includes(setQuery.toLocaleLowerCase(page.locale)),
  );
  const options = (
    key: Field,
    label: string,
    values: { value: string; label: string }[],
    extra?: ReactNode,
  ) => (
    <details
      className="troc-browse-group"
      open={key === "game" || Boolean(draft[key])}
    >
      <summary>{label}</summary>
      {extra}
      <RadioGroup
        aria-label={label}
        value={draft[key] || "__all"}
        onValueChange={(value) => change(key, value === "__all" ? "" : value)}
      >
        {[{ value: "__all", label: t("all") }, ...values].map((option) => (
          <label key={option.value} className="troc-browse-option">
            <RadioGroupItem value={option.value} /> <span>{option.label}</span>
          </label>
        ))}
      </RadioGroup>
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
    <div className="troc-browse-panel">
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
          (moreSets
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
            {sets.length > 7 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMoreSets(!moreSets)}
              >
                {moreSets
                  ? fr
                    ? "Voir moins"
                    : "Show less"
                  : fr
                    ? "Voir plus"
                    : "Show more"}
              </Button>
            )}
            {!sets.length && (
              <p>{fr ? "Aucune extension trouvée." : "No sets found."}</p>
            )}
          </div>,
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
          <div className="troc-browse-prices">
            {(["min", "max"] as const).map((key) => (
              <label key={key}>
                {key === "min" ? "Min (¢)" : "Max (¢)"}
                <Input
                  type="number"
                  min={0}
                  step={1}
                  form="catalog-browse-form"
                  value={draft[key]}
                  onChange={(event) => change(key, event.target.value)}
                  aria-describedby="browse-price-help"
                />
              </label>
            ))}
          </div>
          <p id="browse-price-help">
            {fr ? "100 ¢ = 1 $ CAD" : "100¢ = $1 CAD"}
          </p>
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
      <div className="troc-browse-apply">
        <Button type="submit" form="catalog-browse-form">
          {t("apply")}
        </Button>
      </div>
    </div>
  );
  return (
    <form
      id="catalog-browse-form"
      className="troc-browse"
      action={`${base}${page.path}`}
      data-view={view}
      onSubmit={(event) => {
        event.preventDefault();
        const values = new URLSearchParams();
        new FormData(event.currentTarget).forEach((value, key) => {
          if (value && value !== "__all") values.set(key, String(value));
        });
        window.location.assign(`${base}${page.path}?${values}`);
      }}
    >
      <input type="hidden" name="lang" value={page.locale} />
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
            <Select name="sort" defaultValue={page.filters.sort}>
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
          <p id="catalog-results" tabIndex={-1}>
            {page.results.length}{" "}
            {fr
              ? `${page.results.length <= 1 ? "produit" : "produits"} sur cette page`
              : `product${page.results.length === 1 ? "" : "s"} on this page`}
          </p>
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
            {panel}
          </DrawerContent>
        </Drawer>
      )}
    </form>
  );
}

export function CatalogLoading({ locale }: { locale: PublicPage["locale"] }) {
  const [view, setView] = useState<View>("large");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("troc.catalog.view");
      if (saved === "large" || saved === "compact" || saved === "list")
        setView(saved);
    } catch {
      /* Storage is optional. */
    }
  }, []);
  return (
    <div
      className="troc-browse troc-browse-loading"
      data-view={view}
      role="status"
      aria-busy="true"
    >
      <h1 className="text-2xl font-semibold">
        {catalogMessages.loading[locale === "fr" ? 1 : 0]}
      </h1>
      <div className="troc-editorial-catalog" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} shape={view === "list" ? "row" : "card"} />
        ))}
      </div>
    </div>
  );
}
