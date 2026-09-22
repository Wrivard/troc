import { Router } from "express";
import { publicPage } from "../modules/catalog/service";
import { DomainError } from "../modules/shared/domain";
const router = Router();
router.get("/catalog/page", async (req, res) => {
  try {
    const params = new URLSearchParams(req.originalUrl.split("?")[1]);
    const path = params.get("path") || "/";
    params.delete("path");
    const page = await publicPage(path, params);
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
