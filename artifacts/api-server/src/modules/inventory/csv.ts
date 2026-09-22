import { DomainError } from "../shared/domain";

export const fields = [
  "variant_id",
  "provider",
  "external_catalog_id",
  "name",
  "set",
  "number",
  "language",
  "finish",
  "condition",
  "price",
  "quantity",
  "seller_sku",
  "external_sku",
  "external_listing_id",
] as const;
export type Field = (typeof fields)[number];
export type Mapping = Partial<Record<Field, string>>;
export const maxRows = 20000;
export const maxBytes = 4 * 1024 * 1024;
export function parseCsv(text: string): string[][] {
  if (
    typeof text !== "string" ||
    Buffer.byteLength(text) > maxBytes ||
    text.includes("\0")
  )
    throw new DomainError("invalid_csv");
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false,
    closed = false;
  const pushCell = () => {
    if (cell.length > 500) throw new DomainError("csv_cell_too_long");
    row.push(cell.trim());
    cell = "";
    closed = false;
    if (row.length > 50) throw new DomainError("csv_too_many_columns");
  };
  const pushRow = () => {
    pushCell();
    if (row.some(Boolean)) rows.push(row);
    row = [];
    if (rows.length > maxRows + 1) throw new DomainError("csv_too_many_rows");
  };
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += c;
    } else if (c === ",") pushCell();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      pushRow();
    } else if (c === '"' && !cell && !closed) quoted = true;
    else {
      if (closed || c === '"') throw new DomainError("invalid_csv_quotes");
      cell += c;
    }
    if (cell.length > 500) throw new DomainError("csv_cell_too_long");
  }
  if (quoted) throw new DomainError("invalid_csv_quotes");
  if (cell || row.length || closed) pushRow();
  if (
    rows.length < 2 ||
    new Set(rows[0]).size !== rows[0].length ||
    rows[0].some((h) => !h)
  )
    throw new DomainError("invalid_csv_headers");
  return rows;
}
export function mappingFor(headers: string[], value: unknown = {}): Mapping {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new DomainError("invalid_mapping");
  const result: Mapping = {};
  for (const f of fields) {
    const custom = (value as Record<string, unknown>)[f];
    const detected = headers.find(
      (h) => h.toLowerCase().replace(/[ -]/g, "_") === f,
    );
    const h = custom ?? detected;
    if (h !== undefined && h !== "") {
      if (typeof h !== "string" || !headers.includes(h))
        throw new DomainError("invalid_mapping");
      result[f] = h;
    }
  }
  if (new Set(Object.values(result)).size !== Object.values(result).length)
    throw new DomainError("invalid_mapping");
  if (
    !result.price ||
    !result.quantity ||
    !result.condition ||
    !result.seller_sku ||
    (!result.variant_id &&
      !result.name &&
      !(result.provider && result.external_catalog_id))
  )
    throw new DomainError("mapping_required");
  return result;
}
export function csvRecords(
  rows: string[][],
  mapping: Mapping,
): Record<Field, string>[] {
  const [headers, ...data] = rows;
  return data.map((row) => {
    const r = Object.fromEntries(
      fields.map((f) => [
        f,
        mapping[f] ? (row[headers.indexOf(mapping[f]!)] ?? "") : "",
      ]),
    ) as Record<Field, string>;
    if (row.length !== headers.length) r.price = "invalid row width";
    return r;
  });
}
export function cents(value: string) {
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value))
    throw new DomainError("invalid_price");
  const [whole, fraction = ""] = value.split(".");
  const n = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (n < 1 || n > 100000000) throw new DomainError("invalid_price");
  return n;
}
