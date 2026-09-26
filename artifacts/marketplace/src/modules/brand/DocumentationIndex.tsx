import { useState } from "react";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { helpArticles, helpCategories } from "../seller-platform/help-content";
import "./documentation-index.css";
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
export function DocumentationIndex({ locale }: { locale: "en" | "fr" }) {
  const i = locale === "fr" ? 1 : 0,
    t = (en: string, fr: string) => (i ? fr : en);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all");
  const filtered = helpArticles.filter(
    (a) =>
      (category === "all" || a.category === category) &&
      normalize(
        [a.title[i], a.summary[i], ...a.steps.map((s) => s[i])].join(" "),
      ).includes(normalize(query.trim())),
  );
  return (
    <div className="documentation-index">
      <section
        className="documentation-start"
        aria-label={t("Start here", "Commencez ici")}
      >
        {[
          [
            "/smart-cart",
            t("Buying with Smart Cart", "Acheter avec Smart Cart"),
            t(
              "Compare the whole delivered order.",
              "Comparez le coût total livré.",
            ),
          ],
          [
            "/sell",
            t("Selling on TROC", "Vendre sur TROC"),
            t(
              "Inventory, your store and seller access.",
              "Inventaire, boutique et accès vendeur.",
            ),
          ],
          [
            "/developers",
            t("Integrations & developers", "Intégrations et développeurs"),
            t(
              "Current tools and planned capabilities.",
              "Outils actuels et fonctions prévues.",
            ),
          ],
          [
            "/condition-guide",
            t("Card condition", "État des cartes"),
            t(
              "Describe and compare cards clearly.",
              "Décrivez et comparez les cartes.",
            ),
          ],
        ].map(([path, title, body]) => (
          <a key={path} href={path + "?lang=" + locale}>
            <h2>
              {title}
              <span aria-hidden="true"> ↗</span>
            </h2>
            <p>{body}</p>
          </a>
        ))}
      </section>
      <section aria-labelledby="documentation-guides">
        <h2 id="documentation-guides">
          {t("Find a practical guide", "Trouvez un guide pratique")}
        </h2>
        <label className="documentation-search">
          {t("Search documentation", "Rechercher dans la documentation")}
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Try imports, shipping or account…",
              "Essayez importations, livraison ou compte…",
            )}
          />
        </label>
        <div
          className="documentation-filters"
          role="group"
          aria-label={t("Guide category", "Catégorie de guide")}
        >
          <Button
            variant={category === "all" ? "primary" : "secondary"}
            aria-pressed={category === "all"}
            onClick={() => setCategory("all")}
          >
            {t("All guides", "Tous les guides")}
          </Button>
          {helpCategories.map(([id, en, fr]) => (
            <Button
              key={id}
              variant={category === id ? "primary" : "secondary"}
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {t(en, fr)}
            </Button>
          ))}
        </div>
        <p className="documentation-count" role="status">
          {filtered.length} {t("guides", "guides")}
        </p>
        <div className="documentation-results">
          {filtered.map((a) => (
            <a
              key={a.id}
              href={
                "/help?article=" + encodeURIComponent(a.id) + "&lang=" + locale
              }
            >
              <h3>
                {a.title[i]}
                <span aria-hidden="true"> →</span>
              </h3>
              <p>{a.summary[i]}</p>
            </a>
          ))}
        </div>
        {!filtered.length && (
          <div className="documentation-empty">
            <p>
              {t(
                "No matching guides. Try another term or category.",
                "Aucun guide correspondant. Essayez un autre terme ou une autre catégorie.",
              )}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
            >
              {t("Clear filters", "Effacer les filtres")}
            </Button>
          </div>
        )}
      </section>
      <aside className="documentation-scope">
        <h2>{t("Know what is available", "Comprendre la disponibilité")}</h2>
        <p>
          {t(
            "These guides describe the current development preview. Test accounts, simulated orders and sample payout figures are not live marketplace activity. Each guide distinguishes usable local tools from services that still need activation.",
            "Ces guides décrivent l’aperçu de développement actuel. Comptes de test, commandes simulées et exemples de versements ne sont pas de l’activité réelle. Chaque guide distingue les outils locaux des services qui attendent leur activation.",
          )}
        </p>
        <a href={"/roadmap?lang=" + locale}>
          {t("See the roadmap", "Voir la feuille de route")} →
        </a>
      </aside>
    </div>
  );
}
