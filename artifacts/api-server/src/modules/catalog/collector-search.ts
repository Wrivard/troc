import totals from "./printed-set-totals.json";
// Search metadata only: canonical card/printing identities are never rewritten.
export const collectorPart = (value: string) => value.toLowerCase().replace(/^0+(?=\d)/, "");
export function collectorQuery(raw: string) {
  const match = /^#?([a-z]*\d+[a-z]*)(?:\s*\/\s*([a-z]*\d+[a-z]*))?$/i.exec(raw.trim());
  return match ? {number: collectorPart(match[1]), total: match[2] ? collectorPart(match[2]) : null} : null;
}
export function collectorMatches(number: string, setId: string, raw: string) {
  const query = collectorQuery(raw);
  if (!query) return false;
  const [part, denominator] = number.split("/");
  const known = (totals as Record<string, {total: number}>)[setId]?.total;
  return collectorPart(part) === query.number && (query.total === null || collectorPart(denominator ?? String(known ?? "")) === query.total);
}
/** Expressions are internal constants; user values always remain SQL parameters. */
export function collectorSql(number: string, setId: string, raw: string) {
  const normalize = (value: string) => "regexp_replace(lower(" + value + "), '^0+([0-9])', '\\1')";
  const dictionary = JSON.stringify(Object.fromEntries(Object.entries(totals).map(([id, entry]) => [id, String(entry.total)])));
  const printed = "COALESCE(NULLIF(split_part(" + number + ", '/', 2), ''), '" + dictionary + "'::jsonb->>" + setId + "::text, '')";
  return normalize("split_part(" + number + ", '/', 1)") + "=" + normalize("split_part(regexp_replace(" + raw + ", '[#[:space:]]', '', 'g'), '/', 1)") + " AND (strpos(" + raw + ", '/')=0 OR " + normalize(printed) + "=" + normalize("split_part(regexp_replace(" + raw + ", '[#[:space:]]', '', 'g'), '/', 2)") + ")";
}
