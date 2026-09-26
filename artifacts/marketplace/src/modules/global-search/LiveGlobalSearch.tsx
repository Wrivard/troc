import { useEffect, useRef, useState } from "react";
import type { Locale } from "@workspace/catalog";
import {
  GlobalSearchPresentation,
  type SearchPresentationGroup,
} from "./GlobalSearchPresentation";
import {
  presentationGroups,
  searchHref,
  suggestionRequests,
} from "./suggestions-client";
export function LiveGlobalSearch({
  locale,
  base = "",
  disabled = false,
  onNavigate,
  hero = false,
}: {
  hero?: boolean;
  locale: Locale;
  base?: string;
  disabled?: boolean;
  onNavigate?: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const key = JSON.stringify([query, locale, disabled, base]);
  const [state, setState] = useState<{
    key: string;
    groups: SearchPresentationGroup[];
    loading: boolean;
    error: boolean;
  }>({ key: "", groups: [], loading: false, error: false });
  const requests = useRef<ReturnType<typeof suggestionRequests> | null>(null);
  if (!requests.current)
    requests.current = suggestionRequests(
      fetch,
      import.meta.env.BASE_URL.replace(/\/$/, "") + "/api",
    );
  useEffect(() => {
    let active = true;
    const runner = requests.current!;
    runner.cancel();
    if (disabled || !query.trim()) {
      setState({ key, groups: [], loading: false, error: false });
      return () => {
        active = false;
        runner.cancel();
      };
    }
    setState({ key, groups: [], loading: true, error: false });
    const timer = window.setTimeout(() => {
      void runner.load(query, locale).then((result) => {
        if (!active || !result) return;
        setState(
          result.error
            ? { key, groups: [], loading: false, error: true }
            : {
                key,
                groups: presentationGroups(result.data, base),
                loading: false,
                error: false,
              },
        );
      });
    }, 70);
    return () => {
      active = false;
      window.clearTimeout(timer);
      runner.cancel();
    };
  }, [key, query, locale, disabled, base]);
  const current = state.key === key;
  return (
    <GlobalSearchPresentation
      locale={locale}
      hero={hero}
      onNavigate={onNavigate}
      query={query}
      groups={current ? state.groups : []}
      loading={Boolean(query.trim()) && (current ? state.loading : true)}
      error={
        current && state.error
          ? locale === "fr"
            ? "Suggestions indisponibles. Modifiez la recherche ou ouvrez le catalogue."
            : "Suggestions unavailable. Edit your search or open the catalog."
          : null
      }
      disabled={disabled}
      searchAllHref={searchHref(base, locale, query)}
      onQueryChange={(value) => {
        requests.current?.cancel();
        setQuery(value);
      }}
    />
  );
}
