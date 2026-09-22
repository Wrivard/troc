export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response
    .json()
    .catch(() => ({ code: "service_unavailable" }));
  if (!response.ok) throw new Error(result.code || "service_unavailable");
  return result as T;
}
