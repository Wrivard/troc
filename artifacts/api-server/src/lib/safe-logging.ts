const surfaces = [
  "prelaunch",
  "inventory",
  "seller",
  "admin",
  "account",
  "auth",
  "commerce",
  "catalog",
  "healthz",
];
export function requestSummary(req: { method?: string; url?: string }) {
  const segment = req.url?.split("?")[0].split("/")[2];
  return {
    method: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ].includes(req.method ?? "")
      ? req.method
      : "OTHER",
    surface:
      req.url?.startsWith("/api/") && surfaces.includes(segment ?? "")
        ? segment
        : "public_or_unknown",
  };
}
export function errorSummary(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;
  return {
    type: "request_error",
    category:
      typeof code === "string" &&
      [
        "ECONNREFUSED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "57014",
        "42501",
        "28P01",
      ].includes(code)
        ? code
        : "unclassified",
  };
}
