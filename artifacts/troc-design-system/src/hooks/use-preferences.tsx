import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { messages, type Locale, type MessageKey } from "../lib/messages";

export const themes = [{ id: "dark", labelKey: "dark" }, { id: "light", labelKey: "light" }] as const;
export type Theme = typeof themes[number]["id"];
const readPreference = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const writePreference = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* Private browsing can prevent persistence; the current session still works. */ }
};
const clearPreviewOverride = (key: "theme" | "lang") => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(key)) return;
  url.searchParams.delete(key);
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
};
type Preferences = {
  theme: Theme; setTheme: (theme: Theme) => void;
  locale: Locale; setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  formatPrice: (value: number) => string;
};
const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children, initialTheme, initialLocale }: { children: ReactNode; initialTheme?: Theme; initialLocale?: Locale }) {
  const [theme, setThemeValue] = useState<Theme>(() => {
    if (initialTheme) return initialTheme;
    const linked = new URLSearchParams(window.location.search).get("theme");
    return (linked === "dark" || linked === "light" ? linked : readPreference("troc.theme")) === "light" ? "light" : "dark";
  });
  const [locale, setLocaleValue] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    const linked = new URLSearchParams(window.location.search).get("lang");
    const saved = linked === "en" || linked === "fr" ? linked : readPreference("troc.locale");
    return saved === "en" || saved === "fr" ? saved : navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
  });
  useEffect(() => {
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    document.documentElement.dataset.theme = `troc-${theme}`;
  }, [theme]);
  useEffect(() => { document.documentElement.lang = `${locale}-CA`; }, [locale]);
  const value = useMemo<Preferences>(() => ({
    theme, locale,
    setTheme: (next) => { setThemeValue(next); writePreference("troc.theme", next); clearPreviewOverride("theme"); },
    setLocale: (next) => { setLocaleValue(next); writePreference("troc.locale", next); clearPreviewOverride("lang"); },
    t: (key) => messages[key][locale === "en" ? 0 : 1],
    formatPrice: (amount) => new Intl.NumberFormat(`${locale}-CA`, { style: "currency", currency: "CAD", minimumFractionDigits: 2 }).format(amount),
  }), [theme, locale]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("Wrap the application in PreferencesProvider before using usePreferences.");
  return value;
}