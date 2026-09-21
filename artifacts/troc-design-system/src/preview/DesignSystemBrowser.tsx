import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Grid2X2, Menu, Moon, Search, Sun, X } from "lucide-react";
import { ALL_ENTRIES, NAV_GROUPS, OVERVIEW_ENTRY, type PreviewEntry } from "./registry";
import { BrandImage } from "./parts";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { usePreferences } from "../hooks/use-preferences";
import { cn } from "../lib/utils";

function currentPage() { return new URLSearchParams(window.location.hash.slice(1)).get("page") || "overview"; }
class PreviewBoundary extends Component<{ children: ReactNode; fallback: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="alert" className="ds-notice">{this.props.fallback}</p> : this.props.children; }
}

export function DesignSystemBrowser() {
  const { t, locale, setLocale, theme, setTheme } = usePreferences();
  const [page, setPage] = useState(currentPage);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLElement>(null);
  const previousPage = useRef(page);
  const active = ALL_ENTRIES.find((entry) => entry.id === page);
  const ActivePage = active?.component;
  useEffect(() => {
    if (window.location.pathname === import.meta.env.BASE_URL) {
      window.history.replaceState(null, "", `${import.meta.env.BASE_URL}style-guide${window.location.search}${window.location.hash}`);
    }
    const navigate = () => setPage(currentPage());
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  useEffect(() => {
    document.title = `${active ? t(active.title) : t("notFound")} — TROC Design System`;
    if (previousPage.current !== page) {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus({ preventScroll: true });
      previousPage.current = page;
    }
    dialogRef.current?.close();
  }, [page, active, t]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (window.matchMedia("(max-width: 900px)").matches) dialogRef.current?.showModal();
        requestAnimationFrame(() => {
          const mobileSearch = dialogRef.current?.querySelector<HTMLInputElement>("input");
          if (dialogRef.current?.open) mobileSearch?.focus(); else searchRef.current?.focus();
        });
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const matches = (entry: PreviewEntry) => t(entry.title).toLocaleLowerCase().includes(search.toLocaleLowerCase());
  const entryLink = (entry: PreviewEntry) => <a key={entry.id} href={`#page=${entry.id}`}
    className={cn("ds-nav-link", page === entry.id && "is-active")} aria-current={page === entry.id ? "page" : undefined}
    onClick={() => { setSearch(""); dialogRef.current?.close(); }}>
    {entry.id === "overview" ? <Grid2X2 size={15} aria-hidden="true" /> : <span className="ds-nav-dash" />}
    <span>{t(entry.title)}</span><span className="ds-nav-number">{entry.number}</span>
  </a>;
  const navigation = (mobile = false) => <div className="ds-sidebar-inner">
    <div className="ds-sidebar-brand">
      <a href="#page=overview" aria-label={t("systemTitle")} onClick={() => dialogRef.current?.close()}><BrandImage /></a>
      <span>{t("designSystem")}</span>
      {mobile && <Button variant="ghost" size="icon" aria-label={t("closeNavigation")} onClick={() => dialogRef.current?.close()}><X /></Button>}
    </div>
    <div className="ds-sidebar-search"><Search size={15} aria-hidden="true" />
      <Input ref={mobile ? undefined : searchRef} value={search} onChange={(event) => setSearch(event.target.value)}
        placeholder={t("searchGuide")} aria-label={t("searchGuide")} />
      {search ? <button type="button" aria-label={t("clearSearch")} onClick={() => setSearch("")}><X size={13} /></button> : <kbd>⌘ K</kbd>}
    </div>
    <nav className="ds-nav" aria-label={t("navigation")}>
      {matches(OVERVIEW_ENTRY) && entryLink(OVERVIEW_ENTRY)}
      {NAV_GROUPS.map((group) => {
        const entries = group.entries.filter(matches);
        return entries.length ? <div className="ds-nav-group" key={group.title}>
          <h2>{t(group.title)}</h2>{entries.map(entryLink)}
        </div> : null;
      })}
      {!ALL_ENTRIES.some(matches) && <p className="ds-nav-empty">{t("noPages")}</p>}
    </nav>
    <div className="ds-sidebar-footer"><span className="ds-pilot-dot" /><div><strong>{t("pilot")}</strong><span>{t("version")}</span></div><ArrowDownLeft size={16} /></div>
  </div>;
  const position = ALL_ENTRIES.findIndex((entry) => entry.id === page);
  return <div className="ds">
    <a className="ds-skip-link" href="#main-content" onClick={(event) => {
      event.preventDefault();
      headingRef.current?.focus();
      headingRef.current?.scrollIntoView({ block: "start" });
    }}>{t("skip")}</a>
    <aside className="ds-sidebar">{navigation()}</aside>
    <dialog className="ds-mobile-dialog" ref={dialogRef} aria-label={t("navigation")}
      onClick={(event) => { if (event.target === dialogRef.current) dialogRef.current.close(); }}>{navigation(true)}</dialog>
    <div className="ds-workspace">
      <header className="ds-topbar">
        <Button className="ds-mobile-menu" variant="ghost" size="icon" aria-label={t("openNavigation")} onClick={() => dialogRef.current?.showModal()}><Menu /></Button>
        <div className="ds-breadcrumb"><span>TROC</span><ChevronRight size={13} aria-hidden="true" /><span>{t("designSystem")}</span><ChevronRight size={13} aria-hidden="true" /><strong>{active ? t(active.title) : "404"}</strong></div>
        <div className="ds-topbar-controls">
          <div className="ds-language" role="group" aria-label={t("language")}>
            <button type="button" lang="en" aria-label="English" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
            <span aria-hidden="true">/</span><button type="button" lang="fr" aria-label="Français" aria-pressed={locale === "fr"} onClick={() => setLocale("fr")}>FR</button>
          </div>
          <div className="ds-theme-control" role="group" aria-label={t("theme")}>
            <button type="button" aria-label={t("light")} aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Sun size={15} /></button>
            <button type="button" aria-label={t("dark")} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon size={15} /></button>
          </div>
        </div>
      </header>
      <main id="main-content" className="ds-main" ref={headingRef} tabIndex={-1}>
        <div className="ds-page-meta"><span>{t("systemTitle")}<span className="ds-meta-slash">/</span>{active?.number ?? "—"}</span><span className="ds-review-label"><span />{t("pilotShort")}</span></div>
        <PreviewBoundary key={page} fallback={t("componentError")}>
          <Suspense fallback={<p className="ds-loading-page" role="status">{t("loading")}…</p>}>
            {ActivePage ? <ActivePage /> : <p role="alert">{t("notFound")}</p>}
          </Suspense>
        </PreviewBoundary>
        <footer className="ds-page-footer"><span>{t("footer")}</span>
          {position >= 0 && position < ALL_ENTRIES.length - 1 && <a href={`#page=${ALL_ENTRIES[position + 1].id}`} className="ds-text-link">{t(ALL_ENTRIES[position + 1].title)}<ArrowUpRight size={15} aria-hidden="true" /></a>}
        </footer>
      </main>
    </div>
  </div>;
}