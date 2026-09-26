import { DomainError } from "../shared/domain";
export const fold = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
export function suggestionQuery(raw: string) {
  if (
    raw.length > 100 ||
    Array.from(raw).some((char) => char.charCodeAt(0) < 32)
  )
    throw new DomainError("invalid_search");
  const query = raw.trim();
  const words = query
    ? fold(query)
        .split(" ")
        .map((word) => word.replace(/^#/, ""))
        .filter(Boolean)
    : [];
  if (words.length > 10) throw new DomainError("invalid_search");
  const terms = words.map((text) => {
    let fuzzy: string | null = null;
    // One edit only for bounded alphabetic words. Collector punctuation/digits never receive fuzzy matching.
    if (/^[a-z]{4,32}$/.test(text)) {
      const alternatives = new Set<string>();
      for (let i = 0; i <= text.length; i++) {
        alternatives.add(text.slice(0, i) + "[a-z]" + text.slice(i));
        if (i < text.length) {
          alternatives.add(text.slice(0, i) + text.slice(i + 1));
          alternatives.add(text.slice(0, i) + "[a-z]" + text.slice(i + 1));
        }
      }
      fuzzy = "(^|[^a-z])(" + [...alternatives].join("|") + ")([^a-z]|$)";
    }
    return { text, fuzzy };
  });
  return { query, text: words.join(" "), terms };
}
export type SuggestionQuery = ReturnType<typeof suggestionQuery>;
export function suggestionRank(
  names: string[],
  number: string,
  query: SuggestionQuery,
): number | null {
  if (!query.terms.length) return null;
  names = names.map(fold);
  number = fold(number);
  const hay = [...names, number].join(" ");
  if (
    !query.terms.every(
      (term) =>
        hay.includes(term.text) ||
        (term.fuzzy && new RegExp(term.fuzzy).test(hay)),
    )
  )
    return null;
  if (number && query.terms.some((term) => term.text === number)) return 0;
  if (names.includes(query.text)) return 1;
  if (
    names.some((name) => name.startsWith(query.text)) ||
    (number && number.startsWith(query.text))
  )
    return 2;
  return query.terms.every((term) => hay.includes(term.text)) ? 3 : 4;
}
export const foldSql = (value: string) =>
  "trim(regexp_replace(regexp_replace(lower(normalize(" +
  value +
  ", NFD)), '[\u0300-\u036f]', '', 'g'), '[[:space:]]+', ' ', 'g'))";
