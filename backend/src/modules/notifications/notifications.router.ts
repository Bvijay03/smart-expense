import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { validateParams } from "@/middlewares/validate.middleware";
import { notificationsController } from "./notifications.controller";
import { notificationIdSchema } from "./notifications.schema";

const router = Router();

router.use(authMiddleware);
router.get("/", notificationsController.list);
router.patch(
  "/read-all",
  notificationsController.markAllRead,
);
router.patch(
  "/:id/read",
  validateParams(notificationIdSchema),
  notificationsController.markRead,
);

export default router;
