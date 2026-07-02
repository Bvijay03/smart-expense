import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validateQuery } from "@/middlewares/validate.middleware";
import { analyticsController } from "./analytics.controller";
import { analyticsQuerySchema } from "./analytics.schema";

const router = Router();

router.use(authMiddleware);
router.get(
  "/summary",
  validateQuery(analyticsQuerySchema),
  analyticsController.summary,
);
router.get(
  "/by-category",
  validateQuery(analyticsQuerySchema),
  analyticsController.byCategory,
);
router.get(
  "/trends",
  validateQuery(analyticsQuerySchema),
  analyticsController.trends,
);
router.get(
  "/export",
  validateQuery(analyticsQuerySchema),
  analyticsController.exportCsv,
);

export default router;
