import type { ReactNode } from "react";
import { messages } from "../../../messages";
import artwork from "./assets/bg-login.png";
import "./sign-in-layout.css";

export type SignInLayoutCopy = {
  heading?: string;
  support?: readonly [string, string];
  artHeading?: readonly [string, string];
  artDescription?: string;
};

/** Presentation only. The auth owner supplies the unchanged status and form. */
export function SignInLayout({
  locale,
  busy,
  children,
  copy,
}: {
  locale: "en" | "fr";
  busy: boolean;
  children: ReactNode;
  /** Already localized by the caller; omission retains the established sign-in copy. */
  copy?: SignInLayoutCopy;
}) {
  const c = (en: string, fr: string) => (locale === "fr" ? fr : en);
  return (
    <main id="main-content" className="troc-signin-layout" aria-busy={busy}>
      <section
        className="troc-signin-form-side"
        aria-labelledby="troc-signin-heading"
      >
        <div className="troc-signin-form-content">
          <header>
            <p className="troc-signin-eyebrow">TROC · CANADA</p>
            <h1 id="troc-signin-heading">
              {copy?.heading ?? messages.signIn[locale === "fr" ? 1 : 0]}
            </h1>
            <p className="troc-signin-support">
              {copy?.support?.[0] ??
                c(
                  "Keep your cards and orders together.",
                  "Retrouvez vos cartes et vos commandes.",
                )}
              <br />
              {copy?.support?.[1] ??
                c(
                  "One account for your hobby.",
                  "Un compte pour votre passion.",
                )}
            </p>
          </header>
          <div className="troc-signin-form-slot">{children}</div>
        </div>
        <p className="troc-signin-signature">
          {c("CARDS BRING PEOPLE TOGETHER.", "LES CARTES NOUS RASSEMBLENT.")}
        </p>
      </section>
      <aside
        className="troc-signin-art-side"
        aria-label={c("Your hobby on TROC", "Votre passion sur TROC")}
      >
        <img src={artwork} alt="" width={1254} height={1254} />
        <div className="troc-signin-art-copy">
          <h2>
            {copy?.artHeading?.[0] ?? c("Your hobby.", "Votre passion.")}
            <br />
            {copy?.artHeading?.[1] ?? c("One account.", "Un seul compte.")}
          </h2>
          <p>
            {copy?.artDescription ??
              c(
                "Your orders today. Your collection and favourite sellers in the tools to come.",
                "Vos commandes aujourd’hui. Votre collection et vos vendeurs favoris dans les outils à venir.",
              )}
          </p>
        </div>
      </aside>
    </main>
  );
}
