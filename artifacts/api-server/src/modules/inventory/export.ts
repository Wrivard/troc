import { DomainError } from "../shared/domain";
export const inventoryExportRows = 10000;
export const inventoryExportBytes = 5 * 1024 * 1024;
// Spreadsheet-safe text is deliberately not a lossless database backup.
const cell = (value: unknown) =>
  '"' +
  String(value ?? "")
    .replace(/^(?:\s*[=+@-]|[\t\r])/, "'$&")
    .replaceAll('"', '""') +
  '"';
export function inventoryCsv(rows: Record<string, unknown>[]) {
  if (rows.length > inventoryExportRows)
    throw new DomainError("export_too_large", 422);
  const lines = [
    "listing_id,variant_id,condition,price,quantity,seller_sku,storage_location,source_platform,external_sku,external_listing_id,status,language,finish,number,name_en,name_fr,sale_price",
  ];
  let bytes = 3 + Buffer.byteLength(lines[0]);
  for (const row of rows) {
    const raw = String(row.unit_price_cents);
    if (!/^\d+$/.test(raw)) throw new DomainError("invalid_export_price", 500);
    const price = BigInt(raw);
    const cad =
      (price / 100n).toString() +
      "." +
      (price % 100n).toString().padStart(2, "0");
    const line = [
      row.id,
      row.variant_id,
      row.condition,
      cad,
      row.quantity,
      row.seller_sku,
      row.storage_location,
      row.source_platform,
      row.external_sku,
      row.external_listing_id,
      row.status,
      row.language,
      row.finish,
      row.collector_number,
      row.name_en,
      row.name_fr,
      row.sale_cents == null ? "" : (BigInt(String(row.sale_cents))/100n).toString()+"."+(BigInt(String(row.sale_cents))%100n).toString().padStart(2,"0"),
    ]
      .map(cell)
      .join(",");
    bytes += 2 + Buffer.byteLength(line);
    if (bytes > inventoryExportBytes)
      throw new DomainError("export_too_large", 422);
    lines.push(line);
  }
  return {
    csv: "\uFEFF" + lines.join("\r\n"),
    filename: "troc-inventory.csv",
    rows: rows.length,
  };
}
