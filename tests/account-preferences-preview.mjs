/** Local visual fixture only. Never contacts authentication or application APIs. */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const dist = resolve("artifacts/marketplace/dist");
let saves = 0;
const server = createServer(async (request, response) => {
  const path = new URL(request.url, "http://127.0.0.1").pathname;
  const json = (status, data) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(data));
  };
  if (path === "/api/account" && request.method === "GET") {
    return json(200, {
      id: "00000000-0000-4000-8000-000000000001",
      email: "design-fixture@example.test",
      locale: "en",
      theme: "dark",
    });
  }
  if (path === "/api/account/preferences" && request.method === "PATCH") {
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 1024) return json(413, { code: "invalid_input" });
    }
    let values;
    try {
      values = JSON.parse(body);
    } catch {
      return json(400, { code: "invalid_input" });
    }
    if (
      !["en", "fr"].includes(values.locale) ||
      !["light", "dark"].includes(values.theme)
    )
      return json(400, { code: "invalid_input" });
    saves++;
    console.log(
      JSON.stringify({
        fixture: true,
        save: saves,
        locale: values.locale,
        theme: values.theme,
        status: saves === 1 ? 503 : 200,
      }),
    );
    return saves === 1
      ? json(503, { code: "service_unavailable" })
      : json(200, { ok: true });
  }
  if (path.startsWith("/api/"))
    return json(503, { code: "service_unavailable" });
  if (request.method !== "GET" && request.method !== "HEAD")
    return json(405, { code: "method_not_allowed" });
  const asset = /^\/assets\/[a-zA-Z0-9._-]+$/.test(path);
  const file = asset ? resolve(dist, `.${path}`) : resolve(dist, "index.html");
  const types = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
  };
  try {
    const bytes = await readFile(file);
    response.writeHead(200, {
      "Content-Type": asset
        ? types[extname(file)] || "application/octet-stream"
        : "text/html",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : bytes);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
server.listen(0, "127.0.0.1", () =>
  console.log(
    `Synthetic account preview: http://127.0.0.1:${server.address().port}/account`,
  ),
);
