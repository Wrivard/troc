import { useState, useRef } from "react";
import { Button } from "@workspace/troc-design-system/components/ui/button";
import { Input } from "@workspace/troc-design-system/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@workspace/troc-design-system/components/ui/dialog";
import { Package } from "@workspace/troc-design-system/components/ui/seller-icons";
export type InventoryRow = {
  id: string;
  image_url?:string|null;
  name_en: string;
  name_fr: string;
  language?: string | null;
  finish?: string | null;
  collector_number?: string | null;
  condition: string;
  quantity: number;
  unit_price_cents: number;
  sale_cents?: number | null;
  inventory_version: number;
  status: string;
  source_platform: string;
  sync_status: string;
  sync_error: string | null;
  seller_sku: string;
  storage_location?: string | null;
};
export function InventoryTable({
  items,
  selected,
  onSelection,
  onSave,
  busy,
  labels,
  locale,
}: {
  items: InventoryRow[];
  selected: string[];
  onSelection: (v: string[]) => void;
  onSave: (changes: unknown[]) => Promise<boolean>;
  busy: boolean;
  labels: Record<string, string>;
  locale: "en" | "fr";
}) {
  const fr = locale === "fr",
    t = (a: string, b: string) => (fr ? b : a);
  const returnFocus=useRef<HTMLButtonElement|null>(null);
  const [edit, setEdit] = useState<InventoryRow | null>(null),
    [failed, setFailed] = useState(false);
  return (
    <>
      <div
        className="inventory-table-scroll"
        tabIndex={0}
        aria-label={t("Inventory table", "Tableau d’inventaire")}
      >
        <table className="inventory-table">
          <caption className="sr-only">
            {t("Listings on this page", "Annonces de cette page")}
          </caption>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label={t("Select this page", "Sélectionner cette page")}
                  disabled={busy || !items.length}
                  checked={
                    !!items.length &&
                    items.every((i) => selected.includes(i.id))
                  }
                  onChange={(e) =>
                    onSelection(e.target.checked ? items.map((i) => i.id) : [])
                  }
                />
              </th>
              {[
                t("Card / SKU", "Carte / SKU"),
                t("Printing", "Impression"),
                t("Condition", "État"),
                t("Quantity", "Quantité"),
                t("Price (CAD)", "Prix (CAD)"),
                t("Status / source", "Statut / source"),
                t("Actions", "Actions"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    disabled={busy}
                    aria-label={t("Select ", "Sélectionner ") + item.seller_sku}
                    checked={selected.includes(item.id)}
                    onChange={(e) =>
                      onSelection(
                        e.target.checked
                          ? [...selected, item.id]
                          : selected.filter((id) => id !== item.id),
                      )
                    }
                  />
                </td>
                <td>
                  <div className="inventory-product">
                    <span className="inventory-art" aria-hidden="true">
                      {item.image_url?<img className="seller-card-image" src={item.image_url} alt="" loading="lazy"/>:<Package size={21}/>}
                    </span>
                    <div>
                      <strong>{fr ? item.name_fr : item.name_en}</strong>
                      <small>{item.seller_sku || "—"}</small>
                      {item.storage_location && <small>{t("Location: ", "Emplacement : ")}{item.storage_location}</small>}
                    </div>
                  </div>
                </td>
                <td>
                  {item.collector_number ? "#" + item.collector_number : "—"}
                  <small>
                    {item.language?.toUpperCase()} · {item.finish}
                  </small>
                </td>
                <td>{item.condition}</td>
                <td>
                  <strong>{item.quantity}</strong>
                  {item.quantity > 0 && item.quantity <= 3 && (
                    <small className="inventory-low">
                      {t("Low stock", "Stock faible")}
                    </small>
                  )}
                </td>
                <td>
                  {item.sale_cents != null && <strong>{t("Sale: ", "Solde : ")}{new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {style:"currency",currency:"CAD"}).format(item.sale_cents/100)}</strong>}
                  {item.sale_cents != null && <small>{t("Regular: ", "Régulier : ")}</small>}
                  {new Intl.NumberFormat(fr ? "fr-CA" : "en-CA", {
                    style: "currency",
                    currency: "CAD",
                  }).format(item.unit_price_cents / 100)}
                </td>
                <td>
                  <span
                    className={"inventory-state inventory-state-" + item.status}
                  >
                    {labels[item.status]}
                  </span>
                  <small>
                    {item.source_platform} · {labels[item.sync_status]}
                  </small>
                  {item.sync_error && (
                    <small>
                      {t("Sync needs review", "Synchronisation à vérifier")}
                    </small>
                  )}
                </td>
                <td>
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={(event) => {returnFocus.current=event.currentTarget;setFailed(false);
                      setEdit(item);
                    }}
                  >
                    {t("Edit", "Modifier")}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog
        open={!!edit}
        onOpenChange={(v) => {
          if (!v && !busy) setEdit(null);
        }}
      >
        <DialogContent onCloseAutoFocus={event=>{event.preventDefault();if(returnFocus.current?.isConnected)returnFocus.current.focus();else document.querySelector<HTMLElement>(".inventory-table-scroll")?.focus();}}
          closeLabel={t("Close", "Fermer")}
          onPointerDownOutside={(e) => {
            if (busy) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
        >
          <DialogTitle>{t("Edit listing", "Modifier l’annonce")}</DialogTitle>
          <DialogDescription>
            {edit?.[fr ? "name_fr" : "name_en"]} · {edit?.seller_sku}
          </DialogDescription>
          {edit && (
            <form
              className="inventory-edit-form"
              key={edit.id}
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const ok = await onSave([
                  {
                    id: edit.id,
                    version: edit.inventory_version,
                    storageLocation: f.get("storageLocation"),
                    quantity: Number(f.get("quantity")),
                    priceCents: Math.round(Number(f.get("price")) * 100),
                    saleCents: String(f.get("salePrice") ?? "").trim() ? Math.round(Number(f.get("salePrice")) * 100) : null,
                  },
                ]);
                if (ok) setEdit(null);
                else setFailed(true);
              }}
            >
              <label>
                {t("Storage location (optional)", "Emplacement de rangement (facultatif)")}
                <Input name="storageLocation" maxLength={100} defaultValue={edit.storage_location ?? ""} />
              </label>
              <label>
                {t("Quantity", "Quantité")}
                <Input
                  name="quantity"
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  defaultValue={edit.quantity}
                  required
                />
              </label>
              <label>
                {t("Price (CAD)", "Prix (CAD)")}
                <Input
                  name="price"
                  type="number"
                  min="0.01"
                  max="1000000"
                  step="0.01"
                  defaultValue={(edit.unit_price_cents / 100).toFixed(2)}
                  required
                />
              </label>
              <label>
                {t("Sale price (CAD, optional)", "Prix soldé (CAD, facultatif)")}
                <Input name="salePrice" type="number" min="0.01" max="1000000" step="0.01" defaultValue={edit.sale_cents == null ? "" : (edit.sale_cents/100).toFixed(2)} />
                <small>{t("Leave blank to remove the sale. Must not exceed the regular price. Basket discounts do not stack.", "Laissez vide pour retirer le rabais. Ne doit pas dépasser le prix régulier. Les rabais panier ne se cumulent pas.")}</small>
              </label>
              {failed && (
                <p role="alert">
                  {t(
                    "Not saved. Close and refresh to check current stock before trying again. Your entries are still here.",
                    "Non enregistré. Fermez et actualisez pour vérifier le stock avant de réessayer. Vos saisies sont conservées.",
                  )}
                </p>
              )}
              <div className="seller-page-actions">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEdit(null)}
                >
                  {t("Cancel", "Annuler")}
                </Button>
                <Button disabled={busy} type="submit">
                  {busy
                    ? t("Saving…", "Enregistrement…")
                    : t("Save changes", "Enregistrer")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
