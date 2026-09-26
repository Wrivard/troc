import "./seller-loading.css";
export function SellerLoading({
  view = "orders",
  locale = "en",
  heading = false,
  rowsOnly = false,
}: {
  view?: string;
  locale?: "en" | "fr";
  heading?: boolean;
  rowsOnly?: boolean;
}) {
  const form = ["settings", "storefront", "team"].includes(view);
  const messages = view === "messages";
  return (
    <section
      className={"seller-loading seller-loading--" + view}
      role="status"
      aria-label={
        locale === "fr"
          ? "Chargement de votre espace vendeur…"
          : "Loading your seller workspace…"
      }
    >
      <span className="sr-only">
        {locale === "fr"
          ? "Chargement de votre espace vendeur…"
          : "Loading your seller workspace…"}
      </span>
      <div aria-hidden="true">
        {heading && (
          <div className="seller-loading-heading">
            <i />
            <i />
          </div>
        )}
        {!rowsOnly && !form && !messages && (
          <div className="seller-loading-metrics">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i}>
                <i />
                <i />
              </div>
            ))}
          </div>
        )}
        {!rowsOnly && view !== "dashboard" && (
          <div className="seller-loading-toolbar">
            <i />
            <i />
            <i />
          </div>
        )}
        {view === "dashboard" && <div className="seller-loading-panels">{[0,1,2,3].map(n => <div key={n}><i/><i/><i/></div>)}</div>}
        <div
          className={
            "seller-loading-body" +
            (messages ? " seller-loading-conversation" : "")
          }
        >
          <div>
            {Array.from({ length: form ? 4 : 5 }, (_, i) => (
              <div className="seller-loading-row" key={i}>
                {!form && <i className="seller-loading-art" />}
                <div>
                  <i />
                  <i />
                </div>
                {!form && <i className="seller-loading-value" />}
              </div>
            ))}
          </div>
          {messages && (
            <div className="seller-loading-thread">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
