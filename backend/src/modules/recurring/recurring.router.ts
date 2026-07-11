import { Router } from "express";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { recurringController } from "./recurring.controller";

const router = Router();

router.use(authMiddleware);
router.get("/", recurringController.list);
router.post("/", recurringController.create);
// ⚠️ Specific routes MUST come before /:id to avoid route shadowing
router.post("/process", recurringController.process);
router.patch("/:id/toggle", recurringController.toggleActive);
router.patch("/:id", recurringController.update);
router.delete("/:id", recurringController.delete);

export default router;
