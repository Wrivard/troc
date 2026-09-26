import { HelpGuide } from "./HelpGuide";
import { useGrowthDialogFocus } from "./growth-dialog-focus";
import { useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Textarea } from "@workspace/troc-design-system/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/troc-design-system/components/ui/dialog";
import {
  Store,
  Package,
  ClipboardList,
  Wallet,
  ChartNoAxesColumn,
  Users,
  Settings,
  TriangleAlert,
  ChevronRight,
  Search,
} from "@workspace/troc-design-system/components/ui/seller-icons";
import { OperationsPage, useSellerCopy } from "./operations-ui";
import { helpCategories, helpArticles } from "./help-content";
import "./seller-growth.css";
const normalizeHelpQuery = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim().replace(/\s+/g, " ");

export function SellerHelp() {
  const dialogFocus = useGrowthDialogFocus();
  const { t, fr, href } = useSellerCopy(),
    i = fr ? 1 : 0;
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("all"),
    [article, setArticle] = useState(() =>
      typeof location === "undefined"
        ? ""
        : location.hash === "#demo"
          ? "demo"
          : new URLSearchParams(location.search).get("article") || "",
    ),
    [support, setSupport] = useState(false),
    [question, setQuestion] = useState(""),
    [notice, setNotice] = useState("");
  const current = helpArticles.find((a) => a.id === article),
    icons = [
      Store,
      Package,
      ClipboardList,
      Wallet,
      ChartNoAxesColumn,
      Users,
      Settings,
      TriangleAlert,
    ];
  const filtered = helpArticles.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      normalizeHelpQuery([a.title[i], a.summary[i], ...a.steps.map((s) => s[i])].join(" ")).includes(normalizeHelpQuery(q)),
  );
  const openArticle = (id: string) => {
    setArticle(id);
    const url = new URL(location.href);
    url.searchParams.set("article", id);
    history.replaceState(null, "", url);
  };
  return (
    <OperationsPage
      title={t("How can we help?", "Comment pouvons-nous vous aider ?")}
      description={t(
        "Find answers, learn your way around TROC and keep your store moving.",
        "Trouvez des réponses et apprenez à gérer votre boutique sur TROC.",
      )}
    >
      <div className="help-content">
        <div className="help-search">
          <Search size={20} aria-hidden="true" />
          <Input
            aria-label={t("Search help articles", "Rechercher dans l’aide")}
            placeholder={t("Search help articles…", "Rechercher un article…")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="help-categories">
          {helpCategories.map(
            ([id, en, french, description, descriptionFr], n) => {
              const Icon = icons[n];
              return (
                <button
                  key={id}
                  aria-pressed={category === id}
                  onClick={() => setCategory(category === id ? "all" : id)}
                >
                  <span className="help-icon">
                    <Icon size={22} />
                  </span>
                  <ChevronRight size={17} className="help-chevron" />
                  <strong>{fr ? french : en}</strong>
                  <small>{fr ? descriptionFr : description}</small>
                </button>
              );
            },
          )}
        </div>
        <section className="help-articles">
          <div className="growth-section-heading">
            <h2>
              {q || category !== "all"
                ? t("Matching articles", "Articles correspondants")
                : t("Popular articles", "Articles utiles")}
            </h2>
            <Button
              variant="ghost"
              onClick={() => {
                setCategory("all");
                setQ("");
              }}
            >
              {t("View all articles", "Tous les articles")}
            </Button>
          </div>
          <p className="ops-scope" role="status">
            {filtered.length} {t("articles", "articles")}
          </p>
          <div className="help-article-list">
            {filtered.map((a) => (
              <button key={a.id} onClick={() => openArticle(a.id)}>
                <ClipboardList size={18} aria-hidden="true" />
                <span>
                  <strong>{a.title[i]}</strong>
                  <small>{a.summary[i]}</small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="ops-empty">
              <h3>{t("No articles found", "Aucun article trouvé")}</h3>
              <p>
                {t(
                  "Try a shorter search or another category.",
                  "Essayez une recherche plus courte ou une autre catégorie.",
                )}
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setQ("");
                  setCategory("all");
                }}
              >
                {t("Clear filters", "Effacer les filtres")}
              </Button>
            </div>
          )}
        </section>
        <HelpGuide fr={fr} openArticle={openArticle} />
        <section className="help-support">
          <div>
            <h2>{t("Still need a hand?", "Encore besoin d’aide ?")}</h2>
            <p>
              {t(
                "Prepare the details of your question in one place.",
                "Rassemblez les détails de votre question au même endroit.",
              )}
            </p>
          </div>
          <Button
            onClick={() => {
              setSupport(true);
              setNotice("");
            }}
          >
            {t("Prepare a support request", "Préparer une demande")}
          </Button>
        </section>
      </div>
      <Dialog
        open={!!current}
        onOpenChange={(v) => {
          if (!v) {
            setArticle("");
            const u = new URL(location.href);
            u.searchParams.delete("article");
            u.hash = "";
            history.replaceState(null, "", u);
          }
        }}
      >
        <DialogContent
          {...dialogFocus}
          className="help-article-dialog"
          closeLabel={t("Close article", "Fermer l’article")}
          aria-describedby="help-article-summary"
        >
          <DialogTitle>{current?.title[i]}</DialogTitle>
          <p id="help-article-summary">{current?.summary[i]}</p>
          <ol>
            {current?.steps.map((step, n) => (
              <li key={n}>
                <span>{n + 1}</span>
                <p>{step[i]}</p>
              </li>
            ))}
          </ol>
          {current?.link && (
            <Button asChild>
              <a href={href(current.link)}>{current.linkLabel?.[i]}</a>
            </Button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={support} onOpenChange={setSupport}>
        <DialogContent
          {...dialogFocus}
          closeLabel={t("Close", "Fermer")}
          aria-describedby="help-support-note"
        >
          <DialogTitle>
            {t("Prepare a support request", "Préparer une demande d’aide")}
          </DialogTitle>
          <p id="help-support-note" className="ops-scope">
            {t(
              "Support delivery is not connected in this preview. Download your request to keep it; nothing is sent. Do not include passwords or bank details.",
              "L’envoi au support n’est pas connecté dans cet aperçu. Téléchargez votre demande pour la conserver; rien n’est envoyé. N’incluez ni mot de passe ni coordonnées bancaires.",
            )}
          </p>
          <label className="growth-field">
            {t("What happened?", "Que s’est-il passé ?")}
            <Textarea
              value={question}
              maxLength={3000}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t(
                "Page, steps, and what you expected…",
                "Page, étapes et résultat attendu…",
              )}
            />
          </label>
          <Button
            disabled={!question.trim()}
            onClick={() => {
              const u = URL.createObjectURL(
                  new Blob([question], { type: "text/plain;charset=utf-8" }),
                ),
                a = document.createElement("a");
              a.href = u;
              a.download = "troc-support-draft.txt";
              a.click();
              setTimeout(() => URL.revokeObjectURL(u), 1000);
              setNotice(
                t(
                  "Draft downloaded. It has not been sent.",
                  "Brouillon téléchargé. Il n’a pas été envoyé.",
                ),
              );
            }}
          >
            {t("Download request draft", "Télécharger le brouillon")}
          </Button>
          <p role="status">{notice}</p>
        </DialogContent>
      </Dialog>
    </OperationsPage>
  );
}
