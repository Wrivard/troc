import { useEffect, useRef, useState } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { api } from "../../api";
import { useSellerCopy } from "../seller-platform/operations-ui";
export function InventoryExport({
  seller,
  filters,
}: {
  seller: string;
  filters: string;
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
        "/inventory/" + seller + "/export?" + filters,
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
          : t("Export filtered inventory", "Exporter l’inventaire filtré")}
      </Button>
      <p className="ops-scope">
        {t(
          "Current filters, all matching pages: up to 10,000 listings / 5 MB. Current stock and prices. Spreadsheet-safe text; not a backup.",
          "Filtres actuels, toutes les pages : 10 000 annonces / 5 Mo maximum. Stock et prix actuels. Texte protégé pour tableur; pas une sauvegarde.",
        )}
      </p>
      <p role="status">
        {state === "done"
          ? t("CSV prepared.", "CSV préparé.")
          : state === "export_too_large"
            ? t(
                "This export is too large. Narrow the filters; no partial file was created.",
                "Cet export est trop volumineux. Précisez les filtres; aucun fichier partiel n’a été créé.",
              )
            : state === "forbidden"
              ? t("Inventory access required.", "Accès inventaire requis.")
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
