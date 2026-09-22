import { Router } from "express";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { PublicPage } from "@workspace/catalog";
import { publicPage } from "../modules/catalog/service";
import { catalogRepository } from "../modules/catalog/repository";
import { DomainError } from "../modules/shared/domain";
const router = Router();
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function origin() {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const value =
    process.env.PUBLIC_SITE_URL ||
    process.env.APP_ORIGIN ||
    (host ? `https://${host}` : undefined);
  if (!value) throw new DomainError("site_url_required", 503);
  return new URL(value).origin;
}
router.get("/robots.txt", (_req, res) => {
  const demo =
    process.env.CATALOG_MODE === "demo" ||
    process.env.NODE_ENV !== "production";
  res
    .type("text")
    .send(
      demo
        ? "User-agent: *\nDisallow: /\n"
        : `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /account\nDisallow: /search\nSitemap: ${origin()}/sitemap.xml\n`,
    );
});
router.get("/sitemap.xml", async (_req, res) => {
  try {
    const repo = catalogRepository();
    const cursors = repo.demo ? [] : await repo.sitemapCursors();
    const root = origin();
    res
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${cursors.map((cursor) => `<sitemap><loc>${escape(root + "/sitemap-pages.xml?cursor=" + encodeURIComponent(cursor))}</loc></sitemap>`).join("")}</sitemapindex>`,
      );
  } catch (error) {
    res.status(error instanceof DomainError ? error.status : 503).end();
  }
});
router.get("/sitemap-pages.xml", async (req, res) => {
  try {
    const repo = catalogRepository();
    if (repo.demo) {
      res
        .type("application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>',
        );
      return;
    }
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : "";
    if (cursor && !/^(game|set|product|store):[0-9a-f-]{36}$/.test(cursor))
      throw new DomainError("invalid_cursor");
    const products = await repo.sitemap(cursor);
    const root = origin();
    const paths = products.map((p) => p.path);
    if (!cursor) paths.unshift("/");
    res
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${paths.flatMap((path) => ["en", "fr"].map((lang) => `<url><loc>${escape(root + path + "?lang=" + lang)}</loc>${["en", "fr"].map((l) => `<xhtml:link rel="alternate" hreflang="${l}-CA" href="${escape(root + path + "?lang=" + l)}"/>`).join("")}</url>`)).join("")}</urlset>`,
      );
  } catch (error) {
    res.status(error instanceof DomainError ? error.status : 503).end();
  }
});
let templatePromise: Promise<string> | undefined;
let manifestPromise: Promise<Record<string, { file: string }>> | undefined;
let rendererPromise:
  | Promise<{ render: (page: PublicPage, theme: "dark" | "light") => string }>
  | undefined;
router.get(
  /^\/(?:search|games\/[^/]+|sets\/[^/]+|product\/[^/]+|store\/[^/]+)?$/,
  async (req, res) => {
    try {
      const params = new URLSearchParams(req.originalUrl.split("?")[1]);
      if (!params.has("lang") && req.cookies?.troc_locale === "fr")
        params.set("lang", "fr");
      const page = await publicPage(req.path, params);
      const theme = req.cookies?.troc_theme === "light" ? "light" : "dark";
      const root = origin();
      const canonical = `${root}${page.path}?lang=${page.locale}`;
      templatePromise ??= readFile(
        resolve(process.cwd(), "artifacts/marketplace/dist/index.html"),
        "utf8",
      );
      const rendererPath = pathToFileURL(
        resolve(
          process.cwd(),
          "artifacts/marketplace/dist-server/entry-server.js",
        ),
      ).href;
      rendererPromise ??= import(/* @vite-ignore */ rendererPath);
      manifestPromise ??= readFile(
        resolve(
          process.cwd(),
          "artifacts/marketplace/dist/.vite/manifest.json",
        ),
        "utf8",
      ).then(JSON.parse);
      const [template, renderer, manifest] = await Promise.all([
        templatePromise,
        rendererPromise,
        manifestPromise,
      ]);
      const stylesheet = Object.values(manifest).find((entry) =>
        /^assets\/index-.*\.css$/.test(entry.file),
      )?.file;
      if (!stylesheet) throw new Error("Missing public stylesheet");
      const title =
        page.product?.name[page.locale] ??
        page.seller?.name ??
        page.sets.find((s) => s.slug === page.filters.set)?.name[page.locale] ??
        page.games.find((g) => g.slug === page.filters.game)?.name[
          page.locale
        ] ??
        (page.locale === "fr"
          ? "Cartes à collectionner au Canada"
          : "Trading cards in Canada");
      const description =
        page.locale === "fr"
          ? "Comparez les cartes et les vendeurs canadiens sur TROC. Prix en CAD."
          : "Compare trading cards and Canadian sellers on TROC. Prices in CAD.";
      const noindex =
        page.demo || page.kind === "search" || params.has("cursor");
      const meta = `<link rel="canonical" href="${escape(canonical)}"/>${["en", "fr"].map((lang) => `<link rel="alternate" hreflang="${lang}-CA" href="${escape(`${root}${page.path}?lang=${lang}`)}"/>`).join("")}<meta name="description" content="${escape(description)}"/><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow"}"/><meta property="og:title" content="${escape(title)} · TROC"/><meta property="og:url" content="${escape(canonical)}"/>`;
      const data = JSON.stringify(page)
        .replace(/</g, "\\u003c")
        .replace(/\u2028/g, "\\u2028")
        .replace(/\u2029/g, "\\u2029");
      const html = template
        .replace(
          /<html[^>]*>/,
          `<html lang="${page.locale}-CA" class="${theme}" data-theme="troc-${theme}">`,
        )
        .replace(
          "<title>TROC</title>",
          `<title>${escape(title)} · TROC</title>${meta}<link rel="stylesheet" href="/${stylesheet}"/>`,
        )
        .replace(
          '<div id="root"></div>',
          `<div id="root">${renderer.render(page, theme)}</div><script>window.__TROC_PAGE__=${data};</script>`,
        );
      res.setHeader("Cache-Control", "private, no-cache");
      res.type("html").send(html);
    } catch (error) {
      const status = error instanceof DomainError ? error.status : 503;
      res
        .status(status)
        .type("html")
        .send(
          `<html lang="en"><head><meta name="robots" content="noindex"/><title>TROC</title></head><body><h1>${status === 404 ? "Page not found / Page introuvable" : "Catalog unavailable / Catalogue indisponible"}</h1><a href="/">TROC</a></body></html>`,
        );
    }
  },
);
export default router;
