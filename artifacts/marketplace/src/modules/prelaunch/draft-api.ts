export async function onboardingRequest(
  path: string,
  method = "GET",
  body?: unknown,
) {
  const r = await fetch(import.meta.env.BASE_URL + "api/" + path, {
    method,
    credentials: "same-origin",
    signal: AbortSignal.timeout(12000),
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await r.json().catch(() => ({ code: "service_unavailable" }));
  if (!r.ok) throw new Error(result.code || "service_unavailable");
  return result;
}
