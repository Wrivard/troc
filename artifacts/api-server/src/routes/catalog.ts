import { performance } from "node:perf_hooks";
import { filtersFrom } from "../modules/catalog/search";
import { cheapestOffer } from "../modules/catalog/cheapest";
import {requestRateLimit} from "../modules/security/rate-limit";
import {catalogRepository} from "../modules/catalog/repository";
import { Router } from "express";
import { publicPage } from "../modules/catalog/service";
import { DomainError } from "../modules/shared/domain";
const router = Router();
router.use("/catalog/suggest", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
router.get(
  "/catalog/suggest",
  requestRateLimit({namespace:"catalog-suggest",windowMs:60000,limit:120}),
  async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    try {
      if (
        typeof req.query.q !== "string" ||
        (req.query.lang !== undefined &&
          req.query.lang !== "en" &&
          req.query.lang !== "fr")
      )
        throw new DomainError("invalid_search");
      const repo = catalogRepository();
      if (!repo.suggest) throw new DomainError("service_unavailable", 503);
      res.json(
        await repo.suggest(req.query.q, req.query.lang === "fr" ? "fr" : "en"),
      );
    } catch (error) {
      res.status(error instanceof DomainError ? error.status : 503).json({
        code: error instanceof DomainError ? error.code : "service_unavailable",
      });
    }
  },
);

router.post("/catalog/cheapest", (_req, res, next) => {res.setHeader("Cache-Control","no-store");next();}, requestRateLimit({namespace:"catalog-cheapest",limit:120,windowMs:60000}), async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    res.json(await cheapestOffer(req.body));
  } catch (error) {
    res.status(error instanceof DomainError ? error.status : 503).json({
      code: error instanceof DomainError ? error.code : "service_unavailable",
    });
  }
});
router.get("/catalog/facets", requestRateLimit({namespace:"catalog-facets",windowMs:60000,limit:120}), async (req, res) => {
  try {
    const params = new URLSearchParams(req.originalUrl.split("?")[1]);
    const meta = await catalogRepository().metadata(filtersFrom(params));
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({games: meta.games, sets: meta.sets});
  } catch (error) {
    res.status(error instanceof DomainError ? error.status : 503).json({code:error instanceof DomainError ? error.code : "service_unavailable"});
  }
});
router.get("/catalog/page", async (req, res) => {
  try {
    const params = new URLSearchParams(req.originalUrl.split("?")[1]);
    const path = params.get("path") || "/";
    params.delete("path");
    const start = performance.now();
    const timings: string[] = [];
    const page = await publicPage(path, params, undefined, (stage, duration) => timings.push(`${stage};dur=${duration.toFixed(1)}`));
    res.setHeader("Server-Timing", [`catalog;dur=${(performance.now()-start).toFixed(1)}`, ...timings].join(", "));
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json(page);
  } catch (error) {
    res
      .status(error instanceof DomainError ? error.status : 503)
      .json({
        code: error instanceof DomainError ? error.code : "service_unavailable",
      });
  }
});
export default router;
