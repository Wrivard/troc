import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { api } from "../../api";
import { copy, options, type CopyKey } from "./copy";
import { PrelaunchAdmin } from "./PrelaunchAdmin";
import { analyticsPreference, journey, observe } from "./journey";
import "./prelaunch.css";
const version = "prelaunch-2026-09-v1";
const link = (path: string) => `${import.meta.env.BASE_URL}early-access${path}`;
function pathLink(path: string, locale: string) {
  const incoming = new URLSearchParams(window.location.search),
    out = new URLSearchParams({ lang: locale });
  for (const field of ["source", "ref"]) {
    const value = incoming.get(field);
    if (value) out.set(field, value.slice(0, 64));
  }
  return link(path) + (out.size ? "?" + out.toString() : "");
}
export function PrelaunchApp({ path }: { path: string }) {
  const { locale, setLocale } = usePreferences(),
    lang = locale === "fr" ? 1 : 0;
  const t = (key: CopyKey) => copy[key][lang];
  const localLink = (suffix: string) => pathLink(suffix, locale);
  const audience = path.endsWith("/seller") ? "seller" : "collector";
  const formPage =
    path === "/early-access/collector" || path === "/early-access/seller";
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<CopyKey | null>(null),
    [receipt, setReceipt] = useState("");
  const [analytics, setAnalytics] = useState(analyticsPreference);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const formObserved = useRef(false);
  const withdrawal = useRef("");
  useEffect(() => {
    if (path === "/early-access" && analytics)
      void journey("landing", true)
        .then((j) => observe(j, "landing_visit"))
        .catch(() => setMessage("error"));
  }, [path, analytics]);
  async function start() {
    const j = await journey(audience, analytics);
    if (analytics && !formObserved.current) {
      await observe(j, "form_start");
      formObserved.current = true;
    }
    return j;
  }
  async function analyticsChange(enabled: boolean) {
    setAnalyticsBusy(true);
    setAnalytics(enabled);
    try {
      const j = await journey(formPage ? audience : "landing", enabled);
      if (enabled) {
        await observe(j, formPage ? "form_start" : "landing_visit");
        if (formPage) formObserved.current = true;
      }
    } catch {
      setMessage("error");
    } finally {
      setAnalyticsBusy(false);
    }
  }
  function analyticsControl() {
    return (
      <label className="prelaunch-check">
        <input
          type="checkbox"
          name="analytics"
          checked={analytics}
          disabled={busy || analyticsBusy}
          onChange={(e) => void analyticsChange(e.target.checked)}
        />
        {t("analytics")}
      </label>
    );
  }
  async function choosePath(selected: "collector" | "seller", href: string) {
    try {
      const j = await journey(selected, true);
      await observe(j, "cta");
    } catch {
      /* Measurement must not obstruct navigation. */
    } finally {
      window.location.assign(href);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      const s = await start();
      if (!s) throw new Error("unavailable");
      if (!withdrawal.current)
        withdrawal.current = btoa(
          String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
        )
          .replaceAll("+", "-")
          .replaceAll("/", "_")
          .replaceAll("=", "");
      await api("/prelaunch/leads", "POST", {
        ...Object.fromEntries(data),
        games: data.getAll("games"),
        channels: data.getAll("channels"),
        software: data.getAll("software"),
        frequency: data.get("frequency") || "not_specified",
        country: data.get("country") ? "CA" : "",
        adult: data.has("adult"),
        consent: data.has("consent"),
        consentVersion: version,
        locale,
        token: s.token,
        withdrawal: withdrawal.current,
      });
      setReceipt(withdrawal.current);
      setMessage("success");
    } catch {
      setMessage("error");
    } finally {
      setBusy(false);
    }
  }
  async function withdraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      await api("/prelaunch/withdraw", "POST", Object.fromEntries(data));
      setMessage("withdrawn");
    } catch {
      setMessage("error");
    } finally {
      setBusy(false);
    }
  }
  function select(name: CopyKey) {
    return (
      <label>
        {t(name)}
        <select name={name} required={name !== "frequency"} defaultValue="">
          <option value="" disabled>
            {t("choose")}
          </option>
          {options[name].map(([v, en, fr]) => (
            <option key={v} value={v}>
              {lang ? fr : en}
            </option>
          ))}
        </select>
      </label>
    );
  }
  function checks(name: CopyKey) {
    return (
      <fieldset>
        <legend>
          {t(name)} ({t("optionalLabel")})
        </legend>
        <div className="prelaunch-checks">
          {options[name].map(([v, en, fr]) => (
            <label key={v}>
              <input type="checkbox" name={name} value={v} />
              {lang ? fr : en}
            </label>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <div className="prelaunch-shell" lang={locale}>
      <header>
        <a href={localLink("")} aria-label="TROC">
          TROC
        </a>
        <Button
          variant="secondary"
          onClick={() => setLocale(locale === "en" ? "fr" : "en")}
        >
          {locale === "en" ? "Français" : "English"}
        </Button>
      </header>
      <main>
        <p className="prelaunch-eyebrow">{t("development")}</p>
        {path === "/early-access/admin" ? (
          <PrelaunchAdmin />
        ) : path === "/early-access/withdraw" ? (
          <>
            <h1>{t("withdraw")}</h1>
            <p>{t("withdrawalHelp")}</p>
            <form onSubmit={withdraw}>
              <label>
                {t("listConcerned")}
                <select name="kind">
                  <option value="collector">{t("collector")}</option>
                  <option value="seller">{t("seller")}</option>
                </select>
              </label>
              <label>
                {t("withdrawal")}
                <Input
                  name="withdrawal"
                  required
                  minLength={43}
                  maxLength={43}
                  autoComplete="off"
                />
              </label>
              <Button type="submit" disabled={busy}>
                {t("withdraw")}
              </Button>
            </form>
          </>
        ) : formPage ? (
          <>
            <a href={localLink("")}>{t("back")}</a>
            <h1>{t(audience)}</h1>
            <p>{t(audience === "seller" ? "sellerText" : "collectorText")}</p>
            {!receipt && (
              <form
                onSubmit={submit}
                onFocusCapture={() => {
                  if (analytics && !formObserved.current)
                    void start().catch(() => setMessage("error"));
                }}
              >
                <p>{t("requiredNote")}</p>
                <h2>{t("contactSection")}</h2>
                <label>
                  {t("email")}
                  <Input
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                  />
                </label>
                <div className="prelaunch-grid">
                  {audience === "seller" && (
                    <label>
                      {t("contact")}
                      <Input
                        name="contact"
                        required
                        maxLength={100}
                        autoComplete="organization"
                      />
                    </label>
                  )}
                  {select("province")}
                </div>
                <h2>{t("activitySection")}</h2>
                {checks("games")}
                {audience === "seller" ? (
                  <>
                    {checks("channels")}
                    {checks("software")}
                    <div className="prelaunch-grid">
                      {select("inventory")}
                      {select("sellerType")}
                      {select("experience")}
                    </div>
                  </>
                ) : (
                  <details>
                    <summary>{t("optional")}</summary>
                    {select("frequency")}
                    {checks("channels")}
                    <label>
                      {t("frustrations")}
                      <textarea name="frustrations" maxLength={500} />
                    </label>
                    <label>
                      {t("wishlist")}
                      <textarea name="wishlist" maxLength={1000} />
                    </label>
                  </details>
                )}
                <label className="prelaunch-trap" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                <h2>{t("consentSection")}</h2>
                <p className="prelaunch-privacy">{t("privacy")}</p>
                {audience === "seller" && (
                  <label className="prelaunch-check">
                    <input name="adult" type="checkbox" required />
                    {t("adult")}
                  </label>
                )}
                <label className="prelaunch-check">
                  <input type="checkbox" name="country" required />
                  {t("country")}
                </label>
                <label className="prelaunch-check">
                  <input type="checkbox" name="consent" required />
                  {t("consent")}
                </label>
                {analyticsControl()}
                <Button type="submit" disabled={busy}>
                  {t(busy ? "busy" : "submit")}
                </Button>
              </form>
            )}
          </>
        ) : (
          <>
            <h1>{t("title")}</h1>
            <p className="prelaunch-intro">{t("intro")}</p>
            {analyticsControl()}
            <div className="prelaunch-paths">
              {(["collector", "seller"] as const).map((k) => (
                <section key={k}>
                  <h2>{t(k)}</h2>
                  <p>{t(k === "seller" ? "sellerText" : "collectorText")}</p>
                  <a
                    href={localLink("/" + k)}
                    onClick={(e) => {
                      if (
                        analytics &&
                        !e.ctrlKey &&
                        !e.metaKey &&
                        !e.shiftKey &&
                        !e.altKey
                      ) {
                        e.preventDefault();
                        void choosePath(k, e.currentTarget.href);
                      }
                    }}
                  >
                    {t(k)} <span aria-hidden="true">→</span>
                  </a>
                </section>
              ))}
            </div>
          </>
        )}
        {message && (
          <div
            role={message === "error" ? "alert" : "status"}
            className="prelaunch-message"
          >
            <p>{t(message)}</p>
            {receipt && (
              <label>
                {t("withdrawal")}
                <Input
                  readOnly
                  value={receipt}
                  autoComplete="off"
                  onFocus={(event) => event.currentTarget.select()}
                />
              </label>
            )}
          </div>
        )}
        <p className="prelaunch-note">{t("promise")}</p>
      </main>
      <footer>
        <a href={localLink("/withdraw")}>{t("withdraw")}</a>
        <p>TROC · Canada · CAD</p>
      </footer>
    </div>
  );
}
