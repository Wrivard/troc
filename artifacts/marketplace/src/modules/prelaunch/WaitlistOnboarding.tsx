import { onboardingRequest } from "./draft-api";
import { WaitlistAccount } from "./WaitlistAccount";
import { MarketplaceHeader, MarketplaceFooter } from "../brand/SiteChrome";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/troc-design-system/components/ui/dialog";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import {
  Checkbox,
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
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePreferences } from "@workspace/troc-design-system/hooks/use-preferences";
import { SignInLayout } from "../account/sign-in-presentation/SignInLayout";
import { options } from "./copy";
import "./onboarding.css";

type Notice = readonly [string, string];
const notice = (en: string, fr: string): Notice => [en, fr];
type Intent = "buyer" | "seller" | "both" | "";
type Step =
  | "account"
  | "intent"
  | "interests"
  | "buyer"
  | "seller"
  | "contact"
  | "review";
type Choice = readonly [string, string, string];
const extras: Record<string, readonly Choice[]> = {
  contactLanguage: [
    ["en", "English", "Anglais"],
    ["fr", "French", "Français"],
  ],
  monthlySpend: [
    ["not_specified", "Skip this question", "Passer cette question"],
    ["prefer_not_to_say", "Prefer not to say", "Je préfère ne pas répondre"],
    ["under_25", "Under $25", "Moins de 25 $"],
    ["25_99", "$25–99", "25–99 $"],
    ["100_249", "$100–249", "100–249 $"],
    ["250_499", "$250–499", "250–499 $"],
    ["500_plus", "$500+", "500 $ et plus"],
  ],
  initialListings: [
    ["1_49", "1–49 cards", "1–49 cartes"],
    ["50_99", "50–99 cards", "50–99 cartes"],
    ["100_249", "100–249 cards", "100–249 cartes"],
    ["250_499", "250–499 cards", "250–499 cartes"],
    ["500_999", "500–999 cards", "500–999 cartes"],
    ["1000_2499", "1,000–2,499 cards", "1 000–2 499 cartes"],
    ["2500_4999", "2,500–4,999 cards", "2 500–4 999 cartes"],
    ["5000_9999", "5,000–9,999 cards", "5 000–9 999 cartes"],
    ["10000_24999", "10,000–24,999 cards", "10 000–24 999 cartes"],
    ["25000_49999", "25,000–49,999 cards", "25 000–49 999 cartes"],
    ["50000_99999", "50,000–99,999 cards", "50 000–99 999 cartes"],
    ["100000_plus", "100,000+ cards", "100 000+ cartes"],
    ["undecided", "Still deciding", "À déterminer"],
  ],
  readiness: [
    ["at_launch", "At launch", "Dès le lancement"],
    ["within_1_month", "Within a month", "Dans un mois"],
    ["within_3_months", "Within three months", "Dans trois mois"],
    ["exploring", "Just exploring", "Je découvre les possibilités"],
  ],
  desiredFeatures: [
    ["combined_shipping", "Combined shipping", "Livraison regroupée"],
    ["collection_tracking", "Collection tracking", "Suivi de collection"],
    ["want_lists", "Want lists", "Listes de souhaits"],
    ["price_alerts", "Price alerts", "Alertes de prix"],
    ["canadian_sellers", "Canadian sellers", "Vendeurs canadiens"],
    ["bilingual", "English & French", "Français et anglais"],
  ],
};
export function WaitlistOnboarding({ path }: { path: string }) {
  const { locale, setLocale, theme, setTheme } = usePreferences();
  const fr = locale === "fr";
  const c = (en: string, french: string) => (fr ? french : en);
  const [intent, setIntent] = useState<Intent>(
    path.endsWith("seller")
      ? "seller"
      : path.endsWith("collector")
        ? "buyer"
        : "",
  );
  const [step, setStep] = useState<Step>("intent");
  const [values, setValues] = useState<Record<string, string>>({
    province: "",
    contactLanguage: locale,
    frequency: "not_specified",
    monthlySpend: "not_specified",
  });
  const [sets, setSets] = useState<Record<string, string[]>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Notice | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, Notice>>({});
  const invalidFocus = useRef("");
  const [done, setDone] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);

  const [exitHref, setExitHref] = useState<string | null>(null);
  const visited = useRef(new Set<Step>());
  const [previewSuccess, setPreviewSuccess] = useState(false);
  const localPreview =
    import.meta.env.DEV &&
    ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const lock = useRef(false),
    mounted = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorBox = useRef<HTMLParagraphElement>(null);
  const editing = useRef(false);
  const steps: Step[] = [
    "intent",
    "contact",
    "interests",
    ...(intent !== "seller" ? ["buyer" as const] : []),
    ...(intent !== "buyer" ? ["seller" as const] : []),
    "review",
    "account",
  ];
  const names: Record<Step, string> = {
    account: c("Your account", "Votre compte"),
    intent: c("Your place in the hobby", "Votre passion, votre place"),
    interests: c("What do you collect?", "Qu’est-ce qui vous passionne?"),
    buyer: c("Your next great find", "Votre prochaine trouvaille"),
    seller: c(
      "Make room for new possibilities",
      "Ouvrez de nouvelles possibilités",
    ),
    contact: c("Your Canadian home base", "Votre point de départ au Canada"),
    review: c("Make sure it feels right", "Un dernier coup d’œil"),
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step, done, previewSuccess]);
  useEffect(() => {
    if (error) {
      const field = document.getElementById("wl-" + invalidFocus.current);
      if (field) field.focus();
      else errorBox.current?.focus();
    }
  }, [error]);
  const [saveState, setSaveState] = useState<
    "loading" | "saving" | "saved" | "error" | "conflict"
  >("loading");
  const [restored, setRestored] = useState(false);
  const revision = useRef(0),
    chain = useRef<Promise<unknown>>(Promise.resolve()),
    conflict = useRef(false);
  const acquisition = useRef(
    typeof window === "undefined"
      ? { source: "direct", referral: "" }
      : {
          source:
            new URLSearchParams(window.location.search).get("source") ||
            "direct",
          referral:
            new URLSearchParams(window.location.search).get("ref") || "",
        },
  );
  const snapshot = {
    ...acquisition.current,
    intent,
    locale: values.contactLanguage || locale,
    step,
    values,
    sets,
    checks,
  };
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  function persist(nextStep: Step = step, ready = false) {
    const payload = { ...snapshotRef.current, step: nextStep };
    const run = async () => {
      if (conflict.current) throw Error("draft_conflict");
      setSaveState("saving");
      try {
        const result = await onboardingRequest("onboarding/draft", "PUT", {
          payload,
          revision: revision.current,
          ready,
        });
        if (
          result.saved !== true ||
          !Number.isInteger(result.revision) ||
          result.revision < 1
        )
          throw Error("invalid_receipt");
        revision.current = result.revision;
        setSaveState("saved");
      } catch (e) {
        if (
          e instanceof Error &&
          ["draft_conflict", "draft_completed", "draft_expired"].includes(
            e.message,
          )
        ) {
          conflict.current = true;
          setSaveState("conflict");
        } else setSaveState("error");
        throw e;
      }
    };
    const pending = chain.current.then(run, run);
    chain.current = pending.catch(() => {});
    return pending;
  }
  useEffect(() => {
    let active = true;
    onboardingRequest("onboarding/draft")
      .then((result) => {
        if (!active) return;
        if (result.redirectToAccount === true) {
          window.location.assign(
            import.meta.env.BASE_URL + "account?lang=" + locale,
          );
          return;
        }
        const draft = result.draft;
        if (draft) {
          revision.current = draft.revision;
          setAwaitingEmail(draft.awaitingEmail === true);
          if (draft.completed) {
            setDone(true);
            setSaveState("saved");
            return;
          }
          const p = draft.payload;
          acquisition.current = {
            source: p.source || "direct",
            referral: p.referral || "",
          };
          setIntent(p.intent);
          setValues(p.values);
          setSets(p.sets);
          setChecks(p.checks);
          setStep(p.step === "location" ? "contact" : p.step);
          setSaveState("saved");
        } else setSaveState("saved");
      })
      .catch((e) => {
        if (active) {
          setSaveState(e.message === "draft_expired" ? "conflict" : "error");
          conflict.current = e.message === "draft_expired";
        }
      })
      .finally(() => {
        if (active) setRestored(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const serialized = JSON.stringify(snapshot);
  useEffect(() => {
    if (!restored || done || step === "account" || !intent || conflict.current)
      return;
    setSaveState("saving");
    const timer = setTimeout(
      () => void persist(step, false).catch(() => {}),
      900,
    );
    return () => clearTimeout(timer);
  }, [serialized, restored, done]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!done && saveState !== "saved" && intent) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [done, saveState, intent]);
  const clearField = (name: string) => {
    setFieldErrors((old) => {
      const next = { ...old };
      delete next[name];
      return next;
    });
    setError(null);
  };
  const set = (name: string, value: string) => {
    clearField(name);
    setFieldErrors((old) => {
      const next = { ...old };
      delete next[name];
      return next;
    });
    setValues((old) => ({ ...old, [name]: value }));
  };
  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <span className="wl-field-error" id={"wl-error-" + name}>
        {fieldErrors[name][fr ? 1 : 0]}
      </span>
    ) : null;
  const choices = (name: string) => extras[name] ?? options[name] ?? [];
  const label = (name: string, value: string) =>
    value === "not_specified"
      ? c("Not specified", "Non précisé")
      : (choices(name).find((item) => item[0] === value)?.[fr ? 2 : 1] ??
        value);
  function summary(section: Step): [string, string][] {
    const list = (key: string, source = key) =>
      (sets[key] ?? []).map((v) => label(source, v)).join(", ") ||
      c("Not specified", "Non précisé");
    if (section === "intent")
      return [
        [
          c("Your interests", "Vos intérêts"),
          {
            "": c("Choose your path", "Choisissez votre parcours"),
            buyer: c("Buying", "Acheter"),
            seller: c("Selling", "Vendre"),
            both: c("Buying & selling", "Acheter et vendre"),
          }[intent],
        ],
      ];
    if (section === "interests")
      return [
        [c("Games", "Jeux"), list("games")],

        [
          c("Contact language", "Langue de contact"),
          values.contactLanguage === "fr" ? "Français" : "English",
        ],
      ];
    if (section === "buyer")
      return [
        [
          c("Buying frequency", "Fréquence d’achat"),
          label("frequency", values.frequency),
        ],
        [
          c("Monthly budget · CAD", "Budget mensuel · CAD"),
          label("monthlySpend", values.monthlySpend),
        ],
        [
          c("Current channels", "Canaux actuels"),
          list("buyerChannels", "channels"),
        ],
        [
          c("Most useful features", "Fonctionnalités souhaitées"),
          list("desiredFeatures"),
        ],
        ...(values.frustrations
          ? [
              [
                c("Main frustration", "Principale frustration"),
                values.frustrations,
              ] as [string, string],
            ]
          : []),
        ...(values.wishlist
          ? [
              [c("Wish list", "Liste de souhaits"), values.wishlist] as [
                string,
                string,
              ],
            ]
          : []),
      ];
    if (section === "seller")
      return [
        [
          c("Seller type", "Type de vendeur"),
          label("sellerType", values.sellerType),
        ],
        [
          c("Total inventory", "Inventaire total"),
          label("inventory", values.inventory),
        ],
        [
          c(
            "First listings · if one-click import existed",
            "Premières annonces · si l’import en un clic existait",
          ),
          label("initialListings", values.initialListings),
        ],
        [
          c("Ready to list", "Prêt à publier"),
          label("readiness", values.readiness),
        ],
        [
          c("Selling channels", "Canaux de vente"),
          list("sellerChannels", "channels"),
        ],
        [c("Inventory tools", "Outils d’inventaire"), list("software")],
        ...(values.storeName
          ? [[c("Store", "Boutique"), values.storeName] as [string, string]]
          : []),
        ...(values.storeUrl
          ? [[c("Website", "Site Web"), values.storeUrl] as [string, string]]
          : []),
      ];
    return [
      [c("Name", "Nom"), values.contact],
      [
        c("Address", "Adresse"),
        [values.street, values.city, values.province, values.postalCode]
          .filter(Boolean)
          .join(", "),
      ],
      [
        c("Optional marketing", "Nouvelles promotionnelles facultatives"),
        checks.marketing ? c("Yes", "Oui") : c("No", "Non"),
      ],
    ];
  }
  function select(name: string, title: string, source = name, required = true) {
    return (
      <div className="wl-field">
        <label id={"wl-label-" + name} htmlFor={"wl-" + name}>
          {title}
        </label>
        <Select
          name={name}
          value={values[name] ?? ""}
          required={required}
          disabled={busy}
          onValueChange={(value) => set(name, value)}
        >
          <SelectTrigger
            id={"wl-" + name}
            aria-labelledby={"wl-label-" + name}
            aria-invalid={!!fieldErrors[name]}
            aria-describedby={
              fieldErrors[name] ? "wl-error-" + name : undefined
            }
            className="wl-select"
          >
            <SelectValue
              placeholder={c("Choose an option", "Choisissez une option")}
            />
          </SelectTrigger>
          <SelectContent
            className="wl-select-menu"
            position="popper"
            sideOffset={6}
          >
            {source === "frequency" && (
              <SelectItem value="not_specified" data-value="not_specified">
                {c("Skip this question", "Passer cette question")}
              </SelectItem>
            )}
            {choices(source).map(([value, en, french]) => (
              <SelectItem key={value} value={value} data-value={value}>
                {fr ? french : en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {fieldError(name)}
      </div>
    );
  }
  function multiple(name: string, title: string, source = name) {
    return (
      <fieldset
        className="wl-choices"
        aria-describedby={fieldErrors[name] ? "wl-error-" + name : undefined}
      >
        <legend>{title}</legend>
        <div>
          {choices(source).map(([v, en, french]) => (
            <label
              key={v}
              className={sets[name]?.includes(v) ? "selected" : ""}
            >
              <Checkbox
                id={
                  name === "games" && v === choices(name)[0]?.[0]
                    ? "wl-games"
                    : undefined
                }
                disabled={busy}
                checked={sets[name]?.includes(v) ?? false}
                onCheckedChange={(checked) => {
                  if (checked === true) clearField(name);
                  setSets((old) => ({
                    ...old,
                    [name]:
                      checked === true
                        ? name === "software" && v === "none"
                          ? ["none"]
                          : [
                              ...(old[name] ?? []).filter(
                                (x) => name !== "software" || x !== "none",
                              ),
                              v,
                            ]
                        : (old[name] ?? []).filter((x) => x !== v),
                  }));
                }}
              />
              {fr ? french : en}
            </label>
          ))}
        </div>
        {fieldError(name)}
      </fieldset>
    );
  }
  function text(
    name: string,
    title: string,
    type = "text",
    maxLength = 100,
    required = false,
  ) {
    if (name === "frustrations" || name === "wishlist")
      return (
        <label className="wl-field">
          {title}
          <Textarea
            id={"wl-" + name}
            name={name}
            value={values[name] || ""}
            maxLength={maxLength}
            onChange={(e) => set(name, e.target.value)}
          />
        </label>
      );
    return (
      <label className="wl-field">
        {title}
        <Input
          name={name}
          id={"wl-" + name}
          aria-invalid={!!fieldErrors[name]}
          aria-describedby={fieldErrors[name] ? "wl-error-" + name : undefined}
          type={type}

          value={values[name] ?? ""}
          maxLength={maxLength}
          required={required}
          autoComplete={
            name === "contact"
              ? "name"
              : name === "street"
                ? "street-address"
                : name === "city"
                  ? "address-level2"
                  : name === "postalCode"
                    ? "postal-code"
                    : "off"
          }
          onChange={(e) => set(name, e.target.value)}
        />
        {fieldError(name)}
      </label>
    );
  }
  function check(name: string, title: string, required = false) {
    return (
      <label className="wl-check">
        <Checkbox
          name={name}
          id={"wl-" + name}
          aria-invalid={!!fieldErrors[name]}
          aria-describedby={fieldErrors[name] ? "wl-error-" + name : undefined}
          disabled={busy}
          checked={checks[name] ?? false}
          required={required}
          onCheckedChange={(checked) => {
            if (checked === true) clearField(name);
            setChecks((old) => ({ ...old, [name]: checked === true }));
          }}
        />
        <span>
          {title}
          {fieldError(name)}
        </span>
      </label>
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setError(null);
    const validate = (target: Step) => {
      const errors: Record<string, Notice> = {};
      const required = (
        key: string,
        en: string,
        french: string,
        value: unknown,
      ) => {
        if (!value) errors[key] = notice(en, french);
      };
      if (target === "intent")
        required(
          "intent",
          "Choose buying, selling or both.",
          "Choisissez acheter, vendre ou les deux.",
          intent,
        );
      if (target === "interests") {
        required(
          "games",
          "Choose at least one game.",
          "Choisissez au moins un jeu.",
          sets.games?.length,
        );
      }
      if (target === "seller") {
        for (const [key, en, french] of [
          [
            "sellerType",
            "Choose your seller type.",
            "Choisissez votre type de vendeur.",
          ],
          [
            "inventory",
            "Choose your inventory range.",
            "Choisissez votre tranche d’inventaire.",
          ],
          [
            "initialListings",
            "Choose your first-listing estimate.",
            "Choisissez votre estimation initiale.",
          ],
          [
            "readiness",
            "Choose when you would be ready.",
            "Précisez quand vous seriez prêt.",
          ],
        ])
          required(key, en, french, values[key]);
        required(
          "adult",
          "Confirm you are at least 18.",
          "Confirmez que vous avez au moins 18 ans.",
          checks.adult,
        );
        if (values.storeUrl) {
          try {
            const url = new URL(values.storeUrl);
            if (
              !["http:", "https:"].includes(url.protocol) ||
              url.username ||
              url.password
            )
              throw Error();
          } catch {
            errors.storeUrl = notice(
              "Enter a full https:// website address.",
              "Saisissez une adresse complète https://.",
            );
          }
        }
      }
      if (target === "contact") {
        required(
          "contact",
          "Enter your name.",
          "Saisissez votre nom.",
          values.contact?.trim(),
        );
        required(
          "street",
          "Enter your street address.",
          "Saisissez votre adresse.",
          values.street?.trim()?.length >= 3,
        );
        required(
          "city",
          "Enter your city.",
          "Saisissez votre ville.",
          values.city?.trim()?.length >= 2,
        );
        required(
          "province",
          "Choose your province or territory.",
          "Choisissez votre province ou territoire.",
          values.province,
        );
        const prefixes: Record<string, string> = {
          AB: "T",
          BC: "V",
          MB: "R",
          NB: "E",
          NL: "A",
          NS: "B",
          NT: "X",
          NU: "X",
          ON: "KLMNP",
          PE: "C",
          QC: "GHJ",
          SK: "S",
          YT: "Y",
        };
        const postal = (values.postalCode || "")
          .replace(/\s/g, "")
          .toUpperCase();
        required(
          "postalCode",
          "Enter a Canadian postal code matching your province.",
          "Indiquez un code postal canadien correspondant à votre province.",
          /^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTV-Z][0-9][ABCEGHJ-NPRSTV-Z][0-9]$/.test(
            postal,
          ) && prefixes[values.province]?.includes(postal[0]),
        );
        required(
          "canada",
          "Confirm you live in Canada.",
          "Confirmez que vous résidez au Canada.",
          checks.canada,
        );
      }
      if (target === "review")
        required(
          "consent",
          "Confirm how we may use your details.",
          "Confirmez l’utilisation de vos renseignements.",
          checks.consent,
        );
      return errors;
    };
    const problems = validate(step);
    if (Object.keys(problems).length) {
      invalidFocus.current = Object.keys(problems)[0];
      setFieldErrors(problems);
      requestAnimationFrame(() => {
        const control = document.getElementById("wl-" + invalidFocus.current);
        const details = control?.closest("details");
        if (details) details.open = true;
        control?.focus();
      });
      setError(
        notice(
          "Please check the highlighted fields.",
          "Vérifiez les champs indiqués ci-dessous.",
        ),
      );
      return;
    }
    invalidFocus.current = "";
    setFieldErrors({});
    if (step !== "review") {
      visited.current.add(step);
      if (editing.current) {
        const pending = steps
          .filter((s) => s !== "account" && s !== "intent" && s !== "review")
          .find(
            (s) =>
              ((s === "buyer" || s === "seller") && !visited.current.has(s)) ||
              Object.keys(validate(s)).length > 0,
          );
        if (pending) setStep(pending);
        else {
          editing.current = false;
          setStep("review");
        }
      } else setStep(steps[steps.indexOf(step) + 1]);
      return;
    }
    for (const target of steps.filter(
      (s) => s !== "account" && s !== "review",
    )) {
      const errors = validate(target);
      if (Object.keys(errors).length) {
        setFieldErrors(errors);
        setStep(target);
        return;
      }
    }
    lock.current = true;
    setBusy(true);
    try {
      await persist("account", true);
      setStep("account");
    } catch {
      setError(
        notice(
          "We couldn’t save your answers. They are still here. Retry before creating your account.",
          "Impossible d’enregistrer vos réponses. Elles sont conservées ici. Réessayez avant de créer votre compte.",
        ),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  const base = import.meta.env.BASE_URL;
  const chromeBase = base.replace(/\/$/, "");
  const dirty =
    saveState !== "saved" &&
    (!!intent || !!values.contact || !!sets.games?.length);
  const navigate = (href: string) => {
    if (dirty && !done) setExitHref(href);
    else window.location.assign(href);
  };
  return (
    <div
      onClickCapture={(event) => {
        const anchor = (event.target as HTMLElement).closest("a");

        if (
          anchor &&
          !anchor.getAttribute("href")?.startsWith("#") &&
          dirty &&
          !done &&
          !event.ctrlKey &&
          !event.metaKey &&
          anchor.target !== "_blank"
        ) {
          event.preventDefault();
          event.stopPropagation();
          setExitHref(anchor.href);
        }
      }}
      className="wl-site min-h-screen bg-background text-foreground"
    >
      <Dialog
        open={!!exitHref}
        onOpenChange={(open) => {
          if (!open) setExitHref(null);
        }}
      >
        <DialogContent
          className="wl-exit-dialog"
          closeLabel={c("Close", "Fermer")}
        >
          <DialogHeader>
            <DialogTitle>
              {c(
                "Leave your unfinished request?",
                "Quitter votre demande inachevée?",
              )}
            </DialogTitle>
            <DialogDescription>
              {c(
                "Your latest changes have not been saved. Stay to save them before leaving.",
                "Vos dernières modifications ne sont pas enregistrées. Restez pour les sauvegarder avant de quitter.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="wl-exit-actions">
            <Button type="button" onClick={() => setExitHref(null)}>
              {c("Keep my answers", "Conserver mes réponses")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (exitHref) window.location.assign(exitHref);
              }}
            >
              {c("Leave without saving", "Quitter sans enregistrer")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <MarketplaceHeader
        locale={locale}
        theme={theme}
        onLocale={setLocale}
        onTheme={setTheme}
        base={chromeBase}
        onNavigate={navigate}
      />
      <div
        className="wl-page"
        data-stage={done || previewSuccess ? "complete" : step}
      >
        <SignInLayout
          locale={locale}
          busy={busy}
          copy={{
            heading:
              done || previewSuccess
                ? c(
                    "A new chapter, together.",
                    "Un nouveau chapitre, ensemble.",
                  )
                : c(
                    "Your hobby. Our next chapter.",
                    "Votre passion. Notre prochain chapitre.",
                  ),
            support:
              done || previewSuccess
                ? [
                    c(
                      "Your request has been received.",
                      "Votre demande a été reçue.",
                    ),
                    c(
                      "Thank you for sharing your interests with us.",
                      "Merci de nous avoir fait part de vos intérêts.",
                    ),
                  ]
                : [
                    c(
                      "Help shape TROC’s Canadian launch.",
                      "Participez au lancement canadien de TROC.",
                    ),
                    c(
                      "Tell us about yourself, then create your account.",
                      "Présentez-vous, puis créez votre compte TROC.",
                    ),
                  ],
            artHeading: [
              c("Every collection", "Chaque collection"),
              c("starts with a connection.", "commence par une rencontre."),
            ],
            artDescription: c(
              "Built for the people behind the cards. Tell us what you’d love to buy, sell and discover.",
              "Pensé pour les passionnés derrière les cartes. Dites-nous ce que vous aimeriez acheter, vendre et découvrir.",
            ),
          }}
        >
          {!done && !previewSuccess && (
            <div className="wl-save-state" role="status">
              {saveState === "loading"
                ? c("Checking for a saved draft…", "Recherche d’un brouillon…")
                : saveState === "saving"
                  ? c("Saving your answers…", "Enregistrement…")
                  : saveState === "saved"
                    ? c(
                        "Private draft · saved for 7 days in this browser",
                        "Brouillon privé · enregistré 7 jours pour ce navigateur",
                      )
                    : saveState === "conflict"
                      ? c(
                          "This draft expired or changed in another tab. Reload to use the latest version.",
                          "Ce brouillon a expiré ou a changé dans un autre onglet. Rechargez la version actuelle.",
                        )
                      : c(
                          "Draft saving is unavailable. Answers stay in this tab until you can retry.",
                          "Sauvegarde indisponible. Vos réponses restent dans cet onglet en attendant une nouvelle tentative.",
                        )}
              {saveState === "error" && (
                <Button
                  variant="ghost"
                  onClick={() => void persist(step, false).catch(() => {})}
                >
                  {c("Retry saving", "Réessayer")}
                </Button>
              )}
              {saveState === "conflict" && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await onboardingRequest("onboarding/draft", "DELETE");
                    window.location.reload();
                  }}
                >
                  {c(
                    "Discard this draft and restart",
                    "Abandonner ce brouillon et recommencer",
                  )}
                </Button>
              )}
              {saveState === "conflict" && (
                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                >
                  {c("Reload latest", "Recharger")}
                </Button>
              )}
              <small>
                {c(
                  "We store your draft to restore your progress, not to send marketing. Unfinished drafts expire after seven days.",
                  "Le brouillon sert à reprendre votre progression, pas à envoyer des promotions. Il expire après sept jours.",
                )}
              </small>
            </div>
          )}
          {done || previewSuccess ? (
            <section className="wl-success">
              {previewSuccess && (
                <div className="wl-preview-note" role="status">
                  {c(
                    "Local success preview — no request was sent or saved.",
                    "Aperçu local de confirmation — aucune demande envoyée ni enregistrée.",
                  )}
                  <Button
                    type="button"
                    onClick={() => setPreviewSuccess(false)}
                  >
                    {c("Back to form", "Retour au formulaire")}
                  </Button>
                </div>
              )}
              <span aria-hidden="true" className="wl-success-icon">
                <svg viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="21" />
                  <path d="m14 24 7 7 14-15" />
                </svg>
              </span>
              <h2 tabIndex={-1} ref={heading}>
                {c("Your interests, received.", "Vos intérêts, bien reçus.")}
              </h2>
              <p>
                {c(
                  "Your account is ready and your interests have been received. You can access your personal space while waiting for launch.",
                  "Votre compte est prêt et vos intérêts ont été reçus. Accédez à votre espace en attendant le lancement.",
                )}
              </p>
              <div className="wl-next">
                <strong>{c("What happens next?", "Et maintenant?")}</strong>
                <p>
                  {c(
                    "Your interests help us plan the launch: the games, inventory tools and experiences that matter most. No purchase or seller commitment is required.",
                    "Vos intérêts nous aident à préparer le lancement : les jeux, les outils et les expériences qui comptent. Aucun achat ni engagement de vente n’est requis.",
                  )}
                </p>
              </div>
              <a className="wl-primary" href={`${base}account?lang=${locale}`}>
                {c("Go to my account", "Accéder à mon compte")}
              </a>
            </section>
          ) : step === "account" ? (
            <WaitlistAccount
              totalSteps={steps.length}
              locale={locale}
              awaitingEmail={awaitingEmail}
              onReady={() => setDone(true)}
              onBack={() => setStep("review")}
            />
          ) : (
            <form
              noValidate
              className="wl-form"
              onSubmit={(e) => void submit(e)}
            >
              <div className="wl-progress">
                <span aria-live="polite">
                  {c("Step", "Étape")} {steps.indexOf(step) + 1} /{" "}
                  {steps.length}
                </span>
                <span>{names[step]}</span>
                <progress
                  max={steps.length}
                  value={steps.indexOf(step) + 1}
                  aria-label={c("Form progress", "Progression du formulaire")}
                />
              </div>
              <h2 tabIndex={-1} ref={heading}>
                {names[step]}
              </h2>
              {error && (
                <p
                  className="wl-error"
                  role="alert"
                  tabIndex={-1}
                  ref={errorBox}
                >
                  {error?.[fr ? 1 : 0]}
                </p>
              )}
              <fieldset
                disabled={busy || !restored}
                className="wl-body"
                key={step}
              >
                {step === "intent" && (
                  <>
                    <p>
                      {c(
                        "How would you like to be part of TROC?",
                        "Comment souhaitez-vous participer à TROC?",
                      )}
                    </p>
                    <RadioGroup
                      id="wl-intent"
                      className="wl-intents"
                      name="intent"
                      value={intent}
                      onValueChange={(value) => setIntent(value as Intent)}
                      disabled={busy}
                    >
                      {(["buyer", "seller", "both"] as const).map((v, i) => (
                        <label
                          key={v}
                          className={intent === v ? "selected" : ""}
                        >
                          <RadioGroupItem value={v} />
                          <span>
                            <strong>
                              {
                                [
                                  c(
                                    "I’m here to collect",
                                    "Je veux collectionner",
                                  ),
                                  c("I’m here to sell", "Je veux vendre"),
                                  c("A little of both", "Un peu des deux"),
                                ][i]
                              }
                            </strong>
                            <small>
                              {
                                [
                                  c(
                                    "Find cards and grow your collection.",
                                    "Trouvez des cartes et enrichissez votre collection.",
                                  ),
                                  c(
                                    "Bring your cards to Canadian collectors.",
                                    "Proposez vos cartes aux collectionneurs canadiens.",
                                  ),
                                  c(
                                    "Discover new favourites. Pass others on.",
                                    "Découvrez des coups de cœur. Partagez les autres.",
                                  ),
                                ][i]
                              }
                            </small>
                          </span>
                          <span aria-hidden="true">↗</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </>
                )}
                {step === "interests" && (
                  <>
                    {multiple(
                      "games",
                      c(
                        "Your games · choose at least one",
                        "Vos jeux · au moins un choix",
                      ),
                    )}
                    <p>
                      {c(
                        "We’ll use the contact language you chose.",
                        "Nous utiliserons la langue de contact choisie.",
                      )}
                    </p>
                  </>
                )}
                {step === "buyer" && (
                  <>
                    <p className="wl-step-note">
                      {c(
                        "These questions are optional. Share what feels useful, or continue when you’re ready.",
                        "Ces questions sont facultatives. Répondez à celles qui vous conviennent, puis continuez.",
                      )}
                    </p>
                    {select(
                      "frequency",
                      c(
                        "How often do you buy cards?",
                        "À quelle fréquence achetez-vous des cartes?",
                      ),
                    )}
                    {select(
                      "monthlySpend",
                      c(
                        "Typical monthly budget · CAD · optional",
                        "Budget mensuel habituel · CAD · facultatif",
                      ),
                    )}
                    {multiple(
                      "buyerChannels",
                      c(
                        "Where do you shop? · optional",
                        "Où achetez-vous? · facultatif",
                      ),
                      "channels",
                    )}
                    {multiple(
                      "desiredFeatures",
                      c(
                        "What would help most? · optional",
                        "Qu’est-ce qui vous aiderait? · facultatif",
                      ),
                    )}
                    <details>
                      <summary>
                        {c(
                          "Tell us a little more · optional",
                          "Dites-nous-en plus · facultatif",
                        )}
                      </summary>
                      {text(
                        "frustrations",
                        c(
                          "Your biggest frustration",
                          "Votre principale frustration",
                        ),
                        "text",
                        500,
                      )}
                      {text(
                        "wishlist",
                        c("What’s on your wish list?", "Que recherchez-vous?"),
                        "text",
                        1000,
                      )}
                    </details>
                  </>
                )}
                {step === "seller" && (
                  <>
                    {select(
                      "sellerType",
                      c("How do you sell?", "Quel type de vendeur êtes-vous?"),
                    )}
                    {select(
                      "inventory",
                      c(
                        "Your total card inventory",
                        "Votre inventaire total de cartes",
                      ),
                    )}
                    <p className="wl-scenario">
                      {c(
                        "Imagine TROC connected to your inventory tool, such as CardUploader or SortSwift, and you could publish in one click. ",
                        "Imaginez TROC connecté à votre outil d’inventaire, comme CardUploader ou SortSwift, pour publier en un clic. ",
                      )}
                    </p>
                    {select(
                      "initialListings",
                      c(
                        "If listing took one click, how many cards would you start with?",
                        "Si publier ne prenait qu’un clic, combien de cartes proposeriez-vous au départ?",
                      ),
                    )}
                    {select(
                      "readiness",
                      c("When would you be ready?", "Quand seriez-vous prêt?"),
                    )}
                    {check(
                      "adult",
                      c("I am at least 18 years old.", "J’ai au moins 18 ans."),
                      true,
                    )}
                    <details>
                      <summary>
                        {c(
                          "Selling tools & store details · optional",
                          "Outils et boutique · facultatif",
                        )}
                      </summary>
                      {multiple(
                        "sellerChannels",
                        c(
                          "Current selling channels",
                          "Canaux de vente actuels",
                        ),
                        "channels",
                      )}
                      {multiple(
                        "software",
                        c("Inventory tools", "Outils d’inventaire"),
                      )}
                      {text("storeName", c("Store name", "Nom de la boutique"))}
                      {text(
                        "storeUrl",
                        c("Store website", "Site de la boutique"),
                        "url",
                        300,
                      )}
                    </details>
                  </>
                )}
                {step === "contact" && (
                  <>
                    <p>
                      {c(
                        "We’re building TROC for people living in Canada. Your address stays private and is not proof of verified residency.",
                        "TROC s’adresse aux personnes résidant au Canada. Votre adresse reste privée et ne constitue pas une preuve de résidence vérifiée.",
                      )}
                    </p>
                    {text(
                      "contact",
                      c("Your name", "Votre nom"),
                      "text",
                      100,
                      true,
                    )}
                    {text(
                      "street",
                      c(
                        "Street address · include unit if needed",
                        "Adresse · appartement s’il y a lieu",
                      ),
                      "text",
                      160,
                      true,
                    )}
                    {text("city", c("City", "Ville"), "text", 80, true)}
                    {select(
                      "province",
                      c("Province or territory", "Province ou territoire"),
                    )}
                    {text(
                      "postalCode",
                      c("Postal code", "Code postal"),
                      "text",
                      7,
                      true,
                    )}
                    {select(
                      "contactLanguage",
                      c("Contact language", "Langue de contact"),
                    )}
                    {check(
                      "canada",
                      c("I live in Canada.", "Je réside au Canada."),
                      true,
                    )}
                  </>
                )}
                {step === "review" && (
                  <>
                    <p>
                      {c(
                        "Review your answers before joining. You can change any section.",
                        "Vérifiez vos réponses avant de vous inscrire. Chaque section peut être modifiée.",
                      )}
                    </p>
                    {check(
                      "consent",
                      c(
                        "I agree to TROC using these details to manage my account and waitlist registration.",
                        "J’accepte l’utilisation de ces renseignements pour gérer mon compte et mon inscription.",
                      ),
                      true,
                    )}
                    {check(
                      "marketing",
                      c(
                        "Send me optional TROC marketing updates.",
                        "Je souhaite recevoir les nouvelles promotionnelles facultatives de TROC.",
                      ),
                    )}
                    <p>
                      {c(
                        "Authorized administrators can use your answers for launch planning. Investor reporting uses aggregate, self-reported interest, not your personal address.",
                        "Les administrateurs autorisés utilisent vos réponses pour préparer le lancement. Les rapports investisseurs présentent l’intérêt déclaré agrégé, pas votre adresse personnelle.",
                      )}
                    </p>
                    {steps
                      .filter((s) => s !== "account" && s !== "review")
                      .map((s) => (
                        <section className="wl-review" key={s}>
                          <div>
                            <h3>{names[s]}</h3>
                            <Button
                              type="button"
                              onClick={() => {
                                editing.current = true;
                                setStep(s);
                                setError(null);
                              }}
                            >
                              {c("Edit", "Modifier")}
                              <span className="wl-sr"> {names[s]}</span>
                            </Button>
                          </div>
                          <dl className="wl-summary">
                            {summary(s)
                              .filter(
                                ([, value]) =>
                                  value !== c("Not specified", "Non précisé"),
                              )
                              .map(([title, value]) => (
                                <div key={title}>
                                  <dt>{title}</dt>
                                  <dd>{value}</dd>
                                </div>
                              ))}
                          </dl>
                          {summary(s).some(
                            ([, value]) =>
                              value === c("Not specified", "Non précisé"),
                          ) && (
                            <details className="wl-skipped">
                              <summary>
                                {c(
                                  "Optional details left blank",
                                  "Renseignements facultatifs non précisés",
                                )}
                              </summary>
                              <ul>
                                {summary(s)
                                  .filter(
                                    ([, value]) =>
                                      value ===
                                      c("Not specified", "Non précisé"),
                                  )
                                  .map(([title]) => (
                                    <li key={title}>{title}</li>
                                  ))}
                              </ul>
                            </details>
                          )}
                        </section>
                      ))}
                    <p>
                      {c(
                        "Next, create or connect your account. Seller approval and marketplace access remain separate; no launch date is promised.",
                        "Ensuite, créez votre compte ou connectez-vous. L’approbation vendeur et l’accès au marché restent distincts; aucune date de lancement n’est promise.",
                      )}
                    </p>
                  </>
                )}
                <div className="wl-actions">
                  {step !== "intent" && (
                    <Button
                      type="button"
                      onClick={() => {
                        editing.current = false;
                        setError(null);
                        setStep(steps[steps.indexOf(step) - 1]);
                      }}
                    >
                      {c("Back", "Retour")}
                    </Button>
                  )}
                  <Button className="wl-primary" type="submit">
                    {busy
                      ? c("Saving…", "Enregistrement…")
                      : step === "review"
                        ? c(
                            "Continue to my account",
                            "Continuer vers mon compte",
                          )
                        : editing.current
                          ? c("Save changes", "Enregistrer les modifications")
                          : c("Continue →", "Continuer →")}
                  </Button>
                </div>
              </fieldset>
              <p className="wl-footnote">
                {c(
                  "Saved drafts can be resumed in this browser for seven days. Wait for the saved status before leaving.",
                  "Les brouillons enregistrés peuvent être repris dans ce navigateur pendant sept jours. Attendez la confirmation de sauvegarde avant de quitter.",
                )}
              </p>
              <p className="wl-footnote">
                {c("Already have an account?", "Vous avez déjà un compte?")}{" "}
                <a
                  href={`${base}sign-in?lang=${locale}&returnTo=%2Fearly-access`}
                >
                  {c("Sign in", "Se connecter")}
                </a>
              </p>
              {localPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  className="wl-preview-control"
                  onClick={() => setPreviewSuccess(true)}
                >
                  {c("Preview thank-you screen", "Aperçu de la confirmation")}
                </Button>
              )}
            </form>
          )}
        </SignInLayout>
      </div>
      <MarketplaceFooter locale={locale} base={chromeBase} />
    </div>
  );
}
