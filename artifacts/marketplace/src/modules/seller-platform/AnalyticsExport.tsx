import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { api } from "../../api";
import { useSellerCopy } from "./operations-ui";
export function AnalyticsExport({
  seller,
  period,
  dataset,
  asOf,
}: {
  seller: string;
  period: string;
  dataset: string;
  asOf: string;
}) {
  const { t } = useSellerCopy(),
    active = useRef(true),
    busy = useRef(false);
  const [state, setState] = useState("idle");
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function download() {
    if (busy.current) return;
    busy.current = true;
    setState("loading");
    try {
      const result = await api<{ csv: string; filename: string; rows: number }>(
        "/seller/platform/" +
          seller +
          "/analytics-export?" +
          new URLSearchParams({ period, dataset, asOf }),
      );
      if (!active.current) return;
      const url = URL.createObjectURL(
        new Blob([result.csv], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setState("done");
    } catch (error) {
      if (active.current)
        setState(error instanceof Error ? error.message : "error");
    } finally {
      busy.current = false;
    }
  }
  return (
    <div className="ops-source-export">
      <Button
        variant="secondary"
        disabled={state === "loading"}
        onClick={download}
      >
        {state === "loading"
          ? t("Preparing CSV…", "Préparation du CSV…")
          : t("Export source orders", "Exporter les commandes sources")}
      </Button>
      <p className="ops-scope">
        {t(
          "Up to 10,000 orders / 5 MB. Values reflect the time of export.",
          "Maximum de 10 000 commandes / 5 Mo. Valeurs au moment de l’export.",
        )}
      </p>
      <p role="status">
        {state === "done"
          ? t("CSV prepared.", "CSV préparé.")
          : state === "export_too_large"
            ? t(
                "This export is too large. Select a shorter period; no partial file was created.",
                "Cet export est trop volumineux. Choisissez une période plus courte; aucun fichier partiel n’a été créé.",
              )
            : state === "forbidden"
              ? t(
                  "Store management access required.",
                  "Accès de gestion requis.",
                )
              : !["idle", "loading"].includes(state)
                ? t(
                    "Export failed. Try again.",
                    "L’export a échoué. Réessayez.",
                  )
                : ""}
      </p>
    </div>
  );
}
